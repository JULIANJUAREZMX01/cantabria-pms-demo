# Hotel Cantabria PMS — Documentación de arquitectura

Sistema PMS multihotel + landing de huésped. Sede piloto: **Hotel Cantabria Tulancingo**.

## Mapa del sistema (v7, Astro + TypeScript)
- **Landing del huésped:** `/` (es) y `/en/ /zh/ /de/ /fr/` — reserva directa con ticket CB-XXXXX, concierge, WhatsApp.
- **Equipo:** `/equipo/` — vistas por sombrero: Recepción, Limpieza, Mantenimiento, Concierge, Dueño.
- **Datos:** `data.js` + `csv/` los publica Base44; el build genera además `public.json` (solo conteos, sin PII).
- **Backend:** Base44 (`cantabriaWrite`, `cantabriaPublish`) detrás de un `Gateway`; ver ADR-009.
- **Automatización:** GitHub Actions (CI, Pages, auditoría semanal) + agente KynicOS (criterio y avisos).

## Registro de decisiones (ADR)
| ADR | Título | Estado |
|---|---|---|
| [001](adr/ADR-001-arquitectura-pms.md) | Frontend estático en GitHub Pages + backend Base44 | Aceptada |
| [002](adr/ADR-002-seguridad-escrituras-pin.md) | Escrituras reales con PIN + service role | Aceptada (ver 009) |
| [003](adr/ADR-003-landing-i18n-huesped.md) | Una sola landing con i18n | Aceptada |
| [004](adr/ADR-004-funnel-reserva-whatsapp.md) | Funnel de reserva con ticket y WhatsApp | Aceptada |
| [005](adr/ADR-005-optimizacion-continua-calendario.md) | Optimización continua + ADRs | Aceptada |
| [006](adr/ADR-006-concierge-ia-landing.md) | Concierge IA en la landing | Aceptada |
| [007](adr/ADR-007-astro-typescript.md) | Migración a Astro + TypeScript estricto | Propuesta |
| [008](adr/ADR-008-eventos-y-sombreros.md) | Un registro de eventos y vistas por sombrero | Propuesta |
| [009](adr/ADR-009-gateway-y-deuda-de-seguridad.md) | Frontera con el backend y deuda de seguridad | Propuesta |
| [010](adr/ADR-010-reutilizacion-de-repos.md) | Qué se reutiliza de los repos del autor | Propuesta |
| [011](adr/ADR-011-despliegue-y-workflows.md) | Despliegue y workflows en GitHub | Propuesta |
| [012](adr/ADR-012-hosting-netlify-y-pages.md) | Un build, dos destinos: Netlify (producción) y Pages (demo) | Propuesta |

Convención: **Contexto / Decisión / Consecuencias**. Las ADR nuevas nacen "Propuesta" y pasan a "Aceptada" solo cuando las aprueba una persona.
