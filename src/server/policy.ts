import { EXTRAS_CATALOG, HOTEL } from '../lib/config.ts';
import { nightsBetween } from '../lib/dates.ts';
import { quote } from '../domain/pricing.ts';
import { HotelEventSchema, type EventKind, type HotelEvent } from '../domain/events.ts';
import { can, type Capability } from '../domain/hats.ts';
import type { SessionClaims } from './auth.ts';

/**
 * Quién puede mandar qué. Se evalúa SIEMPRE en el servidor: el cliente no es de fiar.
 * El huésped (sin sesión) solo puede reservar, pedir extras del catálogo y reportar; precios y tarifas los pone el servidor.
 */

export type Verdict = { ok: true; event: HotelEvent } | { ok: false; status: 400 | 401 | 403; message: string };

const CAPABILITY: Record<EventKind, Capability> = {
  'stay.reserve': 'stay.reserve',
  'stay.checkIn': 'stay.checkIn',
  'stay.checkOut': 'stay.checkOut',
  'room.setStatus': 'room.setStatus',
  'extra.add': 'extra.add',
  'extra.deliver': 'extra.deliver',
  'request.add': 'request.add',
  'request.resolve': 'request.resolve',
};

const GUEST_KINDS: ReadonlySet<EventKind> = new Set(['stay.reserve', 'extra.add', 'request.add']);
const bad = (status: 400 | 401 | 403, message: string): Verdict => ({ ok: false, status, message });

export function authorize(input: unknown, claims: SessionClaims | null): Verdict {
  const parsed = HotelEventSchema.safeParse(input);
  if (!parsed.success) return bad(400, 'Evento inválido');
  const e = parsed.data;
  if (e.property !== HOTEL.propertyName) return bad(400, 'Propiedad desconocida');

  if (e.actor.kind === 'staff') {
    if (!claims) return bad(401, 'Sesión requerida');
    if (e.actor.personId !== claims.sub) return bad(403, 'El actor no coincide con la sesión');
    if (!claims.hats.includes(e.actor.hat)) return bad(403, 'Sombrero no asignado a esta persona');
    if (!can(e.actor.hat, CAPABILITY[e.kind])) return bad(403, 'Ese sombrero no puede hacer esto');
    return { ok: true, event: e };
  }

  // Huésped / concierge: sin sesión, superficie mínima y valores fijados por el servidor.
  if (!GUEST_KINDS.has(e.kind)) return bad(401, 'Sesión requerida');
  switch (e.kind) {
    case 'stay.reserve': {
      const nights = nightsBetween(e.checkIn, e.checkOut);
      if (e.guestName.length > 80 || nights < 1 || nights > 30) return bad(400, 'Datos de reserva fuera de rango');
      return { ok: true, event: { ...e, actor: { kind: 'guest' }, rate: quote(e.checkIn, e.checkOut).avgRate } };
    }
    case 'extra.add': {
      const item = EXTRAS_CATALOG.find((x) => x.name === e.item);
      if (!item || e.qty > 5) return bad(400, 'Pedido fuera del catálogo');
      return { ok: true, event: { ...e, actor: { kind: 'guest' }, unitPrice: item.price } };
    }
    case 'request.add':
      if (e.details.length > 300) return bad(400, 'Texto demasiado largo');
      return { ok: true, event: { ...e, actor: { kind: 'guest' } } };
    default:
      return bad(401, 'Sesión requerida');
  }
}
