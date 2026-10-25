/**
 * Auditoría semanal / bajo demanda.  tsx scripts/audit.ts [--fail-on=error|warn]
 * Escribe reports/audit-<fecha>.md, reports/latest.json y reports/latest-summary.txt (para Telegram).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { runAudit, toMarkdown } from '../src/domain/audit.ts';
import { HOTEL } from '../src/lib/config.ts';
import { todayIn } from '../src/lib/dates.ts';
import { loadParsed } from './_load.ts';

const failOn = process.argv.find((a) => a.startsWith('--fail-on='))?.split('=')[1];
const { snapshot, issues, raw, source } = loadParsed();
const now = new Date();
const date = todayIn(HOTEL.timeZone, now);

const report = runAudit({ snapshot, issues, raw, property: HOTEL.propertyName, date, now });

mkdirSync('reports', { recursive: true });
writeFileSync(`reports/audit-${date}.md`, toMarkdown(report));
writeFileSync('reports/latest.json', `${JSON.stringify(report, null, 2)}\n`);

const top = report.findings
  .filter((f) => f.severity !== 'info')
  .slice(0, 5)
  .map((f) => `• ${f.severity === 'error' ? '🔴' : '🟡'} ${f.message}`)
  .join('\n');
writeFileSync(
  'reports/latest-summary.txt',
  `🏨 Auditoría Cantabria ${date}\n🔴 ${report.counts.error} · 🟡 ${report.counts.warn} · ⚪ ${report.counts.info}\n${top || 'Sin hallazgos críticos.'}\n`,
);

console.log(`audit: fuente=${source} · ${report.counts.error} errores · ${report.counts.warn} avisos · ${report.counts.info} info`);
const bad = failOn === 'warn' ? report.counts.error + report.counts.warn : failOn === 'error' ? report.counts.error : 0;
if (bad > 0) process.exit(1);
