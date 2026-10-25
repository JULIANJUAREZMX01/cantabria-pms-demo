import { beforeEach, describe, expect, it } from 'vitest';
import { handleApi, resetCache, resetRateLimit, type ApiEnv } from '@/server/api.ts';
import { signSession, verifySession } from '@/server/auth.ts';
import { makeEvent } from '@/domain/events.ts';
import { HOTEL } from '@/lib/config.ts';
import { ProxyGateway } from '@/gateway/proxy.ts';

const env: ApiEnv = {
  SESSION_SECRET: 'x'.repeat(40), STAFF_PIN: '4321', OWNER_PIN: '8765',
  BASE44_WRITE_API: 'https://b44.test/write', BASE44_WRITE_TOKEN: 'SECRETO', GITHUB_REPO: 'o/r', GITHUB_READ_TOKEN: '', DATA_PATH: 'data.js',
};
const P = HOTEL.propertyName;
const NOW = Date.UTC(2026, 9, 24, 18);
const req = (path: string, body?: unknown, token?: string, method = 'POST') =>
  new Request(`https://x.test${path}`, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

const sent: unknown[] = [];
const fakeFetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
  if (String(url).startsWith('https://b44.test')) { sent.push(JSON.parse(String(init?.body))); return new Response('{}', { status: 200 }); }
  return new Response('window.CANTABRIA_DATA = {"stays":[]};', { status: 200 });
}) as typeof fetch;
const call = (r: Request) => handleApi(r, env, fakeFetch, NOW);
const login = async (personId: string, pin: string) => call(req('/api/login', { personId, pin }));
const tokenOf = async (personId = 'recepcion', pin = '4321') => ((await (await login(personId, pin)).json()) as { token: string }).token;

beforeEach(() => { sent.length = 0; resetRateLimit(); resetCache(); });

describe('sesión firmada', () => {
  it('verifica, rechaza alteraciones y vencimiento', async () => {
    const t = await signSession({ sub: 'a', hats: ['recepcion'], exp: NOW + 1000 }, env.SESSION_SECRET);
    expect((await verifySession(t, env.SESSION_SECRET, NOW))?.sub).toBe('a');
    expect(await verifySession(t, 'otro-secreto-muy-largo-123456', NOW)).toBeNull();
    expect(await verifySession(t.replace(/.$/, 'A'), env.SESSION_SECRET, NOW)).toBeNull();
    expect(await verifySession(t, env.SESSION_SECRET, NOW + 2000)).toBeNull();
    expect(await verifySession(t, 'corto', NOW)).toBeNull();
  });
});

describe('login', () => {
  it('PIN por nivel; PIN vacío en el entorno nunca entra; freno a fuerza bruta', async () => {
    expect((await login('recepcion', '4321')).status).toBe(200);
    expect((await login('recepcion', '8765')).status).toBe(401);
    expect((await login('dueno', '8765')).status).toBe(200);
    expect((await handleApi(req('/api/login', { personId: 'recepcion', pin: '' }), { ...env, STAFF_PIN: '' }, fakeFetch, NOW)).status).toBe(401);
    for (let i = 0; i < 5; i++) await login('limpieza', '0000');
    expect((await login('limpieza', '4321')).status).toBe(429);
  });
});

describe('eventos', () => {
  const guest = { kind: 'guest' } as const;
  it('el huésped reserva, pero la tarifa la fija el servidor y el token nunca sale al cliente', async () => {
    const e = makeEvent({ kind: 'stay.reserve', property: P, actor: guest, guestName: 'Ana', checkIn: '2026-11-01', checkOut: '2026-11-03', rate: 1, reference: 'CB-AAAAA', lang: 'es' });
    const res = await call(req('/api/event', e));
    expect(res.status).toBe(200);
    expect(sent[0]).toMatchObject({ token: 'SECRETO', action: 'checkIn', rate: HOTEL.defaultRate, status: 'Reservada' });
    expect(JSON.stringify(await res.clone().text())).not.toContain('SECRETO');
  });
  it('el huésped no puede falsear precios ni pedir fuera del catálogo', async () => {
    const e = makeEvent({ kind: 'extra.add', property: P, actor: guest, room: '1', item: 'Champaña', qty: 1, unitPrice: 0 });
    expect((await call(req('/api/event', e))).status).toBe(400);
    const cafe = makeEvent({ kind: 'extra.add', property: P, actor: guest, room: '1', item: 'Café Orgánico de la Región', qty: 1, unitPrice: 0 });
    await call(req('/api/event', cafe));
    expect(sent[0]).toMatchObject({ unit_price: 45 });
  });
  it('sin sesión nadie hace acciones de staff, ni suplantando a otra persona o sombrero', async () => {
    const staff = makeEvent({ kind: 'room.setStatus', property: P, actor: { kind: 'staff', personId: 'recepcion', hat: 'recepcion' }, room: '101', status: 'lista' });
    expect((await call(req('/api/event', staff))).status).toBe(401);
    const t = await tokenOf('recepcion');
    expect((await call(req('/api/event', staff, t))).status).toBe(200);
    const other = makeEvent({ kind: 'room.setStatus', property: P, actor: { kind: 'staff', personId: 'dueno', hat: 'dueno' }, room: '101', status: 'lista' });
    expect((await call(req('/api/event', other, t))).status).toBe(403);
    const wrongHat = makeEvent({ kind: 'room.setStatus', property: P, actor: { kind: 'staff', personId: 'recepcion', hat: 'mantenimiento' }, room: '101', status: 'lista' });
    expect((await call(req('/api/event', wrongHat, t))).status).toBe(403);
  });
  it('respeta capacidades por sombrero', async () => {
    const t = await tokenOf('limpieza');
    const checkout = makeEvent({ kind: 'stay.checkOut', property: P, actor: { kind: 'staff', personId: 'limpieza', hat: 'limpieza' }, room: '101' });
    expect((await call(req('/api/event', checkout, t))).status).toBe(403);
  });
});

describe('snapshot con PII solo con sesión', () => {
  it('401 sin sesión; con sesión devuelve data.js', async () => {
    expect((await call(req('/api/snapshot', undefined, undefined, 'GET'))).status).toBe(401);
    const res = await call(req('/api/snapshot', undefined, await tokenOf(), 'GET'));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('CANTABRIA_DATA');
  });
});

describe('ProxyGateway (cliente)', () => {
  it('login guarda token y lo usa; 401 en evento pide volver a entrar', async () => {
    const calls: { url: string; auth: string | null }[] = [];
    const f = (async (url: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('authorization');
      calls.push({ url: String(url), auth });
      if (String(url).endsWith('/login')) return new Response(JSON.stringify({ token: 'T', session: { personId: 'recepcion', name: 'Recepción', hats: ['recepcion'] } }), { status: 200 });
      return new Response('{}', { status: auth ? 200 : 401 });
    }) as typeof fetch;
    const g = new ProxyGateway({ apiBase: '/', fetchImpl: f });
    const e = makeEvent({ kind: 'stay.checkOut', property: P, actor: { kind: 'staff', personId: 'recepcion', hat: 'recepcion' }, room: '1' });
    expect(await g.send(e)).toMatchObject({ ok: false, retriable: false });
    expect((await g.authenticate('recepcion', '4321'))?.token).toBe('T');
    expect(await g.send(e)).toEqual({ ok: true });
    expect(calls.at(-1)?.auth).toBe('Bearer T');
  });
});
