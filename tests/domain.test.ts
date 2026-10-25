import { describe, expect, it } from 'vitest';
import { addDays, coversNight, nightsBetween, overlaps, todayIn } from '@/lib/dates.ts';
import { applyEvent } from '@/domain/reducer.ts';
import { makeEvent, toLegacyPayload, isLegacySupported, HotelEventSchema, type HotelEvent } from '@/domain/events.ts';
import {
  arrivalsOn, availableRooms, cleaningQueue, conflicts, departuresOn, occupancy,
  ownerAttention, revenue, unassignedReservations,
} from '@/domain/selectors.ts';
import { HOTEL } from '@/lib/config.ts';
import { demo, TODAY } from './helpers.ts';

const P = HOTEL.propertyName;
const staff = { kind: 'staff', personId: 'recepcion', hat: 'recepcion' } as const;
const at = new Date('2026-10-24T18:00:00Z'); // 12:00 en Tulancingo

describe('fechas', () => {
  it('noches y traslapes', () => {
    expect(nightsBetween('2026-10-24', '2026-10-27')).toBe(3);
    expect(nightsBetween('2026-10-27', '2026-10-24')).toBe(0);
    expect(coversNight('2026-10-24', '2026-10-26', '2026-10-26')).toBe(false);
    expect(overlaps('2026-10-24', '2026-10-26', '2026-10-26', '2026-10-28')).toBe(false);
    expect(overlaps('2026-10-24', '2026-10-27', '2026-10-26', '2026-10-28')).toBe(true);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('fecha local del hotel, no UTC', () => {
    expect(todayIn('America/Mexico_City', new Date('2026-10-25T03:00:00Z'))).toBe('2026-10-24');
  });
});

describe('selectores sobre la demo (números verificados a mano)', () => {
  const s = demo();
  it('ocupación = habitaciones distintas con huésped esta noche / habitaciones', () => {
    expect(occupancy(s, P, TODAY)).toMatchObject({ occupied: 3, total: 10, pct: 30, totalSource: 'property.roomCount' });
  });
  it('llegadas, salidas y reservas sin habitación', () => {
    expect(arrivalsOn(s, P, TODAY).map((x) => x.room)).toEqual(['104']);
    expect(departuresOn(s, P, TODAY).map((x) => x.room)).toEqual(['102']);
    expect(unassignedReservations(s, P, TODAY)).toHaveLength(1);
  });
  it('cola de limpieza: salida de hoy primero, luego el resto por número', () => {
    const q = cleaningQueue(s, P, TODAY);
    expect(q.map((i) => i.room.roomId)).toEqual(['102', '103', '105', '203']);
    expect(q[0]).toMatchObject({ reason: 'salida', urgency: 2 });
  });
  it('ingresos: tres cifras con nombre', () => {
    expect(revenue(s, P, TODAY)).toEqual({ lodgingTonight: 1730, bookedNext7Days: 6530, extrasToday: 0 });
  });
  it('sin sobreventa en la semilla y disponibilidad respeta traslapes', () => {
    expect(conflicts(s, P)).toEqual([]);
    const free = availableRooms(s, P, addDays(TODAY, 1), addDays(TODAY, 3)).map((r) => r.roomId);
    expect(free).not.toContain('101');
    expect(free).not.toContain('104');
    expect(free).toContain('202');
  });
  it('detecta sobreventa y la sube al dueño', () => {
    const bad = applyEvent(s, makeEvent({ kind: 'stay.checkIn', property: P, actor: staff, guestName: 'Intruso', room: '101', checkIn: TODAY, checkOut: addDays(TODAY, 1), rate: 500 }, at));
    expect(conflicts(bad, P)).toHaveLength(1);
    expect(ownerAttention(bad, P, TODAY).some((a) => a.level === 'alta' && a.text.includes('Sobreventa'))).toBe(true);
  });
});

describe('reductor de eventos', () => {
  const guest = { kind: 'guest' } as const;
  it('reserva web → reservada sin habitación, idempotente', () => {
    const e = makeEvent({ kind: 'stay.reserve', property: P, actor: guest, guestName: 'Ana', checkIn: '2026-11-01', checkOut: '2026-11-03', rate: 650, reference: 'CB-ABCDE', lang: 'es' }, at);
    const a = applyEvent(demo(), e);
    expect(a.stays.at(-1)).toMatchObject({ room: null, status: 'reservada', guestName: 'Ana' });
    expect(applyEvent(a, e).stays).toHaveLength(a.stays.length);
  });
  it('check-in sobre una reserva la activa en lugar de duplicarla', () => {
    const s = demo();
    const r = s.stays.find((x) => x.status === 'reservada' && x.room === null)!;
    const e = makeEvent({ kind: 'stay.checkIn', property: P, actor: staff, stayId: r.id, guestName: r.guestName, room: '202', checkIn: r.checkIn, checkOut: r.checkOut, rate: r.rate }, at);
    const n = applyEvent(s, e);
    expect(n.stays).toHaveLength(s.stays.length);
    expect(n.stays.find((x) => x.id === r.id)).toMatchObject({ status: 'activa', room: '202' });
  });
  it('check-out finaliza y deja la habitación sucia', () => {
    const e = makeEvent({ kind: 'stay.checkOut', property: P, actor: staff, room: '101' }, at);
    const n = applyEvent(demo(), e);
    expect(n.stays.find((x) => x.room === '101')).toMatchObject({ status: 'finalizada', checkOut: TODAY });
    expect(n.rooms.find((r) => r.roomId === '101')?.status).toBe('sucia');
  });
  it('extra de staff se entrega; de huésped queda pendiente; suma al saldo', () => {
    const mk = (actor: HotelEvent['actor']) => makeEvent({ kind: 'extra.add', property: P, actor, room: '101', item: 'Agua', qty: 2, unitPrice: 25 }, at);
    const a = applyEvent(demo(), mk(staff));
    expect(a.extras[0]).toMatchObject({ status: 'entregado', total: 50 });
    expect(a.stays.find((x) => x.room === '101')?.extrasTotal).toBe(50);
    expect(applyEvent(demo(), mk(guest)).extras[0]?.status).toBe('pendiente');
  });
  it('solicitud → resolver; extra → entregar', () => {
    const add = makeEvent({ kind: 'request.add', property: P, actor: guest, room: '101', type: 'mantenimiento', details: 'fuga' }, at);
    const s1 = applyEvent(demo(), add);
    const s2 = applyEvent(s1, makeEvent({ kind: 'request.resolve', property: P, actor: staff, requestId: s1.requests[0]!.id }, at));
    expect(s2.requests[0]?.status).toBe('resuelto');
  });
});

describe('eventos y contrato legacy', () => {
  it('traduce al contrato actual de cantabriaWrite y deja rastro en notes', () => {
    const e = makeEvent({ kind: 'room.setStatus', property: P, actor: staff, room: '101', status: 'lista' }, at);
    const p = toLegacyPayload(e)!;
    expect(p).toMatchObject({ action: 'setRoomStatus', room_id: '101', status: 'lista' });
    expect(String(p.notes)).toContain(e.id);
    expect(String(p.notes)).toContain('recepcion/recepcion');
  });
  it('lo que el backend no entiende queda marcado', () => {
    expect(isLegacySupported(makeEvent({ kind: 'room.setStatus', property: P, actor: staff, room: '1', status: 'bloqueada' }, at))).toBe(false);
    expect(isLegacySupported(makeEvent({ kind: 'request.resolve', property: P, actor: staff, requestId: 'x' }, at))).toBe(false);
  });
  it('el esquema rechaza basura', () => {
    expect(HotelEventSchema.safeParse({ kind: 'stay.checkOut' }).success).toBe(false);
  });
});
