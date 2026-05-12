import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import { useThemeStore } from '@/store/useThemeStore';

interface CarTypeStepProps {
  handleCarTypeSelect: (type: 'PARTICULAR' | 'TAXI') => void;
}

const CarTypeStep: React.FC<CarTypeStepProps> = ({ handleCarTypeSelect }) => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? 'dark' : 'light';

  const styles = {
    stepContainer: tw`items-center`,
    questionText: tw`text-2xl font-bold mb-8 text-center text-${theme === 'dark' ? 'white' : 'shark-blue'}`,
    card: tw`bg-${theme === 'dark' ? 'dark-gray' : 'white'} p-5 rounded-2xl mb-4 w-full items-center flex-row justify-center shadow-md`,
    cardText: tw`text-lg font-semibold ml-4 text-${theme === 'dark' ? 'white' : 'shark-blue'}`,
  };

  const iconColor = tw.color(theme === 'dark' ? 'gold' : 'shark-blue');

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>¿Qué tipo de carro conduces?</Text>
      <TouchableOpacity style={styles.card} onPress={() => handleCarTypeSelect('PARTICULAR')}>
        <FontAwesome name="circle-o" size={24} color={iconColor} />
        <Text style={styles.cardText}>Particular</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => handleCarTypeSelect('TAXI')}>
        <FontAwesome name="circle-o" size={24} color={iconColor} />
        <Text style={styles.cardText}>Taxi</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CarTypeStep;
