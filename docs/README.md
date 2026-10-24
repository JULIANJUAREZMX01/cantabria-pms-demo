# Hotel Cantabria PMS — Documentación de Arquitectura

Sistema PMS multihotel + landing de huésped para la cadena Cantabria.
Sede piloto: **Hotel Cantabria Tulancingo** (laboratorio "Proyecto Beta").

## Mapa del sistema (v6.1)

- **Landing del huésped:** `index.html` — una sola página, 5 idiomas (ES ancla, EN, ZH, DE, FR), reserva directa, concierge IA, WhatsApp del jefe.
- **PMS del personal:** `admin.html` — tabs Inicio/Limpieza/Recepción/Concierge/Reservar + Modo Dueño (👑).
- **Datos vivos:** `data.js` (+ CSVs en `/csv/`) publicados automáticamente por `cantabriaPublish` tras cada cambio en la base.
- **Backend Base44:** entidades `Stay, RoomStatus, ExtraOrder, ServiceRequest, Guest, GuestReview, HotelProperty`; funciones `cantabriaRead`, `cantabriaWrite`, `cantabriaPublish`; 4 workflows entity-trigger + 1 semanal.
- **Agente KynicOS:** registra operaciones por Telegram, arma paquetes WhatsApp de confirmación en el idioma del huésped y ejecuta la optimización continua.

## Registro de decisiones (ADR)

| ADR | Título | Estado |
|---|---|---|
| [001](adr/ADR-001-arquitectura-pms.md) | Frontend estático en GitHub Pages + backend Base44 | Aceptada |
| [002](adr/ADR-002-seguridad-escrituras-pin.md) | Escrituras reales con PIN + service role | Aceptada |
| [003](adr/ADR-003-landing-i18n-huesped.md) | Una sola landing con i18n, español por defecto | Aceptada |
| [004](adr/ADR-004-funnel-reserva-whatsapp.md) | Funnel de reserva con ticket y confirmación WhatsApp | Aceptada |
| [005](adr/ADR-005-optimizacion-continua-calendario.md) | Optimización continua autónoma + ADRs | Aceptada |
| [ROADMAP](adr/ROADMAP-repositorios-reutilizables.md) | Repositorios del autor reutilizables | Análisis |

Convención ADR: **Contexto / Decisión / Consecuencias**. Toda optimización (humana o de agente) agrega o actualiza un ADR.
