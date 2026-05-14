export type CarTypeId = 'particular' | 'taxi';

export interface CarType {
  id: CarTypeId;
  name: string;
  uri: string;
}

export const CAR_TYPES: CarType[] = [
  { 
    id: 'particular', 
    name: 'Particular', 
    uri: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Automobile/3D/automobile_3d.png' 
  },
  { 
    id: 'taxi', 
    name: 'Taxi', 
    uri: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Taxi/3D/taxi_3d.png' 
  },
];