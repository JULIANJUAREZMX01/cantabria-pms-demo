# ADR-011 — Despliegue y workflows en GitHub

**Estado:** Propuesta · **Fecha:** 2026-10-24

## Contexto
El repo no tiene `.github/workflows`: los "workflows" de v6 son automatizaciones de Base44 (disparadores por entidad y el turno semanal). Se conserva GitHub Pages y se quiere más automatización dentro de GitHub, con evidencia en el repo.

## Decisión
- **`ci.yml`** (push/PR): `astro check` → pruebas → auditoría → build. Acciones con SHA fijado (mismas que MueveCancun).
- **`pages.yml`** (push a `main` + manual): build y despliegue por Actions. Cada commit de `data.js`/`csv/` que hace Base44 redespliega el sitio (~1 min), igual que hoy. Requiere cambiar *Settings → Pages → Source* a **GitHub Actions**.
- **`audit.yml`** (lunes 09:00 Cancún): corre las auditorías sobre el `data.js` real, guarda `reports/audit-<fecha>.md` en el repo y avisa por Telegram si existen `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.
- **Reparto con Base44**: GitHub hace lo determinista y reproducible (build, pruebas, auditoría, reporte). El agente KynicOS conserva el criterio (mejoras pequeñas, avisos por Telegram) y sigue escribiendo `docs/CALENDARIO.md`.
- Secretos de build: `CANTABRIA_WRITE_TOKEN`, `CANTABRIA_STAFF_PIN`, `CANTABRIA_OWNER_PIN`; variables: `GATEWAY_MODE` (`demo` | `legacy`), `WRITE_API`.
- Dependabot semanal para npm y Actions.

## Consecuencias
✅ Todo cambio deja evidencia (commit, reporte, CI) y no depende de una sola herramienta.
⚠️ Las acciones `configure-pages`, `upload-pages-artifact` y `deploy-pages` van por etiqueta mayor; fijar su SHA cuando se pueda verificar.
⚠️ Dos escritores sobre `docs/CALENDARIO.md` (agente y humano): conflictos se resuelven con rebase; `reports/` solo lo escribe Actions.
