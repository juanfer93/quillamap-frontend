import type { QuillaMapCoordinate } from '../types/QuillaMap.types';
import type { MapTile, ScreenPoint } from '../QuillaMap.web.types';

export const clamp = (value: number, min: number, max: number): number =>
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

const tileXToLongitude = (tileX: number, zoom: number): number =>
  (tileX / 2 ** zoom) * 360 - 180;

const tileYToLatitude = (tileY: number, zoom: number): number => {
  const n = Math.PI - (2 * Math.PI * tileY) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
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

export const getScreenPoint = (
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

export const getCoordinateFromScreenPoint = (
  screenPoint: ScreenPoint,
  center: QuillaMapCoordinate,
  zoom: number,
  tileSize: number,
  mapWidth: number,
  mapHeight: number,
  offset: ScreenPoint
): QuillaMapCoordinate => {
  const centerTileX = longitudeToTileX(center.longitude, zoom);
  const centerTileY = latitudeToTileY(center.latitude, zoom);
  const coordinateTileX = centerTileX + ((screenPoint.x - offset.x) - mapWidth / 2) / tileSize;
  const coordinateTileY = centerTileY + ((screenPoint.y - offset.y) - mapHeight / 2) / tileSize;

  return {
    latitude: tileYToLatitude(coordinateTileY, zoom),
    longitude: tileXToLongitude(coordinateTileX, zoom),
  };
};

export const getMapTiles = (
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

export const getRoutePath = (
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

export const getShadePath = (
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
