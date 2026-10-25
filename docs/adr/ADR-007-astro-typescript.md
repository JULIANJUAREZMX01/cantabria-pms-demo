# ADR-007 — Migración a Astro + TypeScript estricto

**Estado:** Propuesta · **Fecha:** 2026-10-24 · **Autor:** Julián (decisión) / Claude (borrador)

## Contexto
El frontend v6 es un bundle de React + JS sin tipos (`src/App.tsx` 62 KB, `app.js` 192 KB compilado) con la lógica de negocio mezclada con la UI: ocupación, ingresos y limpieza se calculan dentro de componentes. Eso produjo cifras que no cuadran (ocupación 11 % con 3 estancias visibles, "ingresos proyectados" ambiguos) y vuelve imposible probar la lógica. El autor ya usa Astro + TypeScript estricto en MueveCancun (`tsconfig` strict, vitest, CI con SHAs fijados).

## Decisión
- **Astro 7 estático + TypeScript estricto** (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`). Salida 100 % estática: se conserva GitHub Pages.
- **La lógica vive fuera de la UI**: `src/domain/` (puro, sin DOM ni red, probado con Vitest) → `src/gateway/` (frontera con el backend) → `src/client/` (DOM sin `innerHTML`) → páginas Astro.
- **Zod** valida todo lo que entra del backend y lo que sale de IndexedDB; un registro malo no tumba la app.
- Scripts en TypeScript con `tsx` (alias `@/` idéntico al de la app). MueveCancun usa `node --experimental-strip-types`; aquí no sirve porque el dominio usa alias.
- Sin Tailwind ni React: CSS de ~100 líneas con tokens de marca. La interfaz no es el producto; el modelo sí.
- Node ≥ 22.23.4 (requisito de Astro 7); CI en Node 24.

## Consecuencias
✅ 31 pruebas del dominio con cifras verificadas a mano; `astro check` en cada CI.
✅ Las i18n de 5 idiomas se portaron tal cual (tipo `Record<Lang, Record<GuestKey,string>>`: un idioma no puede perder una clave).
⚠️ Hay que reconstruir la UI del equipo (hecha: 5 sombreros) y verificar a mano con el personal.
⚠️ `cantabriaPublish` escribe `data.js` y `csv/` en la raíz del repo: el build los copia a `public/` (`scripts/stage-data.ts`). No cambiar esas rutas sin tocar la función.
