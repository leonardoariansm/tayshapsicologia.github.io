// =====================================================================
// Escalas de resultado (tomadas del módulo de Salud Mental de Gemelo Salud)
// PHQ-9 (Kroenke 2001), GAD-7 (Spitzer 2006), WHO-5 (OMS 1998).
// Las tres son de uso libre. Se calculan puntaje, banda de severidad,
// cambio clínicamente fiable (RCI) y recuperación (Jacobson-Truax).
// =====================================================================

const F4 = ['Ningún día', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'];
const F6 = ['Nunca', 'De vez en cuando', 'Menos de la mitad del tiempo', 'Más de la mitad del tiempo', 'La mayor parte del tiempo', 'Todo el tiempo'];

export const SCALES = {
  PHQ9: {
    name: 'PHQ-9', title: 'Ánimo (PHQ-9)', about: 'Síntomas depresivos en las últimas 2 semanas', max: 27, opts: F4,
    stem: 'Durante las últimas 2 semanas, ¿con qué frecuencia te han molestado estos problemas?',
    items: ['Poco interés o placer en hacer cosas', 'Sentirte decaído(a), deprimido(a) o sin esperanza', 'Dificultad para dormir o permanecer dormido(a), o dormir demasiado', 'Sentirte cansado(a) o con poca energía', 'Poco apetito o comer en exceso', 'Sentirte mal contigo mismo(a), o que eres un fracaso o que le has fallado a tu familia', 'Dificultad para concentrarte, por ejemplo al leer o ver televisión', 'Moverte o hablar tan lento que otros lo notan, o lo contrario: estar muy inquieto(a)', 'Pensamientos de que estarías mejor muerto(a) o de hacerte daño de alguna forma'],
    short: ['Interés', 'Ánimo', 'Sueño', 'Energía', 'Apetito', 'Autoestima', 'Concentración', 'Movimiento', 'Pensamientos de daño'],
    bands: [[4, 'Mínimos', 0], [9, 'Leves', 1], [14, 'Moderados', 2], [19, 'Moderadamente graves', 3], [27, 'Graves', 3]],
    rci: 6, caseness: 10, better: -1, ref: 'Kroenke K, Spitzer RL, Williams JB. J Gen Intern Med. 2001;16(9):606-13.',
  },
  GAD7: {
    name: 'GAD-7', title: 'Ansiedad (GAD-7)', about: 'Síntomas de ansiedad en las últimas 2 semanas', max: 21, opts: F4,
    stem: 'Durante las últimas 2 semanas, ¿con qué frecuencia te han molestado estos problemas?',
    items: ['Sentirte nervioso(a), ansioso(a) o con los nervios de punta', 'No poder dejar de preocuparte o controlar la preocupación', 'Preocuparte demasiado por diferentes cosas', 'Dificultad para relajarte', 'Estar tan inquieto(a) que te cuesta quedarte quieto(a)', 'Molestarte o irritarte con facilidad', 'Sentir miedo de que algo terrible pueda pasar'],
    short: ['Nervios', 'Control de la preocupación', 'Preocupación excesiva', 'Relajarse', 'Inquietud', 'Irritabilidad', 'Miedo'],
    bands: [[4, 'Mínimos', 0], [9, 'Leves', 1], [14, 'Moderados', 2], [21, 'Graves', 3]],
    rci: 4, caseness: 8, better: -1, ref: 'Spitzer RL, Kroenke K, Williams JB, Löwe B. Arch Intern Med. 2006;166(10):1092-7.',
  },
  WHO5: {
    name: 'WHO-5', title: 'Bienestar (WHO-5)', about: 'Bienestar emocional en las últimas 2 semanas', max: 100, opts: F6, scale: 4,
    stem: 'En las últimas 2 semanas…',
    items: ['Me he sentido alegre y de buen humor', 'Me he sentido tranquilo(a) y relajado(a)', 'Me he sentido activo(a) y enérgico(a)', 'Me he despertado fresco(a) y descansado(a)', 'Mi vida cotidiana ha estado llena de cosas que me interesan'],
    short: ['Alegría', 'Calma', 'Energía', 'Descanso', 'Interés'],
    bands: [[28, 'Bienestar bajo (posible depresión)', 3], [50, 'Bienestar reducido', 2], [100, 'Bienestar adecuado', 0]],
    rci: 10, caseness: 50, better: 1, ref: 'Topp CW et al. Psychother Psychosom. 2015;84(3):167-76.',
  },
};

export function score(type, answers) {
  const s = SCALES[type];
  const raw = answers.reduce((a, b) => a + (Number(b) || 0), 0) * (s.scale || 1);
  const [, band, sev] = s.bands.find(([lim]) => raw <= lim) || s.bands[s.bands.length - 1];
  const crisis = type === 'PHQ9' && Number(answers[8]) > 0;
  return { type, name: s.name, score: raw, max: s.max, band, sev, crisis };
}

// Evolución de una escala para un paciente
export function trajectory(type, list) {
  const s = SCALES[type];
  const arr = list.filter((a) => a.type === type).sort((a, b) => a.date.localeCompare(b.date));
  if (!arr.length) return null;
  const first = score(type, arr[0].answers), last = score(type, arr[arr.length - 1].answers);
  const change = last.score - first.score;
  const improved = change * s.better >= s.rci;
  const worse = -change * s.better >= s.rci;
  const caseFirst = s.better < 0 ? first.score >= s.caseness : first.score < s.caseness;
  const caseLast = s.better < 0 ? last.score >= s.caseness : last.score < s.caseness;
  let status = arr.length < 2 ? 'linea_base' : improved ? (caseFirst && !caseLast ? 'recuperacion' : 'mejoria') : worse ? 'deterioro' : 'sin_cambio';
  return {
    type, name: s.name, max: s.max, first: { ...first, date: arr[0].date }, last: { ...last, date: arr[arr.length - 1].date }, change, status,
    history: arr.map((a) => ({ date: a.date, ...score(type, a.answers) })), n: arr.length,
  };
}

export const STATUS_LABEL = {
  linea_base: ['Línea base', 'neutral'], mejoria: ['Mejoría fiable', 'ok'], recuperacion: ['Recuperación', 'ok'],
  deterioro: ['Deterioro fiable', 'bad'], sin_cambio: ['Sin cambio fiable', 'neutral'],
};

// Impresión clínica global de severidad (CGI-S)
export const CGI = ['', 'Normal, no enfermo', 'Al límite', 'Levemente enfermo', 'Moderadamente enfermo', 'Marcadamente enfermo', 'Gravemente enfermo', 'Entre los más graves'];

// Líneas de ayuda por país
export const CRISIS = {
  EC: [{ name: 'Emergencias ECU 911', tel: '911', detail: 'Emergencias las 24 horas' }, { name: 'Línea 171, opción 6', tel: '171', detail: 'Atención psicológica del Ministerio de Salud Pública' }],
  CO: [{ name: 'Línea 106', tel: '106', detail: 'Escucha y orientación en salud mental' }, { name: 'Línea 192, opción 4', tel: '192', detail: 'Salud mental del Ministerio de Salud' }, { name: 'Emergencias 123', tel: '123', detail: 'Emergencias las 24 horas' }],
};

// Marco normativo resumido (se muestra en Ajustes y consentimientos)
export const NORMATIVA = {
  EC: {
    pais: 'Ecuador', moneda: 'USD', prefijo: '593',
    datos: 'Ley Orgánica de Protección de Datos Personales (LOPDP, R.O. 459 de 26-may-2021) y su Reglamento: los datos de salud son categoría especial y requieren consentimiento explícito, finalidad determinada y medidas de seguridad reforzadas.',
    historia: 'Reglamento de Información Confidencial en el Sistema Nacional de Salud (Acuerdo Ministerial 5216) y normativa de historia clínica del MSP: confidencialidad, acceso restringido y custodia por el profesional.',
    retencion: 15,
  },
  CO: {
    pais: 'Colombia', moneda: 'COP', prefijo: '57',
    datos: 'Ley 1581 de 2012 y Decreto 1377 de 2013: los datos de salud son datos sensibles; se requiere autorización previa, expresa e informada.',
    historia: 'Ley 1090 de 2006 (secreto profesional del psicólogo), Resolución 1995 de 1999 y Resolución 839 de 2017 (conservación de la historia clínica, 15 años desde la última atención) y Ley 1616 de 2013 de salud mental.',
    retencion: 15,
  },
};

export const CONSENTS = {
  datos: { title: 'Tratamiento de datos personales y de salud', version: '1.0', text: (p, n) => `Autorizo a ${p.name} a tratar mis datos personales, incluidos datos de salud (categoría especial), con la única finalidad de brindarme atención psicológica, gestionar mis citas y llevar mi historia clínica. Conozco mis derechos de acceso, rectificación, actualización, eliminación, oposición y portabilidad, que puedo ejercer escribiendo a ${p.email}. ${n.datos}` },
  informado: { title: 'Consentimiento informado para psicoterapia', version: '1.0', text: (p) => `Entiendo que la psicoterapia es un proceso voluntario y que puedo terminarlo cuando lo decida. Lo que comparta es confidencial y está protegido por el secreto profesional, con los límites que fija la ley: riesgo grave para mi vida o la de terceros, sospecha de violencia contra niñas, niños o adolescentes, o una orden judicial. Las sesiones duran alrededor de 50 minutos.` },
  online: { title: 'Atención en línea', version: '1.0', text: () => 'Para sesiones en línea me conectaré desde un lugar privado, con buena conexión, y no grabaré la sesión. Si la conexión se cae, la profesional me llamará por teléfono.' },
  cancelacion: { title: 'Política de cancelación', version: '1.0', text: (p, n, pol) => `Puedo cancelar o reprogramar sin costo con al menos ${pol?.cancelHours ?? 24} horas de anticipación. Las inasistencias sin aviso pueden cobrarse.` },
};
