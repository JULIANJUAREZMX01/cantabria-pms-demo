# Cantabria PMS Sync — Excel/CSV ↔ Base de datos (Beta)

Puente entre tu Excel y la base de datos del PMS. KynicOS hace la escritura autenticada.

## Instalación
pip install requests openpyxl

## Uso diario
1. `python cantabria_sync.py pull` → crea `cantabria_live.xlsx` con los datos vivos (hojas: rooms, stays, extras, requests, properties).
2. Edítalo en Excel/LibreOffice: cambia celdas, agrega filas nuevas (sin id = se crean).
3. `python cantabria_sync.py push cantabria_live.xlsx --dry-run` → muestra qué cambiaría.
4. `python cantabria_sync.py push cantabria_live.xlsx` → aplica.

## Envío automático (recomendado)
Exporta primero la API key del agente (Editor del agente > Developer/API):
export CANTABRIA_API_KEY="tu-api-key"
Con la variable puesta, `push` le manda los cambios a KynicOS por su API; él los escribe en la base y republica la web en ~1 min. Sin la variable, se genera `cambios_pendientes_<ts>.json`: mándaselo a KynicOS por Telegram y él lo aplica.

## Reglas
- Filas con `id` → se actualizan solo si cambiaron. Sin `id` → se crean.
- Habitaciones se identifican por (property_name, room_id).
- El script nunca borra registros; pídeselo a KynicOS.
- CSVs vivos siempre en: https://julianjuarezmx01.github.io/cantabria-pms-demo/csv/
- En Excel también puedes leerlos en vivo: Datos > Obtener datos > Desde Web > pega la URL del CSV.
