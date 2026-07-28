# QuillaMap Transit Implementation

Fecha base: 2026-07-22.

Este documento define la implementacion de rutas de transporte publico para QuillaMap bajo costo de APIs externas igual a cero. El alcance funcional inicial queda limitado a los modos `peaton` y `turista`.

## Fuentes de Datos

Orden de prioridad:

1. GTFS oficial de Transmetro o AMB cuando exista y este vigente.
2. Datos abiertos oficiales parciales, como paraderos Transmetro.
3. Referencias GTFS comunitarias o agregadores publicos.
4. OpenStreetMap via Overpass API para geometria comunitaria.
5. Overrides manuales de editores QuillaMap.

El producto publicado para runtime debe ser siempre `quilla_gtfs.zip`, versionado y auditable. El sistema no debe depender de que una fuente oficial sea completa.

## Pipeline GTFS Vivo

Crear en backend `features/transit`:

- `ingestion/official-gtfs.importer.ts`
- `ingestion/official-web.importer.ts`
- `ingestion/datos-gov.importer.ts`
- `ingestion/osm-overpass.importer.ts`
- `ingestion/manual-overrides.importer.ts`
- `gtfs/gtfs-builder.service.ts`
- `gtfs/gtfs-validator.service.ts`
- `otp/otp-client.service.ts`
- `risk/transit-risk.service.ts`
- `community/transit-community-validation.service.ts`

Cadencia:

- Oficial: cada 24 horas.
- OSM/Overpass: cada 12 horas.
- Overrides manuales: publicacion inmediata con version nueva.
- GTFS build: despues de cada import exitoso o cambio manual publicado.

## Overpass Base

Usar un bounding box del Area Metropolitana de Barranquilla ampliado para cubrir Barranquilla, Soledad, Malambo, Galapa y Puerto Colombia.

```overpass
[out:json][timeout:120];
(
  relation["type"="route"]["route"="bus"](10.75,-75.05,11.13,-74.65);
  node["highway"="bus_stop"](10.75,-75.05,11.13,-74.65);
  node["public_transport"~"platform|stop_position"](10.75,-75.05,11.13,-74.65);
  way["public_transport"="platform"](10.75,-75.05,11.13,-74.65);
);
out body geom;
>;
out skel qt;
```

Normalizacion:

- OSM relation -> `transit_routes` + `transit_shapes`.
- `highway=bus_stop` / `public_transport=platform` -> `transit_stops`.
- Si OSM no tiene horarios, generar `frequencies.txt` con frecuencia conservadora marcada como `source=osm_overpass`.

## Modelo PostGIS

Usar SRID 4326 en todas las geometrías.

Tablas principales:

- `transit_source_snapshots`
- `transit_agencies`
- `transit_routes`
- `transit_route_versions`
- `transit_stops`
- `transit_trips`
- `transit_stop_times`
- `transit_shapes`
- `transit_transfers`
- `transit_overrides`
- `transit_validation_events`
- `transit_landmark_links`

Indices obligatorios:

```sql
CREATE INDEX transit_stops_geom_gix ON transit_stops USING GIST (geom);
CREATE INDEX transit_shapes_geom_gix ON transit_shapes USING GIST (geom);
CREATE INDEX transit_overrides_geom_gix ON transit_overrides USING GIST (geom);
```

Validacion de presencia fisica:

```sql
SELECT id
FROM transit_stops
WHERE route_id = :routeId
AND ST_DWithin(
  geom::geography,
  ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
  80
);
```

## OpenTripPlanner

OTP se despliega self-hosted con Docker. El build usa:

- `quilla_gtfs.zip`
- extracto OSM `.osm.pbf` del Area Metropolitana
- `build-config.json`
- `router-config.json`

Comandos objetivo:

```powershell
docker run --rm -v C:\dev\quillamap-transit-data:/var/opentripplanner opentripplanner/opentripplanner:latest --build --save
docker run --rm -p 8080:8080 -v C:\dev\quillamap-transit-data:/var/opentripplanner opentripplanner/opentripplanner:latest --load --serve
```

NestJS nunca debe exponer OTP crudo al movil. El endpoint publico es:

- `POST /api/transit/itineraries`
- `POST /api/transit/community-validations`

## Riesgo por Arroyos

Flujo de calculo:

1. NestJS recibe `TransitRouteRequest`.
2. Rechaza modos distintos de `peaton` y `turista`.
3. Consulta OTP.
4. Convierte legs a geometria PostGIS temporal.
5. Cruza paraderos y tramos con poligonos de arroyos activos.
6. Si hay riesgo, solicita alternativa a OTP penalizando paradero/tramo.
7. Si no hay alternativa, devuelve `riskStatus=blocked`.

Consulta base:

```sql
SELECT arroyos.id
FROM active_stream_polygons arroyos
WHERE ST_Intersects(arroyos.geom, ST_SetSRID(ST_GeomFromGeoJSON(:legGeoJson), 4326));
```

## Editor Manual

Estados:

- `draft`
- `validated`
- `published`
- `expired`

Acciones:

- Crear ruta temporal.
- Suspender ruta.
- Mover paradero.
- Cerrar paradero.
- Reemplazar shape.
- Ajustar frecuencia.

Todo cambio debe tener:

- usuario editor
- motivo
- fecha inicio
- fecha fin opcional
- geometria anterior
- geometria nueva
- version GTFS resultante

## Frontend

Contrato compartido:

- `src/types/contracts/transit.contract.ts`

Cliente:

- `transitApi.calculateItineraries`
- `transitApi.validateRoutePresence`

Utilidades:

- `src/features/transit/utils/transitCalculations.ts`
- `src/features/transit/utils/transitVelocityGuard.ts`

Capas MapLibre previstas:

- walk: azul tiburon `#004574`, linea punteada.
- bus: linea solida.
- transfer: dorado arena `#D4AF37`.
- riesgo: rojo solo para alerta operacional.

## QA

Jest obligatorio:

- contrato transit
- calculo de transbordos
- GeoJSON por pierna
- Velocity Guard
- prohibicion de `#1E3A8A`

Backend Jest obligatorio:

- parser GTFS
- merge OSM/oficial/override
- `ST_DWithin` para anti-spoofing
- recalculo por arroyo activo

Detox obligatorio:

- Peaton llega a paradero.
- Turista abre parada cercana a hito cultural.
- Menu complejo se bloquea al caminar rapido.
- Itinerario con arroyo activo recalcula o bloquea.
