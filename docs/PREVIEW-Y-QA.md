# PSICOMAR V2 — entrega y validación

Trabajo en `feat/psicomar-platform-v2`, sobre `0961bc9`. No se modificó producción ni se aplicaron migraciones a Neon.

## Qué está implementado

- Home con Terapia / Academia, navegación responsive y redirecciones de URLs anteriores.
- Solicitud administrativa de admisión, asignación Kiara/Maite, control de abono, Meet, zona horaria y protección contra edición simultánea. Sin agenda de pacientes regulares ni historias clínicas.
- Cuenta profesional, registro, ingreso, recuperación, verificación de email y revocación de sesiones por versión.
- Catálogo de ofertas separado del contenido editorial existente; módulos, clases, videos, archivos privados, progreso, evaluación configurable y certificado PDF verificable.
- Acceso a cursos de 30 días desde la aprobación. Herramientas y certificados persistentes. Se verifica la titularidad en cada descarga.
- Checkout de una propuesta, precios independientes por medio, cupones limitados, pedidos y timeline. MP consulta el pago en servidor y valida firma, importe, moneda, cobrador y entorno. Transferencias habilitan contenido únicamente tras revisión manual.
- Supervisiones individuales de 30/60 minutos y grupal mensual. Coordinación por WhatsApp; encuentros educativos registrados por Admin después del pago, visibles en la cuenta y con notificaciones. No se vende renovación automática.
- Panel con filtros, indicadores administrativos y educativos, configuración bancaria y estado real de correos.
- Proveedores Gmail OAuth, SMTP Gmail y Resend; cola idempotente. Avisos de vencimiento 7/3/1 días, recordatorios de supervisión y endpoint diario protegido. Los envíos ambiguos pasan a revisión manual para evitar duplicados.

## Estado verificado

Ejecución final: 29/09/2026 02:39 UTC (28/09 23:39 Argentina), base local nueva. Build, TypeScript y lint correctos; 8 pruebas unitarias, integración DB y 13 grupos de comprobaciones HTTP pasaron.

Ver `tests/rules.test.ts`, `tests/commerce.integration.ts` y `tests/http.integration.ts`. Las pruebas usan PostgreSQL embebido PGlite, usuarios y compras ficticios locales; no envían correos ni realizan pagos.

| Prueba | Estado |
|---|---|
| TypeScript y lint | Pasaron en la ejecución local |
| Build Next de producción | Pasó con base local aislada |
| Reglas de admisión, vencimiento, evaluación, descuentos, password, sesión y firma MP | 8 pruebas pasaron |
| Aprobación, idempotencia, monto/moneda/cobrador, titularidad, transferencia rechazada, reembolso y recordatorios | Integración DB pasó |
| Rutas públicas, redirects, Admin protegido, PDFs y comprobantes ajenos, solicitud repetida, abono obligatorio | HTTP pasó |
| Login con retorno a checkout, registro sin escalamiento de rol, progreso, evaluación y certificado único | HTTP pasó |
| Vencimiento sin pérdida del PDF, reset de un uso e invalidación de sesión | HTTP pasó |
| Cron sin autorización y MP sin configuración | HTTP pasó |
| Límite de tres intentos y replay del examen; verificación de email de un uso | HTTP pasó |
| Coordinación de supervisión, titularidad y límite de encuentros individuales | HTTP pasó |
| PDF con nombre y título largos | Renderizado y revisado visualmente |
| Navegador interactivo, teclado, contraste y breakpoints | PENDIENTE: el entorno impide iniciar el socket del navegador (`Operation not permitted`) |
| Pago sandbox real, webhook externo, transferencia con Blob real y entrega Gmail | PENDIENTE: faltan credenciales de prueba |
| Concurrencia real de PostgreSQL/Neon y carga | PENDIENTE: PGlite no reemplaza esta prueba |

No se declara aprobada la QA visual. Los breakpoints a revisar son 360, 390, 430, 768, 1024 y 1440 px. No hay medición Lighthouse ni de lectores de pantalla todavía.

## Cómo repetir las pruebas

Node 20 o superior; en esta ejecución se usó Node 24. Instalar con `npm ci` y ejecutar:

```bash
npm test
npm run typecheck
npm run lint
npm run qa:local
```

`qa:local` crea una base **nueva y desechable**, aplica migraciones y seeds locales, compila, genera fixtures, inicia Next en `127.0.0.1:3001`, ejecuta HTTP y termina sus procesos. No usa la conexión real del proyecto. Requiere poder abrir puertos locales y tener el 3001 libre. El informe queda en `test-results/http-report.json`; los tokens y fixtures de prueba están excluidos de Git. No ejecutar las pruebas de integración sueltas contra una base compartida.

`npm run qa:certificate` genera dos PDFs de ejemplo en `test-results`; renderizar con Poppler y revisar antes de cambiar la plantilla.

## Bloqueos de publicación comprobados

La conexión GitHub está instalada en `conradomascianica`, pero el repositorio `academiapsicomar/academia-psicomar` devuelve `push: false`. La conexión Vercel devuelve cero equipos y cero proyectos. Por eso no se subió la rama, no se abrió PR y no existe una URL de preview V2 publicada.

Para continuar: dar acceso de escritura al repositorio a la cuenta conectada (o conectar la cuenta con acceso), y conectar en Vercel la cuenta/equipo propietario de `academia-psicomar`. No hace falta enviar contraseñas o tokens por chat.

## Preparar una preview segura

1. Crear una rama/base Neon **independiente**. Puede contener una copia revisada del contenido editorial, pero no datos personales reales para pruebas.
2. Revisar el historial de migraciones de esa copia según `MIGRACION-V2.md`. No ejecutar `db:push` a ciegas.
3. Configurar las variables de Preview según el ejemplo del repositorio. Confirmar la separación de DB y recién entonces poner `PSICOMAR_PREVIEW_DATABASE_CONFIRMED=true`. La aplicación falla explícitamente en Preview si falta esta confirmación.
4. Usar un Blob privado de prueba distinto del store público de imágenes. No subir pagos ni comprobantes a `public/`.
5. Publicar la rama como Preview del **proyecto existente**, sin `--prod`, sin merge. `VERCEL_URL` determina los enlaces de la preview, con `noindex`.
6. Gmail: crear credenciales OAuth con alcance `https://www.googleapis.com/auth/gmail.send`, obtener refresh token fuera del chat y guardarlo como secreto de Preview. Alternativa: contraseña de aplicación Gmail para SMTP. Probar recepción real y revisar permisos/política de expiración del proyecto OAuth.
7. MP: credenciales y vendedor de prueba, `MP_ENV=test`, secreto de webhook y collector correctos. Configurar `/api/pagos/webhook` y probar approved/pending/rejected, reenvío, importe incorrecto, entorno incorrecto y reembolso. La vuelta a `/checkout/exito` jamás habilita el curso por sí sola.
8. Cron de Vercel corre en producción, no automáticamente en Preview. Probar el endpoint manualmente con su secreto desde un entorno seguro, sin publicar ese secreto. Configuración: una ejecución diaria a las 12:00 UTC (09:00 Argentina).
9. Crear cuentas profesionales de prueba desde Registro y un Admin exclusivo de pruebas. Compartir sus credenciales por un canal privado una vez que exista la preview; no se generó una cuenta externa ficticia para esta entrega.

## Checklist de aceptación en preview

- Terapia: completar desde un móvil; confirmar que no pide motivo clínico; asignar profesional; comprobar rechazo sin abono; verificar email, horario y enlace Meet.
- Profesional: registro → verificación → compra → pago real de prueba → curso; recargar y volver a ingresar; completar contenidos; rendir hasta tres intentos; descargar certificado.
- Transferencia: precios correctos; comprobante PDF/JPG/PNG privado (máximo 3 MB); revisión por Admin; email y acceso después de aprobar; rechazo sin acceso.
- Cambiar de usuario y probar URLs de pedidos, archivos y certificados ajenos. Probar sesión revocada y enlace de reset repetido/vencido.
- Curso vencido: contenido, videos y materiales inaccesibles; certificado ya emitido disponible; herramientas permanentes.
- Supervisión: coordinación manual, encuentro visible solo al titular, dos encuentros para grupal; no promesa de débito recurrente.
- Admin: CRUD editorial, cupones/fechas/límites, precios, archivos, filtros y correos. Si un contenido tiene una oferta asociada, “borrar” lo retira de publicación y desactiva nuevas ventas para conservar compras y accesos existentes.
- Visual: todos los tamaños indicados, menús, foco, teclado, etiquetas, zoom 200%, tablas móviles, formularios, estados vacíos/error y botones pendientes.

## Pendientes que impiden promover a producción

- QA visual y de integraciones reales, incluida prueba de concurrencia/cupos/cupones en Neon.
- Datos comerciales: precios finales, titular/CBU/alias, fechas y enlaces definitivos, materiales y evaluaciones de cada propuesta. Las nuevas ofertas empiezan inactivas.
- Suscripciones recurrentes de supervisión: adaptador de prueba encapsulado, sin activación pública. Requiere implementación/QA específico del ciclo de cobro, renovación y cancelación antes de ofrecerlo.
- Revisión de textos y operación comercial: identidad fiscal, condiciones de cancelación/reembolso y canal de arrepentimiento aplicable. Se quitó del borrador la prohibición general de devoluciones; esto no certifica cumplimiento legal. Referencias primarias revisadas: Ley 24.240 actualizada y Disposición 954/2025 en argentina.gob.ar.
- Resolver retención/eliminación administrativa y política del equipo. Las métricas son agregadas; no incluyen motivo de terapia, diagnóstico ni identidad de visitantes.
- Revocar/rotar secrets antiguos si el equipo confirma exposición. No se rotó ninguno automáticamente. Revisar AUTH_SECRET, DB, tokens Blob, MP y Gmail antes de promoción.
