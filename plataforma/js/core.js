// =====================================================================
// Núcleo: utilidades, cifrado, almacenamiento y trazabilidad
// ---------------------------------------------------------------------
// - La bóveda clínica se guarda cifrada (AES-GCM 256) con una clave
//   derivada del PIN de la profesional (PBKDF2-SHA-256, 310.000 iter.).
// - La agenda pública (perfil, servicios, horarios y huecos ocupados sin
//   nombres) se guarda sin cifrar para que la página de reservas funcione
//   sin PIN.
// - Las solicitudes de cita que llegan desde la página pública se cifran
//   con la clave pública RSA-OAEP de la profesional: solo se pueden leer
//   después de desbloquear la bóveda.
// - Cada acción queda en un registro de auditoría encadenado con SHA-256
//   (cada evento incluye el hash del anterior), de modo que cualquier
//   alteración posterior se detecta al verificar la cadena.
// =====================================================================

export const KEYS = {
  vault: 'salito.vault.v1',
  pub: 'salito.public.v1',
  inbox: 'salito.inbox.v1',
};

// ---------- utilidades ----------
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const uid = (p = 'id') => p + '_' + crypto.getRandomValues(new Uint32Array(2)).join('').slice(0, 12) + Date.now().toString(36).slice(-4);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const clone = (o) => JSON.parse(JSON.stringify(o));
export const pad = (n) => String(n).padStart(2, '0');

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function sha256(text) {
  const h = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- fechas ----------
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const DIA_C = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const addMin = (d, n) => new Date(new Date(d).getTime() + n * 60000);
export const startOfWeek = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); };
export const sameDay = (a, b) => ymd(new Date(a)) === ymd(new Date(b));
export const fmtDate = (d, opts = {}) => {
  d = new Date(d);
  const base = `${d.getDate()} de ${MESES[d.getMonth()]}`;
  const y = opts.year === false ? '' : (opts.year || d.getFullYear() !== new Date().getFullYear()) ? ` de ${d.getFullYear()}` : '';
  return (opts.weekday ? DIAS[d.getDay()] + ' ' : '') + base + y;
};
export const fmtShort = (d) => { d = new Date(d); return `${d.getDate()} ${MES_C[d.getMonth()]}`; };
export const fmtDateTime = (d) => `${fmtDate(d)} · ${hm(new Date(d))}`;
export const age = (birth) => { if (!birth) return null; const b = parseYmd(birth), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--; return a; };
export const money = (n, cur = 'USD') => new Intl.NumberFormat('es-EC', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n || 0);
export const relDays = (d) => {
  const t = new Date(); t.setHours(0, 0, 0, 0); const x = new Date(d); x.setHours(0, 0, 0, 0);
  const n = Math.round((x - t) / 864e5);
  if (n === 0) return 'hoy'; if (n === 1) return 'mañana'; if (n === -1) return 'ayer';
  return n > 0 ? `en ${n} días` : `hace ${-n} días`;
};

// ---------- cifrado simétrico (bóveda) ----------
async function deriveKey(pin, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function aesEncrypt(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { iv: b64(iv), ct: b64(ct) };
}
async function aesDecrypt(key, box) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct));
  return JSON.parse(dec.decode(pt));
}

// ---------- cifrado asimétrico (solicitudes públicas) ----------
const RSA = { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
export async function encryptForOwner(publicJwk, obj) {
  const pub = await crypto.subtle.importKey('jwk', publicJwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  const k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const raw = await crypto.subtle.exportKey('raw', k);
  const wrapped = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pub, raw);
  const box = await aesEncrypt(k, obj);
  return { k: b64(wrapped), ...box, at: new Date().toISOString() };
}
async function decryptFromInbox(privateJwk, item) {
  const priv = await crypto.subtle.importKey('jwk', privateJwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
  const raw = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, priv, unb64(item.k));
  const k = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  return aesDecrypt(k, item);
}

// ---------- almacenamiento seguro ----------
const ls = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { } },
};
export const storage = ls;

export const Store = {
  db: null,          // bóveda descifrada en memoria (solo con sesión abierta)
  key: null,         // clave AES derivada del PIN
  salt: null,
  listeners: new Set(),
  lastActivity: Date.now(),

  hasVault() { return !!ls.get(KEYS.vault); },
  isUnlocked() { return !!this.db; },
  publicData() { return ls.get(KEYS.pub); },

  async create(pin, db) {
    this.salt = crypto.getRandomValues(new Uint8Array(16));
    this.key = await deriveKey(pin, this.salt);
    const kp = await crypto.subtle.generateKey(RSA, true, ['encrypt', 'decrypt']);
    db.keys = { pub: await crypto.subtle.exportKey('jwk', kp.publicKey), priv: await crypto.subtle.exportKey('jwk', kp.privateKey) };
    db.audit = db.audit || [];
    this.db = db;
    await this.log('sistema.creacion', 'sistema', null, 'Se creó la bóveda cifrada de la consulta');
    await this.save();
  },

  async unlock(pin) {
    const v = ls.get(KEYS.vault);
    if (!v) throw new Error('No hay bóveda');
    const salt = unb64(v.salt);
    const key = await deriveKey(pin, salt);
    let db;
    try { db = await aesDecrypt(key, v.box); } catch { throw new Error('PIN incorrecto'); }
    this.key = key; this.salt = salt; this.db = db; this.lastActivity = Date.now();
    await this.log('sesion.inicio', 'sesion', null, 'Inicio de sesión con PIN');
    const n = await this.importInbox();
    await this.save();
    return n;
  },

  async changePin(pin) {
    this.salt = crypto.getRandomValues(new Uint8Array(16));
    this.key = await deriveKey(pin, this.salt);
    await this.log('seguridad.pin', 'sesion', null, 'Se cambió el PIN de acceso');
    await this.save();
  },

  lock(reason = 'manual') {
    if (this.db) {
      // el registro de cierre se guarda antes de borrar la clave
      const db = this.db;
      this.log('sesion.cierre', 'sesion', null, reason === 'inactividad' ? 'Cierre automático por inactividad' : 'Cierre de sesión').then(() => this.save()).finally(() => {
        if (this.db === db) { this.db = null; this.key = null; }
        this.emit();
      });
    }
  },

  async save() {
    if (!this.db || !this.key) return;
    const box = await aesEncrypt(this.key, this.db);
    ls.set(KEYS.vault, { v: 1, salt: b64(this.salt), box, savedAt: new Date().toISOString() });
    this.publish();
    this.emit();
  },

  // Datos públicos: sin información clínica ni nombres
  publish() {
    const db = this.db;
    const now = Date.now();
    const busy = db.appointments
      .filter((a) => ['solicitada', 'confirmada'].includes(a.status) && new Date(a.start).getTime() > now - 864e5)
      .map((a) => ({ start: a.start, minutes: a.minutes }));
    ls.set(KEYS.pub, {
      profile: db.profile, services: db.services.filter((s) => s.active !== false), availability: db.availability,
      policies: db.policies, pubKey: db.keys.pub, busy, updatedAt: new Date().toISOString(),
    });
  },

  async importInbox() {
    const items = ls.get(KEYS.inbox) || [];
    if (!items.length) return 0;
    let n = 0;
    for (const it of items) {
      try {
        const req = await decryptFromInbox(this.db.keys.priv, it);
        this.ingestRequest(req);
        n++;
      } catch (e) { console.warn('Solicitud ilegible', e); }
    }
    ls.set(KEYS.inbox, []);
    for (const ev of this._pendingLogs || []) await this.log(...ev);
    this._pendingLogs = [];
    return n;
  },

  ingestRequest(r) {
    const db = this.db;
    this._pendingLogs = this._pendingLogs || [];
    const norm = (s) => (s || '').trim().toLowerCase();
    let p = db.patients.find((x) => (r.docId && x.docId === r.docId) || (r.email && norm(x.email) === norm(r.email)));
    if (!p) {
      p = newPatient({ name: r.name, email: r.email, phone: r.phone, docId: r.docId, birth: r.birth, reason: r.reason, referral: r.referral || 'Página web', status: 'nuevo' });
      db.patients.push(p);
      this._pendingLogs.push(['paciente.alta', 'paciente', p.id, `Alta desde la página de reservas: ${p.name}`]);
    }
    p.consents = p.consents || [];
    for (const c of r.consents || []) p.consents.push({ ...c, method: 'Casilla en la página de reservas' });
    const svc = db.services.find((s) => s.id === r.serviceId) || db.services[0];
    const a = {
      id: uid('cita'), patientId: p.id, serviceId: svc.id, start: r.start, minutes: svc.minutes, modality: r.modality || 'presencial',
      status: 'solicitada', price: svc.price, paid: false, source: 'web', note: r.message || '', createdAt: r.at || new Date().toISOString(),
      history: [{ at: new Date().toISOString(), status: 'solicitada', by: 'Paciente (web)' }],
    };
    db.appointments.push(a);
    this._pendingLogs.push(['cita.solicitud', 'cita', a.id, `Solicitud web: ${svc.name}, ${fmtDateTime(a.start)}`]);
  },

  // ---------- trazabilidad ----------
  async log(action, entity, entityId, detail, actor, ts) {
    const db = this.db; if (!db) return;
    const prev = db.audit.length ? db.audit[db.audit.length - 1].hash : 'GENESIS';
    const ev = { seq: db.audit.length + 1, ts: ts || new Date().toISOString(), actor: actor || (db.profile?.short || 'Profesional'), action, entity, entityId, detail, prev };
    ev.hash = await sha256(prev + '|' + JSON.stringify([ev.seq, ev.ts, ev.actor, ev.action, ev.entity, ev.entityId, ev.detail]));
    db.audit.push(ev);
    return ev;
  },
  async verifyAudit() {
    const a = this.db.audit; let prev = 'GENESIS';
    for (const ev of a) {
      const h = await sha256(prev + '|' + JSON.stringify([ev.seq, ev.ts, ev.actor, ev.action, ev.entity, ev.entityId, ev.detail]));
      if (ev.prev !== prev || h !== ev.hash) return { ok: false, at: ev.seq, total: a.length };
      prev = ev.hash;
    }
    return { ok: true, total: a.length, head: prev };
  },

  // ---------- cambios con registro ----------
  async commit(action, entity, entityId, detail) {
    await this.log(action, entity, entityId, detail);
    await this.save();
  },

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit() { for (const fn of this.listeners) fn(); },

  async exportEncrypted() { return ls.get(KEYS.vault); },
  importEncrypted(obj) { ls.set(KEYS.vault, obj); this.db = null; this.key = null; },
  wipe() { ls.del(KEYS.vault); ls.del(KEYS.pub); ls.del(KEYS.inbox); this.db = null; this.key = null; },
};

export function newPatient(o = {}) {
  return {
    id: uid('pac'), code: 'HC-' + Math.random().toString(36).slice(2, 7).toUpperCase(), name: '', docId: '', birth: '', gender: '', pronouns: '', phone: '', email: '',
    city: '', occupation: '', civil: '', emergency: { name: '', rel: '', phone: '' }, referral: '', reason: '', status: 'activo', risk: 'sin_evaluar', tags: [],
    consents: [], diagnoses: [], goals: [], anamnesis: {}, safety: null, createdAt: new Date().toISOString(), ...o,
  };
}

// ---------- disponibilidad ----------
// Devuelve los horarios libres de un día para un servicio.
export function freeSlots(pub, dateStr, minutes, ignoreId = null, appts = null) {
  const av = pub.availability; const d = parseYmd(dateStr);
  if ((av.blocks || []).some((b) => b.date === dateStr)) return [];
  const ranges = av.weekly[d.getDay()] || [];
  const step = av.step || 60; const buffer = av.buffer || 0;
  const busy = (appts || pub.busy || []).filter((a) => a.id !== ignoreId).map((a) => [new Date(a.start).getTime(), new Date(a.start).getTime() + (a.minutes + buffer) * 60000]);
  const minStart = Date.now() + (av.minNoticeHours || 0) * 3600000;
  const out = [];
  for (const [from, to] of ranges) {
    const [fh, fm] = from.split(':').map(Number); const [th, tm] = to.split(':').map(Number);
    let t = new Date(d); t.setHours(fh, fm, 0, 0);
    const end = new Date(d); end.setHours(th, tm, 0, 0);
    while (t.getTime() + minutes * 60000 <= end.getTime()) {
      const s = t.getTime(), e = s + minutes * 60000;
      if (s >= minStart && !busy.some(([bs, be]) => s < be && e > bs)) out.push(new Date(t));
      t = addMin(t, step);
    }
  }
  return out;
}

// ---------- archivos ----------
export function download(name, content, type = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
export function icsFor({ title, start, minutes, location, description }) {
  const f = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Salito//Agenda//ES', 'BEGIN:VEVENT', `UID:${uid('ev')}@salito`, `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(start)}`, `DTEND:${f(addMin(start, minutes))}`, `SUMMARY:${title}`, `LOCATION:${location || ''}`, `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
    'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY', 'DESCRIPTION:Recordatorio de sesión', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
export const waLink = (phone, text) => `https://wa.me/${String(phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
