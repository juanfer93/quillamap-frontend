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
import { useProximityRadar } from '@/features/navigation/hooks/useProximityRadar';
import { useVelocityGuard } from '@/features/navigation/hooks/useVelocityGuard';
import { useLayerStore } from '@/features/navigation/store/useLayerStore';
import { DRIVING_LOCK_THRESHOLD_KMH } from '@/features/navigation/utils/drivingLock';
import { usePlaces } from '@/features/places/hooks/usePlaces';
import SecurityRiskBottomSheet from '@/features/security/components/SecurityRiskBottomSheet';
import { SECURITY_HEATMAP_LOOKUP_RADIUS_METERS, useSecurityHeatmap } from '@/features/security/hooks/useSecurityHeatmap';
import { useSecurityProximityAlert } from '@/features/security/hooks/useSecurityProximityAlert';
import { useSecurityMapStore } from '@/features/security/store/useSecurityMapStore';
import type {
  SecurityHeatmapPointContract,
  SecurityRiskLevel,
} from '@/types/contracts/security.contract';
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

const DEFAULT_SECURITY_DANGER_LEVEL = 4;

const SECURITY_DANGER_LEVEL_OPTIONS = [
  { value: 3, label: 'Moderado' },
  { value: 4, label: 'Peligroso' },
  { value: 5, label: 'Muy peligroso' },
] as const;

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

const getSecurityRiskLevelFromDangerLevel = (dangerLevel: number): SecurityRiskLevel => {
  if (dangerLevel >= 5) {
    return 'critical';
  }

  if (dangerLevel >= 4) {
    return 'high';
  }

  if (dangerLevel >= 3) {
    return 'medium';
  }

  return 'low';
};

const toSecurityHeatmapPoint = (
  report: Report,
  dangerLevel: number
): SecurityHeatmapPointContract => ({
  clusterId: report.id,
  latitude: report.location.coordinates[1],
  longitude: report.location.coordinates[0],
  intensity: dangerLevel / 5,
  dangerLevel,
  veracityScore: report.imageUrl ? 0.8 : 0.4,
  reportCount: 1,
  radiusMeters: 50,
  riskLevel: getSecurityRiskLevelFromDangerLevel(dangerLevel),
  hasVerifiedEvidence: Boolean(report.imageUrl),
  generatedFrom: report.createdAt,
  generatedTo: report.createdAt,
});

const createCommunityReportDto = (
  reportType: ReportType,
  coordinate: PedestrianCoordinates,
  evidenceImage?: ReportEvidenceImage | null,
  dangerLevel?: number
) => ({
  type: reportType,
  description: getReportTypeOption(reportType).defaultDescription,
  location: {
    type: 'Point' as const,
    coordinates: [coordinate.longitude, coordinate.latitude] as [number, number],
  },
  dangerLevel,
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
  const [selectedSecurityPoint, setSelectedSecurityPoint] = useState<SecurityHeatmapPointContract | null>(null);
  const [securityDangerLevel, setSecurityDangerLevel] = useState(DEFAULT_SECURITY_DANGER_LEVEL);
  const { createReport, errorMessage, isCreating } = useCreateReport();
  const { capturePhoto, pickFromGallery } = useReportEvidence();
  const activeReportType = useReportStore((state) => state.activeReportType);
  const startReportDraft = useReportStore((state) => state.startReportDraft);
  const resetReportDraft = useReportStore((state) => state.resetReportDraft);
  const { currentLocation } = useLocationPermissions();
  const { speedKmh } = useVelocityGuard();
  const heatmap = useSecurityMapStore((state) => state.heatmap);
  const setSecurityHeatmap = useSecurityMapStore((state) => state.setSecurityHeatmap);
  const isSecurityMapLoading = useSecurityMapStore((state) => state.isSecurityMapLoading);
  const isSecurityMapEnabled = useLayerStore((state) => state.isSecurityMapEnabled);
  const toggleSecurityMap = useLayerStore((state) => state.toggleSecurityMap);
  const setSecurityMapEnabled = useLayerStore((state) => state.setSecurityMapEnabled);
  const addLocalSecurityPoint = useSecurityMapStore((state) => state.addLocalSecurityPoint);
  const lookupCenter = currentLocation ?? DEFAULT_PEDESTRIAN_CENTER;
  const isSecurityDrivingLockActive = speedKmh > DRIVING_LOCK_THRESHOLD_KMH;
  useSecurityHeatmap({
    center: lookupCenter,
    enabled: isSecurityMapEnabled,
    isDrivingLockActive: isSecurityDrivingLockActive,
  });
  const { places } = usePlaces({
    lat: lookupCenter.latitude,
    lng: lookupCenter.longitude,
    radius: 5000,
  });
  const isShadowReportingAvailable = canReportShadow;
  const isSecurityReportDraft = activeReportType === ReportType.INSEGURIDAD;
  const canSelectReportLocation = Boolean(activeReportType) && isSelectingShadowLocation;
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
  const securityProximityTargets = useMemo(
    () => heatmap?.points
      .filter((point) => point.riskLevel === 'high' || point.riskLevel === 'critical')
      .map((point) => ({
        id: point.clusterId,
        coordinate: {
          longitude: point.longitude,
          latitude: point.latitude,
        },
        radiusMeters: point.radiusMeters,
      })) ?? [],
    [heatmap]
  );
  const securityProximityRadar = useProximityRadar(currentLocation, securityProximityTargets);
  useSecurityProximityAlert({
    enabled: isSecurityMapEnabled && isSecurityDrivingLockActive,
    shouldAlert: securityProximityRadar.shouldAlert,
  });

  const reloadSecurityHeatmap = useCallback(async () => {
    if (!isSecurityMapEnabled) {
      return;
    }

    const nextHeatmap = await reportsApi.findSecurityHeatmap({
      lat: lookupCenter.latitude,
      lng: lookupCenter.longitude,
      radius: SECURITY_HEATMAP_LOOKUP_RADIUS_METERS,
      criticalOnly: isSecurityDrivingLockActive,
      proximityRadius: isSecurityDrivingLockActive ? 500 : undefined,
    });
    setSecurityHeatmap(nextHeatmap);
  }, [
    isSecurityDrivingLockActive,
    isSecurityMapEnabled,
    lookupCenter.latitude,
    lookupCenter.longitude,
    setSecurityHeatmap,
  ]);

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
    setSelectedSecurityPoint(null);
    startReportDraft(ReportType.SOMBRA);
    setIsSelectingShadowLocation(true);
  };

  const handleSecurityToolPress = async () => {
    if (isCreating) {
      return;
    }

    setSelectedCoordinate(null);
    setSuccessMessage(null);
    setEvidenceMessage(null);
    setSelectedReport(null);
    setSelectedSecurityPoint(null);
    setSecurityDangerLevel(DEFAULT_SECURITY_DANGER_LEVEL);
    startReportDraft(ReportType.INSEGURIDAD);
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
    if (!canSelectReportLocation || isCreating) {
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
      const report = await createReport(createCommunityReportDto(
        activeReportType,
        selectedCoordinate,
        evidenceImage,
        activeReportType === ReportType.INSEGURIDAD ? securityDangerLevel : undefined
      ));
      setCreatedReports((currentReports) => [...currentReports, report]);
      loadPersistedShadowReports()
        .then(setNearbyReports)
        .catch(() => undefined);
      if (activeReportType === ReportType.INSEGURIDAD) {
        addLocalSecurityPoint(toSecurityHeatmapPoint(report, securityDangerLevel));
        setSecurityMapEnabled(true);
        reloadSecurityHeatmap().catch(() => undefined);
      }
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
    setSecurityDangerLevel(DEFAULT_SECURITY_DANGER_LEVEL);
    resetReportDraft();
  };

  const reportShadowLabel = isSelectingShadowLocation ? 'Seleccionando sombra' : 'Reportar sombra';
  const reportSecurityLabel = isSelectingShadowLocation && isSecurityReportDraft
    ? 'Seleccionando zona'
    : 'Reportar zona peligrosa';
  const placementHint = isSecurityReportDraft
    ? 'Toca el mapa para ubicar la zona peligrosa'
    : 'Toca el mapa para ubicar la sombra';
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
        draftMarkerKind={isSecurityReportDraft ? 'security' : 'shadow'}
        licensePlate={licensePlate}
        thermalComfortRoute={thermalComfortRoute}
        securityHeatmap={isSecurityMapEnabled && !shouldInterruptLocation ? heatmap : null}
        onSecurityHeatmapPointPress={(point) => {
          setSelectedReport(null);
          setSelectedSecurityPoint(point);
        }}
        suppressMapDecorations={shouldInterruptLocation}
        renderProfileTools={(transitRoutesSection) => (
          <UserToolsMenu
            canReportShadow={isShadowReportingAvailable}
            canReportSecurity
            isReportShadowDisabled={isCreating}
            isReportSecurityDisabled={isCreating}
            isReportingShadow={isCreating && activeReportType === ReportType.SOMBRA}
            isReportingSecurity={isCreating && isSecurityReportDraft}
            reportShadowLabel={reportShadowLabel}
            reportSecurityLabel={reportSecurityLabel}
            profileSections={transitRoutesSection}
            isSecurityMapEnabled={isSecurityMapEnabled}
            isSecurityMapLoading={isSecurityMapLoading}
            onOpenPublicTransport={onOpenPublicTransport}
            onOpenThermalComfortRouteSearch={() => setIsShadeRouteSearchOpen(true)}
            onToggleSecurityMap={toggleSecurityMap}
            onReportShadow={handleShadowToolPress}
            onReportSecurity={handleSecurityToolPress}
            onLogout={onLogout}
          />
        )}
        onMapPress={canSelectReportLocation ? handleSelectShadowLocation : undefined}
        onShadowZonePress={(zone) => {
          const report = reportMap.get(zone.id);
          setSelectedReport(report ?? null);
          setSelectedSecurityPoint(null);
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

      {canSelectReportLocation ? (
        <View pointerEvents="none" style={tw`absolute left-m right-m bottom-24 items-center`}>
          <Text
            testID="shadow-placement-hint"
            style={tw`rounded-m bg-white dark:bg-slate px-m py-s text-primary dark:text-secondary font-bold`}
          >
            {placementHint}
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
          {isSecurityReportDraft ? (
            <View testID="security-danger-level-picker" style={tw`mt-s`}>
              <Text style={tw`text-primary dark:text-secondary font-bold`}>
                Nivel de riesgo
              </Text>
              <View style={tw`mt-xs flex-row flex-wrap`}>
                {SECURITY_DANGER_LEVEL_OPTIONS.map((option) => {
                  const isSelected = securityDangerLevel === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      testID={`security-danger-level-${option.value}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Nivel de riesgo ${option.label}`}
                      onPress={() => setSecurityDangerLevel(option.value)}
                      style={[
                        tw`mb-xs mr-xs rounded-s border px-s py-xs`,
                        {
                          backgroundColor: isSelected ? '#004574' : '#FFFFFF',
                          borderColor: '#004574',
                        },
                      ]}
                    >
                      <Text style={[tw`font-bold`, { color: isSelected ? '#FFFFFF' : '#004574' }]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
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
              <Text style={tw`font-bold text-white`}>{isCreating ? 'Guardando' : 'Guardar'}</Text>
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

      {selectedSecurityPoint ? (
        <SecurityRiskBottomSheet
          point={selectedSecurityPoint}
          riskLabels={heatmap?.metadata.riskLabels}
          themeMode={themeMode}
          onClose={() => setSelectedSecurityPoint(null)}
        />
      ) : null}

      {isSecurityMapEnabled && isSecurityDrivingLockActive && securityProximityRadar.shouldAlert ? (
        <View pointerEvents="none" style={tw`absolute left-m right-m bottom-36 items-center`}>
          <Text testID="security-proximity-alert" style={tw`rounded-m bg-primary px-m py-s text-white font-bold`}>
            Riesgo critico a {Math.round(securityProximityRadar.nearestTarget?.distanceMeters ?? 0)}m
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
