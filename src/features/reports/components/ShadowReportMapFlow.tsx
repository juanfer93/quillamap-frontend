import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import { reportsApi } from '@/api/client';
import PedestrianMapContainer from '@/features/pedestrian/components/PedestrianMapContainer';
import {
  DEFAULT_PEDESTRIAN_CENTER,
  type PedestrianCoordinates,
  type ShadowZone,
} from '@/features/pedestrian/schemas/pedestrian.schema';
import { useCreateReport } from '../hooks/useCreateReport';
import { SHADOW_REPORTS_LOOKUP_RADIUS_METERS } from '../constants/shadow-report.constants';
import { ReportType, type Report } from '../types/report.types';

interface ShadowReportMapFlowProps {
  initialShadowZones?: ShadowZone[];
  themeMode?: 'light' | 'dark';
}

interface ReportIconProps {
  name: string;
  size: number;
  color: string;
}

const ReportIcon = Ionicons as React.ComponentType<ReportIconProps>;

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
}: ShadowReportMapFlowProps) => {
  const [selectedCoordinate, setSelectedCoordinate] = useState<PedestrianCoordinates | null>(null);
  const [nearbyReports, setNearbyReports] = useState<Report[]>([]);
  const [createdReports, setCreatedReports] = useState<Report[]>([]);
  const { createReport, errorMessage, isCreating } = useCreateReport();
  const isShadowReportingAvailable = themeMode !== 'dark';
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
  const markerColor = tw.color('secondary') ?? tw.color('brand-secondary') ?? '';

  const loadPersistedShadowReports = useCallback(async () => {
    const reports = await reportsApi
      .findNearby({
        lat: DEFAULT_PEDESTRIAN_CENTER.latitude,
        lng: DEFAULT_PEDESTRIAN_CENTER.longitude,
        radius: SHADOW_REPORTS_LOOKUP_RADIUS_METERS,
      })
    return reports.filter((report) => report.type === ReportType.SOMBRA);
  }, []);

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
    }
  }, [isShadowReportingAvailable]);

  const handleCreateShadowReport = async () => {
    if (!selectedCoordinate || isCreating) {
      return;
    }

    try {
      const report = await createReport(createShadowReportDto(selectedCoordinate));
      setCreatedReports((currentReports) => [...currentReports, report]);
      loadPersistedShadowReports()
        .then(setNearbyReports)
        .catch(() => undefined);
      setSelectedCoordinate(null);
    } catch {
      // The hook owns the visible error state and session cleanup.
    }
  };

  return (
    <View testID="shadow-report-flow" style={tw`flex-1 bg-surface-light dark:bg-charcoal`}>
      <PedestrianMapContainer
        shadowZones={shadowZones}
        themeMode={themeMode}
        showHeader={false}
        selectedShadowCoordinate={isShadowReportingAvailable ? selectedCoordinate : null}
        onMapPress={isShadowReportingAvailable ? setSelectedCoordinate : undefined}
      />

      {isShadowReportingAvailable ? (
        <View
          pointerEvents="box-none"
          style={tw`absolute left-m right-m bottom-20 items-center`}
        >
        <Pressable
          testID="shadow-report-submit"
          accessibilityRole="button"
          accessibilityLabel="Reportar zona de sombra"
          disabled={!selectedCoordinate || isCreating}
          onPress={handleCreateShadowReport}
          style={[
            tw`min-h-12 rounded-m px-m py-s flex-row items-center justify-center border`,
            selectedCoordinate && !isCreating
              ? tw`bg-primary border-primary dark:bg-secondary dark:border-secondary`
              : tw`bg-medium-gray border-medium-gray`,
          ]}
        >
          <ReportIcon
            name="umbrella-outline"
            size={18}
            color={selectedCoordinate && !isCreating ? markerColor : tw.color('dark-gray') ?? ''}
          />
          <Text
            numberOfLines={1}
            style={[
              tw`ml-s font-bold`,
              selectedCoordinate && !isCreating ? tw`text-white dark:text-black` : tw`text-dark-gray`,
            ]}
          >
            {isCreating ? 'Guardando sombra' : 'Reportar sombra'}
          </Text>
        </Pressable>

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
