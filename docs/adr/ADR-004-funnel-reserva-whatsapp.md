# ADR-004 — Funnel de reserva: ticket en pantalla + confirmación WhatsApp

**Estado:** Aceptada · **Fecha:** 2026-10-24

## Contexto
El huésped reserva en la landing pero necesita "su ticket": una confirmación (email o WhatsApp). No todos tienen Telegram ni email a mano; el canal universal en México es WhatsApp. El jefe (humano, +52 775 759 1185) es quien debe cerrar la confirmación con el huésped.

## Decisión
- Al enviar la reserva, la landing genera **referencia visible** `CB-XXXXX` (tarjeta ticket en pantalla, en el idioma activo) y la escribe en las notas del registro: `Reserva web huésped · Ref CB-… · lang: xx · Tel: …`.
- Botón WhatsApp directo al jefe: `wa.me/527757591185` con mensaje prellenado en el idioma del huésped (contacto general y confirmación con Ref).
- El workflow "Cantabria Sync Estancias" (v1.2) entrega a KynicOS las notas completas; para reservas web, KynicOS arma un **paquete listo para copiar y pegar**: mensaje de confirmación en el idioma del huésped + link `wa.me/<tel huésped>` prellenado + aviso a Julián en Telegram.
- El dueño solo copia y pega; KynicOS no puede escribir WhatsApp por sí mismo.

## Consecuencias
✅ El huésped sale con referencia y canal de contacto inmediato; el dueño responde en segundos con texto ya redactado en el idioma correcto.
✅ Todo el funnel queda trazado: web → BD → workflow → Telegram → WhatsApp.
⚠️ El paquete depende del teléfono opcional del huésped; sin teléfono, se entrega solo el texto para responder al número que contacte.
