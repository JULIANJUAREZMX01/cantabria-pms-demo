# DACC — Desarrollo Agéntico de Ciclo Cerrado
### Metodología, arquitectura y evaluación comparada del proyecto Hotel Cantabria
**Fecha:** 26-oct-2026 · **Autor:** KynicOS · **Aprueba:** Julián Juárez · **Estado:** Propuesta de nomenclatura oficial

---

## 1. Nombre y definición

**Nombre del método:** **DACC — Desarrollo Agéntico de Ciclo Cerrado** *(Agentic Closed-Loop Development)*

**Arquitectura resultante:** **AEI — Arquitectura Estática Instrumentada** *(Static Instrumented Architecture)*

**Definición formal:**
> DACC es un modo de desarrollo de software en el que un agente de IA actúa como desarrollador y operador continuo dentro de un ciclo cerrado de construir → desplegar → medir → documentar → mantener; sobre una arquitectura estática servida por CDN (sin servidor propio), con los datos del negocio como archivos versionados en git y un backend como servicio que expone operaciones verificables. El humano define marca, alcance, datos y decisiones de negocio; el agente ejecuta, verifica y deja rastro documental (ADRs, commits atómicos, calendario vivo, CI).

**Escala de madurez agéntica (E1–E5):**
| Nivel | Definición | Estado Cantabria |
|---|---|---|
| E1 | Agente asiste (autocompletar, snippets) | superado |
| E2 | Agente escribe código que un humano despliega | superado |
| E3 | Agente despliega y verifica solo (CI/CD propio) | superado |
| E4 | Agente opera el negocio digital: ejecuta cambios, mantiene, documenta y notifica; humano decide | **← aquí (Hotel Cantabria)** |
| E5 | Agente negocia y opera autónomamente con límites de negocio y presupuesto | futuro |

---

## 2. Arquitectura AEI — cuatro estratos

1. **Estrato de presentación (estático):** Astro en GitHub Pages, CDN global, sin servidor. HTML/CSS/JS compilados, cero PHP. Cinco idiomas, animación GSAP/Lenis, identidad de marca, accesibilidad (`prefers-reduced-motion`).
2. **Estrato de datos (espejo git):** `data.js` + 5 CSVs publicados en cada operación desde Base44. Todo cambio operativo queda como commit: el negocio es auditable con `git log`.
3. **Estrato de operaciones (backend como servicio):** entidades Base44 (Stay, RoomStatus, ExtraOrder, ServiceRequest, HotelProperty, Guest, GuestReview) + funciones `cantabriaRead/Write/Publish` con token y `asServiceRole`. Gateway cliente con abstracción demo/legacy/proxy y cola offline (outbox).
4. **Estrato agéntico (operador):** workflows entity-trigger que publican y despiertan al agente (aviso, paquete WhatsApp en el idioma del huésped), turno semanal de mantenimiento, ADRs, CI con 42 pruebas, alias y migraciones verificadas en producción.

---

## 3. Comparación: mercado mexicano tradicional vs DACC

**Baseline tradicional (lo más usado en México para sitios de hotel):** WordPress + tema/Elementor sobre hosting compartido (WordPress concentra ~41–43% de todos los sitios del mundo en 2026 y ~59% del mercado CMS), plugins para reservas/idioma/formularios, agencia por proyecto (~MXN 8–40 mil) + mantenimiento mensual (~MXN 500–3 mil), o constructor Wix/Squarespace, o motor de reservas SaaS incrustado (Booking widget / Cloudbeds / Little Hotelier).

| Criterio | Mercado tradicional (MX) | DACC Cantabria (nuestro) | Ganador |
|---|---|---|---|
| **Desempeño** | 6.5 — plugins, PHP, TTFB variable | 9.5 — estático en CDN, sin TTFB de servidor | DACC |
| **Costo anual** | 5.5 — hosting + plugins + mantenimiento mensual | 9.5 — Pages gratis, BaaS por consumo | DACC |
| **Velocidad de entrega** | 4–8 semanas de agencia | 4 días de v7 a v9 + PMS, con verificación en producción | DACC |
| **Seguridad** | 5 — superficie PHP+plugins (vector clásico de defacements) | 9 — sin servidor propio; 2 tokens con scope; git como rollback | DACC |
| **Integración operativa** | 3 — web estática; operación en papel/WhatsApp | 9.5 — cada operación del hotel actualiza datos y dispara avisos | DACC |
| **Multiidioma** | 6 — WPML/Polylang de pago y pesados | 8.5 — 5 idiomas nativos en build | DACC |
| **Trazabilidad** | 4 — cambios en BD sin historial útil | 9.5 — ADRs + commits atómicos + calendario vivo | DACC |
| **SEO** | 7 — plugins maduros (Yoast + GBP) | 7.5 — JSON-LD, hreflang, canonical; **falta dominio propio y ficha Google** | Empate |
| **Edición de contenido por el dueño** | 8.5 — panel WP | 5.5 — copy vive en código/i18n; requiere al agente (el PMS sí tiene UI operativa) | Mercado |
| **Cobro/reserva en línea** | 6.5 — plugins de pago o SaaS con comisión | 4 — hoy reserva directa por WhatsApp; Stripe pendiente | Mercado |
| **Mantenimiento** | 5 — horas de agencia, parches manuales | 9 — turno semanal agéntico + CI + health checks | DACC |
| **Dependencia/riesgo** | 7.5 — WordPress maduro, comunidad enorme | 6.5 — plataforma Base44 + bus factor de un agente | Mercado |
| **PROMEDIO PONDERADO** | **6.0 / 10** | **8.7 / 10** | **DACC** |

### Las diferencias que importan (no cosméticas)

1. **No hay servidor que se caiga ni que hackear.** Un site de hotel en WordPress se compromete por plugin sin actualizar; aquí no existe PHP ni panel que atacar.
2. **La operación del hotel ES el sitio.** En el mercado, la web y el PMS viven separados (si existe PMS). Aquí check-in, limpieza y extras reescriben los datos publicados y despiertan al agente.
3. **El negocio es auditable.** Cualquier cambio operativo es un commit con fecha, actor y motivo. No hay "quién tocó la base".
4. **Instrumentación de conversión desde el día uno:** página `/confirmacion` única + hook GA4 listo; el mercado suele quedarse en un "gracias" sin objetivo medible.
5. **Puente físico-digital:** 8 QRs de marca (fachada, contacto vCard, WhatsApp, WiFi por piso, concierge), hoja de impresión y generador versionado. Las agencias entregan PDFs.
6. **Documentación como producto:** 16 ADRs, calendario vivo, catálogo de inconsistencias. La agencia entrega factura.

### Límites honestos (lo que aún no somos)

- **Sin CMS visual:** el dueño no edita copy solo; depende del agente (decisión consciente: menos superficie, menos bugs).
- **Sin motor de reservas con cobro:** Stripe está diseñado (Sprint 1 de MueveCancún lo probó) pero no cableado aquí; hoy cierra WhatsApp.
- **SEO condicionado:** el puntaje perfecto exige dominio propio y la ficha de Google unificada (hoy duplicada y con 3.4★).
- **Dependencia de plataforma:** Base44 y el agente son el equipo; si desaparecen, el código y los datos siguen en git, pero la operación se degrada.
- **Bus factor 1:** una sola persona (Julián) con el contexto de negocio. Mitigación: todo documentado en ADRs.

---

## 4. Calificación final

| Dimensión | Nota | Comentario |
|---|---|---|
| Arquitectura | **9.2** | Estratos limpios, gateway abstracto, cola offline, espejo git |
| Ingeniería y verificación | **9.0** | 42 pruebas, astro check, E2E real en producción con reservas |
| Producto y conversión | **8.0** | Funnel instrumentado; falta cobro en línea |
| Identidad y UX | **9.3** | Tipografía, paleta y movimiento derivados de la marca real |
| Operación y mantenimiento | **9.0** | Turnos, health, republicación automática |
| Autonomía del dueño | **6.0** | Puede operar el PMS, no editar el sitio |
| **GLOBAL** | **8.7 / 10** | **Calificación: A– (Excelente con margen claro)** |

**Veredicto:** el hotel obtiene, por menos costo que una web WordPress de agencia, un sistema con mejor desempeño, seguridad y trazabilidad, y una capa operativa que la oferta tradicional no contempla. La brecha a cerrar no es técnica sino de negocio: cobro en línea, dominio y ficha de Google.

---

## 5. Ruta de evolución (E4 → E5)

1. Stripe/MP conectado a la reserva directa (cierra el ciclo de ingreso).
2. CMS ligero orientado a contenido (no a código) para que Julián edite copy sin agente.
3. Dominio propio + ficha de Google unificada (sube SEO a 9).
4. Persona "Concierge Cantabria" en WhatsApp automatizando el paquete de confirmación.
5. Evaluar Netlify en modo proxy para sacar el token del bundle (ADR-012).
