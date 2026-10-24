# ADR-006 — Concierge IA en la landing (puerto del SkillRouter de KynicOS)

**Estado:** Aceptada · **Fecha:** 2026-10-24

## Contexto
El repositorio propio `KynicOS` contiene un orquestador hospitality completo (persona + skill router + loop conversación→acción). Su núcleo es valioso pero su runtime (Render) está suspendido por billing. La landing del huésped ya tiene reserva real; falta el canal conversacional para pedidos y reportes en estancia.

## Decisión
Se porta el patrón **SkillRouter** de KynicOS a la infraestructura viva (Base44 + GitHub Pages):
- Nueva función `cantabriaConcierge` (Deno/Base44): clasifica intención por keywords multilingües (es/en/zh/de/fr) → acción verificable: crea `ExtraOrder` (agua $25 / café $45 / kit $70, estado Pendiente) o `ServiceRequest` (Toallas/Amenidades o Mantenimiento, estado Abierto). Protegida por el mismo token que `cantabriaWrite`.
- Panel "🤖 KynicOS · Concierge IA en línea" en la landing: 5 chips + campo habitación + texto libre; respuestas localizadas en los 5 idiomas; pide la habitación si falta.
- Los workflows existentes de Extras y Servicio publican los cambios y despiertan a KynicOS, que avisa al personal por Telegram. Conversación → acción → publicación → aviso, sin runtime propio.
- `cantabriaPublish` migrado a `asServiceRole`: habilita república manual de mantenimiento (probada por curl). Los workflows lo siguen llamando igual.

## Consecuencias
✅ El huésped en estancia pide extras/reporta problemas desde el teléfono, en su idioma, sin apps ni registros.
✅ El catálogo de KynicOS se reutiliza sin reactivar Render; su `whatsapp_bridge` queda como fase 2 (confirmaciones automáticas salientes).
⚠️ `cantabriaPublish` sin token gate: cualquier visitante puede forzar una república (idempotente, sin fuga de datos; costo: churn de commits). Mitigación futura: gate por header cuando los workflows de Base44 soporten headers custom.
⚠️ El clasificador es keyword-based (no LLM): cubre los 7 intents frecuentes; el texto no reconocido deriva a WhatsApp del jefe.
