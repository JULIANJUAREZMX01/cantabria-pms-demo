/**
 * Sombreros: el equipo es pequeño y se cubre entre puestos. Un sombrero es lo que
 * una persona hace en este momento, no quién es. La misma persona puede cambiarlo con un toque.
 */

export const HATS = ['recepcion', 'limpieza', 'mantenimiento', 'concierge', 'inventario', 'logistica', 'dueno'] as const;
export type Hat = (typeof HATS)[number];

export const CAPABILITIES = [
  'stay.reserve',
  'stay.checkIn',
  'stay.checkOut',
  'room.setStatus',
  'extra.add',
  'extra.deliver',
  'request.add',
  'request.resolve',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export interface HatDef {
  id: Hat;
  label: string;
  /** Una línea: qué ve y qué hace con este sombrero. */
  blurb: string;
  /** false = definido en el modelo pero sin backend aún (ver ADR-008). No se muestra. */
  enabled: boolean;
  can: readonly Capability[];
}

export const HAT_DEFS: Record<Hat, HatDef> = {
  recepcion: {
    id: 'recepcion',
    label: 'Recepción',
    blurb: 'Llegadas, salidas, asignación de habitación y cobros del día.',
    enabled: true,
    can: ['stay.reserve', 'stay.checkIn', 'stay.checkOut', 'extra.add', 'request.add', 'room.setStatus'],
  },
  limpieza: {
    id: 'limpieza',
    label: 'Limpieza y mayordomía',
    blurb: 'Qué habitación limpiar primero y en qué estado está cada una.',
    enabled: true,
    can: ['room.setStatus', 'request.add'],
  },
  mantenimiento: {
    id: 'mantenimiento',
    label: 'Mantenimiento',
    blurb: 'Fallas abiertas, diagnóstico rápido y bloqueo de habitaciones.',
    enabled: true,
    can: ['request.add', 'request.resolve', 'room.setStatus'],
  },
  concierge: {
    id: 'concierge',
    label: 'Concierge y guía',
    blurb: 'Pedidos y solicitudes de huéspedes; recomendaciones de la ciudad.',
    enabled: true,
    can: ['extra.add', 'extra.deliver', 'request.add', 'request.resolve'],
  },
  inventario: {
    id: 'inventario',
    label: 'Inventario',
    blurb: 'Ropa blanca, amenidades y consumibles con mínimos.',
    enabled: false,
    can: [],
  },
  logistica: {
    id: 'logistica',
    label: 'Compras y costos',
    blurb: 'Gastos, proveedores y qué comprar esta semana.',
    enabled: false,
    can: [],
  },
  dueno: {
    id: 'dueno',
    label: 'Dueño',
    blurb: 'Resumen, ingresos, pendientes que requieren tu decisión.',
    enabled: true,
    can: CAPABILITIES,
  },
};

export const can = (hat: Hat, capability: Capability): boolean => HAT_DEFS[hat].can.includes(capability);
export const enabledHats = (hats: readonly Hat[]): Hat[] => hats.filter((h) => HAT_DEFS[h].enabled);

export interface Person {
  id: string;
  name: string;
  hats: readonly Hat[];
}
