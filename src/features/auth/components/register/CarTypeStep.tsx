import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import tw from '@/lib/tailwind';
import { useThemeStore } from 'src/store/useThemeStore';
import { CAR_TYPES, CarTypeId } from '../../constants/carTypes';

interface CarTypeStepProps {
  selectedType?: CarTypeId;
  handleCarTypeSelect: (type: CarTypeId) => void;
}

const CarTypeStep: React.FC<CarTypeStepProps> = ({ handleCarTypeSelect, selectedType }) => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const activeColor = isDark ? (tw.color('sand-gold') || '#c7ad8c') : (tw.color('shark-blue') || '#004574');
  const inactiveBorderColor = isDark ? '#333333' : '#f2f2f2';

  return (
    <View style={tw`items-center w-full`}>
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
              style={[
                tw`w-full flex-row items-center p-l rounded-l mb-m border`,
                tw`bg-white dark:bg-slate`, 
                { 
                  borderColor: isSelected ? activeColor : inactiveBorderColor,
                  borderWidth: isSelected ? 2 : 1
                },
                !isDark && {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 3,
                }
              ]}
            >
              <Image 
                source={{ uri: item.uri }} 
                style={[
                  tw`w-12 h-12 mr-m`,
                  {
                    tintColor: isDark ? activeColor : '#000000'
                  }
                ]}
                resizeMode="contain"
              />

              <Text style={tw`text-lg font-bold text-black dark:text-sand-gold`}>
                {item.name}
              </Text>

              <View style={tw`flex-1 items-end`}>
                <View style={[
                  tw`w-6 h-6 rounded-full border-2 justify-center items-center`,
                  { borderColor: isSelected ? activeColor : (isDark ? '#444444' : '#e0e0e0') }
                ]}>
                  {isSelected && (
                    <View style={[
                      tw`w-3 h-3 rounded-full`,
                      { backgroundColor: activeColor }
                    ]} />
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