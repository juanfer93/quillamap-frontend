import React from 'react';
import { View } from 'react-native';
import tw from '@/lib/tailwind';
import QuillaMap from '@/components/maps/QuillaMap';
import UserToolsMenu from '@/features/navigation/components/UserToolsMenu';
import { useLocationPermissions } from '@/features/navigation/hooks/useLocationPermissions';
import { DEFAULT_PEDESTRIAN_CENTER } from '@/features/pedestrian/schemas/pedestrian.schema';
import { usePlaces } from '../hooks/usePlaces';

interface PlacesMapContainerProps {
  mode: 'tourist' | 'car' | 'motorcycle';
  themeMode?: 'light' | 'dark';
  onLogout: () => void;
}

const PlacesMapContainer = ({ mode, themeMode = 'light', onLogout }: PlacesMapContainerProps) => {
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
      <QuillaMap
        mode={mode}
        themeMode={themeMode}
        center={center}
        showDefaultShadeZones={false}
        places={places}
        profileTools={(
          <UserToolsMenu
            canReportShadow={false}
            onLogout={onLogout}
          />
        )}
      />
    </View>
  );
};

export default PlacesMapContainer;
