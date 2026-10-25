import { applyEvents } from '@/domain/reducer.ts';
import { HotelEventSchema, type HotelEvent } from '@/domain/events.ts';
import { emptySnapshot, type DataIssue, type Snapshot } from '@/domain/types.ts';
import { createGateway } from '@/gateway/index.ts';
import { IdbOutboxStore, Outbox } from '@/gateway/outbox.ts';
import type { Gateway } from '@/gateway/types.ts';

const SENT_KEY = 'cantabria.sent.v1';

/**
 * Pegamento del navegador: gateway + cola offline + estado optimista.
 * Vista = snapshot del servidor + eventos pendientes + enviados que el snapshot aún no refleja.
 */
export class Runtime {
  snapshot: Snapshot = emptySnapshot();
  issues: DataIssue[] = [];
  private pending: HotelEvent[] = [];
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | undefined;

  private constructor(
    readonly gateway: Gateway,
    readonly outbox: Outbox,
  ) {}

  static async create(opts: { loadSnapshot: boolean } = { loadSnapshot: true }): Promise<Runtime> {
    const gateway = createGateway();
    const outbox = new Outbox(new IdbOutboxStore(), (e) => gateway.send(e));
    const rt = new Runtime(gateway, outbox);
    if (opts.loadSnapshot) await rt.refresh();
    await rt.syncPending();
    addEventListener('online', () => void rt.flush());
    if (opts.loadSnapshot) rt.timer = setInterval(() => void rt.refresh(), 60_000);
    void rt.flush();
    return rt;
  }

  private sent(): HotelEvent[] {
    try {
      const raw: unknown = JSON.parse(sessionStorage.getItem(SENT_KEY) ?? '[]');
      return Array.isArray(raw) ? raw.flatMap((x) => { const r = HotelEventSchema.safeParse(x); return r.success ? [r.data] : []; }) : [];
    } catch {
      return [];
    }
  }
  private rememberSent(events: HotelEvent[]): void {
    if (events.length === 0) return;
    try {
      sessionStorage.setItem(SENT_KEY, JSON.stringify([...this.sent(), ...events].slice(-50)));
    } catch { /* sin sessionStorage: la vista se corrige en el siguiente snapshot */ }
  }

  private async syncPending(): Promise<void> {
    this.pending = await this.outbox.pending();
    this.emit();
  }

  /** Estado que ve la UI. */
  view(): Snapshot {
    const sentNotYetPublished = this.sent().filter((e) => e.at > this.snapshot.syncedAt);
    return applyEvents(this.snapshot, [...sentNotYetPublished, ...this.pending]);
  }

  pendingCount(): number {
    return this.pending.length;
  }

  async refresh(): Promise<void> {
    try {
      const { snapshot, issues } = await this.gateway.loadSnapshot();
      this.snapshot = snapshot;
      this.issues = issues;
    } catch (err) {
      console.warn('No se pudo actualizar el snapshot', err);
    }
    this.emit();
  }

  async dispatch(event: HotelEvent): Promise<void> {
    await this.outbox.enqueue(event);
    await this.syncPending();
    await this.flush();
  }

  async flush(): Promise<void> {
    const report = await this.outbox.drain();
    this.rememberSent(report.sent);
    await this.syncPending();
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit(): void {
    for (const fn of this.listeners) fn();
  }
  dispose(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
