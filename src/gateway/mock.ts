import { HotelEventSchema, type HotelEvent } from '@/domain/events.ts';
import { applyEvent } from '@/domain/reducer.ts';
import type { Snapshot } from '@/domain/types.ts';
import { PEOPLE } from '@/data/people.ts';
import { buildDemoSnapshot } from '@/data/seed.ts';
import type { Gateway, KeyValueStore, SendResult, Session } from './types.ts';

const KEY = 'cantabria.demo.events.v1';

/**
 * Gateway de demostración: estado = semilla de hoy + registro de eventos persistido en el navegador.
 * Nada sale del dispositivo. Todas las acciones funcionan (incluye resolver solicitudes y entregar extras).
 */
export class MockGateway implements Gateway {
  readonly mode = 'demo' as const;

  constructor(
    private readonly kv: KeyValueStore,
    private readonly today: () => string,
    private readonly pin: string = '0000',
  ) {}

  private events(): HotelEvent[] {
    const raw = this.kv.get(KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((x) => {
        const r = HotelEventSchema.safeParse(x);
        return r.success ? [r.data] : [];
      });
    } catch {
      return [];
    }
  }

  async loadSnapshot(): Promise<{ snapshot: Snapshot; issues: [] }> {
    const base = buildDemoSnapshot(this.today());
    const snapshot = this.events().reduce(applyEvent, base);
    return { snapshot: { ...snapshot, syncedAt: new Date().toISOString() }, issues: [] };
  }

  async authenticate(personId: string, pin: string): Promise<Session | null> {
    const person = PEOPLE.find((p) => p.id === personId);
    if (!person || pin !== this.pin) return null;
    return { personId: person.id, name: person.name, hats: [...person.hats] };
  }

  async send(event: HotelEvent): Promise<SendResult> {
    const next = [...this.events().filter((e) => e.id !== event.id), event];
    this.kv.set(KEY, JSON.stringify(next));
    return { ok: true };
  }

  supports(): boolean {
    return true;
  }

  /** Borra el registro de la demo y vuelve a la semilla. */
  reset(): void {
    this.kv.remove(KEY);
  }
}
