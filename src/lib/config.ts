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
  /** Consulta de mapa por DIRECCION oficial: en Google Maps el hotel aparece mal ubicado (ver docs/MARCA-IDENTIDAD.md). */
  mapQuery: 'Ignacio Zaragoza Oriente 104, Centro, 43600 Tulancingo de Bravo, Hidalgo, México',
  whatsapp: '527757591185',
  phoneDisplay: '+52 775 759 1185',
  timeZone: 'America/Mexico_City',
  /** Tarifa estándar por noche. La tarifa vigente de una estancia sale de quote() (src/domain/pricing.ts). */
  defaultRate: 650,
  /** Promoción de cartel: $300 por noche; aplica a las noches ANTERIORES a until (2027-01-01). Confirmar con el dueño si aplica a reservas directas y a estancias que cruzan la fecha. */
  promo: { rate: 300, until: '2027-01-01' },
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

/** Resenas REALES de Google (Hostales Cantabria, mismo telefono del hotel). Solo 5 estrellas, con enlace a la fuente. NO inventar. */
export const REVIEWS = [
  { author: 'Alain Olmedo González', stars: 5, date: '2025-07', text: 'Excelente servicio, agua caliente, internet y todos los servicios las 24 horas. El personal muy bien capacitado.', href: 'https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25nM1lYVjBTblJKWkRGSGFHOUllbWRHZDA1UVowRRAB!2m1!1s0x0:0x670268fc35eb0db9!3m1!1s2@1:CAIQACodChtycF9oOng3YXV0SnRJZDFHaG9IemdGd05QZ0E%7C%7C?hl=es' },
  { author: 'Cristian Castillo', stars: 5, date: '2026-08', text: 'Muy buena atención y excelente servicio.', href: 'https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2psVFZqUjVaWHBJYUU5M2FtcElNMVJhYW1kV01WRRAB!2m1!1s0x0:0x670268fc35eb0db9!3m1!1s2@1:CAIQACodChtycF9oOjlTVjR5ZXpIaE93ampIM1RaamdWMVE%7C%7C?hl=es' },
] as const;
