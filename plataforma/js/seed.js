// Configuración inicial y datos de demostración (todos ficticios).
import { uid, newPatient, addDays, ymd } from './core.js';

export function baseConfig() {
  return {
    version: 1,
    country: 'EC',
    profile: {
      name: 'Ps. Cl. Salomé Argoti', short: 'Salomé Argoti', fullName: 'Taysha Salomé Argoti Narváez', title: 'Psicóloga clínica',
      registro: 'Registro SENESCYT: por completar', city: 'Quito, Ecuador', address: 'Consulta privada en Quito (dirección por confirmar)',
      phone: '593000000000', email: 'salome.argoti27@gmail.com', linkedin: 'https://www.linkedin.com/in/salom%C3%A9-argoti-baaa27263',
      tagline: 'Psicoterapia basada en evidencia, con una mirada humana: acompañar a cada persona desde la ciencia y la empatía.',
      bio: 'Psicóloga clínica graduada de la Pontificia Universidad Católica del Ecuador, con más de 4 años de práctica en psicoterapia individual y grupal con adolescentes, adultos y adultos mayores. Integra la terapia cognitivo-conductual, las terapias de tercera generación y la perspectiva humanista y psicodinámica, eligiendo la intervención según cada persona.',
      approach: 'Cognitivo-conductual · Terceras generaciones (ACT, DBT, mindfulness, CFT) · Humanista · Psicodinámico',
      specialties: ['Duelo y tanatología', 'Psicooncología', 'Neurodesarrollo y neurodegeneración', 'Salud mental ocupacional'],
      populations: ['Adolescentes', 'Adultos', 'Adultos mayores', 'Familias y grupos', 'Equipos e instituciones'],
      areas: ['Ansiedad', 'Depresión y distimia', 'Duelo prolongado', 'Trauma y estrés', 'TDAH, TEA y aprendizaje', 'Deterioro cognitivo', 'Psicooncología', 'Burnout y estrés laboral', 'Regulación emocional'],
      education: [
        ['2025 — en curso', 'Maestría en Seguridad y Salud Ocupacional', 'Universidad Internacional del Ecuador (UIDE)'],
        ['2024 — 2026', 'Diplomado Internacional en Manejo Psicológico del Duelo y Tanatología', 'Grupo Impulsar'],
        ['2024 — 2025', 'Diplomado Internacional en Trastornos del Neurodesarrollo y Neurodegenerativos', 'Orgaepsi'],
        ['2024', 'Diplomado Internacional en Psicología Oncológica', 'Instituto Latinoamericano de Estudios de Posgrado (México)'],
        ['2018 — 2024', 'Psicóloga Clínica', 'Pontificia Universidad Católica del Ecuador'],
      ],
      experience: [
        ['2024 — actualidad', 'Psicóloga clínica particular', 'Consulta privada · Quito'],
        ['2024 — 2025', 'Psicóloga clínica', 'Médical & Care · Quito'],
        ['2024 — 2025', 'Psicóloga DECE', 'Unidad Educativa COMIL No. 10 Abdón Calderón'],
        ['2022', 'Psicóloga clínica (prácticas)', 'Centro de Psicología Aplicada PUCE'],
        ['2022', 'Psicoterapeuta y tallerista (prácticas)', 'Clínica de Bienestar Mental Terralegre'],
      ],
      languages: 'Español (nativo) · Inglés (B2)',
      meetUrl: '',
    },
    services: [
      { id: 'svc_primera', name: 'Primera consulta', minutes: 60, price: 35, color: 'sand', desc: 'Entrevista clínica inicial: motivo de consulta, evaluación y encuadre (objetivos, duración estimada y límites de la confidencialidad).', modalities: ['presencial', 'online'], active: true },
      { id: 'svc_indiv', name: 'Psicoterapia individual', minutes: 50, price: 30, color: 'teal', desc: 'Adolescentes, adultos y adultos mayores. Procesos breves o de mediana duración con objetivos definidos en conjunto.', modalities: ['presencial', 'online'], active: true },
      { id: 'svc_duelo', name: 'Acompañamiento en duelo', minutes: 50, price: 30, color: 'plum', desc: 'Duelo normal, prolongado o traumático, y pérdidas no relacionadas con la muerte.', modalities: ['presencial', 'online'], active: true },
      { id: 'svc_onco', name: 'Psicooncología', minutes: 50, price: 30, color: 'rose', desc: 'Para pacientes con cáncer y sus familias, desde el diagnóstico hasta los cuidados paliativos.', modalities: ['presencial', 'online'], active: true },
      { id: 'svc_eval', name: 'Evaluación y psicodiagnóstico', minutes: 90, price: 60, color: 'sand', desc: 'Entrevista, pruebas psicométricas e informe psicológico clínico o laboral.', modalities: ['presencial'], active: true },
      { id: 'svc_cog', name: 'Estimulación cognitiva', minutes: 50, price: 25, color: 'teal', desc: 'Memoria, atención, funciones ejecutivas y lenguaje, especialmente en adultos mayores.', modalities: ['presencial'], active: true },
    ],
    availability: {
      weekly: { 1: [['09:00', '13:00'], ['15:00', '19:00']], 2: [['09:00', '13:00'], ['15:00', '19:00']], 3: [['15:00', '20:00']], 4: [['09:00', '13:00'], ['15:00', '19:00']], 5: [['09:00', '14:00']], 6: [['09:00', '12:00']] },
      step: 60, buffer: 10, minNoticeHours: 12, horizonDays: 45, blocks: [],
    },
    policies: { cancelHours: 24, reminderHours: 24, lockMinutes: 10, retentionYears: 15 },
    patients: [], appointments: [], notes: [], assessments: [], payments: [], audit: [],
  };
}

const at = (base, days, h, m = 0) => { const d = addDays(base, days); d.setHours(h, m, 0, 0); return d.toISOString(); };

export function demoData() {
  const db = baseConfig();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const P = (o) => { const p = newPatient(o); db.patients.push(p); return p; };
  const consentsAll = (d) => ['datos', 'informado', 'cancelacion'].map((type) => ({ type, version: '1.0', date: d, method: 'Firma en consulta' }));

  const ana = P({ name: 'Ana Lucía Paredes', docId: '1700000001', birth: '1994-03-14', gender: 'Mujer', pronouns: 'ella', phone: '593990000001', email: 'ana.demo@example.com', city: 'Quito', occupation: 'Diseñadora', civil: 'Soltera', emergency: { name: 'Marta Paredes', rel: 'Madre', phone: '593990000101' }, referral: 'Instagram', reason: 'Ansiedad intensa en el trabajo y dificultad para dormir.', status: 'activo', risk: 'bajo', tags: ['Ansiedad'], createdAt: at(today, -84, 10), consents: consentsAll(ymd(addDays(today, -84))), diagnoses: [{ system: 'CIE-10', code: 'F41.1', label: 'Trastorno de ansiedad generalizada', date: ymd(addDays(today, -77)) }], goals: [{ text: 'Dormir al menos 7 horas la mayoría de noches', done: false }, { text: 'Poder hablar de sus límites con su jefa', done: true }] });
  const diego = P({ name: 'Diego Andrade', docId: '1700000002', birth: '1987-08-02', gender: 'Hombre', pronouns: 'él', phone: '593990000002', email: 'diego.demo@example.com', city: 'Quito', occupation: 'Ingeniero', civil: 'Casado', emergency: { name: 'Paula Ríos', rel: 'Esposa', phone: '593990000102' }, referral: 'Recomendación', reason: 'Duelo por la muerte de su padre; pérdida de interés.', status: 'activo', risk: 'moderado', tags: ['Duelo', 'Ánimo'], createdAt: at(today, -70, 10), consents: consentsAll(ymd(addDays(today, -70))), diagnoses: [{ system: 'CIE-10', code: 'F43.2', label: 'Trastorno de adaptación', date: ymd(addDays(today, -63)) }] });
  const vale = P({ name: 'Valentina Cevallos', docId: '1700000003', birth: '2003-11-21', gender: 'Mujer', pronouns: 'ella', phone: '593990000003', email: 'vale.demo@example.com', city: 'Quito', occupation: 'Estudiante universitaria', civil: 'Soltera', emergency: { name: 'Sofía Cevallos', rel: 'Madre', phone: '593990000103' }, referral: 'Página web', reason: 'Tristeza persistente, aislamiento y presión académica.', status: 'activo', risk: 'alto', tags: ['Ánimo', 'Seguimiento cercano'], createdAt: at(today, -56, 10), consents: consentsAll(ymd(addDays(today, -56))), diagnoses: [{ system: 'CIE-10', code: 'F32.1', label: 'Episodio depresivo moderado', date: ymd(addDays(today, -49)) }],
    safety: { warning: ['Dejo de contestar mensajes', 'Duermo más de 11 horas', 'Pienso que soy una carga'], coping: ['Salir a caminar 20 minutos con música', 'Ducha caliente y respiración 4-6', 'Escribir en el diario'], people: ['Camila (amiga) · 099 000 0011', 'Mamá · 099 000 0005'], pros: ['Ps. Cl. Salomé Argoti', 'Línea 171, opción 6'], safe: 'Le pedí a mi mamá que guarde los medicamentos de la casa.', reason: 'Terminar la carrera y viajar con mi hermana.', updated: ymd(addDays(today, -49)) } });
  const patricia = P({ name: 'Patricia Mena', docId: '1700000004', birth: '1971-05-10', gender: 'Mujer', pronouns: 'ella', phone: '593990000004', email: 'patricia.demo@example.com', city: 'Cumbayá', occupation: 'Abogada', emergency: { name: 'Raúl Mena', rel: 'Esposo', phone: '593990000104' }, reason: 'Diagnóstico reciente de cáncer de mama; miedo y dificultad para hablar con sus hijos.', status: 'activo', risk: 'bajo', tags: ['Psicooncología'], createdAt: at(today, -35, 10), consents: consentsAll(ymd(addDays(today, -35))) });
  const lucia = P({ name: 'Lucía Benítez', docId: '1700000005', birth: '1950-01-30', gender: 'Mujer', phone: '593990000005', email: 'lucia.demo@example.com', city: 'Quito', occupation: 'Docente jubilada', emergency: { name: 'Jorge Benítez', rel: 'Hijo (cuidador)', phone: '593990000105' }, reason: 'Olvidos frecuentes; la familia pide valoración y estimulación cognitiva.', status: 'activo', risk: 'bajo', tags: ['Adulto mayor', 'Cognición'], createdAt: at(today, -120, 10), consents: consentsAll(ymd(addDays(today, -120))) });
  const mateo = P({ name: 'Mateo Salazar', docId: '1700000006', birth: '1999-07-07', gender: 'Hombre', phone: '593990000006', email: 'mateo.demo@example.com', city: 'Quito', occupation: 'Músico', reason: 'Bloqueo creativo y consumo de alcohol moderado.', status: 'alta', risk: 'bajo', tags: [], createdAt: at(today, -200, 10), consents: consentsAll(ymd(addDays(today, -200))) });
  P({ name: 'Carolina Ruiz', phone: '593990000007', email: 'carolina.demo@example.com', reason: 'Quiere iniciar terapia por ansiedad; prefiere horario de la tarde.', status: 'lista_espera', risk: 'sin_evaluar', createdAt: at(today, -3, 10), referral: 'WhatsApp' });

  const A = (p, svc, start, status, extra = {}) => {
    const s = db.services.find((x) => x.id === svc);
    const a = { id: uid('cita'), patientId: p.id, serviceId: svc, start, minutes: s.minutes, modality: extra.modality || 'presencial', status, price: s.price, paid: status === 'atendida' ? extra.paid ?? true : false, payMethod: status === 'atendida' ? (extra.payMethod || 'Transferencia') : '', source: extra.source || 'panel', note: extra.note || '', createdAt: start, history: [{ at: start, status, by: 'Salomé Argoti' }] };
    db.appointments.push(a); return a;
  };
  const N = (p, a, fields, cgi, extra = {}) => db.notes.push({ id: uid('nota'), patientId: p.id, apptId: a?.id || null, date: a ? a.start : new Date().toISOString(), format: extra.format || 'integ', fields, cgi_s: cgi, risk: extra.risk || 'sin_riesgo', private: extra.private || '', signed: extra.signed !== false, signedAt: a ? a.start : null, hash: null, addenda: [] });
  const T = (p, type, days, answers) => db.assessments.push({ id: uid('esc'), patientId: p.id, type, date: ymd(addDays(today, days)), answers, source: 'En consulta' });

  // Ana: ansiedad, semanal, mejoría
  const anaNotes = [
    ['Primera entrevista. Llega por insomnio y preocupación constante por el trabajo. Describe a la jefa como "imposible de complacer".', 'Encuadre semanal, presencial. Aplicar GAD-7 y PHQ-9.'],
    ['Registro de pensamientos: aparece "si me equivoco me van a despedir". Psicoeducación sobre el ciclo de la ansiedad.', 'Registro de pensamientos tres veces por semana.'],
    ['Reestructuración cognitiva de la catastrofización. Practica respiración diafragmática.', 'Exposición gradual: hablar en la reunión semanal.'],
    ['Pudo poner un límite en una reunión. Ansiedad menor durante la semana.', 'Higiene del sueño; mindfulness 10 minutos al día.'],
    ['Duerme mejor. Aparece tristeza al hablar de su abuela.', 'Explorar el duelo por la abuela; plan de prevención de recaídas.'],
  ];
  anaNotes.forEach(([obs, plan], i) => { const a = A(ana, i ? 'svc_indiv' : 'svc_primera', at(today, -77 + i * 14, 10), 'atendida'); N(ana, a, { motivo: i ? '' : ana.reason, desarrollo: obs, intervencion: i ? 'TCC: reestructuración cognitiva y exposición gradual.' : 'Entrevista inicial y encuadre.', plan }, [5, 5, 4, 4, 3][i]); });
  T(ana, 'GAD7', -77, [3, 3, 2, 3, 2, 2, 2]); T(ana, 'PHQ9', -77, [1, 2, 3, 2, 1, 1, 2, 0, 0]); T(ana, 'GAD7', -49, [2, 2, 2, 2, 1, 2, 1]); T(ana, 'GAD7', -21, [1, 1, 1, 2, 1, 1, 1]); T(ana, 'PHQ9', -21, [1, 1, 1, 1, 0, 1, 1, 0, 0]); T(ana, 'WHO5', -21, [3, 2, 3, 3, 3]);
  A(ana, 'svc_indiv', at(today, 1, 10), 'confirmada');
  A(ana, 'svc_indiv', at(today, 8, 10), 'confirmada');

  // Diego: duelo
  [-63, -56, -49, -35, -28, -14, -7].forEach((d, i) => {
    const st = d === -35 ? 'no_asistio' : 'atendida';
    const a = A(diego, i ? 'svc_duelo' : 'svc_primera', at(today, d, 17), st, { modality: 'online', paid: d !== -7 });
    if (st === 'atendida') N(diego, a, { desarrollo: ['Relata la muerte del padre hace 4 meses. Dice que "no tiene tiempo para estar triste".', 'Habla del último viaje con su padre. Llora por primera vez en sesión.', 'Enojo con sus hermanos por la herencia.', 'Faltó la semana anterior sin avisar; lo relaciona con el aniversario del diagnóstico del padre.', 'Recupera recuerdos de infancia; menos irritabilidad en casa.', 'Visitó la tumba del padre con su hija.', 'Describe un sueño con el padre "tranquilo".'][i], intervencion: 'Tareas del duelo; trabajo con la culpa (tanatología).', plan: 'Continuar semanal en línea.' }, [5, 5, 5, 5, 4, 4, 4][i]);
  });
  T(diego, 'PHQ9', -63, [2, 2, 2, 2, 1, 2, 2, 1, 0]); T(diego, 'PHQ9', -28, [2, 2, 1, 2, 1, 1, 1, 1, 0]); T(diego, 'PHQ9', -7, [1, 2, 1, 1, 1, 1, 1, 0, 0]);
  A(diego, 'svc_duelo', at(today, 0, 17), 'confirmada', { modality: 'online' });
  A(diego, 'svc_duelo', at(today, 7, 17), 'solicitada', { modality: 'online', source: 'web' });

  // Valentina: riesgo
  [-49, -42, -35, -28, -21, -14, -7].forEach((d, i) => {
    const a = A(vale, i ? 'svc_indiv' : 'svc_primera', at(today, d, 15), 'atendida', { paid: i !== 6 });
    N(vale, a, { desarrollo: ['Evaluación inicial. PHQ-9 de 17 con respuesta positiva en la pregunta 9: ideación pasiva, sin plan ni intención. Se construye plan de seguridad con ella y se contacta a la madre con su consentimiento.', 'Aislamiento con amigas; mucha carga académica.', 'Se pregunta qué espera su familia de ella. Duerme 5 horas.', 'Retomó el ejercicio con una amiga. Mejor ánimo en las mañanas.', 'Revisión del plan de seguridad: no lo ha necesitado.', 'Semana difícil por exámenes; usó las estrategias del plan.', 'Ánimo más estable. Duerme 7 horas la mayoría de noches.'][i], intervencion: i ? 'Activación conductual y CFT; seguimiento del riesgo.' : 'Evaluación de riesgo y plan de seguridad.', plan: i ? 'Seguimiento semanal; revisar riesgo en cada sesión.' : 'Interconsulta con psiquiatría. Seguimiento semanal.' }, [5, 5, 5, 4, 4, 4, 3][i], { risk: i < 2 ? 'moderado' : 'bajo' });
  });
  T(vale, 'PHQ9', -49, [2, 2, 2, 3, 2, 2, 2, 1, 1]); T(vale, 'GAD7', -49, [2, 1, 2, 1, 1, 1, 1]); T(vale, 'PHQ9', -28, [2, 2, 2, 2, 1, 2, 1, 1, 0]); T(vale, 'PHQ9', -7, [1, 1, 1, 2, 1, 1, 1, 0, 0]); T(vale, 'WHO5', -7, [2, 2, 3, 2, 3]);
  A(vale, 'svc_indiv', at(today, 0, 15), 'confirmada');
  A(vale, 'svc_indiv', at(today, 7, 15), 'confirmada');

  // Pareja
  [-35, -21, -7].forEach((d, i) => { const a = A(patricia, 'svc_onco', at(today, d, 18), 'atendida', { paid: true }); N(patricia, a, { desarrollo: ['Inicia quimioterapia en dos semanas. Mucho miedo; no sabe cómo contarlo a sus hijos.', 'Preparó con apoyo la conversación con sus hijos; fue mejor de lo esperado.', 'Cansancio por el tratamiento. Practica mindfulness y aceptación (ACT).'][i], intervencion: 'Afrontamiento del diagnóstico; comunicación familiar.', plan: 'Cada dos semanas, ajustando al calendario de quimioterapia.' }, 3); });
  A(patricia, 'svc_onco', at(today, 7, 18), 'confirmada');

  // Lucía: análisis 2 veces por semana
  for (let w = 0; w < 8; w++) for (const off of [0, 3]) {
    const d = -56 + w * 7 + off; if (d >= 0) continue;
    const a = A(lucia, 'svc_cog', at(today, d, 9), d === -24 ? 'cancelada' : 'atendida', { paid: true });
    if (a.status === 'atendida' && w % 2 === 0 && off === 0) N(lucia, a, { desarrollo: 'Tareas de memoria de trabajo y fluidez verbal. Buena disposición; se fatiga después de 35 minutos.', intervencion: 'Estimulación cognitiva y psicoeducación al cuidador.', plan: 'Continuar dos veces por semana; tareas en casa con su hijo.' }, 3);
  }
  A(lucia, 'svc_cog', at(today, 2, 9), 'confirmada'); A(lucia, 'svc_cog', at(today, 4, 9), 'confirmada');

  // Mateo (alta)
  const am = A(mateo, 'svc_indiv', at(today, -150, 16), 'atendida'); N(mateo, am, { desarrollo: 'Cierre del proceso. Retomó la composición y redujo el consumo.', intervencion: 'Cierre.', plan: 'Alta. Puede volver cuando lo necesite.' }, 2);

  // Una nota sin firmar (pendiente)
  const pend = db.appointments.find((a) => a.patientId === diego.id && a.status === 'atendida' && a.start > at(today, -8, 0));
  const n = db.notes.find((x) => x.apptId === pend?.id); if (n) { n.signed = false; n.signedAt = null; }

  // Bloqueo de un feriado de ejemplo
  db.availability.blocks.push({ date: ymd(addDays(today, 12)), reason: 'Clase de la maestría' });
  return db;
}
