# Salito · Plataforma de la consulta de Salomé Argoti

Agenda en línea, historia clínica cifrada, escalas de resultado y trazabilidad. HTML, CSS y JavaScript sin dependencias ni compilación: funciona tal cual en GitHub Pages.

- **Panel profesional:** `/plataforma/` (pide PIN)
- **Reservas para pacientes:** `/plataforma/#/reservar` (los botones "Agenda tu sesión" del sitio ya apuntan aquí)

## Probarla
```bash
python3 -m http.server 8000   # desde la raíz del repo
# abrir http://localhost:8000/plataforma/
```
La primera vez pide crear un PIN (6 dígitos o más) y ofrece cargar pacientes **ficticios** de demostración.

## Módulos
| Pantalla | Qué hace |
|---|---|
| Inicio | Sesiones del día, pendientes (solicitudes, riesgo, escalas, notas sin firmar, citas sin cerrar), indicadores del mes |
| Agenda | Vista día y semana, horario de atención, crear y reprogramar citas, citas recurrentes, bloqueo de días, confirmación de solicitudes web, recordatorio por WhatsApp y `.ics` |
| Pacientes | Búsqueda y filtros; ficha con resumen, anamnesis, notas (5 formatos), escalas, plan de seguridad, consentimientos, citas y pagos, registro de accesos |
| Cobros | Cobrado y pendiente por mes, por servicio, exportación CSV |
| Trazabilidad | Bitácora encadenada con SHA-256 y verificación de integridad |
| Ajustes | Perfil, horarios, servicios, país (Ecuador o Colombia), políticas, respaldo cifrado, cambio de PIN |

## Seguridad
- Bóveda clínica cifrada con AES-GCM 256; clave derivada del PIN con PBKDF2 (310.000 iteraciones).
- Solicitudes de la web cifradas con la clave pública RSA-OAEP de la profesional.
- La agenda pública solo expone horarios ocupados, sin nombres.
- Notas firmadas con hash; correcciones por adenda. Notas de proceso privadas que no se imprimen ni exportan.
- Bloqueo automático por inactividad.

## Limitación actual
Los datos viven en el navegador de la profesional. Las reservas solo llegan si la persona reserva desde el mismo navegador (útil para demostrar). Para producción hace falta un backend que reciba las solicitudes cifradas; el punto de integración está marcado con `TODO producción` en `js/booking.js`. Ver `docs/investigacion-plataforma-salud-mental.md`.

## Archivos
- `js/core.js`: cifrado, almacenamiento, trazabilidad, disponibilidad
- `js/scales.js`: PHQ-9, GAD-7, WHO-5, RCI, líneas de crisis, normativa, consentimientos
- `js/seed.js`: perfil de Salomé (desde su portafolio) y datos de demostración ficticios
- `js/app.js`: panel clínico
- `js/booking.js`: página pública de reservas
- `js/ui.js`: componentes, iconos y gráficos
