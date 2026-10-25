import { inHouse, roomsOf } from './selectors.ts';
import type { ISODate, Snapshot } from './types.ts';

/**
 * Lo único que el sitio público necesita saber: cuántas habitaciones están listas y libres.
 * Cero nombres, cero teléfonos, cero ids de huésped.
 */
export interface PublicView {
  syncedAt: string;
  property: string;
  readyRooms: number;
  totalRooms: number;
  date: ISODate;
}

export function toPublicView(s: Snapshot, property: string, date: ISODate): PublicView {
  const rooms = roomsOf(s, property);
  const busy = new Set(inHouse(s, property, date).map((x) => x.room));
  const readyRooms = rooms.filter((r) => r.status === 'lista' && !busy.has(r.roomId)).length;
  return { syncedAt: s.syncedAt, property, readyRooms, totalRooms: rooms.length, date };
}
