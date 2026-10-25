import type { Hat } from '@/domain/hats.ts';
import type { HotelEvent } from '@/domain/events.ts';
import type { DataIssue, Snapshot } from '@/domain/types.ts';

export type SendResult = { ok: true } | { ok: false; retriable: boolean; message: string };

export interface Session {
  personId: string;
  name: string;
  hats: Hat[];
  /** Token de sesión firmado por el servidor (solo modo proxy). */
  token?: string;
}

/**
 * Frontera con el backend. La UI y el dominio solo conocen esta interfaz;
 * cambiar Base44 por otra cosa (ADR-009) es escribir otro Gateway, no tocar pantallas.
 */
export interface Gateway {
  readonly mode: 'demo' | 'legacy' | 'proxy';
  loadSnapshot(): Promise<{ snapshot: Snapshot; issues: DataIssue[] }>;
  authenticate(personId: string, pin: string): Promise<Session | null>;
  send(event: HotelEvent): Promise<SendResult>;
  /** ¿El backend entiende este evento? Si no, la UI lo deshabilita en vez de fallar en silencio. */
  supports(event: HotelEvent): boolean;
  /** Restaura una sesión guardada (p. ej. tras recargar la página). */
  resume?(session: Session): void;
}

/** Almacén clave-valor mínimo (localStorage en el navegador, Map en pruebas). */
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export class MemoryKV implements KeyValueStore {
  private m = new Map<string, string>();
  get(key: string): string | null {
    return this.m.get(key) ?? null;
  }
  set(key: string, value: string): void {
    this.m.set(key, value);
  }
  remove(key: string): void {
    this.m.delete(key);
  }
}
