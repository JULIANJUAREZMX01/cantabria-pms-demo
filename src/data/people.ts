import type { Person } from '@/domain/hats.ts';

/**
 * Personas del equipo y los sombreros que usan. Editar aquí, no en la lógica.
 * Los nombres son marcadores: sustituir por los reales. NO poner PIN ni datos personales en este archivo.
 * La realidad del hotel es multi-puesto: la misma persona cambia de sombrero con un toque.
 */
export const PEOPLE: readonly Person[] = [
  { id: 'recepcion', name: 'Recepción', hats: ['recepcion', 'concierge', 'limpieza'] },
  { id: 'limpieza', name: 'Limpieza', hats: ['limpieza', 'mantenimiento', 'recepcion'] },
  { id: 'mantenimiento', name: 'Mantenimiento', hats: ['mantenimiento', 'limpieza'] },
  { id: 'dueno', name: 'Dueño', hats: ['dueno', 'recepcion', 'limpieza', 'mantenimiento', 'concierge'] },
];
