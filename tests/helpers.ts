import { readFileSync } from 'node:fs';
import { extractDataJs, parseSnapshot } from '@/domain/legacy.ts';
import { buildDemoSnapshot } from '@/data/seed.ts';

export const TODAY = '2026-10-24';
export const demo = () => buildDemoSnapshot(TODAY);
export const fixtureRaw = (): unknown => extractDataJs(readFileSync('tests/fixtures/data.sample.js', 'utf8'));
export const fixture = () => parseSnapshot(fixtureRaw());
