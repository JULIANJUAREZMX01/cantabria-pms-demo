import React, { useState, useEffect } from 'react';
import {
  Building2, MapPin, BedDouble, Sparkles, Wifi, Droplets, Leaf,
  Globe, Send, Moon, Briefcase, Music, MessageCircle, Phone, Heart
} from 'lucide-react';

/* ============================================================
   HOTEL CANTABRIA — LANDING DEL HUÉSPED (una sola página, 5 idiomas)
   Español por orgullo; EN/ZH/DE/FR como puente para el visitante.
   ============================================================ */

const FALLBACK = { properties: [], stays: [] };

const LANGS = [
  { id: 'es', flag: '🇲🇽', name: 'Español' },
  { id: 'en', flag: '🇬🇧', name: 'English' },
  { id: 'zh', flag: '🇨🇳', name: '中文' },
  { id: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { id: 'fr', flag: '🇫🇷', name: 'Français' },
];

const T = {
  es: {
    heroTitle: 'Bienvenido a tu rincón en Tulancingo',
    heroSub: 'Hotel económico, muy limpio y al pendiente de cada detalle, por mínimo que sea.',
    heroNote: 'Aunque no lo notes, estamos aquí: para que tengas un lugar donde llegar a descansar… o a divertirte.',
    langTitle: 'Te atendemos en tu idioma',
    forYou: 'Este lugar es para ti',
    seg1T: '¿Vienes a trabajar?', seg1D: 'Duerme tranquilo después de una larga jornada en una ciudad nueva. Un cuarto limpio y silencioso te espera.',
    seg2T: '¿De visita?', seg2D: 'Ubicación práctica para conocer Tulancingo, sus magias y sus alrededores. Llega, deja tus cosas y sal a explorar.',
    seg3T: '¿Rol con los cuates?', seg3D: 'Un cuarto para platicar, vapear, rapear y crear tus rolas. Aquí fluye la creatividad.',
    roomsTitle: 'Habitaciones',
    roomsSub: 'Sencillas, dobles y suites. Precios de amigo, calidad de hotel.',
    r1: 'Sencilla', r1d: 'Ideal para descansar solo después del jalón.',
    r2: 'Doble Queen', r2d: 'Para compartir viaje o rol con tu persona favorita.',
    r3: 'Suite Cantabria', r3d: 'Espacio amplio para quedarse a crear.',
    amenTitle: 'Lo que incluye tu estancia',
    a1: 'WiFi sin límites', a2: 'Limpieza al pendiente', a3: 'Agua alcalina', a4: 'Kit eco de bambú', a5: 'Baño privado', a6: 'Atención 24/7',
    bookTitle: 'Reserva directa', bookSub: 'Sin comisiones ni vueltas. Te confirmamos enseguida.',
    fName: 'Tu nombre', fIn: 'Entrada', fOut: 'Salida', fPhone: 'WhatsApp / Telegram (opcional)',
    bookBtn: 'Solicitar reserva', bookDone: '¡Recibido! Te confirmamos enseguida.',
    concierge: 'KynicOS, nuestro concierge con IA, te atiende a cualquier hora por WhatsApp o Telegram.',
    staffBtn: 'Personal',
    madeIn: 'Hecho con orgullo en Tulancingo, Hidalgo',
    b1: 'Económico', b2: 'Muy limpio', b3: 'Al pendiente de ti',
    waPrefill: 'Hola, vengo de la página del Hotel Cantabria y quiero reservar.', ticketT: '¡Reserva recibida!', ticketRef: 'Referencia', ticketTxt: 'Guarda tu referencia. Te contactaremos para confirmar tu estancia.', waConfirmT: 'Confirmar por WhatsApp',
    errors: 'Completa tu nombre y las fechas, por favor.',
    liveNote: 'Habitaciones limpias y listas hoy',
  },
  en: {
    heroTitle: 'Welcome to your corner in Tulancingo',
    heroSub: 'A budget-friendly hotel, spotlessly clean and attentive to every detail, no matter how small.',
    heroNote: "Even if you don't notice us, we are here: so you have a place to rest… or to have fun.",
    langTitle: 'We serve you in your language',
    forYou: 'This place is for you',
    seg1T: 'Working in town?', seg1D: 'Sleep well after a long shift in a new city. A clean, quiet room is waiting for you.',
    seg2T: 'Just visiting?', seg2D: 'A practical base to explore Tulancingo and its surroundings. Drop your bags and go explore.',
    seg3T: 'Hanging with friends?', seg3D: 'A room to talk, vape, rap and create your tracks. Creativity flows here.',
    roomsTitle: 'Rooms',
    roomsSub: 'Single, double and suites. Friendly prices, hotel quality.',
    r1: 'Single', r1d: 'Perfect to rest on your own after a long day.',
    r2: 'Double Queen', r2d: 'To share your trip or your plans with your favorite person.',
    r3: 'Cantabria Suite', r3d: 'Wide space to stay and create.',
    amenTitle: 'Included in your stay',
    a1: 'Unlimited WiFi', a2: 'Attentive housekeeping', a3: 'Alkaline water', a4: 'Bamboo eco kit', a5: 'Private bathroom', a6: '24/7 attention',
    bookTitle: 'Direct booking', bookSub: 'No commissions, no detours. We confirm right away.',
    fName: 'Your name', fIn: 'Check-in', fOut: 'Check-out', fPhone: 'WhatsApp / Telegram (optional)',
    bookBtn: 'Request booking', bookDone: 'Got it! We confirm right away.',
    concierge: 'KynicOS, our AI concierge, answers any time via WhatsApp or Telegram.',
    staffBtn: 'Staff',
    madeIn: 'Proudly made in Tulancingo, Hidalgo, Mexico',
    b1: 'Budget-friendly', b2: 'Spotless', b3: 'Attentive to you',
    waPrefill: 'Hi, I come from the Hotel Cantabria website and I want to book.', ticketT: 'Booking received!', ticketRef: 'Reference', ticketTxt: 'Keep your reference. We will contact you to confirm your stay.', waConfirmT: 'Confirm via WhatsApp',
    errors: 'Please add your name and dates.',
    liveNote: 'Clean rooms ready today',
  },
  zh: {
    heroTitle: '欢迎来到图兰辛戈的小角落',
    heroSub: '经济实惠的酒店，一尘不染，注重每一个细节。',
    heroNote: '即使您没有注意到，我们一直在这里：为您提供一个休息……或尽情欢乐的地方。',
    langTitle: '我们用您的语言为您服务',
    forYou: '这里为您而备',
    seg1T: '来工作？', seg1D: '在新城市忙碌一天后，安心入睡。干净安静的房间等着您。',
    seg2T: '来旅游？', seg2D: '探索图兰辛戈及周边的便利据点。放下行李，出发吧。',
    seg3T: '和朋友聚会？', seg3D: '一个可以聊天、创作说唱、写歌的房间。创意在这里流淌。',
    roomsTitle: '客房',
    roomsSub: '单人间、双人间和套房。亲民的价格，酒店的品质。',
    r1: '单人间', r1d: '忙碌一天后独自休息的最佳选择。',
    r2: '双人大床房', r2d: '与您最喜欢的人分享旅程。',
    r3: '坎塔布里亚套房', r3d: '宽敞的空间，可以安心创作。',
    amenTitle: '入住包含',
    a1: '无限WiFi', a2: '贴心清洁服务', a3: '碱性水', a4: '竹制环保套装', a5: '独立卫浴', a6: '24小时服务',
    bookTitle: '直接预订', bookSub: '无佣金，不绕弯。我们会立即确认。',
    fName: '您的姓名', fIn: '入住日期', fOut: '退房日期', fPhone: 'WhatsApp / Telegram（选填）',
    bookBtn: '申请预订', bookDone: '收到了！我们会立即确认。',
    concierge: 'KynicOS 是我们的AI管家，随时通过 WhatsApp 或 Telegram 为您服务。',
    staffBtn: '员工',
    madeIn: '自豪地来自墨西哥伊达尔戈州图兰辛戈',
    b1: '经济实惠', b2: '一尘不染', b3: '贴心周到',
    waPrefill: '您好，我来自坎塔布里亚酒店官网，想预订。', ticketT: '预订已收到！', ticketRef: '参考编号', ticketTxt: '请保存您的参考编号，我们会与您确认入住。', waConfirmT: '通过WhatsApp确认',
    errors: '请填写姓名和日期。',
    liveNote: '今日有干净空房',
  },
  de: {
    heroTitle: 'Willkommen in deiner Ecke von Tulancingo',
    heroSub: 'Ein günstiges Hotel, blitzsauber und auf jedes Detail bedacht, egal wie klein.',
    heroNote: 'Auch wenn du es nicht merkst, sind wir da: damit du einen Ort zum Ausruhen… oder zum Feiern hast.',
    langTitle: 'Wir bedienen dich in deiner Sprache',
    forYou: 'Dieser Ort ist für dich',
    seg1T: 'Zum Arbeiten hier?', seg1D: 'Schlafe gut nach einem langen Tag in einer neuen Stadt. Ein sauberes, ruhiges Zimmer wartet auf dich.',
    seg2T: 'Auf Besuch?', seg2D: 'Praktische Basis, um Tulancingo und die Umgebung zu entdecken. Taschen abstellen und losziehen.',
    seg3T: 'Mit Freunden abhängen?', seg3D: 'Ein Zimmer zum Quatschen, Dampfen, Rappen und Tracks schaffen. Hier fließt die Kreativität.',
    roomsTitle: 'Zimmer',
    roomsSub: 'Einzel-, Doppelzimmer und Suiten. Freundliche Preise, Hotelqualität.',
    r1: 'Einzelzimmer', r1d: 'Ideal zum Allein-Erholen nach einem langen Tag.',
    r2: 'Doppelzimmer Queen', r2d: 'Um die Reise mit deiner Lieblingsperson zu teilen.',
    r3: 'Cantabria Suite', r3d: 'Viel Platz zum Bleiben und Schaffen.',
    amenTitle: 'In deinem Aufenthalt enthalten',
    a1: 'Unbegrenztes WLAN', a2: 'Aufmerksame Reinigung', a3: 'Alkalisches Wasser', a4: 'Bambus-Öko-Set', a5: 'Privates Bad', a6: '24/7 Betreuung',
    bookTitle: 'Direkt buchen', bookSub: 'Keine Provisionen, kein Umweg. Wir bestätigen sofort.',
    fName: 'Dein Name', fIn: 'Anreise', fOut: 'Abreise', fPhone: 'WhatsApp / Telegram (optional)',
    bookBtn: 'Buchung anfragen', bookDone: 'Erhalten! Wir bestätigen sofort.',
    concierge: 'KynicOS, unser KI-Concierge, hilft dir rund um die Uhr per WhatsApp oder Telegram.',
    staffBtn: 'Personal',
    madeIn: 'Mit Stolz aus Tulancingo, Hidalgo, Mexiko',
    b1: 'Günstig', b2: 'Blitzsauber', b3: 'Aufmerksam',
    waPrefill: 'Hallo, ich komme von der Website des Hotel Cantabria und möchte buchen.', ticketT: 'Buchung erhalten!', ticketRef: 'Referenz', ticketTxt: 'Bewahre deine Referenz auf. Wir melden uns zur Bestätigung.', waConfirmT: 'Per WhatsApp bestätigen',
    errors: 'Bitte Name und Daten angeben.',
    liveNote: 'Heute saubere Zimmer verfügbar',
  },
  fr: {
    heroTitle: 'Bienvenue dans votre coin de Tulancingo',
    heroSub: 'Un hôtel économique, très propre et attentif à chaque détail, même le plus petit.',
    heroNote: "Même si vous ne nous remarquez pas, nous sommes là : pour vous offrir un lieu où venir vous reposer… ou vous amuser.",
    langTitle: 'Nous vous servons dans votre langue',
    forYou: 'Cet endroit est pour vous',
    seg1T: 'En déplacement pro ?', seg1D: 'Dormez tranquille après une longue journée dans une nouvelle ville. Une chambre propre et calme vous attend.',
    seg2T: 'En visite ?', seg2D: 'Une base pratique pour découvrir Tulancingo et ses environs. Déposez vos affaires et partez explorer.',
    seg3T: 'Entre amis ?', seg3D: 'Une chambre pour discuter, vapoter, rapper et créer vos titres. Ici, la créativité coule.',
    roomsTitle: 'Chambres',
    roomsSub: 'Simples, doubles et suites. Prix amicaux, qualité hôtel.',
    r1: 'Simple', r1d: 'Idéale pour se reposer seul après une longue journée.',
    r2: 'Double Queen', r2d: 'Pour partager le voyage avec votre personne préférée.',
    r3: 'Suite Cantabria', r3d: 'Un espace généreux pour rester et créer.',
    amenTitle: 'Inclus dans votre séjour',
    a1: 'WiFi illimité', a2: 'Ménage attentionné', a3: 'Eau alcaline', a4: 'Kit éco en bambou', a5: 'Salle de bain privée', a6: 'Attention 24/7',
    bookTitle: 'Réservation directe', bookSub: 'Sans commissions, sans détour. Nous confirmons tout de suite.',
    fName: 'Votre nom', fIn: 'Arrivée', fOut: 'Départ', fPhone: 'WhatsApp / Telegram (optionnel)',
    bookBtn: 'Demander une réservation', bookDone: 'Reçu ! Nous confirmons tout de suite.',
    concierge: 'KynicOS, notre concierge IA, vous répond à toute heure par WhatsApp ou Telegram.',
    staffBtn: 'Personnel',
    madeIn: 'Fièrement réalisé à Tulancingo, Hidalgo, Mexique',
    b1: 'Économique', b2: 'Très propre', b3: 'Attentif à vous',
    waPrefill: 'Bonjour, je viens du site de l Hôtel Cantabria et je souhaite réserver.', ticketT: 'Réservation reçue !', ticketRef: 'Référence', ticketTxt: 'Conservez votre référence. Nous vous contactons pour confirmer.', waConfirmT: 'Confirmer par WhatsApp',
    errors: 'Merci d’indiquer votre nom et les dates.',
    liveNote: 'Chambres propres disponibles aujourd’hui',
  },
};

const inputCls = "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 placeholder:text-slate-600";

export default function GuestApp() {
  const [lang, setLang] = useState(() => localStorage.getItem('cantabria_lang') || 'es');
  const [data, setData] = useState(() => ({ ...FALLBACK, ...(window.CANTABRIA_DATA || {}) }));
  const [toast, setToast] = useState('');
  const [sending, setSending] = useState(false);
  const [f, setF] = useState({ guest_name: '', check_in: new Date().toISOString().slice(0, 10), check_out: '', phone: '' });
  const [ticket, setTicket] = useState(null);
  const t = T[lang] || T.es;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3200); };
  const pickLang = (id) => { setLang(id); localStorage.setItem('cantabria_lang', id); };

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('./data.js?ts=' + Date.now(), { cache: 'no-store' });
        const txt = await r.text();
        const json = txt.replace(/^[\s\S]*?=\s*/, '').trim().replace(/;?\s*$/, '');
        const parsed = JSON.parse(json);
        if (parsed && parsed.properties) setData({ ...FALLBACK, ...parsed });
      } catch (e) { /* contenido estático */ }
    };
    load();
  }, []);

  const prop = (data.properties || []).find(p => (p.name || '').includes('Tulancingo')) || (data.properties || [])[0] || { name: 'Hotel Cantabria', city: 'Tulancingo de Bravo, Hidalgo', phone: '' };
  const rooms = (data.rooms || []).filter(r => r.property_name === prop.name);
  const readyCount = rooms.filter(r => r.status === 'lista').length;

  const WRITE_API = 'https://kynic-os-ee9fcf0d.base44.app/functions/cantabriaWrite';
  const APP_TOKEN = 'cantabria-beta-2026';

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!f.guest_name || !f.check_out) { showToast(t.errors); return; }
    const ref = 'CB-' + Date.now().toString(36).toUpperCase().slice(-5);
    setSending(true);
    try {
      const r = await fetch(WRITE_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: APP_TOKEN, action: 'checkIn', guest_name: f.guest_name, property_name: prop.name || 'Hotel Cantabria Tulancingo', room: 'Por asignar', check_in: f.check_in, check_out: f.check_out, rate: 650, payment_status: 'Pendiente', status: 'Reservada', notes: 'Reserva web huésped · Ref ' + ref + ' · lang: ' + lang + (f.phone ? ' · Tel: ' + f.phone : '') }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'error');
      showToast(t.bookDone);
      setTicket({ ref, name: f.guest_name, inD: f.check_in, outD: f.check_out });
      setF({ ...f, guest_name: '', phone: '' });
    } catch (err) {
      showToast('✗ ' + (err.message || 'sin conexión'));
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 shadow-xl shadow-fuchsia-900/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/25 shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-lg text-white tracking-tight leading-none">Hotel Cantabria</h1>
            <p className="text-[11px] text-white/80 mt-0.5 flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{prop.city || 'Tulancingo de Bravo, Hidalgo'}</p>
          </div>
          <a href="./admin.html" className="ml-auto text-[11px] font-bold text-white/70 hover:text-white border border-white/25 rounded-full px-3 py-1.5 shrink-0 transition">{t.staffBtn}</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-12">
        {/* HERO */}
        <section className="mt-5 rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-24 w-20 h-20 rounded-full bg-white/10" />
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest">🇲🇽 Tulancingo · Hidalgo</p>
          <h2 className="text-2xl sm:text-4xl font-black mt-2 leading-tight max-w-xl">{t.heroTitle}</h2>
          <p className="text-white/90 text-sm sm:text-base mt-3 max-w-lg">{t.heroSub}</p>
          <p className="text-white/75 text-xs sm:text-sm mt-2 max-w-lg italic">{t.heroNote}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            <span className="text-[11px] sm:text-xs font-bold bg-white/15 border border-white/25 rounded-full px-3 py-1.5">💰 {t.b1}</span>
            <span className="text-[11px] sm:text-xs font-bold bg-white/15 border border-white/25 rounded-full px-3 py-1.5">✨ {t.b2}</span>
            <span className="text-[11px] sm:text-xs font-bold bg-white/15 border border-white/25 rounded-full px-3 py-1.5">🤍 {t.b3}</span>
          </div>
        </section>

        {/* IDIOMAS — botones grandotes */}
        <section className="mt-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center"><Globe className="w-3.5 h-3.5 inline mb-0.5" /> {t.langTitle}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mt-3">
            {LANGS.map(l => (
              <button key={l.id} onClick={() => pickLang(l.id)}
                className={`rounded-2xl border-2 py-3.5 px-2 text-center transition-all active:scale-95 ${lang === l.id ? 'border-emerald-400 bg-gradient-to-b from-emerald-500/20 to-teal-400/10 text-white shadow-lg shadow-emerald-900/30' : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'}`}>
                <span className="text-2xl sm:text-3xl block leading-none">{l.flag}</span>
                <span className="block text-[11px] sm:text-xs font-black mt-1.5">{l.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* PARA QUIÉN */}
        <section className="mt-7">
          <h3 className="text-lg font-black text-white">{t.forYou}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {[
              { Icon: Briefcase, t: t.seg1T, d: t.seg1D, c: 'from-sky-500 to-cyan-400' },
              { Icon: MapPin, t: t.seg2T, d: t.seg2D, c: 'from-emerald-500 to-teal-400' },
              { Icon: Music, t: t.seg3T, d: t.seg3D, c: 'from-fuchsia-500 to-pink-500' },
            ].map(s => (
              <div key={s.t} className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.c} flex items-center justify-center text-slate-950`}><s.Icon className="w-5 h-5" /></div>
                <h4 className="font-black text-white text-sm mt-3">{s.t}</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HABITACIONES */}
        <section className="mt-7">
          <div className="flex items-end justify-between flex-wrap gap-1">
            <div>
              <h3 className="text-lg font-black text-white"><BedDouble className="w-5 h-5 inline text-emerald-400" /> {t.roomsTitle}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{t.roomsSub}</p>
            </div>
            {readyCount > 0 && <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 rounded-full px-3 py-1.5">🟢 {t.liveNote}: {readyCount}</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {[
              { e: '🛏️', n: t.r1, d: t.r1d, c: 'border-sky-400/30' },
              { e: '🛏️🛏️', n: t.r2, d: t.r2d, c: 'border-violet-400/30' },
              { e: '✨', n: t.r3, d: t.r3d, c: 'border-rose-400/30' },
            ].map(r => (
              <div key={r.n} className={`rounded-3xl bg-slate-900 border ${r.c} p-5`}>
                <p className="text-3xl">{r.e}</p>
                <h4 className="font-black text-white text-sm mt-2">{r.n}</h4>
                <p className="text-xs text-slate-400 mt-1">{r.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AMENIDADES */}
        <section className="mt-7 rounded-3xl bg-slate-900 border border-emerald-400/20 p-5 sm:p-6">
          <h3 className="text-lg font-black text-white"><Sparkles className="w-5 h-5 inline text-emerald-400" /> {t.amenTitle}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
            {[[Wifi, t.a1], [Sparkles, t.a2], [Droplets, t.a3], [Leaf, t.a4], [Moon, t.a5], [MessageCircle, t.a6]].map(([Icon, label], i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2.5">
                <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* RESERVA + CONCIERGE */}
        <section className="mt-7 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-slate-900 border border-rose-400/30 p-5 sm:p-6">
            <h3 className="font-black text-white text-base">📅 {t.bookTitle}</h3>
            <p className="text-xs text-slate-400 mt-1">{t.bookSub}</p>
            <form className="grid grid-cols-2 gap-3 mt-4" onSubmit={submitBooking}>
              <div className="col-span-2"><input required className={inputCls} value={f.guest_name} onChange={e => setF({ ...f, guest_name: e.target.value })} placeholder={t.fName} /></div>
              <input type="date" required className={inputCls} value={f.check_in} onChange={e => setF({ ...f, check_in: e.target.value })} aria-label={t.fIn} />
              <input type="date" required className={inputCls} value={f.check_out} onChange={e => setF({ ...f, check_out: e.target.value })} aria-label={t.fOut} />
              <div className="col-span-2"><input className={inputCls} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder={t.fPhone} /></div>
              <button type="submit" disabled={sending} className="col-span-2 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-black py-3.5 rounded-2xl text-sm active:scale-[0.98] transition shadow-lg disabled:opacity-60">
                {sending ? '…' : <span className="inline-flex items-center gap-2"><Send className="w-4 h-4" />{t.bookBtn}</span>}
              </button>
            </form>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-500 p-5 sm:p-6 text-slate-950 flex flex-col justify-between">
            <div>
              <h3 className="font-black text-lg">🤖 KynicOS</h3>
              <p className="text-sm font-semibold mt-2 leading-relaxed">{t.concierge}</p>
            </div>
            <div className="mt-4 space-y-2.5">
              <a href={'https://wa.me/527757591185?text=' + encodeURIComponent(t.waPrefill)} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 text-white font-black text-sm py-3.5 active:scale-[0.98] transition"><Phone className="w-4 h-4" /> +52 775 759 1185</a>
              <p className="text-[11px] font-bold text-center text-black/60">WhatsApp · Telegram · 24/7</p>
            </div>
          </div>
        </section>

        {ticket && (
          <section className="mt-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-400 p-5 sm:p-6 text-slate-950 shadow-xl">
            <h3 className="font-black text-lg">🎫 {t.ticketT}</h3>
            <p className="text-xs font-semibold mt-1">{t.ticketTxt}</p>
            <div className="rounded-2xl bg-slate-950/90 text-white p-4 mt-3 space-y-1">
              <p className="text-sm font-bold">{ticket.name}</p>
              <p className="text-xs text-slate-300">📅 {ticket.inD} → {ticket.outD}</p>
              <p className="text-xs text-slate-300">🏨 {prop.name || 'Hotel Cantabria Tulancingo'}</p>
              <p className="text-sm font-black text-emerald-300 mt-1">{t.ticketRef}: {ticket.ref}</p>
            </div>
            <a href={'https://wa.me/527757591185?text=' + encodeURIComponent(t.waPrefill + ' · ' + t.ticketRef + ': ' + ticket.ref)} target="_blank" rel="noopener" className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-slate-950 text-white font-black text-sm py-3.5 active:scale-[0.98] transition"><Phone className="w-4 h-4" /> {t.waConfirmT}</a>
          </section>
        )}

        <footer className="mt-10 text-center pb-4">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5"><Heart className="w-3 h-3 text-rose-500" /> {t.madeIn}</p>
          <a href="./admin.html" className="inline-block mt-3 text-[10px] font-bold text-slate-700 hover:text-slate-400 tracking-widest uppercase border border-slate-800 rounded-full px-4 py-1.5">{t.staffBtn} →</a>
        </footer>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl max-w-[90%] text-center">
          {toast}
        </div>
      )}
    </div>
  );
}
