import { toLegacyPayload } from '../domain/events.ts';
import { signSession, verifySession, checkPin, type SessionClaims } from './auth.ts';
import { authorize } from './policy.ts';

export interface ApiEnv {
  SESSION_SECRET: string;
  STAFF_PIN: string;
  OWNER_PIN: string;
  BASE44_WRITE_API: string;
  BASE44_WRITE_TOKEN: string;
  /** owner/repo donde Base44 publica data.js */
  GITHUB_REPO: string;
  /** Solo si el repo es privado. */
  GITHUB_READ_TOKEN: string;
  DATA_PATH: string;
}

const SESSION_MS = 12 * 3_600_000;
const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/** Freno básico a fuerza bruta de PIN. En serverless es por instancia: mitiga, no sustituye un WAF. */
const attempts = new Map<string, { n: number; since: number }>();
const WINDOW = 5 * 60_000;
const MAX_TRIES = 5;
export const resetRateLimit = (): void => attempts.clear();

function limited(id: string, now: number): boolean {
  const a = attempts.get(id);
  if (!a || now - a.since > WINDOW) return false;
  return a.n >= MAX_TRIES;
}
function fail(id: string, now: number): void {
  const a = attempts.get(id);
  if (!a || now - a.since > WINDOW) attempts.set(id, { n: 1, since: now });
  else a.n++;
}

async function claimsOf(req: Request, env: ApiEnv, now: number): Promise<SessionClaims | null> {
  const h = req.headers.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? verifySession(h.slice(7), env.SESSION_SECRET, now) : null;
}

let cache: { at: number; text: string } | null = null;

export async function handleApi(req: Request, env: ApiEnv, fetchImpl: typeof fetch = fetch, now: number = Date.now()): Promise<Response> {
  const path = new URL(req.url).pathname.replace(/\/+$/, '');

  if (path.endsWith('/api/login') && req.method === 'POST') {
    const body: unknown = await req.json().catch(() => null);
    const { personId, pin } = (body ?? {}) as { personId?: unknown; pin?: unknown };
    if (typeof personId !== 'string' || typeof pin !== 'string') return json(400, { error: 'Datos inválidos' });
    if (limited(personId, now)) return json(429, { error: 'Demasiados intentos. Espera unos minutos.' });
    const person = checkPin(personId, pin, { staffPin: env.STAFF_PIN, ownerPin: env.OWNER_PIN });
    if (!person) {
      fail(personId, now);
      return json(401, { error: 'PIN incorrecto' });
    }
    attempts.delete(personId);
    const claims: SessionClaims = { sub: person.id, hats: [...person.hats], exp: now + SESSION_MS };
    return json(200, { token: await signSession(claims, env.SESSION_SECRET), session: { personId: person.id, name: person.name, hats: person.hats } });
  }

  if (path.endsWith('/api/event') && req.method === 'POST') {
    const verdict = authorize(await req.json().catch(() => null), await claimsOf(req, env, now));
    if (!verdict.ok) return json(verdict.status, { error: verdict.message });
    const payload = toLegacyPayload(verdict.event);
    if (!payload) return json(422, { error: 'El backend actual no soporta esta acción' });
    try {
      const res = await fetchImpl(env.BASE44_WRITE_API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: env.BASE44_WRITE_TOKEN, ...payload }),
      });
      if (!res.ok) return json(res.status >= 500 ? 502 : 422, { error: `Backend respondió ${res.status}` });
      return json(200, { ok: true });
    } catch {
      return json(502, { error: 'Backend no disponible' });
    }
  }

  if (path.endsWith('/api/snapshot') && req.method === 'GET') {
    if (!(await claimsOf(req, env, now))) return json(401, { error: 'Sesión requerida' });
    if (cache && now - cache.at < 15_000) return new Response(cache.text, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
    const res = await fetchImpl(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${env.DATA_PATH}`, {
      headers: { accept: 'application/vnd.github.raw+json', ...(env.GITHUB_READ_TOKEN ? { authorization: `Bearer ${env.GITHUB_READ_TOKEN}` } : {}) },
    });
    if (!res.ok) return json(502, { error: `No se pudo leer ${env.DATA_PATH} (${res.status})` });
    const text = await res.text();
    cache = { at: now, text };
    return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
  }

  return json(404, { error: 'No encontrado' });
}
export const resetCache = (): void => { cache = null; };
