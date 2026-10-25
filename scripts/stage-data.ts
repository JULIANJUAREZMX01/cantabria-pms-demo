/**
 * Prepara `public/` antes del build:
 *  - copia data.js y csv/ que publica Base44 (compatibilidad con el flujo actual),
 *  - genera public.json: vista pública SIN datos personales para la landing.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { toPublicView } from '../src/domain/public.ts';
import { HOTEL } from '../src/lib/config.ts';
import { todayIn } from '../src/lib/dates.ts';
import { loadParsed } from './_load.ts';

mkdirSync('public', { recursive: true });
const { snapshot, source } = loadParsed();

// En modo proxy los datos con PII NO se publican: los sirve /api/snapshot solo con sesión.
if (process.env.PUBLIC_GATEWAY_MODE === 'proxy') {
  rmSync('public/data.js', { force: true });
  rmSync('public/csv', { recursive: true, force: true });
} else {
  if (existsSync('data.js')) cpSync('data.js', 'public/data.js');
  else cpSync(source, 'public/data.js');
  if (existsSync('csv')) cpSync('csv', 'public/csv', { recursive: true });
}

const view = toPublicView(snapshot, HOTEL.propertyName, todayIn(HOTEL.timeZone));
writeFileSync('public/public.json', `${JSON.stringify(view)}\n`);
console.log(`stage-data: fuente=${source} · listas=${view.readyRooms}/${view.totalRooms}`);
