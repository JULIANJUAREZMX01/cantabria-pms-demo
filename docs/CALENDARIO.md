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

## Próximos turnos
| Fecha | Foco previsto |
|---|---|
| Lun 26 oct 2026 | Primer turno: chequeo completo + clasificar repos restantes (ver ROADMAP) |
| Lun 2 nov 2026 | Derivar propuesta formal de la cadena desde cocobongo-proposal |
| Lun 9 nov 2026 | Ampliar intents del concierge (LLM routing opcional) + métricas de uso del concierge |
| Lun 16 nov 2026 | Evaluación técnica del puente WhatsApp de KynicOS para el funnel automático (fase 2 de ADR-004) |

## Registro de trabajo
| Fecha | Trabajo realizado | Evidencia |
|---|---|---|
| 23-24 oct 2026 | PMS v6: landing huésped (5 idiomas) + admin con modo Dueño (PIN 1717); funnel v6.1: ticket CB-XXXXX + WhatsApp jefe + paquete copiable; workflows v1.2; ADRs 001-005; ROADMAP repos; este calendario | Commits del repo · docs/adr/ |
| 24 oct 2026 | Análisis v2 de repos: KynicOS (puente WhatsApp + personas), cocobongo-proposal (plantilla de propuesta), python-orchestrator-node (patrón auditoría), nanobot-cloud (runbook) | docs/adr/ROADMAP-repositorios-reutilizables.md |
| 24 oct 2026 | **Integración v6.2**: concierge IA KynicOS en la landing (SkillRouter portado a Base44, 5 idiomas, escrituras reales); cantabriaPublish con asServiceRole (república manual); ADR-006 | docs/adr/ADR-006-concierge-ia-landing.md |

## Pendientes fuera de turno (requieren a Julián)
- Reactivar Render (billing) si se quiere revivir nanobot-cloud / KynicOS desplegado — no bloquea la Fase Beta.
- Rotar PINs (2026/1717) al escalar a más personal.
- Decidir dominio propio para separar huésped/admin (recomendación ADR-001).
