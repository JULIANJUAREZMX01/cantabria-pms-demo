import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2, Sparkles, Users, BedDouble, ShoppingBag, Globe,
  CheckCircle2, Clock, AlertCircle, RefreshCw, TrendingUp, Star,
  MapPin, Plus, ArrowRight, Menu, X, Home, Bot, Send, Coffee, Crown,
  Leaf, MessageCircle, Check, PhoneCall, Activity, BadgeCheck, Trash2, Edit3
} from 'lucide-react';

/* ============================================================
   CANTABRIA PMS v5 — Datos en vivo desde KynicOS (Base44)
   data.js escribe window.CANTABRIA_DATA (actualizado automáticamente)
   Modo Demo: acciones se guardan localmente; registro real vía KynicOS/Telegram
   ============================================================ */

const FALLBACK = {
  synced_at: null,
  stays: [], extras: [], rooms: [], serviceRequests: [], properties: [], guests: [], reviews: []
};

const PRICE_FMT = (n) => '$' + (Number(n) || 0).toLocaleString('es-MX') + ' MXN';
const esc = (s) => String(s ?? '');

const CATALOG = [
  { id: 'agua', emoji: '💧', name: 'Agua Alcalina Cantabria 600ml', price: 25, desc: 'Hidratación premium, pH alcalino' },
  { id: 'kit', emoji: '🌿', name: 'Kit Ecológico de Aseo (Bambú)', price: 70, desc: 'Cepillo y amenidades 100% biodegradables' },
  { id: 'cafe', emoji: '☕', name: 'Café Orgánico de la Región', price: 45, desc: 'Tueste artesanal, apoyo a productores locales' },
  { id: 'snack', emoji: '🍪', name: 'Botana Artesanal Hidalguense', price: 55, desc: 'Dulces típicos de la región' },
];

const STATUS_META = {
  sucia: { label: 'Sucia · Por limpiar', chip: 'bg-rose-500', soft: 'bg-rose-500/15 text-rose-300 border-rose-400/30', emoji: '🔴', Icon: AlertCircle },
  proceso: { label: 'En limpieza', chip: 'bg-amber-400', soft: 'bg-amber-400/15 text-amber-300 border-amber-400/30', emoji: '🟡', Icon: Clock },
  lista: { label: 'Limpia · Lista', chip: 'bg-emerald-400', soft: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30', emoji: '🟢', Icon: CheckCircle2 },
};

const TABS = [
  { id: 'inicio', label: 'Inicio', Icon: Home, color: 'from-violet-500 to-fuchsia-500' },
  { id: 'limpieza', label: 'Limpieza', Icon: Sparkles, color: 'from-emerald-500 to-teal-400' },
  { id: 'recepcion', label: 'Recepción', Icon: BedDouble, color: 'from-sky-500 to-cyan-400' },
  { id: 'concierge', label: 'Concierge', Icon: ShoppingBag, color: 'from-amber-500 to-orange-400' },
  { id: 'web', label: 'Reservar', Icon: Globe, color: 'from-rose-500 to-pink-500' },
];

function timeAgo(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') && !iso.endsWith('Z') ? iso + 'Z' : iso);
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

function M2Icon({ s }) {
  const I = STATUS_META[s].Icon;
  return <I className="w-4 h-4" />;
}

export default function App() {
  const [tab, setTab] = useState('inicio');
  const [prop, setProp] = useState('');
  const [data, setData] = useState(() => (window.CANTABRIA_DATA ? { ...FALLBACK, ...window.CANTABRIA_DATA } : FALLBACK));
  const [demoStays, setDemoStays] = useState(() => JSON.parse(localStorage.getItem('demo_stays') || '[]'));
  const [demoExtras, setDemoExtras] = useState(() => JSON.parse(localStorage.getItem('demo_extras') || '[]'));
  const [demoRooms, setDemoRooms] = useState(() => JSON.parse(localStorage.getItem('demo_rooms') || '[]'));
  const [demoRequests, setDemoRequests] = useState(() => JSON.parse(localStorage.getItem('demo_requests') || '[]'));
  const [toast, setToast] = useState('');
  const [staffOk, setStaffOk] = useState(() => { try { return sessionStorage.getItem('cantabria_pin') === 'ok'; } catch (e) { return false; } });
  const [pending, setPending] = useState(null); // { title, detail, onReal, onDemo }
  const [askMode, setAskMode] = useState('');   // 'pin' | 'confirm'
  const [pinInput, setPinInput] = useState('');
  const [writing, setWriting] = useState(false);
  const [ownerOk, setOwnerOk] = useState(() => { try { return sessionStorage.getItem('cantabria_owner') === 'ok'; } catch (e) { return false; } });
  const [ownerAsk, setOwnerAsk] = useState(false);
  const [ownerPinInput, setOwnerPinInput] = useState('');

  // Persist demo overlay
  useEffect(() => { localStorage.setItem('demo_stays', JSON.stringify(demoStays)); }, [demoStays]);
  useEffect(() => { localStorage.setItem('demo_extras', JSON.stringify(demoExtras)); }, [demoExtras]);
  useEffect(() => { localStorage.setItem('demo_rooms', JSON.stringify(demoRooms)); }, [demoRooms]);
  useEffect(() => { localStorage.setItem('demo_requests', JSON.stringify(demoRequests)); }, [demoRequests]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  // ===== Escritura real (base de datos KynicOS) =====
  const WRITE_API = 'https://kynic-os-ee9fcf0d.base44.app/functions/cantabriaWrite';
  const APP_TOKEN = 'cantabria-beta-2026';
  const STAFF_PIN = '2026';

  const apiWrite = async (payload, okMsg) => {
    setWriting(true);
    try {
      const r = await fetch(WRITE_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: APP_TOKEN, ...payload }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'error del servidor');
      showToast(okMsg);
      setTimeout(refreshData, 90000); // la web se republica en ~1 min
      return true;
    } catch (e) {
      showToast('✗ No se registró: ' + (e.message || 'sin conexión'));
      return false;
    } finally { setWriting(false); }
  };

  const askAction = (title, detail, onReal, onDemo) => {
    setPending({ title, detail, onReal, onDemo });
    setAskMode(staffOk ? 'confirm' : 'pin');
  };
  const closeAsk = () => { setAskMode(''); setPending(null); setPinInput(''); };
  const submitPin = () => {
    if (pinInput === STAFF_PIN) { sessionStorage.setItem('cantabria_pin', 'ok'); setStaffOk(true); setPinInput(''); setAskMode('confirm'); }
    else { setPinInput(''); showToast('PIN incorrecto'); }
  };
  const doDemo = () => { const p = pending; closeAsk(); if (p && p.onDemo) p.onDemo(); };
  const doReal = async () => { const p = pending; closeAsk(); if (p) await p.onReal(); };

  // ===== Modo Dueño =====
  const OWNER_PIN = '1717';
  const tabs = ownerOk ? [...TABS, { id: 'dueno', label: 'Dueño', Icon: Crown, color: 'from-amber-400 to-yellow-500' }] : TABS;
  const submitOwnerPin = () => {
    if (ownerPinInput === OWNER_PIN) { sessionStorage.setItem('cantabria_owner', 'ok'); setOwnerOk(true); setOwnerAsk(false); setOwnerPinInput(''); setTab('dueno'); }
    else { setOwnerPinInput(''); showToast('PIN incorrecto'); }
  };

  const loadRef = useRef(null);
  const refreshData = () => { if (loadRef.current) loadRef.current(); };

  // Live polling: refetch data.js (auto-republished by KynicOS on every DB change)
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('./data.js?ts=' + Date.now(), { cache: 'no-store' });
        const txt = await r.text();
        const json = txt.replace(/^[\s\S]*?=\s*/, '').trim().replace(/;?\s*$/, '');
        const parsed = JSON.parse(json);
        if (parsed && parsed.synced_at) setData({ ...FALLBACK, ...parsed });
      } catch (e) { /* offline demo mode */ }
    };
    loadRef.current = load;
    const t = setInterval(load, 30000);
    load();
    return () => clearInterval(t);
  }, []);

  // Choose default property once data arrives
  useEffect(() => {
    if (!prop && data.properties.length) {
      const pilot = data.properties.find(p => (p.name || '').includes('Tulancingo'));
      setProp((pilot || data.properties[0]).name);
    }
  }, [data.properties, prop]);

  const rooms = useMemo(() => {
    const dbRooms = data.rooms.filter(r => r.property_name === prop).map(r => ({ ...r, demo: false }));
    const local = demoRooms.filter(r => r.property_name === prop);
    for (const l of local) {
      const i = dbRooms.findIndex(r => r.room_id === l.room_id);
      if (i >= 0) dbRooms[i] = { ...dbRooms[i], ...l, demo: true }; else dbRooms.push({ ...l, demo: true });
    }
    return dbRooms.sort((a, b) => a.room_id.localeCompare(b.room_id, 'es', { numeric: true }));
  }, [data.rooms, demoRooms, prop]);

  const stays = useMemo(() => {
    const db = data.stays.filter(s => s.property_name === prop);
    // Ocultar reservas demo que ya existen en la base (se registraron de verdad)
    const dbKeys = new Set(db.map(s => `${s.guest_name}|${s.check_in}|${s.check_out}`));
    return [...demoStays.filter(s => s.property_name === prop && !dbKeys.has(`${s.guest_name}|${s.check_in}|${s.check_out}`)).map(s => ({ ...s, demo: true })), ...db]
      .sort((a, b) => (b.updated_date || b.created_date || '').localeCompare(a.updated_date || a.created_date || ''));
  }, [data.stays, demoStays, prop]);

  const extras = useMemo(() => {
    const db = data.extras.filter(e => e.property_name === prop);
    return [...demoExtras.filter(e => e.property_name === prop).map(e => ({ ...e, demo: true })), ...db]
      .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
  }, [data.extras, demoExtras, prop]);

  const requests = useMemo(() => {
    const db = data.serviceRequests.filter(r => r.property_name === prop);
    return [...demoRequests.filter(r => r.property_name === prop).map(r => ({ ...r, demo: true })), ...db]
      .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
  }, [data.serviceRequests, demoRequests, prop]);

  const property = data.properties.find(p => p.name === prop) || { name: prop, room_count: 18, city: '', phone: '' };
  const totalRooms = property.room_count || 18;
  const activeStays = stays.filter(s => (s.status || '').toLowerCase().replace(/_/g, '') !== 'cerrada' && (s.status || '') !== 'checked_out');
  const occupied = activeStays.length;
  const occPct = Math.min(100, Math.round((occupied / Math.max(1, totalRooms)) * 100));
  const revRooms = activeStays.reduce((a, s) => a + (Number(s.rate) || 0), 0);
  const revExtras = [...extras].reduce((a, e) => a + (Number(e.total) || 0), 0);
  const revExtrasActive = extras.filter(e => { const st = stays.find(s => s.room === e.room); return !st || (st.status || '') !== 'Cerrada'; }).reduce((a, e) => a + (Number(e.total) || 0), 0);
  const openReq = requests.filter(r => r.status !== 'Cerrado' && r.status !== 'Resuelto').length;
  const cnt = (s) => rooms.filter(r => r.status === s).length;

  const chainStats = useMemo(() => {
    const props = data.properties.length ? data.properties : [{ name: prop, room_count: 18, city: '' }];
    const rows = props.map(p => {
      const staysP = data.stays.filter(s => s.property_name === p.name);
      const active = staysP.filter(s => (s.status || '').toLowerCase().replace(/_/g, '') !== 'cerrada' && (s.status || '') !== 'checked_out');
      const extrasP = data.extras.filter(e => e.property_name === p.name);
      const roomsP = data.rooms.filter(r => r.property_name === p.name);
      const openReqP = data.serviceRequests.filter(r => r.property_name === p.name && r.status !== 'Cerrado' && r.status !== 'Resuelto').length;
      const total = p.room_count || roomsP.length || 1;
      return {
        name: p.name, city: p.city || '', total, active: active.length,
        occ: Math.min(100, Math.round((active.length / Math.max(1, total)) * 100)),
        rev: active.reduce((a, s) => a + (Number(s.rate) || 0), 0),
        extrasRev: extrasP.reduce((a, e) => a + (Number(e.total) || 0), 0),
        openReq: openReqP,
      };
    });
    const extraMap = {};
    for (const e of data.extras) extraMap[e.item] = (extraMap[e.item] || 0) + (Number(e.total) || 0);
    const topExtras = Object.entries(extraMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      rows,
      totalRev: rows.reduce((a, r) => a + r.rev + r.extrasRev, 0),
      activeTotal: rows.reduce((a, r) => a + r.active, 0),
      roomsTotal: rows.reduce((a, r) => a + r.total, 0),
      openReqTotal: rows.reduce((a, r) => a + r.openReq, 0),
      topExtras,
    };
  }, [data, prop]);

  const setRoomStatus = (roomId, status) => {
    const room = rooms.find(r => r.room_id === roomId);
    askAction(
      `Hab ${roomId} → ${STATUS_META[status].label}`,
      'El estado se registrará en la base de datos y la web se actualizará para todo el equipo.',
      () => apiWrite({ action: 'setRoomStatus', room_id: roomId, property_name: prop, status, room_type: room?.room_type || 'Habitación', guest: room?.guest || 'Disponible', notes: room?.notes || '' }, `✓ Hab ${roomId} → ${STATUS_META[status].label} (registrado)`),
      () => {
        const updated = { property_name: prop, room_id: roomId, status, room_type: room?.room_type || 'Habitación', guest: room?.guest || 'Disponible', notes: room?.notes || '' };
        setDemoRooms(prev => [...prev.filter(r => !(r.room_id === roomId && r.property_name === prop)), updated]);
        showToast(`Hab ${roomId} → ${STATUS_META[status].label} (demo local)`);
      }
    );
  };

  const addCheckIn = (f) => {
    askAction(
      `Check-in de ${f.guest_name} · Hab ${f.room}`,
      `Se registrará la estancia (${f.check_in} → ${f.check_out || '—'}) en la base de datos.`,
      () => apiWrite({ action: 'checkIn', guest_name: f.guest_name, property_name: prop, room: f.room, check_in: f.check_in, check_out: f.check_out, rate: Number(f.rate) || 0, payment_status: 'Pendiente', status: 'Activa', notes: f.notes || '' }, `✓ Check-in de ${f.guest_name} registrado`),
      () => {
        setDemoStays(prev => [{ property_name: prop, guest_name: f.guest_name, room: f.room, check_in: f.check_in, check_out: f.check_out, rate: Number(f.rate) || 0, extras_total: 0, payment_status: 'Pendiente', status: 'Activa', notes: f.notes || '', created_date: new Date().toISOString(), demo: true }, ...prev]);
        setDemoRooms(prev => {
          const exists = prev.find(r => r.room_id === f.room && r.property_name === prop);
          const nw = { property_name: prop, room_id: f.room, status: 'lista', room_type: exists?.room_type || 'Habitación', guest: f.guest_name, notes: 'Check-in registrado (demo)' };
          return [...prev.filter(r => !(r.room_id === f.room && r.property_name === prop)), nw];
        });
        showToast(`Check-in de ${f.guest_name} en Hab ${f.room} registrado (demo local)`);
      }
    );
  };

  const addExtraDemo = (item, qty, room, guest) => {
    askAction(
      `${item.emoji} ${item.name} ×${qty} → Hab ${room}`,
      `Venta por $${(item.price * qty).toLocaleString('es-MX')} MXN. Se cargará al folio de la habitación.`,
      () => apiWrite({ action: 'addExtra', property_name: prop, room, guest_name: guest || '', item: item.name, qty, unit_price: item.price, eco: true }, `✓ ${item.name} ×${qty} vendido`),
      () => {
        setDemoExtras(prev => [{ property_name: prop, room, guest_name: guest || '', item: item.name, qty, unit_price: item.price, total: item.price * qty, eco: true, status: 'Entregado', created_date: new Date().toISOString(), demo: true }, ...prev]);
        showToast(`${item.emoji} ${item.name} x${qty} → Hab ${room} (demo local)`);
      }
    );
  };

  const addRequest = (f) => {
    askAction(
      `Solicitud: ${f.type}${f.room ? ' · Hab ' + f.room : ''}`,
      'Se registrará y KynicOS avisará al staff.',
      () => apiWrite({ action: 'addServiceRequest', property_name: prop, room: f.room || '', guest_name: f.guest_name || '', type: f.type, details: f.details }, '✓ Solicitud registrada'),
      () => {
        setDemoRequests(prev => [{ property_name: prop, room: f.room, guest_name: f.guest_name || '', type: f.type, details: f.details, status: 'Abierto', created_date: new Date().toISOString(), demo: true }, ...prev]);
        showToast('Solicitud registrada (demo local)');
      }
    );
  };

  const booking = (f) => {
    askAction(
      `Reserva de ${f.guest_name}`,
      `${f.check_in} → ${f.check_out} · $650 MXN/noche. Se registrará en el sistema y KynicOS la confirmará.`,
      () => apiWrite({ action: 'checkIn', guest_name: f.guest_name, property_name: prop, room: 'Por asignar', check_in: f.check_in, check_out: f.check_out, rate: 650, payment_status: 'Pendiente', status: 'Reservada', notes: 'Reserva web directa' + (f.phone ? ' · Tel: ' + f.phone : '') }, '✓ ¡Reserva registrada! KynicOS la confirmará'),
      () => {
        setDemoStays(prev => [{ property_name: prop, guest_name: f.guest_name, room: 'Por asignar', check_in: f.check_in, check_out: f.check_out, rate: 650, extras_total: 0, payment_status: 'Pendiente', status: 'Reservada', notes: 'Reserva web directa', created_date: new Date().toISOString(), demo: true }, ...prev]);
        showToast('¡Reserva enviada! KynicOS la confirmará por WhatsApp/Telegram');
      }
    );
  };

  const checkOutDemo = (room) => {
    askAction(
      `Check-out de Hab ${room}`,
      'La estancia se cerrará y la habitación pasará a limpieza.',
      () => apiWrite({ action: 'checkOut', room, property_name: prop }, `✓ Check-out de Hab ${room} registrado`),
      () => {
        setDemoStays(prev => prev.map(s => s.room === room && (s.status || '') === 'Activa' ? { ...s, status: 'Cerrada' } : s));
        showToast(`Check-out de Hab ${room} (demo local)`);
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 shadow-xl shadow-fuchsia-900/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/25 shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg sm:text-xl text-white tracking-tight leading-none">Hotel Cantabria</h1>
              <p className="text-[11px] sm:text-xs text-white/80 mt-0.5">Gestión Multihotel · Concierge IA KynicOS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={prop} onChange={(e) => setProp(e.target.value)}
              className="bg-white/15 backdrop-blur border border-white/25 rounded-xl text-white text-xs sm:text-sm font-semibold px-3 py-2 focus:outline-none max-w-[46%] sm:max-w-none cursor-pointer">
              {data.properties.map(p => <option key={p.name} value={p.name} className="bg-slate-900 text-white">{p.name}</option>)}
            </select>
            <button onClick={() => setOwnerAsk(true)} title="Modo Dueño" className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-base shrink-0 active:scale-95">👑</button>
          </div>
        </div>
      </header>

      {/* ============ DESKTOP TABS ============ */}
      <nav className="hidden md:block bg-slate-900/95 border-b border-slate-800 sticky top-[57px] z-30">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-xl transition-all border-b-[3px] ${tab === t.id ? `text-white border-transparent bg-gradient-to-b ${t.color} mt-1` : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'}`}>
              <t.Icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 pb-28 md:pb-8">
        {/* ================= INICIO ================= */}
        {tab === 'inicio' && (
          <div className="space-y-5">
            <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 p-5 sm:p-7 text-white shadow-xl">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Bienvenido, equipo Cantabria</p>
                  <h2 className="text-2xl sm:text-3xl font-black mt-1">{prop}</h2>
                  <p className="text-white/80 text-sm mt-1 flex items-center gap-1"><MapPin className="w-4 h-4" />{property.city} · {totalRooms} habitaciones</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-200 font-semibold flex items-center gap-1.5 justify-end">
                    <Bot className="w-4 h-4" />KynicOS conectado{staffOk ? ' · ⚡ modo real' : ''}
                  </p>
                  <p className="text-[11px] text-white/70 mt-1">Sincronizado {data.synced_at ? timeAgo(data.synced_at) : '—'}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">auto-cada 30s</p>
                </div>
              </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Kpi icon={<BedDouble className="w-6 h-6" />} label="Ocupación" value={`${occPct}%`} sub={`${occupied} de ${totalRooms} hab`} color="from-sky-500 to-cyan-400" />
              <Kpi icon={<TrendingUp className="w-6 h-6" />} label="Tarifas hoy" value={PRICE_FMT(revRooms)} sub="estancias activas" color="from-emerald-500 to-teal-400" />
              <Kpi icon={<ShoppingBag className="w-6 h-6" />} label="Extras vendidos" value={PRICE_FMT(revExtrasActive)} sub={`${extras.length} pedidos`} color="from-amber-500 to-orange-400" />
              <Kpi icon={<MessageCircle className="w-6 h-6" />} label="Solicitudes abiertas" value={String(openReq)} sub="requieren atención" color="from-rose-500 to-pink-500" />
            </div>

            {/* LIMPIEZA RESUMEN */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-900 border border-rose-400/30 p-4 text-center">
                <p className="text-3xl font-black text-rose-400">{cnt('sucia')}</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">🔴 Por limpiar</p>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-amber-400/30 p-4 text-center">
                <p className="text-3xl font-black text-amber-300">{cnt('proceso')}</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">🟡 En limpieza</p>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-emerald-400/30 p-4 text-center">
                <p className="text-3xl font-black text-emerald-300">{cnt('lista')}</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">🟢 Listas</p>
              </div>
            </div>

            <button onClick={() => setTab('limpieza')} className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black py-3.5 text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition">
              <Sparkles className="w-5 h-5" />Ir al tablero de limpieza <ArrowRight className="w-5 h-5" />
            </button>

            {/* ACTIVIDAD KYNICOS */}
            <Card title="Actividad reciente en el hotel" subtitle="Todo lo que pasa, KynicOS lo registra y lo sincroniza" Icon={Activity}>
              <div className="space-y-2">
                {buildFeed(stays, extras, requests).slice(0, 8).map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <span className="text-xl shrink-0">{f.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-200 truncate">{f.text}</p>
                      <p className="text-[11px] text-slate-500">{f.time} · {f.src}</p>
                    </div>
                    {f.demo ? <span className="text-[10px] bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold shrink-0">demo</span> :
                      <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                ))}
                {buildFeed(stays, extras, requests).length === 0 && <p className="text-sm text-slate-500 text-center py-4">Aún sin actividad. ¡Empieza registrando un check-in!</p>}
              </div>
            </Card>

            <div className="rounded-2xl bg-slate-900 border border-violet-400/30 p-4 flex items-start gap-3">
              <Bot className="w-6 h-6 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <b className="text-white">¿Cómo se registran operaciones reales?</b> Manda un mensaje o audio por Telegram a KynicOS:
                «Registra check-in de Laura Vega, hab 105, 2 noches, 600 la noche» o «Habitación 101 ya está lista». KynicOS lo escribe
                en la base de datos y esta página se actualiza sola en ~1 minuto. 🐕⚙️
              </p>
            </div>
          </div>
        )}

        {/* ================= LIMPIEZA ================= */}
        {tab === 'limpieza' && (
          <div className="space-y-4">
            <SectionTitle emoji="✨" title="Limpieza en tiempo real" subtitle="Toca un botón grande. Sin capacitación, sin fricción." />
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatusPill n={cnt('sucia')} label="Por limpiar" color="bg-rose-500" />
              <StatusPill n={cnt('proceso')} label="En limpieza" color="bg-amber-400" />
              <StatusPill n={cnt('lista')} label="Listas" color="bg-emerald-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {rooms.map(r => {
                const M = STATUS_META[r.status] || STATUS_META.sucia;
                return (
                  <div key={r.room_id} className={`rounded-3xl border ${r.status === 'sucia' ? 'border-rose-400/40' : r.status === 'proceso' ? 'border-amber-400/40' : 'border-emerald-400/40'} bg-slate-900 p-4 flex flex-col shadow-lg`}>
                    {r.priority === 'Alta' && r.status === 'sucia' && (
                      <span className="self-start bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2">⚡ Urgente</span>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-black text-white">Hab {r.room_id}</span>
                      {r.demo ? <span className="text-[10px] bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">demo</span> : <BadgeCheck className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border w-fit ${M.soft}`}>{M.label}</span>
                    <p className="text-xs text-slate-400 mt-2">{r.room_type}</p>
                    <p className="text-xs text-slate-300">👤 {r.guest || 'Disponible'}</p>
                    {r.notes && <p className="text-[11px] text-slate-500 bg-slate-950 rounded-xl p-2 mt-2 border border-slate-800">{r.notes}</p>}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {['sucia', 'proceso', 'lista'].map(s => (
                        <button key={s} onClick={() => setRoomStatus(r.room_id, s)}
                          className={`py-3 rounded-2xl text-[11px] font-black flex flex-col items-center gap-1 transition active:scale-95 ${r.status === s ? (s === 'sucia' ? 'bg-rose-500 text-white' : s === 'proceso' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950') + ' shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                          <M2Icon s={s} />{s === 'sucia' ? 'Sucia' : s === 'proceso' ? 'Limpieza' : 'Lista'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {rooms.length === 0 && <p className="text-sm text-slate-500 col-span-full text-center py-8">Sin habitaciones registradas para esta sede aún. KynicOS las crea con el primer check-in.</p>}
            </div>
            <p className="text-[11px] text-slate-500 text-center">Los toques se guardan en modo demo en este dispositivo. Para el registro real, indícalo a KynicOS por Telegram.</p>
          </div>
        )}

        {/* ================= RECEPCIÓN ================= */}
        {tab === 'recepcion' && (
          <div className="space-y-5">
            <SectionTitle emoji="🛎️" title="Recepción · Estancias" subtitle="Huéspedes, tarifas, extras acumulados y pagos" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MiniStat v={String(activeStays.length)} l="Estancias activas" c="text-sky-400" />
              <MiniStat v={PRICE_FMT(revRooms + revExtrasActive)} l="Ingresos del día" c="text-emerald-400" />
              <MiniStat v={String(stays.filter(s => (s.status || '') === 'Reservada').length)} l="Reservas próximas" c="text-violet-400" />
              <MiniStat v={String(openReq)} l="Solicitudes abiertas" c="text-rose-400" />
            </div>

            <Card title="Estancias y reservas" subtitle="Tabla viva de la base de datos" Icon={BedDouble}>
              <div className="space-y-2">
                {stays.map((s, i) => (
                  <div key={s.id || i} className="bg-slate-950 rounded-2xl border border-slate-800 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-sm shrink-0">{s.room || '—'}</span>
                        <div>
                          <p className="font-bold text-white text-sm">{s.guest_name} {s.demo && <span className="text-[10px] bg-amber-400/15 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded-full font-bold ml-1">demo</span>}</p>
                          <p className="text-[11px] text-slate-400">{(s.check_in || '—')} → {(s.check_out || '—')} · {PRICE_FMT(s.rate)}/noche</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${(s.status || '').toLowerCase().includes('reserv') ? 'bg-violet-500/15 text-violet-300 border-violet-400/30' : (s.status || '').toLowerCase().includes('cerrada') || (s.status || '') === 'checked_out' ? 'bg-slate-500/15 text-slate-400 border-slate-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'}`}>
                          {s.status === 'Reservada' ? 'RESERVADA' : ((s.status || '') === 'Cerrada' || (s.status || '') === 'checked_out') ? 'CERRADA' : 'ACTIVA'}
                        </span>
                        {(s.status || '') === 'Activa' && s.demo && (
                          <button onClick={() => checkOutDemo(s.room)} className="text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-400/30 px-3 py-1.5 rounded-full hover:bg-rose-500/25 active:scale-95 transition">Check-out</button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                      <span className="bg-amber-400/10 text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/20 font-semibold">🛍️ Extras: {PRICE_FMT(s.extras_total)}</span>
                      <span className={`px-2.5 py-1 rounded-full border font-semibold ${((s.payment_status || '').toLowerCase().includes('paid') || (s.payment_status || '').toLowerCase().includes('pagado')) ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20' : 'bg-amber-400/10 text-amber-300 border-amber-400/20'}`}>
                        💳 {s.payment_status === 'paid' || s.payment_status === 'Pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                      {s.notes && <span className="bg-slate-800/60 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700 truncate max-w-full">📝 {s.notes}</span>}
                    </div>
                  </div>
                ))}
                {stays.length === 0 && <p className="text-sm text-slate-500 text-center py-6">Sin estancias registradas.</p>}
              </div>
            </Card>

            <CheckInForm onAdd={addCheckIn} />

            <Card title="Solicitudes de huéspedes" subtitle="Toallas, amenidades, servicios" Icon={MessageCircle}>
              <div className="space-y-2">
                {requests.map((r, i) => (
                  <div key={r.id || i} className="flex items-start gap-3 bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <MessageCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200">{r.type} {r.room ? `· Hab ${r.room}` : ''} {r.demo && <span className="text-[10px] text-amber-300 font-bold ml-1">demo</span>}</p>
                      <p className="text-xs text-slate-400">{r.details}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{r.guest_name} · {timeAgo(r.created_date)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.status === 'Abierto' ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{r.status}</span>
                  </div>
                ))}
                {requests.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Sin solicitudes abiertas. Que descanses. 😌</p>}
              </div>
            </Card>

            <ServiceForm onAdd={addRequest} />
          </div>
        )}

        {/* ================= CONCIERGE ================= */}
        {tab === 'concierge' && (
          <div className="space-y-5">
            <SectionTitle emoji="🛍️" title="Concierge & Extras" subtitle="Convierte cada habitación en un punto de venta amigable" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {CATALOG.map(p => (
                <div key={p.id} className="rounded-3xl bg-slate-900 border border-slate-800 p-4 flex items-center gap-4">
                  <span className="text-4xl shrink-0">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                    <p className="text-emerald-400 font-black text-sm mt-1">{PRICE_FMT(p.price)}</p>
                  </div>
                  <ExtraPopover item={p} onAdd={addExtraDemo} rooms={rooms.map(r => r.room_id)} />
                </div>
              ))}
            </div>
            <Card title="Pedidos recientes" subtitle="Tabla 'ExtraOrder' en vivo" Icon={ShoppingBag}>
              <div className="space-y-2">
                {extras.map((e, i) => (
                  <div key={e.id || i} className="flex items-center justify-between gap-3 bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="flex items-center gap-3 min-w-0">
                      {e.eco && <Leaf className="w-4 h-4 text-emerald-400 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{e.item} × {e.qty} {e.demo && <span className="text-[10px] text-amber-300 font-bold">demo</span>}</p>
                        <p className="text-[11px] text-slate-500">Hab {e.room} {e.guest_name ? `· ${e.guest_name}` : ''} · {timeAgo(e.created_date)}</p>
                      </div>
                    </div>
                    <span className="text-amber-300 font-black text-sm shrink-0">{PRICE_FMT(e.total)}</span>
                  </div>
                ))}
                {extras.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Sin pedidos todavía. ¡A vender aguas alcalinas!</p>}
              </div>
            </Card>
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-400/15 border border-amber-400/30 p-4 text-xs text-amber-200/90 leading-relaxed">
              💡 <b>Idea de negocio:</b> el huésped escanea el QR de su habitación, pide su extra y KynicOS lo cobra en su cuenta. Sin recepción ocupada, sin llamadas.
            </div>
          </div>
        )}

        {/* ================= WEB PÚBLICA ================= */}
        {tab === 'web' && (
          <div className="space-y-5">
            <div className="rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-br from-rose-500 via-fuchsia-600 to-violet-600 p-6 sm:p-10 text-center text-white">
                <p className="text-4xl sm:text-6xl mb-3">🏨</p>
                <h2 className="text-2xl sm:text-4xl font-black">{prop}</h2>
                <p className="text-white/85 mt-2 text-sm sm:text-base">Hospitalidad hidalguense con alma: limpio, seguro y con detalles eco en cada habitación.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs font-bold">
                  <span className="bg-white/15 border border-white/25 px-3 py-1.5 rounded-full">⭐ Satisfacción garantizada</span>
                  <span className="bg-white/15 border border-white/25 px-3 py-1.5 rounded-full">🌿 Amenidades eco</span>
                  <span className="bg-white/15 border border-white/25 px-3 py-1.5 rounded-full">📍 {property.city}</span>
                </div>
              </div>
              <div className="bg-slate-900 p-4 flex flex-wrap gap-3 justify-between items-center border-x border-b border-slate-800">
                <p className="text-sm text-slate-300">📞 Reservas: <b className="text-white">{property.phone || '+52 775 759 1185'}</b></p>
                <p className="text-xs text-slate-500">Demo del portal de reserva directa</p>
              </div>
            </div>
            <BookingForm onBook={booking} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { e: '🛏️', t: 'Habitaciones cómodas', d: 'Sencillas, dobles Queen y suites con estilo' },
                { e: '🌿', t: 'Filosofía eco', d: 'Kits de bambú y agua alcalina' },
                { e: '🤖', t: 'Concierge IA 24/7', d: 'KynicOS atiende por WhatsApp/Telegram' },
              ].map(f => (
                <div key={f.t} className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-center">
                  <p className="text-3xl">{f.e}</p>
                  <p className="font-bold text-white text-sm mt-2">{f.t}</p>
                  <p className="text-xs text-slate-400 mt-1">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= DUEÑO ================= */}
        {tab === 'dueno' && (
          <div className="space-y-5">
            <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-400 p-5 sm:p-7 text-slate-950 shadow-xl">
              <p className="text-black/70 text-xs font-bold uppercase tracking-wider">👑 Modo Dueño · Visión de cadena</p>
              <h2 className="text-2xl sm:text-3xl font-black mt-1">Todo tu hotel, en una mirada</h2>
              <p className="text-black/70 text-sm mt-1">Datos consolidados de todas las propiedades, actualizados en tiempo real.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Kpi icon={<TrendingUp className="w-6 h-6" />} label="Ingresos" value={PRICE_FMT(chainStats.totalRev)} sub="tarifas + extras" color="from-emerald-500 to-teal-400" />
              <Kpi icon={<BedDouble className="w-6 h-6" />} label="Ocupación" value={`${Math.min(100, Math.round((chainStats.activeTotal / Math.max(1, chainStats.roomsTotal)) * 100))}%`} sub={`${chainStats.activeTotal} de ${chainStats.roomsTotal} hab`} color="from-sky-500 to-cyan-400" />
              <Kpi icon={<Building2 className="w-6 h-6" />} label="Propiedades" value={String(chainStats.rows.length)} sub="en operación" color="from-violet-500 to-fuchsia-500" />
              <Kpi icon={<MessageCircle className="w-6 h-6" />} label="Solicitudes" value={String(chainStats.openReqTotal)} sub="abiertas en la cadena" color="from-rose-500 to-pink-500" />
            </div>
            <Card title="Por propiedad" subtitle="Ocupación, ingresos y atención" Icon={Building2}>
              <div className="space-y-2.5">
                {chainStats.rows.map(r => (
                  <div key={r.name} className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="font-bold text-white text-sm leading-tight">{r.name}</p>
                      <p className="text-[10px] text-slate-500">{r.city}</p>
                    </div>
                    <div className="text-center"><p className="text-amber-300 font-black text-sm">{r.occ}%</p><p className="text-[10px] text-slate-500">ocupación</p></div>
                    <div className="text-center"><p className="text-emerald-300 font-black text-sm">{PRICE_FMT(r.rev)}</p><p className="text-[10px] text-slate-500">tarifas</p></div>
                    <div className="text-center"><p className="text-teal-300 font-black text-sm">{PRICE_FMT(r.extrasRev)}</p><p className="text-[10px] text-slate-500">extras</p></div>
                    <div className="text-center"><p className={`font-black text-sm ${r.openReq ? 'text-rose-300' : 'text-slate-500'}`}>{r.openReq}</p><p className="text-[10px] text-slate-500">solicitudes</p></div>
                  </div>
                ))}
              </div>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="Extras más vendidos" subtitle="Ranking de la cadena" Icon={ShoppingBag}>
                <div className="space-y-2">
                  {chainStats.topExtras.length === 0 && <p className="text-xs text-slate-500">Aún sin ventas registradas.</p>}
                  {chainStats.topExtras.map(([item, rev], i) => (
                    <div key={item} className="flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
                      <span className="text-xs font-bold text-slate-200">{i + 1}. {item}</span>
                      <span className="text-xs font-black text-emerald-300">{PRICE_FMT(rev)}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Reseñas de huéspedes" subtitle="Lo que dicen de nosotros" Icon={Star}>
                <div className="space-y-2">
                  {(data.reviews || []).slice(0, 5).map((r, i) => (
                    <div key={i} className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5">
                      <p className="text-[11px] font-bold text-white">{r.guest_name} · <span className="text-amber-300">{'★'.repeat(Number(r.rating) || 0)}</span></p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{r.comments}</p>
                    </div>
                  ))}
                  {!(data.reviews || []).length && <p className="text-xs text-slate-500">Aún sin reseñas registradas.</p>}
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* ============ PIN / CONFIRMAR ACCIÓN ============ */}
      {askMode && pending && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${writing ? '' : 'bg-slate-950/80 backdrop-blur-sm'}`} onClick={() => { if (!writing) closeAsk(); }}>
          <div className="bg-slate-900 border border-emerald-400/30 rounded-3xl p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-white text-base leading-snug">{pending.title}</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{pending.detail}</p>
            {askMode === 'pin' ? (
              <>
                <input autoFocus type="password" inputMode="numeric" maxLength={4} className={inputCls + ' mt-4 text-center text-lg tracking-[0.6em] font-black'} value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitPin()} placeholder="••••" />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={doDemo} className="rounded-xl bg-slate-800 text-slate-300 font-bold text-xs py-3.5 active:scale-95">Modo demo</button>
                  <button onClick={submitPin} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs py-3.5 active:scale-95">Desbloquear</button>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 text-center leading-relaxed">Con PIN los cambios se registran de verdad en el sistema. En modo demo solo se ven en este navegador.</p>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mt-5">
                  <button onClick={() => { if (!writing) closeAsk(); }} className="rounded-xl bg-slate-800 text-slate-300 font-bold text-xs py-3.5 active:scale-95">Cancelar</button>
                  <button onClick={doReal} disabled={writing} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs py-3.5 active:scale-95 disabled:opacity-60">{writing ? 'Registrando…' : '✓ Confirmar'}</button>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 text-center">La web del equipo y KynicOS se actualizan en ~1 min.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============ MODO DUEÑO (PIN) ============ */}
      {ownerAsk && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setOwnerAsk(false); setOwnerPinInput(''); }}>
          <div className="bg-slate-900 border border-amber-400/40 rounded-3xl p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-white text-base">👑 Modo Dueño</h3>
            <p className="text-xs text-slate-400 mt-1.5">Panel con la visión completa de la cadena: ingresos consolidados, ocupación por propiedad y rankings.</p>
            <input autoFocus type="password" inputMode="numeric" maxLength={4} className={inputCls + ' mt-4 text-center text-lg tracking-[0.6em] font-black'} value={ownerPinInput} onChange={e => setOwnerPinInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitOwnerPin(); }} placeholder="••••" />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => { setOwnerAsk(false); setOwnerPinInput(''); }} className="rounded-xl bg-slate-800 text-slate-300 font-bold text-xs py-3.5 active:scale-95">Cancelar</button>
              <button onClick={submitOwnerPin} className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs py-3.5 active:scale-95">Desbloquear</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TOAST ============ */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl max-w-[90%] text-center">
          {toast}
        </div>
      )}

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-40 flex">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold ${tab === t.id ? 'text-white' : 'text-slate-500'}`}>
            <span className={`w-9 h-1 rounded-full mb-0.5 ${tab === t.id ? `bg-gradient-to-r ${t.color}` : 'bg-transparent'}`} />
            <t.Icon className="w-5 h-5" />{t.label}
          </button>
        ))}
      </nav>

      <footer className="hidden md:block text-center text-[11px] text-slate-600 py-6 border-t border-slate-800/50">
        Hotel Cantabria PMS v6 · Huésped + Personal + Dueño · Datos vivos desde KynicOS (Base44)
      </footer>
    </div>
  );
}

/* ============ COMPONENTES ============ */
function buildFeed(stays, extras, requests) {
  const items = [];
  for (const s of stays) items.push({ emoji: '🛎️', text: `${(s.status || '') === 'Reservada' ? 'Reserva' : 'Estancia'} de ${s.guest_name} (Hab ${s.room})`, time: timeAgo(s.updated_date || s.created_date), src: 'Recepción', demo: s.demo });
  for (const e of extras) items.push({ emoji: '🛍️', text: `${e.item} × ${e.qty} → Hab ${e.room}`, time: timeAgo(e.created_date), src: 'Concierge', demo: e.demo });
  for (const r of requests) items.push({ emoji: '💬', text: `${r.type} · Hab ${r.room || '—'}`, time: timeAgo(r.created_date), src: 'Huésped', demo: r.demo });
  return items.filter(i => i.time !== '—').sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

function Kpi({ icon, label, value, sub, color }) {
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${color} p-[1.5px] shadow-lg`}>
      <div className="rounded-3xl bg-slate-900 h-full p-4">
        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-slate-950`}>{icon}</div>
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-2">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{value}</p>
        <p className="text-[11px] text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

function MiniStat({ v, l, c }) {
  return <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 text-center">
    <p className={`text-xl font-black ${c}`}>{v}</p>
    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{l}</p>
  </div>;
}

function StatusPill({ n, label, color }) {
  return <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 text-center">
    <p className={`inline-block w-9 h-9 leading-9 rounded-full ${color} text-slate-950 font-black text-sm`}>{n}</p>
    <p className="text-[11px] text-slate-400 font-semibold mt-1.5">{label}</p>
  </div>;
}

function Card({ title, subtitle, Icon, children }) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-3">
        {Icon && <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center"><Icon className="w-4 h-4 text-emerald-400" /></div>}
        <div>
          <h3 className="font-bold text-white text-sm">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ emoji, title, subtitle }) {
  return <div className="flex items-center gap-3">
    <span className="text-2xl">{emoji}</span>
    <div>
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  </div>;
}

function Field({ label, children }) {
  return <label className="block">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <div className="mt-1">{children}</div>
  </label>;
}

const inputCls = "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 placeholder:text-slate-600";

function CheckInForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ guest_name: '', room: '', check_in: new Date().toISOString().slice(0, 10), check_out: '', rate: '', notes: '' });
  return (
    <div className="rounded-3xl bg-slate-900 border border-sky-400/30 p-4 sm:p-5">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🛎️</span>
          <div className="text-left">
            <h3 className="font-bold text-white text-sm">Nuevo check-in</h3>
            <p className="text-[11px] text-slate-500">Registrar la llegada de un huésped</p>
          </div>
        </div>
        <span className="bg-sky-500 text-slate-950 font-black text-xs px-4 py-2 rounded-full">{open ? 'Cerrar' : '+ Abrir'}</span>
      </button>
      {open && (
        <form className="grid grid-cols-2 gap-3 mt-4" onSubmit={(e) => { e.preventDefault(); if (f.guest_name && f.room) { onAdd(f); setF({ ...f, guest_name: '', room: '', rate: '', notes: '' }); setOpen(false); } }}>
          <div className="col-span-2"><Field label="Huésped"><input required className={inputCls} value={f.guest_name} onChange={e => setF({ ...f, guest_name: e.target.value })} placeholder="Nombre completo" /></Field></div>
          <Field label="Habitación"><input required className={inputCls} value={f.room} onChange={e => setF({ ...f, room: e.target.value })} placeholder="101" /></Field>
          <Field label="Tarifa / noche"><input className={inputCls} inputMode="numeric" value={f.rate} onChange={e => setF({ ...f, rate: e.target.value })} placeholder="600" /></Field>
          <Field label="Entrada"><input type="date" className={inputCls} value={f.check_in} onChange={e => setF({ ...f, check_in: e.target.value })} /></Field>
          <Field label="Salida"><input type="date" className={inputCls} value={f.check_out} onChange={e => setF({ ...f, check_out: e.target.value })} /></Field>
          <div className="col-span-2"><Field label="Notas (opcional)"><input className={inputCls} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="Llegada tarde, pagó en efectivo..." /></Field></div>
          <button type="submit" className="col-span-2 bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 font-black py-3 rounded-2xl text-sm active:scale-[0.98] transition shadow-lg">Registrar check-in</button>
        </form>
      )}
    </div>
  );
}

function ServiceForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ room: '', guest_name: '', type: 'Toallas / Amenidades', details: '' });
  return (
    <div className="rounded-3xl bg-slate-900 border border-rose-400/30 p-4 sm:p-5">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">💬</span>
          <div className="text-left">
            <h3 className="font-bold text-white text-sm">Nueva solicitud de huésped</h3>
            <p className="text-[11px] text-slate-500">Registra lo que necesita la habitación</p>
          </div>
        </div>
        <span className="bg-rose-500 text-white font-black text-xs px-4 py-2 rounded-full">{open ? 'Cerrar' : '+ Abrir'}</span>
      </button>
      {open && (
        <form className="grid grid-cols-2 gap-3 mt-4" onSubmit={(e) => { e.preventDefault(); if (f.details) { onAdd(f); setF({ ...f, room: '', guest_name: '', details: '' }); setOpen(false); } }}>
          <Field label="Habitación"><input className={inputCls} value={f.room} onChange={e => setF({ ...f, room: e.target.value })} placeholder="103" /></Field>
          <Field label="Huésped"><input className={inputCls} value={f.guest_name} onChange={e => setF({ ...f, guest_name: e.target.value })} placeholder="Nombre (opcional)" /></Field>
          <div className="col-span-2"><Field label="Tipo">
            <select className={inputCls} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>
              <option className="bg-slate-900">Toallas / Amenidades</option>
              <option className="bg-slate-900">Limpieza extra</option>
              <option className="bg-slate-900">Mantenimiento</option>
              <option className="bg-slate-900">Taxi / Transporte</option>
              <option className="bg-slate-900">Otro</option>
            </select>
          </Field></div>
          <div className="col-span-2"><Field label="Detalles"><input required className={inputCls} value={f.details} onChange={e => setF({ ...f, details: e.target.value })} placeholder="2 toallas extra y una almohada" /></Field></div>
          <button type="submit" className="col-span-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black py-3 rounded-2xl text-sm active:scale-[0.98] transition shadow-lg">Registrar solicitud</button>
        </form>
      )}
    </div>
  );
}

function ExtraPopover({ item, onAdd, rooms }) {
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState('');
  const [qty, setQty] = useState(1);
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen(!open)} className="bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-full active:scale-95 transition shadow-lg shadow-emerald-900/40 flex items-center gap-1">
        <Plus className="w-4 h-4" />Pedir
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 bg-slate-900 border border-slate-700 rounded-2xl p-4 w-60 shadow-2xl space-y-3">
          <Field label="Habitación">
            <input list="rooms-list" className={inputCls} value={room} onChange={e => setRoom(e.target.value)} placeholder="101" />
          </Field>
          <datalist id="rooms-list">{rooms.map(r => <option key={r} value={r} />)}</datalist>
          <Field label="Cantidad">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-xl bg-slate-800 text-white font-black">−</button>
              <span className="flex-1 text-center font-black text-white">{qty}</span>
              <button type="button" onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-black">+</button>
            </div>
          </Field>
          <button onClick={() => { if (room) { onAdd(item, qty, room); setOpen(false); setQty(1); setRoom(''); } }}
            className={`w-full font-black py-2.5 rounded-xl text-sm transition ${room ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
            Agregar {room ? `→ Hab ${room}` : '(falta hab.)'}
          </button>
        </div>
      )}
    </div>
  );
}

function BookingForm({ onBook }) {
  const [f, setF] = useState({ guest_name: '', check_in: new Date().toISOString().slice(0, 10), check_out: '', phone: '' });
  const [done, setDone] = useState(false);
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-6">
      <h3 className="font-black text-white text-base mb-1">📅 Reserva directa</h3>
      <p className="text-xs text-slate-400 mb-4">Sin comisiones de plataformas. KynicOS confirma por WhatsApp/Telegram.</p>
      <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); if (f.guest_name && f.check_out) { onBook(f); setDone(true); setTimeout(() => setDone(false), 4000); setF({ ...f, guest_name: '', phone: '' }); } }}>
        <div className="col-span-2"><Field label="Nombre"><input required className={inputCls} value={f.guest_name} onChange={e => setF({ ...f, guest_name: e.target.value })} placeholder="Tu nombre completo" /></Field></div>
        <Field label="Entrada"><input type="date" required className={inputCls} value={f.check_in} onChange={e => setF({ ...f, check_in: e.target.value })} /></Field>
        <Field label="Salida"><input type="date" required className={inputCls} value={f.check_out} onChange={e => setF({ ...f, check_out: e.target.value })} /></Field>
        <div className="col-span-2"><Field label="WhatsApp / Telegram"><input className={inputCls} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+52 ..." /></Field></div>
        <button type="submit" className="col-span-2 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-black py-3.5 rounded-2xl text-sm active:scale-[0.98] transition shadow-lg">
          {done ? '✓ ¡Solicitud enviada!' : 'Solicitar reserva'}
        </button>
      </form>
    </div>
  );
}
