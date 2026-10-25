import { concierge, type Intent } from '@/domain/concierge.ts';
import { makeEvent } from '@/domain/events.ts';
import { makeReference, normalizePhone, validateBooking, waLink } from '@/domain/booking.ts';
import { HOTEL, isLang, type Lang } from '@/lib/config.ts';
import { quote } from '@/domain/pricing.ts';
import { todayIn } from '@/lib/dates.ts';
import { $, el } from './dom.ts';
import { Runtime } from './runtime.ts';

interface LandingData {
  lang: Lang;
  base: string;
  copy: { bookDone: string; errors: string; ticketT: string; ticketRef: string; ticketTxt: string; waPrefill: string; liveNote: string };
  whatsapp: string;
  rate: number;
}

const raw: unknown = JSON.parse($('#landing-data').textContent ?? '{}');
const data = raw as LandingData;
const lang: Lang = isLang(data.lang) ? data.lang : 'es';

const runtimePromise = Runtime.create({ loadSnapshot: false });

/* Disponibilidad pública: solo conteos, nunca nombres (public.json). */
void (async () => {
  try {
    const res = await fetch(`${data.base}public.json`, { cache: 'no-store' });
    if (!res.ok) return;
    const v: unknown = await res.json();
    if (v && typeof v === 'object' && 'readyRooms' in v && typeof v.readyRooms === 'number' && v.readyRooms > 0) {
      const note = $('#live-note');
      note.textContent = `${v.readyRooms} · ${data.copy.liveNote}`;
      note.hidden = false;
    }
  } catch { /* sin red: la landing funciona igual */ }
})();

/* Reserva directa → evento stay.reserve → cola offline → backend. */
$<HTMLButtonElement>('#b-send').addEventListener('click', async () => {
  const name = $<HTMLInputElement>('#b-name').value;
  const checkIn = $<HTMLInputElement>('#b-in').value;
  const checkOut = $<HTMLInputElement>('#b-out').value;
  const phoneRaw = $<HTMLInputElement>('#b-phone').value;
  const err = $('#b-error');
  if (validateBooking({ name, checkIn, checkOut }, todayIn(HOTEL.timeZone))) {
    err.textContent = data.copy.errors;
    err.classList.remove('hidden');
    return;
  }
  err.classList.add('hidden');
  const reference = makeReference();
  const phone = phoneRaw.trim() ? normalizePhone(phoneRaw) : null;
  const event = makeEvent({
    kind: 'stay.reserve',
    property: HOTEL.propertyName,
    actor: { kind: 'guest' },
    guestName: name.trim(),
    checkIn,
    checkOut,
    rate: quote(checkIn, checkOut).avgRate,
    reference,
    lang,
    ...(phone ? { phone } : {}),
  });
  await (await runtimePromise).dispatch(event);
  $('#t-ref').textContent = reference;
  $<HTMLAnchorElement>('#t-wa').href = waLink(data.whatsapp, `${data.copy.waPrefill} ${reference}`);
  $('#book-card').classList.add('hidden');
  $('#ticket').classList.remove('hidden');
  /* Conversion: aterrizar en la pagina de confirmacion medible (GA4/Ads). */
  const q = `?ref=${encodeURIComponent(reference)}&lang=${lang}&in=${encodeURIComponent(checkIn)}&out=${encodeURIComponent(checkOut)}`;
  window.setTimeout(() => window.location.assign(`${data.base}confirmacion${q}`), 500);
});

/* Concierge: chips o texto libre → acción verificable o traspaso a una persona. */
async function ask(text: string, intent?: Intent): Promise<void> {
  const room = $<HTMLInputElement>('#c-room').value;
  const log = $('#c-log');
  const out = concierge({ text, room, lang, ...(intent ? { intent } : {}) });
  log.append(el('div', { class: 'bubble' }, out.reply));
  if (out.kind === 'action') await (await runtimePromise).dispatch(out.event);
  if (out.kind === 'handoff') {
    log.append(el('a', { class: 'btn ghost', href: waLink(out.whatsapp, text), target: '_blank', rel: 'noopener' }, 'WhatsApp'));
  }
}
$('#chips').addEventListener('click', (ev) => {
  const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-intent]');
  if (btn) void ask(btn.textContent ?? '', btn.dataset.intent as Intent);
});
$('#c-send').addEventListener('click', () => {
  const input = $<HTMLInputElement>('#c-text');
  if (input.value.trim()) void ask(input.value);
  input.value = '';
});
