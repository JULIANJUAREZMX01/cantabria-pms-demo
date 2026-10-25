# Hotel Cantabria — PMS + landing (Astro + TypeScript)

Un solo sistema, varias vistas: landing del huésped en 5 idiomas y `/equipo` ("Entrar a mi turno") con vistas por **sombrero** (Recepción, Limpieza, Mantenimiento, Concierge, Dueño). La lógica es TypeScript estricto y probada; la UI es delgada.

## Comandos
```bash
npm install
npm run dev      # demo local: datos en el navegador, PIN 0000
npm test         # 39 pruebas (dominio, cola, API de servidor)
npm run check    # astro check (tipos)
npm run audit    # auditoría de integridad sobre data.js → reports/
npm run build    # stage-data + check + build → dist/
```
Requiere Node ≥ 22.23.4.

## Estructura
```
src/domain/    modelo, eventos, reductor, selectores, triage, concierge, auditoría (puro, sin DOM ni red)
src/gateway/   frontera con el backend: demo | legacy (Base44) + cola offline (IndexedDB)
src/client/    DOM sin innerHTML: landing, equipo, runtime optimista
src/i18n/      copy del huésped en es/en/zh/de/fr
src/data/      personas del equipo (editar) y semilla demo
scripts/       stage-data (copia data.js/csv y genera public.json sin PII), audit
docs/adr/      decisiones (Contexto / Decisión / Consecuencias) · docs/CALENDARIO.md
tools/         puente Excel ↔ BD (cantabria_sync.py)
```

## Modos
| `PUBLIC_GATEWAY_MODE` | Qué hace |
|---|---|
| `demo` (default) | Semilla de hoy + eventos guardados en el navegador. Nada sale del dispositivo. |
| `legacy` | Lee `data.js`, escribe en `cantabriaWrite` de Base44 (contrato actual, ver ADR-009). Token y PIN quedan en el bundle. |
| `proxy` | Producción en Netlify: login, escrituras y lectura de datos pasan por `/api/*`; el navegador no tiene token ni PIN (ADR-012). |

## Producción en Netlify (recomendado, ADR-012)
1. Importar el repo en Netlify (lee `netlify.toml`: build, `dist`, funciones, cabeceras).
2. *Environment variables* (sin prefijo `PUBLIC_`): `SESSION_SECRET` (≥32 caracteres aleatorios), `STAFF_PIN`, `OWNER_PIN`, `BASE44_WRITE_API`, `BASE44_WRITE_TOKEN` (rotado), `GITHUB_REPO`, `GITHUB_READ_TOKEN` (solo si el repo es privado).
3. Hacer un deploy de prueba y recorrer `/` y `/equipo/` antes de operar: la función no se probó en el entorno real de Netlify.
4. Recomendado: pasar el repo a privado para que `data.js` deje de ser público.

## Espejo demo en GitHub Pages
1. *Settings → Pages → Source* = **GitHub Actions**.
2. *Settings → Secrets*: `CANTABRIA_WRITE_TOKEN`, `CANTABRIA_STAFF_PIN`, `CANTABRIA_OWNER_PIN`. *Variables*: `GATEWAY_MODE=legacy`, opcional `WRITE_API`.
3. Push a `main`. Los commits de `data.js`/`csv/` que hace Base44 redespliegan solos.

## Migrar desde el repo actual
Hacerlo en una rama (`astro/migracion`): conservar `data.js`, `csv/`, `tools/`, `docs/`; reemplazar `index.html`, `admin.html`, `app.js` y el `src/` de React por este proyecto; abrir PR y verificar con CI antes de fusionar. **Antes de operar con huéspedes reales, leer ADR-009.**
