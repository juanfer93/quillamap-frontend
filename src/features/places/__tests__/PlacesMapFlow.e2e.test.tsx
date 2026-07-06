import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import WebQuillaMap from '@/components/maps/components/QuillaMap.web-renderer';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';

jest.mock('maplibre-gl', () => {
  const mapInstance = {
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    remove: jest.fn(),
    jumpTo: jest.fn(),
    isStyleLoaded: jest.fn(() => true),
    getSource: jest.fn(),
    addSource: jest.fn(),
    getLayer: jest.fn(),
    addLayer: jest.fn(),
    setPaintProperty: jest.fn(),
  };
  const MapMock = jest.fn(() => mapInstance);
  const MarkerMock = jest.fn().mockImplementation(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  }));

  return {
    __esModule: true,
    default: {
      Map: MapMock,
      Marker: MarkerMock,
    },
    Map: MapMock,
    Marker: MarkerMock,
  };
});

jest.mock('@expo/vector-icons', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Text } = jest.requireActual('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

const ventanaAlMundo: PlaceMapFeature = {
  id: 'tourist-ventana-al-mundo',
  source: 'tourist_site',
  category: 'servicios',
  name: {
    es: 'Ventana al Mundo',
    en: 'Window to the World',
  },
  description: {
    es: 'Monumento urbano de referencia.',
    en: 'Urban landmark.',
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
      es: 'Hito cultural contemporaneo.',
      en: 'Contemporary cultural landmark.',
    },
    openingHours: {
      es: 'Espacio publico abierto',
      en: 'Open public space',
    },
  },
};

describe('PlacesMapFlow e2e', () => {
  it('Usuario en Modo Turista toca marcador -> ve tarjeta multimedia', () => {
    const onPlacePress = jest.fn<void, [PlaceMapFeature]>();

    const { getByTestId, getByText } = render(
      <WebQuillaMap
        mode="tourist"
        center={ventanaAlMundo.coordinate}
        places={[ventanaAlMundo]}
        showDefaultShadeZones={false}
        onPlacePress={onPlacePress}
      />
    );

    fireEvent.press(getByTestId('quillamap-web-place-marker-tourist-ventana-al-mundo'));

    expect(onPlacePress).toHaveBeenCalledWith(ventanaAlMundo);
    expect(getByTestId('place-bottom-sheet')).toBeTruthy();
    expect(getByText('Monumento urbano de referencia.\nUrban landmark.')).toBeTruthy();
    expect(getByText('Espacio publico abierto\nOpen public space')).toBeTruthy();
  });

  it('Usuario en Modo Moto toca marcador -> no ocurre accion', () => {
    const onPlacePress = jest.fn<void, [PlaceMapFeature]>();

    const { getByTestId, queryByTestId } = render(
      <WebQuillaMap
        mode="motorcycle"
        center={ventanaAlMundo.coordinate}
        places={[ventanaAlMundo]}
        showDefaultShadeZones={false}
        onPlacePress={onPlacePress}
      />
    );

    fireEvent.press(getByTestId('quillamap-web-place-marker-tourist-ventana-al-mundo'));

    expect(onPlacePress).not.toHaveBeenCalled();
    expect(queryByTestId('place-bottom-sheet')).toBeNull();
  });
});
