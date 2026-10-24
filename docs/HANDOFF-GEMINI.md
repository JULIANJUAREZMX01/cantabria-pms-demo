# Handoff para Gemini (Google AI) — Proyecto Cantabria PMS

> Mensaje preparado por KynicOS (agente de Julián en Base44) para el asistente
> agente Gemini, que dio el arranque de este proyecto y cuya semilla fue
> estructurada, corregida y llevada a producción. Uso: pégalo como prompt
> inicial a Gemini para que continúe la obra con contexto completo.

---

Hola Gemini: soy KynicOS, el agente de operaciones de Julián Juárez (@JAJA.DEV). Tú empezaste este proyecto; tomé tu arranque y lo llevé a producción. Este es el estado actual para que continúes con contexto completo, sin repetir trabajo.

**El negocio:** cadena hotelera "Cantabria" (3 propiedades: Hostales Cantabria RyC, Hotel Cantabria CDMX, Hotel Cantabria Tulancingo). Proyecto Beta de 8 semanas usando Tulancingo como laboratorio para validar la digitalización antes de escalar. Enfoque: SOPs y guest journey primero, marketing después.

**Lo que está vivo (todo probado E2E):**
- Landing del huésped: https://julianjuarezmx01.github.io/cantabria-pms-demo/ — una sola página, 5 idiomas (ES ancla + EN/ZH/DE/FR), reserva directa con ticket CB-XXXXX, WhatsApp del jefe (+52 775 759 1185) y desde hoy concierge IA: el huésped pide agua/café/kit/toallas o reporta problemas y se escribe EN LA BASE REAL desde la web, en su idioma.
- PMS del personal: /admin.html — tabs Limpieza/Recepción/Concierge/Reservar + Modo Dueño (👑 PIN 1717; personal PIN 2026) con KPIs consolidados de la cadena.
- Backend: Base44 (entidades Stay, RoomStatus, ExtraOrder, ServiceRequest, Guest, GuestReview, HotelProperty; funciones cantabriaRead/cantabriaWrite/cantabriaPublish/cantabriaConcierge). 4 workflows entity-trigger republican datos en ~1 min y avisan por Telegram; 1 workflow semanal (lunes 9:00) ejecuta optimización autónoma documentada.
- Agentes: KynicOS registra operaciones por Telegram y arma paquetes WhatsApp de confirmación en el idioma del huésped.

**Dónde está la verdad:** repo https://github.com/JULIANJUAREZMX01/cantabria-pms-demo
- docs/CALENDARIO.md — calendario vivo de mantenimiento (se actualiza cada turno)
- docs/adr/ — 6 ADRs: arquitectura, seguridad PIN, i18n, funnel WhatsApp, optimización continua, concierge IA
- docs/adr/ROADMAP-repositorios-reutilizables.md — análisis de los otros repos de Julián
- src/ — código fuente; index.html/admin.html llevan el bundle inline

**Reglas del proyecto (mandato del dueño):**
1. Optimizaciones pequeñas y reversibles sin pedir autorización; cambios grandes se proponen primero.
2. Todo cambio se documenta como ADR (Contexto/Decisión/Consecuencias) en docs/adr/.
3. El calendario docs/CALENDARIO.md se actualiza en cada turno.
4. Escrituras con token; PINs: personal 2026, dueño 1717 (rotar al escalar).
5. Nunca secretos en el código; el token 'cantabria-beta-2026' es de app, los secretos viven en Base44/GitHub.

**Cómo continuar (próximos turnos en el calendario):** clasificar repos restantes; ampliar los intents del concierge (routing LLM); evaluar el puente WhatsApp de KynicOS (repo KynicOS/app/cloud/whatsapp_bridge.py) para confirmaciones automáticas salientes (fase 2); proponer la propuesta formal de la cadena (plantilla: repo cocobongo-proposal).

Si vas a tocar código: esbuild para el bundle inline (npx esbuild src/main_guest.tsx --bundle --minify --jsx=automatic), el bundle va tras el script de data.js en index.html. No rompas data.js (usa la llave 'serviceRequests'). Después de escribir datos, república con POST a /functions/cantabriaPublish.

Bienvenido al equipo: la casa ya está construida; ayúdanos a hacerla crecer sin romper lo que ya sirve. — KynicOS 🐕🏛️
