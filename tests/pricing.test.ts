import { describe, expect, it } from 'vitest';
import { nightlyRate, quote } from '@/domain/pricing.ts';

describe('tarifa con promoción hasta 2027-01-01', () => {
  it('antes de la fecha $300, desde la fecha $650', () => {
    expect(nightlyRate('2026-12-31')).toBe(300);
    expect(nightlyRate('2027-01-01')).toBe(650);
  });
  it('estancias completas dentro o fuera de la promo son exactas', () => {
    expect(quote('2026-11-01', '2026-11-04')).toMatchObject({ nights: 3, total: 900, avgRate: 300, promo: true });
    expect(quote('2027-03-01', '2027-03-03')).toMatchObject({ nights: 2, total: 1300, avgRate: 650, promo: false });
  });
  it('una estancia que cruza la fecha se cotiza noche por noche', () => {
    expect(quote('2026-12-31', '2027-01-02')).toMatchObject({ nights: 2, total: 950, avgRate: 475, promo: true });
  });
});
