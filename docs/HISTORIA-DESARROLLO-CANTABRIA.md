# Historia cronológica del desarrollo — Hotel Cantabria (PMS + Landing + Agente)
### Registro completo del 23 al 28 de octubre de 2026 · método DACC / arquitectura AEI
**Repositorio:** github.com/JULIANJUAREZMX01/cantabria-pms-demo · **Producción:** julianjuarezmx01.github.io/cantabria-pms-demo

---

## Día 0 — 23 de octubre: el origen (antes del código)

Julián Juárez se hospeda en el Hotel Cantabria (Tulancingo, Hidalgo; EST. 1928). Detecta la oportunidad: un hotel con 98 años de historia operando sin software propio. Esa estancia real queda registrada como primer registro del sistema ("Estancia real que originó el proyecto"). Decisión estratégica: **Proyecto Beta de 8 semanas** — digitalizar la operación antes de escalar a la cadena.

---

## 24 de octubre — Fundación: del demo estático al PMS operativo

| Hora | Hito |
|---|---|
| 01:40 | PMS Cantabria Live v4.4: demo estática (una sola página, datos de ejemplo) |
| 01:47–01:55 | Primeros syncs automáticos a git; **v5**: rediseño responsivo + datos vivos |
| mañana | **v6 — dos páginas**: `index` (landing del huésped, i18n 5 idiomas) y `admin` (PMS del personal con PIN y modo dueño). Nace el funnel de reserva con referencia `CB-XXXXX` y notas trazables |
| mañana | Backend Base44: entidades Stay, RoomStatus, ExtraOrder, ServiceRequest, Guest, GuestReview, HotelProperty + funciones `cantabriaRead/Write/Publish` (service role, token) |
| tarde | 4 workflows entity-trigger v1.1: cada operación real publica datos y despierta al agente para notificar a Julián |
| noche | ADR-001 a ADR-008: arquitectura PMS, seguridad de escrituras por PIN, i18n del huésped, funnel WhatsApp, optimización continua, concierge IA, migración a Astro+TS, eventos y "sombreros" (roles) |

**Verificación:** reserva real desde la landing llega a la base con tarifa cotizada por fecha; panel de recepción con datos vivos.

---

## 25 de octubre — Identidad, cutover y sistema físico-digital

**Madrugada — la queja que cambió el proyecto:** "no veo ninguna imagen por ningún lugar". Las 9 piezas de marca (carteles, sellos de talavera, monogramas, rótulos) vivían en una rama; la página pública era la demo. Respuesta: **cutover completo** a Pages del build formal (merge `0daa105`), Pages en modo workflow, credenciales por variables con fallback, y verificación E2E en producción (reserva real con Ref CB-7RME5, login de recepción con PIN).

- **ADR-013 — Landing formal v7:** identidad de marca completa, dirección oficial Zaragoza Ote. 104, mapa por consulta de dirección (la ficha de Google está mal ubicada), reseñas reales verificables, EST. 1928, promo $300.
- **v8 — diseño colonial elevado:** tipografía Playfair Display + Great Vibes, paleta del cartel (azul #1a3e6d, oro #b8893a, cinta #c7986b, terracota, salvia), medallones, divisores, reserva como bloque de conversión.
- **v9 — el sitio vivo:** GSAP + ScrollTrigger + Lenis. Scroll suave, hero coreografiado, parallax del rótulo, sello girando, revelados en cascada y la **cinta del cartel como marquesina** con bucle infinito. Accesibilidad: `prefers-reduced-motion` apaga todo; sin JS la página es 100% visible.
- **Sistema QR (8 códigos):** fachada-info, contacto (vCard), WhatsApp prellenado, reservas, concierge de habitación + WiFi piso 1, piso 2 y piso 2 5G. Azul sobre crema, monograma embebido, ECC nivel H, **verificados con OpenCV**, hoja de impresión y generador versionado (`tools/gen_qrs.py`).
- **ADR-014 — página `/confirmacion`:** destino único de conversión (GA4/Ads), i18n por query param, hook `reservation_confirmed` listo. El funnel redirige ahí tras reservar.
- **Operación:** ~50 commits automáticos `chore: sync` — el pulso del espejo git.

---

## 26 de octubre — Operación y gobernanza

- **ADR-015 — alias `/admin.html` → `/equipo/`:** los enlaces viejos del personal dejan de dar 404.
- **Turno semanal (workflow):** salud de landing/equipo/CSVs, revisión de entidades, check-out de la estancia de prueba (hab 105 → limpieza), republicación (`synced_at` al día).
- **Hallazgo de arquitectura:** `checkOut` cierra la Stay pero no libera la RoomStatus. Corregido manualmente y **propuesto** como cambio de backend (no ejecutado sin aprobación).
- **Hallazgo técnico:** `setRoomStatus` exige `room_id`; con otro campo crea registros huérfanos (detectado y limpiado en la misma corrida).
- **Dependabot:** vitest 5, @types/node 26, actions/checkout 7, configure-pages 6, deploy-pages 5 — actualizaciones mergeadas.
- **Auditoría semanal:** reporte automatizado de health, datos y catálogo de inconsistencias demo.

---

## 28 de octubre — Nomenclatura y evaluación del método

- **DACC — Desarrollo Agéntico de Ciclo Cerrado** y **AEI — Arquitectura Estática Instrumentada** (`docs/ARQUITECTURA-DACC.md`): definición formal, escala de madurez E1–E5 (Cantabria en **E4**), comparación ponderada de 12 criterios contra el estándar WordPress de agencia en México, límites honestos y ruta E4→E5.
- **Calificación: 8.7/10 (A−)** contra 6.0/10 del baseline. Mejores ejes: arquitectura 9.2, identidad/UX 9.3, verificación 9.0, operación 9.0. Brechas: cobro en línea 4.0, autonomía del dueño 6.0.

---

## Estado final del sistema (28-oct)

| Capa | Artefacto | Métrica |
|---|---|---|
| Presentación | Astro estático en Pages · 7 páginas · 5 idiomas | landing/confirmación/equipo en 200 |
| Datos | `data.js` + 5 CSVs publicados a git | synced_at 26-oct 16:50Z, 12 stays, 11 room status, 3 extras, 1 request, 3 propiedades |
| Operaciones | 3 funciones (`cantabriaRead/Write/Publish`) + gateway con cola offline | token con scope, service role |
| Agente | 6+ workflows (estancia, habitación, extras, servicio, turno semanal, investigación) | notificaciones en el idioma del huésped |
| Físico | 8 QRs verificados + hoja de impresión | escaneo validado con OpenCV |
| Calidad | CI: 42 pruebas + `astro check` + build | verde |
| Gobernanza | 15 ADRs + calendario vivo + roadmap | 329 commits totales |

---

## Playbook de replicación semi-automática (el molde, no el hotel)

1. **Clonar el repo plantilla** (Astro + i18n + gateway + CI) y sustituir la marca (colores, tipografía, 9 piezas gráficas).
2. **Definir entidades** del vertical (hotel: Stay/RoomStatus/ExtraOrder; clínica: Appointment/Room/Service; taller: Order/Vehicle/Part) — el patrón de nombres y estados se reutiliza.
3. **Configurar 3 funciones** (`read`/`write`/`publish`) con token y service role; publicar el espejo git.
4. **Conectar workflows** entity-trigger: publicar + notificar al operador con paquete de mensaje listo en el idioma del cliente.
5. **Generar QRs** con `tools/gen_qrs.py` (URLs del negocio) y hoja de impresión.
6. **Encender el turno semanal** (salud, datos, inconsistencias, calendario).
7. **Instrumentar conversión** en `/confirmacion` y enlazar GA4/Ads.

Tiempo de replicación estimado: **72 horas** por propiedad, la mayor parte en marca y contenido, no en ingeniería.

---

## Lecciones registradas

1. Lo que el cliente ve es la única verdad: si vive en una rama, no existe.
2. Los datos del negocio deben ser auditables: git como memoria operativa.
3. Un límite declarado vale más que una promesa: el score honesto 8.7 vende más que un 10 inflado.
4. La automatización sin documentación es deuda; los ADRs son parte del producto.
5. El agente no reemplaza al dueño: ejecuta, verifica y documenta; las decisiones siguen siendo humanas.
