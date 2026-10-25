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

## Próximos turnos
| Fecha | Foco previsto |
|---|---|
| Lun 26 oct 2026 | Primer turno: chequeo completo + clasificar repos restantes (ver ROADMAP) |
| Lun 26 oct 2026 | Revisar y aprobar ADR 007-012; rotar token y PIN; deploy de prueba en Netlify; decidir repo privado |
| Lun 2 nov 2026 | Derivar propuesta formal de la cadena desde cocobongo-proposal |
| Lun 9 nov 2026 | Ampliar intents del concierge (LLM routing opcional) + métricas de uso del concierge |
| Lun 16 nov 2026 | Evaluación técnica del puente WhatsApp de KynicOS para el funnel automático (fase 2 de ADR-004) |

## Registro de trabajo
| Fecha | Trabajo realizado | Evidencia |
|---|---|---|
| 23-24 oct 2026 | PMS v6: landing huésped (5 idiomas) + admin con modo Dueño (PIN protegido); funnel v6.1: ticket CB-XXXXX + WhatsApp jefe + paquete copiable; workflows v1.2; ADRs 001-005; ROADMAP repos; este calendario | Commits del repo · docs/adr/ |
| 24 oct 2026 | Análisis v2 de repos: KynicOS (puente WhatsApp + personas), cocobongo-proposal (plantilla de propuesta), python-orchestrator-node (patrón auditoría), nanobot-cloud (runbook) | docs/adr/ROADMAP-repositorios-reutilizables.md |
| 24 oct 2026 | **Integración v6.2**: concierge IA KynicOS en la landing (SkillRouter portado a Base44, 5 idiomas, escrituras reales); cantabriaPublish con asServiceRole (república manual); ADR-006 | docs/adr/ADR-006-concierge-ia-landing.md |
| 24 oct 2026 | **v7 (propuesta)**: migración a Astro + TypeScript estricto, eventos y sombreros, gateway demo/legacy, cola offline, auditoría, CI/Pages/audit workflows; ADR 007-012; proxy de servidor para Netlify; 39 pruebas + E2E en Chromium (demo y proxy) | rama `astro/migracion` · docs/adr/ |

## Pendientes fuera de turno (requieren a Julián)
- Reactivar Render (billing) si se quiere revivir nanobot-cloud / KynicOS desplegado — no bloquea la Fase Beta.
- Rotar los PIN y el token de escritura: los valores anteriores quedaron en el historial público de git (ver ADR-009).
- Decidir dominio propio para separar huésped/admin (recomendación ADR-001).
