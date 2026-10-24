# ADR-005 — Optimización continua autónoma con calendario y ADRs

**Estado:** Aceptada · **Fecha:** 2026-10-24

## Contexto
Julián delega mantenimiento: "optimiza sin necesidad de autorización, pequeños ajustes", con documentación `.md` legible por humanos y agentes, formato ADR, y notificación por Telegram.

## Decisión
- Workflow **"Cantabria Optimización Semanal"** (lunes 09:00, America/Cancun) que despierta a KynicOS: salud de páginas/datos, consistencia de BD, **una** mejora pequeña reversible, documentación como ADR en `docs/adr/`, resumen a Julián.
- Mandato permanente: cambios pequeños y reversibles sin pedir permiso; cambios destructivos o grandes se proponen y esperan autorización.
- Toda decisión relevante se documenta como ADR (Contexto / Decisión / Consecuencias) en el repo; los ADRs son la memoria compartida humano-agente.

## Consecuencias
✅ El sistema mejora solo, con bitácora auditable y presupuesto controlado (1 turno/semana).
✅ Cualquier agente futuro puede leer los ADRs y continuar la obra sin contexto oral.
⚠️ El turno cuesta créditos por corrida; se desactiva si el dueño lo pide.
