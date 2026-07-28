import type { Feature, FeatureCollection, LineString } from 'geojson';
import type {
  TransitItinerary,
  TransitLeg,
  TransitLegType,
} from '@/types/contracts/transit.contract';
import { TRANSIT_VISUAL_IDENTITY } from '@/types/contracts/transit.contract';

export interface TransitLegStyle {
  lineColor: string;
  lineWidth: number;
  lineDasharray?: number[];
}

export const countTransitTransfers = (legs: TransitLeg[]): number =>
  Math.max(0, legs.filter((leg) => leg.type === 'bus').length - 1);

export const getTransitLegStyle = (type: TransitLegType): TransitLegStyle => {
  if (type === 'walk') {
    return {
      lineColor: TRANSIT_VISUAL_IDENTITY.walkLine,
      lineWidth: 4,
      lineDasharray: [2, 2],
    };
  }

  if (type === 'transfer') {
    return {
      lineColor: TRANSIT_VISUAL_IDENTITY.transferMarker,
      lineWidth: 4,
      lineDasharray: [1, 2],
    };
  }

  return {
    lineColor: TRANSIT_VISUAL_IDENTITY.busLine,
    lineWidth: 6,
  };
};

export const summarizeTransitItinerary = (itinerary: TransitItinerary) => ({
  distanceMeters: itinerary.legs.reduce((total, leg) => total + leg.distanceMeters, 0),
  durationSeconds: itinerary.legs.reduce((total, leg) => total + leg.durationSeconds, 0),
  transfers: countTransitTransfers(itinerary.legs),
});

export const getTransitLegFeatureCollection = (
  itinerary: TransitItinerary
): FeatureCollection<LineString> => ({
  type: 'FeatureCollection',
  features: itinerary.legs.flatMap((leg): Feature<LineString>[] => {
    if (leg.geometry.length < 2) {
      return [];
    }

    const style = getTransitLegStyle(leg.type);

    return [{
      type: 'Feature',
      id: leg.id,
      properties: {
        id: leg.id,
        type: leg.type,
        routeId: leg.routeId ?? null,
        routeShortName: leg.routeShortName ?? null,
        lineColor: style.lineColor,
        lineWidth: style.lineWidth,
        lineDasharray: style.lineDasharray ?? null,
      },
      geometry: {
        type: 'LineString',
        coordinates: leg.geometry.map((point) => [point.longitude, point.latitude]),
      },
    }];
  }),
});
