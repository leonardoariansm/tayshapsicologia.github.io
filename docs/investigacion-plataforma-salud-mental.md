# Investigación: plataforma de citas y gestión clínica para psicología

Documento de soporte para la plataforma `/plataforma` de la consulta de **Ps. Cl. Salomé Argoti** (Quito, Ecuador). Resume qué hacen bien los sistemas de referencia, qué exige la normativa y qué decisiones de diseño tomamos.

> Resumen orientativo, no asesoría legal. Antes de operar con pacientes reales conviene validar el texto de los consentimientos y la política de datos con un abogado en Ecuador.

## 1. Punto de partida

- **Gemelo Salud** no existe como repositorio de código; está publicado como artifact ("Gemelo Salud Demo"). De su módulo de Salud Mental reutilizamos: los textos en español de PHQ-9, GAD-7 y WHO-5, las bandas de severidad, el cálculo de cambio clínicamente fiable (RCI) y recuperación, la alerta por la pregunta 9 del PHQ-9, el plan de seguridad (modelo Stanley-Brown), las notas de sesión con CGI-S y las líneas de crisis de Ecuador.
- **Portafolio de Salomé (2026)**: psicóloga clínica PUCE, práctica integradora (TCC, terceras generaciones, humanista y psicodinámico), especialización en duelo y tanatología, psicooncología, neurodesarrollo y neurodegeneración; maestría en Seguridad y Salud Ocupacional en curso. Los servicios, áreas y formación de la plataforma salen de ahí.
- El sitio actual (`index.html`) decía "psicoanalista"; el portafolio la describe como psicóloga clínica integradora. La plataforma usa el portafolio. Conviene actualizar el sitio principal en otro cambio.

## 2. Qué ofrecen los sistemas de referencia

Revisamos SimplePractice, Jane, TherapyNotes, Doctoralia y comparativas de 2026 (Capterra, Software Advice). Las funciones que más valoran las consultas pequeñas:

| Función | Por qué importa | En la plataforma |
|---|---|---|
| Reserva en línea con horarios reales | Quita idas y vueltas por WhatsApp | Página pública `#/reservar` con disponibilidad, anticipación mínima y pausas |
| Confirmación y recordatorios | Los recordatorios reducen inasistencias | Recordatorio por WhatsApp con un clic y archivo `.ics` con alarma 24 h |
| Formulario de ingreso y consentimientos digitales | Evita papel y deja constancia | Datos de ingreso y 3 a 4 consentimientos versionados en la reserva |
| Plantillas de notas (SOAP, DAP, BIRP) | Velocidad y consistencia | Nota integradora, SOAP, DAP, BIRP e intervención en crisis (PAP) |
| Notas de proceso separadas | Las impresiones personales no forman parte del registro compartible | Campo privado, cifrado, que no se imprime ni se exporta |
| Medición basada en resultados | Detecta deterioro a tiempo; se alinea con su principio de "medición de resultados" | PHQ-9, GAD-7 y WHO-5 con gráfico, RCI y estado (mejoría, recuperación, deterioro) |
| Gestión de riesgo | Responsabilidad clínica | Alerta por ítem 9, nivel de riesgo, plan de seguridad imprimible |
| Registro de auditoría | Exigencia de confidencialidad y defensa profesional | Bitácora encadenada con SHA-256 y verificación de integridad |
| Cobros simples | La mayoría de consultas privadas no facturan a aseguradoras | Estado de pago por sesión, medios de pago, exportación CSV |

## 3. Marco normativo

### Ecuador (país por defecto)
- **Ley Orgánica de Protección de Datos Personales (LOPDP)**, R.O. Suplemento 459, 26-may-2021, y su Reglamento. Los datos de salud son categoría especial: requieren consentimiento explícito, finalidad determinada, minimización y medidas de seguridad. El titular tiene derechos de acceso, rectificación, eliminación, oposición y portabilidad.
- **Acuerdo Ministerial 5216**, Reglamento de Información Confidencial en el Sistema Nacional de Salud: confidencialidad de la historia clínica y acceso restringido.
- Normativa de historia clínica del MSP (instructivos de 2020): la historia es del paciente, la custodia es del profesional y debe ser íntegra y legible.
- Línea de crisis: ECU 911 y Línea 171 opción 6 (atención psicológica del MSP).

### Colombia (configurable en Ajustes)
- Ley 1581 de 2012 y Decreto 1377 de 2013 (datos sensibles); Ley 1090 de 2006 (secreto profesional del psicólogo); Resolución 1995 de 1999 y Resolución 839 de 2017 (historia clínica, conservación 15 años); Ley 1616 de 2013 (salud mental). Líneas 106 y 192 opción 4.

### Cómo se traduce en la plataforma
1. **Consentimiento explícito** para datos de salud, consentimiento informado de psicoterapia (con los límites del secreto profesional), política de cancelación y atención en línea. Cada uno guarda versión, fecha y forma de otorgamiento.
2. **Cifrado en reposo**: la información clínica se guarda cifrada con AES-GCM 256; la clave se deriva del PIN (PBKDF2-SHA-256, 310.000 iteraciones) y nunca se guarda.
3. **Solicitudes cifradas de extremo a extremo**: la página pública cifra cada solicitud con la clave pública RSA-OAEP de la profesional; solo se lee después de desbloquear.
4. **Mínima exposición pública**: la agenda pública solo conoce horarios ocupados, sin nombres.
5. **Integridad**: notas firmadas con hash, correcciones solo por adenda, bitácora encadenada.
6. **Portabilidad**: exportación JSON de los datos de un paciente (sin notas de proceso).
7. **Bloqueo por inactividad** configurable.

## 4. Siguientes pasos recomendados
1. **Backend** (por ejemplo Supabase en una región con buen acuerdo de tratamiento de datos) para que las reservas lleguen desde cualquier dispositivo. El punto de integración está marcado con `TODO producción` en `plataforma/js/booking.js`. Mantener el cifrado del lado del cliente.
2. Recordatorios automáticos por WhatsApp Business API o correo.
3. Videollamada integrada o enlace por cita.
4. Facturación electrónica SRI si el volumen lo justifica.
5. Escalas adicionales según su práctica: PG-13-R (duelo prolongado), Maslach o CBI (burnout), MoCA (deterioro cognitivo; requiere certificación de uso).
6. Revisión legal del texto de consentimientos y de la política de privacidad.

## Fuentes
- [LOPDP, texto (Consejo de Comunicación)](https://consejodecomunicacion.gob.ec/wp-content/uploads/downloads/2021/07/lotaip/Ley%20Org%C3%A1nica%20de%20Protecci%C3%B3n%20de%20Datos%20Personales.pdf)
- [Reglamento de la LOPDP (ESPOL)](https://www.dspace.espol.edu.ec/bitstream/123456789/58917/1/REGLAMENTO%20GENERAL%20DE%20LA%20LEY%20ORG%C3%81NICA%20DE%20PROTECCI%C3%93N%20DE%20DATOS%20PERSONALES.pdf)
- [Acuerdo Ministerial 5216, información confidencial en el SNS](https://www.salud.gob.ec/wp-content/uploads/2022/09/A.M.-5216-Reglamento-de-informacion-confidencial-en-SNS.pdf)
- [Instructivo de historia clínica MSP, 2020](https://www.salud.gob.ec/wp-content/uploads/2020/12/Instructivo-de-Aplicacion_historia_clinica_doc-Octubre-2020.pdf)
- [Política de tratamiento de datos del MSP](https://www.salud.gob.ec/?p=80091)
- [Ley 1090 de 2006 (Colpsic)](https://www.colpsic.org.co/wp-content/uploads/2023/09/Ley-1090-2006-Psicologia.pdf)
- [Protección de datos de pacientes en Colombia (Medesk)](https://www.medesk.net/es/blog/proteccion-datos-pacientes-colombia/)
- [SimplePractice vs Jane, Capterra 2026](https://www.capterra.com/compare/130710-178984/SimplePractice-vs-Jane-App)
- [Guía de software de terapia 2026 (Alleva)](https://helloalleva.com/behavioral-health-technology/best-therapy-software-buyers-guide/)
- Kroenke K et al. PHQ-9. J Gen Intern Med 2001. Spitzer RL et al. GAD-7. Arch Intern Med 2006. Topp CW et al. WHO-5. Psychother Psychosom 2015. Jacobson NS, Truax P. J Consult Clin Psychol 1991 (RCI). Stanley B, Brown GK. Safety Planning Intervention, 2012.
