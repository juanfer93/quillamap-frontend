import React from 'react';
import type { ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
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
  showCompass?: boolean;
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
    hasActiveRoute?: boolean;
    isActive: boolean;
    onCancel?: () => void;
    onPress: () => void;
  };
}

const IoniconsComponent = Ionicons as React.ComponentType<MapIconProps>;

const WebFallbackSvgIcon = ({ name, size, color }: MapIconProps) => {
  const iconPaths: Record<string, string> = {
    search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    walk: 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z',
    'footsteps-outline': 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z',
    'location-outline': 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    bookmark: 'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z',
    'bookmark-outline': 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z',
    people: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    'person-outline': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    navigate: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z',
    'locate-outline': 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z',
    add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    remove: 'M19 13H5v-2h14v2z',
    'arrow-up': 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z',
    'leaf-outline': 'M6.05 8.05c-2.73 2.73-2.73 7.17 0 9.9C7.42 19.32 9.21 20 11 20s3.58-.68 4.95-2.05C19.43 14.47 20 4 20 4S9.53 4.57 6.05 8.05z',
  };

  const path = iconPaths[name] || iconPaths.walk;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d={path} />
    </svg>
  );
};

class MapIconBoundary extends React.Component<{
  children: ReactNode;
  fallback: ReactNode;
}, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

const MapIcon = (props: MapIconProps) => {
  const icon = <IoniconsComponent {...props} />;

  if (Platform.OS === 'web') {
    return (
      <MapIconBoundary fallback={<WebFallbackSvgIcon {...props} />}>
        {icon}
      </MapIconBoundary>
    );
  }

  return icon;
};

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
  primary = '#004574',
  zonesCount,
  showCompass = true,
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

  // Contrast AA/AAA compliant surface colors: #F8FAFC (Blanco Hielo) / #121212 (Gris Asfalto)
  const surfaceBg = isDark ? '#121212' : '#F8FAFC';
  const iconPrimary = primary || '#004574';

  const searchSurfaceStyle = {
    backgroundColor: surfaceBg,
    borderColor: controlBorder,
    borderRadius: isPedestrian ? 22 : 10,
    zIndex: 50,
  };
  const buttonSurfaceStyle = {
    backgroundColor: surfaceBg,
    borderColor: controlBorder,
    zIndex: 50,
  };
  const compassAccent = isDark ? controlText : iconPrimary;
  const runControlAction = (action?: () => void) => {
    onControlsInteraction?.();
    action?.();
  };
  const openNavigationSearch = () => {
    if (navigationControl?.isActive) {
      return;
    }

    runControlAction(navigationControl?.onPress);
  };
  const canCancelNavigation = Boolean(navigationControl?.hasActiveRoute && navigationControl.onCancel);

  return (
    <>
      <Pressable
        testID="quillamap-navigation-search-bar"
        accessibilityRole="button"
        accessibilityLabel="Buscar destino"
        onPress={openNavigationSearch}
        style={[
          isPedestrian
            ? tw`absolute left-m right-m top-m h-10 border flex-row items-center px-s`
            : tw`absolute left-m right-16 top-m h-10 border flex-row items-center px-s`,
          searchSurfaceStyle,
        ]}
      >
        <MapIcon name="search" size={17} color={controlText} />
        <Text numberOfLines={1} style={[tw`ml-s flex-1 text-sm font-semibold`, { color: controlText }]}>
          {isPedestrian ? 'Buscar destino' : 'Buscar ruta fresca'}
        </Text>
        <Pressable
          testID="quillamap-navigation-cancel"
          accessibilityRole="button"
          accessibilityLabel="Cancelar navegacion GPS"
          disabled={!canCancelNavigation}
          onPress={() => runControlAction(navigationControl?.onCancel)}
          style={[
            tw`w-8 h-8 rounded-s items-center justify-center`,
            canCancelNavigation ? { backgroundColor: `${mapRoute}14` } : null,
          ]}
        >
          <MapIcon name="close" size={18} color={canCancelNavigation ? mapRoute : controlText} />
        </Pressable>
      </Pressable>

      <QuillaMapPerspectiveToggle
        is3D={is3D}
        onPress={() => runControlAction(onTogglePerspective)}
        testID={perspectiveToggleTestID}
        compact={isPedestrian}
        backgroundColor={surfaceBg}
        borderColor={controlBorder}
        color={isDark ? controlText : iconPrimary}
        style={
          isPedestrian
            ? [tw`absolute right-m top-16`, { zIndex: 50 }]
            : [tw`absolute right-m top-m`, { zIndex: 50 }]
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

      {showCompass ? (
        <Pressable
          testID={compassTestID}
          accessibilityRole="button"
          accessibilityLabel="Cambiar orientacion cardinal del mapa"
          onPress={() => runControlAction(onToggleCompass)}
          style={[
            tw`absolute right-m top-28 w-9 h-9 rounded-lg border items-center justify-center`,
            buttonSurfaceStyle,
          ]}
        >
          <View style={tw`absolute inset-0 items-center justify-center`}>
            <Text style={{ position: 'absolute', top: 1, color: compassAccent, fontSize: 7, fontWeight: '900', lineHeight: 8 }}>
              N
            </Text>
            <Text style={{ position: 'absolute', bottom: 1, color: controlText, fontSize: 7, fontWeight: '800', lineHeight: 8 }}>
              S
            </Text>
            <Text style={{ position: 'absolute', right: 3, color: controlText, fontSize: 7, fontWeight: '800', lineHeight: 8 }}>
              E
            </Text>
            <Text style={{ position: 'absolute', left: 3, color: controlText, fontSize: 7, fontWeight: '800', lineHeight: 8 }}>
              O
            </Text>
            <View style={{ transform: [{ rotate: `${compassBearing}deg` }] }}>
              <MapIcon name="arrow-up" size={11} color={compassAccent} />
            </View>
          </View>
        </Pressable>
      ) : null}

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
          <MapIcon name="locate-outline" size={18} color={isDark ? controlText : iconPrimary} />
        </View>
      ) : null}

      <View
        pointerEvents="box-none"
        style={[
          tw`absolute left-0 right-0 bottom-0 h-16 border-t flex-row items-center justify-around px-l`,
          { backgroundColor: surfaceBg, borderColor: controlBorder, zIndex: 50 },
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
            navigationControl?.isActive ? { backgroundColor: `${iconPrimary}18` } : null,
          ]}
        >
          <MapIcon
            name={isPedestrian ? 'footsteps-outline' : 'location-outline'}
            size={isPedestrian ? 21 : 20}
            color={navigationControl?.isActive ? iconPrimary : controlText}
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
