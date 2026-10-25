import { HOTEL } from '../lib/config.ts';
import { addDays, nightsBetween } from '../lib/dates.ts';
import type { ISODate } from './types.ts';

/** Tarifa de UNA noche: promo antes de promo.until, estándar desde esa fecha. Lo decide el servidor, no el cliente. */
export const nightlyRate = (night: ISODate): number => (night < HOTEL.promo.until ? HOTEL.promo.rate : HOTEL.defaultRate);

export interface Quote {
  nights: number;
  total: number;
  /** Tarifa por noche redondeada: es lo que guarda Stay.rate. Exacta si todas las noches cuestan lo mismo. */
  avgRate: number;
  /** true si alguna noche cae en promoción. */
  promo: boolean;
}

export function quote(checkIn: ISODate, checkOut: ISODate): Quote {
  const nights = nightsBetween(checkIn, checkOut);
  let total = 0;
  let promoNights = 0;
  for (let i = 0; i < nights; i++) {
    const night = addDays(checkIn, i);
    total += nightlyRate(night);
    if (night < HOTEL.promo.until) promoNights++;
  }
  return { nights, total, avgRate: nights === 0 ? HOTEL.defaultRate : Math.round(total / nights), promo: promoNights > 0 };
}
