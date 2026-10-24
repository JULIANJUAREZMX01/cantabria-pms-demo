# ADR-003 — Una sola landing con i18n; español por defecto

**Estado:** Aceptada · **Fecha:** 2026-10-24

## Contexto
Tulancingo recibe ~610k visitantes/año, abrumadoramente nacionales (≈1 internacional por cada 40 nacionales). El hotel atiende todos los niveles socioeconómicos: trabajadores de jornada larga, visitantes y jóvenes que buscan un cuarto para platicar, vapear o crear música. El copy debe tener orgullo mexicano y la referencia europea del nombre Cantabria.

## Decisión
- **Una sola página** (`index.html`) con diccionario i18n de 5 idiomas: 🇲🇽 ES (default), 🇬🇧 EN, 🇨🇳 ZH, 🇩🇪 DE, 🇫🇷 FR. Botones grandes con banderas; preferencia en `localStorage('cantabria_lang')`.
- El español es la lengua ancla por identidad y demografía; los demás son puente de cortesía (el turista igual traduce con su teléfono).
- Copy segmentado en 3 tarjetas (trabajo / visita / rol creativo), tono cálido, sin juzgar al huésped.

## Consecuencias
✅ Mantenimiento único (un HTML), SEO simple, cero duplicación.
✅ Los demás idiomas no duplican páginas: solo claves de traducción.
⚠️ Cada texto nuevo debe traducirse en los 5 idiomas (clave `errors` del diccionario).
