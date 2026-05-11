
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, useColorScheme, UIManager, LayoutAnimation,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RegisterRequest, RootStackParamList } from '@/features/auth/types/auth.types';
import { corporateColors } from '@/constants/theme';
import MobilityStep from '@/features/auth/components/register/MobilityStep';
import CarTypeStep from '@/features/auth/components/register/CarTypeStep';
import LicensePlateStep from '@/features/auth/components/register/LicensePlateStep';
import UserDetailsStep from '@/features/auth/components/register/UserDetailsStep';
import { authApi } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Maps backend enum values.
const mobilityModeMap: { [key: string]: RegisterRequest['mobility_mode'] } = {
  'PEATON': 'peaton',
  'TURISTA': 'turista',
  'MOTO': 'moto',
  'CARRO': 'carro',
};

const RegisterScreen = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterRequest>({
    full_name: '',
    email: '',
    password: '',
    mobility_mode: 'peaton',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const setSession = useAuthStore(state => state.setSession);

  const changeStep = (step: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentStep(step);
  }

  const handleVehicleTypeSelect = (type: 'PEATON' | 'TURISTA' | 'MOTO' | 'CARRO') => {
    const mobility_mode = mobilityModeMap[type];

    setFormData(prev => ({ ...prev, mobility_mode, vehicle_type: undefined, license_plate: undefined }));

    if (type === 'PEATON' || type === 'TURISTA') {
      changeStep(4);
    } else if (type === 'MOTO') {
      changeStep(3);
    } else { // CARRO
      changeStep(2);
    }
  };

  const handleCarTypeSelect = (type: 'PARTICULAR' | 'TAXI') => {
    setFormData(prev => ({ ...prev, vehicle_type: type }));
    changeStep(3);
  };

  const setPlate = (plate: string) => {
    setFormData(prev => ({ ...prev, license_plate: plate.toUpperCase() }));
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const responseData = await authApi.register(formData);
      const token = responseData?.accessToken;
      const user = responseData?.user;

      if (token && user) {
        setSession(token, user);
        setIsSuccess(true);
        setTimeout(() => {
          navigation.navigate('Home');
        }, 1500);
      } else if (user) {
        setIsSuccess(true);
        setTimeout(() => {
          navigation.navigate('Home');
        }, 1500);
      } else {
        throw new Error('No se recibió la información del usuario ni el token de sesión.');
      }

    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = getStyles(isDarkMode);

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successText}>¡Bienvenido {formData.full_name}! Tu registro ha sido exitoso.</Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDarkMode ? corporateColors.white : corporateColors.sharkBlue,
    textAlign: 'center'
  }
});

export default RegisterScreen;
