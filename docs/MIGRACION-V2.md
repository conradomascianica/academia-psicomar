# Migración incremental V2

## Archivos

- `0000_inicial.sql`: baseline existente, no nuevo.
- `0001_lyrical_thunderbolts.sql`: rol profesional, versión de sesión y verificación de email; admisiones, ofertas, compras, cupones, archivos privados, progreso, intentos, certificados, tokens, límites, configuración, eventos, correos y métricas.
- `0002_clever_vin_gonzales.sql`: encuentros de supervisión educativa.

No hay `DROP TABLE`, reemplazo de contenido real ni migración automática al iniciar la aplicación. Las tablas nuevas son aditivas. Los precios nuevos se guardan en centavos ARS; los precios editoriales heredados están en pesos. `Preparar ofertas del catálogo` convierte los importes una sola vez, no duplica claves y deja todo nuevo inactivo.

## Base vacía

Para una base realmente nueva y aislada, configurar `DATABASE_URL` y ejecutar `npm run db:migrate`. El seed existente carga contenido de referencia, no la última edición de producción. Se utiliza solo en las pruebas locales.

## Base existente

El proyecto anterior permitía `db:push`; no asumir que existe o coincide la tabla `drizzle.__drizzle_migrations`.

1. Obtener backup/snapshot de Neon antes de cualquier cambio en una copia o en producción autorizada.
2. Consultar el esquema y el registro de migraciones **en modo lectura**. Comparar la estructura actual con `0000_inicial.sql` y su snapshot.
3. Si el baseline ya está registrado correctamente, aplicar solo los pendientes mediante Drizzle en la copia.
4. Si las tablas del baseline existen pero no su registro, **no ejecutar el migrador completo ni marcar el baseline por suposición**. Preparar una alineación del historial después de verificar todas las tablas/columnas/índices. Requiere acceso a esa copia; no pudo verificarse aquí.
5. Revisar y aplicar V2 en la copia, con el cambio de enum en una transacción/fase compatible con la versión PostgreSQL. Comprobar conteos y contenidos anteriores antes/después.
6. Validar usuarios existentes, login Admin, blog, equipo, catálogo y SEO. Preparar ofertas en Admin, completar contenido y después habilitarlas.
7. Promover a producción únicamente tras aceptación de preview y autorización explícita.

## Rollback

Revertir el deployment al commit anterior; conservar las tablas aditivas y el backup. No eliminar compras, certificados ni datos administrativos para deshacer una publicación. La rama anterior ignora las tablas nuevas. Si ya hubo escrituras, evaluar compatibilidad antes de restaurar snapshots para no perderlas.

## Resultados locales

Las migraciones se aplicaron correctamente sobre PGlite vacío. No demuestra compatibilidad con un esquema de producción desconocido ni comportamiento bajo alta concurrencia. La QA usa `PSICOMAR_LOCAL_TEST=1`, que habilita statements preparados y un worker de build para las restricciones de PGlite; Vercel mantiene el comportamiento postgres.js adecuado para el pooler Neon.
