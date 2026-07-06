import type { PlaceMapFeature } from '@/types/contracts/places.contract';

export const DEFAULT_PLACES: PlaceMapFeature[] = [
  {
    id: 'tourist-ventana-al-mundo',
    source: 'tourist_site',
    category: 'servicios',
    name: {
      es: 'Ventana al Mundo',
      en: 'Window to the World',
    },
    description: {
      es: 'Monumento urbano de referencia en el norte de Barranquilla.',
      en: 'Urban landmark in northern Barranquilla.',
    },
    location: {
      type: 'Point',
      coordinates: [-74.82134, 11.01902],
    },
    coordinate: {
      latitude: 11.01902,
      longitude: -74.82134,
    },
    metadata: {
      history: {
        es: 'Hito cultural contemporaneo asociado con la puerta internacional de la ciudad.',
        en: 'Contemporary cultural landmark associated with the city as an international gateway.',
      },
      openingHours: {
        es: 'Espacio publico abierto',
        en: 'Open public space',
      },
      photos: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Ventana_al_Mundo_Barranquilla.jpg/640px-Ventana_al_Mundo_Barranquilla.jpg',
      ],
      buildingHeightMeters: 47,
      polygon: {
        type: 'Polygon',
        coordinates: [[
          [-74.82152, 11.01917],
          [-74.82116, 11.01917],
          [-74.82116, 11.01887],
          [-74.82152, 11.01887],
          [-74.82152, 11.01917],
        ]],
      },
    },
  },
  {
    id: 'place-paradero-via-40',
    source: 'place',
    category: 'transporte',
    name: {
      es: 'Paradero Via 40',
      en: 'Via 40 bus stop',
    },
    description: {
      es: 'Referencia de transporte para orientar rutas urbanas.',
      en: 'Transit reference for urban route orientation.',
    },
    location: {
      type: 'Point',
      coordinates: [-74.7889, 10.9878],
    },
    coordinate: {
      latitude: 10.9878,
      longitude: -74.7889,
    },
    metadata: {
      openingHours: {
        es: 'Servicio segun ruta',
        en: 'Service depends on route',
      },
    },
  },
];
