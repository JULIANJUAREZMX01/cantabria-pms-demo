import { extractDataJs, parseSnapshot } from '@/domain/legacy.ts';
import { isLegacySupported, toLegacyPayload, type HotelEvent } from '@/domain/events.ts';
import { PEOPLE } from '@/data/people.ts';
import type { Gateway, SendResult, Session } from './types.ts';

export interface LegacyConfig {
  /** URL de la función `cantabriaWrite` de Base44. */
  writeApi: string;
  /** Token compartido actual. Está en el bundle: es deuda conocida (ADR-009). */
  token: string;
  staffPin: string;
  ownerPin: string;
  /** Prefijo donde se sirve `data.js` (BASE_URL de Astro). */
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

/**
 * Gateway del contrato actual: lee `data.js` (publicado por `cantabriaPublish`) y escribe con
 * `cantabriaWrite`. PIN por nivel validado en el cliente, igual que hoy. Misma seguridad que v6, sin PIN en el repo.
 */
export class LegacyGateway implements Gateway {
  readonly mode = 'legacy' as const;
  private readonly f: typeof fetch;

  constructor(private readonly cfg: LegacyConfig) {
    this.f = cfg.fetchImpl ?? ((...a) => fetch(...a));
  }

  async loadSnapshot() {
    const res = await this.f(`${this.cfg.baseUrl}data.js?ts=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`No se pudo leer data.js (${res.status})`);
    return parseSnapshot(extractDataJs(await res.text()));
  }

  async authenticate(personId: string, pin: string): Promise<Session | null> {
    const person = PEOPLE.find((p) => p.id === personId);
    if (!person) return null;
    const expected = person.hats.includes('dueno') ? this.cfg.ownerPin : this.cfg.staffPin;
    if (!expected || pin !== expected) return null;
    return { personId: person.id, name: person.name, hats: [...person.hats] };
  }

  supports(event: HotelEvent): boolean {
    return isLegacySupported(event);
  }

  async send(event: HotelEvent): Promise<SendResult> {
    const payload = toLegacyPayload(event);
    if (!payload) return { ok: false, retriable: false, message: 'El backend actual no soporta esta acción (ver ADR-009).' };
    if (!this.cfg.token) return { ok: false, retriable: false, message: 'Falta PUBLIC_WRITE_TOKEN en el despliegue.' };
    try {
      const res = await this.f(this.cfg.writeApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.cfg.token, ...payload }),
      });
      if (res.status >= 500) return { ok: false, retriable: true, message: `Servidor no disponible (${res.status})` };
      if (!res.ok) return { ok: false, retriable: false, message: `Rechazado por el servidor (${res.status})` };
      const body: unknown = await res.json().catch(() => null);
      if (body && typeof body === 'object' && 'error' in body && body.error) {
        return { ok: false, retriable: false, message: String(body.error) };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, retriable: true, message: err instanceof Error ? err.message : 'Sin conexión' };
    }
  }
}
