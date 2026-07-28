# Auditoria de rutas de transporte

Este flujo pone en marcha la fase recomendada por el informe de rutas: medir cobertura de datos antes de seguir ajustando UI o inyectando nuevas geometrias.

## Comando principal

```powershell
npm.cmd run audit:transit-routes -- --base-url http://localhost:3000/api
```

El script lee `/api/transit/routes/map` y compara las rutas devueltas por el backend contra el inventario maestro inicial del informe.

## Salidas recomendadas

```powershell
npm.cmd run audit:transit-routes -- --base-url http://localhost:3000/api --out-md docs/transit-route-audit.latest.md --out-json docs/transit-route-audit.latest.json
```

El reporte marca:

- `valid_shape`: existe una ruta esperada y su geometria es `LineString` con minimo 3 pares `[longitude, latitude]` finitos.
- `incomplete_shape`: existe una ruta esperada, pero no tiene recorrido dibujable confiable.
- `missing`: no se encontro coincidencia en la respuesta del backend.

## Uso sin backend levantado

Tambien se puede auditar un JSON exportado previamente:

```powershell
npm.cmd run audit:transit-routes -- --input C:\tmp\transit-routes-map.json --out-md docs/transit-route-audit.latest.md
```

## Siguiente paso

Cuando el reporte indique rutas faltantes o incompletas, la inyeccion debe hacerse con un seed idempotente en backend contra `transit_routes`, `transit_shapes` y `transit_stops`, manteniendo `LineString`, coordenadas `[longitude, latitude]`, SRID 4326 y calidad de geometria (`official`, `osm`, `manual` o `pending_validation`).
