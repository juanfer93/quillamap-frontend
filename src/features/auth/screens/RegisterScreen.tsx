import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, SafeAreaView, ActivityIndicator } from 'react-native';
import { RegisterRequest, RegisterResponse } from '../types/auth.types';
import { FontAwesome } from '@expo/vector-icons';


// Colores corporativos
const corporateColors = {
  gold: '#D4AF37',
  shark: '#004574',
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#f2f2f2',
  darkGray: '#333333',
};

const RegisterScreen = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
    mobility_type: 'PEATON',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVehicleTypeSelect = (type: 'PEATON' | 'TURISTA' | 'MOTO' | 'CARRO') => {
    setFormData(prev => ({ ...prev, mobility_type: type, vehicle_type: undefined, license_plate: undefined }));
    if (type === 'PEATON' || type === 'TURISTA') {
      setCurrentStep(4);
    } else if (type === 'MOTO') {
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
  };

  const handleCarTypeSelect = (type: 'PARTICULAR' | 'TAXI') => {
    setFormData(prev => ({ ...prev, vehicle_type: type }));
    setCurrentStep(3);
  };

  const setPlate = (plate: string) => {
    setFormData(prev => ({ ...prev, license_plate: plate.toUpperCase() }));
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error de conexión con el servidor');
      }
      
      const responseData: RegisterResponse = await response.json();
      if (response.status === 201 || response.status === 200) {
        setIsSuccess(true);
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = getStyles(isDarkMode);

  if (isSuccess) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.successContainer}>
                <Text style={styles.successText}>Bienvenido {formData.name}, estás en modo {formData.mobility_type}</Text>
            </View>
        </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wizardContainer}>
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>¿Cómo te mueves por la ciudad?</Text>
            <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('PEATON')}>
                <FontAwesome name="male" size={40} color={isDarkMode ? corporateColors.gold : corporateColors.shark} />
              <Text style={styles.cardText}>Peatón</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('TURISTA')}>
            <FontAwesome name="user-circle" size={40} color={isDarkMode ? corporateColors.gold : corporateColors.shark} />
              <Text style={styles.cardText}>Turista</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('MOTO')}>
            <FontAwesome name="motorcycle" size={40} color={isDarkMode ? corporateColors.gold : corporateColors.shark} />
              <Text style={styles.cardText}>Moto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => handleVehicleTypeSelect('CARRO')}>
            <FontAwesome name="car" size={40} color={isDarkMode ? corporateColors.gold : corporateColors.shark} />
              <Text style={styles.cardText}>Carro</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>¿Qué tipo de carro conduces?</Text>
            <TouchableOpacity style={styles.card} onPress={() => handleCarTypeSelect('PARTICULAR')}>
            <FontAwesome name="circle-o" size={24} color={isDarkMode ? corporateColors.gold : corporateColors.shark} />
              <Text style={styles.cardText}>Particular</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => handleCarTypeSelect('TAXI')}>
            <FontAwesome name="circle-o" size={24} color={isDarkMode ? corporateColors.gold : corporateColors.shark} />
              <Text style={styles.cardText}>Taxi</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <View style={[styles.plate, {backgroundColor: formData.vehicle_type === 'TAXI' ? corporateColors.white : '#FFD700'}]}>
                 <Text style={[styles.plateText, {color: corporateColors.black}]}>{formData.license_plate?.toUpperCase()}</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Placa del vehículo"
              value={formData.license_plate}
              onChangeText={setPlate}
              autoCapitalize="characters"
              placeholderTextColor={isDarkMode ? corporateColors.lightGray : corporateColors.darkGray}
            />
             <TouchableOpacity style={styles.button} onPress={() => setCurrentStep(4)}>
                <Text style={styles.buttonText}>Siguiente</Text>
             </TouchableOpacity>
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={formData.name}
              onChangeText={(name) => setFormData(prev => ({...prev, name}))}
              placeholderTextColor={isDarkMode ? corporateColors.lightGray : corporateColors.darkGray}
            />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={formData.email}
              onChangeText={(email) => setFormData(prev => ({...prev, email}))}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={isDarkMode ? corporateColors.lightGray : corporateColors.darkGray}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(password) => setFormData(prev => ({...prev, password}))}
              secureTextEntry
              placeholderTextColor={isDarkMode ? corporateColors.lightGray : corporateColors.darkGray}
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: corporateColors.gold }]} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={corporateColors.white} /> : <Text style={styles.buttonText}>Finalizar Registro</Text>}
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? corporateColors.black : corporateColors.lightGray,
  },
  wizardContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  stepContainer: {
    alignItems: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: isDarkMode ? corporateColors.white : corporateColors.shark,
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
    color: isDarkMode ? corporateColors.white : corporateColors.shark,
    marginLeft: 15,
  },
  plate: {
      width: '80%',
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 2,
      borderColor: corporateColors.shark,
      marginBottom: 30,
  },
  plateText: {
      fontSize: 40,
      fontWeight: 'bold',
      letterSpacing: 5
  },
  input: {
    width: '100%',
    backgroundColor: isDarkMode ? corporateColors.darkGray : corporateColors.white,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    color: isDarkMode ? corporateColors.white : corporateColors.black,
  },
  button: {
    backgroundColor: corporateColors.shark,
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: corporateColors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 15,
    textAlign: 'center'
  },
  successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
  },
  successText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? corporateColors.white : corporateColors.shark,
      textAlign: 'center'
  }
});

export default RegisterScreen;
