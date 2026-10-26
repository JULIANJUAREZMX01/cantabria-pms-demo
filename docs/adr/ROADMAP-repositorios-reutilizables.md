# ROADMAP — Repositorios del autor reutilizables para Cantabria

**Estado:** Análisis v2 (clonación y lectura de código) · **Fecha:** 2026-10-24

Escaneo de los 21 repos públicos de JULIANJUAREZMX01. Prioridades analizadas en profundidad:

## 🥇 KynicOS (Python, monorepo) — integración estratégica directa
Plataforma de operaciones IA para hospitality (Cancún). Piezas reutilizables:
- `app/cloud/whatsapp_bridge.py`: **puente WhatsApp completo** (webhook Twilio, `send_whatsapp_alert`, `_send_whatsapp_reply`, chunking de mensajes largos, descarga de media). Es la pieza que a futuro elimina el copiar/pegar del funnel de reservas (ADR-004): el agente enviaría la confirmación por sí solo.
- `app/concierge/persona.py`: sistema de personas (`Persona` dataclass: LEO lujo / NEXUS_ADMIN / MUEVE_CANCUN, tonos luxury|technical|friendly). Base para crear la persona "Concierge Cantabria" (tono friendly, español cálido, 5 idiomas de la landing).
- `app/skills/`: `hvac_triage.py` (triaje de fallas → ticket de mantenimiento = ServiceRequest), `skill_builder.py`, `memory_manager.py`, `web_research.py`.
- `app/cloud/`: telegram_bot, mcp_server, backup S3, dashboard.
- Deploy vivo: nanobot-cloud-zjr0.onrender.com (hoy suspendido por billing de Render — reactivar o redeployar).
**Integración propuesta:** Fase Beta usa copiar/pegar; Fase 2 revive este bridge para confirmación automática por WhatsApp.

## 🥈 cocobongo-proposal (HTML) — base de la propuesta formal
Propuesta personal "Por qué no traigo un CV — traigo una propuesta" (17 KB, desplegada en Vercel). Estructura: resultados reales → tecnologías en producción → construido y operado → MVP en vivo durante la entrevista. **Reutilizable:** plantilla narrativa para la propuesta formal de consultoría a la cadena (Proyecto Beta, 8 semanas). Acción: derivar a `docs/propuesta-cadena-cantabria.md`.

## 🥉 python-orchestrator-node (Python/FastAPI) — patrón de auditoría y registro
Orquestador modular: `tool_registry.yaml` + `audit_profiles.yaml` + módulos (arquitectura, dependencias, seguridad, performance) + reporteros (JSON/HTML/PDF). **Reutilizable:** el patrón registry/reporter para formalizar el turno semanal de optimización (chequeos declarados en YAML, reporte a ADR). También auditoría de código del propio PMS.

## nanobot-cloud (Python) — runbook de despliegue del agente
Wrapper de despliegue en Render (Telegram + Dashboard + MCP + backups S3) con guías completas (QUICK_DEPLOY, RENDER_SETUP_GUIDE, fases 1-3). Es el runbook si se revive el bridge de KynicOS. Hoy suspendido por billing.

## Clasificados (sin clonar aún)
| Repo | Potencial |
|---|---|
| `Wasm-Kalpixk_IA_DevOps` | Motor de anomalías WASM; a futuro: alertas operativas del hotel (no-shows, ocupación anómala) |
| `MueveCancun` / `muevecancun-pwa` | Patrones Astro PWA offline-first; referencia si el PMS migra a dominio propio |
| `-DoctorCanc-nAgentNanoBot` | Agente de negocio local con WhatsApp; caso análogo (canal de negocio) |
| `EstanciaInfantilMisPekesCanc-n` | Diseño web de negocio local (inspiración visual) |
| `KYNYKOS_AI_Agent` | Versión temprana del agente; historial evolutivo |
| `astro-platform-starter`, `Shop-Temu-Latam`, `AMMGG`, `AMERICANGLOBALGORUP`, `vuelos`, `GREEN16`, `APP` | Por clasificar en el turno semanal |

**Próximo análisis (turno del lunes):** derivar propuesta formal desde cocobongo-proposal y prototipo de persona "Concierge Cantabria" desde `persona.py`.


## Continuación del análisis · 2026-10-26

Revisión de metadatos de GitHub para los repositorios previamente clasificados como “sin clonar aún” y el grupo “por clasificar”. Es una clasificación inicial, no una auditoría de código:

| Repo | Señal verificada | Próxima acción |
|---|---|---|
| `MueveCancun`, `muevecancun-pwa` | Astro y JavaScript/Base44 App | Revisar módulos offline reutilizables en una sesión posterior. |
| `-DoctorCanc-nAgentNanoBot`, `KYNYKOS_AI_Agent` | Python; agente de negocio / agente temprano | Comparar flujos WhatsApp y políticas antes de proponer portado. |
| `EstanciaInfantilMisPekesCanc-n`, `vuelos`, `AMMGG` | HTML; sitio de negocio / landing | Reutilización visual solamente, sin dependencia técnica evidente. |
| `astro-platform-starter`, `Shop-Temu-Latam` | Astro | Revisar scaffold y configuración, evitando duplicar la arquitectura Astro del PMS. |
| `Wasm-Kalpixk_IA_DevOps` | Python; descripción indica motor WASM/ROCm | Mantener como candidato futuro de analítica, no integrarlo en el PMS hoy. |
| `AMERICANGLOBALGORUP`, `APP`, `GREEN16` | Metadatos incompletos (sin lenguaje o descripción suficiente) | Requieren lectura del código para clasificarlos. |

No se clonaron ni se importó código en este turno. Se prioriza después la derivación de la propuesta formal desde `cocobongo-proposal`, como ya estaba previsto.
