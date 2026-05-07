import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RegisterRequest, RegisterResponse } from '@/features/auth/types/auth.types';
import { corporateColors } from '@/constants/theme';
import MobilityStep from '@/features/auth/components/register/MobilityStep';
import CarTypeStep from '@/features/auth/components/register/CarTypeStep';
import LicensePlateStep from '@/features/auth/components/register/LicensePlateStep';
import UserDetailsStep from '@/features/auth/components/register/UserDetailsStep';

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <MobilityStep handleVehicleTypeSelect={handleVehicleTypeSelect} />;
      case 2:
        return <CarTypeStep handleCarTypeSelect={handleCarTypeSelect} />;
      case 3:
        return <LicensePlateStep formData={formData} setPlate={setPlate} setCurrentStep={setCurrentStep} />;
      case 4:
        return <UserDetailsStep formData={formData} setFormData={setFormData} handleRegister={handleRegister} isLoading={isLoading} error={error} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wizardContainer}>
        {renderStep()}
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
  successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
  },
  successText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? corporateColors.white : corporateColors.sharkBlue,
      textAlign: 'center'
  }
});

export default RegisterScreen;