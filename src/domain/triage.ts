import type { Priority } from './types.ts';

/**
 * Triage de mantenimiento. Estructura portada de KynicOS `hvac_triage.py`
 * (síntoma → causas probables → preguntas → prioridad → ETA), pero con las fallas
 * de un hotel de altura en Tulancingo (agua caliente, fugas, electricidad, cerradura…)
 * en lugar de un catálogo solo de HVAC.
 *
 * BORRADOR: causas, prioridades y ETAs deben validarse con quien hace mantenimiento (ADR-008).
 */

export interface TriageEntry {
  id: string;
  label: string;
  keywords: readonly string[];
  causes: readonly string[];
  questions: readonly string[];
  priority: Priority;
  etaMinutes: number;
  /** Si la falla impide alojar a alguien, la habitación se bloquea. */
  blocksRoom: boolean;
}

export const TRIAGE: readonly TriageEntry[] = [
  {
    id: 'agua_caliente',
    label: 'Sin agua caliente',
    keywords: ['agua caliente', 'regadera fria', 'regadera helada', 'boiler', 'calentador', 'hot water', 'cold shower'],
    causes: ['Piloto del calentador apagado', 'Tanque de gas vacío', 'Llave de paso cerrada'],
    questions: ['¿Sale fría en todas las llaves o solo en la regadera?', '¿Cuánto tiempo lleva así?'],
    priority: 'alta',
    etaMinutes: 20,
    blocksRoom: false,
  },
  {
    id: 'fuga',
    label: 'Fuga o goteo de agua',
    keywords: ['fuga', 'gotea', 'goteo', 'inunda', 'tuberia', 'leak', 'flood', 'dripping'],
    causes: ['Flotador o sello del WC', 'Sello de lavabo o regadera', 'Tubería oculta'],
    questions: ['¿Es un goteo o mucha agua?', '¿Dónde está: baño, pared o techo?'],
    priority: 'alta',
    etaMinutes: 15,
    blocksRoom: true,
  },
  {
    id: 'electricidad',
    label: 'Sin luz o contacto dañado',
    keywords: ['sin luz', 'no hay luz', 'apagon', 'breaker', 'contacto', 'foco', 'power', 'outlet', 'blackout'],
    causes: ['Breaker disparado en el tablero', 'Foco o lámpara fundida', 'Contacto dañado'],
    questions: ['¿Solo la habitación o todo el pasillo?', '¿Huele a quemado o hay chispas?'],
    priority: 'alta',
    etaMinutes: 15,
    blocksRoom: false,
  },
  {
    id: 'cerradura',
    label: 'Cerradura o llave',
    keywords: ['cerradura', 'puerta no abre', 'llave', 'candado', 'lock', 'key', 'locked out'],
    causes: ['Llave desgastada', 'Cerradura atorada', 'Batería de cerradura (si es electrónica)'],
    questions: ['¿El huésped está afuera de la habitación?'],
    priority: 'alta',
    etaMinutes: 10,
    blocksRoom: false,
  },
  {
    id: 'clima',
    label: 'Clima o calefacción',
    keywords: ['aire acondicionado', 'clima', 'calefaccion', 'calefactor', 'no enfria', 'no calienta', 'heater', 'air conditioning'],
    causes: ['Control remoto sin batería', 'Filtro saturado', 'Breaker disparado'],
    questions: ['¿Enciende el display del equipo?', '¿Hace ruido raro?'],
    priority: 'media',
    etaMinutes: 30,
    blocksRoom: false,
  },
  {
    id: 'wifi',
    label: 'WiFi sin servicio',
    keywords: ['wifi', 'wi-fi', 'internet', 'sin senal', 'no hay red'],
    causes: ['Reiniciar módem o repetidor del piso', 'Saturación de la red', 'Contraseña cambiada'],
    questions: ['¿Falla en todos los dispositivos o solo en uno?'],
    priority: 'media',
    etaMinutes: 20,
    blocksRoom: false,
  },
  {
    id: 'plaga',
    label: 'Plaga o insectos',
    keywords: ['cucaracha', 'plaga', 'hormiga', 'mosquito', 'chinche', 'roach', 'ants', 'bedbug'],
    causes: ['Entrada por drenaje o ventana', 'Restos de comida'],
    questions: ['¿Qué tipo de insecto y cuántos?'],
    priority: 'media',
    etaMinutes: 30,
    blocksRoom: false,
  },
  {
    id: 'tv',
    label: 'Televisión o control',
    keywords: ['television', 'tele ', ' tv', 'control remoto', 'remote'],
    causes: ['Pilas del control', 'Entrada HDMI/antena suelta'],
    questions: ['¿Enciende la pantalla?'],
    priority: 'baja',
    etaMinutes: 15,
    blocksRoom: false,
  },
];

export const normalizeText = (s: string): string =>
  ` ${s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()} `;

export interface TriageResult {
  entry: TriageEntry;
  matched: string;
}

/** Primera categoría cuyo keyword aparece en el texto; null si no hay coincidencia. */
export function triage(text: string): TriageResult | null {
  const t = normalizeText(text);
  for (const entry of TRIAGE) {
    const matched = entry.keywords.find((k) => t.includes(k));
    if (matched) return { entry, matched };
  }
  return null;
}
