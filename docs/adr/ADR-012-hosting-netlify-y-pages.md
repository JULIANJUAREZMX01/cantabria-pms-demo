# ADR-012 — Un solo build, dos destinos: Netlify (producción) y GitHub Pages (espejo demo)

**Estado:** Propuesta · **Fecha:** 2026-10-24

## Contexto
Se habló de dos versiones: "GitHub Pages" y "Netlify + Astro" (`sistemascancunjefe-ai/cantabria-pms-demo-v01AI`). Verificación: ese repo es **idéntico** al de GitHub Pages (misma rama `main`, mismo commit `3ee801a`, mismo árbol); no tiene Astro, `package.json` ni `netlify.toml`. La comparación recibida describía una versión que no existe en el repo. El único Astro real es este proyecto.

La comparación también contenía conclusiones que no se sostienen:
- GitHub Pages no es "interno ni privado": es público. Un panel de recepción ahí está abierto a cualquiera con la URL.
- SEO y velocidad dependen del **build** (HTML prerrenderizado vs. Babel en el navegador), no del host. Astro estático rinde igual en Pages que en Netlify.

Lo que Netlify sí aporta aquí, y Pages no: **funciones de servidor** (guardar el token fuera del navegador, verificar PIN, no servir PII sin sesión), cabeceras HTTP (CSP, `noindex` en `/equipo/`), previews por PR y repo privado sin costo.

## Decisión
- **Un repositorio y un build** (Astro + TypeScript). Se descarta mantener dos bases de código ("interna" y "comercial").
- **Producción: Netlify** con `PUBLIC_GATEWAY_MODE=proxy`: `netlify/functions/api.ts` expone `/api/login`, `/api/event` y `/api/snapshot`.
  - El PIN se verifica en el servidor y la sesión es un token firmado (HMAC, 12 h) por persona; el token de Base44 vive solo en variables del servidor.
  - La política de `src/server/policy.ts` decide qué puede hacer cada actor: el huésped solo reserva, pide extras del catálogo y reporta; **tarifa y precios los fija el servidor**; el personal solo lo que permite su sombrero y solo a nombre propio.
  - `data.js` y `csv/` **no se publican** en el sitio; el equipo los lee con sesión desde `/api/snapshot` (GitHub, con `GITHUB_READ_TOKEN` si el repo es privado). La landing solo usa `public.json`.
- **GitHub Pages: espejo de demostración** (`demo` o `legacy`), para enseñar al dueño sin tocar datos reales.
- **Fuente de verdad del repositorio:** `JULIANJUAREZMX01/cantabria-pms-demo` (es donde `cantabriaPublish` hace commit). El de `sistemascancunjefe-ai` se archiva o queda como espejo de solo lectura.
- Un mismo `astro.config.mjs` elige `base` según `NETLIFY`; `netlify.toml` define build, cabeceras y `noindex` para `/equipo/`.

## Consecuencias
✅ Cierra los hallazgos 1 y 2 de ADR-009 (token y PIN en el bundle) y el 3 si el repo pasa a privado: verificado de punta a punta con un servidor local que usa la misma API (ni token ni PIN aparecen en HTML/JS; snapshot sin sesión = 401).
✅ Nada se bifurca: Pages y Netlify consumen el mismo código.
⚠️ **No probado en Netlify real**: la función y las cabeceras se verificaron con pruebas y un servidor local equivalente, no en el entorno de Netlify. Hacer un deploy de prueba antes de operar.
⚠️ El límite de intentos de PIN es por instancia (mitiga, no sustituye un WAF). `GITHUB_READ_TOKEN` debe ser de solo lectura y limitado a ese repo.
⚠️ Siguen pendientes en Base44: `stay_id` en `checkIn`, `updateRequest`/`updateExtra`, pagos y dejar de publicar PII (ADR-009).
⚠️ La CSP usa `'unsafe-inline'` porque Astro inserta scripts/estilos pequeños en línea; endurecer con hashes más adelante.
