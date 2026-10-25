# Verificación de astro/migracion — 2026-10-25

Base verificada: e0f37b7 (rama astro/migracion). Entorno: Node 24, npm ci.

| # | Hallazgo | Evidencia | Estado |
|---|---|---|---|
| 1 | npm run build y CI fallaban: astro check tipaba el React heredado (src/App.tsx, GuestApp.tsx, main*.tsx) | cientos de error ts(7026) en src/App.tsx | Corregido: movido a legacy/ (conserva historial con git mv) |
| 2 | Prueba ingresos: tres cifras con nombre fallaba tras poner defaultRate: 300 | 38/39 pruebas | Corregido: la semilla demo usa tarifa fija 650 |
| 3 | La promo quedó como defaultRate: 300 permanente; el cartel dice "hasta inicio de 2027" | src/lib/config.ts | Corregido: src/domain/pricing.ts cotiza noche por noche (<2027-01-01 → $300; después $650); el servidor la aplica; 3 pruebas nuevas |
| 4 | tools/cantabria_sync.py traía el token en claro (cantabria-beta-2026), contradiciendo SECURITY.md | TOKEN = "…" (variable sin uso) | Corregido: línea eliminada. Rotar el token igualmente (sigue en el historial) |
| 5 | HOTEL.est = 1928 se agregó pero nada lo usa | grep sin resultados | Pendiente: decidir dónde mostrarlo |

Resultado tras las correcciones: astro check 0 errores · 42/42 pruebas · build Pages y build proxy OK (proxy sin data.js público) · E2E en Chromium (demo) 18/18.

No verificado: ejecución real de la función en Netlify; GitHub Actions en la nube (solo reproducido en local).

Decisión abierta (dueño): una estancia que cruza el 2027-01-01 se cotiza mezclando tarifas y Stay.rate guarda el promedio redondeado. ¿La promo aplica a reservas directas y a estancias que cruzan la fecha?
