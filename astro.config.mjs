import { defineConfig } from 'astro/config';

// Un solo build, dos destinos:
//  · Netlify (producción, proxy /api)   → base '/'
//  · GitHub Pages (espejo demo)         → base '/cantabria-pms-demo'
const onNetlify = process.env.NETLIFY === 'true';

export default defineConfig({
  site: onNetlify ? (process.env.URL ?? 'https://cantabria-pms.netlify.app') : 'https://julianjuarezmx01.github.io',
  base: process.env.SITE_BASE ?? (onNetlify ? '/' : '/cantabria-pms-demo'),
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  vite: { resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } } },
});
