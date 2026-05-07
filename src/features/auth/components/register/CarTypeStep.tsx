import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { corporateColors } from '@/constants/theme';

interface CarTypeStepProps {
  handleCarTypeSelect: (type: 'PARTICULAR' | 'TAXI') => void;
}

const CarTypeStep: React.FC<CarTypeStepProps> = ({ handleCarTypeSelect }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>¿Qué tipo de carro conduces?</Text>
      <TouchableOpacity style={styles.card} onPress={() => handleCarTypeSelect('PARTICULAR')}>
        <FontAwesome name="circle-o" size={24} color={isDarkMode ? corporateColors.gold : corporateColors.sharkBlue} />
        <Text style={styles.cardText}>Particular</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => handleCarTypeSelect('TAXI')}>
        <FontAwesome name="circle-o" size={24} color={isDarkMode ? corporateColors.gold : corporateColors.sharkBlue} />
        <Text style={styles.cardText}>Taxi</Text>
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

export default CarTypeStep;
