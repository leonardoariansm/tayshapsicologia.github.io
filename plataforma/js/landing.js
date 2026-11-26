// =====================================================================
// Landing interactiva: un pequeño juego abstracto para llegar al presente.
// Color → palabra → intensidad, forma, 5-4-3-2-1, respiración y un
// retrato final tipo póster. Nada de esto se guarda ni se envía.
// =====================================================================
import { esc, fmtDate, download } from './core.js';
import { CRISIS } from './scales.js';
import { icon, toast } from './ui.js';

const COLORS = [
  { k: 'cielo', name: 'Cielo', c: '#6FA8E6', c2: '#B9D7F2' },
  { k: 'sol', name: 'Sol', c: '#F2C94C', c2: '#F7E3A1' },
  { k: 'brasa', name: 'Brasa', c: '#EE7B4A', c2: '#F6B37F' },
  { k: 'rosa', name: 'Rosa', c: '#EC8FA8', c2: '#F5C6D1' },
  { k: 'indigo', name: 'Índigo', c: '#4C5BC4', c2: '#9AA3E6' },
  { k: 'bosque', name: 'Bosque', c: '#3E9A82', c2: '#9FD4C1' },
  { k: 'bruma', name: 'Bruma', c: '#A9A2C9', c2: '#DAD5EA' },
  { k: 'noche', name: 'Noche', c: '#2A2F3A', c2: '#7C8394' },
];
const WORDS = ['En calma', 'Cansancio', 'Ansiedad', 'Tristeza', 'Energía', 'Agobio', 'Esperanza', 'Enojo', 'Confusión', 'Gratitud', 'Soledad', 'Ilusión'];
const HEAVY = ['Ansiedad', 'Tristeza', 'Agobio', 'Soledad', 'Enojo'];

// Formas inspiradas en una colección de pósters de gradientes
const SHAPES = {
  flujo: { name: 'Flujo', line: 'No es una forma, es un movimiento.', d: 'M -40 150 C 60 40, 140 260, 230 170 S 360 70, 450 220', w: 120 },
  cambio: { name: 'Cambio', line: 'Los pequeños cambios abren caminos.', d: 'M 250 -40 C 360 90, 90 170, 200 270 S 330 400, 170 480', w: 95 },
  radiancia: { name: 'Radiancia', line: 'La suavidad también es fuerza.', circle: true },
  equilibrio: { name: 'Equilibrio', line: 'Entre el caos y la calma.', d: 'M 60 -40 C 40 120, 320 140, 260 260 S 60 380, 120 480', w: 110 },
  ciclo: { name: 'Ciclo', line: 'Los finales son nuevos comienzos.', d: 'M 200 220 C 200 190, 240 190, 240 220 C 240 270, 160 270, 160 210 C 160 140, 290 140, 290 225 C 290 330, 110 330, 110 210 C 110 90, 340 80, 345 230', w: 46 },
  eco: { name: 'Eco', line: 'Hay presencias que no se van.', d: 'M 200 480 C 140 400, 260 350, 200 280 S 140 160, 220 100 S 230 0, 180 -40', w: 70 },
};
const SENSES = [
  [5, 'cosas que puedes ver', 'Mira a tu alrededor sin prisa. Colores, formas, luz.', '#6FA8E6'],
  [4, 'cosas que puedes tocar', 'La tela de tu ropa, la mesa, tu propia mano.', '#3E9A82'],
  [3, 'sonidos que puedes oír', 'Cerca o lejos. Incluso tu respiración.', '#A9A2C9'],
  [2, 'olores que puedes notar', 'Si no notas ninguno, recuerda uno que te guste.', '#EC8FA8'],
  [1, 'sabor que puedes sentir', 'O algo que te gustaría saborear ahora.', '#F2C94C'],
];

let S;
const fresh = () => ({ screen: 'intro', color: null, word: null, intensity: 55, shape: null, grounded: false, breathed: false, gStep: 0, gTaps: 0, cStep: 0 });
S = fresh();

let root;
export function renderLanding(el) {
  root = el; document.body.dataset.mode = 'landing';
  draw();
}

const pal = () => {
  const c = COLORS.find((x) => x.k === S.color);
  return c ? [c.c, c.c2, '#F3D36B'] : ['#7FB7E8', '#8FD3C4', '#F3D36B'];
};

function stage(inner, opts = {}) {
  const [c1, c2, c3] = opts.colors || pal();
  const k = opts.scale || 1;
  return `<div class="lp" style="--c1:${c1};--c2:${c2};--c3:${c3}">
    <div class="lp-aura" style="transform:scale(${k})"><span class="b1"></span><span class="b2"></span><span class="b3"></span></div>
    <svg class="lp-ticks" viewBox="-200 -200 400 400" aria-hidden="true">${Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * Math.PI * 2; const r1 = 178, r2 = i % 4 ? 186 : 192; return `<line x1="${Math.cos(a) * r1}" y1="${Math.sin(a) * r1}" x2="${Math.cos(a) * r2}" y2="${Math.sin(a) * r2}"/>`; }).join('')}</svg>
    <div class="grain"></div>
    <header class="lp-top"><a href="#/" class="lp-logo" data-home>${logo()}<span>Salomé Argoti</span></a>
      <nav class="row"><a class="lp-link" href="#/reservar">Conocer a Salomé</a><a class="btn light sm" href="#/reservar">Agendar</a></nav></header>
    <main class="lp-main">${inner}</main>
    <footer class="lp-foot">${opts.foot ?? 'Nada de lo que elijas aquí se guarda ni se envía.'}</footer>
  </div>`;
}
const logo = () => `<svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><path d="M16 3c4 6 10 8 13 13-3 5-9 7-13 13-4-6-10-8-13-13 3-5 9-7 13-13z" fill="currentColor" opacity=".9"/><circle cx="16" cy="16" r="4" fill="var(--bg,#F3EDE3)"/></svg>`;

function tile(k, ic, g, title, sub, done) {
  return `<button class="lp-tile" data-go="${k}"><span class="gicon lg ${g}">${icon(ic)}</span><span><b>${title}</b><small>${sub}</small></span>${done ? `<span class="lp-done" aria-label="Hecho">${icon('check')}</span>` : ''}</button>`;
}

function draw() {
  const L = CRISIS.EC;
  let html = '';
  if (S.screen === 'intro') {
    html = stage(`<div class="lp-center">
      <p class="lp-eyebrow">Un momento para ti</p>
      <h1 class="lp-title">Siente. Respira.<br>Vuelve a ti.</h1>
      <button class="lp-orb" data-go="menu" aria-label="Empezar"><span>Empezar</span></button>
      <a class="lp-skip" href="#/reservar">o ir directo a agendar →</a></div>`);
  } else if (S.screen === 'menu') {
    const any = S.color || S.shape || S.grounded || S.breathed;
    html = stage(`<div class="lp-center lp-wide">
      <p class="lp-eyebrow">Elige por dónde empezar</p>
      <h2 class="lp-title sm">¿Qué te gustaría explorar?</h2>
      <div class="lp-tiles">
        ${tile('color', 'heart', 'g-rose', 'Tu color', '¿De qué color te sientes hoy?', S.color)}
        ${tile('forma', 'chart', 'g-sky', 'Tu forma', '¿Qué forma tiene lo que sientes?', S.shape)}
        ${tile('tierra', 'sun', 'g-sage', '5 · 4 · 3 · 2 · 1', 'Aterriza en el presente con tus sentidos', S.grounded)}
        ${tile('respira', 'moon', 'g-sky', 'Respira', 'Un minuto, a tu ritmo', S.breathed)}
      </div>
      <div class="row" style="justify-content:center;margin-top:22px">${any ? '<button class="btn primary lg" data-go="retrato">Ver mi retrato</button>' : ''}<a class="btn lg" href="#/reservar">Conocer a Salomé</a></div></div>`);
  } else if (S.screen === 'color') {
    if (S.cStep === 0) html = stage(`<div class="lp-center lp-wide"><p class="lp-eyebrow">Paso 1 de 3</p><h2 class="lp-title sm">Si lo que sientes tuviera un color…</h2>
      <div class="lp-swatches">${COLORS.map((c) => `<button class="lp-sw ${S.color === c.k ? 'on' : ''}" data-color="${c.k}" style="--s:${c.c};--s2:${c.c2}" aria-label="${c.name}"><span></span><small>${c.name}</small></button>`).join('')}</div>
      ${nav(!!S.color)}</div>`);
    if (S.cStep === 1) html = stage(`<div class="lp-center lp-wide"><p class="lp-eyebrow">Paso 2 de 3</p><h2 class="lp-title sm">¿Qué palabra se le parece?</h2>
      <div class="lp-chips">${WORDS.map((w) => `<button class="lp-chip ${S.word === w ? 'on' : ''}" data-word="${w}">${w}</button>`).join('')}</div>
      <p class="lp-note">No hay respuestas correctas. Puedes no elegir ninguna.</p>${nav(true)}</div>`);
    if (S.cStep === 2) html = stage(`<div class="lp-center lp-wide"><p class="lp-eyebrow">Paso 3 de 3</p><h2 class="lp-title sm">¿Qué tan intenso es?</h2>
      <label class="lp-slider"><span>Suave</span><input type="range" min="0" max="100" value="${S.intensity}" id="int" aria-label="Intensidad"><span>Intenso</span></label>
      ${nav(true, 'Listo')}</div>`, { scale: 0.7 + S.intensity / 120 });
  } else if (S.screen === 'forma') {
    html = stage(`<div class="lp-center lp-wide"><p class="lp-eyebrow">Tu forma</p><h2 class="lp-title sm">¿Cuál se parece a lo que estás viviendo?</h2>
      <div class="lp-shapes">${Object.entries(SHAPES).map(([k, s]) => `<button class="lp-shape ${S.shape === k ? 'on' : ''}" data-shape="${k}">${shapeSvg(k, pal(), 160, 200, 'sh' + k)}<b>${s.name}</b><small>${s.line}</small></button>`).join('')}</div>
      ${nav(!!S.shape, 'Listo')}</div>`);
  } else if (S.screen === 'tierra') {
    const [n, what, hint, col] = SENSES[S.gStep];
    html = stage(`<div class="lp-center"><p class="lp-eyebrow">Técnica 5 · 4 · 3 · 2 · 1</p>
      <div class="lp-num">${n}</div><h2 class="lp-title sm">${n === 1 ? 'Nombra 1' : 'Nombra ' + n} ${what}</h2><p class="lp-note">${hint}</p>
      <button class="lp-tap" data-tap aria-label="Toca cada vez que encuentres una">${Array.from({ length: n }, (_, i) => `<i class="${i < S.gTaps ? 'on' : ''}"></i>`).join('')}<span>${S.gTaps < n ? 'Toca cada vez que encuentres una' : 'Muy bien'}</span></button>
      <div class="lp-dots">${SENSES.map((_, i) => `<i class="${i < S.gStep ? 'done' : i === S.gStep ? 'on' : ''}"></i>`).join('')}</div>
      ${nav(S.gTaps >= n, S.gStep === 4 ? 'Terminar' : 'Siguiente')}</div>`, { colors: [col, '#F3EDE3', '#F3D36B'] });
  } else if (S.screen === 'respira') {
    html = stage(`<div class="lp-center"><p class="lp-eyebrow">Respira · 1 minuto</p>
      <div class="lp-breath"><div class="lp-bcircle" id="bc"></div><div class="lp-btext"><b id="bt">Cuando quieras</b><span id="bn">4 · 2 · 6</span></div></div>
      <div class="lp-controls"><button class="lp-ctl" data-back aria-label="Volver">${icon('left')}</button><button class="lp-ctl play" id="bplay" aria-label="Iniciar">${playIcon()}</button><button class="lp-ctl" data-go="menu" aria-label="Terminar">${icon('check')}</button></div>
      <div class="lp-progress"><i id="bp"></i></div></div>`);
  } else if (S.screen === 'retrato') {
    const heavy = HEAVY.includes(S.word) && S.intensity >= 70;
    html = stage(`<div class="lp-portrait">
      <div class="lp-poster" id="poster">${posterSvg()}</div>
      <div class="lp-pside"><p class="lp-eyebrow">Tu retrato de hoy</p><h2 class="lp-title sm">${esc(S.shape ? SHAPES[S.shape].name : 'Presente')}</h2>
        <p class="lp-note" style="text-align:left">${S.word ? `Hoy le pusiste nombre a lo que sientes: <b>${esc(S.word.toLowerCase())}</b>. ` : ''}Ponerle color, forma y palabras a una emoción es una manera de mirarla sin quedarte atrapado en ella.</p>
        ${heavy ? `<div class="lp-care">Si lo que sientes es muy intenso, no tienes que esperar: llama al <b>${L.map((l) => l.tel).join('</b> o al <b>')}</b> (${esc(L[1].name)}).</div>` : ''}
        <div class="row" style="margin-top:16px"><a class="btn primary lg" href="#/reservar">Hablar con Salomé</a><button class="btn lg" data-dl>${icon('down')} Guardar imagen</button></div>
        <button class="lp-skip" data-reset style="margin-top:12px">Volver a empezar</button></div></div>`);
  }
  root.innerHTML = html;
  bind();
}

const playIcon = () => '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>';
const pauseIcon = () => '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>';
function nav(ok, label = 'Continuar') { return `<div class="lp-nav"><button class="btn lg" data-back>← Atrás</button><button class="btn primary lg" data-next ${ok ? '' : 'disabled'}>${label}</button></div>`; }

// Forma como SVG con gradiente, desenfoque y grano
function shapeSvg(k, [c1, c2, c3], w, h, id) {
  const s = SHAPES[k];
  const body = s.circle
    ? `<circle cx="200" cy="210" r="150" fill="url(#rg${id})"/>`
    : `<path d="${s.d}" fill="none" stroke="url(#lg${id})" stroke-width="${s.w}" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 400 420" width="${w}" height="${h}" class="shape-svg" overflow="visible" aria-hidden="true"><defs>
    <linearGradient id="lg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
    <radialGradient id="rg${id}" cx=".62" cy=".45" r=".6"><stop offset="0" stop-color="${c1}"/><stop offset=".6" stop-color="${c2}"/><stop offset="1" stop-color="${c3}" stop-opacity="0"/></radialGradient>
    <filter id="f${id}" filterUnits="userSpaceOnUse" x="-160" y="-160" width="720" height="740">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${s.circle ? 14 : 18}" result="b"/>
      <feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="7" result="w"/>
      <feDisplacementMap in="b" in2="w" scale="60" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="1" seed="2" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.85 1.15" result="m"/>
      <feComposite in="d" in2="m" operator="in"/>
    </filter>
    </defs><g filter="url(#f${id})">${body}</g></svg>`;
}

function posterSvg() {
  const [c1, c2, c3] = pal();
  const shape = S.shape || 'radiancia';
  const s = SHAPES[shape];
  const today = fmtDate(new Date(), { year: true });
  const inner = shapeSvg(shape, [c1, c2, c3], 400, 420, 'poster').replace('<svg ', '<svg x="20" y="80" overflow="visible" ');
  const dots = [c1, c2, c3].map((c, i) => `<circle cx="${380 - (2 - i) * 18}" cy="626" r="6" fill="${c}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 680" width="440" height="680" role="img" aria-label="Retrato: ${esc(s.name)}">
    <rect width="440" height="680" fill="#F4EEE3"/>
    <text x="34" y="44" font-family="Inter, sans-serif" font-size="10" letter-spacing="2" font-weight="600" fill="#2A2F33">SALOMÉ ARGOTI</text>
    <text x="34" y="58" font-family="Inter, sans-serif" font-size="10" letter-spacing="2" font-weight="600" fill="#2A2F33">RETRATO DE HOY</text>
    <text x="406" y="44" text-anchor="end" font-family="Inter, sans-serif" font-size="10" fill="#2A2F33">${esc(today)}</text>
    <line x1="350" y1="52" x2="406" y2="52" stroke="#2A2F33" stroke-width=".8"/>
    ${inner}
    <text x="34" y="590" font-family="Fraunces, Georgia, serif" font-size="40" letter-spacing="1" fill="#1B2224">${esc(s.name.toUpperCase())}</text>
    <text x="34" y="616" font-family="Fraunces, Georgia, serif" font-size="13" fill="#5A6062">${esc(s.line)}</text>
    ${S.word ? `<text x="34" y="638" font-family="Inter, sans-serif" font-size="11" fill="#5A6062">Hoy: ${esc(S.word.toLowerCase())}${S.color ? ' · ' + esc(COLORS.find((x) => x.k === S.color).name.toLowerCase()) : ''}</text>` : ''}
    ${dots}
  </svg>`;
}

let breathTimer = null;
function stopBreath() { if (breathTimer) { clearInterval(breathTimer); breathTimer = null; } }

function bind() {
  const go = (scr) => { stopBreath(); S.screen = scr; if (scr === 'color') S.cStep = 0; if (scr === 'tierra') { S.gStep = 0; S.gTaps = 0; } draw(); window.scrollTo(0, 0); };
  root.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
  root.querySelectorAll('[data-home]').forEach((b) => b.onclick = (e) => { e.preventDefault(); stopBreath(); S = fresh(); draw(); });
  root.querySelectorAll('[data-reset]').forEach((b) => b.onclick = () => { S = fresh(); draw(); });
  root.querySelectorAll('[data-color]').forEach((b) => b.onclick = () => { S.color = b.dataset.color; draw(); });
  root.querySelectorAll('[data-word]').forEach((b) => b.onclick = () => { S.word = S.word === b.dataset.word ? null : b.dataset.word; draw(); });
  root.querySelectorAll('[data-shape]').forEach((b) => b.onclick = () => { S.shape = b.dataset.shape; draw(); });
  const int = root.querySelector('#int'); if (int) int.oninput = () => { S.intensity = +int.value; const a = root.querySelector('.lp-aura'); a.style.transform = `scale(${0.7 + S.intensity / 120})`; a.style.filter = `blur(${70 - S.intensity / 3}px) saturate(${0.7 + S.intensity / 90})`; };
  const back = root.querySelector('[data-back]');
  if (back) back.onclick = () => {
    stopBreath();
    if (S.screen === 'color' && S.cStep > 0) { S.cStep--; return draw(); }
    if (S.screen === 'tierra' && S.gStep > 0) { S.gStep--; S.gTaps = SENSES[S.gStep][0]; return draw(); }
    go('menu');
  };
  const next = root.querySelector('[data-next]');
  if (next) next.onclick = () => {
    if (S.screen === 'color') { if (S.cStep < 2) { S.cStep++; return draw(); } return go('menu'); }
    if (S.screen === 'forma') return go('menu');
    if (S.screen === 'tierra') { if (S.gStep < 4) { S.gStep++; S.gTaps = 0; return draw(); } S.grounded = true; toast('Ya estás aquí, en este momento.'); return go('menu'); }
  };
  const tap = root.querySelector('[data-tap]');
  if (tap) tap.onclick = () => { const n = SENSES[S.gStep][0]; if (S.gTaps < n) { S.gTaps++; draw(); } };
  const dl = root.querySelector('[data-dl]');
  if (dl) dl.onclick = savePoster;
  const play = root.querySelector('#bplay');
  if (play) play.onclick = () => { if (breathTimer) { stopBreath(); play.innerHTML = playIcon(); root.querySelector('#bt').textContent = 'En pausa'; } else { startBreath(); play.innerHTML = pauseIcon(); } };
}

function startBreath() {
  const phases = [['Inhala', 4, 1.25], ['Sostén', 2, 1.25], ['Exhala', 6, 0.75]];
  const total = 60; let t = startBreath.t || 0;
  const bc = root.querySelector('#bc'), bt = root.querySelector('#bt'), bn = root.querySelector('#bn'), bp = root.querySelector('#bp');
  const tick = () => {
    if (!root.querySelector('#bc')) return stopBreath();
    const cyc = t % 12; let acc = 0;
    for (const [label, d, sc] of phases) { if (cyc < acc + d) { bt.textContent = label + '…'; bn.textContent = String(d - (cyc - acc)); bc.style.transition = `transform ${label === 'Sostén' ? 0.3 : d}s ease-in-out`; if (cyc === acc) bc.style.transform = `scale(${sc})`; break; } acc += d; }
    bp.style.width = `${(t / total) * 100}%`;
    t++; startBreath.t = t;
    if (t > total) { stopBreath(); startBreath.t = 0; S.breathed = true; bt.textContent = 'Bien hecho'; bn.textContent = 'Un minuto para ti'; bc.style.transform = 'scale(1)'; const p = root.querySelector('#bplay'); if (p) p.innerHTML = playIcon(); }
  };
  tick(); breathTimer = setInterval(tick, 1000);
}

async function savePoster() {
  try {
    const svg = posterSvg();
    const img = new Image(); const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const cv = document.createElement('canvas'); cv.width = 880; cv.height = 1360; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, 880, 1360);
    URL.revokeObjectURL(url);
    cv.toBlob((b) => download('mi-retrato.png', b), 'image/png');
  } catch { download('mi-retrato.svg', posterSvg(), 'image/svg+xml'); }
}
