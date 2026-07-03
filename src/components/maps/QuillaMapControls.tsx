import React from 'react';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import type { QuillaMapMode } from './QuillaMap.types';

interface MapIconProps {
  name: string;
  size: number;
  color: string;
}

interface QuillaMapControlsProps {
  mode: QuillaMapMode;
  isDark: boolean;
  controlBackground: string;
  controlBorder: string;
  controlText: string;
  darkText: string;
  mapRoute: string;
  mapShade: string;
  primary: string;
  zonesCount: number;
  showZoom?: boolean;
  showLocate?: boolean;
  zoomInTestID?: string;
  zoomOutTestID?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  profileTools?: ReactNode;
}

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;

const QuillaMapControls = ({
  mode,
  isDark,
  controlBackground,
  controlBorder,
  controlText,
  darkText,
  mapRoute,
  mapShade,
  primary,
  zonesCount,
  showZoom = false,
  showLocate = false,
  zoomInTestID,
  zoomOutTestID,
  onZoomIn,
  onZoomOut,
  profileTools,
}: QuillaMapControlsProps) => {
  const isPedestrian = mode === 'pedestrian';

  return (
    <>
      <View
        pointerEvents="box-none"
        style={
          isPedestrian
            ? [
                tw`absolute left-m right-m top-m h-10 border flex-row items-center px-s`,
                { backgroundColor: controlBackground, borderColor: controlBorder, borderRadius: 22, zIndex: 20 },
              ]
            : tw`absolute left-m right-16 top-m h-10 rounded-m bg-white border border-medium-gray flex-row items-center px-s`
        }
      >
        <MapIcon name="search" size={17} color={controlText} />
        {isPedestrian ? (
          <View style={tw`flex-1`} />
        ) : (
          <Text numberOfLines={1} style={tw`ml-s flex-1 text-dark-gray text-sm font-semibold`}>
            Buscar ruta fresca
          </Text>
        )}
        <MapIcon name="close" size={18} color={controlText} />
      </View>

      <View
        pointerEvents="box-none"
        style={
          isPedestrian
            ? [
                tw`absolute right-m top-16 w-11 h-11 rounded-xl border items-center justify-center`,
                { backgroundColor: controlBackground, borderColor: controlBorder, zIndex: 20 },
              ]
            : tw`absolute right-m top-m w-10 h-10 rounded-m bg-white border border-medium-gray items-center justify-center`
        }
      >
        <MapIcon name="layers-outline" size={18} color={isDark ? controlText : primary} />
      </View>

      {!isPedestrian ? (
        <View style={tw`absolute right-m top-16 rounded-m bg-white border border-medium-gray px-s py-xs flex-row items-center`}>
          <MapIcon name="leaf-outline" size={15} color={mapShade} />
          <Text style={tw`ml-xs text-primary text-xs font-bold`}>
            {zonesCount} sombras
          </Text>
        </View>
      ) : null}

      {isPedestrian && showZoom ? (
        <View
          pointerEvents="box-none"
          style={[
            tw`absolute right-m top-32 w-11 rounded-xl border overflow-hidden`,
            { backgroundColor: controlBackground, borderColor: controlBorder, zIndex: 20 },
          ]}
        >
          <Pressable
            testID={zoomInTestID}
            accessibilityRole="button"
            accessibilityLabel="Acercar mapa"
            onPress={onZoomIn}
            style={[tw`h-10 items-center justify-center border-b`, { borderBottomColor: controlBorder }]}
          >
            <MapIcon name="add" size={21} color={controlText} />
          </Pressable>
          <Pressable
            testID={zoomOutTestID}
            accessibilityRole="button"
            accessibilityLabel="Alejar mapa"
            onPress={onZoomOut}
            style={tw`h-10 items-center justify-center`}
          >
            <MapIcon name="remove" size={21} color={controlText} />
          </Pressable>
        </View>
      ) : null}

      <View
        pointerEvents="box-none"
        style={
          isPedestrian
            ? [
                tw`absolute right-m bottom-24 w-12 h-12 rounded-xl border items-center justify-center`,
                { backgroundColor: controlBackground, borderColor: controlBorder, zIndex: 20 },
              ]
            : tw`absolute right-m bottom-20 w-11 h-11 rounded-xl bg-white border border-medium-gray items-center justify-center`
        }
      >
        <MapIcon name="navigate" size={isPedestrian ? 19 : 18} color={controlText} />
      </View>

      {showLocate ? (
        <View
          pointerEvents="box-none"
          style={
            isPedestrian
              ? [
                  tw`absolute left-m bottom-24 w-10 h-10 rounded-xl border items-center justify-center`,
                  { backgroundColor: controlBackground, borderColor: controlBorder, zIndex: 20 },
                ]
              : tw`absolute left-m bottom-20 w-10 h-10 rounded-xl bg-white border border-medium-gray items-center justify-center`
          }
        >
          <MapIcon name="locate-outline" size={18} color={isDark ? controlText : primary} />
        </View>
      ) : null}

      <View
        pointerEvents="box-none"
        style={[
          tw`absolute left-0 right-0 bottom-0 h-16 border-t flex-row items-center justify-around px-l`,
          { backgroundColor: controlBackground, borderColor: controlBorder, zIndex: 20 },
        ]}
      >
        {isPedestrian ? <View style={[tw`absolute top-xs w-10 h-1 rounded-xl`, { backgroundColor: controlBorder }]} /> : null}
        <MapIcon name="walk" size={isPedestrian ? 21 : 20} color={isDark ? controlText : mapRoute} />
        <MapIcon name={isPedestrian ? 'footsteps-outline' : 'location-outline'} size={isPedestrian ? 21 : 20} color={controlText} />
        <MapIcon name={isPedestrian ? 'bookmark' : 'bookmark-outline'} size={20} color={controlText} />
        {profileTools ?? (
          <MapIcon name={isPedestrian ? 'people' : 'person-outline'} size={20} color={isPedestrian ? controlText : darkText} />
        )}
      </View>
    </>
  );
};

export default QuillaMapControls;
