import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import tw from '@/lib/tailwind';
import UserToolsMenu from '@/features/navigation/components/UserToolsMenu';
import NavigationMapController from '@/features/navigation/components/NavigationMapController';
import { useLocationPermissions } from '@/features/navigation/hooks/useLocationPermissions';
import { useProximityRadar } from '@/features/navigation/hooks/useProximityRadar';
import { useVelocityGuard } from '@/features/navigation/hooks/useVelocityGuard';
import { useLayerStore } from '@/features/navigation/store/useLayerStore';
import { DRIVING_LOCK_THRESHOLD_KMH } from '@/features/navigation/utils/drivingLock';
import { DEFAULT_PEDESTRIAN_CENTER } from '@/features/pedestrian/schemas/pedestrian.schema';
import SecurityRiskBottomSheet from '@/features/security/components/SecurityRiskBottomSheet';
import { useSecurityHeatmap } from '@/features/security/hooks/useSecurityHeatmap';
import { useSecurityProximityAlert } from '@/features/security/hooks/useSecurityProximityAlert';
import { useSecurityMapStore } from '@/features/security/store/useSecurityMapStore';
import { usePlaces } from '../hooks/usePlaces';
import type { SecurityHeatmapPointContract } from '@/types/contracts/security.contract';

interface PlacesMapContainerProps {
  mode: 'tourist' | 'car' | 'motorcycle';
  themeMode?: 'light' | 'dark';
  licensePlate?: string | null;
  onOpenPublicTransport?: () => void;
  onLogout: () => void;
}

const PlacesMapContainer = ({
  mode,
  themeMode = 'light',
  licensePlate,
  onOpenPublicTransport,
  onLogout,
}: PlacesMapContainerProps) => {
  const { currentLocation } = useLocationPermissions();
  const { speedKmh } = useVelocityGuard();
  const [selectedSecurityPoint, setSelectedSecurityPoint] = useState<SecurityHeatmapPointContract | null>(null);
  const center = currentLocation ?? DEFAULT_PEDESTRIAN_CENTER;
  const heatmap = useSecurityMapStore((state) => state.heatmap);
  const isSecurityMapLoading = useSecurityMapStore((state) => state.isSecurityMapLoading);
  const isSecurityMapEnabled = useLayerStore((state) => state.isSecurityMapEnabled);
  const toggleSecurityMap = useLayerStore((state) => state.toggleSecurityMap);
  const isSecurityDrivingLockActive = speedKmh > DRIVING_LOCK_THRESHOLD_KMH;
  useSecurityHeatmap({
    center,
    enabled: isSecurityMapEnabled,
    isDrivingLockActive: isSecurityDrivingLockActive,
  });
  const { places } = usePlaces({
    lat: center.latitude,
    lng: center.longitude,
    radius: 2500,
    limit: 180,
  });
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

  return (
    <View testID="places-map-container" style={tw`flex-1 bg-surface-light dark:bg-charcoal`}>
      <NavigationMapController
        mode={mode}
        themeMode={themeMode}
        center={center}
        showDefaultShadeZones={false}
        places={places}
        securityHeatmap={isSecurityMapEnabled ? heatmap : null}
        onSecurityHeatmapPointPress={setSelectedSecurityPoint}
        licensePlate={licensePlate}
        renderProfileTools={(transitRoutesSection) => (
          <UserToolsMenu
            canReportShadow={false}
            profileSections={transitRoutesSection}
            isSecurityMapEnabled={isSecurityMapEnabled}
            isSecurityMapLoading={isSecurityMapLoading}
            onOpenPublicTransport={onOpenPublicTransport}
            onToggleSecurityMap={toggleSecurityMap}
            onLogout={onLogout}
          />
        )}
      />
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
    </View>
  );
};

export default PlacesMapContainer;
