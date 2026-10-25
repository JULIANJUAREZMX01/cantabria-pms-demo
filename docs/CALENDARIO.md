# 📅 Calendario de Mantenimiento y Optimización — PMS Cantabria

Documento vivo: control del turno autónomo semanal de KynicOS y de las acciones pendientes.
Cada turno semanal DEBE actualizar este archivo (agregar fila al registro y mover pendientes).

## Cadencia
- **Turno semanal:** lunes 09:00 (America/Cancun) — workflow "Cantabria Optimización Semanal".
- Rutina: salud de páginas y datos → consistencia de BD → UNA mejora reversible → ADR → fila en este registro → reporte por Telegram.


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
