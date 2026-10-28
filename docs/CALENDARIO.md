# 📅 Calendario de Mantenimiento y Optimización — PMS Cantabria

Documento vivo: control del turno autónomo semanal de KynicOS y de las acciones pendientes.
Cada turno semanal DEBE actualizar este archivo (agregar fila al registro y mover pendientes).

## Cadencia
- **Turno semanal:** lunes 09:00 (America/Cancun) — workflow "Cantabria Optimización Semanal".
- Rutina: salud de páginas y datos → consistencia de BD → UNA mejora reversible → ADR → fila en este registro → reporte por Telegram.

## 2026-10-25 · Landing viva (Pages/main): acceso de equipo discreto + mapa

- Eliminado el botón de Personal de la esquina superior derecha de la landing viva; queda solo el enlace discreto bajo el pie.
- Agregada la sección "Cómo llegar": mapa de Google por dirección oficial (Zaragoza Ote. 104), dirección completa y botón "Abrir en Google Maps".
- Verificado en producción con navegador real.
- La versión formal completa (9 piezas de marca, SEO, JSON-LD, reseñas, 5 idiomas) vive en la rama astro/migracion (ADR-013) y sale al hacer el cutover a Netlify.

## 2026-10-25 · Turno extraordinario: reporte Gemini + Netlify

- Recibido el reporte del agente Gemini (migración Astro/Netlify, ADR-007..012, sesiones firmadas).
- Rama `astro/migracion` creada con su proyecto completo (commit 3e0aa8f), CI de GitHub corriendo.
- Backend Base44 endurecido (yo):
  - `cantabriaWrite.checkIn` ahora deduplica por `Ref CB-XXXXX` (fin de reservas duplicadas, ADR-009).
  - Nuevas acciones `updateRequest` y `updateExtra` (ADR-009).
  - `cantabriaPublish` ya NO publica teléfonos de huéspedes en data.js ni CSVs (scrub `Tel: [privado]`); `guests` fuera del payload público. Verificado en producción: 0 teléfonos expuestos.
- Repo espejo confirmado: `sistemascancunjefe-ai/cantabria-pms-demo-v01AI` (idéntico a main, solo lectura).
- Pendientes humanos: deploy de prueba en Netlify; decidir promo $300 vs $650; confirmar "EST. 1928" con el dueño; rotar token+PINs al cutover; pasar repo a privado tras validar Netlify.

## 2026-10-25 · Decisiones de negocio cerradas

- **Promo $300/noche SÍ aplica a reservas web directas.** Aplicado en: landing viva (main), admin Reservar (main) y `defaultRate` de la política del servidor en `astro/migracion` (commit 41210ae). $650 queda obsoleto.
- **EST. 1928 confirmado como real por el dueño.** Ya visible en el header de la landing; agregado como `HOTEL.est` en la config de la rama Astro para que Gemini lo renderice en los escudos.

## 2026-10-25 · Parche de verificación de Gemini aplicado y verificado

- Aplicado fix-verificacion.patch (semántica íntegra): legado React a legacy/ con git mv, tarifa noche por noche (src/domain/pricing.ts: $300 antes de 2027-01-01, $650 después, promedio redondeado en Stay.rate), semilla demo con tarifa fija 650, token fuera de tools/cantabria_sync.py, docs/VERIFICACION-2026-10-25.md.
- Verificación local (Node 22): 42/42 pruebas · astro check 0 errores · build completo (6 páginas).
- Verificación en la nube (lo que Gemini no pudo hacer): GitHub Actions CI en commit 9c2bde2 → **success** (antes fallaba en e0f37b7).
- Demo vivo en Pages intacto (landing React de main sigue sirviéndose; Pages solo despliega desde main).
- Pendientes: deploy real en Netlify (Julián), rotación de credenciales al cutover, decidir dónde renderizar HOTEL.est en el landing Astro, decisión dueño sobre estancias que cruzan 2027-01-01 (hoy: mezcla noche por noche con promedio redondeado).

## 2026-10-25 · Landing formal v7 (marca + SEO + mapa + reseñas)

- 9 piezas de marca integradas en WebP (ADR-013); hero con rótulo, sello de talavera, monograma, galería de 5 carteles y pie con rótulo sobrio.
- Textos nuevos en 5 idiomas (historia, pilares, promo, dato curioso, silencio, cómo llegar). SEO completo: title/description por idioma, canonical, hreflang, Open Graph, JSON-LD Hotel, un h1. `/equipo/` en noindex.
- Mapa por dirección oficial + botón Google Maps + WhatsApp. Reseñas: 2 reales de 5 estrellas con enlace.
- Botón superior de Personal eliminado; queda solo el enlace discreto al pie.
- Verificación: 42/42 pruebas · astro check 0 errores · build OK · auditoría de las 5 páginas (imágenes, alt, h1, mapa, enlace de equipo): todo OK.
- **Pendientes de Julián:** (1) reclamar/unificar la ficha de Google Business: hoy hay 2 fichas mal ubicadas ("Cantabria" tipo Love hotel en Echavarri 214 y "Hostales Cantabria" en Rodríguez y Coss 301C); (2) confirmar que las reseñas de "Hostales Cantabria" son de su negocio; (3) mover el "$300" del title SEO a `HOTEL.promo` para que caduque con la promo.

## 2026-10-25 · CUTOVER: Pages sirve el sitio Astro v7 con las 9 imágenes de marca

- Queja de Julián: "no veo ninguna imagen" — la página viva seguía siendo la demo React; las imágenes vivían solo en la rama.
- Ejecutado el cutover del espejo demo (ADR-012): merge astro/migracion → main (0daa105), Pages cambiado a build_type=workflow, GATEWAY_MODE=legacy con token y PINs actuales en Actions vars (fallback secrets||vars en pages.yml; rotar al ir a Netlify).
- Verificado en producción: (1) 9 imágenes de marca renderizan (screenshot + HTTP 200); (2) reserva E2E desde la página viva llegó a la Base44 con tarifa 300 cotizada por fecha y Ref CB-7RME5; (3) login de Recepción con PIN 2026 carga datos vivos (Enrique 101, reservas sin habitación, walk-in); (4) la antigua landing React queda en legacy/.
- URLs: huésped = / · personal = /equipo/ (PINs sin cambio: 2026 staff, 1717 dueño).
- Dependabot abrió PRs de actualización (pendientes de revisión en un turno regular).

## 2026-10-25 · Landing v8: rediseño colonial elevado (petición de Julián)

- "Puedes hacerlo mucho mejor" → iteración de diseño sobre la v7 viva: tipografía real (Playfair Display en títulos, Great Vibes en el eslogan), paleta exacta del cartel (#1a3e6d azul, #b8893a oro, #c7986b cinta, #d15a42 terracota, #5a8f7d salvia), medallones ornamentales (❦ ✦ ❧) en pilares, divisores con filete dorado, eyebrow "HOTEL CANTABRIA · EST. 1928", hero con doble marco dorado, tarjetas con sombra y hover, botones con gradiente y elevación, y la sección de reserva como bloque de conversión destacado (azul profundo + botón dorado).
- Emojis de los pilares retirados (eran cheap para la marca); concierge conserva los chips utilitarios.
- Verificado en producción con capturas: hero enmarcado + reserva destacada renderizan bien; CI verde, 42/42 pruebas, astro check 0 errores.
- Siguientes candidatos de diseño (a proponer): favicon con monograma vectorizado, patrón de talavera tenue de fondo en secciones alternas, animación de entrada en el sello, versión oscura no (marca es clara).

## 2026-10-25 · Landing v9: GSAP + Lenis (petición de Julián: "web animada y viva")

- Frameworks integrados (npm, self-hosted, sin CDN): gsap 3.15 (core + ScrollTrigger) y lenis 1.3.
- Sistema de movimiento en src/client/motion.ts: scroll suave Lenis (con manejo de anclas), entrada coreografiada del hero (rótulo, eslogan, titular, promo, botones, idiomas), parallax del rótulo al salir, sello de talavera girando con el scroll, revelados en cascada de secciones/tarjetas/ornamentos/reservas, mapa y pie con cierre suave.
- Cinta del cartel convertida en doble marquesina viva (tras hero y antes del pie, inclinadas ±1.2°, bucle CSS infinito): "Es mi casa, es tu casa ✦ EST. 1928 ✦ $300 MXN ✦ Tulancingo · Hidalgo ✦ Hotel Cantabria".
- Accesibilidad: prefers-reduced-motion desactiva TODO el movimiento (Lenis, tweens y marquesina); sin JS la página queda 100% visible (tweens tipo from, sin estados ocultos en CSS).
- Verificado en producción: bundles con GSAP/Lenis servidos, hero renderizado post-animación, scroll suave y revelados disparados en E2E, CI verde, 42/42 pruebas, astro check 0 errores.

## 2026-10-25 · Sistema QR v1: 5 códigos de marca generados y verificados

- QRs con identidad (azul #1a3e6d sobre crema #f2e8d5, monograma central, ECC H): fachada-info (landing multiidioma), contacto (vCard descargable), whatsapp (wa.me prellenado), recepcion-reservas (#reservar), habitacion-concierge (#concierge, ancla añadida).
- Escaneabilidad verificada con OpenCV (los 5 decodifican su URL completa).
- Hoja de impresión en public/qr/imprimir.html; generador versionado en tools/gen_qrs.py; estrategia completa en docs/QR-ESTRATEGIA.md (mapa por zonas, tamaños, materiales, pendientes).
- Pendientes Julián: credenciales del wifi (QR nativo), reclamar ficha Google antes del QR de reseñas, dominio propio (regenerar QRs con un comando).

## 2026-10-25 · QRs WiFi por piso

- Julián entregó capturas de las dos redes: piso 1 y piso 2 (2.4G). Generados wifi-piso1.png y wifi-piso2.png (formato nativo WIFI:T:WPA, verificados con OpenCV), añadidos a imprimir.html y QR-ESTRATEGIA.md. Total sistema QR: 7 códigos. Pendiente: QR de reseñas (ficha Google).
- Seguridad: la clave está embebida en el QR por diseño (comportamiento estándar de WiFi QR); el repo es público, evaluar rotar clave al pasar el repo a privado o publicar solo la hoja de impresión fuera del repo.

## 2026-10-25 · QR WiFi 5G piso 2

- Julián entregó la red 5G del piso 2. Generado wifi-piso2-5g.png (verificado OpenCV), añadido a imprimir.html y QR-ESTRATEGIA.md. Sistema QR: 8 códigos. Pendiente por confirmar: si existe red 5G del piso 1 (no se ha recibido captura).

## 2026-10-25 · Página de confirmación /confirmacion (ADR-014)

- Nueva subpágina única (i18n por ?lang=, noindex) que aterriza el funnel de reserva con referencia y fechas en la URL. La landing redirige tras despachar el evento (500 ms de ticket visible).
- Hook GA listo: GA_ID vacío en el script; al recibir el Measurement ID de Julián se activa gtag.js + evento reservation_confirmed. Sin ID, el objetivo puede crearse en GA4 como page_location contiene /confirmacion.
- Build 7 páginas, 42/42 pruebas, astro check 0 errores.

## 2026-10-26 · Turno semanal (cierre)

- SALUD: landing 200 ✓, /equipo/ 200 ✓, alias /admin.html verificado en producción (301 → /admin.html/ → refresh → /equipo/, ADR-015).
- DATOS: synced_at estaba rancio (25-oct 11:23Z); cantabriaPublish ejecutado dos veces, data.js + 5 CSVs al día (26-oct 16:28Z).
- Operación real: check-out de Laura Vega (hab 105, stay de prueba del flujo completo, vencida 26-oct) → Stay Cerrada ✓.
- Hueco de flujo detectado: checkOut cierra la Stay pero NO libera la RoomStatus (105 seguía 'lista'). Se corrigió manualmente con setRoomStatus (105 → sucia, prioridad Alta). PROPOSICIÓN (cambio mayor, requiere aprobación de Julián): extender cantabriaWrite action 'checkOut' para marcar la habitación 'sucia' automáticamente.
- Nota técnica API: setRoomStatus espera 'room_id' (con 'room' crea registro huérfano con room_id null; se detectó y eliminó el duplicado en la misma corrida).
- Inconsistencias catalogadas (demo/lab, sin tocar): stay Milton Dickenson duplicada (una sin ref), Huésped Demo en 'hab 5' inexistente en inventario, ServiceRequest abierta de Huésped Demo apuntando a hab 103, extras de seed (Juan Pérez/María Rodríguez/Ana Torres) sin stays, 'Por asignar' como room_id en RoomStatus.

## 2026-26-oct · Nomenclatura oficial: DACC + AEI (metodología y arquitectura)

- Documento docs/ARQUITECTURA-DACC.md: nombre (Desarrollo Agéntico de Ciclo Cerrado), definición formal, escala de madurez E1-E5 (Cantabria en E4), arquitectura de 4 estratos (presentación estática, datos espejo git, operaciones BaaS, operador agéntico), comparación contra baseline WordPress México (41-43% del mercado, hosting+plugins+agencia) con 12 criterios ponderados, límites honestos y ruta E4→E5.
- Calificación global: 8.7/10 (A-) contra 6.0/10 del baseline tradicional; mejores ejes: desempeño, costo, integración operativa, trazabilidad; brechas: cobro en línea, CMS visual del dueño, dominio/ficha Google, dependencia de plataforma.

## 2026-28-oct · Documentación cronológica + publicación LinkedIn

- docs/HISTORIA-DESARROLLO-CANTABRIA.md: cronología completa 23→28 oct (origen, fundación v4.4→v6, cutover v7/v8/v9, QRs, /confirmacion, turno semanal, ADR-015, DACC) con métricas finales (329 commits, 15 ADRs, 6+ workflows, 8 QRs, CI verde) y playbook de replicación semi-automática de 7 pasos (72 h por propiedad).
- docs/LINKEDIN-POST-CANTABRIA.md: versión principal (formato feed, ~2.8k chars) + versión corta, en voz de Julián (primera persona, números como argumento, cierre de oficio, límites honestos 8.7 vs 6.0). LinkedIn bloquea lectura de perfil sin sesión (authwall): calibración de voz pendiente si Julián inicia sesión en el navegador compartido.

## Próximos turnos
| Fecha | Foco previsto |
|---|---|
| Lun 2 nov 2026 | Derivar propuesta formal desde cocobongo-proposal; revisar candidatos Astro y repos con metadatos incompletos (ver ROADMAP) |
| Lun 2 nov 2026 | Revisar y aprobar ADR 007-012; rotar token y PIN; deploy de prueba en Netlify; decidir repo privado |
| Lun 2 nov 2026 | Derivar propuesta formal de la cadena desde cocobongo-proposal |
| Lun 9 nov 2026 | Ampliar intents del concierge (LLM routing opcional) + métricas de uso del concierge |
| Lun 16 nov 2026 | Evaluación técnica del puente WhatsApp de KynicOS para el funnel automático (fase 2 de ADR-004) |

## Registro de trabajo
| Fecha | Trabajo realizado | Evidencia |
|---|---|---|
| 26 oct 2026 | Turno semanal: landing 200; `/admin.html` 404 y `/equipo/` 200. `data.js`/CSV responden, pero `synced_at` marca 25 oct 11:23Z (aprox. 22 h anterior al chequeo). Añadido alias reversible `/admin.html` → `/equipo/` (ADR-015). Entidades revisadas: sin checkout vencido antes de hoy; detectadas diferencias huésped/habitación y solicitudes demo que requieren revisión humana. Continuado triage de repos por metadatos, sin importar código. | ADR-015 · ROADMAP · commit de este turno |
| 23-24 oct 2026 | PMS v6: landing huésped (5 idiomas) + admin con modo Dueño (PIN protegido); funnel v6.1: ticket CB-XXXXX + WhatsApp jefe + paquete copiable; workflows v1.2; ADRs 001-005; ROADMAP repos; este calendario | Commits del repo · docs/adr/ |
| 24 oct 2026 | Análisis v2 de repos: KynicOS (puente WhatsApp + personas), cocobongo-proposal (plantilla de propuesta), python-orchestrator-node (patrón auditoría), nanobot-cloud (runbook) | docs/adr/ROADMAP-repositorios-reutilizables.md |
| 24 oct 2026 | **Integración v6.2**: concierge IA KynicOS en la landing (SkillRouter portado a Base44, 5 idiomas, escrituras reales); cantabriaPublish con asServiceRole (república manual); ADR-006 | docs/adr/ADR-006-concierge-ia-landing.md |
| 24 oct 2026 | **v7 (propuesta)**: migración a Astro + TypeScript estricto, eventos y sombreros, gateway demo/legacy, cola offline, auditoría, CI/Pages/audit workflows; ADR 007-012; proxy de servidor para Netlify; 39 pruebas + E2E en Chromium (demo y proxy) | rama `astro/migracion` · docs/adr/ |

## Pendientes fuera de turno (requieren a Julián)
- Reactivar Render (billing) si se quiere revivir nanobot-cloud / KynicOS desplegado — no bloquea la Fase Beta.
- Rotar los PIN y el token de escritura: los valores anteriores quedaron en el historial público de git (ver ADR-009).
- Decidir dominio propio para separar huésped/admin (recomendación ADR-001).
