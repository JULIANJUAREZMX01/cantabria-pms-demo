import { z } from 'zod';
import { HATS } from './hats.ts';
import { PRIORITY, REQUEST_TYPE, ROOM_STATUS } from './types.ts';

/**
 * Un solo registro de eventos: cada acción (limpieza lista, check-in, extra, falla)
 * se guarda una vez con quién, cuándo, con qué sombrero y en qué habitación.
 * Cada vista por rol es solo un filtro de este registro.
 */

const ActorSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('guest') }),
  z.object({ kind: z.literal('concierge') }),
  z.object({ kind: z.literal('staff'), personId: z.string().min(1), hat: z.enum(HATS) }),
]);
export type Actor = z.infer<typeof ActorSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const base = {
  id: z.string().min(1),
  at: z.string().min(1),
  property: z.string().min(1),
  actor: ActorSchema,
};

export const HotelEventSchema = z.discriminatedUnion('kind', [
  z.object({
    ...base,
    kind: z.literal('stay.reserve'),
    guestName: z.string().trim().min(1),
    checkIn: isoDate,
    checkOut: isoDate,
    rate: z.number().nonnegative(),
    phone: z.string().optional(),
    reference: z.string().min(1),
    lang: z.string().min(2),
  }),
  z.object({
    ...base,
    kind: z.literal('stay.checkIn'),
    /** Si viene, activa esa reserva en vez de crear una estancia nueva. */
    stayId: z.string().optional(),
    guestName: z.string().trim().min(1),
    room: z.string().min(1),
    checkIn: isoDate,
    checkOut: isoDate,
    rate: z.number().nonnegative(),
    notes: z.string().optional(),
  }),
  z.object({ ...base, kind: z.literal('stay.checkOut'), room: z.string().min(1) }),
  z.object({ ...base, kind: z.literal('room.setStatus'), room: z.string().min(1), status: z.enum(ROOM_STATUS) }),
  z.object({
    ...base,
    kind: z.literal('extra.add'),
    room: z.string().min(1),
    guestName: z.string().optional(),
    item: z.string().min(1),
    qty: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
  }),
  z.object({
    ...base,
    kind: z.literal('request.add'),
    room: z.string().optional(),
    guestName: z.string().optional(),
    type: z.enum(REQUEST_TYPE),
    details: z.string().trim().min(1),
    priority: z.enum(PRIORITY).optional(),
  }),
  z.object({ ...base, kind: z.literal('request.resolve'), requestId: z.string().min(1) }),
  z.object({ ...base, kind: z.literal('extra.deliver'), extraId: z.string().min(1) }),
]);

export type HotelEvent = z.infer<typeof HotelEventSchema>;
export type EventKind = HotelEvent['kind'];

/**
 * Qué eventos entiende hoy el backend Base44 (`cantabriaWrite`). El resto funciona en demo
 * y queda bloqueado en producción hasta ampliar el contrato (ADR-009).
 */
export const LEGACY_SUPPORTED: Record<EventKind, boolean> = {
  'stay.reserve': true,
  'stay.checkIn': true,
  'stay.checkOut': true,
  'room.setStatus': true,
  'extra.add': true,
  'request.add': true,
  'request.resolve': false,
  'extra.deliver': false,
};

export const newEventId = (): string => `evt_${crypto.randomUUID()}`;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type EventDraft = DistributiveOmit<HotelEvent, 'id' | 'at'>;
export type EventOf<K extends EventKind> = Extract<HotelEvent, { kind: K }>;

/** Crea un evento con id y marca de tiempo; el tipo de retorno sigue al `kind` del borrador. */
export function makeEvent<D extends EventDraft>(draft: D, now: Date = new Date()): EventOf<D['kind']> {
  return { ...draft, id: newEventId(), at: now.toISOString() } as unknown as EventOf<D['kind']>;
}

const REQUEST_TYPE_LEGACY = { amenidades: 'Toallas / Amenidades', mantenimiento: 'Mantenimiento', otro: 'Otro' } as const;

const actorTag = (e: HotelEvent): string =>
  e.actor.kind === 'staff' ? `${e.actor.personId}/${e.actor.hat}` : e.actor.kind;

/** Trazabilidad dentro de `notes`: el backend actual ignora campos desconocidos y conserva notes. */
const trace = (e: HotelEvent, notes?: string): string =>
  [notes?.trim(), `[${e.id} · ${actorTag(e)}]`].filter(Boolean).join(' · ');

/** Soporte real del evento concreto (algunos kinds dependen del valor, p. ej. bloquear habitación). */
export const isLegacySupported = (e: HotelEvent): boolean => toLegacyPayload(e) !== null;

export type LegacyPayload = Record<string, string | number | boolean>;

/**
 * Traduce un evento al contrato actual de `cantabriaWrite`.
 * Devuelve null si el contrato vigente no lo soporta (ver LEGACY_SUPPORTED).
 */
export function toLegacyPayload(e: HotelEvent): LegacyPayload | null {
  switch (e.kind) {
    case 'stay.reserve':
      return {
        action: 'checkIn',
        guest_name: e.guestName,
        property_name: e.property,
        room: 'Por asignar',
        check_in: e.checkIn,
        check_out: e.checkOut,
        rate: e.rate,
        payment_status: 'Pendiente',
        status: 'Reservada',
        notes: trace(e, `Reserva web huésped · Ref ${e.reference} · lang: ${e.lang}${e.phone ? ` · Tel: ${e.phone}` : ''}`),
      };
    case 'stay.checkIn':
      return {
        action: 'checkIn',
        guest_name: e.guestName,
        property_name: e.property,
        room: e.room,
        check_in: e.checkIn,
        check_out: e.checkOut,
        rate: e.rate,
        payment_status: 'Pendiente',
        status: 'Activa',
        ...(e.stayId ? { stay_id: e.stayId } : {}),
        notes: trace(e, e.notes),
      };
    case 'stay.checkOut':
      return { action: 'checkOut', room: e.room, property_name: e.property };
    case 'room.setStatus':
      // El backend actual solo conoce sucia / proceso / lista.
      if (e.status === 'bloqueada') return null;
      return {
        action: 'setRoomStatus',
        room_id: e.room,
        property_name: e.property,
        status: e.status,
        notes: trace(e),
      };
    case 'extra.add':
      return {
        action: 'addExtra',
        property_name: e.property,
        room: e.room,
        guest_name: e.guestName ?? '',
        item: e.item,
        qty: e.qty,
        unit_price: e.unitPrice,
        eco: true,
      };
    case 'request.add':
      return {
        action: 'addServiceRequest',
        property_name: e.property,
        room: e.room ?? '',
        guest_name: e.guestName ?? '',
        type: REQUEST_TYPE_LEGACY[e.type],
        details: trace(e, e.details),
      };
    case 'request.resolve':
    case 'extra.deliver':
      return null;
  }
}
