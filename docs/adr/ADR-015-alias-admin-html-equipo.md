# ADR-015: Alias heredado de acceso de personal

## Contexto
La ruta histórica `/admin.html` responde 404 desde el sitio estático, mientras que el acceso actual de personal está en `/equipo/`. Los enlaces o marcadores antiguos no llegan al punto de acceso vigente.

## Decisión
Generar una página estática `/admin.html` que redirige inmediatamente a `/equipo/` usando `BASE_URL` de Astro. Mantener el destino de personal como la única interfaz de acceso y excluir el alias de indexación.

## Consecuencias
Los marcadores antiguos vuelven a funcionar sin duplicar la interfaz ni cambiar autenticación. El cambio es pequeño y reversible; se valida en build y producción. La página actual `/equipo/` conserva su política de acceso.
