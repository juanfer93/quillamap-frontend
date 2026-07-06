import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { MapIconProps } from '@/components/maps/QuillaMap.icon.types';

const SheetIcon = Ionicons as React.ComponentType<MapIconProps>;

interface PlaceInfoBottomSheetProps {
  place: PlaceMapFeature;
  onClose: () => void;
}

const textOrFallback = (value?: { es: string; en?: string }): string => {
  if (!value) {
    return '';
  }

  return value.en ? `${value.es}\n${value.en}` : value.es;
};

const PlaceInfoBottomSheet = ({ place, onClose }: PlaceInfoBottomSheetProps) => {
  const primary = tw.color('shark-blue') ?? '#004574';
  const culturalGold = '#D4AF37';
  const history = textOrFallback(place.metadata?.history ?? place.description);
  const openingHours = textOrFallback(place.metadata?.openingHours);
  const photo = place.metadata?.photos?.[0];

  return (
    <View
      testID="place-bottom-sheet"
      style={[
        tw`absolute left-0 right-0 bottom-0 bg-white border-t border-medium-gray px-m pt-m pb-xl`,
        { shadowColor: primary, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8 },
      ]}
    >
      <View style={tw`flex-row items-start justify-between`}>
        <View style={tw`flex-1 pr-m`}>
          <Text testID="place-bottom-sheet-title" style={[tw`text-xl font-bold`, { color: primary }]}>
            {place.name.es}
          </Text>
          {place.name.en ? (
            <Text style={tw`text-dark-gray mt-xs`}>
              {place.name.en}
            </Text>
          ) : null}
        </View>
        <Pressable
          testID="place-bottom-sheet-close"
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={onClose}
          style={[tw`w-10 h-10 rounded-m items-center justify-center`, { backgroundColor: primary }]}
        >
          <SheetIcon name="close" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView style={tw`mt-m max-h-80`} showsVerticalScrollIndicator={false}>
        {photo ? (
          <Image
            testID="place-bottom-sheet-photo"
            source={{ uri: photo }}
            resizeMode="cover"
            style={tw`w-full h-36 rounded-m mb-m bg-light-gray`}
          />
        ) : null}

        {history ? (
          <View style={tw`mb-m`}>
            <Text style={[tw`font-bold mb-xs`, { color: place.source === 'tourist_site' ? culturalGold : primary }]}>
              Historia
            </Text>
            <Text style={tw`text-dark-gray leading-5`}>
              {history}
            </Text>
          </View>
        ) : null}

        {openingHours ? (
          <View style={tw`mb-s`}>
            <Text style={[tw`font-bold mb-xs`, { color: primary }]}>
              Horarios
            </Text>
            <Text style={tw`text-dark-gray leading-5`}>
              {openingHours}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default PlaceInfoBottomSheet;
