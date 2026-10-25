import type { ISODate } from './types.ts';
import { nightsBetween } from '@/lib/dates.ts';
import { isISODate } from '@/lib/dates.ts';
import type { Lang } from '@/lib/config.ts';
import { isLang } from '@/lib/config.ts';

const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I/L

/** Referencia legible tipo CB-7K2QX. */
export function makeReference(bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(5))): string {
  let out = '';
  for (const b of bytes.slice(0, 5)) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return `CB-${out}`;
}

export type BookingError = 'missing' | 'dates' | 'past';

export function validateBooking(input: { name: string; checkIn: string; checkOut: string }, today: ISODate): BookingError | null {
  if (input.name.trim().length < 2 || !input.checkIn || !input.checkOut) return 'missing';
  if (!isISODate(input.checkIn) || !isISODate(input.checkOut) || input.checkOut <= input.checkIn) return 'dates';
  if (input.checkIn < today) return 'past';
  return null;
}

/** Normaliza teléfonos mexicanos a formato wa.me (52 + 10 dígitos). null si no se puede. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10) return `52${d}`;
  if (d.length === 13 && d.startsWith('521')) return `52${d.slice(3)}`;
  if (d.length >= 11 && d.length <= 15) return d;
  return null;
}

export const waLink = (phone: string, text: string): string => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

export interface ReservationMeta {
  ref?: string;
  lang?: Lang;
  phone?: string;
}

/** Lee referencia, idioma y teléfono que la reserva web deja dentro de `notes`. */
export function parseReservationNotes(notes: string): ReservationMeta {
  const ref = /Ref\s+(CB-[A-Z0-9]{5})/.exec(notes)?.[1];
  const lang = /lang:\s*([a-z]{2})/.exec(notes)?.[1];
  const tel = /Tel:\s*([+\d][\d\s-]{6,})/.exec(notes)?.[1];
  const phone = tel ? normalizePhone(tel) : null;
  return {
    ...(ref ? { ref } : {}),
    ...(isLang(lang) ? { lang } : {}),
    ...(phone ? { phone } : {}),
  };
}

export interface ConfirmationInput {
  name: string;
  ref: string;
  checkIn: ISODate;
  checkOut: ISODate;
  rate: number;
}

const MXN = (n: number): string => `$${n.toLocaleString('es-MX')} MXN`;

/** Mensaje de confirmación en el idioma del huésped, listo para copiar o enviar por WhatsApp. */
export function confirmationMessage(lang: Lang, c: ConfirmationInput, address: string): string {
  const nights = nightsBetween(c.checkIn, c.checkOut);
  const total = MXN(c.rate * nights);
  switch (lang) {
    case 'es':
      return `Hola ${c.name}, tu reserva en Hotel Cantabria quedó confirmada ✅\nReferencia: ${c.ref}\nEntrada: ${c.checkIn} · Salida: ${c.checkOut} (${nights} noches)\nTotal estimado: ${total}\n${address}\nEs mi casa, es tu casa.`;
    case 'en':
      return `Hi ${c.name}, your booking at Hotel Cantabria is confirmed ✅\nReference: ${c.ref}\nCheck-in: ${c.checkIn} · Check-out: ${c.checkOut} (${nights} nights)\nEstimated total: ${total}\n${address}\nMi casa es tu casa.`;
    case 'zh':
      return `${c.name}，您好！您在坎塔布里亚酒店的预订已确认 ✅\n参考编号：${c.ref}\n入住：${c.checkIn} · 退房：${c.checkOut}（${nights}晚）\n预计总价：${total}\n${address}`;
    case 'de':
      return `Hallo ${c.name}, deine Buchung im Hotel Cantabria ist bestätigt ✅\nReferenz: ${c.ref}\nAnreise: ${c.checkIn} · Abreise: ${c.checkOut} (${nights} Nächte)\nGeschätzter Gesamtpreis: ${total}\n${address}`;
    case 'fr':
      return `Bonjour ${c.name}, votre réservation à l’Hôtel Cantabria est confirmée ✅\nRéférence : ${c.ref}\nArrivée : ${c.checkIn} · Départ : ${c.checkOut} (${nights} nuits)\nTotal estimé : ${total}\n${address}`;
  }
}
