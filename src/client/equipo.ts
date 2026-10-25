import { HAT_DEFS, enabledHats, type Hat, type Person } from '@/domain/hats.ts';
import { makeEvent, type HotelEvent } from '@/domain/events.ts';
import type { Actor } from '@/domain/events.ts';
import { CHECKS, runAudit } from '@/domain/audit.ts';
import { confirmationMessage, parseReservationNotes, waLink } from '@/domain/booking.ts';
import { triage, type TriageResult } from '@/domain/triage.ts';
import {
  arrivalsOn, availableRooms, cleaningQueue, departuresOn, inHouse, occupancy, openRequests, ownerAttention,
  pendingBalances, pendingExtras, revenue, roomsOf, todayHotel, unassignedReservations,
} from '@/domain/selectors.ts';
import { ROOM_STATUS, type RoomStatus, type Stay } from '@/domain/types.ts';
import { PEOPLE } from '@/data/people.ts';
import { quote } from '@/domain/pricing.ts';
import { EXTRAS_CATALOG, HOTEL } from '@/lib/config.ts';
import { addDays } from '@/lib/dates.ts';
import type { Session } from '@/gateway/types.ts';
import { $, el, money } from './dom.ts';
import { Runtime } from './runtime.ts';

const P = HOTEL.propertyName;
const app = $('#app');
const SESSION_KEY = 'cantabria.session.v1';
const HAT_KEY = 'cantabria.hat.v1';

let rt: Runtime;
let session: Session | null = null;
let hat: Hat = 'recepcion';
let toastTimer: ReturnType<typeof setTimeout> | undefined;

const toast = (msg: string): void => {
  document.querySelector('.status')?.remove();
  const n = el('div', { class: 'status', role: 'status' }, msg);
  document.body.append(n);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => n.remove(), 3500);
};

const actor = (): Actor => ({ kind: 'staff', personId: session?.personId ?? 'desconocido', hat });
const pill = (text: string, cls = ''): HTMLElement => el('span', { class: `pill ${cls}`.trim() }, text);

/** Botón de dos toques: el primero pide confirmar, el segundo ejecuta. Deshabilitado si el backend no soporta la acción. */
function act(label: string, build: () => HotelEvent, done: string, opts: { ghost?: boolean } = {}): HTMLButtonElement {
  const supported = rt.gateway.supports(build());
  let armed: ReturnType<typeof setTimeout> | undefined;
  const btn = el('button', { type: 'button', class: opts.ghost ? 'ghost' : '', ...(supported ? {} : { disabled: true, title: 'El backend actual no soporta esta acción (ADR-009)' }) }, label);
  btn.addEventListener('click', async () => {
    if (!armed) {
      btn.textContent = 'Confirmar ✓';
      btn.classList.add('confirm');
      armed = setTimeout(() => { armed = undefined; btn.textContent = label; btn.classList.remove('confirm'); }, 4000);
      return;
    }
    clearTimeout(armed);
    btn.disabled = true;
    await rt.dispatch(build());
    toast(done);
  });
  return btn;
}

const item = (left: (Node | string)[], right: Node[] = []): HTMLElement =>
  el('div', { class: 'item' }, el('div', {}, ...left), el('div', { class: 'row tight' }, ...right));
const empty = (msg: string): HTMLElement => el('p', { class: 'muted' }, msg);
const section = (title: string, ...body: Node[]): HTMLElement => el('section', { class: 'card', style: 'margin-bottom:.75rem' }, el('h3', {}, title), ...body);
const roomSelect = (id: string, rooms: { roomId: string; type: string }[]): HTMLSelectElement =>
  el('select', { id }, ...rooms.map((r) => el('option', { value: r.roomId }, `${r.roomId} · ${r.type}`)));

/* ───────── Sombreros ───────── */

function viewRecepcion(): Node[] {
  const s = rt.view();
  const today = todayHotel();
  const out: Node[] = [];

  const arrivals = arrivalsOn(s, P, today);
  out.push(section('Llegadas de hoy', ...(arrivals.length === 0 ? [empty('Sin llegadas hoy.')] : arrivals.map((st) => arrivalRow(st, today)))));

  const waiting = unassignedReservations(s, P, today).filter((x) => !arrivals.includes(x));
  out.push(section('Reservas sin habitación', ...(waiting.length === 0 ? [empty('Todo asignado.')] : waiting.map((st) => reservationRow(st)))));

  const departures = departuresOn(s, P, today);
  out.push(section('Salidas de hoy', ...(departures.length === 0 ? [empty('Sin salidas hoy.')] : departures.map((st) => item([`Hab ${st.room ?? '—'} · ${st.guestName}`], [act('Check-out', () => makeEvent({ kind: 'stay.checkOut', property: P, actor: actor(), room: st.room ?? '' }), `Check-out hab ${st.room}`)])))));

  const balances = pendingBalances(s, P, today);
  out.push(section('Por cobrar (en casa)', ...(balances.length === 0 ? [empty('Nada pendiente.')] : balances.map((b) => item([`Hab ${b.stay.room} · ${b.stay.guestName}`], [pill(money(b.amount), 'media')]))), el('p', { class: 'muted' }, 'El registro de pago se habilita cuando el backend lo soporte (ADR-009).')));

  out.push(walkIn());
  return out;
}

function arrivalRow(st: Stay, today: string): HTMLElement {
  if (st.status === 'activa' && st.room) return item([`Hab ${st.room} · ${st.guestName}`], [pill('En casa', 'lista')]);
  const free = availableRooms(rt.view(), P, st.checkIn, st.checkOut, st.id).filter((r) => r.status === 'lista' || st.checkIn > today);
  if (free.length === 0) return item([`${st.guestName} · ${st.checkIn}→${st.checkOut}`, el('div', { class: 'muted' }, 'Sin habitaciones listas disponibles')], [pill('sin cuarto', 'alta')]);
  const sel = roomSelect(`r-${st.id}`, free);
  return item([`${st.guestName} · ${st.checkIn}→${st.checkOut}`], [sel, act('Check-in', () => makeEvent({ kind: 'stay.checkIn', property: P, actor: actor(), stayId: st.id, guestName: st.guestName, room: sel.value, checkIn: st.checkIn, checkOut: st.checkOut, rate: st.rate }), `Check-in ${st.guestName}`)]);
}

function reservationRow(st: Stay): HTMLElement {
  const meta = parseReservationNotes(st.notes);
  const buttons: Node[] = [];
  if (meta.ref) {
    const msg = confirmationMessage(meta.lang ?? 'es', { name: st.guestName, ref: meta.ref, checkIn: st.checkIn, checkOut: st.checkOut, rate: st.rate }, HOTEL.address);
    buttons.push(el('button', { type: 'button', class: 'ghost', onclick: async () => { await navigator.clipboard?.writeText(msg); toast('Confirmación copiada'); } }, 'Copiar confirmación'));
    if (meta.phone) buttons.push(el('a', { class: 'btn ghost', href: waLink(meta.phone, msg), target: '_blank', rel: 'noopener' }, 'WhatsApp'));
  }
  return item([`${st.guestName} · ${st.checkIn}→${st.checkOut}`, el('div', { class: 'muted' }, meta.ref ? `Ref ${meta.ref}` : 'Sin referencia')], buttons);
}

function walkIn(): HTMLElement {
  const today = todayHotel();
  const name = el('input', { placeholder: 'Nombre del huésped' });
  const nights = el('input', { type: 'number', min: '1', value: '1' });
  const rate = el('input', { type: 'number', min: '0', value: String(quote(todayHotel(), addDays(todayHotel(), 1)).avgRate) });
  const free = availableRooms(rt.view(), P, today, addDays(today, 1)).filter((r) => r.status === 'lista');
  if (free.length === 0) return section('Sin reserva previa (walk-in)', empty('No hay habitaciones listas ahora.'));
  const sel = roomSelect('walkin-room', free);
  const build = (): HotelEvent => makeEvent({ kind: 'stay.checkIn', property: P, actor: actor(), guestName: name.value.trim() || 'Huésped', room: sel.value, checkIn: today, checkOut: addDays(today, Math.max(1, Number(nights.value) || 1)), rate: Number(rate.value) || 0 });
  return section('Sin reserva previa (walk-in)', el('div', { class: 'row' }, name, sel, nights, rate), el('div', { style: 'margin-top:.5rem' }, act('Registrar check-in', build, 'Walk-in registrado')));
}

function viewLimpieza(): Node[] {
  const s = rt.view();
  const queue = cleaningQueue(s, P, todayHotel());
  const next: Partial<Record<RoomStatus, RoomStatus>> = { sucia: 'proceso', proceso: 'lista' };
  const list = queue.length === 0 ? [empty('Todo limpio. 🎉')] : queue.map(({ room, reason }) => {
    const target = next[room.status];
    return item([`Hab ${room.roomId} · ${room.type}`, el('div', { class: 'muted' }, reason === 'llegada' ? 'Llega huésped hoy' : reason === 'salida' ? 'Salió hoy' : 'Pendiente')], [
      pill(room.status, room.status),
      ...(target ? [act(target === 'proceso' ? 'Empezar' : 'Lista ✓', () => makeEvent({ kind: 'room.setStatus', property: P, actor: actor(), room: room.roomId, status: target }), `Hab ${room.roomId} → ${target}`)] : []),
    ]);
  });
  return [section('Qué limpiar primero', ...list), reportFault()];
}

function reportFault(): HTMLElement {
  const rooms = roomsOf(rt.view(), P);
  const sel = roomSelect('fault-room', rooms);
  const text = el('input', { placeholder: 'Qué falla (ej. fuga en el baño)' });
  return section('Reportar una falla', el('div', { class: 'row' }, sel, text), el('div', { style: 'margin-top:.5rem' }, act('Avisar a mantenimiento', () => makeEvent({ kind: 'request.add', property: P, actor: actor(), room: sel.value, type: 'mantenimiento', details: text.value.trim() || 'Falla reportada', ...(triage(text.value) ? { priority: triage(text.value)!.entry.priority } : {}) }), 'Falla reportada')));
}

function viewMantenimiento(): Node[] {
  const s = rt.view();
  const list = openRequests(s, P).filter((r) => r.type === 'mantenimiento');
  const out: Node[] = [section('Fallas abiertas', ...(list.length === 0 ? [empty('Sin fallas abiertas.')] : list.map((r) => item([`Hab ${r.room || '—'} · ${r.details}`], [pill(r.priority, r.priority), act('Resolver', () => makeEvent({ kind: 'request.resolve', property: P, actor: actor(), requestId: r.id }), 'Falla resuelta')]))))];

  const blocked = roomsOf(s, P).filter((r) => r.status === 'bloqueada');
  if (blocked.length > 0) out.push(section('Habitaciones bloqueadas', ...blocked.map((r) => item([`Hab ${r.roomId}`], [act('Liberar', () => makeEvent({ kind: 'room.setStatus', property: P, actor: actor(), room: r.roomId, status: 'sucia' }), `Hab ${r.roomId} liberada`)]))));

  const sel = roomSelect('tri-room', roomsOf(s, P));
  const text = el('textarea', { rows: '2', placeholder: 'Describe la falla…' });
  const result = el('div', {});
  const analyze = el('button', { type: 'button', class: 'ghost', onclick: () => renderTriage(result, triage(text.value), sel.value, text.value) }, 'Diagnóstico rápido');
  out.push(section('Diagnóstico rápido', el('div', { class: 'grid' }, sel, text, analyze, result)));
  return out;
}

function renderTriage(box: HTMLElement, r: TriageResult | null, room: string, details: string): void {
  box.replaceChildren();
  if (!r) { box.append(empty('Sin coincidencia: se abre como falla general (prioridad baja).')); }
  else {
    box.append(
      el('p', {}, el('b', {}, r.entry.label), ' ', pill(r.entry.priority, r.entry.priority), ` · ~${r.entry.etaMinutes} min`),
      el('p', { class: 'muted' }, 'Causas probables:'), el('ul', {}, ...r.entry.causes.map((c) => el('li', {}, c))),
      el('p', { class: 'muted' }, 'Pregunta al huésped:'), el('ul', {}, ...r.entry.questions.map((q) => el('li', {}, q))),
    );
  }
  const ticket = act('Abrir ticket', () => makeEvent({ kind: 'request.add', property: P, actor: actor(), room, type: 'mantenimiento', details: details.trim() || 'Falla reportada', ...(r ? { priority: r.entry.priority } : {}) }), 'Ticket abierto');
  box.append(el('div', { class: 'row tight' }, ticket, ...(r?.entry.blocksRoom ? [act('Bloquear habitación', () => makeEvent({ kind: 'room.setStatus', property: P, actor: actor(), room, status: 'bloqueada' }), `Hab ${room} bloqueada`, { ghost: true })] : [])));
}

function viewConcierge(): Node[] {
  const s = rt.view();
  const reqs = openRequests(s, P);
  const extras = pendingExtras(s, P);
  const sel = roomSelect('ex-room', roomsOf(s, P));
  const itemSel = el('select', { id: 'ex-item' }, ...EXTRAS_CATALOG.map((x) => el('option', { value: x.id }, `${x.name} · ${money(x.price)}`)));
  const qty = el('input', { type: 'number', min: '1', value: '1' });
  const build = (): HotelEvent => { const it = EXTRAS_CATALOG.find((x) => x.id === itemSel.value) ?? EXTRAS_CATALOG[0]; return makeEvent({ kind: 'extra.add', property: P, actor: actor(), room: sel.value, item: it.name, qty: Math.max(1, Number(qty.value) || 1), unitPrice: it.price }); };
  return [
    section('Solicitudes de huéspedes', ...(reqs.length === 0 ? [empty('Sin solicitudes abiertas.')] : reqs.map((r) => item([`Hab ${r.room || '—'} · ${r.details}`], [pill(r.type), act('Resolver', () => makeEvent({ kind: 'request.resolve', property: P, actor: actor(), requestId: r.id }), 'Solicitud resuelta')])))),
    section('Pedidos por entregar', ...(extras.length === 0 ? [empty('Nada pendiente.')] : extras.map((x) => item([`Hab ${x.room} · ${x.qty}× ${x.item}`], [act('Entregado', () => makeEvent({ kind: 'extra.deliver', property: P, actor: actor(), extraId: x.id }), 'Entregado')])))),
    section('Registrar extra', el('div', { class: 'row' }, sel, itemSel, qty), el('div', { style: 'margin-top:.5rem' }, act('Cargar a la habitación', build, 'Extra registrado'))),
  ];
}

function viewDueno(): Node[] {
  const s = rt.view();
  const today = todayHotel();
  const occ = occupancy(s, P, today);
  const rev = revenue(s, P, today);
  const kpi = (label: string, value: string, note = ''): HTMLElement => el('div', { class: 'card kpi' }, el('span', { class: 'muted' }, label), el('b', {}, value), note ? el('span', { class: 'muted' }, note) : null);
  const attention = ownerAttention(s, P, today);
  const audit = runAudit({ snapshot: s, issues: rt.issues, property: P, date: today, now: new Date() }, CHECKS);
  return [
    el('div', { class: 'kpis', style: 'margin-bottom:.75rem' },
      kpi('Ocupación esta noche', `${occ.pct}%`, `${occ.occupied} de ${occ.total} habitaciones`),
      kpi('Hospedaje esta noche', money(rev.lodgingTonight), `${inHouse(s, P, today).length} estancias en casa`),
      kpi('Reservado 7 días', money(rev.bookedNext7Days), 'noches × tarifa'),
      kpi('Extras hoy', money(rev.extrasToday)),
      kpi('Solicitudes abiertas', String(openRequests(s, P).length))),
    section('Requiere tu atención', ...(attention.length === 0 ? [empty('Nada urgente.')] : attention.map((a) => item([a.text], [pill(a.level, a.level)])))),
    section(`Calidad de datos · 🔴 ${audit.counts.error} 🟡 ${audit.counts.warn} ⚪ ${audit.counts.info}`, ...(audit.findings.length === 0 ? [empty('Sin hallazgos.')] : audit.findings.slice(0, 8).map((f) => item([f.message, f.fix ? el('div', { class: 'muted' }, f.fix) : ''], [pill(f.severity, f.severity === 'info' ? '' : f.severity)])))),
  ];
}

const VIEWS: Record<Hat, () => Node[]> = {
  recepcion: viewRecepcion, limpieza: viewLimpieza, mantenimiento: viewMantenimiento, concierge: viewConcierge, dueno: viewDueno,
  inventario: () => [empty('Próximamente (ADR-008).')], logistica: () => [empty('Próximamente (ADR-008).')],
};

/* ───────── Shell ───────── */

function renderLogin(): void {
  const personSel = el('select', { id: 'person' }, ...PEOPLE.map((p: Person) => el('option', { value: p.id }, p.name)));
  const pin = el('input', { id: 'pin', type: 'password', inputmode: 'numeric', autocomplete: 'off', placeholder: 'PIN' });
  const msg = el('p', { class: 'muted', role: 'alert' });
  const go = async (): Promise<void> => {
    const s = await rt.gateway.authenticate(personSel.value, pin.value);
    if (!s) { msg.textContent = 'PIN incorrecto.'; return; }
    session = s;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    await rt.refresh();
    hat = enabledHats(s.hats).find((h) => h === localStorage.getItem(`${HAT_KEY}.${s.personId}`)) ?? enabledHats(s.hats)[0] ?? 'recepcion';
    render();
  };
  pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') void go(); });
  app.replaceChildren(
    el('h1', {}, 'Entrar a mi turno'),
    el('p', { class: 'muted' }, rt.gateway.mode === 'demo' ? 'Modo demo: los datos viven solo en este dispositivo. PIN de demo: 0000.' : 'Hotel Cantabria Tulancingo'),
    el('div', { class: 'card grid' }, el('div', {}, el('label', { for: 'person' }, '¿Quién eres?'), personSel), el('div', {}, el('label', { for: 'pin' }, 'PIN'), pin), el('button', { type: 'button', onclick: () => void go() }, 'Entrar'), msg),
    el('p', {}, el('a', { href: $('#app').dataset.base ?? '/' }, '← Volver al sitio')),
  );
}

function render(): void {
  if (!session) return renderLogin();
  const s = session;
  const failed = 0;
  const tabs = enabledHats(s.hats).map((h) => el('button', { type: 'button', 'aria-pressed': String(h === hat), onclick: () => { hat = h; localStorage.setItem(`${HAT_KEY}.${s.personId}`, h); render(); } }, HAT_DEFS[h].label));
  const pend = rt.pendingCount();
  const parts: (Node | null)[] = [
    el('div', { class: 'bar' },
      el('div', {}, el('h1', {}, HAT_DEFS[hat].label), el('p', { class: 'muted' }, HAT_DEFS[hat].blurb)),
      el('div', { class: 'row tight' },
        rt.gateway.mode === 'demo' ? el('span', { class: 'mode-demo' }, 'DEMO') : null,
        pend + failed > 0 ? pill(`${pend} por enviar`, 'media') : null,
        el('button', { type: 'button', class: 'ghost', onclick: () => { sessionStorage.removeItem(SESSION_KEY); session = null; render(); } }, `${s.name} · Salir`))),
    el('div', { class: 'hats' }, ...tabs),
    ...VIEWS[hat](),
    rt.gateway.mode === 'demo' ? el('p', {}, el('button', { type: 'button', class: 'ghost', onclick: () => { localStorage.removeItem('cantabria.demo.events.v1'); void rt.refresh(); toast('Demo reiniciada'); } }, 'Reiniciar demo')) : null,
  ];
  app.replaceChildren(...parts.filter((n): n is Node => n !== null));
}

void (async () => {
  rt = await Runtime.create();
  rt.onChange(() => { if (session && !document.activeElement?.matches('input, textarea, select')) render(); });
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
    if (saved && typeof saved === 'object' && 'personId' in saved && 'hats' in saved) {
      session = saved as Session;
      rt.gateway.resume?.(session);
      await rt.refresh();
    }
  } catch { /* sin sesión */ }
  if (session) hat = enabledHats(session.hats).find((h) => h === localStorage.getItem(`${HAT_KEY}.${session?.personId}`)) ?? enabledHats(session.hats)[0] ?? 'recepcion';
  render();
})();

export { ROOM_STATUS };
