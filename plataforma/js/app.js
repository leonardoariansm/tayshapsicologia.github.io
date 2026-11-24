// =====================================================================
// Panel clínico de la profesional
// =====================================================================
import { Store, $, $$, esc, uid, clone, ymd, hm, parseYmd, addDays, addMin, startOfWeek, sameDay, fmtDate, fmtShort, fmtDateTime, age, money, relDays, DIA_C, DIAS, MESES, freeSlots, download, icsFor, waLink, newPatient, sha256, pad } from './core.js';
import { SCALES, score, trajectory, STATUS_LABEL, CGI, CRISIS, NORMATIVA, CONSENTS } from './scales.js';
import { baseConfig, demoData } from './seed.js';
import { icon, avatar, statusPill, riskPill, pStatusPill, STATUS, RISK, PSTATUS, toast, modal, confirmDialog, formData, lineChart, barChart } from './ui.js';
import { renderBooking } from './booking.js';
import { renderLanding } from './landing.js';

const root = document.getElementById('root');
const db = () => Store.db;
const pat = (id) => db().patients.find((p) => p.id === id);
const svc = (id) => db().services.find((s) => s.id === id) || { name: 'Servicio', minutes: 50, price: 0 };
const cur = () => NORMATIVA[db().country]?.moneda || 'USD';
const $m = (n) => money(n, cur());

export const NOTE_FORMATS = {
  integ: { label: 'Nota clínica integradora', fields: [['motivo', 'Tema o motivo de la sesión'], ['desarrollo', 'Desarrollo de la sesión'], ['intervencion', 'Intervención'], ['plan', 'Plan y tareas']] },
  SOAP: { label: 'SOAP', fields: [['s', 'Subjetivo: lo que relata la persona'], ['o', 'Objetivo: observación clínica y escalas'], ['a', 'Análisis: formulación clínica'], ['p', 'Plan']] },
  DAP: { label: 'DAP', fields: [['d', 'Datos'], ['a', 'Análisis'], ['p', 'Plan']] },
  BIRP: { label: 'BIRP', fields: [['b', 'Conducta (presentación)'], ['i', 'Intervención'], ['r', 'Respuesta'], ['p', 'Plan']] },
  crisis: { label: 'Intervención en crisis (PAP)', fields: [['situacion', 'Situación y desencadenante'], ['riesgo', 'Valoración del riesgo (ideación, plan, intención, medios, protectores)'], ['intervencion', 'Primeros auxilios psicológicos realizados'], ['red', 'Red de apoyo contactada y derivación'], ['plan', 'Seguimiento acordado']] },
};
const TECHNIQUES = ['TCC', 'Reestructuración cognitiva', 'Activación conductual', 'Exposición gradual', 'ACT', 'DBT', 'Mindfulness', 'CFT', 'Humanista', 'Psicodinámico', 'Psicoeducación', 'Tareas del duelo', 'PAP', 'Estimulación cognitiva', 'Plan de seguridad'];
const RISK_LV = { sin_riesgo: 'Sin indicadores de riesgo', bajo: 'Riesgo bajo', moderado: 'Riesgo moderado', alto: 'Riesgo alto' };

// ---------------------------------------------------------------------
// Ruteo
// ---------------------------------------------------------------------
const NAV = [
  ['inicio', 'Inicio', 'home', 'g-sun'], ['agenda', 'Agenda', 'cal', 'g-sky'], ['pacientes', 'Pacientes', 'users', 'g-rose'], ['finanzas', 'Cobros', 'coin', 'g-sage'], ['trazabilidad', 'Trazabilidad', 'shield', 'g-sea'], ['ajustes', 'Ajustes', 'gear', 'g-ink'],
];
let state = { week: startOfWeek(new Date()), view: 'week', day: new Date(), q: '', pf: 'todos', tab: 'resumen' };

function route() {
  const h = location.hash.replace(/^#\/?/, '');
  if (!h) return renderLanding(root);
  const [name, ...rest] = h.split('/');
  if (name === 'reservar') { document.body.dataset.mode = 'public'; return renderBooking(root); }
  document.body.dataset.mode = 'panel';
  if (!Store.isUnlocked()) return renderLock();
  Store.lastActivity = Date.now();
  const views = { inicio: viewHome, agenda: viewAgenda, pacientes: viewPatients, paciente: viewPatient, finanzas: viewFinance, trazabilidad: viewAudit, ajustes: viewSettings };
  (views[name] || viewHome)(...rest);
}
window.addEventListener('hashchange', route);
Store.on(() => { if (!Store.isUnlocked() && document.body.dataset.mode === 'panel') renderLock(); });

// Bloqueo automático por inactividad
['click', 'keydown', 'pointermove', 'touchstart'].forEach((e) => addEventListener(e, () => { Store.lastActivity = Date.now(); }, { passive: true }));
setInterval(() => {
  if (!Store.isUnlocked()) return;
  const mins = db().policies?.lockMinutes || 10;
  if (Date.now() - Store.lastActivity > mins * 60000) { Store.lock('inactividad'); toast('Sesión cerrada por inactividad'); }
}, 15000);

// Tema claro/oscuro
const themeKey = 'salito.theme';
const applyTheme = (t) => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };
try { applyTheme(localStorage.getItem(themeKey)); } catch { }
function toggleTheme() {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const t = dark ? 'light' : 'dark'; applyTheme(t); try { localStorage.setItem(themeKey, t); } catch { }
}

// ---------------------------------------------------------------------
// Acceso
// ---------------------------------------------------------------------
function renderLock() {
  const has = Store.hasVault();
  root.innerHTML = `<div class="lock">
    <div class="lock-art">
      <div class="orb" style="width:520px;height:520px;right:-180px;top:-160px"></div><div class="orb" style="width:300px;height:300px;left:-120px;bottom:-120px"></div>
      <div class="brand" style="padding:0"><div class="brand-mark" style="color:#fff">S</div><div><b>Salito</b><span style="color:#47504F">Consulta de Salomé Argoti</span></div></div>
      <div>
        <h1>Tu consulta, en orden y en confianza.</h1>
        <p>Agenda, historia clínica, escalas de resultado y trazabilidad en un solo lugar. La información clínica se guarda cifrada en este dispositivo y solo se abre con tu PIN.</p>
        <ul><li>Reservas en línea sin exponer datos de pacientes</li><li>Historia clínica con notas firmadas y adendas</li><li>PHQ-9, GAD-7 y WHO-5 con cambio clínicamente fiable</li><li>Registro de auditoría encadenado e imposible de alterar sin que se note</li></ul>
      </div>
      <div class="row"><a class="btn sm" href="#/">Ver la landing</a><a class="btn sm" href="#/reservar">Página de reservas</a></div>
    </div>
    <div class="lock-form"><form class="lock-box" id="lockf" autocomplete="off">
      ${has ? `<h2>Entrar a la consulta</h2><p class="muted">Escribe tu PIN para descifrar la información.</p>
        <label class="f">PIN<input class="pin" type="password" inputmode="numeric" name="pin" minlength="4" required autofocus aria-label="PIN"></label>
        <button class="btn primary lg" type="submit">${icon('lock')} Desbloquear</button>
        <p class="tiny muted" id="lockmsg" role="alert"></p>
        <details class="tiny muted"><summary>¿Olvidaste el PIN?</summary><p style="margin-top:6px">Por seguridad no hay forma de recuperar los datos sin el PIN. Puedes restaurar un respaldo cifrado o empezar de cero.</p><button type="button" class="btn sm danger" id="wipe" style="margin-top:8px">Borrar todo y empezar de cero</button></details>`
      : `<h2>Configurar la consulta</h2><p class="muted">Crea un PIN de al menos 6 dígitos. Con él se cifra toda la información clínica en este dispositivo.</p>
        <label class="f">Nuevo PIN<input class="pin" type="password" inputmode="numeric" name="pin" minlength="6" required autofocus></label>
        <label class="f">Repite el PIN<input class="pin" type="password" inputmode="numeric" name="pin2" minlength="6" required></label>
        <label class="check"><input type="checkbox" name="demo" checked> Cargar pacientes de demostración (ficticios) para conocer la plataforma</label>
        <button class="btn primary lg" type="submit">Crear bóveda cifrada</button>
        <p class="tiny muted" id="lockmsg" role="alert"></p>
        <label class="btn ghost sm" style="cursor:pointer">Restaurar respaldo cifrado<input type="file" accept=".json" id="restore" hidden></label>`}
    </form></div></div>`;
  const f = $('#lockf'); const msg = $('#lockmsg');
  f.onsubmit = async (e) => {
    e.preventDefault(); const d = formData(f); msg.textContent = 'Procesando…';
    try {
      if (has) {
        const n = await Store.unlock(d.pin);
        if (n) toast(`${n} solicitud${n > 1 ? 'es' : ''} nueva${n > 1 ? 's' : ''} desde la web`);
      } else {
        if (d.pin !== d.pin2) { msg.textContent = 'Los PIN no coinciden.'; return; }
        if (!/^\d{6,}$/.test(d.pin)) { msg.textContent = 'Usa solo números, mínimo 6.'; return; }
        await Store.create(d.pin, d.demo ? demoData() : baseConfig());
        if (d.demo) { await seedHistory(); await Store.commit('sistema.demo', 'sistema', null, 'Se cargaron datos de demostración ficticios'); }
      }
      route();
    } catch (err) { msg.textContent = err.message === 'PIN incorrecto' ? 'PIN incorrecto. Inténtalo de nuevo.' : 'No se pudo abrir: ' + err.message; f.pin.value = ''; f.pin.focus(); }
  };
  $('#wipe') && ($('#wipe').onclick = async () => { if (await confirmDialog('Borrar todo', 'Se eliminará la bóveda cifrada de este dispositivo. Esta acción no se puede deshacer.', 'Borrar todo', true)) { Store.wipe(); renderLock(); } });
  $('#restore') && ($('#restore').onchange = async (e) => { try { const obj = JSON.parse(await e.target.files[0].text()); if (!obj.box) throw 0; Store.importEncrypted(obj); toast('Respaldo restaurado. Escribe el PIN con el que se creó.'); renderLock(); } catch { toast('El archivo no es un respaldo válido'); } });
}

// Historial de trazabilidad para los datos de demostración (fechas en el pasado)
async function seedHistory() {
  const D = db(); const ev = [];
  for (const p of D.patients) ev.push([p.createdAt, 'paciente.alta', 'paciente', p.id, `Historia clínica creada: ${p.name} (${p.code})`]);
  for (const a of D.appointments) { const p = pat(a.patientId); const c = addDays(new Date(a.start), -7).toISOString(); ev.push([c < p.createdAt ? p.createdAt : c, 'cita.creacion', 'cita', a.id, `Cita agendada: ${p.name}, ${svc(a.serviceId).name}, ${fmtDateTime(a.start)}`]); if (['atendida', 'no_asistio', 'cancelada'].includes(a.status) && new Date(a.start) < new Date()) ev.push([addMin(a.start, a.minutes).toISOString(), 'cita.' + a.status, 'cita', a.id, `${STATUS[a.status]}: ${p.name}, ${fmtDateTime(a.start)}`]); }
  for (const n of D.notes) { const t = addMin(n.date, 70).toISOString(); ev.push([t, 'nota.creacion', 'nota', n.id, `Nota creada: ${pat(n.patientId).name}, ${fmtDate(n.date)}`]); if (n.signed) { n.signedAt = t; n.hash = await noteHash(n); ev.push([t, 'nota.firma', 'nota', n.id, `Nota firmada (${fmtDate(n.date)}) · sha256 ${n.hash.slice(0, 16)}`]); } }
  for (const x of D.assessments) { const r = score(x.type, x.answers); ev.push([x.date + 'T12:00:00.000Z', 'escala.aplicacion', 'escala', x.id, `${r.name} aplicado a ${pat(x.patientId).name}: ${r.score} (${r.band})${r.crisis ? ' · pregunta 9 positiva' : ''}`]); }
  const past = ev.filter((e) => e[0] <= new Date().toISOString()).sort((a, b) => a[0].localeCompare(b[0]));
  // la creación de la bóveda queda primero; el historial simulado se agrega después para conservar la cadena
  for (const [ts, ...rest] of past) await Store.log(rest[0], rest[1], rest[2], rest[3], D.profile.short, ts);
}

// ---------------------------------------------------------------------
// Estructura
// ---------------------------------------------------------------------
function pendingCount() { return db().appointments.filter((a) => a.status === 'solicitada').length; }
function shell(active, html) {
  const pc = pendingCount();
  const p = db().profile;
  root.innerHTML = `<div class="app">
    <aside class="side"><div class="brand"><div class="brand-mark">S</div><div><b>Salito</b><span>${esc(p.short)}</span></div></div>
      <nav class="nav">${NAV.map(([k, l, ic, g]) => `<a href="#/${k}" class="${active === k ? 'on' : ''}"><span class="gicon sm ${g}">${icon(ic)}</span>${l}${k === 'agenda' && pc ? `<span class="count">${pc}</span>` : ''}</a>`).join('')}</nav>
      <div class="side-foot"><a class="btn ghost sm" href="#/reservar" target="_blank" rel="noopener">${icon('link')} Página de reservas</a>
      <div class="row"><button class="btn ghost sm" id="theme" aria-label="Cambiar tema">${icon('moon')}</button><button class="btn ghost sm" id="logout">${icon('out')} Cerrar sesión</button></div></div></aside>
    <header class="topbar"><div class="brand" style="padding:0"><div class="brand-mark" style="width:30px;height:30px;font-size:16px">S</div><b>Salito</b></div><div class="row"><button class="btn ghost sm" id="theme2" aria-label="Cambiar tema">${icon('moon')}</button><button class="btn ghost sm" id="logout2" aria-label="Cerrar sesión">${icon('out')}</button></div></header>
    <main class="main" id="main">${html}</main>
    <nav class="mnav">${NAV.slice(0, 5).map(([k, l, ic]) => `<a href="#/${k}" class="${active === k ? 'on' : ''}">${icon(ic)}${l}</a>`).join('')}</nav></div>`;
  ['#logout', '#logout2'].forEach((s) => $(s).onclick = () => { Store.lock(); });
  ['#theme', '#theme2'].forEach((s) => $(s).onclick = toggleTheme);
}

// ---------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------
function alertsFor() {
  const out = []; const D = db(); const now = new Date();
  for (const a of D.appointments.filter((x) => x.status === 'solicitada')) { const p = pat(a.patientId); out.push({ lv: 'warn', t: `Solicitud por confirmar: ${p?.name}`, d: `${svc(a.serviceId).name}, ${fmtDateTime(a.start)}${a.source === 'web' ? ' · desde la web' : ''}`, act: `appt:${a.id}` }); }
  for (const p of D.patients.filter((x) => ['activo', 'nuevo'].includes(x.status))) {
    const last = D.assessments.filter((x) => x.patientId === p.id && x.type === 'PHQ9').sort((a, b) => b.date.localeCompare(a.date))[0];
    if (last && score('PHQ9', last.answers).crisis && (now - parseYmd(last.date)) / 864e5 < 30) out.push({ lv: 'bad', t: `${p.name}: PHQ-9 con respuesta positiva en la pregunta 9`, d: `Aplicado ${relDays(parseYmd(last.date))}. Revisar el riesgo y el plan de seguridad.`, act: `p:${p.id}:escalas` });
    if (p.risk === 'alto' && !p.safety) out.push({ lv: 'bad', t: `${p.name}: riesgo alto sin plan de seguridad`, d: 'Construir el plan de seguridad en la próxima sesión.', act: `p:${p.id}:seguridad` });
    const anyT = D.assessments.filter((x) => x.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    const nSess = D.appointments.filter((x) => x.patientId === p.id && x.status === 'atendida').length;
    if (nSess >= 2 && (!anyT || (now - parseYmd(anyT.date)) / 864e5 > 30)) out.push({ lv: 'info', t: `${p.name}: escalas pendientes`, d: anyT ? `Última medición ${relDays(parseYmd(anyT.date))}.` : 'Sin mediciones de resultado todavía.', act: `p:${p.id}:escalas` });
    if (!(p.consents || []).some((c) => c.type === 'datos')) out.push({ lv: 'warn', t: `${p.name}: falta el consentimiento de datos`, d: 'Requerido para tratar datos de salud.', act: `p:${p.id}:consentimientos` });
  }
  const unsigned = D.notes.filter((n) => !n.signed);
  if (unsigned.length) out.push({ lv: 'info', t: `${unsigned.length} nota${unsigned.length > 1 ? 's' : ''} sin firmar`, d: unsigned.map((n) => pat(n.patientId)?.name).filter(Boolean).slice(0, 3).join(', '), act: `p:${unsigned[0].patientId}:sesiones` });
  const past = D.appointments.filter((a) => a.status === 'confirmada' && addMin(a.start, a.minutes) < now);
  if (past.length) out.push({ lv: 'warn', t: `${past.length} cita${past.length > 1 ? 's' : ''} pasada${past.length > 1 ? 's' : ''} sin cerrar`, d: 'Marca si fue atendida o si la persona no asistió.', act: `appt:${past[0].id}` });
  return out.sort((a, b) => ({ bad: 0, warn: 1, info: 2 }[a.lv] - { bad: 0, warn: 1, info: 2 }[b.lv]));
}

function viewHome() {
  const D = db(); const now = new Date();
  const today = D.appointments.filter((a) => sameDay(a.start, now) && a.status !== 'cancelada').sort((a, b) => a.start.localeCompare(b.start));
  const m0 = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = D.appointments.filter((a) => new Date(a.start) >= m0 && new Date(a.start) <= now);
  const att = month.filter((a) => a.status === 'atendida').length, ns = month.filter((a) => a.status === 'no_asistio').length;
  const rate = att + ns ? Math.round((att / (att + ns)) * 100) : 100;
  const charged = month.filter((a) => a.status === 'atendida' && a.paid).reduce((s, a) => s + (a.price || 0), 0);
  const due = D.appointments.filter((a) => a.status === 'atendida' && !a.paid).reduce((s, a) => s + (a.price || 0), 0);
  const active = D.patients.filter((p) => ['activo', 'nuevo'].includes(p.status)).length;
  const wk = startOfWeek(now);
  const weeks = Array.from({ length: 10 }, (_, i) => { const s = addDays(wk, (i - 7) * 7), e = addDays(s, 7); return { l: fmtShort(s), v: D.appointments.filter((a) => ['atendida', 'confirmada'].includes(a.status) && new Date(a.start) >= s && new Date(a.start) < e).length, hi: i === 7 }; });
  const al = alertsFor();
  const next = D.appointments.filter((a) => new Date(a.start) > now && ['confirmada', 'solicitada'].includes(a.status)).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 5);
  const h = now.getHours(); const greet = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  shell('inicio', `
    <div class="head"><div><h1>${greet}, ${esc(D.profile.short.split(' ')[0])}</h1><p>${fmtDate(now, { weekday: true, year: true })} · ${today.length ? `${today.length} ${today.length > 1 ? 'sesiones' : 'sesión'} hoy` : 'Sin sesiones hoy'}</p></div>
      <div class="row"><button class="btn" data-newp>${icon('plus')} Paciente</button><button class="btn primary" data-newa>${icon('plus')} Nueva cita</button></div></div>
    <div class="grid g4" style="margin-bottom:16px">
      <div class="card kpi"><div class="l">Pacientes en proceso</div><div class="v">${active}</div><div class="d muted">${D.patients.filter((p) => p.status === 'lista_espera').length} en lista de espera</div></div>
      <div class="card kpi"><div class="l">Sesiones atendidas este mes</div><div class="v">${att}</div><div class="d muted">${ns} inasistencia${ns === 1 ? '' : 's'}</div></div>
      <div class="card kpi"><div class="l">Asistencia del mes</div><div class="v">${rate}%</div><div class="bar" style="margin-top:8px"><i style="width:${rate}%"></i></div></div>
      <div class="card kpi"><div class="l">Cobrado este mes</div><div class="v">${$m(charged)}</div><div class="d ${due ? '' : 'muted'}" style="${due ? 'color:var(--warn)' : ''}">${$m(due)} por cobrar</div></div>
    </div>
    <div class="grid g3">
      <div class="card span2"><div class="card-head"><h3>Hoy</h3><a href="#/agenda" class="small">Ver agenda</a></div>
        ${today.length ? `<div class="list">${today.map(apptRow).join('')}</div>` : `<div class="empty"><div class="ico">☕</div>No hay sesiones agendadas para hoy.</div>`}
      </div>
      <div class="card"><div class="card-head"><h3>Pendientes</h3><span class="pill">${al.length}</span></div>
        ${al.length ? `<div class="alerts">${al.slice(0, 7).map((x) => `<div class="alert ${x.lv} li click" data-act="${x.act}" style="margin:0;border-bottom:0"><span class="ico">${x.lv === 'bad' ? '!' : x.lv === 'warn' ? '•' : 'i'}</span><div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div></div>`).join('')}</div>` : `<div class="empty"><div class="ico">✓</div>Todo al día.</div>`}
      </div>
      <div class="card span2"><div class="card-head"><h3>Sesiones por semana</h3><span class="tiny muted">confirmadas y atendidas</span></div>${barChart(weeks)}</div>
      <div class="card"><div class="card-head"><h3>Próximas citas</h3></div>${next.length ? `<div class="list">${next.map((a) => { const p = pat(a.patientId); return `<div class="li click" data-act="appt:${a.id}">${avatar(p?.name)}<div class="grow"><div class="t">${esc(p?.name)}</div><div class="s">${fmtDate(a.start, { weekday: true })} · ${hm(new Date(a.start))}</div></div>${a.status === 'solicitada' ? statusPill(a.status) : ''}</div>`; }).join('')}</div>` : '<div class="empty">Sin citas próximas.</div>'}</div>
    </div>`);
  bindCommon();
}
function apptRow(a) {
  const p = pat(a.patientId); const s = svc(a.serviceId);
  return `<div class="li click" data-act="appt:${a.id}"><div class="time-chip">${hm(new Date(a.start))}</div>${avatar(p?.name)}<div class="grow"><div class="t">${esc(p?.name || 'Paciente')} ${p ? riskPill(p.risk).replace('Riesgo ', '') .replace('Sin evaluar', 'Sin evaluar') : ''}</div><div class="s">${esc(s.name)} · ${a.minutes} min · ${a.modality === 'online' ? 'En línea' : 'Presencial'}</div></div>${statusPill(a.status)}</div>`;
}
function bindCommon() {
  $$('[data-act]').forEach((el) => el.onclick = (e) => {
    if (e.target.closest('button,a')) { if (!e.target.closest('[data-act]') || e.target.closest('[data-act]') !== el) return; }
    const [k, id, tab] = el.dataset.act.split(':');
    if (k === 'appt') apptDetail(id);
    if (k === 'p') { state.tab = tab || 'resumen'; location.hash = `#/paciente/${id}`; }
  });
  $$('[data-newa]').forEach((b) => b.onclick = () => apptEditor({}));
  $$('[data-newp]').forEach((b) => b.onclick = () => patientEditor());
}

// ---------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------
const HSTART = 7, HEND = 21, PX = 56;
function viewAgenda() {
  const D = db();
  const days = state.view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(state.week, i)) : [new Date(state.day)];
  const first = days[0], last = days[days.length - 1];
  const title = state.view === 'week' ? `${first.getDate()} ${first.getMonth() !== last.getMonth() ? MESES[first.getMonth()] + ' ' : ''}– ${last.getDate()} de ${MESES[last.getMonth()]} ${last.getFullYear()}` : fmtDate(days[0], { weekday: true, year: true });
  const pend = D.appointments.filter((a) => a.status === 'solicitada').sort((a, b) => a.start.localeCompare(b.start));
  const now = new Date();
  const col = (d) => {
    const ds = ymd(d); const block = (D.availability.blocks || []).find((b) => b.date === ds);
    const ranges = block ? [] : (D.availability.weekly[d.getDay()] || []);
    const open = ranges.map(([f, t]) => { const [fh, fm] = f.split(':').map(Number), [th, tm] = t.split(':').map(Number); return `<div class="open" style="top:${(fh + fm / 60 - HSTART) * PX}px;height:${(th + tm / 60 - fh - fm / 60) * PX}px"></div>`; }).join('');
    const slots = Array.from({ length: (HEND - HSTART) * 2 }, (_, i) => `<div class="slot" data-slot="${ds}T${pad(HSTART + Math.floor(i / 2))}:${i % 2 ? '30' : '00'}" style="top:${i * PX / 2}px" title="Agendar"></div>`).join('');
    const evs = D.appointments.filter((a) => sameDay(a.start, d)).map((a) => { const s = new Date(a.start); const top = (s.getHours() + s.getMinutes() / 60 - HSTART) * PX; const p = pat(a.patientId); return `<div class="ev st-${a.status}" data-ev="${a.id}" style="top:${top}px;height:${Math.max(26, (a.minutes / 60) * PX - 3)}px"><b>${esc(p?.name || '—')}</b><span>${hm(s)} · ${esc(svc(a.serviceId).name)}${a.modality === 'online' ? ' · en línea' : ''}</span></div>`; }).join('');
    const nl = sameDay(d, now) && now.getHours() >= HSTART && now.getHours() < HEND ? `<div class="now-line" style="top:${(now.getHours() + now.getMinutes() / 60 - HSTART) * PX}px"></div>` : '';
    return `<div class="col" style="height:${(HEND - HSTART) * PX}px">${open}${slots}${evs}${nl}</div>`;
  };
  shell('agenda', `
    <div class="head"><div><h1>Agenda</h1><p>${esc(title)}</p></div>
      <div class="row"><div class="seg" role="tablist"><button data-v="day" class="${state.view === 'day' ? 'on' : ''}">Día</button><button data-v="week" class="${state.view === 'week' ? 'on' : ''}">Semana</button></div>
      <button class="btn sm" data-nav="-1" aria-label="Anterior">${icon('left')}</button><button class="btn sm" data-nav="0">Hoy</button><button class="btn sm" data-nav="1" aria-label="Siguiente">${icon('right')}</button>
      <button class="btn" data-block>Bloquear día</button><button class="btn primary" data-newa>${icon('plus')} Nueva cita</button></div></div>
    ${pend.length ? `<div class="card" style="margin-bottom:16px"><div class="card-head"><h3>${icon('inbox')} Solicitudes por confirmar</h3><span class="pill warn">${pend.length}</span></div><div class="list">${pend.map((a) => { const p = pat(a.patientId); return `<div class="li">${avatar(p?.name)}<div class="grow"><div class="t">${esc(p?.name)}</div><div class="s">${esc(svc(a.serviceId).name)} · ${fmtDateTime(a.start)} · ${a.modality === 'online' ? 'En línea' : 'Presencial'}${a.source === 'web' ? ' · desde la web' : ''}</div></div><button class="btn sm" data-open="${a.id}">Ver</button><button class="btn sm primary" data-confirm="${a.id}">${icon('check')} Confirmar</button></div>`; }).join('')}</div></div>` : ''}
    <div class="legend" style="margin-bottom:10px">${Object.entries(STATUS).map(([k, l]) => `<span class="st-${k}"><span class="dot" style="background:var(--c)"></span>${l}</span>`).join('')}<span><span class="dot" style="background:color-mix(in srgb, var(--brand) 25%, transparent)"></span>Horario de atención</span></div>
    <div class="cal-scroll"><div class="cal" style="--days:${days.length}">
      <div class="ch" style="border-left:0"></div>
      ${days.map((d) => { const bl = (D.availability.blocks || []).find((b) => b.date === ymd(d)); return `<div class="ch ${sameDay(d, now) ? 'today' : ''} ${bl ? 'blocked' : ''}" title="${bl ? esc(bl.reason) : ''}">${DIA_C[d.getDay()]}<b>${d.getDate()}</b>${bl ? `<div class="tiny" style="color:var(--rose)">${esc(bl.reason).slice(0, 18)}</div>` : ''}</div>`; }).join('')}
      <div class="hours">${Array.from({ length: HEND - HSTART }, (_, i) => `<div class="hr">${HSTART + i}:00</div>`).join('')}</div>
      ${days.map(col).join('')}
    </div></div>`);
  bindCommon();
  $$('[data-v]').forEach((b) => b.onclick = () => { state.view = b.dataset.v; if (state.view === 'day' && !days.some((d) => sameDay(d, new Date()))) state.day = days[0]; viewAgenda(); });
  $$('[data-nav]').forEach((b) => b.onclick = () => { const n = +b.dataset.nav; if (n === 0) { state.week = startOfWeek(new Date()); state.day = new Date(); } else if (state.view === 'week') state.week = addDays(state.week, n * 7); else state.day = addDays(state.day, n); viewAgenda(); });
  $$('[data-ev]').forEach((e) => e.onclick = (ev) => { ev.stopPropagation(); apptDetail(e.dataset.ev); });
  $$('[data-slot]').forEach((s) => s.onclick = () => apptEditor({ start: new Date(s.dataset.slot).toISOString() }));
  $$('[data-open]').forEach((b) => b.onclick = () => apptDetail(b.dataset.open));
  $$('[data-confirm]').forEach((b) => b.onclick = () => setStatus(b.dataset.confirm, 'confirmada'));
  $('[data-block]').onclick = blockDay;
}
function blockDay() {
  const D = db();
  modal({ title: 'Bloquear un día', body: `<div class="form-grid"><label class="f">Fecha<input type="date" name="date" required value="${ymd(new Date())}"></label><label class="f">Motivo<input type="text" name="reason" placeholder="Vacaciones, congreso…"></label></div>
    ${(D.availability.blocks || []).length ? `<h3 style="margin:18px 0 8px">Días bloqueados</h3><div class="list">${D.availability.blocks.sort((a, b) => a.date.localeCompare(b.date)).map((b, i) => `<div class="li"><div class="grow"><div class="t">${fmtDate(parseYmd(b.date), { weekday: true })}</div><div class="s">${esc(b.reason || '')}</div></div><button class="btn sm" data-unblock="${b.date}">Quitar</button></div>`).join('')}</div>` : ''}`,
    foot: '<button class="btn" data-close>Cerrar</button><button class="btn primary" data-save>Bloquear</button>',
    onMount: (el, close) => {
      el.querySelector('[data-save]').onclick = async () => { const d = formData(el); if (!d.date) return; D.availability.blocks.push({ date: d.date, reason: d.reason }); await Store.commit('agenda.bloqueo', 'agenda', d.date, `Día bloqueado: ${d.date} ${d.reason ? '(' + d.reason + ')' : ''}`); close(); toast('Día bloqueado'); route(); };
      $$('[data-unblock]', el).forEach((b) => b.onclick = async () => { D.availability.blocks = D.availability.blocks.filter((x) => x.date !== b.dataset.unblock); await Store.commit('agenda.desbloqueo', 'agenda', b.dataset.unblock, `Día desbloqueado: ${b.dataset.unblock}`); close(); route(); });
    } });
}

function apptEditor(a = {}) {
  const D = db(); const isNew = !a.id;
  const start = a.start ? new Date(a.start) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d; })();
  const pts = D.patients.filter((p) => p.status !== 'alta' || p.id === a.patientId).sort((x, y) => x.name.localeCompare(y.name));
  modal({
    title: isNew ? 'Nueva cita' : 'Reprogramar cita',
    body: `<div class="form-grid">
      <label class="f full">Paciente<select name="patientId" required><option value="">Elige…</option>${pts.map((p) => `<option value="${p.id}" ${p.id === a.patientId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}<option value="__new">+ Nuevo paciente…</option></select></label>
      <label class="f full">Servicio<select name="serviceId">${D.services.map((s) => `<option value="${s.id}" ${s.id === a.serviceId ? 'selected' : ''}>${esc(s.name)} · ${s.minutes} min · ${$m(s.price)}</option>`).join('')}</select></label>
      <label class="f">Fecha<input type="date" name="date" value="${ymd(start)}" required></label>
      <label class="f">Hora<input type="time" name="time" value="${hm(start)}" step="900" required></label>
      <label class="f">Modalidad<select name="modality"><option value="presencial">Presencial</option><option value="online" ${a.modality === 'online' ? 'selected' : ''}>En línea</option></select></label>
      <label class="f">Repetir<select name="repeat" ${isNew ? '' : 'disabled'}><option value="0">No repetir</option><option value="7">Cada semana (8 citas)</option><option value="14">Cada dos semanas (6 citas)</option></select></label>
      <label class="f full">Nota interna (sin datos clínicos)<input type="text" name="note" value="${esc(a.note || '')}" placeholder="Ej.: primera vez en línea"></label>
      <p class="full small" id="conflict" role="alert"></p></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>${isNew ? 'Agendar' : 'Guardar cambios'}</button>`,
    onMount: (el, close) => {
      const sel = el.querySelector('[name=patientId]');
      sel.onchange = () => { if (sel.value === '__new') { close(); patientEditor(null, (p) => apptEditor({ ...a, patientId: p.id, start: start.toISOString() })); } };
      const check = () => {
        const d = formData(el); if (!d.date || !d.time) return;
        const s = new Date(`${d.date}T${d.time}`); const m = svc(d.serviceId).minutes;
        const clash = D.appointments.filter((x) => x.id !== a.id && ['confirmada', 'solicitada'].includes(x.status)).find((x) => { const xs = new Date(x.start).getTime(), xe = xs + x.minutes * 60000; return s.getTime() < xe && s.getTime() + m * 60000 > xs; });
        const blocked = (D.availability.blocks || []).find((b) => b.date === d.date);
        const msg = clash ? `⚠ Se cruza con ${pat(clash.patientId)?.name} a las ${hm(new Date(clash.start))}.` : blocked ? `⚠ Ese día está bloqueado (${blocked.reason}).` : '';
        const c = el.querySelector('#conflict'); c.textContent = msg; c.style.color = 'var(--warn)';
      };
      el.addEventListener('input', check); check();
      el.querySelector('[data-save]').onclick = async () => {
        const d = formData(el); if (!d.patientId || d.patientId === '__new') return toast('Elige un paciente');
        const s = svc(d.serviceId); const st = new Date(`${d.date}T${d.time}`);
        if (isNew) {
          const n = +d.repeat ? (+d.repeat === 7 ? 8 : 6) : 1;
          for (let i = 0; i < n; i++) {
            const x = { id: uid('cita'), patientId: d.patientId, serviceId: s.id, start: addDays(st, i * (+d.repeat || 0)).toISOString(), minutes: s.minutes, modality: d.modality, status: 'confirmada', price: s.price, paid: false, source: 'panel', note: d.note, createdAt: new Date().toISOString(), history: [{ at: new Date().toISOString(), status: 'confirmada', by: D.profile.short }] };
            D.appointments.push(x);
            await Store.log('cita.creacion', 'cita', x.id, `Cita agendada: ${pat(d.patientId).name}, ${s.name}, ${fmtDateTime(x.start)}`);
          }
          await Store.save(); toast(n > 1 ? `${n} citas agendadas` : 'Cita agendada');
        } else {
          const old = a.start; Object.assign(a, { patientId: d.patientId, serviceId: s.id, start: st.toISOString(), minutes: s.minutes, modality: d.modality, note: d.note });
          a.history.push({ at: new Date().toISOString(), status: a.status, by: D.profile.short, note: `Reprogramada desde ${fmtDateTime(old)}` });
          await Store.commit('cita.reprogramacion', 'cita', a.id, `Cita reprogramada de ${fmtDateTime(old)} a ${fmtDateTime(a.start)}`); toast('Cita reprogramada');
        }
        close(); route();
      };
    },
  });
}

function reminderText(a) {
  const p = pat(a.patientId); const P = db().profile;
  return `Hola ${p.name.split(' ')[0]}, te recuerdo tu sesión de ${svc(a.serviceId).name.toLowerCase()} el ${fmtDate(a.start, { weekday: true })} a las ${hm(new Date(a.start))} (${a.modality === 'online' ? 'en línea' + (P.meetUrl ? ': ' + P.meetUrl : '') : 'presencial'}). Si necesitas reprogramar, avísame con ${db().policies.cancelHours} horas de anticipación. ${P.short}`;
}
function apptDetail(id) {
  const D = db(); const a = D.appointments.find((x) => x.id === id); if (!a) return;
  const p = pat(a.patientId); const s = svc(a.serviceId); const note = D.notes.find((n) => n.apptId === a.id);
  const past = new Date(a.start) < new Date();
  modal({
    title: 'Detalle de la cita',
    body: `<div class="row" style="margin-bottom:14px">${avatar(p?.name, 'lg')}<div><h2>${esc(p?.name)}</h2><div class="row" style="margin-top:4px">${statusPill(a.status)}${riskPill(p?.risk)}${a.source === 'web' ? '<span class="pill info">Reserva web</span>' : ''}</div></div></div>
      <dl class="kv"><dt>Fecha</dt><dd>${fmtDate(a.start, { weekday: true, year: true })}, ${hm(new Date(a.start))}–${hm(addMin(a.start, a.minutes))}</dd><dt>Servicio</dt><dd>${esc(s.name)} · ${a.minutes} min</dd><dt>Modalidad</dt><dd>${a.modality === 'online' ? 'En línea' : 'Presencial'}</dd><dt>Valor</dt><dd>${$m(a.price)} · ${a.paid ? `<span class="pill ok">Pagado${a.payMethod ? ' · ' + esc(a.payMethod) : ''}</span>` : '<span class="pill warn">Pendiente</span>'}</dd>${a.note ? `<dt>Nota interna</dt><dd>${esc(a.note)}</dd>` : ''}<dt>Contacto</dt><dd>${esc(p?.phone || '—')} · ${esc(p?.email || '—')}</dd></dl>
      <details style="margin-top:14px"><summary class="small muted">Historial de la cita (${a.history.length})</summary><div class="list small">${a.history.map((h) => `<div class="li"><div class="grow">${STATUS[h.status] || h.status}${h.note ? ' · ' + esc(h.note) : ''}</div><span class="muted">${fmtDateTime(h.at)} · ${esc(h.by)}</span></div>`).join('')}</div></details>`,
    foot: `
      ${a.status === 'solicitada' ? '<button class="btn primary" data-s="confirmada">Confirmar</button>' : ''}
      ${['confirmada', 'solicitada'].includes(a.status) && past ? '<button class="btn primary" data-s="atendida">Atendida</button><button class="btn" data-s="no_asistio">No asistió</button>' : ''}
      ${['confirmada', 'solicitada'].includes(a.status) ? '<button class="btn" data-resch>Reprogramar</button><button class="btn danger" data-s="cancelada">Cancelar</button>' : ''}
      ${['confirmada', 'solicitada'].includes(a.status) && !past ? `<a class="btn" target="_blank" rel="noopener" href="${waLink(p?.phone, reminderText(a))}">${icon('wa')} Recordatorio</a><button class="btn" data-ics>${icon('cal')} .ics</button>` : ''}
      ${a.status === 'atendida' && !a.paid ? '<button class="btn" data-pay>Registrar pago</button>' : ''}
      ${a.status === 'atendida' ? `<button class="btn ${note ? '' : 'primary'}" data-note>${icon('note')} ${note ? 'Ver nota' : 'Escribir nota'}</button>` : ''}
      <button class="btn ghost" data-ficha>Ficha</button>`,
    onMount: (el, close) => {
      $$('[data-s]', el).forEach((b) => b.onclick = async () => {
        const st = b.dataset.s;
        if (st === 'cancelada' && !(await confirmDialog('Cancelar la cita', `¿Cancelar la cita de ${esc(p?.name)} del ${fmtDateTime(a.start)}?`, 'Cancelar cita', true))) return;
        close(); await setStatus(a.id, st);
        if (st === 'atendida') apptDetail(a.id);
      });
      el.querySelector('[data-resch]') && (el.querySelector('[data-resch]').onclick = () => { close(); apptEditor(a); });
      el.querySelector('[data-ics]') && (el.querySelector('[data-ics]').onclick = () => download(`sesion-${ymd(new Date(a.start))}.ics`, icsFor({ title: `Sesión con ${D.profile.short}`, start: a.start, minutes: a.minutes, location: a.modality === 'online' ? (D.profile.meetUrl || 'En línea') : D.profile.address }), 'text/calendar'));
      el.querySelector('[data-pay]') && (el.querySelector('[data-pay]').onclick = () => { close(); payDialog(a); });
      el.querySelector('[data-note]') && (el.querySelector('[data-note]').onclick = () => { close(); if (note) { state.tab = 'sesiones'; location.hash = `#/paciente/${p.id}`; } else noteEditor(p.id, a.id); });
      el.querySelector('[data-ficha]').onclick = () => { close(); state.tab = 'resumen'; location.hash = `#/paciente/${p.id}`; };
    },
  });
}
async function setStatus(id, st) {
  const D = db(); const a = D.appointments.find((x) => x.id === id); const p = pat(a.patientId);
  a.status = st; a.history.push({ at: new Date().toISOString(), status: st, by: D.profile.short });
  if (st === 'atendida' && p.status === 'nuevo') p.status = 'activo';
  await Store.commit('cita.' + st, 'cita', a.id, `${STATUS[st]}: ${p.name}, ${fmtDateTime(a.start)}`);
  toast(STATUS[st]); route();
}
function payDialog(a) {
  modal({ title: 'Registrar pago', body: `<div class="form-grid"><label class="f">Valor<input type="number" name="price" step="0.01" value="${a.price}"></label><label class="f">Medio<select name="method"><option>Transferencia</option><option>Efectivo</option><option>Tarjeta</option><option>DeUna / billetera</option><option>Exonerado</option></select></label><label class="f full">Factura o referencia<input type="text" name="ref" placeholder="Opcional"></label></div>`,
    foot: '<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>',
    onMount: (el, close) => { el.querySelector('[data-save]').onclick = async () => { const d = formData(el); a.price = +d.price; a.paid = true; a.payMethod = d.method; a.payRef = d.ref; a.paidAt = new Date().toISOString(); await Store.commit('cobro.registro', 'cita', a.id, `Pago registrado: ${$m(a.price)} (${d.method}) · ${pat(a.patientId).name}`); close(); toast('Pago registrado'); route(); }; } });
}

// ---------------------------------------------------------------------
// Pacientes
// ---------------------------------------------------------------------
function viewPatients() {
  const D = db();
  const q = state.q.toLowerCase();
  const list = D.patients.filter((p) => (state.pf === 'todos' || p.status === state.pf) && (!q || [p.name, p.email, p.docId, p.code, p.phone, ...(p.tags || [])].join(' ').toLowerCase().includes(q)));
  const last = (p) => D.appointments.filter((a) => a.patientId === p.id && a.status === 'atendida').sort((a, b) => b.start.localeCompare(a.start))[0];
  const next = (p) => D.appointments.filter((a) => a.patientId === p.id && ['confirmada', 'solicitada'].includes(a.status) && new Date(a.start) > new Date()).sort((a, b) => a.start.localeCompare(b.start))[0];
  shell('pacientes', `
    <div class="head"><div><h1>Pacientes</h1><p>${D.patients.length} historias clínicas</p></div><button class="btn primary" data-newp>${icon('plus')} Nuevo paciente</button></div>
    <div class="row" style="margin-bottom:14px"><div class="search" style="flex:1;min-width:220px">${icon('search')}<input type="search" id="q" placeholder="Buscar por nombre, cédula, correo o etiqueta" value="${esc(state.q)}" aria-label="Buscar"></div>
      <div class="seg">${[['todos', 'Todos'], ['activo', 'En proceso'], ['nuevo', 'Nuevos'], ['lista_espera', 'Espera'], ['alta', 'Alta']].map(([k, l]) => `<button data-pf="${k}" class="${state.pf === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="card" style="padding:6px 10px"><div class="table-wrap"><table class="t"><thead><tr><th>Paciente</th><th>Estado</th><th>Riesgo</th><th>Última sesión</th><th>Próxima cita</th><th>Etiquetas</th></tr></thead><tbody>
      ${list.map((p) => { const l = last(p), n = next(p); return `<tr class="click" data-act="p:${p.id}"><td><div class="row" style="flex-wrap:nowrap">${avatar(p.name)}<div><div style="font-weight:500">${esc(p.name)}</div><div class="tiny muted">${esc(p.code)}${p.birth ? ' · ' + age(p.birth) + ' años' : ''}</div></div></div></td><td>${pStatusPill(p.status)}</td><td>${riskPill(p.risk)}</td><td class="small">${l ? relDays(l.start) : '—'}</td><td class="small">${n ? fmtShort(n.start) + ' · ' + hm(new Date(n.start)) : '—'}</td><td>${(p.tags || []).map((t) => `<span class="pill">${esc(t)}</span>`).join(' ')}</td></tr>`; }).join('') || `<tr><td colspan="6"><div class="empty">No hay pacientes con ese filtro.</div></td></tr>`}
    </tbody></table></div></div>`);
  bindCommon();
  const qi = $('#q'); qi.oninput = () => { state.q = qi.value; const pos = qi.selectionStart; viewPatients(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); };
  $$('[data-pf]').forEach((b) => b.onclick = () => { state.pf = b.dataset.pf; viewPatients(); });
}

function patientEditor(p = null, after) {
  const isNew = !p; p = p || newPatient();
  modal({
    title: isNew ? 'Nuevo paciente' : 'Editar datos', wide: true,
    body: `<div class="form-grid">
      <label class="f full">Nombre completo<input type="text" name="name" value="${esc(p.name)}" required></label>
      <label class="f">Cédula o documento<input type="text" name="docId" value="${esc(p.docId)}"></label>
      <label class="f">Fecha de nacimiento<input type="date" name="birth" value="${esc(p.birth)}"></label>
      <label class="f">Género<input type="text" name="gender" value="${esc(p.gender)}" placeholder="Como la persona se identifica"></label>
      <label class="f">Pronombres<input type="text" name="pronouns" value="${esc(p.pronouns)}" placeholder="ella, él, elle…"></label>
      <label class="f">Teléfono (con código de país)<input type="tel" name="phone" value="${esc(p.phone)}" placeholder="593…"></label>
      <label class="f">Correo<input type="email" name="email" value="${esc(p.email)}"></label>
      <label class="f">Ciudad<input type="text" name="city" value="${esc(p.city)}"></label>
      <label class="f">Ocupación<input type="text" name="occupation" value="${esc(p.occupation)}"></label>
      <label class="f">Estado civil<input type="text" name="civil" value="${esc(p.civil)}"></label>
      <label class="f">¿Cómo llegó?<input type="text" name="referral" value="${esc(p.referral)}" placeholder="Recomendación, web, médico…"></label>
      <label class="f">Contacto de emergencia<input type="text" name="ename" value="${esc(p.emergency?.name)}" placeholder="Nombre"></label>
      <label class="f">Parentesco y teléfono<input type="text" name="ephone" value="${esc([p.emergency?.rel, p.emergency?.phone].filter(Boolean).join(' · '))}" placeholder="Madre · 593…"></label>
      <label class="f">Estado<select name="status">${Object.entries(PSTATUS).map(([k, [l]]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="f">Etiquetas<input type="text" name="tags" value="${esc((p.tags || []).join(', '))}" placeholder="Ansiedad, Duelo…"></label>
      <label class="f full">Motivo de consulta<textarea name="reason" rows="3">${esc(p.reason)}</textarea></label>
      ${p.age !== undefined || (p.birth && age(p.birth) < 18) ? '' : ''}
      <p class="full tiny muted">Si es menor de edad, registra el consentimiento de su representante legal en la pestaña Consentimientos.</p></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>${isNew ? 'Crear historia clínica' : 'Guardar'}</button>`,
    onMount: (el, close) => {
      el.querySelector('[data-save]').onclick = async () => {
        const d = formData(el); if (!d.name) return toast('El nombre es obligatorio');
        const [rel, ...ph] = (d.ephone || '').split('·').map((x) => x.trim());
        const before = clone(p);
        Object.assign(p, { name: d.name, docId: d.docId, birth: d.birth, gender: d.gender, pronouns: d.pronouns, phone: d.phone, email: d.email, city: d.city, occupation: d.occupation, civil: d.civil, referral: d.referral, status: d.status, reason: d.reason, tags: d.tags.split(',').map((t) => t.trim()).filter(Boolean), emergency: { name: d.ename, rel: ph.length ? rel : '', phone: ph.length ? ph.join(' ') : rel } });
        if (isNew) { db().patients.push(p); await Store.commit('paciente.alta', 'paciente', p.id, `Historia clínica creada: ${p.name} (${p.code})`); toast('Historia clínica creada'); }
        else { const ch = Object.keys(d).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(p[k])); await Store.commit('paciente.edicion', 'paciente', p.id, `Datos actualizados: ${ch.join(', ') || 'sin cambios'}`); toast('Datos guardados'); }
        close(); after ? after(p) : (location.hash = `#/paciente/${p.id}`, route());
      };
    },
  });
}

// ---------- Ficha ----------
const TABS = [['resumen', 'Resumen'], ['historia', 'Historia clínica'], ['sesiones', 'Sesiones'], ['escalas', 'Escalas'], ['seguridad', 'Plan de seguridad'], ['consentimientos', 'Consentimientos'], ['citas', 'Citas y pagos'], ['registro', 'Registro de accesos']];
async function viewPatient(id, tab) {
  const D = db(); const p = pat(id); if (!p) return viewPatients();
  if (tab) state.tab = tab;
  if (!state._seen || state._seen !== id) { state._seen = id; await Store.log('paciente.acceso', 'paciente', id, `Apertura de la historia clínica de ${p.name}`); Store.save(); }
  const t = state.tab;
  const body = { resumen: tabSummary, historia: tabHistory, sesiones: tabNotes, escalas: tabScales, seguridad: tabSafety, consentimientos: tabConsents, citas: tabAppts, registro: tabLog }[t] || tabSummary;
  shell('pacientes', `
    <a href="#/pacientes" class="small no-print">← Pacientes</a>
    <div class="head" style="margin-top:10px"><div class="pt-head">${avatar(p.name, 'lg')}<div><h1>${esc(p.name)}</h1><div class="meta">${pStatusPill(p.status)}${riskPill(p.risk)}<span class="pill">${esc(p.code)}</span>${p.birth ? `<span class="pill">${age(p.birth)} años</span>` : ''}${p.pronouns ? `<span class="pill">${esc(p.pronouns)}</span>` : ''}</div></div></div>
      <div class="row no-print"><button class="btn" data-edit>Editar datos</button><button class="btn" data-print>${icon('print')} Imprimir historia</button><button class="btn primary" data-newn>${icon('note')} Nueva nota</button></div></div>
    <nav class="tabs" role="tablist">${TABS.map(([k, l]) => `<a href="#/paciente/${id}/${k}" class="${t === k ? 'on' : ''}" role="tab">${l}</a>`).join('')}</nav>
    <div id="tab">${body(p)}</div>
    <div class="print-only" id="printarea"></div>`);
  bindCommon();
  $('[data-edit]').onclick = () => patientEditor(p);
  $('[data-newn]').onclick = () => noteEditor(p.id);
  $('[data-print]').onclick = () => printRecord(p);
  bindTab(p, t);
}
function tabSummary(p) {
  const D = db();
  const next = D.appointments.filter((a) => a.patientId === p.id && ['confirmada', 'solicitada'].includes(a.status) && new Date(a.start) > new Date()).sort((a, b) => a.start.localeCompare(b.start));
  const done = D.appointments.filter((a) => a.patientId === p.id && a.status === 'atendida').length;
  const tr = ['PHQ9', 'GAD7', 'WHO5'].map((k) => trajectory(k, D.assessments.filter((x) => x.patientId === p.id))).filter(Boolean);
  const lastN = D.notes.filter((n) => n.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date))[0];
  return `<div class="grid g3">
    <div class="card span2"><h3>Datos personales</h3><dl class="kv">
      <dt>Documento</dt><dd>${esc(p.docId || '—')}</dd><dt>Nacimiento</dt><dd>${p.birth ? fmtDate(parseYmd(p.birth), { year: true }) : '—'}</dd><dt>Género</dt><dd>${esc(p.gender || '—')}</dd>
      <dt>Contacto</dt><dd>${esc(p.phone || '—')} · ${esc(p.email || '—')}</dd><dt>Ciudad</dt><dd>${esc(p.city || '—')}</dd><dt>Ocupación</dt><dd>${esc(p.occupation || '—')}</dd>
      <dt>Emergencia</dt><dd>${esc([p.emergency?.name, p.emergency?.rel, p.emergency?.phone].filter(Boolean).join(' · ') || '—')}</dd><dt>Derivación</dt><dd>${esc(p.referral || '—')}</dd><dt>Desde</dt><dd>${fmtDate(p.createdAt, { year: true })} · ${done} ${done === 1 ? 'sesión atendida' : 'sesiones atendidas'}</dd></dl>
      <h3 style="margin-top:18px">Motivo de consulta</h3><p>${esc(p.reason || 'Sin registrar')}</p></div>
    <div class="card"><h3>Próximas citas</h3>${next.length ? `<div class="list">${next.slice(0, 4).map((a) => `<div class="li click" data-act="appt:${a.id}"><div class="grow"><div class="t">${fmtDate(a.start, { weekday: true })}</div><div class="s">${hm(new Date(a.start))} · ${esc(svc(a.serviceId).name)}</div></div>${statusPill(a.status)}</div>`).join('')}</div>` : '<p class="muted small">Sin citas agendadas.</p>'}<button class="btn sm" style="margin-top:10px" data-newa-p>${icon('plus')} Agendar</button>
      <h3 style="margin-top:18px">Riesgo</h3><div class="row">${riskPill(p.risk)}<select id="riskSel" class="btn sm" aria-label="Cambiar nivel de riesgo">${Object.entries(RISK).map(([k, [l]]) => `<option value="${k}" ${p.risk === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      ${p.risk === 'alto' || p.risk === 'moderado' ? `<p class="small" style="margin-top:8px">${p.safety ? `Plan de seguridad actualizado ${relDays(parseYmd(p.safety.updated))}.` : '<b style="color:var(--bad)">Sin plan de seguridad.</b>'}</p>` : ''}</div>
    <div class="card"><h3>Diagnósticos</h3>${(p.diagnoses || []).length ? `<div class="list">${p.diagnoses.map((d, i) => `<div class="li"><div class="grow"><div class="t">${esc(d.code)} · ${esc(d.label)}</div><div class="s">${esc(d.system)} · ${d.date ? fmtShort(parseYmd(d.date)) : ''}</div></div><button class="btn sm ghost" data-deldx="${i}" aria-label="Quitar">×</button></div>`).join('')}</div>` : '<p class="muted small">Sin diagnóstico registrado. Es opcional: puedes trabajar con una formulación clínica.</p>'}
      <form class="row" id="dxf" style="margin-top:10px"><select name="system" style="width:auto"><option>CIE-11</option><option>CIE-10</option><option>DSM-5-TR</option></select><input type="text" name="code" placeholder="Código" style="width:90px"><input type="text" name="label" placeholder="Descripción" style="flex:1;min-width:140px"><button class="btn sm">Añadir</button></form></div>
    <div class="card"><h3>Objetivos terapéuticos</h3><div class="list">${(p.goals || []).map((g, i) => `<label class="check li"><input type="checkbox" data-goal="${i}" ${g.done ? 'checked' : ''}> <span style="${g.done ? 'text-decoration:line-through;color:var(--ink-3)' : ''}">${esc(g.text)}</span></label>`).join('') || '<p class="muted small">Acuerda los objetivos con la persona en el encuadre.</p>'}</div>
      <form class="row" id="goalf" style="margin-top:10px"><input type="text" name="g" placeholder="Nuevo objetivo" style="flex:1"><button class="btn sm">Añadir</button></form></div>
    <div class="card"><h3>Evolución</h3>${tr.length ? tr.map((x) => `<div class="li"><div class="grow"><div class="t">${x.name}: ${x.last.score} <span class="muted small">/ ${x.max}</span></div><div class="s">${x.last.band} · ${x.n} ${x.n > 1 ? 'mediciones' : 'medición'}</div></div><span class="pill ${STATUS_LABEL[x.status][1]}">${STATUS_LABEL[x.status][0]}</span></div>`).join('') : '<p class="muted small">Sin escalas aplicadas.</p>'}
      ${lastN ? `<p class="small muted" style="margin-top:10px">Última nota: ${relDays(lastN.date)}${lastN.cgi_s ? ` · CGI-S ${lastN.cgi_s} (${CGI[lastN.cgi_s].toLowerCase()})` : ''}</p>` : ''}</div>
  </div>`;
}
function tabHistory(p) {
  const a = p.anamnesis || {};
  const F = [['motivo', 'Motivo de consulta y demanda', p.reason], ['actual', 'Historia de la problemática actual'], ['personal', 'Antecedentes personales (desarrollo, escolaridad, trabajo)'], ['familiar', 'Antecedentes familiares y genograma'], ['medicos', 'Antecedentes médicos, medicación y consumo de sustancias'], ['psico', 'Tratamientos psicológicos o psiquiátricos previos'], ['examen', 'Examen mental'], ['formulacion', 'Formulación clínica'], ['plan', 'Plan de tratamiento, enfoque y frecuencia'], ['red', 'Red de apoyo y factores protectores']];
  return `<form class="card" id="anaf"><div class="card-head"><h3>Anamnesis y formulación</h3><span class="tiny muted">${a._updated ? 'Actualizada ' + relDays(a._updated) : 'Sin completar'}</span></div>
    <div class="form-grid">${F.map(([k, l, def]) => `<label class="f full">${l}<textarea name="${k}" rows="3">${esc(a[k] ?? def ?? '')}</textarea></label>`).join('')}</div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary">Guardar anamnesis</button></div></form>`;
}
function noteHtml(n) {
  const fmt = NOTE_FORMATS[n.format] || NOTE_FORMATS.integ;
  return `<div class="tl ${n.signed ? '' : 'unsigned'}"><div class="card">
    <div class="card-head"><div><h3>${fmtDate(n.date, { weekday: true, year: true })}</h3><div class="row tiny muted" style="margin-top:3px">${esc(fmt.label)}${n.cgi_s ? ` · CGI-S ${n.cgi_s}: ${CGI[n.cgi_s]}` : ''}${n.risk && n.risk !== 'sin_riesgo' ? ` · <span class="pill ${n.risk === 'alto' ? 'bad' : 'warn'}">${RISK_LV[n.risk]}</span>` : ''}</div></div>
      <div class="row">${n.signed ? `<span class="pill ok">${icon('check')} Firmada</span>` : '<span class="pill warn">Borrador</span>'}</div></div>
    <div class="note-body">${fmt.fields.filter(([k]) => n.fields?.[k]).map(([k, l]) => `<div class="lbl">${esc(l.split(':')[0])}</div><p>${esc(n.fields[k]).replace(/\n/g, '<br>')}</p>`).join('')}
      ${(n.techniques || []).length ? `<div class="row" style="margin-top:8px">${n.techniques.map((t) => `<span class="pill brand">${esc(t)}</span>`).join('')}</div>` : ''}
      ${n.homework ? `<div class="lbl">Tareas</div><p>${esc(n.homework)}</p>` : ''}
      ${n.private ? `<details class="private"><summary>Notas de proceso (privadas, no se imprimen)</summary><p style="margin-top:6px">${esc(n.private).replace(/\n/g, '<br>')}</p></details>` : ''}
      ${(n.addenda || []).map((x) => `<div class="addendum"><b class="tiny">Adenda · ${fmtDateTime(x.date)}</b><br>${esc(x.text)}<div class="hash">sha256 ${x.hash?.slice(0, 24)}…</div></div>`).join('')}</div>
    <div class="row no-print" style="justify-content:space-between;margin-top:12px">
      <span class="hash">${n.signed && n.hash ? `Firmada ${fmtDateTime(n.signedAt)} · sha256 ${n.hash.slice(0, 24)}…` : ''}</span>
      <div class="row">${n.signed ? `<button class="btn sm" data-add="${n.id}">Añadir adenda</button><button class="btn sm ghost" data-verify="${n.id}">Verificar integridad</button>` : `<button class="btn sm" data-editn="${n.id}">Editar</button><button class="btn sm primary" data-sign="${n.id}">Firmar</button>`}</div></div>
  </div></div>`;
}
function tabNotes(p) {
  const notes = db().notes.filter((n) => n.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date));
  return `<div class="row" style="justify-content:space-between;margin-bottom:14px"><p class="muted small">Las notas firmadas no se pueden editar: cualquier corrección se agrega como adenda con fecha y hash, como exige una historia clínica íntegra.</p><button class="btn primary" data-newn2>${icon('plus')} Nueva nota</button></div>
    ${notes.length ? `<div class="timeline">${notes.map(noteHtml).join('')}</div>` : '<div class="card empty"><div class="ico">✎</div>Todavía no hay notas de sesión.</div>'}`;
}
function tabScales(p) {
  const list = db().assessments.filter((x) => x.patientId === p.id);
  const tr = Object.keys(SCALES).map((k) => [k, trajectory(k, list)]);
  return `<div class="row" style="justify-content:space-between;margin-bottom:14px"><p class="muted small" style="max-width:70ch">Medición basada en resultados: el cambio es <b>fiable</b> cuando supera el índice de cambio fiable (RCI) de cada escala, y hay <b>recuperación</b> cuando además cruza el punto de corte clínico.</p>
    <div class="row"><button class="btn" data-patientmode>${icon('heart')} Modo paciente</button><button class="btn primary" data-apply>${icon('plus')} Aplicar escala</button></div></div>
    <div class="grid g2">${tr.map(([k, x]) => { const S = SCALES[k]; return `<div class="card"><div class="card-head"><h3>${S.title}</h3>${x ? `<span class="pill ${STATUS_LABEL[x.status][1]}">${STATUS_LABEL[x.status][0]}</span>` : ''}</div>
      ${x ? `<div class="row" style="gap:18px;margin-bottom:8px"><div><div class="tiny muted">Inicial</div><b style="font-family:var(--serif);font-size:22px;font-weight:500">${x.first.score}</b> <span class="small muted">${x.first.band}</span></div><div><div class="tiny muted">Actual</div><b style="font-family:var(--serif);font-size:22px;font-weight:500">${x.last.score}</b> <span class="small muted">${x.last.band}</span></div><div><div class="tiny muted">Cambio</div><b style="font-family:var(--serif);font-size:22px;font-weight:500">${x.change > 0 ? '+' : ''}${x.change}</b> <span class="small muted">RCI ${S.rci}</span></div></div>${lineChart(x.history, { max: S.max, bands: S.bands })}
        ${x.history.some((h) => h.crisis) ? `<div class="alert bad" style="margin-top:10px"><span class="ico">!</span><div><b>Respuesta positiva en la pregunta 9</b><p>Hubo al menos una medición con pensamientos de muerte o autolesión. Revisa el plan de seguridad.</p></div></div>` : ''}` : '<p class="muted small">Sin aplicar.</p>'}
      <p class="tiny muted" style="margin-top:8px">${S.ref}</p></div>`; }).join('')}</div>`;
}
function tabSafety(p) {
  const s = p.safety || { warning: [], coping: [], people: [], pros: [], safe: '', reason: '' };
  const F = [['warning', '1. Señales de alerta', 'Pensamientos, emociones o situaciones que anuncian una crisis'], ['coping', '2. Estrategias propias de afrontamiento', 'Lo que puedo hacer solo/a para calmarme'], ['people', '3. Personas y lugares que me ayudan a distraerme', ''], ['pros', '4. Profesionales y líneas de ayuda', `Incluye: ${(CRISIS[db().country] || CRISIS.EC).map((c) => c.name).join(', ')}`]];
  return `<form class="card" id="safef"><div class="card-head"><h3>Plan de seguridad (modelo Stanley-Brown)</h3><span class="tiny muted">${p.safety ? 'Actualizado ' + relDays(parseYmd(p.safety.updated)) : 'Sin plan'}</span></div>
    <p class="small muted" style="margin-bottom:14px">Se construye junto con la persona, con sus propias palabras. Escribe un elemento por línea.</p>
    <div class="form-grid">${F.map(([k, l, h]) => `<label class="f">${l}<span class="hint">${h}</span><textarea name="${k}" rows="4">${esc((s[k] || []).join('\n'))}</textarea></label>`).join('')}
    <label class="f">5. Cómo hacer el entorno más seguro<textarea name="safe" rows="3">${esc(s.safe)}</textarea></label><label class="f">6. Mi razón para vivir<textarea name="reason" rows="3">${esc(s.reason)}</textarea></label></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button type="button" class="btn" data-printsafe>${icon('print')} Imprimir para la persona</button><button class="btn primary">Guardar plan</button></div></form>`;
}
function tabConsents(p) {
  const D = db(); const n = NORMATIVA[D.country];
  return `<div class="grid g2">${Object.entries(CONSENTS).map(([k, c]) => { const got = (p.consents || []).filter((x) => x.type === k).sort((a, b) => b.date.localeCompare(a.date))[0]; return `<div class="card"><div class="card-head"><h3>${c.title}</h3>${got ? `<span class="pill ok">${icon('check')} ${fmtShort(parseYmd(got.date.slice(0, 10)))}</span>` : '<span class="pill warn">Pendiente</span>'}</div>
    <p class="small" style="color:var(--ink-2)">${esc(c.text(D.profile, n, D.policies))}</p>
    <div class="row" style="justify-content:space-between;margin-top:12px"><span class="tiny muted">${got ? `v${got.version} · ${esc(got.method)}${got.by ? ' · ' + esc(got.by) : ''}` : `Versión ${c.version}`}</span><button class="btn sm ${got ? '' : 'primary'}" data-consent="${k}">${got ? 'Registrar de nuevo' : 'Registrar consentimiento'}</button></div></div>`; }).join('')}</div>
    <div class="card" style="margin-top:16px"><h3>Derechos del titular de los datos</h3><p class="small muted">${esc(n.datos)}</p><div class="row" style="margin-top:12px"><button class="btn sm" data-export>${icon('down')} Exportar sus datos (portabilidad)</button></div></div>`;
}
function tabAppts(p) {
  const list = db().appointments.filter((a) => a.patientId === p.id).sort((a, b) => b.start.localeCompare(a.start));
  const att = list.filter((a) => a.status === 'atendida'); const due = att.filter((a) => !a.paid).reduce((s, a) => s + a.price, 0);
  const ns = list.filter((a) => a.status === 'no_asistio').length;
  return `<div class="grid g3" style="margin-bottom:16px"><div class="card kpi"><div class="l">Sesiones atendidas</div><div class="v">${att.length}</div></div><div class="card kpi"><div class="l">Inasistencias</div><div class="v">${ns}</div></div><div class="card kpi"><div class="l">Saldo pendiente</div><div class="v" style="${due ? 'color:var(--warn)' : ''}">${$m(due)}</div></div></div>
    <div class="card" style="padding:6px 10px"><div class="table-wrap"><table class="t"><thead><tr><th>Fecha</th><th>Servicio</th><th>Estado</th><th>Valor</th><th>Pago</th></tr></thead><tbody>${list.map((a) => `<tr class="click" data-act="appt:${a.id}"><td>${fmtDate(a.start, { year: true })} · ${hm(new Date(a.start))}</td><td>${esc(svc(a.serviceId).name)}</td><td>${statusPill(a.status)}</td><td>${$m(a.price)}</td><td>${a.status === 'atendida' ? (a.paid ? `<span class="pill ok">${esc(a.payMethod || 'Pagado')}</span>` : '<span class="pill warn">Pendiente</span>') : '—'}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function tabLog(p) {
  const D = db(); const ids = new Set([p.id, ...D.appointments.filter((a) => a.patientId === p.id).map((a) => a.id), ...D.notes.filter((n) => n.patientId === p.id).map((n) => n.id), ...D.assessments.filter((a) => a.patientId === p.id).map((a) => a.id)]);
  const ev = D.audit.filter((e) => ids.has(e.entityId)).reverse();
  return `<div class="card"><div class="card-head"><h3>Quién hizo qué y cuándo</h3><span class="pill">${ev.length} eventos</span></div><p class="small muted" style="margin-bottom:10px">Incluye cada apertura de la historia clínica. Este registro no se puede editar.</p>${auditTable(ev)}</div>`;
}

function bindTab(p, t) {
  const D = db();
  $$('[data-newa-p]').forEach((b) => b.onclick = () => apptEditor({ patientId: p.id }));
  $$('[data-newn2]').forEach((b) => b.onclick = () => noteEditor(p.id));
  const rs = $('#riskSel'); rs && (rs.onchange = async () => { const old = p.risk; p.risk = rs.value; await Store.commit('paciente.riesgo', 'paciente', p.id, `Nivel de riesgo: ${RISK[old][0]} → ${RISK[p.risk][0]}`); toast('Riesgo actualizado'); route(); });
  const dx = $('#dxf'); dx && (dx.onsubmit = async (e) => { e.preventDefault(); const d = formData(dx); if (!d.label) return; p.diagnoses.push({ system: d.system, code: d.code, label: d.label, date: ymd(new Date()) }); await Store.commit('paciente.diagnostico', 'paciente', p.id, `Diagnóstico añadido: ${d.system} ${d.code} ${d.label}`); route(); });
  $$('[data-deldx]').forEach((b) => b.onclick = async () => { const [x] = p.diagnoses.splice(+b.dataset.deldx, 1); await Store.commit('paciente.diagnostico', 'paciente', p.id, `Diagnóstico retirado: ${x.code} ${x.label}`); route(); });
  const gf = $('#goalf'); gf && (gf.onsubmit = async (e) => { e.preventDefault(); const g = gf.g.value.trim(); if (!g) return; (p.goals = p.goals || []).push({ text: g, done: false }); await Store.commit('paciente.objetivo', 'paciente', p.id, `Objetivo añadido: ${g}`); route(); });
  $$('[data-goal]').forEach((c) => c.onchange = async () => { const g = p.goals[+c.dataset.goal]; g.done = c.checked; await Store.commit('paciente.objetivo', 'paciente', p.id, `Objetivo ${g.done ? 'logrado' : 'reabierto'}: ${g.text}`); route(); });
  const af = $('#anaf'); af && (af.onsubmit = async (e) => { e.preventDefault(); const d = formData(af); p.anamnesis = { ...d, _updated: new Date().toISOString() }; if (d.motivo) p.reason = d.motivo; await Store.commit('historia.anamnesis', 'paciente', p.id, 'Anamnesis actualizada'); toast('Anamnesis guardada'); });
  const sf = $('#safef'); sf && (sf.onsubmit = async (e) => { e.preventDefault(); const d = formData(sf); const L = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean); p.safety = { warning: L(d.warning), coping: L(d.coping), people: L(d.people), pros: L(d.pros), safe: d.safe, reason: d.reason, updated: ymd(new Date()) }; await Store.commit('historia.plan_seguridad', 'paciente', p.id, 'Plan de seguridad actualizado'); toast('Plan de seguridad guardado'); route(); });
  $$('[data-printsafe]').forEach((b) => b.onclick = () => printSafety(p));
  $$('[data-sign]').forEach((b) => b.onclick = () => signNote(b.dataset.sign));
  $$('[data-editn]').forEach((b) => b.onclick = () => { const n = D.notes.find((x) => x.id === b.dataset.editn); noteEditor(p.id, n.apptId, n); });
  $$('[data-add]').forEach((b) => b.onclick = () => addendum(b.dataset.add));
  $$('[data-verify]').forEach((b) => b.onclick = async () => { const n = D.notes.find((x) => x.id === b.dataset.verify); const h = await noteHash(n); toast(h === n.hash ? '✓ La nota no ha sido alterada desde su firma' : '⚠ La nota NO coincide con su firma'); });
  $$('[data-apply]').forEach((b) => b.onclick = () => applyScale(p));
  $$('[data-patientmode]').forEach((b) => b.onclick = () => patientMode(p));
  $$('[data-consent]').forEach((b) => b.onclick = () => consentDialog(p, b.dataset.consent));
  $$('[data-export]').forEach((b) => b.onclick = () => exportPatient(p));
}

// ---------- notas ----------
async function noteHash(n) { return sha256(JSON.stringify([n.id, n.patientId, n.date, n.format, n.fields, n.cgi_s, n.risk, n.techniques || [], n.homework || '', n.private || ''])); }
function noteEditor(pid, apptId = null, n = null) {
  const D = db(); const p = pat(pid); const isNew = !n;
  const appt = apptId ? D.appointments.find((a) => a.id === apptId) : null;
  n = n || { id: uid('nota'), patientId: pid, apptId, date: appt ? appt.start : new Date().toISOString(), format: 'integ', fields: {}, cgi_s: null, risk: 'sin_riesgo', private: '', techniques: [], homework: '', signed: false, addenda: [] };
  const render = (fmt) => NOTE_FORMATS[fmt].fields.map(([k, l]) => `<label class="f full">${l}<textarea name="f_${k}" rows="${k === 'desarrollo' || k === 's' || k === 'd' ? 5 : 3}">${esc(n.fields[k] || '')}</textarea></label>`).join('');
  modal({
    title: `Nota de sesión · ${p.name}`, wide: true,
    body: `<div class="form-grid">
      <label class="f">Fecha y hora<input type="datetime-local" name="date" value="${ymd(new Date(n.date))}T${hm(new Date(n.date))}"></label>
      <label class="f">Formato<select name="format">${Object.entries(NOTE_FORMATS).map(([k, f]) => `<option value="${k}" ${n.format === k ? 'selected' : ''}>${f.label}</option>`).join('')}</select></label>
      <div id="nfields" class="form-grid full" style="grid-template-columns:1fr">${render(n.format)}</div>
      <div class="f full">Técnicas utilizadas<div class="row" id="techs">${TECHNIQUES.map((t) => `<label class="pill" style="cursor:pointer"><input type="checkbox" value="${esc(t)}" ${(n.techniques || []).includes(t) ? 'checked' : ''} style="accent-color:var(--brand)"> ${esc(t)}</label>`).join('')}</div></div>
      <label class="f full">Tareas para la próxima sesión<input type="text" name="homework" value="${esc(n.homework || '')}"></label>
      <label class="f">Impresión clínica (CGI-S)<select name="cgi_s"><option value="">Sin valorar</option>${CGI.slice(1).map((l, i) => `<option value="${i + 1}" ${n.cgi_s == i + 1 ? 'selected' : ''}>${i + 1} · ${l}</option>`).join('')}</select></label>
      <label class="f">Valoración del riesgo<select name="risk">${Object.entries(RISK_LV).map(([k, l]) => `<option value="${k}" ${n.risk === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="f full">Notas de proceso (privadas)<span class="hint">Impresiones personales de la terapeuta. Se guardan cifradas, no se imprimen ni se exportan a la persona.</span><textarea name="private" rows="3">${esc(n.private || '')}</textarea></label></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn" data-save>Guardar borrador</button><button class="btn primary" data-savesign>Guardar y firmar</button>`,
    onMount: (el, close) => {
      el.querySelector('[name=format]').onchange = (e) => { const cur = formData(el); Object.keys(cur).filter((k) => k.startsWith('f_')).forEach((k) => { if (cur[k]) n.fields[k.slice(2)] = cur[k]; }); el.querySelector('#nfields').innerHTML = render(e.target.value); };
      const save = async (sign) => {
        const d = formData(el); const fields = {}; Object.keys(d).filter((k) => k.startsWith('f_')).forEach((k) => { if (d[k]) fields[k.slice(2)] = d[k]; });
        if (!Object.keys(fields).length) return toast('La nota está vacía');
        Object.assign(n, { date: new Date(d.date).toISOString(), format: d.format, fields, cgi_s: d.cgi_s ? +d.cgi_s : null, risk: d.risk, private: d.private, homework: d.homework, techniques: $$('#techs input:checked', el).map((c) => c.value) });
        if (isNew) D.notes.push(n);
        await Store.log(isNew ? 'nota.creacion' : 'nota.edicion', 'nota', n.id, `${isNew ? 'Nota creada' : 'Borrador editado'}: ${p.name}, ${fmtDate(n.date)}`);
        if (['moderado', 'alto'].includes(d.risk) && p.risk !== 'alto' && RISK[d.risk] && ['sin_evaluar', 'bajo', 'moderado'].includes(p.risk) && d.risk !== p.risk) { const old = p.risk; p.risk = d.risk; await Store.log('paciente.riesgo', 'paciente', p.id, `Riesgo actualizado desde la nota: ${RISK[old][0]} → ${RISK[d.risk][0]}`); }
        await Store.save(); close();
        if (sign) await signNote(n.id, true); else toast('Borrador guardado');
        state.tab = 'sesiones'; location.hash = `#/paciente/${pid}/sesiones`; route();
      };
      el.querySelector('[data-save]').onclick = () => save(false);
      el.querySelector('[data-savesign]').onclick = () => save(true);
    },
  });
}
async function signNote(id, silent) {
  const n = db().notes.find((x) => x.id === id);
  if (!silent && !(await confirmDialog('Firmar nota', 'Después de firmar, la nota ya no se puede editar. Las correcciones se agregan como adendas.', 'Firmar'))) return;
  n.signed = true; n.signedAt = new Date().toISOString(); n.hash = await noteHash(n);
  await Store.commit('nota.firma', 'nota', n.id, `Nota firmada (${fmtDate(n.date)}) · sha256 ${n.hash.slice(0, 16)}`);
  toast('Nota firmada'); route();
}
function addendum(id) {
  const n = db().notes.find((x) => x.id === id);
  modal({ title: 'Añadir adenda', body: '<p class="small muted" style="margin-bottom:10px">La adenda queda fechada y vinculada a la nota original, que no cambia.</p><label class="f">Texto<textarea name="t" rows="4"></textarea></label>', foot: '<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Añadir</button>',
    onMount: (el, close) => { el.querySelector('[data-save]').onclick = async () => { const t = el.querySelector('[name=t]').value.trim(); if (!t) return; const a = { date: new Date().toISOString(), text: t }; a.hash = await sha256(n.hash + a.date + t); n.addenda.push(a); await Store.commit('nota.adenda', 'nota', n.id, `Adenda añadida a la nota del ${fmtDate(n.date)}`); close(); toast('Adenda añadida'); route(); }; } });
}

// ---------- escalas ----------
function scaleForm(type) {
  const S = SCALES[type];
  return `<p class="small" style="margin-bottom:6px"><b>${esc(S.stem)}</b></p>${S.items.map((it, i) => `<fieldset class="q"><legend class="qt">${i + 1}. ${esc(it)}</legend><div class="opts">${S.opts.map((o, v) => `<label><input type="radio" name="q${i}" value="${type === 'WHO5' ? S.opts.length - 1 - v : v}" required><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`).join('')}`;
}
function collect(el, type) { const S = SCALES[type]; const ans = S.items.map((_, i) => { const c = el.querySelector(`[name=q${i}]:checked`); return c ? +c.value : null; }); return ans.includes(null) ? null : ans; }
async function storeScale(p, type, ans, source) {
  const a = { id: uid('esc'), patientId: p.id, type, date: ymd(new Date()), answers: ans, source };
  db().assessments.push(a); const r = score(type, ans);
  await Store.log('escala.aplicacion', 'escala', a.id, `${r.name} aplicado a ${p.name}: ${r.score} (${r.band})${r.crisis ? ' · pregunta 9 positiva' : ''}`);
  if (r.crisis && p.risk !== 'alto') { const old = p.risk; p.risk = p.risk === 'moderado' ? 'alto' : 'moderado'; await Store.log('paciente.riesgo', 'paciente', p.id, `Riesgo elevado automáticamente por PHQ-9 ítem 9: ${RISK[old][0]} → ${RISK[p.risk][0]}`); }
  await Store.save(); return r;
}
function applyScale(p) {
  let type = 'PHQ9';
  const m = modal({ title: `Aplicar escala · ${p.name}`, wide: true, body: `<div class="seg" style="margin-bottom:14px">${Object.keys(SCALES).map((k) => `<button data-t="${k}" class="${k === type ? 'on' : ''}">${SCALES[k].name}</button>`).join('')}</div><form id="sf">${scaleForm(type)}</form>`, foot: '<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar resultado</button>',
    onMount: (el, close) => {
      $$('[data-t]', el).forEach((b) => b.onclick = () => { type = b.dataset.t; $$('[data-t]', el).forEach((x) => x.classList.toggle('on', x === b)); el.querySelector('#sf').innerHTML = scaleForm(type); });
      el.querySelector('[data-save]').onclick = async () => { const ans = collect(el, type); if (!ans) return toast('Faltan respuestas'); const r = await storeScale(p, type, ans, 'Aplicada por la profesional'); close(); toast(`${r.name}: ${r.score} · ${r.band}`); if (r.crisis) crisisNotice(p); state.tab = 'escalas'; route(); };
    } });
}
function crisisNotice(p) {
  const lines = CRISIS[db().country] || CRISIS.EC;
  modal({ title: 'Pregunta 9 positiva', body: `<div class="alert bad"><span class="ico">!</span><div><b>${esc(p.name)} indicó pensamientos de muerte o de hacerse daño.</b><p>Evalúa en la sesión ideación, plan, intención, medios y factores protectores. Revisa o construye el plan de seguridad y activa la red de apoyo si es necesario.</p></div></div><p class="small" style="margin-top:12px">Líneas de ayuda: ${lines.map((l) => `<b>${esc(l.name)}</b>`).join(' · ')}</p>`,
    foot: `<button class="btn" data-close>Entendido</button><button class="btn primary" data-go>Abrir plan de seguridad</button>`, onMount: (el, close) => { el.querySelector('[data-go]').onclick = () => { close(); state.tab = 'seguridad'; location.hash = `#/paciente/${p.id}/seguridad`; }; } });
}
// Modo paciente: pantalla completa para que la persona responda en la tableta del consultorio
function patientMode(p) {
  const types = ['PHQ9', 'GAD7', 'WHO5'];
  let i = 0; const results = [];
  const lines = CRISIS[db().country] || CRISIS.EC;
  const wrap = document.createElement('div'); wrap.className = 'scrim'; wrap.style.background = 'var(--bg)'; wrap.style.alignItems = 'flex-start'; wrap.style.overflow = 'auto';
  document.body.appendChild(wrap);
  const step = () => {
    if (i >= types.length) {
      wrap.innerHTML = `<div style="max-width:560px;margin:10vh auto;text-align:center;padding:20px"><h1>Gracias, ${esc(p.name.split(' ')[0])}</h1><p class="muted" style="margin:12px 0 24px">Tus respuestas quedaron guardadas de forma confidencial. Las revisaremos juntas en la sesión.</p>
        ${results.some((r) => r.crisis) ? `<div class="crisis" style="text-align:left"><span>Si en algún momento piensas en hacerte daño, no estás sola ni solo: llama al <b>${lines.map((l) => esc(l.tel)).join(' o ')}</b>.</span></div>` : ''}
        <p class="small muted" style="margin-top:28px">Devuelve el dispositivo a la profesional.</p><button class="btn" style="margin-top:12px" data-exit>Volver (requiere PIN)</button></div>`;
      wrap.querySelector('[data-exit]').onclick = () => { wrap.remove(); Store.lock(); };
      return;
    }
    const t = types[i]; const S = SCALES[t];
    wrap.innerHTML = `<div style="max-width:720px;margin:0 auto;padding:28px 16px 60px;width:100%"><div class="steps">${types.map((x, j) => `<span class="${j < i ? 'done' : j === i ? 'on' : ''}">${SCALES[x].name}</span>`).join('')}</div><h1>${esc(S.title)}</h1><p class="muted" style="margin:6px 0 16px">No hay respuestas buenas ni malas. Responde pensando en las últimas dos semanas.</p><form id="pmf" class="card">${scaleForm(t)}</form><div class="row" style="justify-content:space-between;margin-top:16px"><button class="btn ghost" data-skip>Omitir</button><button class="btn primary lg" data-next>Continuar</button></div></div>`;
    wrap.scrollTop = 0;
    wrap.querySelector('[data-skip]').onclick = () => { i++; step(); };
    wrap.querySelector('[data-next]').onclick = async () => { const ans = collect(wrap, t); if (!ans) return toast('Responde todas las preguntas, por favor'); results.push(await storeScale(p, t, ans, 'Autoaplicada en modo paciente')); i++; step(); };
  };
  Store.log('escala.modo_paciente', 'paciente', p.id, `Modo paciente iniciado para ${p.name}`);
  step();
}

// ---------- consentimientos ----------
function consentDialog(p, k) {
  const D = db(); const c = CONSENTS[k];
  modal({ title: c.title, body: `<div class="summary small">${esc(c.text(D.profile, NORMATIVA[D.country], D.policies))}</div>
    <div class="form-grid" style="margin-top:14px"><label class="f">Cómo se otorgó<select name="method"><option>Firma en consulta</option><option>Firma digital (documento)</option><option>Aceptación verbal registrada</option><option>Casilla en la página de reservas</option></select></label>
    <label class="f">Otorgado por<input type="text" name="by" value="${esc(p.name)}" placeholder="Paciente o representante legal"></label></div>`,
    foot: '<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Registrar</button>',
    onMount: (el, close) => { el.querySelector('[data-save]').onclick = async () => { const d = formData(el); (p.consents = p.consents || []).push({ type: k, version: c.version, date: new Date().toISOString(), method: d.method, by: d.by }); await Store.commit('consentimiento.registro', 'paciente', p.id, `Consentimiento registrado: ${c.title} v${c.version} (${d.method})`); close(); toast('Consentimiento registrado'); route(); }; } });
}
async function exportPatient(p) {
  const D = db();
  const data = { exportado: new Date().toISOString(), profesional: D.profile.name, paciente: { ...p, anamnesis: p.anamnesis }, citas: D.appointments.filter((a) => a.patientId === p.id).map(({ history, ...a }) => a), notas: D.notes.filter((n) => n.patientId === p.id && n.signed).map(({ private: _, ...n }) => n), escalas: D.assessments.filter((a) => a.patientId === p.id).map((a) => ({ ...a, resultado: score(a.type, a.answers) })) };
  download(`datos-${p.code}.json`, JSON.stringify(data, null, 2));
  await Store.commit('paciente.exportacion', 'paciente', p.id, `Exportación de datos (portabilidad) de ${p.name}`);
}

// ---------- impresión ----------
function printRecord(p) {
  const D = db(); const area = $('#printarea');
  const notes = D.notes.filter((n) => n.patientId === p.id && n.signed).sort((a, b) => a.date.localeCompare(b.date));
  const tr = Object.keys(SCALES).map((k) => trajectory(k, D.assessments.filter((x) => x.patientId === p.id))).filter(Boolean);
  area.innerHTML = `<h1>Historia clínica psicológica</h1><p>${esc(D.profile.name)} · ${esc(D.profile.title)} · ${esc(D.profile.registro)}<br>Emitida el ${fmtDate(new Date(), { year: true })}. Documento confidencial.</p><hr style="margin:10px 0">
    <h2>${esc(p.name)} (${esc(p.code)})</h2><p>Documento: ${esc(p.docId || '—')} · Nacimiento: ${esc(p.birth || '—')} · Contacto: ${esc(p.phone)} ${esc(p.email)}</p>
    <h3 style="margin-top:12px">Motivo de consulta</h3><p>${esc(p.reason)}</p>
    ${Object.entries(p.anamnesis || {}).filter(([k, v]) => v && !k.startsWith('_') && k !== 'motivo').map(([k, v]) => `<h3 style="margin-top:10px">${esc(k)}</h3><p>${esc(v)}</p>`).join('')}
    <h3 style="margin-top:12px">Diagnósticos</h3><p>${(p.diagnoses || []).map((d) => `${esc(d.system)} ${esc(d.code)} ${esc(d.label)}`).join('; ') || '—'}</p>
    <h3 style="margin-top:12px">Escalas</h3><p>${tr.map((x) => `${x.name}: ${x.first.score} → ${x.last.score} (${STATUS_LABEL[x.status][0]})`).join(' · ') || '—'}</p>
    <h3 style="margin-top:12px">Evolución</h3>${notes.map((n) => `<div style="margin:8px 0;break-inside:avoid"><b>${fmtDateTime(n.date)}</b> · ${esc((NOTE_FORMATS[n.format] || NOTE_FORMATS.integ).label)}<br>${Object.values(n.fields).map(esc).join('<br>')}${(n.addenda || []).map((a) => `<br><i>Adenda ${fmtDateTime(a.date)}: ${esc(a.text)}</i>`).join('')}<br><span class="hash">sha256 ${n.hash}</span></div>`).join('')}
    <p style="margin-top:30px">_______________________________<br>${esc(D.profile.name)}</p>`;
  Store.commit('historia.impresion', 'paciente', p.id, `Impresión de la historia clínica de ${p.name}`);
  setTimeout(() => print(), 100);
}
function printSafety(p) {
  const s = p.safety; if (!s) return toast('Guarda primero el plan');
  const lines = CRISIS[db().country] || CRISIS.EC; const area = $('#printarea');
  const sec = (t, arr) => `<h3 style="margin-top:12px">${t}</h3><ul style="margin-left:18px">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  area.innerHTML = `<h1>Mi plan de seguridad</h1><p>${esc(p.name)} · ${fmtDate(new Date(), { year: true })}</p>${sec('Señales de alerta', s.warning)}${sec('Lo que puedo hacer para calmarme', s.coping)}${sec('Personas y lugares que me ayudan', s.people)}${sec('Profesionales y líneas de ayuda', [...s.pros, ...lines.map((l) => `${l.name}: ${l.tel}`)])}<h3 style="margin-top:12px">Entorno seguro</h3><p>${esc(s.safe)}</p><h3 style="margin-top:12px">Mi razón para vivir</h3><p>${esc(s.reason)}</p>`;
  setTimeout(() => print(), 100);
}

// ---------------------------------------------------------------------
// Cobros
// ---------------------------------------------------------------------
function viewFinance() {
  const D = db(); const now = new Date();
  const m = state.fm ?? 0; const from = new Date(now.getFullYear(), now.getMonth() + m, 1), to = new Date(now.getFullYear(), now.getMonth() + m + 1, 1);
  const list = D.appointments.filter((a) => a.status === 'atendida' || a.status === 'no_asistio').filter((a) => new Date(a.start) >= from && new Date(a.start) < to).sort((a, b) => b.start.localeCompare(a.start));
  const paid = list.filter((a) => a.paid).reduce((s, a) => s + a.price, 0); const due = list.filter((a) => a.status === 'atendida' && !a.paid).reduce((s, a) => s + a.price, 0);
  const bySvc = {}; list.filter((a) => a.status === 'atendida').forEach((a) => { const n = svc(a.serviceId).name; bySvc[n] = (bySvc[n] || 0) + 1; });
  const allDue = D.appointments.filter((a) => a.status === 'atendida' && !a.paid);
  shell('finanzas', `
    <div class="head"><div><h1>Cobros</h1><p>${MESES[from.getMonth()]} de ${from.getFullYear()}</p></div><div class="row"><button class="btn sm" data-fm="-1">${icon('left')}</button><button class="btn sm" data-fm="0">Este mes</button><button class="btn sm" data-fm="1">${icon('right')}</button><button class="btn" data-csv>${icon('down')} Exportar CSV</button></div></div>
    <div class="grid g4" style="margin-bottom:16px"><div class="card kpi"><div class="l">Cobrado</div><div class="v">${$m(paid)}</div></div><div class="card kpi"><div class="l">Por cobrar (mes)</div><div class="v" style="color:var(--warn)">${$m(due)}</div></div><div class="card kpi"><div class="l">Sesiones atendidas</div><div class="v">${list.filter((a) => a.status === 'atendida').length}</div></div><div class="card kpi"><div class="l">Saldo total pendiente</div><div class="v">${$m(allDue.reduce((s, a) => s + a.price, 0))}</div><div class="d muted">${allDue.length} sesiones</div></div></div>
    <div class="grid g3"><div class="card span2" style="padding:6px 10px"><div class="table-wrap"><table class="t"><thead><tr><th>Fecha</th><th>Paciente</th><th>Servicio</th><th>Valor</th><th>Estado</th><th></th></tr></thead><tbody>${list.map((a) => `<tr><td>${fmtShort(a.start)} · ${hm(new Date(a.start))}</td><td>${esc(pat(a.patientId)?.name)}</td><td class="small">${esc(svc(a.serviceId).name)}</td><td>${$m(a.price)}</td><td>${a.status === 'no_asistio' ? statusPill('no_asistio') : a.paid ? `<span class="pill ok">${esc(a.payMethod || 'Pagado')}</span>` : '<span class="pill warn">Pendiente</span>'}</td><td>${a.status === 'atendida' && !a.paid ? `<button class="btn sm" data-pay="${a.id}">Cobrar</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">Sin sesiones en este mes.</div></td></tr>'}</tbody></table></div></div>
      <div class="card"><h3>Por servicio</h3>${Object.entries(bySvc).map(([n, c]) => `<div style="margin-bottom:10px"><div class="row" style="justify-content:space-between"><span class="small">${esc(n)}</span><b class="small">${c}</b></div><div class="bar"><i style="width:${(c / Math.max(...Object.values(bySvc))) * 100}%"></i></div></div>`).join('') || '<p class="muted small">—</p>'}</div></div>`);
  $$('[data-fm]').forEach((b) => b.onclick = () => { state.fm = +b.dataset.fm === 0 ? 0 : (state.fm || 0) + +b.dataset.fm; viewFinance(); });
  $$('[data-pay]').forEach((b) => b.onclick = () => payDialog(D.appointments.find((a) => a.id === b.dataset.pay)));
  $('[data-csv]').onclick = async () => { const rows = [['fecha', 'paciente', 'servicio', 'valor', 'estado', 'pagado', 'medio', 'referencia'], ...list.map((a) => [a.start, pat(a.patientId)?.name, svc(a.serviceId).name, a.price, a.status, a.paid ? 'si' : 'no', a.payMethod || '', a.payRef || ''])]; download(`cobros-${ymd(from).slice(0, 7)}.csv`, '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv'); await Store.commit('cobro.exportacion', 'sistema', null, `Exportación de cobros ${ymd(from).slice(0, 7)}`); };
}

// ---------------------------------------------------------------------
// Trazabilidad
// ---------------------------------------------------------------------
const ACTION_L = { sesion: 'Sesión', paciente: 'Paciente', cita: 'Cita', nota: 'Nota', escala: 'Escala', historia: 'Historia', consentimiento: 'Consentimiento', cobro: 'Cobro', agenda: 'Agenda', sistema: 'Sistema', seguridad: 'Seguridad', ajustes: 'Ajustes' };
function auditTable(ev) {
  return `<div class="table-wrap"><table class="t"><thead><tr><th>#</th><th>Fecha</th><th>Tipo</th><th>Detalle</th><th>Quién</th><th>Hash</th></tr></thead><tbody>${ev.slice(0, 400).map((e) => `<tr><td class="tiny muted">${e.seq}</td><td class="small" style="white-space:nowrap">${fmtShort(e.ts)} · ${hm(new Date(e.ts))}</td><td><span class="pill">${ACTION_L[e.action.split('.')[0]] || e.action}</span></td><td class="small">${esc(e.detail)}</td><td class="small">${esc(e.actor)}</td><td class="hash">${e.hash.slice(0, 10)}…</td></tr>`).join('')}</tbody></table></div>`;
}
function viewAudit() {
  const D = db(); const f = state.af || 'todos';
  const ev = D.audit.filter((e) => f === 'todos' || e.action.startsWith(f)).slice().reverse();
  shell('trazabilidad', `
    <div class="head"><div><h1>Trazabilidad</h1><p>${D.audit.length} eventos registrados desde ${fmtDate(D.audit[0]?.ts || new Date(), { year: true })}</p></div><div class="row"><button class="btn" data-csv>${icon('down')} Exportar</button><button class="btn primary" data-verify>${icon('shield')} Verificar integridad</button></div></div>
    <div class="alert info" style="margin-bottom:16px"><span class="ico">i</span><div><b>Registro encadenado</b><p>Cada evento guarda el hash SHA-256 del anterior. Si alguien modificara o borrara un evento, la verificación lo detectaría y señalaría desde qué punto se rompió la cadena.</p></div></div>
    <div id="vres"></div>
    <div class="seg" style="margin-bottom:12px;flex-wrap:wrap">${[['todos', 'Todo'], ['sesion', 'Accesos'], ['paciente', 'Pacientes'], ['cita', 'Citas'], ['nota', 'Notas'], ['escala', 'Escalas'], ['consentimiento', 'Consentimientos'], ['cobro', 'Cobros']].map(([k, l]) => `<button data-af="${k}" class="${f === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="card" style="padding:6px 10px">${auditTable(ev)}</div>`);
  $$('[data-af]').forEach((b) => b.onclick = () => { state.af = b.dataset.af; viewAudit(); });
  $('[data-verify]').onclick = async () => { const r = await Store.verifyAudit(); $('#vres').innerHTML = r.ok ? `<div class="alert ok" style="margin-bottom:16px"><span class="ico">✓</span><div><b>Cadena íntegra</b><p>${r.total} eventos verificados. Huella actual: <span class="hash">${r.head}</span></p></div></div>` : `<div class="alert bad" style="margin-bottom:16px"><span class="ico">!</span><div><b>La cadena está rota en el evento ${r.at}</b><p>El registro fue alterado a partir de ese punto.</p></div></div>`; };
  $('[data-csv]').onclick = () => download(`trazabilidad-${ymd(new Date())}.csv`, '﻿' + [['seq', 'fecha', 'actor', 'accion', 'entidad', 'id', 'detalle', 'hash_previo', 'hash'], ...D.audit.map((e) => [e.seq, e.ts, e.actor, e.action, e.entity, e.entityId, e.detail, e.prev, e.hash])].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
}

// ---------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------
function viewSettings() {
  const D = db(); const P = D.profile; const A = D.availability; const n = NORMATIVA[D.country];
  const wd = [1, 2, 3, 4, 5, 6, 0];
  shell('ajustes', `
    <div class="head"><div><h1>Ajustes</h1><p>Perfil, servicios, horarios, seguridad y respaldo</p></div></div>
    <div class="grid g2">
      <form class="card" id="pf"><h3>Perfil profesional</h3><div class="form-grid">
        <label class="f">Nombre visible<input type="text" name="name" value="${esc(P.name)}"></label><label class="f">Título<input type="text" name="title" value="${esc(P.title)}"></label>
        <label class="f">Registro profesional<input type="text" name="registro" value="${esc(P.registro)}"></label><label class="f">Ciudad<input type="text" name="city" value="${esc(P.city)}"></label>
        <label class="f">WhatsApp (con código de país)<input type="tel" name="phone" value="${esc(P.phone)}"></label><label class="f">Correo<input type="email" name="email" value="${esc(P.email)}"></label>
        <label class="f full">Dirección del consultorio<input type="text" name="address" value="${esc(P.address)}"></label>
        <label class="f full">Enlace fijo de videollamada<input type="text" name="meetUrl" value="${esc(P.meetUrl)}" placeholder="https://meet.google.com/…"></label>
        <label class="f full">Frase de presentación<textarea name="tagline" rows="2">${esc(P.tagline)}</textarea></label>
        <label class="f full">Biografía<textarea name="bio" rows="4">${esc(P.bio)}</textarea></label>
        <label class="f full">Enfoques<input type="text" name="approach" value="${esc(P.approach)}"></label></div>
        <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary">Guardar perfil</button></div></form>
      <div class="grid" style="align-content:start">
        <form class="card" id="hf"><h3>Horario de atención</h3>${wd.map((d) => `<div class="row" style="margin-bottom:6px;flex-wrap:nowrap"><span style="width:84px" class="small">${DIAS[d]}</span><input type="text" name="d${d}" value="${esc((A.weekly[d] || []).map((r) => r.join('-')).join(', '))}" placeholder="09:00-13:00, 15:00-19:00"></div>`).join('')}
          <div class="form-grid" style="margin-top:10px"><label class="f">Intervalo entre inicios (min)<input type="number" name="step" value="${A.step}"></label><label class="f">Pausa entre sesiones (min)<input type="number" name="buffer" value="${A.buffer}"></label><label class="f">Anticipación mínima (h)<input type="number" name="minNoticeHours" value="${A.minNoticeHours}"></label><label class="f">Agenda abierta (días)<input type="number" name="horizonDays" value="${A.horizonDays}"></label></div>
          <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary">Guardar horario</button></div></form>
        <form class="card" id="polf"><h3>Políticas y seguridad</h3><div class="form-grid">
          <label class="f">País y normativa<select name="country"><option value="EC" ${D.country === 'EC' ? 'selected' : ''}>Ecuador</option><option value="CO" ${D.country === 'CO' ? 'selected' : ''}>Colombia</option></select></label>
          <label class="f">Cancelación sin costo (h)<input type="number" name="cancelHours" value="${D.policies.cancelHours}"></label>
          <label class="f">Bloqueo por inactividad (min)<input type="number" name="lockMinutes" value="${D.policies.lockMinutes}"></label>
          <label class="f">Conservación de historias (años)<input type="number" name="retentionYears" value="${D.policies.retentionYears}"></label></div>
          <p class="tiny muted" style="margin-top:10px">${esc(n.historia)}</p>
          <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary">Guardar</button></div></form>
      </div>
      <div class="card span2"><div class="card-head"><h3>Servicios</h3><button class="btn sm" data-addsvc>${icon('plus')} Servicio</button></div><div class="table-wrap"><table class="t"><thead><tr><th>Servicio</th><th>Duración</th><th>Valor</th><th>Modalidad</th><th>Visible en la web</th><th></th></tr></thead><tbody>${D.services.map((s) => `<tr><td><b style="font-weight:500">${esc(s.name)}</b><div class="tiny muted">${esc(s.desc)}</div></td><td>${s.minutes} min</td><td>${$m(s.price)}</td><td class="small">${s.modalities.join(', ')}</td><td>${s.active !== false ? '<span class="pill ok">Sí</span>' : '<span class="pill">No</span>'}</td><td><button class="btn sm" data-svc="${s.id}">Editar</button></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><h3>Seguridad y respaldo</h3><p class="small muted" style="margin-bottom:12px">La información se guarda cifrada con AES-256 en este navegador. Descarga respaldos con frecuencia: el archivo sigue cifrado y solo se abre con tu PIN.</p>
        <div class="row"><button class="btn" data-backup>${icon('down')} Descargar respaldo cifrado</button><button class="btn" data-pin>${icon('lock')} Cambiar PIN</button></div>
        <hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><div class="row"><button class="btn danger" data-reset>Borrar todo de este dispositivo</button></div></div>
      <div class="card"><h3>Marco normativo (${esc(n.pais)})</h3><p class="small" style="color:var(--ink-2)">${esc(n.datos)}</p><p class="small" style="color:var(--ink-2);margin-top:8px">${esc(n.historia)}</p><p class="tiny muted" style="margin-top:10px">Resumen orientativo. Conviene validarlo con un abogado antes de operar con pacientes reales.</p></div>
    </div>`);
  $('#pf').onsubmit = async (e) => { e.preventDefault(); Object.assign(P, formData($('#pf'))); await Store.commit('ajustes.perfil', 'sistema', null, 'Perfil profesional actualizado'); toast('Perfil guardado'); };
  $('#hf').onsubmit = async (e) => {
    e.preventDefault(); const d = formData($('#hf'));
    for (const w of wd) { const v = d['d' + w]; A.weekly[w] = v ? v.split(',').map((r) => r.trim().split('-').map((x) => x.trim())).filter((r) => r.length === 2 && /^\d{1,2}:\d{2}$/.test(r[0]) && /^\d{1,2}:\d{2}$/.test(r[1])).map((r) => r.map((x) => x.padStart(5, '0'))) : []; }
    ['step', 'buffer', 'minNoticeHours', 'horizonDays'].forEach((k) => A[k] = +d[k] || 0);
    await Store.commit('ajustes.horario', 'sistema', null, 'Horario de atención actualizado'); toast('Horario guardado'); viewSettings();
  };
  $('#polf').onsubmit = async (e) => { e.preventDefault(); const d = formData($('#polf')); D.country = d.country; ['cancelHours', 'lockMinutes', 'retentionYears'].forEach((k) => D.policies[k] = +d[k]); await Store.commit('ajustes.politicas', 'sistema', null, `Políticas actualizadas (${NORMATIVA[d.country].pais})`); toast('Guardado'); viewSettings(); };
  $$('[data-svc]').forEach((b) => b.onclick = () => svcEditor(D.services.find((s) => s.id === b.dataset.svc)));
  $('[data-addsvc]').onclick = () => svcEditor();
  $('[data-backup]').onclick = async () => { download(`salito-respaldo-cifrado-${ymd(new Date())}.json`, JSON.stringify(await Store.exportEncrypted())); await Store.commit('sistema.respaldo', 'sistema', null, 'Respaldo cifrado descargado'); };
  $('[data-pin]').onclick = () => modal({ title: 'Cambiar PIN', body: '<label class="f">Nuevo PIN (mínimo 6 dígitos)<input class="pin" type="password" inputmode="numeric" name="pin"></label>', foot: '<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Cambiar</button>', onMount: (el, close) => { el.querySelector('[data-save]').onclick = async () => { const v = el.querySelector('[name=pin]').value; if (!/^\d{6,}$/.test(v)) return toast('Usa al menos 6 dígitos'); await Store.changePin(v); close(); toast('PIN actualizado'); }; } });
  $('[data-reset]').onclick = async () => { if (await confirmDialog('Borrar todo', 'Se eliminarán todas las historias clínicas, citas y registros de este dispositivo. Descarga antes un respaldo. Esta acción no se puede deshacer.', 'Borrar todo', true)) { Store.wipe(); location.hash = '#/inicio'; renderLock(); } };
}
function svcEditor(s) {
  const D = db(); const isNew = !s; s = s || { id: uid('svc'), name: '', minutes: 50, price: 30, desc: '', modalities: ['presencial', 'online'], active: true };
  modal({ title: isNew ? 'Nuevo servicio' : 'Editar servicio', body: `<div class="form-grid"><label class="f full">Nombre<input type="text" name="name" value="${esc(s.name)}"></label><label class="f">Duración (min)<input type="number" name="minutes" value="${s.minutes}"></label><label class="f">Valor<input type="number" step="0.01" name="price" value="${s.price}"></label><label class="f full">Descripción para la web<textarea name="desc" rows="2">${esc(s.desc)}</textarea></label><label class="check"><input type="checkbox" name="pres" ${s.modalities.includes('presencial') ? 'checked' : ''}> Presencial</label><label class="check"><input type="checkbox" name="onl" ${s.modalities.includes('online') ? 'checked' : ''}> En línea</label><label class="check full"><input type="checkbox" name="active" ${s.active !== false ? 'checked' : ''}> Visible en la página de reservas</label></div>`,
    foot: '<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>',
    onMount: (el, close) => { el.querySelector('[data-save]').onclick = async () => { const d = formData(el); Object.assign(s, { name: d.name, minutes: +d.minutes, price: +d.price, desc: d.desc, active: d.active, modalities: [d.pres && 'presencial', d.onl && 'online'].filter(Boolean) }); if (isNew) D.services.push(s); await Store.commit('ajustes.servicio', 'sistema', s.id, `Servicio ${isNew ? 'creado' : 'editado'}: ${s.name}`); close(); viewSettings(); }; } });
}

route();
