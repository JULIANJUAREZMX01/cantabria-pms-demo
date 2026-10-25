/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_GATEWAY_MODE?: 'demo' | 'legacy' | 'proxy';
  readonly PUBLIC_WRITE_API?: string;
  readonly PUBLIC_WRITE_TOKEN?: string;
  readonly PUBLIC_STAFF_PIN?: string;
  readonly PUBLIC_OWNER_PIN?: string;
  readonly PUBLIC_DEMO_PIN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
