import { existsSync, readFileSync } from 'node:fs';
import { extractDataJs, parseSnapshot } from '../src/domain/legacy.ts';

/** Carga data.js (el real que publica Base44) o, si no existe, la muestra saneada del repo. */
export function loadRaw(): { raw: unknown; source: string } {
  const real = 'data.js';
  const sample = 'tests/fixtures/data.sample.js';
  const source = existsSync(real) ? real : sample;
  return { raw: extractDataJs(readFileSync(source, 'utf8')), source };
}

export function loadParsed() {
  const { raw, source } = loadRaw();
  return { raw, source, ...parseSnapshot(raw) };
}
