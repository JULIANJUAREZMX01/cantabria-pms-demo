import { extractDataJs, parseSnapshot } from '@/domain/legacy.ts';
import { isLegacySupported, type HotelEvent } from '@/domain/events.ts';
import { emptySnapshot } from '@/domain/types.ts';
import type { Gateway, SendResult, Session } from './types.ts';

export interface ProxyConfig {
  /** Prefijo del sitio (BASE_URL); la API vive en `${apiBase}api/*`. */
  apiBase: string;
  fetchImpl?: typeof fetch;
}

/**
 * Gateway de producción (Netlify): el navegador NO tiene token ni PIN.
 * Login y escrituras pasan por /api/*, que verifica PIN, firma la sesión y reenvía a Base44 con el token guardado en el servidor.
 * Los datos con PII solo se leen con sesión (/api/snapshot).
 */
export class ProxyGateway implements Gateway {
  readonly mode = 'proxy' as const;
  private token: string | undefined;
  private readonly f: typeof fetch;

  constructor(private readonly cfg: ProxyConfig) {
    this.f = cfg.fetchImpl ?? ((...a) => fetch(...a));
  }

  private url(path: string): string {
    return `${this.cfg.apiBase}api/${path}`;
  }

  resume(session: Session): void {
    this.token = session.token;
  }

  async loadSnapshot() {
    if (!this.token) return { snapshot: emptySnapshot(), issues: [] };
    const res = await this.f(this.url('snapshot'), { headers: { authorization: `Bearer ${this.token}` }, cache: 'no-store' });
    if (res.status === 401) {
      this.token = undefined;
      return { snapshot: emptySnapshot(), issues: [] };
    }
    if (!res.ok) throw new Error(`No se pudo leer el snapshot (${res.status})`);
    return parseSnapshot(extractDataJs(await res.text()));
  }

  async authenticate(personId: string, pin: string): Promise<Session | null> {
    const res = await this.f(this.url('login'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ personId, pin }) });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as { token?: string; session?: Omit<Session, 'token'> } | null;
    if (!body?.token || !body.session) return null;
    this.token = body.token;
    return { ...body.session, token: body.token };
  }

  supports(event: HotelEvent): boolean {
    return isLegacySupported(event);
  }

  async send(event: HotelEvent): Promise<SendResult> {
    try {
      const res = await this.f(this.url('event'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(this.token ? { authorization: `Bearer ${this.token}` } : {}) },
        body: JSON.stringify(event),
      });
      if (res.status >= 500) return { ok: false, retriable: true, message: `Servidor no disponible (${res.status})` };
      if (res.status === 401) return { ok: false, retriable: false, message: 'Sesión vencida: vuelve a entrar a tu turno.' };
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, retriable: false, message: body?.error ?? `Rechazado (${res.status})` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, retriable: true, message: err instanceof Error ? err.message : 'Sin conexión' };
    }
  }
}
