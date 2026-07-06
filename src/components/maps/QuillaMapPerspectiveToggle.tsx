import React from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import type { MapIconProps } from './QuillaMap.icon.types';

interface QuillaMapPerspectiveToggleProps {
  is3D: boolean;
  onPress: () => void;
  backgroundColor: string;
  borderColor: string;
  color: string;
  testID?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;

const QuillaMapPerspectiveToggle = ({
  is3D,
  onPress,
  backgroundColor,
  borderColor,
  color,
  testID,
  compact = false,
  style,
}: QuillaMapPerspectiveToggleProps) => {
  const nextMode = is3D ? '2D' : '3D';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Cambiar a vista ${nextMode}`}
      accessibilityHint="Alterna entre la vista plana y la vista inclinada del mapa"
      accessibilityState={{ selected: is3D }}
      onPress={onPress}
      style={[
        tw`border items-center justify-center`,
        {
          width: compact ? 44 : 40,
          height: compact ? 44 : 40,
          borderRadius: compact ? 12 : 10,
          backgroundColor,
          borderColor,
        },
        style,
      ]}
    >
      <MapIcon name={is3D ? 'cube-outline' : 'map-outline'} size={compact ? 16 : 15} color={color} />
      <Text style={{ color, fontSize: 10, fontWeight: '800', lineHeight: 11, marginTop: -1 }}>
        {is3D ? '3D' : '2D'}
      </Text>
    </Pressable>
  );
};

export default QuillaMapPerspectiveToggle;
