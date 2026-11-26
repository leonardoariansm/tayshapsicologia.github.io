// Componentes de interfaz reutilizables
import { esc, $, fmtShort } from './core.js';

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M17.5 14.6c2.2.4 3.6 2 4 4.4"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-1-1.6-1.6-2.8-1.6-1.6 0-2.8.9-2.8 2.1 0 2.9 5.8 1.5 5.8 4.4 0 1.3-1.3 2.2-3 2.2-1.3 0-2.5-.6-3-1.7M12 6v1.6M12 16.3V18"/>',
  shield: '<path d="M12 2.8 4 6v6c0 4.6 3.4 8.3 8 9.2 4.6-.9 8-4.6 8-9.2V6z"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  note: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z"/>',
  print: '<path d="M7 9V3h10v6M7 17H4.5A1.5 1.5 0 0 1 3 15.5v-5A1.5 1.5 0 0 1 4.5 9h15a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17"/><rect x="7" y="14" width="10" height="7" rx="1"/>',
  down: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M4 20h16"/>',
  phone: '<path d="M5 3.5h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.6 6.6l1.4-2.3 4.5 1.8v3.5a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
  video: '<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  out: '<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16.5 14.5 12 10 7.5M14.5 12H4"/>',
  inbox: '<path d="M3 13.5 5.6 5.2A1.7 1.7 0 0 1 7.2 4h9.6a1.7 1.7 0 0 1 1.6 1.2L21 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 13.5h5l1.5 2.5h5l1.5-2.5h5"/>',
  wa: '<path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3.2 3.1z"/><path d="M9 8.5c0 3.6 2.9 6.5 6.5 6.5l1-1.6-2.1-1-1 .9a4.5 4.5 0 0 1-2.7-2.7l.9-1-1-2.1z"/>',
};
export const icon = (n, cls = '') => `<svg class="${cls}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

export const initials = (name) => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const AV = [['var(--sand-soft)', 'var(--sand)'], ['var(--brand-soft)', 'var(--brand-ink)'], ['var(--plum-soft)', 'var(--plum)'], ['var(--rose-soft)', 'var(--rose)'], ['var(--info-soft)', 'var(--info)']];
export const avatar = (name, cls = '') => { const i = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length; return `<span class="avatar ${cls}" style="background:${AV[i][0]};color:${AV[i][1]}">${esc(initials(name))}</span>`; };

export const STATUS = { solicitada: 'Por confirmar', confirmada: 'Confirmada', atendida: 'Atendida', no_asistio: 'No asistió', cancelada: 'Cancelada' };
export const statusPill = (s) => `<span class="pill st st-${s}"><span class="dot" style="background:var(--c)"></span>${STATUS[s] || s}</span>`;
export const RISK = { sin_evaluar: ['Sin evaluar', ''], bajo: ['Riesgo bajo', 'ok'], moderado: ['Riesgo moderado', 'warn'], alto: ['Riesgo alto', 'bad'] };
export const riskPill = (r) => { const [l, c] = RISK[r] || RISK.sin_evaluar; return `<span class="pill ${c}">${l}</span>`; };
export const PSTATUS = { nuevo: ['Nuevo', 'info'], activo: ['En proceso', 'brand'], lista_espera: ['Lista de espera', 'warn'], pausa: ['En pausa', ''], alta: ['Alta', 'plum'], derivado: ['Derivado', ''] };
export const pStatusPill = (s) => { const [l, c] = PSTATUS[s] || [s, '']; return `<span class="pill ${c}">${l}</span>`; };

// ---------- toast ----------
export function toast(msg) {
  let w = $('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; w.setAttribute('role', 'status'); document.body.appendChild(w); }
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; w.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 2600);
}

// ---------- modal ----------
export function modal({ title, body, foot = '', wide = false, onMount }) {
  const s = document.createElement('div'); s.className = 'scrim';
  s.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-h"><h2>${esc(title)}</h2><button class="x" data-close aria-label="Cerrar">×</button></div><div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
  const close = () => { s.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  s.addEventListener('click', (e) => { if (e.target === s || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(s);
  const first = s.querySelector('input:not([type=hidden]),select,textarea'); if (first) setTimeout(() => first.focus(), 50);
  onMount && onMount(s, close);
  return { el: s, close };
}
export function confirmDialog(title, text, okLabel = 'Confirmar', danger = false) {
  return new Promise((res) => {
    modal({ title, body: `<p>${text}</p>`, foot: `<button class="btn" data-close>Volver</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okLabel)}</button>`,
      onMount: (el, close) => { el.querySelector('[data-ok]').onclick = () => { close(); res(true); }; el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) res(false); }); } });
  });
}
export const formData = (root) => { const o = {}; root.querySelectorAll('[name]').forEach((el) => { if (el.type === 'checkbox') o[el.name] = el.checked; else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; } else o[el.name] = el.value.trim(); }); return o; };

// ---------- gráficos ----------
// Línea de evolución de una escala con bandas de severidad
export function lineChart(points, { max, bands = [], h = 170, better = -1 } = {}) {
  if (!points.length) return '';
  const W = 560, H = h, L = 30, R = 10, T = 10, B = 24; const iw = W - L - R, ih = H - T - B;
  const xs = points.length === 1 ? [L + iw / 2] : points.map((_, i) => L + (i * iw) / (points.length - 1));
  const y = (v) => T + ih - (v / max) * ih;
  let prev = 0; const bandRects = bands.map(([lim, , sev]) => { const r = `<rect x="${L}" y="${y(Math.min(lim, max))}" width="${iw}" height="${y(prev) - y(Math.min(lim, max))}" fill="${['var(--ok-soft)', 'var(--sand-soft)', 'var(--warn-soft)', 'var(--bad-soft)'][sev]}" opacity=".55"/>`; prev = lim; return r; }).join('');
  const ticks = [0, max / 2, max].map((v) => `<text class="ax" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`).join('');
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${xs[i]},${y(p.score)}`).join(' ');
  const dots = points.map((p, i) => `<circle cx="${xs[i]}" cy="${y(p.score)}" r="4.5" fill="var(--surface)" stroke="var(--brand)" stroke-width="2.2"><title>${fmtShort(p.date)}: ${p.score}</title></circle><text class="ax" x="${xs[i]}" y="${H - 6}" text-anchor="middle">${fmtShort(p.date)}</text><text x="${xs[i]}" y="${y(p.score) - 9}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)">${p.score}</text>`).join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución del puntaje">${bandRects}${ticks}<path d="${path}" fill="none" stroke="var(--brand)" stroke-width="2.4" stroke-linejoin="round"/>${dots}</svg></div>`;
}
// Barras simples (sesiones por semana)
export function barChart(data, { h = 140 } = {}) {
  const W = 560, H = h, B = 22, T = 14; const max = Math.max(1, ...data.map((d) => d.v)); const bw = W / data.length;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sesiones por semana">${data.map((d, i) => { const bh = ((H - B - T) * d.v) / max; return `<rect x="${i * bw + bw * 0.22}" y="${H - B - bh}" width="${bw * 0.56}" height="${Math.max(bh, 1)}" rx="5" fill="${d.hi ? 'var(--brand)' : 'color-mix(in srgb, var(--brand) 45%, var(--surface))'}"><title>${d.l}: ${d.v}</title></rect><text class="ax" x="${i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${d.l}</text>${d.v ? `<text x="${i * bw + bw / 2}" y="${H - B - bh - 4}" text-anchor="middle" font-size="11" fill="var(--ink-2)">${d.v}</text>` : ''}`; }).join('')}</svg></div>`;
}
