# ADR-013 — Landing formal v7: identidad de marca, SEO, mapa y reseñas

**Estado:** Aceptada · **Fecha:** 2026-10-25 · **Rama:** astro/migracion

## Contexto
Julián entregó 9 piezas gráficas oficiales (carteles institucional, comerciales, medallón y sellos de talavera, monogramas y rótulos) y pidió formalizar la página de entrada: integrar las imágenes, más texto, SEO, ubicación y mapa claros, mejores reseñas, y dejar solo el acceso discreto del equipo al pie.

## Decisión
1. **Imágenes:** las 9 piezas se convierten a WebP (2.2 MB a 1.2 MB, ancho máx. 1200 px) en `public/brand/`. Los JPG originales quedan en `docs/assets/` como fuente de verdad.
   - Hero: rótulo horizontal (`rotulo-hero`). Historia: sello de talavera. Banda de promo: monograma. Galería: 5 carteles. Pie: rótulo sobrio.
2. **Texto:** secciones nuevas (historia, tres pilares Seguridad/Privacidad/Confianza, promo, dato curioso, "duerme en silencio", cómo llegar) en los 5 idiomas. El eslogan "Es mi casa, es tu casa" se traduce en cada idioma.
3. **SEO:** title y description propios por idioma, canonical, hreflang (es/en/zh/de/fr + x-default), Open Graph y Twitter Card, JSON-LD `Hotel` (dirección, teléfono, año de fundación, idiomas, rango de precio) y un único `h1`. La página `/equipo/` lleva `noindex`.
4. **Mapa:** iframe de Google Maps por **consulta de dirección oficial** (Zaragoza Ote. 104, Col. Centro, 43600), con botón "Abrir en Google Maps" y WhatsApp, más una nota para quien su GPS marque otra calle.
5. **Reseñas:** solo 2 reseñas reales de 5 estrellas, atribuidas y con enlace a Google (`REVIEWS` en `config.ts`).
6. **Acceso del equipo:** se elimina el botón de la esquina superior; queda solo el enlace discreto al pie ("Acceso del equipo", con `rel="nofollow"`).

## Consecuencias
- Positivas: página formal, rápida, indexable en 5 idiomas, con confianza visible (mapa + reseñas reales).
- **Riesgo conocido, mapa:** en Google Maps el hotel NO aparece en Zaragoza Ote. 104. Existe una ficha "Cantabria" (Cda. de Echavarri 214, tipo *Love hotel*) y otra "Hostales Cantabria" (C. Rodríguez y Coss 301C, 3.4★, 97 reseñas), ambas con el teléfono del hotel. Mientras no se reclame y corrija la ficha, la consulta por dirección es la opción más honesta. **Acción del dueño:** reclamar y unificar la ficha de Google Business.
- **Riesgo conocido, reseñas:** las reseñas de Google pertenecen a "Hostales Cantabria" (mismo teléfono), no a una ficha verificada de esta sede, y la calificación global es mixta (3.4★). Se muestran solo 2 citas positivas reales y enlazadas; no se inventó ninguna. Conviene que el dueño confirme que esa ficha es suya antes de publicar.
- **Riesgo de caducidad:** el `<title>` y la meta description mencionan "$300 MXN" y la promo vence al inicio de 2027. Pendiente: derivar ese texto de `HOTEL.promo` para que caduque solo.
- Las imágenes IA tienen resolución limitada: para impresión se recomienda vectorizar el monograma (ver MARCA-IDENTIDAD.md).
