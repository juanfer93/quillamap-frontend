import React from 'react';
import { View } from 'react-native';
import tw from '@/lib/tailwind';
import UserToolsMenu from '@/features/navigation/components/UserToolsMenu';
import NavigationMapController from '@/features/navigation/components/NavigationMapController';
import { useLocationPermissions } from '@/features/navigation/hooks/useLocationPermissions';
import { DEFAULT_PEDESTRIAN_CENTER } from '@/features/pedestrian/schemas/pedestrian.schema';
import { usePlaces } from '../hooks/usePlaces';

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
  const center = currentLocation ?? DEFAULT_PEDESTRIAN_CENTER;
  const { places } = usePlaces({
    lat: center.latitude,
    lng: center.longitude,
    radius: 2500,
    limit: 180,
  });

  return (
    <View testID="places-map-container" style={tw`flex-1 bg-surface-light dark:bg-charcoal`}>
      <NavigationMapController
        mode={mode}
        themeMode={themeMode}
        center={center}
        showDefaultShadeZones={false}
        places={places}
        licensePlate={licensePlate}
        renderProfileTools={(transitRoutesSection) => (
          <UserToolsMenu
            canReportShadow={false}
            profileSections={transitRoutesSection}
            onOpenPublicTransport={onOpenPublicTransport}
            onLogout={onLogout}
          />
        )}
      />
    </View>
  );
};

export default PlacesMapContainer;
