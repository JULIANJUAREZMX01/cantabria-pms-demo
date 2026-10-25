import { PEOPLE } from '../data/people.ts';
import type { Hat, Person } from '../domain/hats.ts';

/**
 * Sesiones firmadas (HMAC-SHA256) y verificación de PIN en el SERVIDOR.
 * Reemplaza el token y los PIN compartidos que hoy viajan en el bundle público (ADR-009).
 */

export interface SessionClaims {
  /** personId */
  sub: string;
  hats: Hat[];
  /** epoch ms */
  exp: number;
}

const enc = new TextEncoder();
const b64u = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s: string): Uint8Array => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

const key = (secret: string, usage: KeyUsage[]): Promise<CryptoKey> =>
  crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usage);

export async function signSession(claims: SessionClaims, secret: string): Promise<string> {
  const body = b64u(enc.encode(JSON.stringify(claims)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret, ['sign']), enc.encode(body)));
  return `${body}.${b64u(sig)}`;
}

export async function verifySession(token: string, secret: string, nowMs: number): Promise<SessionClaims | null> {
  const [body, sig] = token.split('.');
  if (!body || !sig || secret.length < 16) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await key(secret, ['verify']), unb64u(sig) as BufferSource, enc.encode(body) as BufferSource);
    if (!ok) return null;
    const c: unknown = JSON.parse(new TextDecoder().decode(unb64u(body)));
    if (!c || typeof c !== 'object') return null;
    const { sub, hats, exp } = c as Partial<SessionClaims>;
    if (typeof sub !== 'string' || !Array.isArray(hats) || typeof exp !== 'number' || exp <= nowMs) return null;
    return { sub, hats, exp };
  } catch {
    return null;
  }
}

/** Comparación en tiempo constante (sin cortocircuito por primer carácter distinto). */
export function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export interface PinConfig {
  staffPin: string;
  ownerPin: string;
}

/** Persona + PIN → persona, o null. Un PIN vacío en el entorno nunca autentica. */
export function checkPin(personId: string, pin: string, cfg: PinConfig): Person | null {
  const person = PEOPLE.find((p) => p.id === personId);
  if (!person) return null;
  const expected = person.hats.includes('dueno') ? cfg.ownerPin : cfg.staffPin;
  return expected.length >= 4 && safeEqual(pin, expected) ? person : null;
}
