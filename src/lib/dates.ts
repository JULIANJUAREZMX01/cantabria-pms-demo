import type { ISODate } from '@/domain/types.ts';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export const isISODate = (v: string): v is ISODate => ISO.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

const toUTC = (d: ISODate): number => Date.parse(`${d}T00:00:00Z`);

export function addDays(d: ISODate, n: number): ISODate {
  return new Date(toUTC(d) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Noches entre entrada (incluida) y salida (excluida). Nunca negativo. */
export function nightsBetween(checkIn: ISODate, checkOut: ISODate): number {
  return Math.max(0, Math.round((toUTC(checkOut) - toUTC(checkIn)) / 86_400_000));
}

/** ¿La noche del día `d` cae dentro de la estancia? (entrada incluida, salida excluida) */
export const coversNight = (checkIn: ISODate, checkOut: ISODate, d: ISODate): boolean =>
  checkIn <= d && d < checkOut;

/** Dos estancias se traslapan si comparten al menos una noche. */
export const overlaps = (aIn: ISODate, aOut: ISODate, bIn: ISODate, bOut: ISODate): boolean =>
  aIn < bOut && bIn < aOut;

/** Fecha local del hotel (Tulancingo = America/Mexico_City). Inyectable para pruebas. */
export function todayIn(timeZone = 'America/Mexico_City', now: Date = new Date()): ISODate {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
