# ADR-008 — Un registro de eventos y vistas por sombrero

**Estado:** Propuesta · **Fecha:** 2026-10-24

## Contexto
El equipo es pequeño y se cubre entre puestos: recepción ayuda a limpiar, limpieza reporta fallas, el dueño barre, atiende, compra y supervisa. La v6 organiza la interfaz por pantalla ("Personal" / "Dueño"), no por tarea. "Personal" además es un mal nombre: no dice qué hacer.

## Decisión
- **Evento**: toda acción es un `HotelEvent` tipado (`stay.reserve`, `stay.checkIn`, `stay.checkOut`, `room.setStatus`, `extra.add`, `request.add`, `request.resolve`, `extra.deliver`) con `id`, `at`, propiedad y **actor** (huésped, concierge o persona + sombrero). Un reductor puro convierte estado + evento en estado nuevo.
- **Sombrero**: lo que una persona hace ahora, no quién es. Persona → varios sombreros, cambio con un toque. Hoy: Recepción, Limpieza y mayordomía, Mantenimiento, Concierge y guía, Dueño. Cada vista muestra "qué sigue", no un tablero.
- **Una entrada**: `/equipo` ("Entrar a mi turno"); el Dueño es un sombrero más. El botón "Personal" pasa a "Equipo" en los 5 idiomas.
- **Inventario** y **Compras y costos** quedan definidos pero **deshabilitados**: no existe entidad en el backend; no se muestran pantallas vacías.
- Ocupación = habitaciones distintas con huésped esta noche ÷ habitaciones declaradas por la propiedad. Ingresos separados en tres cifras con nombre: hospedaje esta noche, reservado 7 días, extras hoy.
- Acciones de dos toques ("Confirmar ✓"), como se pidió en la v6.

## Consecuencias
✅ Cada número tiene una definición y una prueba; la bitácora de "quién hizo qué" sale gratis del actor del evento.
✅ Cambiar de sombrero no pierde contexto: es la misma cola y el mismo estado.
⚠️ Los nombres de `src/data/people.ts` son marcadores; hay que sustituirlos por el equipo real y validar con ellos qué ve cada sombrero.
⚠️ El triage de mantenimiento (`src/domain/triage.ts`) es un borrador: causas, prioridades y ETAs las debe validar quien hace mantenimiento.
