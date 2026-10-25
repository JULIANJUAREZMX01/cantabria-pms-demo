# ADR-010 — Qué se reutiliza de los repos del autor

**Estado:** Propuesta · **Fecha:** 2026-10-24
**Alcance:** se analizaron los 20 repos públicos de `JULIANJUAREZMX01` (cuenta de 27 declarados; los 7 restantes no son visibles públicamente) y se leyó el código de los 8 candidatos.

## Contexto
La v6 reutilizó KynicOS solo como idea (el concierge se portó a una función Base44). Falta aprovechar lo que ya funciona en producción en otros repos, sin arrastrar su peso (MueveCancun tiene 503 archivos, WASM, Neon, Stripe, Supabase).

## Decisión
| Repo | Veredicto | Qué se toma |
|---|---|---|
| **MueveCancun** | **Implementar** | Patrón de cola offline (`idb.ts` + `sync.ts` → `gateway/outbox.ts`, ahora con tipos, orden FIFO y estados), configuración Astro/TS estricta, estructura de CI con SHAs fijados, principio "audit:survival" (sin CDN en runtime). |
| **KynicOS** | **Transformar** | `hvac_triage.py` → `domain/triage.ts` (síntoma → causas → preguntas → prioridad → ETA) con fallas de hotel de altura; el SkillRouter → `domain/concierge.ts` determinista y probado. El puente WhatsApp queda para la fase 2 (revisión 16 nov). |
| **python-orchestrator-node** | **Transformar** | Patrón registry + reporter → `domain/audit.ts` + `scripts/audit.ts` (JSON + Markdown), corrido en CI semanal y en la vista del dueño. |
| **cantabria-pms-demo** | **Implementar** | Copy de 5 idiomas, esquema de datos, `tools/cantabria_sync.py`, ADR 001-006 (sin PIN). |
| **cocobongo-proposal** | **Aplazar** | Plantilla narrativa de la propuesta formal; turno del 2 nov. |
| MueveRepartoEnCancun-, iDoctorByGoogleAIStudio, astro-platform-starter | **Ignorar** | Mismo stack, dominio distinto; no aportan al PMS. |
| Wasm-Kalpixk, nanobot-cloud, -DoctorCancúnAgentNanoBot, KYNYKOS_AI_Agent, Shop-Temu-Latam, vuelos, AMMGG, APP, GREEN16, AMERICANGLOBALGORUP | **Ignorar** | Sin relación con hotelería. |

## Consecuencias
✅ Cada pieza reutilizada tiene prueba y está adaptada al dominio; ninguna se copió entera.
⚠️ Los 7 repos no visibles públicamente no se analizaron: pasar sus nombres para completar este ADR.
⚠️ El WASM de MueveCancun (`SpatialHash`, calculadora de rutas) no se usó: ningún cálculo del PMS lo necesita.
