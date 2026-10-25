import { z } from 'zod';
import { HotelEventSchema, type HotelEvent } from '@/domain/events.ts';
import type { SendResult } from './types.ts';

/**
 * Cola de salida offline-first. Patrón portado de MueveCancun (`idb.ts` + `sync.ts`):
 * el evento se guarda primero en el dispositivo y se envía cuando hay red, en orden, sin duplicar.
 */

const ItemSchema = z.object({
  id: z.string(),
  event: HotelEventSchema,
  attempts: z.number().int().nonnegative(),
  state: z.enum(['pending', 'failed']),
  lastError: z.string().optional(),
});
export type OutboxItem = z.infer<typeof ItemSchema>;

export interface OutboxStore {
  getAll(): Promise<OutboxItem[]>;
  put(item: OutboxItem): Promise<void>;
  delete(id: string): Promise<void>;
}

export class MemoryOutboxStore implements OutboxStore {
  private m = new Map<string, OutboxItem>();
  async getAll(): Promise<OutboxItem[]> {
    return [...this.m.values()];
  }
  async put(item: OutboxItem): Promise<void> {
    this.m.set(item.id, item);
  }
  async delete(id: string): Promise<void> {
    this.m.delete(id);
  }
}

/** IndexedDB (navegador). Mismo esquema de apertura que MueveCancun, con tipos. */
export class IdbOutboxStore implements OutboxStore {
  private dbPromise: Promise<IDBDatabase> | null = null;
  constructor(
    private readonly dbName = 'cantabria-pms',
    private readonly store = 'outbox',
  ) {}

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(this.store)) req.result.createObjectStore(this.store, { keyPath: 'id' });
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => {
          db.close();
          this.dbPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => {
        this.dbPromise = null;
        reject(req.error);
      };
    });
    return this.dbPromise;
  }

  private async run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.store, mode);
      const req = fn(tx.objectStore(this.store));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAll(): Promise<OutboxItem[]> {
    const raw = await this.run('readonly', (s) => s.getAll());
    return raw.flatMap((x) => {
      const r = ItemSchema.safeParse(x);
      return r.success ? [r.data] : [];
    });
  }
  async put(item: OutboxItem): Promise<void> {
    await this.run('readwrite', (s) => s.put(item));
  }
  async delete(id: string): Promise<void> {
    await this.run('readwrite', (s) => s.delete(id));
  }
}

export interface DrainReport {
  sent: HotelEvent[];
  failed: number;
  remaining: number;
}

export class Outbox {
  private draining = false;

  constructor(
    private readonly store: OutboxStore,
    private readonly send: (e: HotelEvent) => Promise<SendResult>,
    private readonly maxAttempts = 8,
  ) {}

  async enqueue(event: HotelEvent): Promise<void> {
    await this.store.put({ id: event.id, event, attempts: 0, state: 'pending' });
  }

  private async ordered(): Promise<OutboxItem[]> {
    return (await this.store.getAll()).sort((a, b) => a.event.at.localeCompare(b.event.at));
  }

  async pending(): Promise<HotelEvent[]> {
    return (await this.ordered()).filter((i) => i.state === 'pending').map((i) => i.event);
  }

  async failed(): Promise<OutboxItem[]> {
    return (await this.ordered()).filter((i) => i.state === 'failed');
  }

  /** Reintenta lo fallido (p. ej. cuando el backend ya soporta la acción). */
  async retryFailed(): Promise<void> {
    for (const i of await this.failed()) await this.store.put({ ...i, state: 'pending', attempts: 0 });
  }

  async discard(id: string): Promise<void> {
    await this.store.delete(id);
  }

  /**
   * Envía en orden. Un fallo de red detiene la cola (se conserva el orden y se reintenta luego);
   * un rechazo definitivo marca ese evento como fallido y sigue con el resto.
   */
  async drain(): Promise<DrainReport> {
    if (this.draining) return { sent: [], failed: 0, remaining: (await this.pending()).length };
    this.draining = true;
    const sent: HotelEvent[] = [];
    let failed = 0;
    try {
      for (const item of (await this.ordered()).filter((i) => i.state === 'pending')) {
        const res = await this.send(item.event);
        if (res.ok) {
          await this.store.delete(item.id);
          sent.push(item.event);
          continue;
        }
        const attempts = item.attempts + 1;
        if (res.retriable && attempts < this.maxAttempts) {
          await this.store.put({ ...item, attempts, lastError: res.message });
          break;
        }
        await this.store.put({ ...item, attempts, state: 'failed', lastError: res.message });
        failed++;
      }
    } finally {
      this.draining = false;
    }
    return { sent, failed, remaining: (await this.pending()).length };
  }
}
