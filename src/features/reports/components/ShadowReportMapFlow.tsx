import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import tw from '@/lib/tailwind';
import { reportsApi } from '@/api';
import PedestrianMapContainer from '@/features/pedestrian/components/PedestrianMapContainer';
import ThermalComfortRouteSearchPanel from '@/features/thermal-comfort/components/ThermalComfortRouteSearchPanel';
import { toThermalComfortRouteOverlay } from '@/features/thermal-comfort/utils/thermalComfortRouteOverlay';
import type { ThermalComfortRoutePreview } from '@/features/thermal-comfort/types/thermalComfortRoute.types';
import UserToolsMenu from '@/features/navigation/components/UserToolsMenu';
import { useLocationPermissions } from '@/features/navigation/hooks/useLocationPermissions';
import { usePlaces } from '@/features/places/hooks/usePlaces';
import {
  DEFAULT_PEDESTRIAN_CENTER,
  type PedestrianCoordinates,
  type ShadowZone,
} from '@/features/pedestrian/schemas/pedestrian.schema';
import { useCreateReport } from '../hooks/useCreateReport';
import { useReportEvidence } from '../hooks/useReportEvidence';
import { SHADOW_REPORTS_MAP_LOOKUP_RADIUS_METERS } from '../constants/shadow-report.constants';
import { getReportTypeOption } from '../constants/report-evidence.constants';
import { useReportStore } from '../store/useReportStore';
import { ReportType, type Report, type ReportEvidenceImage } from '../types/report.types';

interface ShadowReportMapFlowProps {
  initialShadowZones?: ShadowZone[];
  themeMode?: 'light' | 'dark';
  canReportShadow?: boolean;
  licensePlate?: string | null;
  onOpenPublicTransport?: () => void;
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

const createCommunityReportDto = (
  reportType: ReportType,
  coordinate: PedestrianCoordinates,
  evidenceImage?: ReportEvidenceImage | null
) => ({
  type: reportType,
  description: getReportTypeOption(reportType).defaultDescription,
  location: {
    type: 'Point' as const,
    coordinates: [coordinate.longitude, coordinate.latitude] as [number, number],
  },
  evidenceImage,
});

const createShadowReportDto = (
  coordinate: PedestrianCoordinates,
  evidenceImage?: ReportEvidenceImage | null
) => createCommunityReportDto(ReportType.SOMBRA, coordinate, evidenceImage);

const ShadowReportMapFlow = ({
  initialShadowZones = [],
  themeMode = 'light',
  canReportShadow = false,
  licensePlate,
  onOpenPublicTransport,
  onLogout,
}: ShadowReportMapFlowProps) => {
  const [selectedCoordinate, setSelectedCoordinate] = useState<PedestrianCoordinates | null>(null);
  const [isSelectingShadowLocation, setIsSelectingShadowLocation] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [evidenceMessage, setEvidenceMessage] = useState<string | null>(null);
  const [isShadeRouteSearchOpen, setIsShadeRouteSearchOpen] = useState(false);
  const [thermalComfortRoutePreview, setThermalComfortRoutePreview] = useState<ThermalComfortRoutePreview | null>(null);
  const [nearbyReports, setNearbyReports] = useState<Report[]>([]);
  const [createdReports, setCreatedReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { createReport, errorMessage, isCreating } = useCreateReport();
  const { capturePhoto, pickFromGallery } = useReportEvidence();
  const activeReportType = useReportStore((state) => state.activeReportType);
  const startReportDraft = useReportStore((state) => state.startReportDraft);
  const resetReportDraft = useReportStore((state) => state.resetReportDraft);
  const { currentLocation } = useLocationPermissions();
  const lookupCenter = currentLocation ?? DEFAULT_PEDESTRIAN_CENTER;
  const { places } = usePlaces({
    lat: lookupCenter.latitude,
    lng: lookupCenter.longitude,
    radius: 5000,
  });
  const isShadowReportingAvailable = canReportShadow;
  const canSelectShadowLocation = isShadowReportingAvailable && isSelectingShadowLocation;
  const activeReportOption = getReportTypeOption(activeReportType ?? ReportType.SOMBRA);
  const canAnswerEvidencePrompt = Boolean(selectedCoordinate && activeReportType) && !isSelectingShadowLocation;
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
      setEvidenceMessage(null);
      resetReportDraft();
    }
  }, [isShadowReportingAvailable, resetReportDraft]);

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
    setEvidenceMessage(null);
    setSelectedReport(null);
    startReportDraft(ReportType.SOMBRA);
    setIsSelectingShadowLocation(true);
  };

  const handleShadeRoutePreview = (preview: ThermalComfortRoutePreview) => {
    setThermalComfortRoutePreview(preview);
  };

  const closeShadeRouteSearch = () => {
    setIsShadeRouteSearchOpen(false);
    setThermalComfortRoutePreview(null);
  };

  const handleSelectShadowLocation = async (coordinate: PedestrianCoordinates) => {
    if (!canSelectShadowLocation || isCreating) {
      return;
    }

    setSelectedCoordinate(coordinate);
    setIsSelectingShadowLocation(false);
    setEvidenceMessage(null);
  };

  const submitPendingReport = async (evidenceImage?: ReportEvidenceImage | null) => {
    if (!selectedCoordinate || !activeReportType || isCreating) {
      return;
    }

    try {
      const report = await createReport(createCommunityReportDto(activeReportType, selectedCoordinate, evidenceImage));
      setCreatedReports((currentReports) => [...currentReports, report]);
      loadPersistedShadowReports()
        .then(setNearbyReports)
        .catch(() => undefined);
      setSelectedCoordinate(null);
      resetReportDraft();
      setSuccessMessage(`${activeReportOption.label} reportada`);
    } catch {
      // The hook owns the visible error state and session cleanup.
      setSelectedCoordinate(null);
      resetReportDraft();
      setSuccessMessage(null);
    }
  };

  const handleSkipEvidence = () => {
    void submitPendingReport(null);
  };

  const handleCaptureEvidence = async () => {
    if (!selectedCoordinate || isCreating) {
      return;
    }

    const image = await capturePhoto();
    if (!image) {
      setEvidenceMessage('No se adjunto foto. Puedes intentar de nuevo o reportar sin evidencia.');
      return;
    }

    await submitPendingReport(image);
  };

  const handlePickEvidence = async () => {
    if (!selectedCoordinate || isCreating) {
      return;
    }

    const image = await pickFromGallery();
    if (!image) {
      setEvidenceMessage('No se adjunto foto. Puedes intentar de nuevo o reportar sin evidencia.');
      return;
    }

    await submitPendingReport(image);
  };

  const handleCancelPendingReport = () => {
    setSelectedCoordinate(null);
    setIsSelectingShadowLocation(false);
    setEvidenceMessage(null);
    resetReportDraft();
  };

  const reportShadowLabel = isSelectingShadowLocation ? 'Seleccionando sombra' : 'Reportar sombra';
  const thermalComfortRoute = toThermalComfortRouteOverlay(thermalComfortRoutePreview);
  const shouldInterruptLocation = thermalComfortRoutePreview?.searchMode === 'place';

  return (
    <View testID="shadow-report-flow" style={tw`flex-1 bg-surface-light dark:bg-charcoal`}>
      <PedestrianMapContainer
        shadowZones={shadowZones}
        themeMode={themeMode}
        initialCenter={lookupCenter}
        places={places}
        showHeader={false}
        selectedShadowCoordinate={selectedCoordinate}
        licensePlate={licensePlate}
        thermalComfortRoute={thermalComfortRoute}
        suppressMapDecorations={shouldInterruptLocation}
        renderProfileTools={(transitRoutesSection) => (
          <UserToolsMenu
            canReportShadow={isShadowReportingAvailable}
            isReportShadowDisabled={isCreating}
            isReportingShadow={isCreating}
            reportShadowLabel={reportShadowLabel}
            profileSections={transitRoutesSection}
            onOpenPublicTransport={onOpenPublicTransport}
            onOpenThermalComfortRouteSearch={() => setIsShadeRouteSearchOpen(true)}
            onReportShadow={handleShadowToolPress}
            onLogout={onLogout}
          />
        )}
        onMapPress={canSelectShadowLocation ? handleSelectShadowLocation : undefined}
        onShadowZonePress={(zone) => {
          const report = reportMap.get(zone.id);
          setSelectedReport(report ?? null);
        }}
      />

      {isShadeRouteSearchOpen ? (
        <ThermalComfortRouteSearchPanel
          currentLocation={currentLocation ? { ...currentLocation, label: 'Mi ubicacion' } : null}
          places={places}
          onClose={closeShadeRouteSearch}
          onClearPreview={() => setThermalComfortRoutePreview(null)}
          onRoutePreview={handleShadeRoutePreview}
        />
      ) : null}

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

      {canAnswerEvidencePrompt ? (
        <View testID="report-evidence-prompt" style={tw`absolute left-m right-m bottom-20 rounded-m bg-white dark:bg-slate p-m`}>
          <Text style={tw`text-primary dark:text-secondary text-lg font-bold`}>
            {activeReportOption.label}
          </Text>
          <Text style={tw`mt-xs text-dark-gray dark:text-light-gray`}>
            {activeReportOption.evidencePrompt}
          </Text>
          {evidenceMessage ? (
            <Text testID="report-evidence-message" style={tw`mt-xs text-error`}>
              {evidenceMessage}
            </Text>
          ) : null}
          <View style={tw`mt-s flex-row flex-wrap`}>
            <Pressable
              testID="report-evidence-camera"
              accessibilityRole="button"
              accessibilityLabel="Tomar foto de evidencia"
              disabled={isCreating}
              onPress={() => void handleCaptureEvidence()}
              style={tw`mb-s mr-s rounded-s bg-primary px-s py-s`}
            >
              <Text style={tw`font-bold text-white`}>Tomar foto</Text>
            </Pressable>
            <Pressable
              testID="report-evidence-gallery"
              accessibilityRole="button"
              accessibilityLabel="Elegir evidencia desde galeria"
              disabled={isCreating}
              onPress={() => void handlePickEvidence()}
              style={tw`mb-s mr-s rounded-s bg-surface-light dark:bg-charcoal px-s py-s`}
            >
              <Text style={tw`font-bold text-primary dark:text-secondary`}>Galeria</Text>
            </Pressable>
            <Pressable
              testID="report-evidence-skip"
              accessibilityRole="button"
              accessibilityLabel="Reportar sin evidencia"
              disabled={isCreating}
              onPress={handleSkipEvidence}
              style={tw`mb-s mr-s rounded-s bg-map-shade px-s py-s`}
            >
              <Text style={tw`font-bold text-white`}>{isCreating ? 'Guardando' : 'Ahora no'}</Text>
            </Pressable>
            <Pressable
              testID="report-evidence-cancel"
              accessibilityRole="button"
              accessibilityLabel="Cancelar reporte"
              disabled={isCreating}
              onPress={handleCancelPendingReport}
              style={tw`mb-s rounded-s border border-medium-gray px-s py-s`}
            >
              <Text style={tw`font-bold text-dark-gray dark:text-light-gray`}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {selectedReport ? (
        <View testID="shadow-report-detail" style={tw`absolute left-m right-m bottom-20 rounded-m bg-white dark:bg-slate p-m`}>
          <Text style={tw`text-primary dark:text-secondary text-lg font-bold`}>Sombra reportada</Text>
          <Text style={tw`mt-xs text-dark-gray dark:text-light-gray`}>
            {selectedReport.description}
          </Text>
          {selectedReport.imageUrl ? (
            <Image
              testID="shadow-report-evidence-image"
              source={{ uri: selectedReport.imageUrl }}
              resizeMode="cover"
              style={tw`mt-s h-40 w-full rounded-s bg-light-gray`}
            />
          ) : (
            <Text testID="shadow-report-no-evidence" style={tw`mt-s text-dark-gray dark:text-light-gray`}>
              Esta sombra todavia no tiene foto de evidencia.
            </Text>
          )}
          <Pressable
            testID="shadow-report-detail-close"
            accessibilityRole="button"
            accessibilityLabel="Cerrar detalle de sombra"
            onPress={() => setSelectedReport(null)}
            style={tw`mt-s rounded-s bg-primary px-s py-s`}
          >
            <Text style={tw`text-center font-bold text-white`}>Cerrar</Text>
          </Pressable>
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
