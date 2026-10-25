import type { HotelEvent } from './events.ts';
import { makeEvent } from './events.ts';
import { normalizeText, triage } from './triage.ts';
import type { Lang } from '@/lib/config.ts';
import { EXTRAS_CATALOG, HOTEL } from '@/lib/config.ts';

/**
 * Concierge: conversación → acción verificable. Núcleo del SkillRouter de KynicOS,
 * reducido a lo que hoy tiene backend. Sin LLM: clasificador determinista y probado.
 * Si no entiende, deriva a una persona por WhatsApp (nunca inventa).
 */

export type Intent = 'agua' | 'cafe' | 'kit' | 'amenidades' | 'mantenimiento' | 'otro';

const KEYWORDS: Record<Exclude<Intent, 'mantenimiento' | 'otro'>, readonly string[]> = {
  amenidades: ['toalla', 'almohada', 'sabana', 'cobija', 'towel', 'pillow', 'blanket', '毛巾', '枕头', 'handtuch', 'kissen', 'decke', 'serviette', 'oreiller', 'couverture'],
  kit: ['kit', 'aseo', 'jabon', 'shampoo', 'bambu', 'bamboo', 'toiletr', '洗漱', 'seife', 'savon'],
  cafe: ['cafe', 'coffee', '咖啡', 'kaffee'],
  agua: ['agua', 'water', '水', 'wasser', ' eau '],
};
const BREAKAGE = ['no funciona', 'descompuest', 'roto', 'falla', 'not working', 'broken', '坏', '故障', 'kaputt', 'defekt', 'panne', 'casse'];

export function classify(text: string): Intent {
  const t = normalizeText(text);
  if (triage(text) || BREAKAGE.some((k) => t.includes(k))) return 'mantenimiento';
  for (const intent of ['amenidades', 'kit', 'cafe', 'agua'] as const) {
    if (KEYWORDS[intent].some((k) => t.includes(k))) return intent;
  }
  return 'otro';
}

const COPY = {
  askRoom: {
    es: 'Por favor dime tu número de habitación 🙏',
    en: 'Please tell me your room number 🙏',
    zh: '请告诉我您的房间号 🙏',
    de: 'Bitte nenne mir deine Zimmernummer 🙏',
    fr: 'Pouvez-vous m’indiquer votre numéro de chambre ? 🙏',
  },
  extraOk: {
    es: (item: string, room: string) => `Listo: ${item} va en camino a la habitación ${room}.`,
    en: (item: string, room: string) => `Done: ${item} is on its way to room ${room}.`,
    zh: (item: string, room: string) => `好的：${item} 正在送往 ${room} 房间。`,
    de: (item: string, room: string) => `Erledigt: ${item} ist unterwegs zu Zimmer ${room}.`,
    fr: (item: string, room: string) => `C’est fait : ${item} arrive à la chambre ${room}.`,
  },
  requestOk: {
    es: (room: string) => `Avisé al equipo; ya van a la habitación ${room}.`,
    en: (room: string) => `I let the team know; they are heading to room ${room}.`,
    zh: (room: string) => `已通知团队，他们正前往 ${room} 房间。`,
    de: (room: string) => `Ich habe das Team informiert; es kommt zu Zimmer ${room}.`,
    fr: (room: string) => `J’ai prévenu l’équipe ; elle se rend à la chambre ${room}.`,
  },
  handoff: {
    es: 'No estoy seguro de haberte entendido. Escríbenos por WhatsApp y te atiende una persona.',
    en: 'I am not sure I understood. Message us on WhatsApp and a person will help you.',
    zh: '我不确定是否理解了您的意思。请通过 WhatsApp 联系我们，会有专人为您服务。',
    de: 'Ich bin nicht sicher, ob ich dich verstanden habe. Schreib uns per WhatsApp, eine Person hilft dir.',
    fr: 'Je ne suis pas sûr d’avoir compris. Écrivez-nous sur WhatsApp, une personne vous aidera.',
  },
} as const;

export type ConciergeOutcome =
  | { kind: 'ask-room'; reply: string }
  | { kind: 'action'; reply: string; event: HotelEvent; intent: Intent }
  | { kind: 'handoff'; reply: string; whatsapp: string };

export interface ConciergeInput {
  text: string;
  /** Si el huésped tocó un chip, la intención ya viene resuelta. */
  intent?: Intent;
  room: string;
  lang: Lang;
  guestName?: string;
  now?: Date;
}

export function concierge(input: ConciergeInput): ConciergeOutcome {
  const intent = input.intent ?? classify(input.text);
  const room = input.room.trim();

  if (intent === 'otro') {
    return { kind: 'handoff', reply: COPY.handoff[input.lang], whatsapp: HOTEL.whatsapp };
  }
  if (!room) return { kind: 'ask-room', reply: COPY.askRoom[input.lang] };

  const base = { property: HOTEL.propertyName, actor: { kind: 'guest' } as const };

  if (intent === 'agua' || intent === 'cafe' || intent === 'kit') {
    const item = EXTRAS_CATALOG.find((x) => x.id === intent);
    if (!item) return { kind: 'handoff', reply: COPY.handoff[input.lang], whatsapp: HOTEL.whatsapp };
    const event = makeEvent(
      { ...base, kind: 'extra.add', room, ...(input.guestName ? { guestName: input.guestName } : {}), item: item.name, qty: 1, unitPrice: item.price },
      input.now,
    );
    return { kind: 'action', intent, event, reply: COPY.extraOk[input.lang](item.name, room) };
  }

  const type = intent === 'amenidades' ? 'amenidades' : 'mantenimiento';
  const found = triage(input.text);
  const details = input.text.trim() || (type === 'amenidades' ? 'Toallas / amenidades' : 'Falla reportada');
  const event = makeEvent(
    {
      ...base,
      kind: 'request.add',
      room,
      ...(input.guestName ? { guestName: input.guestName } : {}),
      type,
      details,
      ...(found ? { priority: found.entry.priority } : {}),
    },
    input.now,
  );
  return { kind: 'action', intent, event, reply: COPY.requestOk[input.lang](room) };
}
