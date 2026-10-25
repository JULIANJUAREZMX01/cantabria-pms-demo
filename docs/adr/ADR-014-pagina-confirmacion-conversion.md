# ADR-014: Página de confirmación de reserva (conversión medible)

- **Estado:** Aceptada · **Fecha:** 2026-10-25 · **Serie:** Hotel Cantabria PMS

## Contexto

El funnel de reserva v6.1 terminaba en un ticket inline dentro de la landing. Julián necesita medir confirmaciones con Google (GA4/Google Ads), lo que requiere una URL de destino (destination goal) propia, distinta de la landing con el formulario.

## Decisión

1. Crear la página `/confirmacion` (única URL para los 5 idiomas) que muestra: referencia, fechas, mensaje de confirmación y CTA de WhatsApp + volver al inicio.
2. El i18n se resuelve por query param `?lang=xx` en cliente (reutiliza `guest.ts`); la página es `noindex` para no contaminar búsqueda con URLs con parámetros.
3. Tras despachar el evento `stay.reserve`, la landing redirige a `/confirmacion?ref=CB-XXXXX&lang=xx&in=...&out=...` (con 500 ms para mostrar el ticket).
4. Integración GA preparada: constante `GA_ID` en el script de la página; al definir el Measurement ID se inyecta gtag.js y se dispara `reservation_confirmed` (con referencia e idioma). Sin ID, la página funciona igual.

## Consecuencias

- **Positivas:** objetivo de conversión limpio en GA4/Ads (page_location = /confirmacion); i18n sin multiplicar rutas; la referencia y fechas viajan en la URL para el huésped y la telemetría.
- **Negativas:** el texto llega por query param (sin prerender por idioma, aceptable en página noindex); una ruta más que mantener.
- **Seguridad:** no se transmiten datos personales (solo ref, fechas e idioma; el teléfono nunca se refleja).
- **Métrica:** pendiente el Measurement ID de Julián para activar el gtag; alternativa sin código: objetivo GA4 donde `page_location` contiene `/confirmacion`.
