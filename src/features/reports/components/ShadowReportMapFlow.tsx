import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import tw from '@/lib/tailwind';
import { reportsApi } from '@/api/client';
import PedestrianMapContainer from '@/features/pedestrian/components/PedestrianMapContainer';
import UserToolsMenu from '@/features/navigation/components/UserToolsMenu';
import { useLocationPermissions } from '@/features/navigation/hooks/useLocationPermissions';
import { usePlaces } from '@/features/places/hooks/usePlaces';
import {
  DEFAULT_PEDESTRIAN_CENTER,
  type PedestrianCoordinates,
  type ShadowZone,
} from '@/features/pedestrian/schemas/pedestrian.schema';
import { useCreateReport } from '../hooks/useCreateReport';
import { SHADOW_REPORTS_MAP_LOOKUP_RADIUS_METERS } from '../constants/shadow-report.constants';
import { ReportType, type Report } from '../types/report.types';

interface ShadowReportMapFlowProps {
  initialShadowZones?: ShadowZone[];
  themeMode?: 'light' | 'dark';
  canReportShadow?: boolean;
  onLogout: () => void;
}

const toShadowZone = (report: Report): ShadowZone => ({
  id: report.id,
  type: ReportType.SOMBRA,
  description: report.description,
  status: report.status,
  location: {
    latitude: report.location.coordinates[1],
    longitude: report.location.coordinates[0],
  },
  coverageRadiusMeters: 400,
  createdAt: report.createdAt,
});

const createShadowReportDto = (coordinate: PedestrianCoordinates) => ({
  type: ReportType.SOMBRA,
  description: 'Zona de sombra reportada por la comunidad',
  location: {
    type: 'Point' as const,
    coordinates: [coordinate.longitude, coordinate.latitude] as [number, number],
  },
});

const ShadowReportMapFlow = ({
  initialShadowZones = [],
  themeMode = 'light',
  canReportShadow = false,
  onLogout,
}: ShadowReportMapFlowProps) => {
  const [selectedCoordinate, setSelectedCoordinate] = useState<PedestrianCoordinates | null>(null);
  const [isSelectingShadowLocation, setIsSelectingShadowLocation] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nearbyReports, setNearbyReports] = useState<Report[]>([]);
  const [createdReports, setCreatedReports] = useState<Report[]>([]);
  const { createReport, errorMessage, isCreating } = useCreateReport();
  const { currentLocation } = useLocationPermissions();
  const lookupCenter = currentLocation ?? DEFAULT_PEDESTRIAN_CENTER;
  const { places } = usePlaces({
    lat: lookupCenter.latitude,
    lng: lookupCenter.longitude,
    radius: 5000,
  });
  const isShadowReportingAvailable = canReportShadow;
  const canSelectShadowLocation = isShadowReportingAvailable && isSelectingShadowLocation;
  const reportMap = useMemo(() => {
    const reports = new Map<string, Report>();

    [...nearbyReports, ...createdReports].forEach((report) => {
      if (report.type === ReportType.SOMBRA) {
        reports.set(report.id, report);
      }
    });

    return reports;
  }, [createdReports, nearbyReports]);
  const shadowZones = useMemo(
    () => [...initialShadowZones, ...Array.from(reportMap.values()).map(toShadowZone)],
    [initialShadowZones, reportMap]
  );

  const loadPersistedShadowReports = useCallback(async () => {
    const reports = await reportsApi
      .findNearby({
        lat: lookupCenter.latitude,
        lng: lookupCenter.longitude,
        radius: SHADOW_REPORTS_MAP_LOOKUP_RADIUS_METERS,
      });
    return reports.filter((report) => report.type === ReportType.SOMBRA);
  }, [lookupCenter.latitude, lookupCenter.longitude]);

  useEffect(() => {
    let isMounted = true;

    loadPersistedShadowReports()
      .then((reports) => {
        if (isMounted) {
          setNearbyReports(reports);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNearbyReports([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loadPersistedShadowReports]);

  useEffect(() => {
    if (!isShadowReportingAvailable) {
      setSelectedCoordinate(null);
      setIsSelectingShadowLocation(false);
      setSuccessMessage(null);
    }
  }, [isShadowReportingAvailable]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const handleShadowToolPress = async () => {
    if (isCreating) {
      return;
    }

    setSelectedCoordinate(null);
    setSuccessMessage(null);
    setIsSelectingShadowLocation(true);
  };

  const handleSelectShadowLocation = async (coordinate: PedestrianCoordinates) => {
    if (!canSelectShadowLocation || isCreating) {
      return;
    }

    setSelectedCoordinate(coordinate);
    setIsSelectingShadowLocation(false);

    try {
      const report = await createReport(createShadowReportDto(coordinate));
      setCreatedReports((currentReports) => [...currentReports, report]);
      loadPersistedShadowReports()
        .then(setNearbyReports)
        .catch(() => undefined);
      setSelectedCoordinate(null);
      setSuccessMessage('Sombra reportada');
    } catch {
      // The hook owns the visible error state and session cleanup.
      setSelectedCoordinate(null);
      setSuccessMessage(null);
    }
  };

  const reportShadowLabel = isSelectingShadowLocation ? 'Seleccionando sombra' : 'Reportar sombra';

  return (
    <View testID="shadow-report-flow" style={tw`flex-1 bg-surface-light dark:bg-charcoal`}>
      <PedestrianMapContainer
        shadowZones={shadowZones}
        themeMode={themeMode}
        initialCenter={lookupCenter}
        places={places}
        showHeader={false}
        selectedShadowCoordinate={selectedCoordinate}
        profileTools={(
          <UserToolsMenu
            canReportShadow={isShadowReportingAvailable}
            isReportShadowDisabled={isCreating}
            isReportingShadow={isCreating}
            reportShadowLabel={reportShadowLabel}
            onReportShadow={handleShadowToolPress}
            onLogout={onLogout}
          />
        )}
        onMapPress={canSelectShadowLocation ? handleSelectShadowLocation : undefined}
      />

      {canSelectShadowLocation ? (
        <View pointerEvents="none" style={tw`absolute left-m right-m bottom-24 items-center`}>
          <Text
            testID="shadow-placement-hint"
            style={tw`rounded-m bg-white dark:bg-slate px-m py-s text-primary dark:text-secondary font-bold`}
          >
            Toca el mapa para ubicar la sombra
          </Text>
        </View>
      ) : null}

      {successMessage && !errorMessage ? (
        <View pointerEvents="none" style={tw`absolute left-m right-m bottom-20 items-center`}>
          <Text
            testID="shadow-report-success"
            style={tw`rounded-m bg-map-shade px-m py-s text-white font-bold`}
          >
            {successMessage}
          </Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View pointerEvents="box-none" style={tw`absolute left-m right-m bottom-20 items-center`}>
          {errorMessage ? (
            <Text testID="shadow-report-error" style={tw`mt-s text-error text-center`}>
              {errorMessage}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export { createShadowReportDto };
export default ShadowReportMapFlow;
