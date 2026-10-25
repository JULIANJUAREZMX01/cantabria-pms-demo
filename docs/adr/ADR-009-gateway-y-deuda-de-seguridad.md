# ADR-009 — Frontera con el backend, contrato actual y deuda de seguridad

**Estado:** Propuesta · **Fecha:** 2026-10-24

## Contexto
Hallazgos verificados en el repo `cantabria-pms-demo` (commit `3ee801a`):
1. `src/App.tsx:87` y `src/GuestApp.tsx:192` incluyen el token de `cantabriaWrite` en el bundle público; la función escribe con `asServiceRole`. **Cualquiera que abra el JS puede escribir en la base.** ADR-002 afirma que el token no se expone en la UI: no es cierto.
2. Los PIN (nivel personal y dueño) estaban en texto claro en ADR-002 y CALENDARIO, y se validan en el cliente.
3. `data.js` y `csv/` son públicos y contienen nombres de huéspedes, teléfonos (en `notes`) y correos de servicio (`created_by`).
4. `cantabriaWrite.checkIn` siempre crea una estancia nueva: hacer check-in de una reserva la duplica.
5. El backend no tiene `updateRequest`, `updateExtra`, registro de pago ni login por persona.
6. Datos de prueba con `is_sample=false` (8 de 8), estados mezclados (`Activa`/`checked_in`, `paid`/`Pagada`), una fila "Por asignar" en habitaciones, 18 habitaciones declaradas contra 10 registradas, dirección distinta al cartel de marca.

## Decisión
- Toda la app habla con el backend solo a través de `Gateway` (`src/gateway/types.ts`). Hay dos implementaciones: **demo** (semilla de hoy + eventos en el navegador; nada sale del dispositivo) y **legacy** (contrato actual de Base44). Cambiar de backend es escribir otro gateway.
- Modo **legacy** conserva exactamente la seguridad de v6, pero **PIN y token entran por secretos de GitHub en el build**, no por el repo. Sigue siendo deuda: quedan en el bundle.
- Los eventos que el contrato actual no soporta (`request.resolve`, `extra.deliver`, bloquear habitación) se **deshabilitan en producción** con aviso, y funcionan en demo. No fallan en silencio.
- La **capa anticorrupción** (`src/domain/legacy.ts`) normaliza estados heredados y descarta registros inválidos; `src/domain/audit.ts` reporta cada hallazgo anterior (CI semanal + vista del dueño).
- La landing solo usa `public.json` (conteo de habitaciones listas, sin un solo nombre; probado).

## Cambios necesarios en Base44 (para cerrar la deuda)
| Acción | Cambio |
|---|---|
| `login` | Verifica persona + PIN en el servidor y devuelve un token de sesión corto por persona. Reemplaza el token y PIN compartidos. |
| `checkIn` | Acepta `stay_id` y actualiza la reserva en vez de crear otra. |
| `updateRequest`, `updateExtra` | Resolver solicitudes y entregar extras. |
| `recordPayment` | Registrar pago de una estancia. |
| `setRoomStatus` | Aceptar `bloqueada`. |
| lectura | `cantabriaRead` autenticada para el equipo; `cantabriaPublish` deja de publicar PII (solo `public.json`). |
| entidades | `Expense`, `StockItem` para habilitar los sombreros de Compras e Inventario. |

## Consecuencias
✅ Nada rompe hoy: legacy funciona con el contrato vigente; lo bloqueado está a la vista.
⚠️ **Rotar ya** el token y los PIN: los valores anteriores están en el historial público de git.
⚠️ Mientras `data.js` siga público, los datos de huéspedes son públicos. Es la primera cosa a cerrar antes de operar con huéspedes reales.
