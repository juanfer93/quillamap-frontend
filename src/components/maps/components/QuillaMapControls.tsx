import React from 'react';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import type { QuillaMapMode } from '../types/QuillaMap.types';
import QuillaMapPerspectiveToggle from '../QuillaMapPerspectiveToggle';

interface MapIconProps {
  name: string;
  size: number;
  color: string;
}

interface QuillaMapControlsProps {
  mode: QuillaMapMode;
  isDark: boolean;
  is3D: boolean;
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
  perspectiveToggleTestID?: string;
  compassTestID?: string;
  compassBearing?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onTogglePerspective: () => void;
  onToggleCompass: () => void;
  onControlsInteraction?: () => void;
  profileTools?: ReactNode;
  navigationControl?: {
    isActive: boolean;
    onPress: () => void;
  };
}

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;

const QuillaMapControls = ({
  mode,
  isDark,
  is3D,
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
  perspectiveToggleTestID,
  compassTestID,
  compassBearing = 0,
  onZoomIn,
  onZoomOut,
  onTogglePerspective,
  onToggleCompass,
  onControlsInteraction,
  profileTools,
  navigationControl,
}: QuillaMapControlsProps) => {
  const isPedestrian = mode === 'pedestrian';
  const searchSurfaceStyle = {
    backgroundColor: controlBackground,
    borderColor: controlBorder,
    borderRadius: isPedestrian ? 22 : 10,
    zIndex: 20,
  };
  const buttonSurfaceStyle = {
    backgroundColor: controlBackground,
    borderColor: controlBorder,
    zIndex: 20,
  };
  const compassAccent = isDark ? controlText : primary;
  const runControlAction = (action?: () => void) => {
    onControlsInteraction?.();
    action?.();
  };

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[
          isPedestrian
            ? tw`absolute left-m right-m top-m h-10 border flex-row items-center px-s`
            : tw`absolute left-m right-16 top-m h-10 border flex-row items-center px-s`,
          searchSurfaceStyle,
        ]}
      >
        <MapIcon name="search" size={17} color={controlText} />
        {isPedestrian ? (
          <View style={tw`flex-1`} />
        ) : (
          <Text numberOfLines={1} style={[tw`ml-s flex-1 text-sm font-semibold`, { color: controlText }]}>
            Buscar ruta fresca
          </Text>
        )}
        <MapIcon name="close" size={18} color={controlText} />
      </View>

      <QuillaMapPerspectiveToggle
        is3D={is3D}
        onPress={() => runControlAction(onTogglePerspective)}
        testID={perspectiveToggleTestID}
        compact={isPedestrian}
        backgroundColor={controlBackground}
        borderColor={controlBorder}
        color={isDark ? controlText : primary}
        style={
          isPedestrian
            ? [tw`absolute right-m top-16`, { zIndex: 20 }]
            : [tw`absolute right-m top-m`, { zIndex: 20 }]
        }
      />

      {!isPedestrian ? (
        <View
          style={[
            tw`absolute right-m top-16 border px-s py-xs flex-row items-center`,
            { ...buttonSurfaceStyle, borderRadius: 10 },
          ]}
        >
          <MapIcon name="leaf-outline" size={15} color={mapShade} />
          <Text style={[tw`ml-xs text-xs font-bold`, { color: controlText }]}>
            {zonesCount} sombras
          </Text>
        </View>
      ) : null}

      <Pressable
        testID={compassTestID}
        accessibilityRole="button"
        accessibilityLabel="Cambiar orientacion cardinal del mapa"
        onPress={() => runControlAction(onToggleCompass)}
        style={[
          tw`absolute right-m top-28 w-11 h-11 rounded-xl border items-center justify-center`,
          buttonSurfaceStyle,
        ]}
      >
        <View style={tw`absolute inset-0 items-center justify-center`}>
          <Text style={{ position: 'absolute', top: 2, color: compassAccent, fontSize: 9, fontWeight: '900', lineHeight: 10 }}>
            N
          </Text>
          <Text style={{ position: 'absolute', bottom: 2, color: controlText, fontSize: 8, fontWeight: '800', lineHeight: 9 }}>
            S
          </Text>
          <Text style={{ position: 'absolute', right: 4, color: controlText, fontSize: 8, fontWeight: '800', lineHeight: 9 }}>
            E
          </Text>
          <Text style={{ position: 'absolute', left: 4, color: controlText, fontSize: 8, fontWeight: '800', lineHeight: 9 }}>
            O
          </Text>
          <View style={{ transform: [{ rotate: `${compassBearing}deg` }] }}>
            <MapIcon name="arrow-up" size={14} color={compassAccent} />
          </View>
        </View>
      </Pressable>

      {isPedestrian && showZoom ? (
        <View
          pointerEvents="box-none"
          style={[
            tw`absolute right-m top-44 w-11 rounded-xl border overflow-hidden`,
            buttonSurfaceStyle,
          ]}
        >
          <Pressable
            testID={zoomInTestID}
            accessibilityRole="button"
            accessibilityLabel="Acercar mapa"
            onPress={() => runControlAction(onZoomIn)}
            style={[tw`h-10 items-center justify-center border-b`, { borderBottomColor: controlBorder }]}
          >
            <MapIcon name="add" size={21} color={controlText} />
          </Pressable>
          <Pressable
            testID={zoomOutTestID}
            accessibilityRole="button"
            accessibilityLabel="Alejar mapa"
            onPress={() => runControlAction(onZoomOut)}
            style={tw`h-10 items-center justify-center`}
          >
            <MapIcon name="remove" size={21} color={controlText} />
          </Pressable>
        </View>
      ) : null}

      <View
        pointerEvents="box-none"
        style={[
          isPedestrian
            ? tw`absolute right-m bottom-24 w-12 h-12 rounded-xl border items-center justify-center`
            : tw`absolute right-m bottom-20 w-11 h-11 rounded-xl border items-center justify-center`,
          buttonSurfaceStyle,
        ]}
      >
        <MapIcon name="navigate" size={isPedestrian ? 19 : 18} color={controlText} />
      </View>

      {showLocate ? (
        <View
          pointerEvents="box-none"
          style={[
            isPedestrian
              ? tw`absolute left-m bottom-24 w-10 h-10 rounded-xl border items-center justify-center`
              : tw`absolute left-m bottom-20 w-10 h-10 rounded-xl border items-center justify-center`,
            buttonSurfaceStyle,
          ]}
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
        <Pressable
          testID="quillamap-navigation-tab"
          accessibilityRole="button"
          accessibilityLabel="Abrir navegacion"
          onPress={() => runControlAction(navigationControl?.onPress)}
          style={[
            tw`w-10 h-10 rounded-xl items-center justify-center`,
            navigationControl?.isActive ? { backgroundColor: `${primary}18` } : null,
          ]}
        >
          <MapIcon
            name={isPedestrian ? 'footsteps-outline' : 'location-outline'}
            size={isPedestrian ? 21 : 20}
            color={navigationControl?.isActive ? primary : controlText}
          />
        </Pressable>
        <MapIcon name={isPedestrian ? 'bookmark' : 'bookmark-outline'} size={20} color={controlText} />
        <View
          testID="quillamap-profile-tools-slot"
          onTouchStart={onControlsInteraction}
          onStartShouldSetResponderCapture={() => {
            onControlsInteraction?.();
            return false;
          }}
        >
          {profileTools ?? (
            <MapIcon name={isPedestrian ? 'people' : 'person-outline'} size={20} color={isPedestrian ? controlText : darkText} />
          )}
        </View>
      </View>
    </>
  );
};

export default QuillaMapControls;
