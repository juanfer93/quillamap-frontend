import React, { useMemo, useRef, useState } from 'react';
import { Image, PanResponder, Pressable, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import tw from '@/lib/tailwind';
import type { QuillaMapCoordinate, QuillaMapProps } from './QuillaMap.types';
import { getRouteCoordinates, getVisibleShadeZones } from './QuillaMap.shared';
import QuillaMapControls from './QuillaMapControls';

interface MapTile {
  id: string;
  uri: string;
  labelUri?: string;
  left: number;
  top: number;
  size: number;
}

interface ScreenPoint {
  x: number;
  y: number;
}

interface MapIconProps {
  name: string;
  size: number;
  color: string;
}

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;

const DEFAULT_TILE_ZOOM = 16;
const MIN_TILE_ZOOM = 14;
const MAX_TILE_ZOOM = 18;
const TILE_SIZE = 256;

const tokenColor = (name: string): string => {
  const value = tw.color(name);
  return typeof value === 'string' ? value : '';
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const longitudeToTileX: (longitude: number, zoom: number) => number = (longitude, zoom) =>
  ((longitude + 180) / 360) * 2 ** zoom;

const latitudeToTileY: (latitude: number, zoom: number) => number = (latitude, zoom) => {
  const latitudeRadians = (latitude * Math.PI) / 180;
  return (
    ((1 -
      Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) /
      2) *
    2 ** zoom
  );
};

const getTileUri = (x: number, y: number, zoom: number, isDark: boolean): string => {
  if (isDark) {
    return `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${zoom}/${y}/${x}`;
  }

  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
};

const getLabelTileUri = (x: number, y: number, zoom: number, isDark: boolean): string | undefined => {
  if (!isDark) {
    return undefined;
  }

  return `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/${zoom}/${y}/${x}`;
};

const getScreenPoint = (
  coordinate: QuillaMapCoordinate,
  center: QuillaMapCoordinate,
  zoom: number,
  tileSize: number,
  mapWidth: number,
  mapHeight: number
): ScreenPoint => {
  const centerTileX = longitudeToTileX(center.longitude, zoom);
  const centerTileY = latitudeToTileY(center.latitude, zoom);
  const coordinateTileX = longitudeToTileX(coordinate.longitude, zoom);
  const coordinateTileY = latitudeToTileY(coordinate.latitude, zoom);

  return {
    x: mapWidth / 2 + (coordinateTileX - centerTileX) * tileSize,
    y: mapHeight / 2 + (coordinateTileY - centerTileY) * tileSize,
  };
};

const getMapTiles = (
  center: QuillaMapCoordinate,
  zoom: number,
  tileSize: number,
  mapWidth: number,
  mapHeight: number,
  isDark: boolean,
  offset: ScreenPoint
): MapTile[] => {
  const centerTileX = longitudeToTileX(center.longitude, zoom);
  const centerTileY = latitudeToTileY(center.latitude, zoom);
  const baseTileX = Math.floor(centerTileX);
  const baseTileY = Math.floor(centerTileY);
  const fractionalX = centerTileX - baseTileX;
  const fractionalY = centerTileY - baseTileY;
  const minColumnOffset = Math.floor((-mapWidth / 2 - offset.x) / tileSize + fractionalX) - 2;
  const maxColumnOffset = Math.ceil((mapWidth / 2 - offset.x) / tileSize + fractionalX) + 2;
  const minRowOffset = Math.floor((-mapHeight / 2 - offset.y) / tileSize + fractionalY) - 2;
  const maxRowOffset = Math.ceil((mapHeight / 2 - offset.y) / tileSize + fractionalY) + 2;
  const columnOffsets = Array.from(
    { length: maxColumnOffset - minColumnOffset + 1 },
    (_, index) => minColumnOffset + index
  );
  const rowOffsets = Array.from(
    { length: maxRowOffset - minRowOffset + 1 },
    (_, index) => minRowOffset + index
  );

  return columnOffsets.flatMap((columnOffset) =>
    rowOffsets.map((rowOffset) => {
      const x = baseTileX + columnOffset;
      const y = baseTileY + rowOffset;

      return {
        id: `${zoom}-${x}-${y}`,
        uri: getTileUri(x, y, zoom, isDark),
        labelUri: getLabelTileUri(x, y, zoom, isDark),
        left: mapWidth / 2 + (columnOffset - fractionalX) * tileSize + offset.x,
        top: mapHeight / 2 + (rowOffset - fractionalY) * tileSize + offset.y,
        size: tileSize,
      };
    })
  );
};

const getRoutePath = (
  routePoints: QuillaMapCoordinate[],
  center: QuillaMapCoordinate,
  zoom: number,
  tileSize: number,
  mapWidth: number,
  mapHeight: number,
  offset: ScreenPoint = { x: 0, y: 0 },
  shouldClamp = true
): string => {
  const points = routePoints.map((point) => getScreenPoint(point, center, zoom, tileSize, mapWidth, mapHeight));
  const visiblePoints = points.map((point) => {
    const x = point.x + offset.x;
    const y = point.y + offset.y;

    return {
      x: shouldClamp ? clamp(x, 18, mapWidth - 18) : x,
      y: shouldClamp ? clamp(y, 70, mapHeight - 88) : y,
    };
  });

  return visiblePoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
};

const getMetersPerTile = (latitude: number, zoom: number): number =>
  (40075016.686 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom;

const getShadePath = (
  zonePoint: ScreenPoint,
  radiusMeters: number,
  center: QuillaMapCoordinate,
  zoom: number,
  tileSize: number
): string => {
  const metersPerTile = getMetersPerTile(center.latitude, zoom);
  const radius = clamp((radiusMeters * tileSize) / metersPerTile, 46, 128);
  const horizontal = radius * 1.06;
  const vertical = radius * 1.34;

  return [
    `M ${(zonePoint.x - horizontal * 0.92).toFixed(1)} ${(zonePoint.y - vertical * 0.32).toFixed(1)}`,
    `C ${(zonePoint.x - horizontal * 0.72).toFixed(1)} ${(zonePoint.y - vertical * 0.92).toFixed(1)}, ${(zonePoint.x - horizontal * 0.12).toFixed(1)} ${(zonePoint.y - vertical * 1.06).toFixed(1)}, ${(zonePoint.x + horizontal * 0.42).toFixed(1)} ${(zonePoint.y - vertical * 0.72).toFixed(1)}`,
    `C ${(zonePoint.x + horizontal * 1.04).toFixed(1)} ${(zonePoint.y - vertical * 0.34).toFixed(1)}, ${(zonePoint.x + horizontal * 0.82).toFixed(1)} ${(zonePoint.y + vertical * 0.44).toFixed(1)}, ${(zonePoint.x + horizontal * 0.20).toFixed(1)} ${(zonePoint.y + vertical * 0.84).toFixed(1)}`,
    `C ${(zonePoint.x - horizontal * 0.46).toFixed(1)} ${(zonePoint.y + vertical * 1.18).toFixed(1)}, ${(zonePoint.x - horizontal * 1.08).toFixed(1)} ${(zonePoint.y + vertical * 0.48).toFixed(1)}, ${(zonePoint.x - horizontal * 0.92).toFixed(1)} ${(zonePoint.y - vertical * 0.32).toFixed(1)}`,
    'Z',
  ].join(' ');
};

const QuillaMapWebRenderer = ({
  mode,
  themeMode = 'light',
  center,
  shadeZones,
  routePoints,
  children,
  onShadeZonePress,
  style,
}: QuillaMapProps) => {
  const windowDimensions = useWindowDimensions();
  const zones = getVisibleShadeZones(shadeZones);
  const route = getRouteCoordinates(routePoints, center);
  const isDark = themeMode === 'dark';
  const [tileZoom, setTileZoom] = useState(DEFAULT_TILE_ZOOM);
  const [panOffset, setPanOffset] = useState<ScreenPoint>({ x: 0, y: 0 });
  const panOffsetRef = useRef<ScreenPoint>({ x: 0, y: 0 });
  const panStartRef = useRef<ScreenPoint>({ x: 0, y: 0 });
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
  const isPedestrian = mode === 'pedestrian';
  const controlBackground = isDark ? '#121212' : tokenColor('white');
  const controlText = isDark ? sandGold : darkGray;
  const controlBorder = isDark ? '#3A3328' : tokenColor('medium-gray');
  const shadeFill = isDark ? `${mapShade}70` : mapShadeLight;
  const shadeStroke = isDark ? sandGold : mapShade;
  const routeHalo = isDark ? '#132F46' : mapShadeLight;
  const tileFilter = isDark
    ? 'brightness(1.12) contrast(1.08) saturate(1.1)'
    : undefined;
  const routePath = getRoutePath(route, center, tileZoom, tileSize, mapWidth, mapHeight, panOffset, !isPedestrian);
  const zoomIn = () => setTileZoom((currentZoom) => clamp(currentZoom + 1, MIN_TILE_ZOOM, MAX_TILE_ZOOM));
  const zoomOut = () => setTileZoom((currentZoom) => clamp(currentZoom - 1, MIN_TILE_ZOOM, MAX_TILE_ZOOM));
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
        },
        onPanResponderMove: (_, gestureState) => {
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
          {isPedestrian
            ? zones.map((zone) => {
                const zonePoint = getScreenPoint(zone.coordinate, center, tileZoom, tileSize, mapWidth, mapHeight);
                const pannedZonePoint = {
                  x: zonePoint.x + panOffset.x,
                  y: zonePoint.y + panOffset.y,
                };

                return (
                  <Path
                    key={`shade-area-${zone.id}`}
                    d={getShadePath(pannedZonePoint, zone.radiusMeters, center, tileZoom, tileSize)}
                    fill={shadeFill}
                    stroke={shadeStroke}
                    strokeWidth="2"
                    opacity="0.78"
                  />
                );
              })
            : null}
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
                  ? [
                      tw`absolute w-10 h-10 rounded-xl border items-center justify-center`,
                      { backgroundColor: controlBackground, borderColor: controlBorder },
                    ]
                  : tw`absolute w-10 h-10 rounded-xl bg-white border-2 border-map-shade items-center justify-center`,
                {
                  left: isPedestrian ? markerX - 20 : clamp(markerX - 20, 12, mapWidth - 52),
                  top: isPedestrian ? markerY - 20 : clamp(markerY - 20, 76, mapHeight - 120),
                },
              ]}
            >
              <MapIcon name={isPedestrian ? 'walk-outline' : 'leaf-outline'} size={18} color={isPedestrian ? controlText : mapShade} />
            </Pressable>
          );
        })}

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
            style={[
              tw`absolute inset-0`,
              {
                cursor: 'grab',
                touchAction: 'none',
                userSelect: 'none',
                zIndex: 10,
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
