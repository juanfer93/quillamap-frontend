import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import tw from 'twrnc';
import { useThemeStore } from 'src/store/useThemeStore';
import { MOBILITY_MODES, MobilityModeId } from 'src/features/auth/constants/mobilityModes';

interface MobilityStepProps {
  selectedMode?: MobilityModeId;
  handleVehicleTypeSelect: (type: MobilityModeId) => void;
}

const MobilityStep: React.FC<MobilityStepProps> = ({ handleVehicleTypeSelect, selectedMode }) => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  return (
    <View style={tw`items-center w-full`}>
      <Text style={tw`text-2xl font-bold mb-xl text-center text-shark-blue dark:text-sand-gold`}>
        ¿Cómo te mueves por la ciudad?
      </Text>

      <View style={tw`w-full`}>
        {MOBILITY_MODES.map((item) => {
          const isSelected = selectedMode === item.id;
          
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleVehicleTypeSelect(item.id)}
              activeOpacity={0.7}
              style={[
                tw`w-full flex-row items-center p-l rounded-l mb-m border`,
                tw`bg-white dark:bg-slate`, 
                { 
                  borderColor: isSelected 
                    ? (isDark ? '#c7ad8c' : '#004574') 
                    : (isDark ? '#333333' : '#f2f2f2'),
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
                style={tw`w-12 h-12 mr-m`}
                resizeMode="contain"
              />

              <Text style={tw`text-lg font-bold text-black dark:text-white`}>
                {item.name}
              </Text>

              <View style={tw`flex-1 items-end`}>
                <View style={[
                  tw`w-6 h-6 rounded-full border-2 justify-center items-center`,
                  { borderColor: isSelected ? (isDark ? '#c7ad8c' : '#004574') : '#e0e0e0' }
                ]}>
                  {isSelected && (
                    <View style={tw`w-3 h-3 rounded-full bg-shark-blue dark:bg-sand-gold`} />
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

export default MobilityStep;