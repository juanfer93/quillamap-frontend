const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';
const VEHICLE_MODE = process.env.NAVIGATION_LIVE_DRIVING_MODE ?? 'carro';
const SELECTED_SCENARIO = process.argv[2] ?? process.env.NAVIGATION_LIVE_SCENARIO ?? 'all';
const REQUEST_TIMEOUT_MS = Number(process.env.NAVIGATION_LIVE_TIMEOUT_MS ?? 20000);

const origin = {
  latitude: 11.004107,
  longitude: -74.806981,
  label: 'Parque Venezuela',
};

const destination = {
  latitude: 11.01902,
  longitude: -74.82134,
  label: 'Ventana al Mundo',
};

const scenarios = [
  {
    name: 'caminando',
    mode: 'peaton',
    preferences: {
      prioritizeShade: true,
      avoidActiveStreams: true,
    },
  },
  {
    name: VEHICLE_MODE === 'moto' ? 'moto' : 'carro',
    mode: VEHICLE_MODE,
    licensePlate: 'QMA123',
    preferences: {
      avoidLegalRestrictions: true,
      avoidActiveStreams: true,
    },
  },
];

const scenarioAliases = {
  all: ['caminando', 'carro', 'moto'],
  walking: ['caminando'],
  peaton: ['caminando'],
  caminando: ['caminando'],
  driving: ['carro', 'moto'],
  vehicle: ['carro', 'moto'],
  carro: ['carro'],
  car: ['carro'],
  moto: ['moto'],
  motorcycle: ['moto'],
};

const selectedNames = scenarioAliases[SELECTED_SCENARIO];

if (!selectedNames) {
  throw new Error(
    `Unknown scenario "${SELECTED_SCENARIO}". Use walking, driving, carro, moto, or all.`
  );
}

const selectedScenarios = scenarios.filter((scenario) => selectedNames.includes(scenario.name));

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const formatMeters = (meters) => `${Math.round(meters).toLocaleString('en-US')} m`;
const formatSeconds = (seconds) => `${Math.round(seconds / 60).toLocaleString('en-US')} min`;
const formatPreciseSeconds = (seconds) => {
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainder = roundedSeconds % 60;
  return minutes > 0 ? `${minutes} min ${remainder} s` : `${remainder} s`;
};

const calculateRoute = async (scenario) => {
  let response;

  try {
    response = await fetch(`${API_URL}/navigation/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        origin,
        destination,
        mode: scenario.mode,
        licensePlate: scenario.licensePlate,
        preferences: scenario.preferences,
      }),
    });
  } catch (error) {
    throw new Error(
      `${scenario.name}: no pude conectar con ${API_URL}/navigation/route. Verifica que el backend este prendido y que EXPO_PUBLIC_API_URL apunte al puerto correcto. Error: ${error.message}`
    );
  }

  const rawBody = await response.text();
  let body;

  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    body = rawBody;
  }

  if (!response.ok) {
    throw new Error(
      `${scenario.name}: backend returned ${response.status}. Body: ${JSON.stringify(body)}`
    );
  }

  return body;
};

const validateRoute = (scenario, route) => {
  assert(Array.isArray(route.geometry), `${scenario.name}: geometry must be an array`);
  assert(route.geometry.length >= 2, `${scenario.name}: geometry must include at least 2 points`);
  assert(['osrm', 'tomtom'].includes(route.provider), `${scenario.name}: expected OSRM or TomTom provider, got ${route.provider}`);
  assert(route.distanceMeters > 1000, `${scenario.name}: distance is too short for the selected Barranquilla route`);
  assert(route.durationSeconds > 60, `${scenario.name}: duration is too short for a realistic route`);
  assert(['allowed', 'rerouted'].includes(route.legalStatus), `${scenario.name}: unexpected legalStatus ${route.legalStatus}`);

  const firstPoint = route.geometry[0];
  const lastPoint = route.geometry[route.geometry.length - 1];

  assert(typeof firstPoint.latitude === 'number', `${scenario.name}: first point latitude is missing`);
  assert(typeof firstPoint.longitude === 'number', `${scenario.name}: first point longitude is missing`);
  assert(typeof lastPoint.latitude === 'number', `${scenario.name}: last point latitude is missing`);
  assert(typeof lastPoint.longitude === 'number', `${scenario.name}: last point longitude is missing`);
};

const getRouteDifferenceScore = (backendRoute, providerRoute) => {
  const distanceDifference = Math.abs(backendRoute.distanceMeters - providerRoute.distanceMeters);
  const durationDifference = Math.abs(backendRoute.durationSeconds - providerRoute.durationSeconds);
  return distanceDifference + durationDifference * 2;
};

const getSelectedRouteReport = (backendRoute, providerRoutes) => {
  if (!providerRoutes.length) {
    return 'No pude comparar con rutas sugeridas porque el proveedor no devolvio alternativas detalladas.';
  }

  const ranked = providerRoutes
    .map((providerRoute, index) => ({
      index,
      providerRoute,
      score: getRouteDifferenceScore(backendRoute, providerRoute),
    }))
    .sort((left, right) => left.score - right.score);
  const selected = ranked[0];
  const distanceDelta = Math.round(backendRoute.distanceMeters - selected.providerRoute.distanceMeters);
  const durationDelta = Math.round(backendRoute.durationSeconds - selected.providerRoute.durationSeconds);

  if (selected.index === 0) {
    return `Si: el backend tomo la ruta principal sugerida por ${backendRoute.provider}. Diferencia vs proveedor: ${distanceDelta} m, ${durationDelta} s.`;
  }

  return `No tomo la ruta principal: coincide mejor con la alternativa #${selected.index + 1}. Diferencia vs esa alternativa: ${distanceDelta} m, ${durationDelta} s.`;
};

const getBackendProviderRoutes = (route) => {
  const alternatives = route.alternatives?.length
    ? route.alternatives
    : [
        {
          index: route.selectedRouteIndex ?? 0,
          distanceMeters: route.distanceMeters,
          durationSeconds: route.durationSeconds,
          geometryPoints: route.geometry.length,
          provider: route.provider,
        },
      ];

  return alternatives.map((alternative) => ({
    ...alternative,
    steps: alternative.index === (route.selectedRouteIndex ?? 0) ? route.instructions ?? [] : [],
  }));
};

const printRouteDetails = (route) => {
  const providerRoutes = getBackendProviderRoutes(route);
  const mainRoute = providerRoutes[0];

  console.log(`Suggested routes from ${route.provider}: ${providerRoutes.length}`);
  console.log(getSelectedRouteReport(route, providerRoutes));
  console.log(`Selected route index: ${route.selectedRouteIndex ?? 0}`);

  if (typeof route.trafficDelaySeconds === 'number') {
    console.log(`Traffic delay: ${formatPreciseSeconds(route.trafficDelaySeconds)}`);
  }

  if (!mainRoute) {
    return;
  }

  console.log(`Provider main route: distance=${formatMeters(mainRoute.distanceMeters)} | duration=${formatPreciseSeconds(mainRoute.durationSeconds)} | points=${mainRoute.geometryPoints}`);
  console.log('Por donde cogio:');

  if (!mainRoute.steps.length) {
    console.log('WARN El backend no devolvio instrucciones para esta ruta.');
    return;
  }

  mainRoute.steps.forEach((step) => {
    const distance = typeof step.distanceMeters === 'number' ? formatMeters(step.distanceMeters) : 'n/a';
    const duration = typeof step.durationSeconds === 'number' ? formatPreciseSeconds(step.durationSeconds) : 'n/a';
    console.log(`${step.index}. ${step.message} | ${step.street} | ${distance} | ${duration}`);
  });
};

console.log(`QuillaMap live navigation QA`);
console.log(`Backend: ${API_URL}`);
console.log(`Scenario: ${SELECTED_SCENARIO}`);
console.log(`Origin: ${origin.label} (${origin.latitude}, ${origin.longitude})`);
console.log(`Destination: ${destination.label} (${destination.latitude}, ${destination.longitude})`);

for (const scenario of selectedScenarios) {
  console.log(`\nRunning ${scenario.name} route with mode=${scenario.mode}`);
  const route = await calculateRoute(scenario);
  validateRoute(scenario, route);
  console.log([
    `OK ${scenario.name}`,
    `provider=${route.provider}`,
    `status=${route.legalStatus}`,
    `points=${route.geometry.length}`,
    `distance=${formatMeters(route.distanceMeters)}`,
    `duration=${formatSeconds(route.durationSeconds)}`,
    `alerts=${route.alerts?.length ?? 0}`,
  ].join(' | '));
  printRouteDetails(route);
}

console.log('\nLive navigation QA passed.');
