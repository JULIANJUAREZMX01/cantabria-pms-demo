import { describe, expect, it } from 'vitest';
import { classify, concierge } from '@/domain/concierge.ts';
import { triage } from '@/domain/triage.ts';
import { confirmationMessage, makeReference, normalizePhone, parseReservationNotes, validateBooking } from '@/domain/booking.ts';
import { extractDataJs } from '@/domain/legacy.ts';
import { runAudit } from '@/domain/audit.ts';
import { toPublicView } from '@/domain/public.ts';
import { HOTEL } from '@/lib/config.ts';
import { Outbox, MemoryOutboxStore } from '@/gateway/outbox.ts';
import { LegacyGateway } from '@/gateway/legacy.ts';
import { makeEvent, type HotelEvent } from '@/domain/events.ts';
import { demo, fixture, fixtureRaw, TODAY } from './helpers.ts';

const P = HOTEL.propertyName;
const staff = { kind: 'staff', personId: 'dueno', hat: 'dueno' } as const;

describe('legacy → canónico', () => {
  const { snapshot, issues } = fixture();
  it('normaliza estados heredados, espacios y "Por asignar"', () => {
    expect(snapshot.stays).toHaveLength(8);
    expect(snapshot.stays.every((s) => s.guestName === s.guestName.trim())).toBe(true);
    expect(snapshot.stays.filter((s) => s.room === null).length).toBeGreaterThan(0);
    expect(snapshot.stays.map((s) => s.status)).toContain('finalizada');
    expect(issues.some((i) => i.code === 'legacy-enum')).toBe(true);
    expect(issues.some((i) => i.code === 'placeholder-room')).toBe(true);
    expect(snapshot.rooms.some((r) => r.roomId === 'Por asignar')).toBe(false);
  });
  it('un registro roto no tumba el resto', () => {
    const raw = extractDataJs('window.X = {"stays":[{"id":1},{"id":"ok","guest_name":"A","property_name":"P","check_in":"2026-01-02","check_out":"2026-01-01","status":"Activa"}]};');
    const r = fixtureRawParse(raw);
    expect(r.snapshot.stays).toHaveLength(0);
    expect(r.issues.map((i) => i.code).sort()).toEqual(['bad-dates', 'bad-record']);
  });
});
import { parseSnapshot } from '@/domain/legacy.ts';
const fixtureRawParse = (raw: unknown) => parseSnapshot(raw);

describe('concierge y triage', () => {
  it('clasifica en 5 idiomas y "agua caliente" es falla, no pedido de agua', () => {
    expect(classify('quiero agua')).toBe('agua');
    expect(classify('one coffee please')).toBe('cafe');
    expect(classify('我要毛巾')).toBe('amenidades');
    expect(classify('Handtuch bitte')).toBe('amenidades');
    expect(classify('pas d’eau chaude à la douche, c’est en panne')).toBe('mantenimiento');
    expect(classify('no hay agua caliente')).toBe('mantenimiento');
    expect(classify('¿a qué hora cierra el museo?')).toBe('otro');
  });
  it('pide habitación, escribe evento y deriva a humano cuando no entiende', () => {
    expect(concierge({ text: 'café', room: '', lang: 'zh' }).kind).toBe('ask-room');
    const ok = concierge({ text: 'café', room: '102', lang: 'es' });
    expect(ok.kind === 'action' && ok.event.kind === 'extra.add' && ok.event.unitPrice).toBe(45);
    const h = concierge({ text: 'museo', room: '102', lang: 'en' });
    expect(h).toMatchObject({ kind: 'handoff', whatsapp: HOTEL.whatsapp });
  });
  it('triage da prioridad y bloqueo', () => {
    expect(triage('hay una fuga en el baño')?.entry).toMatchObject({ id: 'fuga', priority: 'alta', blocksRoom: true });
    expect(triage('algo raro')).toBeNull();
  });
});

describe('reserva', () => {
  it('referencia, validación, teléfono y notas', () => {
    expect(makeReference()).toMatch(/^CB-[A-HJKMNP-Z2-9]{5}$/);
    expect(validateBooking({ name: 'A', checkIn: '', checkOut: '' }, TODAY)).toBe('missing');
    expect(validateBooking({ name: 'Ana', checkIn: '2026-10-25', checkOut: '2026-10-25' }, TODAY)).toBe('dates');
    expect(validateBooking({ name: 'Ana', checkIn: '2026-10-01', checkOut: '2026-10-25' }, TODAY)).toBe('past');
    expect(validateBooking({ name: 'Ana', checkIn: '2026-10-25', checkOut: '2026-10-27' }, TODAY)).toBeNull();
    expect(normalizePhone('775 759 1185')).toBe('527757591185');
    expect(normalizePhone('5217757591185')).toBe('527757591185');
    expect(normalizePhone('12')).toBeNull();
    expect(parseReservationNotes('Reserva web huésped · Ref CB-7K2QX · lang: zh · Tel: 775 759 1185')).toEqual({ ref: 'CB-7K2QX', lang: 'zh', phone: '527757591185' });
  });
  it('confirmación en el idioma del huésped con total correcto', () => {
    const m = confirmationMessage('de', { name: 'Eva', ref: 'CB-AAAAA', checkIn: '2026-11-01', checkOut: '2026-11-03', rate: 650 }, HOTEL.address);
    expect(m).toContain('2 Nächte');
    expect(m).toContain('1,300');
  });
});

describe('cola offline', () => {
  const ev = (n: number): HotelEvent => makeEvent({ kind: 'room.setStatus', property: P, actor: staff, room: String(n), status: 'lista' }, new Date(2026, 9, 24, 12, n));
  it('envía en orden, se detiene con fallo de red y conserva el orden', async () => {
    const store = new MemoryOutboxStore();
    const calls: string[] = [];
    let down = true;
    const box = new Outbox(store, async (e) => {
      if (e.kind !== 'room.setStatus') throw new Error('x');
      if (down && e.room === '2') return { ok: false, retriable: true, message: 'red' };
      calls.push(e.room);
      return { ok: true };
    });
    for (const n of [3, 1, 2]) await box.enqueue(ev(n));
    let r = await box.drain();
    expect(calls).toEqual(['1']);
    expect(r.remaining).toBe(2);
    down = false;
    r = await box.drain();
    expect(calls).toEqual(['1', '2', '3']);
    expect(r.remaining).toBe(0);
  });
  it('un rechazo definitivo no bloquea al resto', async () => {
    const box = new Outbox(new MemoryOutboxStore(), async (e) => (e.kind === 'room.setStatus' && e.room === '1' ? { ok: false, retriable: false, message: 'no' } : { ok: true }));
    await box.enqueue(ev(1));
    await box.enqueue(ev(2));
    const r = await box.drain();
    expect(r.sent).toHaveLength(1);
    expect(r.failed).toBe(1);
    expect((await box.failed())).toHaveLength(1);
  });
});

describe('gateway legacy', () => {
  const cfg = { writeApi: 'https://x/api', token: 't', staffPin: '1111', ownerPin: '2222', baseUrl: '/' };
  const mk = (status: number, body: unknown = {}) =>
    new LegacyGateway({ ...cfg, fetchImpl: (async () => new Response(JSON.stringify(body), { status })) as typeof fetch });
  const e = makeEvent({ kind: 'room.setStatus', property: P, actor: staff, room: '1', status: 'lista' });
  it('clasifica respuestas: ok, 5xx reintentable, 4xx definitivo, error en cuerpo', async () => {
    expect(await mk(200).send(e)).toEqual({ ok: true });
    expect(await mk(503).send(e)).toMatchObject({ ok: false, retriable: true });
    expect(await mk(403).send(e)).toMatchObject({ ok: false, retriable: false });
    expect(await mk(200, { error: 'mal' }).send(e)).toMatchObject({ ok: false, retriable: false, message: 'mal' });
  });
  it('no envía lo que el backend no soporta ni sin token', async () => {
    const unsupported = makeEvent({ kind: 'request.resolve', property: P, actor: staff, requestId: 'x' });
    expect(await mk(200).send(unsupported)).toMatchObject({ ok: false, retriable: false });
    const noToken = new LegacyGateway({ ...cfg, token: '' });
    expect(await noToken.send(e)).toMatchObject({ ok: false, retriable: false });
  });
  it('PIN por nivel y vacío nunca entra', async () => {
    const g = mk(200);
    expect(await g.authenticate('recepcion', '1111')).not.toBeNull();
    expect(await g.authenticate('recepcion', '2222')).toBeNull();
    expect(await g.authenticate('dueno', '2222')).not.toBeNull();
    expect(await new LegacyGateway({ ...cfg, staffPin: '' }).authenticate('recepcion', '')).toBeNull();
  });
});

describe('auditoría y vista pública', () => {
  const { snapshot, issues } = fixture();
  const ctx = { snapshot, issues, property: P, date: TODAY, now: new Date('2026-10-24T18:00:00Z') };
  it('encuentra PII pública, fila falsa, dirección y conteo de habitaciones', () => {
    const r = runAudit({ ...ctx, raw: fixtureRaw() });
    const ids = r.findings.map((f) => f.check);
    expect(ids).toContain('privacy/pii-in-public-data');
    expect(ids).toContain('data/placeholder-room');
    expect(ids).toContain('data/address-mismatch');
    expect(ids).toContain('data/room-count-mismatch');
    expect(r.counts.error).toBeGreaterThan(0);
  });
  it('sin raw no inventa hallazgos de privacidad', () => {
    expect(runAudit(ctx).findings.map((f) => f.check)).not.toContain('privacy/pii-in-public-data');
  });
  it('la vista pública no contiene un solo nombre', () => {
    const s = demo();
    const json = JSON.stringify(toPublicView(s, P, TODAY));
    for (const st of s.stays) expect(json).not.toContain(st.guestName);
    expect(Object.keys(JSON.parse(json)).sort()).toEqual(['date', 'property', 'readyRooms', 'syncedAt', 'totalRooms']);
  });
});
