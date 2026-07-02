export interface MapTile {
  id: string;
  uri: string;
  labelUri?: string;
  left: number;
  top: number;
  size: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface MapPressEvent {
  nativeEvent?: {
    locationX?: number;
    locationY?: number;
    offsetX?: number;
    offsetY?: number;
  };
}

export interface MapClickEvent {
  currentTarget?: {
    getBoundingClientRect?: () => { left: number; top: number };
  };
  nativeEvent?: {
    clientX?: number;
    clientY?: number;
    locationX?: number;
    locationY?: number;
    offsetX?: number;
    offsetY?: number;
  };
}

export interface MapPointerEvent {
  nativeEvent?: {
    clientX?: number;
    clientY?: number;
  };
}
