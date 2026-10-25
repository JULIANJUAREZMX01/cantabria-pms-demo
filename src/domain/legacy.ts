import { z } from 'zod';
import type {
  DataIssue,
  Extra,
  ExtraStatus,
  PaymentStatus,
  Priority,
  Property,
  RequestStatus,
  RequestType,
  Room,
  RoomStatus,
  ServiceRequest,
  Snapshot,
  Stay,
  StayStatus,
} from './types.ts';
import { emptySnapshot } from './types.ts';
import { isISODate } from '@/lib/dates.ts';

/**
 * Capa anticorrupción: lo que publica Base44 (data.js) se valida y se normaliza aquí.
 * Un registro malo nunca tumba la app: se descarta o se corrige y queda registrado como DataIssue.
 */

const key = (v: string): string => v.trim().toLowerCase().replace(/\s+/g, '_');

const STAY_STATUS_MAP: Record<string, StayStatus> = {
  reservada: 'reservada',
  activa: 'activa',
  checked_in: 'activa',
  finalizada: 'finalizada',
  checked_out: 'finalizada',
  cancelada: 'cancelada',
  cancelled: 'cancelada',
};
const PAYMENT_MAP: Record<string, PaymentStatus> = {
  pendiente: 'pendiente',
  pending: 'pendiente',
  pagada: 'pagada',
  paid: 'pagada',
  charged_to_room: 'cargada_a_habitacion',
  cargada_a_habitacion: 'cargada_a_habitacion',
};
const ROOM_STATUS_MAP: Record<string, RoomStatus> = {
  sucia: 'sucia',
  proceso: 'proceso',
  lista: 'lista',
  bloqueada: 'bloqueada',
  mantenimiento: 'bloqueada',
};
const PRIORITY_MAP: Record<string, Priority> = { baja: 'baja', media: 'media', alta: 'alta' };
const REQUEST_STATUS_MAP: Record<string, RequestStatus> = {
  abierto: 'abierto',
  open: 'abierto',
  en_curso: 'en_curso',
  resuelto: 'resuelto',
  cerrado: 'resuelto',
};
const EXTRA_STATUS_MAP: Record<string, ExtraStatus> = {
  pendiente: 'pendiente',
  entregado: 'entregado',
  delivered: 'entregado',
};

const PLACEHOLDER_ROOM = /^(por asignar|sin asignar|tbd|)$/i;

const text = z
  .string()
  .nullish()
  .transform((v) => (v ?? '').trim());
const money = z.coerce.number().catch(0);

const RawProperty = z.object({
  id: z.string(),
  name: text,
  city: text,
  address: text,
  phone: text,
  room_count: z.coerce.number().int().nullish().catch(null),
  status: text,
});
const RawRoom = z.object({
  id: z.string(),
  room_id: text,
  property_name: text,
  room_type: text,
  status: text,
  priority: text,
  notes: text,
});
const RawStay = z.object({
  id: z.string(),
  property_name: text,
  guest_name: text,
  room: text,
  check_in: text,
  check_out: text,
  rate: money,
  extras_total: money,
  payment_status: text,
  status: text,
  notes: text,
  is_sample: z.boolean().nullish(),
});
const RawExtra = z.object({
  id: z.string(),
  property_name: text,
  room: text,
  guest_name: text,
  item: text,
  qty: z.coerce.number().catch(1),
  unit_price: money,
  total: money,
  status: text,
  created_date: text,
});
const RawRequest = z.object({
  id: z.string(),
  property_name: text,
  room: text,
  guest_name: text,
  type: text,
  details: text,
  status: text,
  created_date: text,
});

const RawSnapshot = z.object({
  synced_at: z.string().optional(),
  properties: z.array(z.unknown()).default([]),
  rooms: z.array(z.unknown()).default([]),
  stays: z.array(z.unknown()).default([]),
  extras: z.array(z.unknown()).default([]),
  serviceRequests: z.array(z.unknown()).default([]),
});

/** `data.js` publica `window.CANTABRIA_DATA = {...};` — extrae el JSON. */
export function extractDataJs(source: string): unknown {
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('data.js: no se encontró un objeto JSON');
  return JSON.parse(source.slice(start, end + 1));
}

function requestType(raw: string): RequestType {
  const k = key(raw);
  if (k.includes('toalla') || k.includes('amenidad')) return 'amenidades';
  if (k.includes('manten')) return 'mantenimiento';
  return 'otro';
}

export function parseSnapshot(input: unknown): { snapshot: Snapshot; issues: DataIssue[] } {
  const issues: DataIssue[] = [];
  const top = RawSnapshot.safeParse(input);
  if (!top.success) {
    issues.push({ entity: 'property', id: '-', code: 'bad-snapshot', message: 'El snapshot no es un objeto válido' });
    return { snapshot: emptySnapshot(), issues };
  }
  const raw = top.data;
  const snapshot = emptySnapshot(raw.synced_at ?? new Date(0).toISOString());

  const bad = (entity: DataIssue['entity'], i: number): void => {
    issues.push({ entity, id: `#${i}`, code: 'bad-record', message: `Registro ${entity} #${i} con forma inválida; descartado` });
  };

  raw.properties.forEach((r, i) => {
    const p = RawProperty.safeParse(r);
    if (!p.success) return bad('property', i);
    const v = p.data;
    const prop: Property = {
      id: v.id,
      name: v.name,
      city: v.city,
      address: v.address,
      phone: v.phone,
      roomCount: v.room_count ?? null,
      status: v.status,
    };
    snapshot.properties.push(prop);
  });

  raw.rooms.forEach((r, i) => {
    const p = RawRoom.safeParse(r);
    if (!p.success) return bad('room', i);
    const v = p.data;
    if (PLACEHOLDER_ROOM.test(v.room_id)) {
      issues.push({ entity: 'room', id: v.id, code: 'placeholder-room', message: `La tabla de habitaciones contiene una fila "${v.room_id || '(vacía)'}" que no es una habitación física` });
      return;
    }
    let status = ROOM_STATUS_MAP[key(v.status)];
    if (!status) {
      issues.push({ entity: 'room', id: v.id, code: 'unknown-enum', message: `Estado de habitación desconocido "${v.status}" en ${v.room_id}; se trata como sucia` });
      status = 'sucia';
    }
    const room: Room = {
      id: v.id,
      roomId: v.room_id,
      property: v.property_name,
      type: v.room_type || 'Habitación',
      status,
      priority: PRIORITY_MAP[key(v.priority)] ?? 'media',
      notes: v.notes,
    };
    snapshot.rooms.push(room);
  });

  raw.stays.forEach((r, i) => {
    const p = RawStay.safeParse(r);
    if (!p.success) return bad('stay', i);
    const v = p.data;
    if (!isISODate(v.check_in) || !isISODate(v.check_out) || v.check_out < v.check_in) {
      issues.push({ entity: 'stay', id: v.id, code: 'bad-dates', message: `Fechas inválidas en la estancia de ${v.guest_name || v.id}; descartada` });
      return;
    }
    const sk = key(v.status);
    let status = STAY_STATUS_MAP[sk];
    if (!status) {
      issues.push({ entity: 'stay', id: v.id, code: 'unknown-enum', message: `Estado de estancia desconocido "${v.status}"; se trata como reservada` });
      status = 'reservada';
    } else if (sk !== status) {
      issues.push({ entity: 'stay', id: v.id, code: 'legacy-enum', message: `Estado heredado "${v.status}" normalizado a "${status}"` });
    }
    const pk = key(v.payment_status);
    const payment = PAYMENT_MAP[pk] ?? 'pendiente';
    if (v.payment_status && !PAYMENT_MAP[pk]) {
      issues.push({ entity: 'stay', id: v.id, code: 'unknown-enum', message: `Estado de pago desconocido "${v.payment_status}"; se trata como pendiente` });
    } else if (v.payment_status && pk !== payment) {
      issues.push({ entity: 'stay', id: v.id, code: 'legacy-enum', message: `Pago heredado "${v.payment_status}" normalizado a "${payment}"` });
    }
    const stay: Stay = {
      id: v.id,
      property: v.property_name,
      guestName: v.guest_name,
      room: PLACEHOLDER_ROOM.test(v.room) ? null : v.room,
      checkIn: v.check_in,
      checkOut: v.check_out,
      rate: v.rate,
      extrasTotal: v.extras_total,
      payment,
      status,
      notes: v.notes,
      isSample: v.is_sample === true,
    };
    snapshot.stays.push(stay);
  });

  raw.extras.forEach((r, i) => {
    const p = RawExtra.safeParse(r);
    if (!p.success) return bad('extra', i);
    const v = p.data;
    const extra: Extra = {
      id: v.id,
      property: v.property_name,
      room: v.room,
      guestName: v.guest_name,
      item: v.item,
      qty: v.qty,
      unitPrice: v.unit_price,
      total: v.total || v.qty * v.unit_price,
      status: EXTRA_STATUS_MAP[key(v.status)] ?? 'pendiente',
      createdAt: v.created_date,
    };
    snapshot.extras.push(extra);
  });

  raw.serviceRequests.forEach((r, i) => {
    const p = RawRequest.safeParse(r);
    if (!p.success) return bad('request', i);
    const v = p.data;
    const req: ServiceRequest = {
      id: v.id,
      property: v.property_name,
      room: v.room,
      guestName: v.guest_name,
      type: requestType(v.type),
      details: v.details,
      status: REQUEST_STATUS_MAP[key(v.status)] ?? 'abierto',
      priority: 'media',
      createdAt: v.created_date,
    };
    snapshot.requests.push(req);
  });

  return { snapshot, issues };
}
