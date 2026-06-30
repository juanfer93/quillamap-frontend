import React from 'react';
import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import tw from '@/lib/tailwind';
import type { QuillaMapCoordinate, QuillaMapProps } from './QuillaMap.types';
import { getRouteCoordinates, getVisibleShadeZones } from './QuillaMap.shared';

interface MapTile {
  id: string;
  uri: string;
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

const TILE_ZOOM = 16;
const TILE_COLUMNS = [-2, -1, 0, 1, 2, 3] as const;
const TILE_ROWS = [-3, -2, -1, 0, 1, 2, 3, 4] as const;

const tokenColor = (name: string): string => {
  const value = tw.color(name);
  return typeof value === 'string' ? value : '';
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const longitudeToTileX = (longitude: number, zoom: number): number =>
  ((longitude + 180) / 360) * 2 ** zoom;

const latitudeToTileY = (latitude: number, zoom: number): number => {
  const latitudeRadians = (latitude * Math.PI) / 180;
  return (
    ((1 -
      Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) /
      2) *
    2 ** zoom
  );
};

const getTileUri = (x: number, y: number, zoom: number): string =>
  `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;

const getScreenPoint = (
  coordinate: QuillaMapCoordinate,
  center: QuillaMapCoordinate,
  tileSize: number,
  mapWidth: number,
  mapHeight: number
): ScreenPoint => {
  const centerTileX = longitudeToTileX(center.longitude, TILE_ZOOM);
  const centerTileY = latitudeToTileY(center.latitude, TILE_ZOOM);
  const coordinateTileX = longitudeToTileX(coordinate.longitude, TILE_ZOOM);
  const coordinateTileY = latitudeToTileY(coordinate.latitude, TILE_ZOOM);

  return {
    x: mapWidth / 2 + (coordinateTileX - centerTileX) * tileSize,
    y: mapHeight / 2 + (coordinateTileY - centerTileY) * tileSize,
  };
};

const getMapTiles = (
  center: QuillaMapCoordinate,
  tileSize: number,
  mapWidth: number,
  mapHeight: number
): MapTile[] => {
  const centerTileX = longitudeToTileX(center.longitude, TILE_ZOOM);
  const centerTileY = latitudeToTileY(center.latitude, TILE_ZOOM);
  const baseTileX = Math.floor(centerTileX);
  const baseTileY = Math.floor(centerTileY);
  const fractionalX = centerTileX - baseTileX;
  const fractionalY = centerTileY - baseTileY;

  return TILE_COLUMNS.flatMap((columnOffset) =>
    TILE_ROWS.map((rowOffset) => {
      const x = baseTileX + columnOffset;
      const y = baseTileY + rowOffset;

      return {
        id: `${TILE_ZOOM}-${x}-${y}`,
        uri: getTileUri(x, y, TILE_ZOOM),
        left: mapWidth / 2 + (columnOffset - fractionalX) * tileSize,
        top: mapHeight / 2 + (rowOffset - fractionalY) * tileSize,
        size: tileSize,
      };
    })
  );
};

const getRoutePath = (
  routePoints: QuillaMapCoordinate[],
  center: QuillaMapCoordinate,
  tileSize: number,
  mapWidth: number,
  mapHeight: number
): string => {
  const points = routePoints.map((point) => getScreenPoint(point, center, tileSize, mapWidth, mapHeight));
  const visiblePoints = points.map((point) => ({
    x: clamp(point.x, 18, mapWidth - 18),
    y: clamp(point.y, 70, mapHeight - 88),
  }));

  return visiblePoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
};

const QuillaMapWebRenderer = ({
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
  const mapWidth = Math.max(320, windowDimensions.width - 48);
  const mapHeight = Math.max(520, windowDimensions.height - 210);
  const tileSize = Math.ceil(mapWidth / 3);
  const tiles = getMapTiles(center, tileSize, mapWidth, mapHeight);
  const routePath = getRoutePath(route, center, tileSize, mapWidth, mapHeight);
  const mapShade = tokenColor('map-shade');
  const mapRoute = tokenColor('map-route');
  const primary = tokenColor('primary');
  const darkGray = tokenColor('dark-gray');

  return (
    <View testID="quillamap-container" style={[tw`flex-1`, style]}>
      <View
        testID="quillamap-web"
        style={tw`flex-1 overflow-hidden rounded-m border border-medium-gray bg-surface-light dark:bg-charcoal`}
      >
        <View testID="quillamap-web-map-art" style={tw`absolute inset-0 bg-surface-light`}>
          <View testID="quillamap-web-map-tiles" style={tw`absolute inset-0`} />
          {tiles.map((tile) => (
            <Image
              key={tile.id}
              testID={`quillamap-web-map-tile-${tile.id}`}
              source={{ uri: tile.uri }}
              resizeMode="cover"
              style={{
                position: 'absolute',
                left: tile.left,
                top: tile.top,
                width: tile.size,
                height: tile.size,
              }}
            />
          ))}
        </View>

        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <Path
            testID="quillamap-web-route"
            d={routePath}
            stroke={mapRoute}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>

        <View style={tw`absolute left-m right-16 top-m h-10 rounded-m bg-white border border-medium-gray flex-row items-center px-s`}>
          <MapIcon name="search" size={17} color={darkGray} />
          <Text numberOfLines={1} style={tw`ml-s flex-1 text-dark-gray text-sm font-semibold`}>
            Buscar ruta fresca
          </Text>
          <MapIcon name="close" size={18} color={darkGray} />
        </View>

        <View style={tw`absolute right-m top-m w-10 h-10 rounded-m bg-white border border-medium-gray items-center justify-center`}>
          <MapIcon name="layers-outline" size={18} color={primary} />
        </View>

        <View style={tw`absolute right-m top-16 rounded-m bg-white border border-medium-gray px-s py-xs flex-row items-center`}>
          <MapIcon name="leaf-outline" size={15} color={mapShade} />
          <Text style={tw`ml-xs text-primary text-xs font-bold`}>
            {zones.length} sombras
          </Text>
        </View>

        {zones.map((zone) => {
          const markerPoint = getScreenPoint(zone.coordinate, center, tileSize, mapWidth, mapHeight);

          return (
            <Pressable
              key={zone.id}
              testID={`quillamap-web-shade-marker-${zone.id}`}
              accessibilityRole="button"
              accessibilityLabel={zone.title}
              onPress={() => onShadeZonePress?.(zone)}
              style={[
                tw`absolute w-10 h-10 rounded-xl bg-white border-2 border-map-shade items-center justify-center`,
                {
                  left: clamp(markerPoint.x - 20, 12, mapWidth - 52),
                  top: clamp(markerPoint.y - 20, 76, mapHeight - 120),
                },
              ]}
            >
              <MapIcon name="leaf-outline" size={18} color={mapShade} />
            </Pressable>
          );
        })}

        {route.slice(0, 3).map((point, index) => {
          const routePoint = getScreenPoint(point, center, tileSize, mapWidth, mapHeight);

          return (
            <View
              key={`walking-marker-${point.latitude}-${point.longitude}-${index}`}
              testID={`quillamap-web-route-point-${index}`}
              style={[
                tw`absolute w-9 h-9 rounded-xl bg-white border border-primary items-center justify-center`,
                {
                  left: clamp(routePoint.x - 18, 14, mapWidth - 50),
                  top: clamp(routePoint.y - 18, 76, mapHeight - 118),
                },
              ]}
            >
              <MapIcon name="walk-outline" size={17} color={primary} />
            </View>
          );
        })}

        <View
          style={[
            tw`absolute w-5 h-5 rounded-xl bg-map-route border-2 border-white`,
            {
              left: '50%',
              top: '50%',
              marginLeft: -10,
              marginTop: -10,
            },
          ]}
        />

        <View style={tw`absolute right-m bottom-20 w-11 h-11 rounded-xl bg-white border border-medium-gray items-center justify-center`}>
          <MapIcon name="navigate" size={18} color={darkGray} />
        </View>

        <View style={tw`absolute left-m bottom-20 w-10 h-10 rounded-xl bg-white border border-medium-gray items-center justify-center`}>
          <MapIcon name="locate-outline" size={18} color={primary} />
        </View>

        <View style={tw`absolute left-0 right-0 bottom-0 h-16 bg-white border-t border-medium-gray flex-row items-center justify-around px-l`}>
          <MapIcon name="walk" size={20} color={mapRoute} />
          <MapIcon name="location-outline" size={20} color={darkGray} />
          <MapIcon name="bookmark-outline" size={20} color={darkGray} />
          <MapIcon name="person-outline" size={20} color={darkGray} />
        </View>

        {children}
      </View>
    </View>
  );
};

export default QuillaMapWebRenderer;
