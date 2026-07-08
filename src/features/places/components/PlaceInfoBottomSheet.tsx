import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import {
  PLACES_VISUAL_IDENTITY,
  type PlaceMapFeature,
} from '@/types/contracts/places.contract';
import type { MapIconProps } from '@/components/maps/QuillaMap.icon.types';

const SheetIcon = Ionicons as React.ComponentType<MapIconProps>;

interface PlaceInfoBottomSheetProps {
  place: PlaceMapFeature;
  onClose: () => void;
  themeMode?: 'light' | 'dark';
}

const textOrFallback = (value?: { es: string; en?: string }): string => {
  if (!value) {
    return '';
  }

  return value.en ? `${value.es}\n${value.en}` : value.es;
};

const PlaceInfoBottomSheet = ({ place, onClose, themeMode = 'light' }: PlaceInfoBottomSheetProps) => {
  const isDark = themeMode === 'dark';
  const primary = tw.color(PLACES_VISUAL_IDENTITY.sharkBlue.token) ?? PLACES_VISUAL_IDENTITY.sharkBlue.hex;
  const culturalGold = tw.color(PLACES_VISUAL_IDENTITY.sandGold.token) ?? PLACES_VISUAL_IDENTITY.sandGold.hex;
  const white = tw.color(PLACES_VISUAL_IDENTITY.white.token) ?? PLACES_VISUAL_IDENTITY.white.hex;
  const sheetBackground = isDark ? '#111B2A' : white;
  const sheetBorder = isDark ? culturalGold : tw.color('medium-gray') ?? '#E0E0E0';
  const titleColor = isDark ? culturalGold : primary;
  const mutedText = isDark ? '#CBD5E1' : tw.color('dark-gray') ?? '#333333';
  const bodyText = isDark ? '#E5EDF7' : tw.color('dark-gray') ?? '#333333';
  const closeBackground = isDark ? culturalGold : primary;
  const closeColor = isDark ? '#111B2A' : white;
  const description = textOrFallback(place.description ?? place.metadata?.history);
  const openingHours = textOrFallback(place.metadata?.openingHours);
  const photo = place.metadata?.photos?.[0];

  return (
    <View
      testID="place-bottom-sheet"
      style={[
        tw`absolute left-0 right-0 border-t px-m pt-m pb-m`,
        {
          backgroundColor: sheetBackground,
          borderTopColor: sheetBorder,
          bottom: 64,
          maxHeight: '55%',
          zIndex: 30,
          shadowColor: isDark ? culturalGold : primary,
          shadowOpacity: isDark ? 0.26 : 0.18,
          shadowRadius: 18,
          elevation: 16,
        },
      ]}
    >
      <View style={tw`flex-row items-start justify-between`}>
        <View style={tw`flex-1 pr-m`}>
          <Text testID="place-bottom-sheet-title" style={[tw`text-xl font-bold`, { color: titleColor }]}>
            {place.name.es}
          </Text>
          {place.name.en ? (
            <Text style={[tw`mt-xs`, { color: mutedText }]}>
              {place.name.en}
            </Text>
          ) : null}
        </View>
        <Pressable
          testID="place-bottom-sheet-close"
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={onClose}
          style={[tw`w-10 h-10 rounded-m items-center justify-center`, { backgroundColor: closeBackground }]}
        >
          <SheetIcon name="close" size={20} color={closeColor} />
        </Pressable>
      </View>

      <ScrollView style={tw`mt-m`} showsVerticalScrollIndicator={false}>
        {photo ? (
          <Image
            testID="place-bottom-sheet-photo"
            source={{ uri: photo }}
            resizeMode="cover"
            style={tw`w-full h-36 rounded-m mb-m bg-light-gray`}
          />
        ) : null}

        {description ? (
          <View style={tw`mb-m`}>
            <Text style={[tw`font-bold mb-xs`, { color: place.source === 'tourist_site' ? culturalGold : primary }]}>
              Descripcion
            </Text>
            <Text style={[tw`leading-5`, { color: bodyText }]}>
              {description}
            </Text>
          </View>
        ) : null}

        {openingHours ? (
          <View style={tw`mb-s`}>
            <Text style={[tw`font-bold mb-xs`, { color: isDark ? culturalGold : primary }]}>
              Horarios
            </Text>
            <Text style={[tw`leading-5`, { color: bodyText }]}>
              {openingHours}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default PlaceInfoBottomSheet;
