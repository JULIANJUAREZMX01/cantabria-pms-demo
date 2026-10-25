import type { Extra, ISODate, Priority, Room, ServiceRequest, Snapshot, Stay } from './types.ts';
import { addDays, coversNight, nightsBetween, overlaps, todayIn } from '@/lib/dates.ts';
import { HOTEL } from '@/lib/config.ts';

/** Selectores puros: de dónde sale cada número que se muestra. Sin DOM, sin red, sin reloj implícito. */

const LIVE = new Set<Stay['status']>(['reservada', 'activa']);
const PRIORITY_WEIGHT: Record<Priority, number> = { alta: 3, media: 2, baja: 1 };

export const naturalCompare = (a: string, b: string): number => a.localeCompare(b, 'es', { numeric: true });

const staysOf = (s: Snapshot, property: string): Stay[] => s.stays.filter((x) => x.property === property);
export const roomsOf = (s: Snapshot, property: string): Room[] =>
  s.rooms.filter((r) => r.property === property).sort((a, b) => naturalCompare(a.roomId, b.roomId));

export const todayHotel = (now: Date = new Date()): ISODate => todayIn(HOTEL.timeZone, now);

/** Estancias en casa esa noche: activas, con habitación y que cubren la fecha. */
export function inHouse(s: Snapshot, property: string, date: ISODate): Stay[] {
  return staysOf(s, property).filter((x) => x.status === 'activa' && x.room !== null && coversNight(x.checkIn, x.checkOut, date));
}

export interface Occupancy {
  occupied: number;
  total: number;
  pct: number;
  /** De dónde sale el denominador, para que nadie lo discuta. */
  totalSource: 'property.roomCount' | 'rooms.length';
}

/** Ocupación = habitaciones distintas con huésped esa noche / habitaciones del hotel. */
export function occupancy(s: Snapshot, property: string, date: ISODate): Occupancy {
  const prop = s.properties.find((p) => p.name === property);
  const rooms = roomsOf(s, property);
  const occupied = new Set(inHouse(s, property, date).map((x) => x.room)).size;
  const declared = prop?.roomCount ?? null;
  const total = declared ?? rooms.length;
  return {
    occupied,
    total,
    pct: total === 0 ? 0 : Math.round((occupied / total) * 100),
    totalSource: declared !== null ? 'property.roomCount' : 'rooms.length',
  };
}

export const arrivalsOn = (s: Snapshot, property: string, date: ISODate): Stay[] =>
  staysOf(s, property).filter((x) => x.checkIn === date && LIVE.has(x.status));

export const departuresOn = (s: Snapshot, property: string, date: ISODate): Stay[] =>
  staysOf(s, property).filter((x) => x.checkOut === date && x.status === 'activa');

/** Activas cuya salida ya pasó y nadie hizo check-out. */
export const overdueDepartures = (s: Snapshot, property: string, date: ISODate): Stay[] =>
  staysOf(s, property).filter((x) => x.status === 'activa' && x.checkOut < date);

/** Reservas sin habitación que todavía no terminan. */
export const unassignedReservations = (s: Snapshot, property: string, date: ISODate): Stay[] =>
  staysOf(s, property)
    .filter((x) => x.status === 'reservada' && x.room === null && x.checkOut > date)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

export interface CleaningItem {
  room: Room;
  reason: 'llegada' | 'salida' | 'pendiente';
  /** 3 = llega un huésped hoy a esa habitación; 2 = salió hoy; 1 = el resto. */
  urgency: 1 | 2 | 3;
}

export function cleaningQueue(s: Snapshot, property: string, date: ISODate): CleaningItem[] {
  const stays = staysOf(s, property);
  const items: CleaningItem[] = [];
  for (const room of roomsOf(s, property)) {
    if (room.status === 'lista' || room.status === 'bloqueada') continue;
    const arriving = stays.some((x) => x.room === room.roomId && LIVE.has(x.status) && x.checkIn === date);
    const departed = stays.some((x) => x.room === room.roomId && x.checkOut === date && (x.status === 'activa' || x.status === 'finalizada'));
    const reason: CleaningItem['reason'] = arriving ? 'llegada' : departed ? 'salida' : 'pendiente';
    items.push({ room, reason, urgency: arriving ? 3 : departed ? 2 : 1 });
  }
  return items.sort(
    (a, b) =>
      b.urgency - a.urgency ||
      PRIORITY_WEIGHT[b.room.priority] - PRIORITY_WEIGHT[a.room.priority] ||
      naturalCompare(a.room.roomId, b.room.roomId),
  );
}

/** Habitaciones libres para ese rango (sin traslape con reservas/activas y no bloqueadas). */
export function availableRooms(s: Snapshot, property: string, checkIn: ISODate, checkOut: ISODate, ignoreStayId?: string): Room[] {
  const stays = staysOf(s, property).filter((x) => LIVE.has(x.status) && x.room !== null && x.id !== ignoreStayId);
  return roomsOf(s, property).filter(
    (r) => r.status !== 'bloqueada' && !stays.some((x) => x.room === r.roomId && overlaps(x.checkIn, x.checkOut, checkIn, checkOut)),
  );
}

export interface Conflict {
  room: string;
  a: Stay;
  b: Stay;
}

/** Sobreventa: dos estancias vivas en la misma habitación con noches en común. */
export function conflicts(s: Snapshot, property: string): Conflict[] {
  const live = staysOf(s, property).filter((x) => LIVE.has(x.status) && x.room !== null);
  const out: Conflict[] = [];
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      if (a && b && a.room === b.room && a.room !== null && overlaps(a.checkIn, a.checkOut, b.checkIn, b.checkOut)) {
        out.push({ room: a.room, a, b });
      }
    }
  }
  return out;
}

export interface Revenue {
  /** Hospedaje de las estancias activas que duermen en el hotel esa noche. */
  lodgingTonight: number;
  /** Hospedaje reservado o activo con noches en los próximos 7 días (incluye hoy). */
  bookedNext7Days: number;
  /** Extras vendidos ese día (fecha local del hotel). */
  extrasToday: number;
}

/** Tres cifras con nombre, en vez de un solo "ingresos proyectados" ambiguo. */
export function revenue(s: Snapshot, property: string, date: ISODate): Revenue {
  const end = addDays(date, 7);
  const lodgingTonight = inHouse(s, property, date).reduce((sum, x) => sum + x.rate, 0);
  const bookedNext7Days = staysOf(s, property)
    .filter((x) => LIVE.has(x.status))
    .reduce((sum, x) => {
      const from = x.checkIn > date ? x.checkIn : date;
      const to = x.checkOut < end ? x.checkOut : end;
      return sum + x.rate * nightsBetween(from, to);
    }, 0);
  const extrasToday = s.extras
    .filter((x) => x.property === property && todayIn(HOTEL.timeZone, new Date(x.createdAt)) === date)
    .reduce((sum, x) => sum + x.total, 0);
  return { lodgingTonight, bookedNext7Days, extrasToday };
}

export const openRequests = (s: Snapshot, property: string): ServiceRequest[] =>
  s.requests
    .filter((x) => x.property === property && x.status !== 'resuelto')
    .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || a.createdAt.localeCompare(b.createdAt));

export const pendingExtras = (s: Snapshot, property: string): Extra[] =>
  s.extras.filter((x) => x.property === property && x.status === 'pendiente');

export interface Balance {
  stay: Stay;
  amount: number;
}

/** Saldo por cobrar de estancias en casa: noches × tarifa + extras, si el pago sigue pendiente. */
export function pendingBalances(s: Snapshot, property: string, date: ISODate): Balance[] {
  return inHouse(s, property, date)
    .filter((x) => x.payment === 'pendiente')
    .map((stay) => ({ stay, amount: stay.rate * nightsBetween(stay.checkIn, stay.checkOut) + stay.extrasTotal }));
}

export interface Attention {
  level: 'alta' | 'media';
  text: string;
}

/** Lo que el dueño debe decidir o resolver hoy. Una línea por asunto, sin ruido. */
export function ownerAttention(s: Snapshot, property: string, date: ISODate): Attention[] {
  const out: Attention[] = [];
  for (const c of conflicts(s, property)) {
    out.push({ level: 'alta', text: `Sobreventa en hab ${c.room}: ${c.a.guestName} y ${c.b.guestName} se traslapan.` });
  }
  for (const x of overdueDepartures(s, property, date)) {
    out.push({ level: 'alta', text: `${x.guestName} (hab ${x.room ?? '—'}) debió salir el ${x.checkOut}; falta check-out.` });
  }
  for (const x of unassignedReservations(s, property, date)) {
    if (x.checkIn <= addDays(date, 2)) out.push({ level: 'media', text: `Reserva de ${x.guestName} (${x.checkIn}) sin habitación asignada.` });
  }
  for (const r of openRequests(s, property)) {
    if (r.priority === 'alta') out.push({ level: 'alta', text: `Solicitud alta abierta en hab ${r.room || '—'}: ${r.details}` });
  }
  return out;
}
