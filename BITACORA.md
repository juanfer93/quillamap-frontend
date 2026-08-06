# Bitácora — Mapa de calor de seguridad (QuillaMap)

Fecha: 6 de agosto de 2026

Este documento resume los bugs corregidos y los cambios realizados para que el
**mapa de calor de seguridad** funcione de extremo a extremo (backend + frontend).
La mayoría de los cambios están en `main` y son visibles al activar la capa
"Mapa de seguridad" desde el menú de herramientas del mapa.

---

## Bugs corregidos

### Bug 1 — Barra de opciones inferior en blanco (frontend)
- **Síntoma:** la barra inferior del mapa (caminar/navegar/marcador/perfil) se
  veía vacía.
- **Causa:** `QuillaMap.web-renderer.tsx` roto (llave `}` huérfana en un
  `useEffect`), `MapIcon` usando `try/catch` inefectivo en vez de un
  `ErrorBoundary` real, y un path SVG de `leaf-outline` corrupto.
- **Arreglo:** corregida la llave, `MapIcon` ahora usa un `ErrorBoundary`
  real, reparado el path SVG y ajustados `zIndex`/contraste AA
  (`#004574`/`#F8FAFC`/`#121212`).

### Bug 2 — Lugares y sombras no respetan el zoom (frontend)
- **Síntoma:** al alejar el zoom, lugares y sombras no se ocultaban.
- **Causa:** gating de zoom incorrecto (solo `mapZoom <= 19`, sin piso).
- **Arreglo:** gating con `mapZoom >= PLACES_MIN_VISIBLE_ZOOM` (14.75) en
  `web-renderer.tsx` y `QuillaMap.native.tsx`, con fade mediante `interpolate`
  entre 14.75 y 16.

### Bug 3 — El mapa de calor no mostraba las zonas (backend + frontend)
- **Síntoma:** las zonas peligrosas (reales y las inyectadas por seed) no
  aparecían en el mapa de calor de seguridad.
- **Causas:**
  1. El API remoto devolvía clusters solo dentro del radio de 5 km del GPS del
     usuario: si la ubicación quedaba lejos, todo desaparecía.
  2. El frontend cargaba el heatmap con un radio acotado a 5000 m alrededor del
     centro del usuario.
- **Arreglo backend `security-heatmap.query.ts`:**
  - El **centro de la ventana es fijo = Área Metropolitana** (Barranquilla
    centro: lat 10.9878, lng -74.7889) y el **radio es de 25 km**,
    cubriendo Barranquilla, Soledad, Malambo, Galapa y Puerto Colombia
    (`SECURITY_HEATMAP_METRO_*` en `security-heatmap.constants.ts`).
  - Se **eliminó la ventana temporal/expiración**: las zonas nuevas y viejas
    siempre se muestran mientras estén dentro de la ventana metro.
  - Se eliminó la dependencia del radio en el GPS del cliente.
  - Corregido el modo driving lock (`criticalOnly`), que quedaba sin clusters.
- **Arreglo frontend:** las zonas se muestran al activar la capa **Mapa de
  Calor** (`useLayerStore.isSecurityMapEnabled`), el heatmap se pide con el
  centro del área metropolitana y se renderiza.

### Bug 4 — Zonas moderadas poco visibles / sin contorno (frontend)
- **Síntoma:** las zonas de riesgo **moderado** se veían como una mancha tenue
  del heatmap, sin círculo marcado como las peligrosas/muy peligrosas.
- **Arreglo (`QuillaMap.maplibre.layers.ts`, `web-layers.ts`, `native.tsx`):**
  - Las moderadas ahora también dibujan un **círculo con contorno** (stroke)
    blanco y color naranja `#F97316`, igual que high/critical.
  - Se subió la opacidad del círculo y la intensidad del heatmap denso para que
    las moderadas se aprecien más.
  - Los círculos **crecen al alejar el zoom** (interpolación por zoom), igual
    que los demás elementos.

## Trabajo de soporte
- **Override de DNS** opt-in (`QM_DNS_SERVERS`) en `main.ts` para redes
  externas con resolver local roto (`EAI_AGAIN`). Aplicado en desarrollo.
- Seeds de seguridad: `security-reports.seed.ts` y `security-infrastructure`.
- Migración Supabase del contrato del heatmap; scripts de auditoría y
  migración.
- Tests: backend 63/63, frontend 109/110 (solo falla un e2e en vivo);
  `tsc --noEmit` limpio y `nest build` OK.

## Archivos clave
- `src/features/security/queries/security-heatmap.query.ts`
- `src/features/security/security-heatmap.constants.ts`
- `src/features/security/security-heatmap.service.ts`
- `src/features/security/hooks/useSecurityHeatmap.ts`
- `src/components/maps/styles/QuillaMap.maplibre.layers.ts`
- `src/components/maps/components/QuillaMap.web-layers.ts`
- `src/components/maps/components/QuillaMap.native.tsx`