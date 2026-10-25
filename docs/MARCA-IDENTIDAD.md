# MARCA — Identidad visual y de voz · Hotel Cantabria

**Fuente de verdad:** cartel oficial del hotel (docs/assets/marca-cartel-original.jpg), entregado por Julián el 2026-10-25.

## Elementos oficiales
- **Nombre:** HOTEL CANTABRIA (serif azul con profundidad, corona central, motivos florales)
- **Eslogan oficial:** "ES MI CASA, ES TU CASA" (cinta ocre #C7986B, caligrafía manuscrita)
- **Descripción oficial:** "Un refugio agradable, limpio y sencillo con la mejor relación costo-beneficio, en el lugar más hispano y mexicano de Tulancingo."
- **Ubicación:** TULANCINGO, HIDALGO · Zaragoza Ote. No. 104, Col. Centro, C.P. 43600
- **CTA oficial:** "¡VEN A CONOCERNOS!"
- **Estética:** Colonial mexicano tradicional; papel crema texturizado; line-art tenue de la catedral de Tulancingo, la torre del reloj, y fauna local (venado, llaves, conejo)
- **Fundación:** 1928 (confirmada por el dueño; visible en el header del sitio, no en el cartel)

## Paleta oficial
| Rol | Hex |
|---|---|
| Fondo (papel crema) | #F2E8D5 |
| Texto/azul profundo | #1A3E6D |
| Cinta/eslogan (ocre) | #C7986B |
| Acento rojo terracota | #D15A42 |
| Acento verde salvia | #5A8F7D |

## Tipografía
- Título: serif decorativa con sombra.
- Eslogan: script manuscrita fluida.
- Cuerpo y datos: sans-serif geométrica de alta legibilidad.

## Reglas para agentes y diseñadores
1. El eslogan oficial se mantiene en español en TODOS los idiomas del sitio (voz de marca).
2. La dirección oficial de marca es la del cartel; la BD puede traer otra (ver auditoría data/address-mismatch).
3. Cualquier rediseño visual del landing (paleta colonial) es un cambio GRANDE: requiere propuesta aprobada por Julián antes de ejecutarse (mandato de optimización autónoma).

## Piezas oficiales entregadas (docs/assets/)
| Archivo | Uso | Contenido clave |
|---|---|---|
| marca-cartel-original.jpg | Identidad institucional (versión colonial completa) | Título decorado, eslogan "ES MI CASA, ES TU CASA", descripción oficial, "¡VEN A CONOCERNOS!" |
| marca-cartel-promo-netflix.jpg | Campaña comercial 2026 (tono pícaro, horizontal) | Gancho "¿Un lugar donde ver Netflix…?", $300 MXN por habitación por toda la noche hasta inicio de 2027, pilares SEGURIDAD · PRIVACIDAD · CONFIANZA |
| marca-cartel-monograma-promo.jpg | Versión sobria / monograma | Monograma "C" azul y oro con la torre del reloj de Tulancingo, $300 MXN, dirección oficial |

## Monograma oficial
Letra "C" en doble trazo (azul profundo + oro) que enmarca la **torre del reloj de Tulancingo**. Es el logotipo reducible: favicon, avatar de WhatsApp, sellos y escudos del landing Astro.

## Pilares de marca (voz)
**SEGURIDAD · PRIVACIDAD · CONFIANZA.** Todo texto del sitio debe poder rastrearse a uno de los tres. Tono: cálido, cercano, con picardía sutil en campañas ("sutil guiño"), sobrio en lo operativo.

## Precio: regla de negocio ligada a la marca
La promo **$300 MXN por habitación, por toda la noche, hasta el inicio de 2027** está impresa en dos carteles. Es compromiso público: el sistema (pricing.ts) la respeta y vuelve a $650 desde 2027-01-01. Texto público oficial: "por habitación, por toda la noche". Evitar "por persona".

## Pendientes de diseño (cambios grandes: requieren aprobación de Julián)
1. Rediseñar el landing con la paleta colonial y el monograma como logo.
2. Vectorizar el monograma a SVG limpio (los JPG son de generación IA, baja resolución para impresión).
3. Usar el monograma como favicon y en el header en lugar del texto plano.

## Piezas integradas en la landing v7 (public/brand/*.webp)
| WebP | Origen | Dónde se usa |
|---|---|---|
| rotulo-hero | Rótulo horizontal con nombre y dirección | Hero |
| sello-talavera | Sello circular con "C", torre, venado y conejo | Historia, imagen Open Graph y JSON-LD |
| monograma-promo | Monograma "C" azul y oro con la torre | Banda de promo |
| cartel-institucional, medallon-talavera, cartel-dato-curioso, cartel-silencio, cartel-promo-netflix | Carteles de campaña | Galería |
| rotulo-sobrio | Rótulo tipográfico sobrio | Pie de página |
