# Mapa QR — Hotel Cantabria · Estrategia de digitalización del guest journey

**Versión:** 1 · **Fecha:** 2026-10-25 · **Responsable:** KynicOS · **Aprueba:** Julián Juárez

## Principios

1. **Cada QR tiene UNA intención y UN destino.** Nada de QRs genéricos.
2. **Los QRs aterrizan en el sitio propio** (multiidioma, reservas, concierge), no en terceros, salvo WhatsApp.
3. **El huésped escanea y ahorra pasos**; el hotel captura la interacción (upselling, datos, reservas directas sin comisión).
4. Los códigos se generan con `tools/gen_qrs.py` (corrección de errores H, monograma central, azul #1a3e6d sobre crema #f2e8d5). Si cambia el dominio, se regeneran con un comando.

## Zona exterior (3 códigos, ya generados)

| # | Código | Ubicación física | Destino | Qué hace por el huésped |
|---|---|---|---|---|
| 1 | `fachada-info` | Entrada principal, junto al cartel, altura de ojos | Landing multiidioma | Información completa en 5 idiomas, fotos, reseñas, mapa y reservar directo. Aprovecha al 100% la web v9 |
| 2 | `contacto` | Junto al timbre / acceso | `contacto.vcf` | Guarda el hotel en los contactos del teléfono: teléfono, WhatsApp, dirección, web. El hotel vive en el teléfono del huésped |
| 3 | `whatsapp` | Cartel "¿Necesitas algo? Escanea" | wa.me con mensaje prellenado | Abre chat con recepción 24/7 sin buscar el número. Ideal fuera de horario |

**Impresión exterior:** 25-30 cm (el 1), aluminio/ACM con laminado UV. El código ya trae zona quieta.

## Recepción (2 códigos)

| # | Código | Ubicación | Destino | Función |
|---|---|---|---|---|
| 4 | `recepcion-reservas` | Mostrador, a la vista del cliente | Landing `#reservar` | Reserva directa sin comisiones ($300 promo). Conversión en el punto de máxima intención |
| 5 | `wifi` | Mostrador | QR nativo wifi (`wifi:T:WPA;S:...;P:...`) | **PENDIENTE:** Julián debe dar SSID y clave. Conexión automática sin teclear |

## Habitaciones (2 por cuarto)

| # | Código | Ubicación | Destino | Función |
|---|---|---|---|---|
| 6 | `habitacion-concierge` | Atrás de la puerta, altura de ojos (8×8 cm) | Landing `#concierge` | Pedir agua/café/kit eco, reportar mantenimiento, hablar con recepción. Es el canal 24/7 y el motor de upselling |
| 7 | `menu-extras` | Mesa o repisa (futuro) | Hoy: mismo concierge. Después: página `/menu` con catálogo y fotos | Venta de extras con un toque. **Acción futura:** construir `/menu` con precios y checkout |

En v1, el QR 6 cubre la función 7. Un solo QR por habitación hasta que exista `/menu`.

## Salida / reseñas (1 código, EN ESPERA)

| # | Código | Ubicación | Destino | Estado |
|---|---|---|---|---|
| 8 | `resenas` | Recepción (check-out) | ¿Google? | **NO desplegar todavía.** La ficha de Google está duplicada y con 3.4★ global. Primero reclamar y unificar la ficha. Interino: WhatsApp "cuéntanos tu experiencia" (feedback privado) |

## Conteo total

- **Ya generados y verificados (escaneables):** 5 (fachada-info, contacto, whatsapp, recepcion-reservas, habitacion-concierge — este último se imprime 1 por habitación).
- **Pendientes por insumo de Julián:** wifi (credenciales), reseñas (ficha Google).
- **Futuros:** menú-extras (`/menu` con catálogo), QR por habitación con `?hab=101` para prellenar la habitación en el concierge.

## Reglas operativas

- Archivos vivos en `public/qr/` (se sirven desde la web) y hoja de impresión en `public/qr/imprimir.html`.
- Regenerar con `python3 tools/gen_qrs.py` tras cualquier cambio de dominio o mensaje de WhatsApp.
- Verificar escaneabilidad tras imprimir con 2 teléfonos distintos (uno viejo).
- Cada QR físico lleva etiqueta con su intención ("Escanea para reservar / para pedir algo / para guardarnos").
