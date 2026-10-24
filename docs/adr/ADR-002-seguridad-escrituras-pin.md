# ADR-002 — Escrituras reales con PIN + service role

**Estado:** Aceptada · **Fecha:** 2026-10-24

## Contexto
La página es pública. Personal (limpieza, recepción) y dueño necesitan escribir datos reales desde teléfonos compartidos, sin login de usuario. La app de Base44 es privada: el SDK anónimo rechaza entidades.

## Decisión
- Tres niveles: **huésped** (solo reserva web, sin PIN), **personal** (PIN `2026`, sessionStorage `cantabria_pin`), **dueño** (PIN `1717`, sessionStorage `cantabria_owner`, botón 👑).
- Cada acción real pide confirmación visual antes de escribir; sin PIN existe el modo demo (localStorage, etiquetado).
- `cantabriaWrite` usa `base44.asServiceRole` (patrón oficial para HTTP directo) protegido por token; los PINs se validan en el cliente y el token nunca se expone en la UI.
- Los 4 workflows entity-trigger republican datos y despiertan a KynicOS para avisar por Telegram.

## Consecuencias
✅ Cero fricción para el personal (PIN una vez por dispositivo), trazabilidad por Telegram de cada operación real.
✅ El dueño ve KPIs de cadena sin exponerlos al huésped.
⚠️ Los PINs son de factor único; recomendado rotarlos y separar dominio público/privado al escalar.
