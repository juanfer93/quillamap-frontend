import React, { useMemo, useRef, useState } from 'react';
import { Image, PanResponder, Pressable, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import tw from '@/lib/tailwind';
import type { QuillaMapProps } from './QuillaMap.types';
import type { MapClickEvent, MapPointerEvent, MapPressEvent, ScreenPoint } from './QuillaMap.web.types';
import type { MapIconProps } from './QuillaMap.icon.types';
import {
  DEFAULT_TILE_ZOOM,
  MAX_TILE_ZOOM,
  MIN_TILE_ZOOM,
  TILE_SIZE,
} from './QuillaMap.constants';
import { getRouteCoordinates, getVisibleShadeZones } from './QuillaMap.shared';
import {
  clamp,
  getCoordinateFromScreenPoint,
  getMapTiles,
  getRoutePath,
  getScreenPoint,
} from './QuillaMap.web-geo';
import QuillaMapControls from './QuillaMapControls';
import QuillaMapShadowMarker from './QuillaMapShadowMarker';

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;

const tokenColor = (name: string): string => {
  const value = tw.color(name);
  return typeof value === 'string' ? value : '';
};

const QuillaMapWebRenderer = ({
  mode,
  themeMode = 'light',
  center,
  shadeZones,
  showDefaultShadeZones,
  routePoints,
  children,
  onShadeZonePress,
  onMapPress,
  selectedCoordinate,
  style,
}: QuillaMapProps) => {
  const windowDimensions = useWindowDimensions();
  const route = getRouteCoordinates(routePoints, center);
  const isDark = themeMode === 'dark';
  const isPedestrian = mode === 'pedestrian';
  const shouldShowShadowZones = !(isPedestrian && isDark);
  const zones = shouldShowShadowZones ? getVisibleShadeZones(shadeZones, showDefaultShadeZones) : [];
  const [tileZoom, setTileZoom] = useState(DEFAULT_TILE_ZOOM);
  const [panOffset, setPanOffset] = useState<ScreenPoint>({ x: 0, y: 0 });
  const panOffsetRef = useRef<ScreenPoint>({ x: 0, y: 0 });
  const panStartRef = useRef<ScreenPoint>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastDragEndAtRef = useRef(0);
  const pointerStartRef = useRef<ScreenPoint | null>(null);
  const pointerPanStartRef = useRef<ScreenPoint>({ x: 0, y: 0 });
  const mapWidth = Math.max(320, windowDimensions.width - 48);
  const mapHeight = Math.max(520, windowDimensions.height - 210);
  const tileSize = TILE_SIZE;
  const tiles = getMapTiles(center, tileZoom, tileSize, mapWidth, mapHeight, isDark, panOffset);
  const mapShade = tokenColor('map-shade');
  const mapShadeLight = tokenColor('map-shade-light');
  const mapRoute = tokenColor('map-route');
  const primary = tokenColor('primary');
  const darkGray = tokenColor('dark-gray');
  const sandGold = tokenColor('sand-gold') || tokenColor('gold');
  const shadowMarkerColor = tokenColor('secondary') || tokenColor('brand-secondary') || sandGold;
  const controlBackground = isDark ? '#121212' : tokenColor('white');
  const controlText = isDark ? sandGold : darkGray;
  const controlBorder = isDark ? '#3A3328' : tokenColor('medium-gray');
  const routeHalo = isDark ? '#132F46' : mapShadeLight;
  const tileFilter = isDark
    ? 'brightness(1.12) contrast(1.08) saturate(1.1)'
    : undefined;
  const routePath = getRoutePath(route, center, tileZoom, tileSize, mapWidth, mapHeight, panOffset, !isPedestrian);
  const zoomIn = () => setTileZoom((currentZoom) => clamp(currentZoom + 1, MIN_TILE_ZOOM, MAX_TILE_ZOOM));
  const zoomOut = () => setTileZoom((currentZoom) => clamp(currentZoom - 1, MIN_TILE_ZOOM, MAX_TILE_ZOOM));

  const selectMapCoordinate = (screenPoint: ScreenPoint) => {
    if (!onMapPress) {
      return;
    }

    onMapPress(
      getCoordinateFromScreenPoint(
        screenPoint,
        center,
        tileZoom,
        tileSize,
        mapWidth,
        mapHeight,
        isPedestrian ? panOffset : { x: 0, y: 0 }
      )
    );
  };

  const handleMapPress = (event: MapPressEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      lastDragEndAtRef.current = Date.now();
      return;
    }

    const locationX = event.nativeEvent?.locationX ?? event.nativeEvent?.offsetX;
    const locationY = event.nativeEvent?.locationY ?? event.nativeEvent?.offsetY;

    if (typeof locationX === 'number' && typeof locationY === 'number') {
      selectMapCoordinate({ x: locationX, y: locationY });
    }
  };

  const handleMapClick = (event: MapClickEvent) => {
    if (Date.now() - lastDragEndAtRef.current < 250) {
      return;
    }

    const locationX = event.nativeEvent?.offsetX;
    const locationY = event.nativeEvent?.offsetY;

    if (typeof locationX === 'number' && typeof locationY === 'number') {
      selectMapCoordinate({ x: locationX, y: locationY });
      return;
    }

    const clientX = event.nativeEvent?.clientX;
    const clientY = event.nativeEvent?.clientY;
    const rect = event.currentTarget?.getBoundingClientRect?.();

    if (typeof clientX === 'number' && typeof clientY === 'number' && rect) {
      selectMapCoordinate({ x: clientX - rect.left, y: clientY - rect.top });
    }
  };

  const handlePointerDown = (event: MapPointerEvent) => {
    const clientX = event.nativeEvent?.clientX;
    const clientY = event.nativeEvent?.clientY;

    if (typeof clientX !== 'number' || typeof clientY !== 'number') {
      return;
    }

    pointerStartRef.current = { x: clientX, y: clientY };
    pointerPanStartRef.current = panOffsetRef.current;
    isDraggingRef.current = false;
  };

  const handlePointerMove = (event: MapPointerEvent) => {
    const pointerStart = pointerStartRef.current;
    const clientX = event.nativeEvent?.clientX;
    const clientY = event.nativeEvent?.clientY;

    if (!pointerStart || typeof clientX !== 'number' || typeof clientY !== 'number') {
      return;
    }

    const deltaX = clientX - pointerStart.x;
    const deltaY = clientY - pointerStart.y;

    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) {
      isDraggingRef.current = true;
    }

    const nextOffset = {
      x: pointerPanStartRef.current.x + deltaX,
      y: pointerPanStartRef.current.y + deltaY,
    };

    panOffsetRef.current = nextOffset;
    setPanOffset(nextOffset);
  };

  const handlePointerUp = () => {
    pointerStartRef.current = null;
    if (isDraggingRef.current) {
      lastDragEndAtRef.current = Date.now();
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          isPedestrian && Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          isPedestrian && Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          panStartRef.current = panOffsetRef.current;
          isDraggingRef.current = false;
        },
        onPanResponderMove: (_, gestureState) => {
          if (Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 4) {
            isDraggingRef.current = true;
          }

          const nextOffset = {
            x: panStartRef.current.x + gestureState.dx,
            y: panStartRef.current.y + gestureState.dy,
          };

          panOffsetRef.current = nextOffset;
          setPanOffset(nextOffset);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [isPedestrian]
  );

  return (
    <View testID="quillamap-container" style={[tw`flex-1`, style]}>
      <View
        testID="quillamap-web"
        style={
          isPedestrian
            ? (isDark ? tw`flex-1 overflow-hidden bg-charcoal` : tw`flex-1 overflow-hidden bg-surface-light`)
            : tw`flex-1 overflow-hidden rounded-m border border-medium-gray bg-surface-light dark:bg-charcoal`
        }
      >
        <View
          testID="quillamap-web-map-art"
          style={[isDark ? tw`absolute inset-0 bg-black` : tw`absolute inset-0 bg-surface-light`, { overflow: 'hidden' }]}
        >
          <View testID="quillamap-web-map-tiles" style={tw`absolute inset-0`} />
          {tiles.map((tile) => (
            <React.Fragment key={tile.id}>
              <Image
                testID={`quillamap-web-map-tile-${tile.id}`}
                source={{ uri: tile.uri }}
                resizeMode="cover"
                style={{
                  position: 'absolute',
                  left: tile.left,
                  top: tile.top,
                  width: tile.size,
                  height: tile.size,
                  ...(tileFilter ? { filter: tileFilter } : null),
                }}
              />
              {tile.labelUri ? (
                <Image
                  testID={`quillamap-web-map-label-tile-${tile.id}`}
                  source={{ uri: tile.labelUri }}
                  resizeMode="cover"
                  style={{
                    position: 'absolute',
                    left: tile.left,
                    top: tile.top,
                    width: tile.size,
                    height: tile.size,
                    opacity: 0.92,
                    ...(tileFilter ? { filter: 'brightness(1.22) contrast(1.05)' } : null),
                  }}
                />
              ) : null}
            </React.Fragment>
          ))}
          {isPedestrian ? (
            <View style={[tw`absolute inset-0`, { backgroundColor: isDark ? '#1C2C3D' : '#FFFFFF', opacity: isDark ? 0.08 : 0.18 }]} />
          ) : null}
        </View>

        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <Path
            d={routePath}
            stroke={isPedestrian ? routeHalo : 'transparent'}
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.72"
          />
          <Path
            testID="quillamap-web-route"
            d={routePath}
            stroke={mapRoute}
            strokeWidth={isPedestrian ? '6' : '5'}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>

        {zones.map((zone) => {
          const markerPoint = getScreenPoint(zone.coordinate, center, tileZoom, tileSize, mapWidth, mapHeight);
          const markerX = markerPoint.x + (isPedestrian ? panOffset.x : 0);
          const markerY = markerPoint.y + (isPedestrian ? panOffset.y : 0);

          return (
            <Pressable
              key={zone.id}
              testID={`quillamap-web-shade-marker-${zone.id}`}
              accessibilityRole="button"
              accessibilityLabel={zone.title}
              onPress={() => onShadeZonePress?.(zone)}
              style={[
                isPedestrian
                  ? tw`absolute w-10 h-12 items-center justify-start`
                  : tw`absolute w-10 h-10 rounded-xl bg-white border-2 border-map-shade items-center justify-center`,
                {
                  left: isPedestrian ? markerX - 20 : clamp(markerX - 20, 12, mapWidth - 52),
                  top: isPedestrian ? markerY - 20 : clamp(markerY - 20, 76, mapHeight - 120),
                  zIndex: isPedestrian ? 12 : 4,
                },
              ]}
            >
              {isPedestrian ? (
                <QuillaMapShadowMarker color={shadowMarkerColor} />
              ) : (
                <MapIcon name="leaf-outline" size={18} color={mapShade} />
              )}
            </Pressable>
          );
        })}

        {selectedCoordinate && shouldShowShadowZones ? (
          <View
            testID="quillamap-web-shadow-draft-marker"
            style={[
              tw`absolute w-11 items-center justify-start`,
              {
                height: 52,
                left:
                  getScreenPoint(selectedCoordinate, center, tileZoom, tileSize, mapWidth, mapHeight).x
                  + (isPedestrian ? panOffset.x : 0)
                  - 22,
                top:
                  getScreenPoint(selectedCoordinate, center, tileZoom, tileSize, mapWidth, mapHeight).y
                  + (isPedestrian ? panOffset.y : 0)
                  - 22,
                zIndex: 12,
              },
            ]}
          >
            <QuillaMapShadowMarker color={shadowMarkerColor} size="draft" />
          </View>
        ) : null}

        {route.slice(0, 3).map((point, index) => {
          const routePoint = getScreenPoint(point, center, tileZoom, tileSize, mapWidth, mapHeight);
          const routeX = routePoint.x + (isPedestrian ? panOffset.x : 0);
          const routeY = routePoint.y + (isPedestrian ? panOffset.y : 0);

          return (
            <View
              key={`walking-marker-${point.latitude}-${point.longitude}-${index}`}
              testID={`quillamap-web-route-point-${index}`}
              style={[
                isPedestrian
                  ? [
                      tw`absolute w-9 h-9 rounded-xl border items-center justify-center`,
                      { backgroundColor: controlBackground, borderColor: controlBorder },
                    ]
                  : tw`absolute w-9 h-9 rounded-xl bg-white border border-primary items-center justify-center`,
                {
                  left: isPedestrian ? routeX - 18 : clamp(routeX - 18, 14, mapWidth - 50),
                  top: isPedestrian ? routeY - 18 : clamp(routeY - 18, 76, mapHeight - 118),
                },
              ]}
            >
              <MapIcon name="walk-outline" size={isPedestrian ? 18 : 17} color={isPedestrian ? controlText : primary} />
            </View>
          );
        })}

        <View
          style={[
            tw`absolute w-5 h-5 rounded-xl bg-map-route border-2 border-white`,
            {
              left: isPedestrian ? mapWidth / 2 + panOffset.x : '50%',
              top: isPedestrian ? mapHeight / 2 + panOffset.y : '50%',
              marginLeft: -10,
              marginTop: -10,
            },
          ]}
        />

        {isPedestrian ? (
          <View
            testID="quillamap-web-pan-layer"
            {...panResponder.panHandlers}
            onResponderRelease={handleMapPress as never}
            {...({ onClick: handleMapClick } as Record<string, unknown>)}
            {...({
              onPointerDown: handlePointerDown,
              onPointerMove: handlePointerMove,
              onPointerUp: handlePointerUp,
              onPointerCancel: handlePointerUp,
            } as Record<string, unknown>)}
            accessibilityRole={onMapPress ? 'button' : undefined}
            accessibilityLabel={onMapPress ? 'Seleccionar ubicacion de sombra' : undefined}
            style={[
              tw`absolute inset-0`,
              {
                cursor: 'grab',
                touchAction: 'none',
                userSelect: 'none',
                zIndex: 6,
              } as never,
            ]}
          />
        ) : null}

        <QuillaMapControls
          mode={mode}
          isDark={isDark}
          controlBackground={controlBackground}
          controlBorder={controlBorder}
          controlText={controlText}
          darkText={darkGray}
          mapRoute={mapRoute}
          mapShade={mapShade}
          primary={primary}
          zonesCount={zones.length}
          showZoom={isPedestrian}
          showLocate
          zoomInTestID="quillamap-web-zoom-in"
          zoomOutTestID="quillamap-web-zoom-out"
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />

        {children}
      </View>
    </View>
  );
};

export default QuillaMapWebRenderer;
