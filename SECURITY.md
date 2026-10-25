# Seguridad

Estado honesto de la beta (detalle y plan en `docs/adr/ADR-009-gateway-y-deuda-de-seguridad.md`):

- El token de escritura y los PIN compartidos viajan en el bundle público. Entran por secretos de CI, no por el repo, pero siguen siendo extraíbles.
- `data.js` y `csv/` son públicos y pueden incluir datos de huéspedes mientras Base44 los publique así.
- No usar con huéspedes reales hasta cerrar ambos puntos.

Reglas del repo: sin secretos, PIN ni teléfonos en código, docs o fixtures. El texto de la base se pinta con `textContent`, nunca con `innerHTML`.

Reportar un problema: mensaje directo al dueño del repositorio, no en un issue público.
