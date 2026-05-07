import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { corporateColors } from '@/constants/theme';

interface MobilityStepProps {
  handleVehicleTypeSelect: (type: 'PEATON' | 'TURISTA' | 'MOTO' | 'CARRO') => void;
}

const MobilityStep: React.FC<MobilityStepProps> = ({ handleVehicleTypeSelect }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>¿Cómo te mueves por la ciudad?</Text>
      <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('PEATON')}>
        <FontAwesome name="male" size={40} color={isDarkMode ? corporateColors.gold : corporateColors.sharkBlue} />
        <Text style={styles.cardText}>Peatón</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('TURISTA')}>
        <FontAwesome name="user-circle" size={40} color={isDarkMode ? corporateColors.gold : corporateColors.sharkBlue} />
        <Text style={styles.cardText}>Turista</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('MOTO')}>
        <FontAwesome name="motorcycle" size={40} color={isDarkMode ? corporateColors.gold : corporateColors.sharkBlue} />
        <Text style={styles.cardText}>Moto</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('CARRO')}>
        <FontAwesome name="car" size={40} color={isDarkMode ? corporateColors.gold : corporateColors.sharkBlue} />
        <Text style={styles.cardText}>Carro</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  stepContainer: {
    alignItems: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: isDarkMode ? corporateColors.white : corporateColors.sharkBlue,
    textAlign: 'center',
  },
  card: {
    backgroundColor: isDarkMode ? corporateColors.darkGray : corporateColors.white,
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? corporateColors.white : corporateColors.sharkBlue,
    marginLeft: 15,
  },
});

export default MobilityStep;
