# PSICOMAR V2 — auditoría y migración

Base auditada: 0961bc9, 28/09/2026. Rama: feat/psicomar-platform-v2.

## Baseline verificado
- Next 16.3.0 / React 19.2.8, App Router, Drizzle / postgres.js. Leída la documentación instalada de formularios, handlers, auth y proxy.
- npm ci correcto; lint sin errores. Build compila y verifica TypeScript, pero falla al recolectar páginas sin DATABASE_URL.
- Producción abierta en navegador: home y selector de WhatsApp funcionan; no se enviaron formularios ni se modificaron datos.
- Header con 7 enlaces; entre 768 y 1023 px oculta tanto navegación como menú móvil (hallazgo por código).
- Home extensa, bifurcación secundaria, textos que mezclan marca institucional y academia. Fotos y logo auténticos reutilizables.
- Email sin Resend configurado informa éxito ficticio y registra destinatario en consola. Corregir.
- DAL confía en rol firmado hasta expiración; comprobar usuario vigente y revocación.
- No hay rate limiting persistente en login/contacto. Agregar.
- Repo no contiene credenciales de Neon, Gmail, MP, Blob privado o Vercel disponibles para esta ejecución.

## Existente vs nuevo
| Área | Existente | Evolución |
|---|---|---|
| Marketing | Home, equipo, blog, contacto, SEO | PSICOMAR institucional; Terapia y Academia; conservar rutas |
| Terapia | WhatsApp con elección de profesional | Solicitud administrativa, asignación y abono manual previo a confirmación |
| Admin | CRUD de contenidos | Admisiones, ventas, LMS, certificados, cupones, configuración |
| Autenticación | JWT, bcrypt, admin | Rol profesional, registro, recuperación, revocación |
| Academia | Catálogo | Compra, contenidos protegidos, progreso, evaluación, certificados |
| Pagos | No implementados | MP verificado por servidor, transferencia privada, aprobación idempotente |
| Email | Resend | Proveedor desacoplado Gmail OAuth/SMTP, estados reales |
| Archivos | Imágenes públicas | Separar archivos pagos y comprobantes en Blob privado |

## Orden y estrategia
A auditoría; B identidad y navegación; C admisiones; D auth; E LMS; F herramientas; G supervisiones; H pagos; I métricas; J QA.
Dependencias compartidas de base, autorización y pagos se implementan antes de habilitar módulos que las requieren.
Migración incremental generada desde snapshot existente. No aplicar a producción. No reemplazar DB real por seeds. Base local vacía con contenido de seed identificado como prueba; no representa ediciones actuales de Neon.
Preview Vercel debe apuntar a una rama/base Neon separada y storage privado de prueba. Nunca reutilizar silenciosamente DATABASE_URL de producción.

## Puertas de entrega
No merge ni deploy de producción. Preview pendiente de Vercel y DB aislada. Integraciones reales requieren credenciales test y QA de proveedor. Ninguna función se considera verificada solo por compilar.
