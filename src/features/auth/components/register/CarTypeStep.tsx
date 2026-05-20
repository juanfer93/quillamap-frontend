import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import tw from '@/lib/tailwind';
import { useThemeStore } from 'src/store/useThemeStore';
import { CAR_TYPES, CarTypeId } from 'src/features/auth/constants/carTypes';
import BackButton from 'src/features/auth/components/common/BackButton';

interface CarTypeStepProps {
  selectedType?: CarTypeId;
  handleCarTypeSelect: (type: CarTypeId) => void;
  onBack: () => void;
}

const CarTypeStep: React.FC<CarTypeStepProps> = ({ handleCarTypeSelect, selectedType, onBack }) => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  return (
    <View style={tw`items-center w-full`}>
      <BackButton onPress={onBack} />
      
      <Text style={tw`text-2xl font-bold mb-xl text-center text-shark-blue dark:text-sand-gold`}>
        ¿Qué tipo de vehículo es?
      </Text>

      <View style={tw`w-full`}>
        {CAR_TYPES.map((item) => {
          const isSelected = selectedType === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleCarTypeSelect(item.id)}
              activeOpacity={0.7}
              style={tw.style(
                'w-full flex-row items-center p-l rounded-m mb-m border-2',
                'bg-white dark:bg-charcoal',
                isSelected 
                  ? (isDark ? 'border-sand-gold' : 'border-shark-blue') 
                  : (isDark ? 'border-dark-gray' : 'border-medium-gray')
              )}
            >
              <Image 
                source={{ uri: item.uri }} 
                style={[
                  tw`w-12 h-12 mr-m`,
                  { tintColor: isDark ? tw.color('sand-gold') : tw.color('black') }
                ]}
                resizeMode="contain"
              />

              <Text style={tw`text-lg font-bold text-black dark:text-sand-gold`}>
                {item.name}
              </Text>

              <View style={tw`flex-1 items-end`}>
                <View style={tw.style(
                  'w-6 h-6 rounded-full border-2 justify-center items-center',
                  isSelected 
                    ? (isDark ? 'border-sand-gold' : 'border-shark-blue') 
                    : 'border-medium-gray'
                )}>
                  {isSelected && (
                    <View style={tw.style(
                      'w-3 h-3 rounded-full',
                      isDark ? 'bg-sand-gold' : 'bg-shark-blue'
                    )} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default CarTypeStep;