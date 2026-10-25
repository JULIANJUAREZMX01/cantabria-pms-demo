/**
 * Sistema de movimiento — GSAP + ScrollTrigger + Lenis.
 * Solo actúa cuando el usuario NO prefiere movimiento reducido;
 * sin JS (o con reduce) la página queda 100% visible y usable.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduced) {
  gsap.registerPlugin(ScrollTrigger);

  // ---- Scroll suave ----
  const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anclas internas por Lenis (Reservar / Ubicación)
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.hash);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: -16 });
      }
    });
  });

  // ---- Entrada del hero ----
  gsap
    .timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero-sign', { y: 44, scale: 0.94, opacity: 0, duration: 1 }, 0.1)
    .from('.tagline', { y: 22, opacity: 0, duration: 0.8 }, '-=0.55')
    .from('.hero h1', { y: 28, opacity: 0, duration: 0.8 }, '-=0.55')
    .from('.hero .lead, .hero .muted', { y: 16, opacity: 0, stagger: 0.12, duration: 0.7 }, '-=0.5')
    .from('.promo-pill', { scale: 0.75, opacity: 0, duration: 0.6, ease: 'back.out(1.9)' }, '-=0.3')
    .from('.cta-row > *', { y: 14, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.3')
    .from('.langs a', { y: 10, opacity: 0, stagger: 0.06, duration: 0.4 }, '-=0.25');

  // ---- Parallax del rotulo mientras el hero sale ----
  gsap.to('.hero-sign', {
    yPercent: 14,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // ---- El sello gira despacio al bajar ----
  gsap.to('.story .seal', {
    rotate: 300,
    ease: 'none',
    scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: 1.4 },
  });

  // ---- La cinta entra como cinta ----
  gsap.utils.toArray<HTMLElement>('.ribbon').forEach((ribbon, i) => {
    gsap.from(ribbon, {
      xPercent: i % 2 === 0 ? -14 : 14,
      opacity: 0,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: { trigger: ribbon, start: 'top 95%' },
    });
  });

  // ---- Secciones: aparecen al entrar en pantalla ----
  gsap.utils.toArray<HTMLElement>('main section.block').forEach((sec) => {
    gsap.from(sec, {
      y: 46,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: sec, start: 'top 82%' },
    });
  });

  // ---- Tarjetas y figuras: cascada ----
  gsap.utils.toArray<HTMLElement>('.grid .card, .gallery figure, .promo-band').forEach((el, i) => {
    gsap.from(el, {
      y: 32,
      opacity: 0,
      duration: 0.7,
      delay: (i % 3) * 0.08,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // ---- Ornamentos: se dibujan desde el centro ----
  gsap.utils.toArray<HTMLElement>('.orn').forEach((orn) => {
    gsap.from(orn, {
      scaleX: 0.25,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: orn, start: 'top 92%' },
    });
  });

  // ---- Resenas: entran deslizandose ----
  gsap.utils.toArray<HTMLElement>('.review').forEach((rev) => {
    gsap.from(rev, {
      x: -26,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: rev, start: 'top 88%' },
    });
  });

  // ---- Mapa y pie: cierre suave ----
  gsap.from('.map-wrap', {
    scale: 0.95,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.map-wrap', start: 'top 85%' },
  });
  gsap.from('.site-footer', {
    opacity: 0,
    y: 24,
    duration: 0.8,
    scrollTrigger: { trigger: '.site-footer', start: 'top 96%' },
  });

  // Recalcular cuando fuentes e imagenes terminan de cargar
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
