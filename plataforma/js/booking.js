// =====================================================================
// Página pública de reservas (no requiere PIN)
// Lee solo la agenda pública y envía la solicitud cifrada para la profesional.
// =====================================================================
import { Store, KEYS, storage, $, $$, esc, ymd, hm, parseYmd, addDays, fmtDate, money, DIA_C, MESES, freeSlots, encryptForOwner, download, icsFor, waLink } from './core.js';
import { CRISIS, NORMATIVA, CONSENTS } from './scales.js';
import { baseConfig } from './seed.js';
import { icon, toast, formData } from './ui.js';

let B;
const reset = () => { B = { step: 0, svc: null, date: null, time: null, modality: 'presencial', data: {}, month: 0 }; };
reset();

export function renderBooking(root) {
  const pub = Store.publicData();
  const fallback = baseConfig();
  const P = pub?.profile || fallback.profile;
  const services = pub?.services || fallback.services;
  const country = 'EC';
  const lines = CRISIS[country];
  const cur = NORMATIVA[country].moneda;
  const live = !!pub?.pubKey;

  const steps = ['Servicio', 'Fecha y hora', 'Tus datos', 'Confirmar'];
  const svc = services.find((s) => s.id === B.svc);

  const head = `<div class="pub-top"><a href="../index.html" class="brand" style="padding:0;text-decoration:none;color:inherit"><div class="brand-mark">S</div><div><b>${esc(P.short)}</b><span>${esc(P.title)}</span></div></a><a class="btn ghost sm" href="#/inicio">${icon('lock')} Acceso profesional</a></div>`;
  const hero = `<section class="pub-hero"><div><span class="pill brand">Agenda en línea</span><h1 style="margin-top:12px">Reserva tu sesión con ${esc(P.short)}</h1><p>${esc(P.tagline || P.bio)}</p>
      <div class="row" style="margin-top:16px">${(P.specialties || []).slice(0, 4).map((s) => `<span class="pill">${esc(s)}</span>`).join('')}</div>
      <p class="small muted" style="margin-top:14px">${esc(P.city)} · Presencial y en línea · ${esc(P.approach || '')}</p></div>
    <img src="salome-retrato.jpg" alt="${esc(P.short)}" onerror="this.style.display='none'"></section>`;

  let body = '';
  if (!live) {
    body = `<div class="card"><h2>La agenda en línea se está configurando</h2><p class="muted" style="margin-top:8px">Mientras tanto, puedes escribir directamente para agendar.</p><div class="row" style="margin-top:14px"><a class="btn primary" target="_blank" rel="noopener" href="${waLink(P.phone, 'Hola, quisiera agendar una sesión.')}">${icon('wa')} Escribir por WhatsApp</a><a class="btn" href="mailto:${esc(P.email)}">Enviar correo</a></div></div>`;
  } else if (B.step === 0) {
    body = `<h2 style="margin-bottom:12px">¿Qué tipo de sesión necesitas?</h2><div class="svc-grid">${services.map((s) => `<button class="svc ${B.svc === s.id ? 'on' : ''}" data-svc="${s.id}"><b>${esc(s.name)}</b><span class="small" style="color:var(--ink-2)">${esc(s.desc)}</span><span class="meta"><span>${s.minutes} min</span><span>·</span><span>${money(s.price, cur)}</span><span>·</span><span>${s.modalities.map((m) => (m === 'online' ? 'En línea' : 'Presencial')).join(' o ')}</span></span></button>`).join('')}</div>
      <p class="small muted" style="margin-top:12px">¿Primera vez? Elige <b>Primera consulta</b>: en ella acordamos juntas los objetivos y la frecuencia.</p>`;
  } else if (B.step === 1) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const horizon = addDays(today, pub.availability.horizonDays || 45);
    const m0 = new Date(today.getFullYear(), today.getMonth() + B.month, 1);
    const lead = (m0.getDay() + 6) % 7; const dim = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push('<span></span>');
    for (let d = 1; d <= dim; d++) {
      const dt = new Date(m0.getFullYear(), m0.getMonth(), d); const ds = ymd(dt);
      const n = dt >= today && dt <= horizon ? freeSlots(pub, ds, svc.minutes).length : 0;
      cells.push(`<button class="day ${n ? '' : 'off'} ${B.date === ds ? 'on' : ''}" ${n ? `data-date="${ds}"` : 'disabled'} aria-label="${fmtDate(dt, { weekday: true })}${n ? `, ${n} horarios` : ', sin horarios'}">${d}${n ? `<small>${n} libres</small>` : ''}</button>`);
    }
    const slots = B.date ? freeSlots(pub, B.date, svc.minutes) : [];
    body = `<div class="grid g2" style="align-items:start"><div class="card"><div class="card-head"><h3>${MESES[m0.getMonth()][0].toUpperCase() + MESES[m0.getMonth()].slice(1)} ${m0.getFullYear()}</h3><div class="row"><button class="btn sm" data-m="-1" ${B.month <= 0 ? 'disabled' : ''} aria-label="Mes anterior">${icon('left')}</button><button class="btn sm" data-m="1" ${m0 > horizon ? 'disabled' : ''} aria-label="Mes siguiente">${icon('right')}</button></div></div>
        <div class="days">${['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((d) => `<span class="dn">${d}</span>`).join('')}${cells.join('')}</div></div>
      <div class="card"><h3>${B.date ? fmtDate(parseYmd(B.date), { weekday: true }) : 'Elige un día'}</h3>
        ${B.date ? (slots.length ? `<div class="slots">${slots.map((t) => `<button data-time="${hm(t)}" class="${B.time === hm(t) ? 'on' : ''}">${hm(t)}</button>`).join('')}</div>` : '<p class="muted">No quedan horarios este día.</p>') : '<p class="muted small">Los días con horarios disponibles están resaltados.</p>'}
        ${svc.modalities.length > 1 ? `<h3 style="margin-top:18px">Modalidad</h3><div class="seg">${svc.modalities.map((m) => `<button data-mod="${m}" class="${B.modality === m ? 'on' : ''}">${m === 'online' ? 'En línea' : 'Presencial'}</button>`).join('')}</div>` : ''}
        <p class="tiny muted" style="margin-top:14px">Horario de Quito (UTC−5).</p></div></div>`;
  } else if (B.step === 2) {
    const d = B.data;
    body = `<form class="card" id="bf"><h2 style="margin-bottom:4px">Tus datos</h2><p class="muted small" style="margin-bottom:16px">Solo los verá ${esc(P.short)}. Se envían cifrados.</p><div class="form-grid">
      <label class="f full">Nombre completo<input type="text" name="name" required value="${esc(d.name)}" autocomplete="name"></label>
      <label class="f">WhatsApp<input type="tel" name="phone" required value="${esc(d.phone)}" placeholder="+593 9…" autocomplete="tel"></label>
      <label class="f">Correo<input type="email" name="email" required value="${esc(d.email)}" autocomplete="email"></label>
      <label class="f">Cédula <span class="hint">opcional</span><input type="text" name="docId" value="${esc(d.docId)}"></label>
      <label class="f">Fecha de nacimiento<input type="date" name="birth" value="${esc(d.birth)}"></label>
      <label class="f full">¿Qué te gustaría trabajar? <span class="hint">Opcional. Puedes contarlo en la sesión.</span><textarea name="reason" rows="3">${esc(d.reason)}</textarea></label>
      <label class="f full">¿Cómo conociste a ${esc(P.short.split(' ')[0])}?<select name="referral"><option ${d.referral === 'Recomendación' ? 'selected' : ''}>Recomendación</option><option ${d.referral === 'Instagram' ? 'selected' : ''}>Instagram</option><option ${d.referral === 'Google' ? 'selected' : ''}>Google</option><option ${d.referral === 'Médico o institución' ? 'selected' : ''}>Médico o institución</option><option ${d.referral === 'Otro' ? 'selected' : ''}>Otro</option></select></label>
      <p class="full tiny muted">Si la sesión es para un menor de edad, escribe los datos de la madre, el padre o representante legal y menciónalo en el motivo.</p></div></form>`;
  } else if (B.step === 3) {
    const pubN = NORMATIVA[country];
    const ks = ['datos', 'informado', 'cancelacion', ...(B.modality === 'online' ? ['online'] : [])];
    body = `<div class="grid g2" style="align-items:start"><div class="card"><h2>Revisa y acepta</h2><div style="margin-top:12px;display:flex;flex-direction:column;gap:12px">${ks.map((k) => `<label class="check"><input type="checkbox" data-c="${k}" required><span><b>${CONSENTS[k].title}.</b> ${esc(CONSENTS[k].text(P, pubN, pub.policies))}</span></label>`).join('')}</div></div>
      <div class="summary"><h3 style="margin-bottom:10px">Resumen</h3><dl class="kv"><dt>Sesión</dt><dd>${esc(svc.name)}</dd><dt>Fecha</dt><dd>${fmtDate(parseYmd(B.date), { weekday: true, year: true })}</dd><dt>Hora</dt><dd>${B.time} (${svc.minutes} min)</dd><dt>Modalidad</dt><dd>${B.modality === 'online' ? 'En línea' : 'Presencial'}</dd><dt>Valor</dt><dd>${money(svc.price, cur)}</dd><dt>Nombre</dt><dd>${esc(B.data.name)}</dd></dl>
        <p class="tiny muted" style="margin-top:12px">La cita queda <b>por confirmar</b> hasta que ${esc(P.short.split(' ')[0])} la revise. Te escribirá por WhatsApp.</p></div></div>`;
  } else if (B.step === 4) {
    const start = new Date(`${B.date}T${B.time}`);
    body = `<div class="card" style="text-align:center;padding:40px 20px"><div style="font-size:40px">✓</div><h1 style="margin-top:8px">¡Solicitud enviada!</h1><p class="muted" style="margin:10px auto 0;max-width:46ch">${esc(P.short)} confirmará tu cita del <b>${fmtDate(start, { weekday: true })} a las ${B.time}</b> por WhatsApp o correo.</p>
      <div class="row" style="justify-content:center;margin-top:22px"><button class="btn" data-ics>${icon('cal')} Añadir a mi calendario</button><a class="btn primary" target="_blank" rel="noopener" href="${waLink(P.phone, `Hola ${P.short.split(' ')[0]}, acabo de solicitar una cita de ${svc.name.toLowerCase()} para el ${fmtDate(start, { weekday: true })} a las ${B.time}. Soy ${B.data.name}.`)}">${icon('wa')} Avisar por WhatsApp</a><button class="btn ghost" data-again>Agendar otra</button></div></div>`;
  }

  const nav = live && B.step < 4 ? `<div class="row" style="justify-content:space-between;margin-top:18px">${B.step ? '<button class="btn" data-back>← Atrás</button>' : '<span></span>'}<button class="btn primary lg" data-next ${canNext(svc) ? '' : 'disabled'}>${B.step === 3 ? 'Solicitar cita' : 'Continuar →'}</button></div>` : '';

  root.innerHTML = `<div class="pub">${head}${B.step === 0 ? hero : ''}
    ${live && B.step < 4 ? `<div class="steps">${steps.map((s, i) => `<span class="${i < B.step ? 'done' : i === B.step ? 'on' : ''}">${i + 1}. ${s}</span>`).join('')}</div>` : ''}
    ${body}${nav}
    ${B.step === 0 ? aboutBlock(P) : ''}
    <div class="crisis" role="note">${icon('heart')}<span>Esta agenda no es un servicio de emergencias. Si estás en peligro o piensas en hacerte daño, llama ya al <b>${lines.map((l) => `${esc(l.tel)}</b> (${esc(l.name)})`).join(' o <b>')}.</span></div>
    <p class="tiny muted" style="margin-top:18px;text-align:center">Tus datos se tratan conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador. · <a href="mailto:${esc(P.email)}">${esc(P.email)}</a></p></div>`;
  bind(root, pub, svc, services);
}

function aboutBlock(P) {
  if (!P.education) return '';
  return `<section class="grid g2" style="margin-top:28px">
    <div class="card"><h3>Sobre ${esc(P.short.split(' ')[0])}</h3><p class="small" style="color:var(--ink-2)">${esc(P.bio)}</p>
      <h3 style="margin-top:16px">Áreas de trabajo</h3><div class="row">${(P.areas || []).map((a) => `<span class="pill">${esc(a)}</span>`).join('')}</div>
      <h3 style="margin-top:16px">Atiendo a</h3><p class="small">${(P.populations || []).map(esc).join(' · ')}</p></div>
    <div class="card"><h3>Formación</h3><div class="list">${P.education.map(([y, t, i]) => `<div class="li"><div class="grow"><div class="t small">${esc(t)}</div><div class="s">${esc(i)} · ${esc(y)}</div></div></div>`).join('')}</div>
      <p class="tiny muted" style="margin-top:10px">${esc(P.languages || '')}${P.linkedin ? ` · <a href="${esc(P.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}</p></div></section>`;
}

function canNext(svc) {
  if (B.step === 0) return !!B.svc;
  if (B.step === 1) return !!(B.date && B.time);
  return true;
}

function bind(root, pub, svc, services) {
  const r = () => renderBooking(root);
  $$('[data-svc]', root).forEach((b) => b.onclick = () => { B.svc = b.dataset.svc; const s = services.find((x) => x.id === B.svc); if (!s.modalities.includes(B.modality)) B.modality = s.modalities[0]; B.date = B.time = null; r(); });
  $$('[data-date]', root).forEach((b) => b.onclick = () => { B.date = b.dataset.date; B.time = null; r(); });
  $$('[data-time]', root).forEach((b) => b.onclick = () => { B.time = b.dataset.time; r(); });
  $$('[data-mod]', root).forEach((b) => b.onclick = () => { B.modality = b.dataset.mod; r(); });
  $$('[data-m]', root).forEach((b) => b.onclick = () => { B.month = Math.max(0, B.month + +b.dataset.m); r(); });
  const back = $('[data-back]', root); back && (back.onclick = () => { if (B.step === 2) B.data = { ...B.data, ...formData($('#bf')) }; B.step--; r(); scrollTo(0, 0); });
  const again = $('[data-again]', root); again && (again.onclick = () => { reset(); r(); });
  const ics = $('[data-ics]', root); ics && (ics.onclick = () => download('mi-sesion.ics', icsFor({ title: `Sesión con ${pub.profile.short} (por confirmar)`, start: new Date(`${B.date}T${B.time}`).toISOString(), minutes: svc.minutes, location: B.modality === 'online' ? 'En línea' : pub.profile.address }), 'text/calendar'));
  const next = $('[data-next]', root);
  if (next) next.onclick = async () => {
    if (B.step === 2) {
      const f = $('#bf'); if (!f.reportValidity()) return;
      B.data = formData(f);
    }
    if (B.step === 3) {
      const boxes = $$('[data-c]', root); if (boxes.some((c) => !c.checked)) return toast('Para continuar, acepta todos los puntos');
      // Revalida que el horario siga libre
      const still = freeSlots(Store.publicData(), B.date, svc.minutes).some((t) => hm(t) === B.time);
      if (!still) { toast('Ese horario acaba de ocuparse. Elige otro.'); B.step = 1; B.time = null; return r(); }
      next.disabled = true; next.textContent = 'Enviando…';
      const now = new Date().toISOString();
      const req = { ...B.data, serviceId: svc.id, start: new Date(`${B.date}T${B.time}`).toISOString(), modality: B.modality, consents: boxes.map((c) => ({ type: c.dataset.c, version: CONSENTS[c.dataset.c].version, date: now })), at: now };
      try {
        const item = await encryptForOwner(pub.pubKey, req);
        const inbox = storage.get(KEYS.inbox) || []; inbox.push(item); storage.set(KEYS.inbox, inbox);
        // Marca el hueco como ocupado en la agenda pública (sin datos personales)
        const p2 = Store.publicData(); p2.busy.push({ start: req.start, minutes: svc.minutes }); storage.set(KEYS.pub, p2);
        // TODO producción: enviar `item` al servidor (POST /api/solicitudes) en lugar de guardarlo localmente.
      } catch (e) { toast('No se pudo enviar. Inténtalo de nuevo.'); next.disabled = false; return; }
    }
    B.step++; r(); scrollTo(0, 0);
  };
}
