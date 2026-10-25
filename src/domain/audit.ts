import { conflicts, overdueDepartures } from './selectors.ts';
import type { DataIssue, ISODate, Snapshot } from './types.ts';
import { HOTEL } from '@/lib/config.ts';
import { normalizePhone } from './booking.ts';

/**
 * Auditoría de integridad. Patrón registry + reporter portado de python-orchestrator-node
 * (`tool_registry.yaml` + `reporters/json_reporter.py`): cada chequeo es una función pura registrada,
 * el reporte sale en JSON y Markdown. La misma lista corre en CI semanal, en el build y en la vista del dueño.
 */

export type Severity = 'error' | 'warn' | 'info';

export interface Finding {
  check: string;
  severity: Severity;
  message: string;
  /** Qué hacer, en una línea. */
  fix?: string;
}

export interface AuditContext {
  snapshot: Snapshot;
  issues: readonly DataIssue[];
  property: string;
  date: ISODate;
  now: Date;
  /** JSON crudo de data.js. Solo disponible en scripts/CI; los chequeos de privacidad lo necesitan. */
  raw?: unknown;
}

export interface Check {
  id: string;
  title: string;
  run(ctx: AuditContext): Finding[];
}

const SAMPLE_NAME = /prueba|fulanito|\bdemo\b|\btest\b/i;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;

const rawList = (raw: unknown, key: string): Record<string, unknown>[] => {
  if (!raw || typeof raw !== 'object') return [];
  const v = (raw as Record<string, unknown>)[key];
  return Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object') : [];
};

export const CHECKS: readonly Check[] = [
  {
    id: 'consistency/overlap',
    title: 'Sobreventa: estancias traslapadas en la misma habitación',
    run: ({ snapshot, property }) =>
      conflicts(snapshot, property).map((c) => ({
        check: 'consistency/overlap',
        severity: 'error' as const,
        message: `Hab ${c.room}: ${c.a.guestName} (${c.a.checkIn}→${c.a.checkOut}) y ${c.b.guestName} (${c.b.checkIn}→${c.b.checkOut}).`,
        fix: 'Reasignar una de las dos estancias a una habitación libre.',
      })),
  },
  {
    id: 'consistency/duplicate-reservation',
    title: 'Reserva duplicada tras check-in (el backend crea otra estancia)',
    run: ({ snapshot, property }) => {
      const out: Finding[] = [];
      const reserved = snapshot.stays.filter((s) => s.property === property && s.status === 'reservada');
      for (const r of reserved) {
        const twin = snapshot.stays.find(
          (s) => s.id !== r.id && s.property === property && s.status === 'activa' && s.guestName === r.guestName && s.checkIn === r.checkIn && s.checkOut === r.checkOut,
        );
        if (twin) {
          out.push({
            check: 'consistency/duplicate-reservation',
            severity: 'warn',
            message: `${r.guestName} tiene reserva y estancia activa con las mismas fechas.`,
            fix: 'Cancelar la reserva sobrante. Causa raíz: `checkIn` no acepta `stay_id` (ADR-009).',
          });
        }
      }
      return out;
    },
  },
  {
    id: 'consistency/overdue-checkout',
    title: 'Check-out pendiente después de la fecha de salida',
    run: ({ snapshot, property, date }) =>
      overdueDepartures(snapshot, property, date).map((s) => ({
        check: 'consistency/overdue-checkout',
        severity: 'warn' as const,
        message: `${s.guestName} (hab ${s.room ?? '—'}) debió salir el ${s.checkOut}.`,
        fix: 'Hacer check-out o corregir la fecha de salida.',
      })),
  },
  {
    id: 'ops/stale-requests',
    title: 'Solicitudes abiertas por más de 24 h',
    run: ({ snapshot, property, now }) =>
      snapshot.requests
        .filter((r) => r.property === property && r.status !== 'resuelto' && r.createdAt && now.getTime() - Date.parse(r.createdAt) > 86_400_000)
        .map((r) => ({
          check: 'ops/stale-requests',
          severity: 'warn' as const,
          message: `Solicitud abierta desde ${r.createdAt.slice(0, 10)} en hab ${r.room || '—'}: ${r.details.slice(0, 60)}`,
          fix: 'Resolverla o cerrarla.',
        })),
  },
  {
    id: 'data/enums',
    title: 'Valores heredados o desconocidos en estados',
    run: ({ issues }) => {
      const legacy = issues.filter((i) => i.code === 'legacy-enum').length;
      const unknown = issues.filter((i) => i.code === 'unknown-enum');
      const out: Finding[] = unknown.map((i) => ({ check: 'data/enums', severity: 'warn' as const, message: i.message, fix: 'Corregir el valor en la base.' }));
      if (legacy > 0) {
        out.push({
          check: 'data/enums',
          severity: 'info',
          message: `${legacy} registro(s) usan valores heredados (p. ej. checked_in, paid). Se normalizan al leer.`,
          fix: 'Unificar los valores en el backend para quitar la traducción.',
        });
      }
      return out;
    },
  },
  {
    id: 'data/placeholder-room',
    title: 'Filas que no son habitaciones físicas',
    run: ({ issues }) =>
      issues
        .filter((i) => i.code === 'placeholder-room')
        .map((i) => ({ check: 'data/placeholder-room', severity: 'warn' as const, message: i.message, fix: 'Quitar la fila de la tabla de habitaciones; "Por asignar" es un estado de la reserva.' })),
  },
  {
    id: 'data/room-count-mismatch',
    title: 'Habitaciones declaradas vs. habitaciones registradas',
    run: ({ snapshot, property }) => {
      const prop = snapshot.properties.find((p) => p.name === property);
      const registered = snapshot.rooms.filter((r) => r.property === property).length;
      if (!prop || prop.roomCount === null || prop.roomCount === registered) return [];
      return [
        {
          check: 'data/room-count-mismatch',
          severity: 'warn',
          message: `La propiedad declara ${prop.roomCount} habitaciones pero hay ${registered} registradas. La ocupación se calcula sobre ${prop.roomCount}.`,
          fix: 'Dar de alta las habitaciones faltantes o corregir room_count.',
        },
      ];
    },
  },
  {
    id: 'data/test-data-unflagged',
    title: 'Datos de prueba marcados como reales',
    run: ({ snapshot, property }) =>
      snapshot.stays
        .filter((s) => s.property === property && !s.isSample && SAMPLE_NAME.test(s.guestName))
        .map((s) => ({
          check: 'data/test-data-unflagged',
          severity: 'warn' as const,
          message: `"${s.guestName}" parece de prueba pero is_sample=false; infla KPIs.`,
          fix: 'Marcar is_sample=true o borrar antes de enseñar al dueño.',
        })),
  },
  {
    id: 'data/address-mismatch',
    title: 'Dirección en la base vs. cartel de marca',
    run: ({ snapshot, property }) => {
      const prop = snapshot.properties.find((p) => p.name === property);
      if (!prop || !prop.address) return [];
      const a = prop.address.toLowerCase();
      if (a.includes('zaragoza') && a.includes('104')) return [];
      return [
        {
          check: 'data/address-mismatch',
          severity: 'warn',
          message: `La base dice "${prop.address}" y el cartel dice "${HOTEL.address}".`,
          fix: 'Confirmar la dirección correcta y unificar base, landing y ficha de Google Maps.',
        },
      ];
    },
  },
  {
    id: 'privacy/pii-in-public-data',
    title: 'Datos personales dentro de data.js (archivo público)',
    run: ({ raw }) => {
      if (raw === undefined) return [];
      const stays = rawList(raw, 'stays');
      const phones = stays.filter((s) => typeof s.notes === 'string' && /Tel:\s*[+\d]/.test(s.notes)).length;
      const names = stays.filter((s) => typeof s.guest_name === 'string' && s.guest_name.trim().length > 0).length;
      const emails = [...stays, ...rawList(raw, 'guests'), ...rawList(raw, 'rooms'), ...rawList(raw, 'extras')].filter((r) =>
        Object.values(r).some((v) => typeof v === 'string' && EMAIL.test(v)),
      ).length;
      if (phones + emails === 0 && names === 0) return [];
      return [
        {
          check: 'privacy/pii-in-public-data',
          severity: 'error',
          message: `data.js es público y contiene ${names} nombre(s) de huésped, ${phones} teléfono(s) y ${emails} registro(s) con correo de servicio.`,
          fix: 'Dejar de publicar PII en el sitio estático: lectura autenticada para el equipo y solo disponibilidad agregada en público (ADR-009).',
        },
      ];
    },
  },
  {
    id: 'data/phone-format',
    title: 'Teléfonos sin lada de país',
    run: ({ snapshot, property }) =>
      snapshot.stays
        .filter((s) => s.property === property)
        .flatMap((s) => {
          const m = /Tel:\s*([+\d][\d\s-]{6,})/.exec(s.notes)?.[1];
          if (!m) return [];
          const digits = m.replace(/\D/g, '');
          const normalized = normalizePhone(m);
          return normalized && normalized !== digits
            ? [{ check: 'data/phone-format', severity: 'info' as const, message: `Teléfono de ${s.guestName} sin lada; se normaliza a ${normalized} para WhatsApp.` }]
            : [];
        }),
  },
];

export interface AuditReport {
  generatedAt: string;
  date: ISODate;
  property: string;
  counts: Record<Severity, number>;
  checksRun: number;
  findings: Finding[];
}

export function runAudit(ctx: AuditContext, checks: readonly Check[] = CHECKS): AuditReport {
  const findings = checks.flatMap((c) => c.run(ctx));
  const counts: Record<Severity, number> = { error: 0, warn: 0, info: 0 };
  for (const f of findings) counts[f.severity]++;
  const order: Record<Severity, number> = { error: 0, warn: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || a.check.localeCompare(b.check));
  return { generatedAt: ctx.now.toISOString(), date: ctx.date, property: ctx.property, counts, checksRun: checks.length, findings };
}

const ICON: Record<Severity, string> = { error: '🔴', warn: '🟡', info: '⚪' };

export function toMarkdown(r: AuditReport): string {
  const lines = [
    `# Auditoría de integridad — ${r.property} — ${r.date}`,
    '',
    `Chequeos ejecutados: ${r.checksRun} · 🔴 ${r.counts.error} · 🟡 ${r.counts.warn} · ⚪ ${r.counts.info}`,
    '',
  ];
  if (r.findings.length === 0) lines.push('Sin hallazgos.');
  for (const f of r.findings) {
    lines.push(`- ${ICON[f.severity]} **${f.check}** — ${f.message}${f.fix ? `\n  - Acción: ${f.fix}` : ''}`);
  }
  return `${lines.join('\n')}\n`;
}
