# Bitacora QuillaMap - Reportes con evidencia

Fecha: 3 de agosto de 2026

## Resumen

Se integro el flujo de evidencia opcional para reportes ciudadanos, empezando por los reportes de sombra. El flujo final queda asi:

1. El usuario toca `Reportar sombra`.
2. Selecciona el punto en el mapa.
3. La app pregunta si quiere adjuntar evidencia fotografica.
4. El usuario puede tomar foto, elegir desde galeria, reportar sin evidencia o cancelar.
5. El frontend crea primero el reporte en JSON con `POST /reports`.
6. Si hay foto, el frontend sube la evidencia despues con `PATCH /reports/:id/evidence` usando multipart y el campo `file`.
7. El backend guarda la imagen en Supabase Storage y persiste `imageUrl` en el reporte.

Esto corrige la falta de concordancia que producia `400 Bad Request`: la foto ya no se envia dentro del JSON inicial del reporte. En Expo Web se transforma la URI de imagen a `Blob/File` antes de adjuntarla al `FormData`; en runtime nativo se mantiene el formato `{ uri, name, type }`.

## Backend

Repositorio: `C:\dev\quillamap-backend`

### Archivos nuevos

- `src/contracts/report.contract.ts`: define contratos compartidos para crear reportes y devolver reportes con `imageUrl`.
- `src/features/evidence/evidence.constants.ts`: centraliza bucket, tipos MIME permitidos, extensiones y tamano maximo de evidencia.
- `src/features/evidence/evidence.module.ts`: expone el servicio de storage para otros modulos.
- `src/features/evidence/supabase-storage.service.ts`: sube imagenes al bucket `evidence` de Supabase Storage y devuelve URL publica.
- `src/types/express-multer.d.ts`: agrega tipado local para `Express.Multer.File`.
- `supabase/migrations/20260731120000_create_evidence_bucket.sql`: crea/configura el bucket publico `evidence`, limite de 5 MB y politicas de lectura/subida.
- `test/reports-evidence.e2e-spec.ts`: documenta el flujo E2E esperado para subir evidencia, rechazar archivos invalidos, bloquear reportes ajenos y manejar reportes inexistentes.

### Archivos modificados

- `src/features/reports/dto/create-report.dto.ts`: acepta `imageUrl` opcional y se alinea con el contrato.
- `src/features/reports/entities/report.entity.ts`: agrega columna nullable `image_url` expuesta como `imageUrl`.
- `src/features/reports/reports.controller.ts`: agrega `PATCH /reports/:id/evidence` protegido por JWT y multipart `file`.
- `src/features/reports/reports.module.ts`: importa `EvidenceModule`.
- `src/features/reports/reports.service.ts`: valida archivo, propiedad del reporte, existencia del reporte y persiste la URL publica.
- `src/features/reports/reports.service.spec.ts`: cubre casos de exito, MIME permitidos, archivo faltante, reporte inexistente y reporte ajeno.
- `package.json`, `package-lock.json`, `pnpm-lock.yaml`: agregan tipado de Multer.

## Frontend

Repositorio: `C:\dev\quillamap-frontend`

### Archivos nuevos

- `src/api/auth.api.ts`: concentra llamadas de autenticacion.
- `src/api/navigation.api.ts`: concentra llamadas de navegacion.
- `src/api/places.api.ts`: concentra llamadas de lugares cercanos.
- `src/api/reports.api.ts`: concentra creacion de reportes, subida multipart de evidencia y busqueda cercana.
- `src/api/thermal-comfort.api.ts`: concentra llamadas de cobertura verde/confort termico.
- `src/api/transit.api.ts`: concentra llamadas de transporte publico.
- `src/api/index.ts`: punto unico de exportacion para los modulos API.
- `src/api/__tests__/client.reports.test.ts`: valida el contrato frontend de reportes con y sin evidencia.
- `src/features/reports/constants/report-evidence.constants.ts`: define opciones de tipos de reporte, textos y prompts de evidencia.
- `src/features/reports/constants/shadow-report.constants.ts`: centraliza radio de busqueda de reportes de sombra.
- `src/features/reports/hooks/useReportEvidence.ts`: encapsula camara/galeria con `expo-image-picker`.
- `src/features/reports/store/useReportStore.ts`: guarda el tipo de reporte activo, evidencia seleccionada y estado de subida.

### Archivos modificados

- `app.json`: agrega plugin `expo-image-picker` con permisos de camara y galeria.
- `package.json`: agrega `expo-image-picker`.
- `docker-compose.dev.yml`: frontend y backend ejecutan `npm install` al iniciar para sincronizar volumenes de `node_modules` cuando se agreguen dependencias.
- `docs/docker-dev.md`: documenta el nuevo comportamiento de instalacion en contenedores.
- `src/api/client.ts`: queda solo como cliente Axios/base URL.
- Pantallas, hooks y tests que antes importaban desde `@/api/client` ahora importan desde `@/api`.
- `src/features/reports/components/ShadowReportMapFlow.tsx`: agrega pregunta de evidencia, botones de camara/galeria/sin evidencia/cancelar, detalle de sombra con imagen y uso de tipo de reporte activo.
- `src/features/reports/hooks/useCreateReport.ts`: usa el nuevo modulo `reportsApi`.
- `src/features/reports/types/report.types.ts`: agrega `ReportEvidenceImage`, `ReportTypeOption` e `imageUrl`.
- `src/components/maps/...`: agrega soporte para marcadores de reportes y mantiene las sombras persistidas en el mapa.

## Contrato confirmado

- Crear reporte: `POST /reports`
  - JSON normal.
  - No envia archivo.
- Subir evidencia: `PATCH /reports/:id/evidence`
  - Requiere `Authorization: Bearer <token>`.
  - `multipart/form-data`.
  - Campo obligatorio: `file`.
  - Tipos permitidos backend: `image/jpeg`, `image/png`, `image/webp`.
  - Tamano maximo backend: 5 MB.

## Validacion

- Backend:
  - `npm.cmd test -- reports.service.spec.ts --runInBand`
  - `npm.cmd run build`
  - `git diff --check`
- Frontend:
  - `npm.cmd run type-check`
  - `npm.cmd test -- src/api/__tests__/client.reports.test.ts src/features/reports --runInBand`
  - `npm.cmd test -- src/features/transit/__tests__/PublicTransportScreen.test.tsx --runInBand`
  - `npm.cmd test -- src/features/auth/__tests__/LoginScreen.integration.test.tsx src/features/auth/__tests__/RegisterScreen.integration.test.tsx src/features/auth/__tests__/HomeScreen.test.tsx --runInBand`
  - `git diff --check`

Nota: una corrida amplia que incluia `RegisterScreen.e2e.test.tsx` fallo por `Network Error` al depender del backend real. No se tomo como regresion del cambio de evidencia/modularizacion porque las pruebas enfocadas pasaron.
