/** Modelo canónico del PMS. Todo lo que entra del backend se normaliza a estos tipos. */

export type ISODate = string; // YYYY-MM-DD

export const STAY_STATUS = ['reservada', 'activa', 'finalizada', 'cancelada'] as const;
export type StayStatus = (typeof STAY_STATUS)[number];

export const PAYMENT_STATUS = ['pendiente', 'pagada', 'cargada_a_habitacion'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const ROOM_STATUS = ['sucia', 'proceso', 'lista', 'bloqueada'] as const;
export type RoomStatus = (typeof ROOM_STATUS)[number];

export const REQUEST_STATUS = ['abierto', 'en_curso', 'resuelto'] as const;
export type RequestStatus = (typeof REQUEST_STATUS)[number];

export const REQUEST_TYPE = ['amenidades', 'mantenimiento', 'otro'] as const;
export type RequestType = (typeof REQUEST_TYPE)[number];

export const EXTRA_STATUS = ['pendiente', 'entregado'] as const;
export type ExtraStatus = (typeof EXTRA_STATUS)[number];

export const PRIORITY = ['baja', 'media', 'alta'] as const;
export type Priority = (typeof PRIORITY)[number];

export interface Property {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  /** null = el backend no lo declara */
  roomCount: number | null;
  status: string;
}

export interface Room {
  id: string;
  /** Etiqueta física: "101", "213"… */
  roomId: string;
  type: string;
  status: RoomStatus;
  priority: Priority;
  notes: string;
  property: string;
}

export interface Stay {
  id: string;
  property: string;
  guestName: string;
  /** null = reservada, habitación por asignar */
  room: string | null;
  checkIn: ISODate;
  checkOut: ISODate;
  rate: number;
  extrasTotal: number;
  payment: PaymentStatus;
  status: StayStatus;
  notes: string;
  isSample: boolean;
}

export interface Extra {
  id: string;
  property: string;
  room: string;
  guestName: string;
  item: string;
  qty: number;
  unitPrice: number;
  total: number;
  status: ExtraStatus;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  property: string;
  room: string;
  guestName: string;
  type: RequestType;
  details: string;
  status: RequestStatus;
  priority: Priority;
  createdAt: string;
}

export interface Snapshot {
  syncedAt: string;
  properties: Property[];
  rooms: Room[];
  stays: Stay[];
  extras: Extra[];
  requests: ServiceRequest[];
}

export interface DataIssue {
  entity: 'property' | 'room' | 'stay' | 'extra' | 'request';
  id: string;
  code: string;
  message: string;
}

export const emptySnapshot = (syncedAt = new Date(0).toISOString()): Snapshot => ({
  syncedAt,
  properties: [],
  rooms: [],
  stays: [],
  extras: [],
  requests: [],
});
