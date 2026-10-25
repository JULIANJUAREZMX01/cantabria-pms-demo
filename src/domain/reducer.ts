import type { HotelEvent } from './events.ts';
import type { Extra, Priority, RequestType, Room, ServiceRequest, Snapshot, Stay } from './types.ts';
import { HOTEL } from '@/lib/config.ts';
import { coversNight, todayIn } from '@/lib/dates.ts';

/**
 * Reductor puro: estado + evento = estado nuevo.
 * Lo usan por igual la demo, la UI optimista (mientras el evento está en la cola) y las pruebas.
 * Es idempotente: reaplicar un evento ya aplicado no duplica nada (reintentos de la cola).
 */

const DEFAULT_PRIORITY: Record<RequestType, Priority> = { mantenimiento: 'media', amenidades: 'baja', otro: 'baja' };

const localDate = (iso: string): string => todayIn(HOTEL.timeZone, new Date(iso));

export function applyEvent(s: Snapshot, e: HotelEvent): Snapshot {
  switch (e.kind) {
    case 'stay.reserve': {
      const id = `stay_${e.id}`;
      if (s.stays.some((x) => x.id === id)) return s;
      const stay: Stay = {
        id,
        property: e.property,
        guestName: e.guestName,
        room: null,
        checkIn: e.checkIn,
        checkOut: e.checkOut,
        rate: e.rate,
        extrasTotal: 0,
        payment: 'pendiente',
        status: 'reservada',
        notes: `Reserva web · Ref ${e.reference}${e.phone ? ` · Tel: ${e.phone}` : ''}`,
        isSample: false,
      };
      return { ...s, stays: [...s.stays, stay] };
    }

    case 'stay.checkIn': {
      const id = e.stayId ?? `stay_${e.id}`;
      const existing = s.stays.find((x) => x.id === id);
      if (existing) {
        if (existing.status === 'activa' && existing.room === e.room) return s;
        const updated: Stay = { ...existing, room: e.room, status: 'activa', checkIn: e.checkIn, checkOut: e.checkOut, rate: e.rate };
        return { ...s, stays: s.stays.map((x) => (x.id === id ? updated : x)) };
      }
      const stay: Stay = {
        id,
        property: e.property,
        guestName: e.guestName,
        room: e.room,
        checkIn: e.checkIn,
        checkOut: e.checkOut,
        rate: e.rate,
        extrasTotal: 0,
        payment: 'pendiente',
        status: 'activa',
        notes: e.notes ?? '',
        isSample: false,
      };
      return { ...s, stays: [...s.stays, stay] };
    }

    case 'stay.checkOut': {
      const today = localDate(e.at);
      const target = s.stays
        .filter((x) => x.property === e.property && x.room === e.room && x.status === 'activa' && x.checkIn <= today)
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn))[0];
      if (!target) return s;
      const stays = s.stays.map((x) =>
        x.id === target.id ? { ...x, status: 'finalizada' as const, checkOut: today < x.checkOut ? today : x.checkOut } : x,
      );
      return setRoomStatus({ ...s, stays }, e.property, e.room, 'sucia');
    }

    case 'room.setStatus':
      return setRoomStatus(s, e.property, e.room, e.status);

    case 'extra.add': {
      const id = `extra_${e.id}`;
      if (s.extras.some((x) => x.id === id)) return s;
      const total = e.qty * e.unitPrice;
      const extra: Extra = {
        id,
        property: e.property,
        room: e.room,
        guestName: e.guestName ?? '',
        item: e.item,
        qty: e.qty,
        unitPrice: e.unitPrice,
        total,
        status: e.actor.kind === 'staff' ? 'entregado' : 'pendiente',
        createdAt: e.at,
      };
      const today = localDate(e.at);
      const stays = s.stays.map((x) =>
        x.property === e.property && x.room === e.room && x.status === 'activa' && coversNight(x.checkIn, x.checkOut, today)
          ? { ...x, extrasTotal: x.extrasTotal + total }
          : x,
      );
      return { ...s, extras: [...s.extras, extra], stays };
    }

    case 'request.add': {
      const id = `req_${e.id}`;
      if (s.requests.some((x) => x.id === id)) return s;
      const req: ServiceRequest = {
        id,
        property: e.property,
        room: e.room ?? '',
        guestName: e.guestName ?? '',
        type: e.type,
        details: e.details,
        status: 'abierto',
        priority: e.priority ?? DEFAULT_PRIORITY[e.type],
        createdAt: e.at,
      };
      return { ...s, requests: [...s.requests, req] };
    }

    case 'request.resolve':
      return { ...s, requests: s.requests.map((x) => (x.id === e.requestId ? { ...x, status: 'resuelto' as const } : x)) };

    case 'extra.deliver':
      return { ...s, extras: s.extras.map((x) => (x.id === e.extraId ? { ...x, status: 'entregado' as const } : x)) };
  }
}

function setRoomStatus(s: Snapshot, property: string, roomId: string, status: Room['status']): Snapshot {
  const exists = s.rooms.some((r) => r.property === property && r.roomId === roomId);
  if (exists) {
    return { ...s, rooms: s.rooms.map((r) => (r.property === property && r.roomId === roomId ? { ...r, status } : r)) };
  }
  const room: Room = { id: `room_${property}_${roomId}`, roomId, property, type: 'Habitación', status, priority: 'media', notes: '' };
  return { ...s, rooms: [...s.rooms, room] };
}

export const applyEvents = (s: Snapshot, events: readonly HotelEvent[]): Snapshot => events.reduce(applyEvent, s);
