# ADR-001 — Frontend estático en GitHub Pages + backend Base44

**Estado:** Aceptada · **Fecha:** 2026-10-23

## Contexto
El hotel necesita una herramienta web operativa sin costo de hosting ni infraestructura que mantener. El dueño y el personal usan teléfonos Android; los huéspedes necesitan una landing pública. El agente KynicOS (Base44) ya gestiona datos y Telegram.

## Decisión
- Frontend: React embebido inline en HTML servido por **GitHub Pages** (repo `cantabria-pms-demo`). Sin build server, sin runtime propio.
- Estado vivo: `data.js` + CSVs publicados en el mismo sitio tras cada cambio de BD (workflow → `cantabriaPublish`). El frontend refresca cada 30 s.
- Backend: entidades y funciones serverless en **Base44** (`cantabriaRead`, `cantabriaWrite`, `cantabriaPublish`).
- Escritura: POST autenticado por token a `cantabriaWrite`; lectura: `data.js` público.

## Consecuencias
✅ Costo cero, despliegue automático, sin caídas de servidor, funciona offline-lectura con caché del navegador.
✅ Un solo origen de verdad (BD Base44); la web es proyección.
⚠️ Latencia de publicación ~1 min (aceptable para operaciones hoteleras).
⚠️ Bundle inline = cada cambio requiere rebuild (esbuild) y repush; documentado en el README.
