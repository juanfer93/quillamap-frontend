export type MobilityModeId = 'peaton' | 'turista' | 'moto' | 'carro';

export interface MobilityMode {
  id: MobilityModeId;
  name: string;
  uri: string;
}

export const MOBILITY_MODES: MobilityMode[] = [
  { 
    id: 'carro', 
    name: 'Carro', 
    uri: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Automobile/3D/automobile_3d.png' 
  },
  { 
    id: 'moto', 
    name: 'Moto', 
    uri: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Motorcycle/3D/motorcycle_3d.png' 
  },
  { 
    id: 'peaton', 
    name: 'Peatón', 
    uri: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Man%20walking/Medium-Light/3D/man_walking_3d_medium-light.png' 
  },
  { 
    id: 'turista', 
    name: 'Turista', 
    uri: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/World%20map/3D/world_map_3d.png' 
  },
];