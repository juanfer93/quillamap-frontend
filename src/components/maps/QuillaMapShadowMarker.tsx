import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import type { MapIconProps } from './QuillaMap.icon.types';

interface QuillaMapShadowMarkerProps {
  color: string;
  size?: 'default' | 'draft';
}

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;

const QuillaMapShadowMarker = ({
  color,
  size = 'default',
}: QuillaMapShadowMarkerProps) => {
  const markerSize = size === 'draft' ? tw`w-11 h-11` : tw`w-10 h-10`;
  const iconSize = size === 'draft' ? 22 : 20;

  return (
    <View
      style={[
        tw`items-center justify-center`,
        {
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 8,
          elevation: 6,
        },
      ]}
    >
      <View
        style={[
          markerSize,
          tw`rounded-m border-2 bg-white items-center justify-center`,
          { borderColor: color },
        ]}
      >
        <MapIcon name="umbrella-outline" size={iconSize} color={color} />
      </View>
      <View
        style={[
          tw`absolute w-3 h-3 bg-white border-r-2 border-b-2`,
          {
            borderColor: color,
            bottom: -4,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
    </View>
  );
};

export default QuillaMapShadowMarker;
