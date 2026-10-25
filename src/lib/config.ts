/** Constantes del negocio. Lo que cambie con frecuencia vive en el backend, no aquí. */

export const HOTEL = {
  /** Nombre exacto de la propiedad en la base (Base44). */
  propertyName: 'Hotel Cantabria Tulancingo',
  brand: 'Hotel Cantabria',
  /** Año de fundación confirmado por el dueño (2026-10-25). */
  est: 1928,
  tagline: 'Es mi casa, es tu casa',
  city: 'Tulancingo, Hidalgo',
  /** Dirección del cartel de marca. La BD trae otra: ver auditoría `data/address-mismatch`. */
  address: 'Zaragoza Ote. No. 104, Col. Centro, C.P. 43600',
  /** WhatsApp del jefe (formato wa.me, sin +). */
  whatsapp: '527757591185',
  phoneDisplay: '+52 775 759 1185',
  timeZone: 'America/Mexico_City',
  /** Tarifa por defecto de reserva web (hoy fija en el frontend). */
  defaultRate: 300,
} as const;

export const EXTRAS_CATALOG = [
  { id: 'agua', name: 'Agua Alcalina Cantabria 600ml', price: 25 },
  { id: 'cafe', name: 'Café Orgánico de la Región', price: 45 },
  { id: 'kit', name: 'Kit Ecológico de Aseo (Bambú)', price: 70 },
] as const;
export type ExtraId = (typeof EXTRAS_CATALOG)[number]['id'];

export const LANGS = [
  { id: 'es', flag: '🇲🇽', name: 'Español' },
  { id: 'en', flag: '🇬🇧', name: 'English' },
  { id: 'zh', flag: '🇨🇳', name: '中文' },
  { id: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { id: 'fr', flag: '🇫🇷', name: 'Français' },
] as const;
export type Lang = (typeof LANGS)[number]['id'];
export const isLang = (v: unknown): v is Lang => LANGS.some((l) => l.id === v);
