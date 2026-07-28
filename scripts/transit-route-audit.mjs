#!/usr/bin/env node

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

const masterRouteInventory = [
  { agencyKind: 'colectivo', operator: 'Flota Angulo', routes: ['A7-4112'] },
  { agencyKind: 'colectivo', operator: 'Transmecar', routes: ['C17-4160', 'D10-4172', 'D11-4153', 'D9-4152'] },
  { agencyKind: 'colectivo', operator: 'Flota Roja', routes: ['A8-4113'] },
  { agencyKind: 'colectivo', operator: 'Transdiaz', routes: ['A10-4114 A', 'A10-4114 B', 'A11-4115', 'B16-4130'] },
  { agencyKind: 'colectivo', operator: 'Cootrab', routes: ['C5-4135', 'C6-4137'] },
  { agencyKind: 'colectivo', operator: 'Embusa', routes: ['B9-4125'] },
  { agencyKind: 'colectivo', operator: 'Monterrey', routes: ['B11-4166', 'B12-4127', 'B8-4124', 'B11-B-4192'] },
  { agencyKind: 'colectivo', operator: 'La Carolina', routes: ['A16-4161 A', 'A16-4161 B', 'D6-4150', 'D7-4151'] },
  { agencyKind: 'colectivo', operator: 'Cootransporcar', routes: ['C8-4139'] },
  { agencyKind: 'colectivo', operator: 'Coochofal', routes: ['A15-4159', 'C2-4133', 'C2-B-4187', 'C3-4134', 'C4-4135', 'C9-4140', 'C18-4141', 'D20-4185'] },
  { agencyKind: 'colectivo', operator: 'Trasalfa', routes: ['D15-4157', 'D14-4156', 'B2-B-4118'] },
  { agencyKind: 'colectivo', operator: 'Coolitoral', routes: ['A1-4106 A', 'A1-4106 B', 'A2-4107', 'A3-4108', 'A4-4109', 'B1-4117', 'B2A-4177', 'B3-4119', 'B17-4163', 'C19-4178', 'PT1', 'PT2', 'PT3', 'PT4', 'PT5'] },
  { agencyKind: 'colectivo', operator: 'Cootrantico', routes: ['A18-4183', 'B4-4120', 'B5-4121', 'B5-B-4190', 'B6-4122', 'B7-4123', 'B20-4180', 'B20-B-4191'] },
  { agencyKind: 'colectivo', operator: 'Lolaya', routes: ['B10-4126', 'B10-B-4193', 'D8-4165'] },
  { agencyKind: 'colectivo', operator: 'Cootransco', routes: ['C7-4138'] },
  { agencyKind: 'colectivo', operator: 'Cootrasol', routes: ['D3-4147', 'D4-4148', 'D5-4149'] },
  { agencyKind: 'colectivo', operator: 'Sobusa', routes: ['B18-4175 A', 'B18-4175 B', 'C11-4168', 'C12-4169 A', 'C12-4169 B', 'C13-4143', 'C14-4170', 'C16-4167 A', 'C16-4167 B'] },
  { agencyKind: 'colectivo', operator: 'Transoledad', routes: ['D13-4155'] },
  { agencyKind: 'colectivo', operator: 'Transurbar', routes: ['A14-4116', 'D19-4184', 'D16-4173'] },
  { agencyKind: 'colectivo', operator: 'Sodetrans', routes: ['B13-4128', 'B13-B-4189', 'B14-4174', 'B15-4129 A', 'B15-4129 B', 'C21-4182 A', 'C21-4182 B'] },
  { agencyKind: 'colectivo', operator: 'Cootransnorte', routes: ['A6-4111', 'A5-4110'] },
  { agencyKind: 'colectivo', operator: 'Trasalianco', routes: ['B19-4176', 'D18-4179', 'D12-4154', 'D17-4158'] },
  { agencyKind: 'colectivo', operator: 'Cooasoatlan', routes: ['C1-4132', 'C1-B-4186', 'C20-4181', 'C20-B-4187'] },
  { agencyKind: 'transmetro', operator: 'Troncales', routes: ['B1', 'B2', 'R1', 'R2', 'S1', 'S2'] },
  { agencyKind: 'transmetro', operator: 'Expresos / variantes', routes: ['R10', 'S10', 'S20'] },
  { agencyKind: 'transmetro', operator: 'Alimentadoras', routes: ['A1-2', 'A1-3', 'A1-4', 'A2-1', 'A3-1', 'A3-2', 'A3-3', 'A3-4', 'A3-41', 'A5-1', 'A5-2', 'A5-3', 'A5-4', 'A5-5', 'A6-5', 'A6-6', 'A7-1', 'A7-3', 'A7-4', 'A8-1', 'A8-2', 'A8-3', 'A9-3', 'A9-4', 'U-30', 'A4-1 Malambo'] },
  { agencyKind: 'transmetro', operator: 'Especiales', routes: ['Gran Malecon', 'Ruta Navidena', 'Ruta Chevere'] },
];

const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

const compact = (value) => normalize(value).replace(/[^A-Z0-9]/g, '');

const tokenize = (value) =>
  normalize(value)
    .split(/[^A-Z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);

const getArgs = () => {
  const args = process.argv.slice(2);
  const result = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--base-url') {
      result.baseUrl = next;
      index += 1;
    } else if (arg === '--input') {
      result.input = next;
      index += 1;
    } else if (arg === '--out-json') {
      result.outJson = next;
      index += 1;
    } else if (arg === '--out-md') {
      result.outMd = next;
      index += 1;
    } else {
      throw new Error(`Argumento no reconocido: ${arg}`);
    }
  }

  return result;
};

const printHelp = () => {
  console.log(`Uso:
  npm.cmd run audit:transit-routes
  npm.cmd run audit:transit-routes -- --base-url http://localhost:3000/api
  npm.cmd run audit:transit-routes -- --input transit-routes-map.json --out-md docs/transit-route-audit.latest.md

Opciones:
  --base-url   Base URL del backend. Default: TRANSIT_API_BASE_URL, EXPO_PUBLIC_API_URL o ${DEFAULT_API_BASE_URL}
  --input      Archivo JSON ya exportado de /api/transit/routes/map
  --out-json   Escribe el resultado estructurado
  --out-md     Escribe el reporte Markdown`);
};

const readJsonFile = async (filePath) => {
  const { readFile } = await import('node:fs/promises');
  return JSON.parse(await readFile(filePath, 'utf8'));
};

const writeFileIfRequested = async (filePath, content) => {
  if (!filePath) {
    return;
  }

  const { mkdir, writeFile } = await import('node:fs/promises');
  const { dirname } = await import('node:path');
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
};

const requestJson = async (url) => {
  const { request } = await import(url.startsWith('https:') ? 'node:https' : 'node:http');

  return new Promise((resolve, reject) => {
    const req = request(url, { headers: { Accept: 'application/json' }, timeout: 60_000 }, (response) => {
      const chunks = [];

      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');

        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`No se pudo leer ${url}: HTTP ${response.statusCode ?? 'desconocido'} ${body.slice(0, 240)}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Respuesta JSON invalida desde ${url}: ${error instanceof Error ? error.message : error}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Timeout consultando ${url}`));
    });
    req.on('error', reject);
    req.end();
  });
};

const fetchTransitMap = async (baseUrl) => {
  const url = `${baseUrl.replace(/\/$/, '')}/transit/routes/map`;
  return requestJson(url);
};

const hasFiniteCoordinate = (coordinate) =>
  Array.isArray(coordinate) &&
  coordinate.length >= 2 &&
  Number.isFinite(coordinate[0]) &&
  Number.isFinite(coordinate[1]);

const hasValidLineString = (feature) =>
  feature?.geometry?.type === 'LineString' &&
  Array.isArray(feature.geometry.coordinates) &&
  feature.geometry.coordinates.length >= 3 &&
  feature.geometry.coordinates.every(hasFiniteCoordinate);

const isRouteFeature = (feature) =>
  feature?.type === 'Feature' && feature?.properties?.kind === 'route';

const buildExpectedRoutes = () =>
  masterRouteInventory.flatMap((entry) =>
    entry.routes.map((route) => ({
      agencyKind: entry.agencyKind,
      operator: entry.operator,
      route,
      routeKey: compact(route),
    }))
  );

const getExistingRouteFields = (feature) => [
  feature.id,
  feature.properties?.id,
  feature.properties?.routeId,
  feature.properties?.shortName,
  feature.properties?.longName,
].filter(Boolean);

const buildExistingRouteIndex = (features) =>
  features.filter(isRouteFeature).map((feature) => {
    const fields = getExistingRouteFields(feature);
    const tokens = new Set(fields.flatMap(tokenize).map(compact));
    const compactFields = new Set(fields.map(compact).filter(Boolean));

    return {
      feature,
      agencyKind: feature.properties.agencyKind,
      operatorName: feature.properties.operatorName ?? 'Sin operador',
      label: feature.properties.shortName ?? feature.properties.longName ?? feature.properties.routeId ?? feature.id,
      routeId: feature.properties.routeId ?? feature.id,
      validShape: hasValidLineString(feature),
      coordinateCount: Array.isArray(feature.geometry?.coordinates) ? feature.geometry.coordinates.length : 0,
      tokens,
      compactFields,
    };
  });

const isRouteMatch = (expected, existing) => {
  if (expected.agencyKind !== existing.agencyKind) {
    return false;
  }

  if (existing.compactFields.has(expected.routeKey) || existing.tokens.has(expected.routeKey)) {
    return true;
  }

  if (expected.routeKey.length >= 5) {
    return Array.from(existing.compactFields).some((field) => field.includes(expected.routeKey));
  }

  return false;
};

const auditRoutes = (transitMap) => {
  const features = Array.isArray(transitMap?.features) ? transitMap.features : [];
  const expectedRoutes = buildExpectedRoutes();
  const existingRoutes = buildExistingRouteIndex(features);
  const matchedExistingIndexes = new Set();

  const routeResults = expectedRoutes.map((expected) => {
    const matches = existingRoutes
      .map((existing, index) => ({ existing, index }))
      .filter(({ existing }) => isRouteMatch(expected, existing));

    for (const match of matches) {
      matchedExistingIndexes.add(match.index);
    }

    const validMatches = matches.filter(({ existing }) => existing.validShape);

    return {
      ...expected,
      status: validMatches.length > 0 ? 'valid_shape' : matches.length > 0 ? 'incomplete_shape' : 'missing',
      matches: matches.map(({ existing }) => ({
        routeId: existing.routeId,
        label: existing.label,
        operatorName: existing.operatorName,
        coordinateCount: existing.coordinateCount,
        validShape: existing.validShape,
      })),
    };
  });

  const unmatchedExistingRoutes = existingRoutes
    .filter((_, index) => !matchedExistingIndexes.has(index))
    .map((existing) => ({
      agencyKind: existing.agencyKind,
      operatorName: existing.operatorName,
      routeId: existing.routeId,
      label: existing.label,
      coordinateCount: existing.coordinateCount,
      validShape: existing.validShape,
    }));

  const summary = {
    expectedRoutes: routeResults.length,
    existingExpectedRoutes: routeResults.filter((route) => route.status !== 'missing').length,
    validShapes: routeResults.filter((route) => route.status === 'valid_shape').length,
    incompleteShapes: routeResults.filter((route) => route.status === 'incomplete_shape').length,
    missingRoutes: routeResults.filter((route) => route.status === 'missing').length,
    routeFeaturesReturned: existingRoutes.length,
    unmatchedExistingRoutes: unmatchedExistingRoutes.length,
    stopFeaturesReturned: features.filter((feature) => feature?.properties?.kind === 'stop').length,
  };

  return {
    generatedAtIso: new Date().toISOString(),
    sourceGeneratedAtIso: transitMap?.generatedAtIso ?? null,
    summary,
    routes: routeResults,
    unmatchedExistingRoutes,
  };
};

const toMarkdownTable = (headers, rows) => [
  `| ${headers.join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map((row) => `| ${row.join(' | ')} |`),
].join('\n');

const escapeCell = (value) => String(value ?? '').replace(/\|/g, '/');

const renderMarkdown = (audit) => {
  const summaryRows = Object.entries(audit.summary).map(([key, value]) => [key, value]);
  const routeRows = audit.routes.map((route) => [
    route.agencyKind,
    route.operator,
    route.route,
    route.status,
    route.matches.length,
    route.matches.map((match) => `${match.routeId} (${match.coordinateCount} pts)`).join(', ') || '-',
  ].map(escapeCell));
  const unmatchedRows = audit.unmatchedExistingRoutes.map((route) => [
    route.agencyKind,
    route.operatorName,
    route.label,
    route.validShape ? 'valid_shape' : 'incomplete_shape',
    route.coordinateCount,
    route.routeId,
  ].map(escapeCell));

  return [
    '# Auditoria de rutas de transporte QuillaMap',
    '',
    `Generado: ${audit.generatedAtIso}`,
    `Fuente backend: ${audit.sourceGeneratedAtIso ?? 'sin generatedAtIso'}`,
    '',
    '## Resumen',
    '',
    toMarkdownTable(['metrica', 'valor'], summaryRows),
    '',
    '## Rutas esperadas vs backend',
    '',
    toMarkdownTable(['sistema', 'operador', 'ruta esperada', 'estado', 'matches', 'coincidencias backend'], routeRows),
    '',
    '## Rutas devueltas por backend sin match en el inventario',
    '',
    unmatchedRows.length > 0
      ? toMarkdownTable(['sistema', 'operador backend', 'ruta backend', 'estado shape', 'puntos', 'routeId'], unmatchedRows)
      : 'No hay rutas extra sin match.',
    '',
    '## Criterio de shape valido',
    '',
    'Una ruta cuenta como `valid_shape` solo si llega como GeoJSON `LineString`, tiene minimo 3 pares `[longitude, latitude]` y todos sus numeros son finitos.',
    '',
  ].join('\n');
};

const main = async () => {
  const args = getArgs();

  if (args.help) {
    printHelp();
    return;
  }

  const baseUrl = args.baseUrl ?? process.env.TRANSIT_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
  const transitMap = args.input ? await readJsonFile(args.input) : await fetchTransitMap(baseUrl);
  const audit = auditRoutes(transitMap);
  const markdown = renderMarkdown(audit);

  await writeFileIfRequested(args.outJson, `${JSON.stringify(audit, null, 2)}\n`);
  await writeFileIfRequested(args.outMd, markdown);

  console.log(markdown);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
