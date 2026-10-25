import type { Snapshot, Stay } from '@/domain/types.ts';
import { addDays } from '@/lib/dates.ts';
import { HOTEL } from '@/lib/config.ts';

/**
 * Datos de demostración. Se generan RELATIVOS a la fecha de hoy para que la demo siempre
 * tenga llegadas, salidas y limpieza del día, y siempre cuadren entre sí.
 * No hay datos personales reales aquí.
 */
export function buildDemoSnapshot(today: string): Snapshot {
  const property = HOTEL.propertyName;
  const room = (roomId: string, type: string, status: 'sucia' | 'proceso' | 'lista') => ({
    id: `demo_room_${roomId}`,
    roomId,
    property,
    type,
    status,
    priority: 'media' as const,
    notes: '',
  });
  const stay = (id: string, guestName: string, roomId: string | null, inD: number, outD: number, rate: number, status: Stay['status']): Stay => ({
    id: `demo_stay_${id}`,
    property,
    guestName,
    room: roomId,
    checkIn: addDays(today, inD),
    checkOut: addDays(today, outD),
    rate,
    extrasTotal: 0,
    payment: 'pendiente',
    status,
    notes: id === 'r1' ? 'Reserva web · Ref CB-DEM01 · lang: en · Tel: 525500000000' : '',
    isSample: true,
  });

  return {
    syncedAt: new Date().toISOString(),
    properties: [
      { id: 'demo_prop', name: property, city: HOTEL.city, address: HOTEL.address, phone: HOTEL.phoneDisplay, roomCount: 10, status: 'pilot' },
    ],
    rooms: [
      room('101', 'Sencilla Matrimonial', 'lista'),
      room('102', 'Sencilla Matrimonial', 'sucia'),
      room('103', 'Doble Queen', 'proceso'),
      room('104', 'Doble Queen', 'lista'),
      room('105', 'Doble Queen', 'sucia'),
      room('201', 'Habitación', 'lista'),
      room('202', 'Habitación', 'lista'),
      room('203', 'Habitación', 'sucia'),
      room('204', 'Suite Cantabria', 'lista'),
      room('205', 'Suite Cantabria', 'lista'),
    ],
    stays: [
      stay('a1', 'Huésped Demo A', '101', -1, 2, 600, 'activa'),
      stay('a2', 'Huésped Demo B', '102', -2, 0, 450, 'activa'), // sale hoy → limpiar primero
      stay('a3', 'Huésped Demo C', '104', 0, 3, 650, 'activa'), // llega hoy
      stay('a4', 'Huésped Demo D', '201', -3, 1, 480, 'activa'),
      stay('r1', 'Reserva Web Demo', null, 1, 3, HOTEL.defaultRate, 'reservada'),
      stay('r2', 'Reserva Futura Demo', '204', 5, 8, 800, 'reservada'),
    ],
    extras: [],
    requests: [],
  };
}
