import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import { useThemeStore } from '@/store/useThemeStore';

interface MobilityStepProps {
  handleVehicleTypeSelect: (type: 'PEATON' | 'TURISTA' | 'MOTO' | 'CARRO') => void;
}

const MobilityStep: React.FC<MobilityStepProps> = ({ handleVehicleTypeSelect }) => {
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
      <Text style={styles.questionText}>¿Cómo te mueves por la ciudad?</Text>
      <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('PEATON')}>
        <FontAwesome name="male" size={40} color={iconColor} />
        <Text style={styles.cardText}>Peatón</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('TURISTA')}>
        <FontAwesome name="user-circle" size={40} color={iconColor} />
        <Text style={styles.cardText}>Turista</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('MOTO')}>
        <FontAwesome name="motorcycle" size={40} color={iconColor} />
        <Text style={styles.cardText}>Moto</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('CARRO')}>
        <FontAwesome name="car" size={40} color={iconColor} />
        <Text style={styles.cardText}>Carro</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MobilityStep;
