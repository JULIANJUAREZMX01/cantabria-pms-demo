# Cantabria PMS — Hotel Cantabria Tulancingo (Piloto)

PMS multihotel con datos **en vivo** sincronizados por **KynicOS** (Base44).

🔗 **Demo:** https://julianjuarezmx01.github.io/cantabria-pms-demo/

## Cómo funciona
- La base de datos real vive en Base44 (KynicOS): estancias, habitaciones, extras, solicitudes y reseñas.
- Cada cambio en la base dispara un workflow que republica `data.js` aquí automáticamente (~1 min).
- La página lee `data.js` y se refresca cada 30 segundos. Sin llaves privadas en el cliente.

## Módulos
- **Inicio:** KPIs de ocupación, ingresos, extras y solicitudes + actividad reciente.
- **Limpieza:** tablero táctil (sucia / en limpieza / lista) para el personal.
- **Recepción:** estancias, check-in, check-out, solicitudes de huéspedes.
- **Concierge:** catálogo eco (agua alcalina, kits de bambú, café orgánico) y pedidos.
- **Reservar:** vista pública de reserva directa.

## Registro real de operaciones
Los toques en la página operan en modo demo local. Para registrar operaciones reales, mándale un mensaje o audio a KynicOS por Telegram: él escribe en la base de datos y esta página se actualiza sola.
