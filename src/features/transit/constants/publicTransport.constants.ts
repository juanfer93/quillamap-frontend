import type { TransitAgencyKind } from '@/types/contracts/transit.contract';
import type { PublicTransportMode } from '../types/publicTransport.types';

export const PUBLIC_TRANSPORT_PLACES_RADIUS_METERS = 5_000;
export const PUBLIC_TRANSPORT_PLACES_LIMIT = 180;

export const INITIAL_PUBLIC_TRANSPORT_MODE: PublicTransportMode = 'buses';
export const INITIAL_TRANSIT_AGENCY_KIND: TransitAgencyKind = 'colectivo';

export const INITIAL_TRANSIT_SELECTION_BY_AGENCY: Record<TransitAgencyKind, string | null> = {
  colectivo: null,
  transmetro: null,
};

export const PUBLIC_TRANSPORT_ERROR_MESSAGES = {
  missingPoints: 'Selecciona Punto A y Punto B desde lugares inyectados.',
  suggestionsFallback: 'No fue posible buscar opciones de transporte publico.',
} as const;
