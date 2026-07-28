import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import QuillaMap from '@/components/maps/QuillaMap';
import tw from '@/lib/tailwind';
import { RootStackParamList } from '@/features/auth/types/auth.types';
import { useLocationPermissions } from '@/features/navigation/hooks/useLocationPermissions';
import { usePlaces } from '@/features/places/hooks/usePlaces';
import { DEFAULT_PEDESTRIAN_CENTER } from '@/features/pedestrian/schemas/pedestrian.schema';
import PublicTransportPanel from '../components/PublicTransportPanel';
import {
  PUBLIC_TRANSPORT_PLACES_LIMIT,
  PUBLIC_TRANSPORT_PLACES_RADIUS_METERS,
} from '../constants/publicTransport.constants';
import { usePublicTransportController } from '../hooks/usePublicTransportController';
import TransitSuggestionSteps from '../components/TransitSuggestionSteps';

type PublicTransportNavigationProp = StackNavigationProp<RootStackParamList, 'PublicTransport'>;

const PublicTransportScreen = () => {
  const navigation = useNavigation<PublicTransportNavigationProp>();
  const { currentLocation } = useLocationPermissions();
  const center = currentLocation ?? DEFAULT_PEDESTRIAN_CENTER;
  const { places } = usePlaces({
    lat: center.latitude,
    lng: center.longitude,
    radius: PUBLIC_TRANSPORT_PLACES_RADIUS_METERS,
    limit: PUBLIC_TRANSPORT_PLACES_LIMIT,
  });
  const publicTransport = usePublicTransportController(places);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View testID="public-transport-screen" style={tw`flex-1 bg-surface-light dark:bg-charcoal`}>
      <QuillaMap
        mode="pedestrian"
        center={center}
        places={places}
        transitMap={publicTransport.visibleTransitMap}
        showDefaultShadeZones={false}
        showCompassControl={!publicTransport.isPanelOpen}
        showZoomControl={!publicTransport.isPanelOpen}
        profileTools={(
          <Pressable
            testID="public-transport-bottom-back"
            accessibilityRole="button"
            accessibilityLabel="Volver al mapa principal"
            onPress={handleBack}
            style={tw`h-10 w-10 items-center justify-center`}
          >
            <Text style={tw`font-bold text-primary`}>←</Text>
          </Pressable>
        )}
      >
        {publicTransport.isPanelOpen ? (
          <PublicTransportPanel
            publicTransportMode={publicTransport.publicTransportMode}
            transitAgencyKind={publicTransport.transitAgencyKind}
            transitOperatorGroups={publicTransport.transitOperatorGroups}
            selectedTransitOperator={publicTransport.selectedTransitOperator}
            selectedTransitRoute={publicTransport.selectedTransitRoute}
            places={places}
            busFinder={publicTransport.busFinder}
            transmetroFinder={publicTransport.transmetroFinder}
            busSuggestions={publicTransport.busSuggestions}
            transmetroSuggestions={publicTransport.transmetroSuggestions}
            isLoadingBusSuggestions={publicTransport.isLoadingBusSuggestions}
            isLoadingTransmetroSuggestions={publicTransport.isLoadingTransmetroSuggestions}
            busSuggestionError={publicTransport.busSuggestionError}
            transmetroSuggestionError={publicTransport.transmetroSuggestionError}
            onBack={handleBack}
            onModeChange={publicTransport.activatePublicTransportMode}
            onOperatorSelect={publicTransport.selectTransitOperator}
            onRouteSelect={publicTransport.selectTransitRoute}
            onFinderQueryChange={publicTransport.setFinderQuery}
            onFinderPlaceSelect={publicTransport.selectFinderPlace}
            onFindBusSubmit={() => {
              void publicTransport.requestTransitSuggestions('bus');
            }}
            onFindTransmetroSubmit={() => {
              void publicTransport.requestTransitSuggestions('transmetro');
            }}
            onBusSuggestionSelect={publicTransport.selectBusSuggestion}
            onTransmetroSuggestionSelect={publicTransport.selectTransmetroSuggestion}
          />
        ) : (
          <View testID="public-transport-map-actions" style={[tw`absolute left-m right-m top-14`, { zIndex: 40, elevation: 40 }]}>
            <Pressable
              testID="public-transport-return-to-panel"
              accessibilityRole="button"
              accessibilityLabel="Volver a Transporte público"
              onPress={publicTransport.openPublicTransportPanel}
              style={tw`self-start rounded-m border border-primary bg-white px-m py-s`}
            >
              <Text style={tw`font-bold text-primary`}>Volver a Transporte público</Text>
            </Pressable>
            {publicTransport.selectedTransitInstructions.length > 0 ? (
              <View testID="public-transport-selected-steps" style={tw`mt-s rounded-m border border-light-gray bg-white p-s`}>
                <TransitSuggestionSteps instructions={publicTransport.selectedTransitInstructions} />
              </View>
            ) : null}
          </View>
        )}
      </QuillaMap>
    </View>
  );
};

export default PublicTransportScreen;
