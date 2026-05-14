import React, { useState } from 'react';
import {
  View, Text, UIManager, LayoutAnimation,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RegisterRequest, RootStackParamList } from '@/features/auth/types/auth.types';
import MobilityStep from '@/features/auth/components/register/MobilityStep';
import CarTypeStep from '@/features/auth/components/register/CarTypeStep';
import LicensePlateStep from '@/features/auth/components/register/LicensePlateStep';
import UserDetailsStep from '@/features/auth/components/register/UserDetailsStep';
import { authApi } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import tw from 'twrnc';
import { useThemeStore } from '@/store/useThemeStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MobilityStepProps {
  selectedMode?: string;
  handleVehicleTypeSelect: (type: 'peaton' | 'turista' | 'moto' | 'carro') => void;
}

const mobilityModeMap: { [key: string]: RegisterRequest['mobility_mode'] } = {
  'PEATON': 'peaton',
  'TURISTA': 'turista',
  'MOTO': 'moto',
  'CARRO': 'carro',
};

const RegisterScreen = () => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? 'dark' : 'light';

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

  const handleVehicleTypeSelect = (type: 'peaton' | 'turista' | 'moto' | 'carro') => {
    setFormData(prev => ({
      ...prev,
      mobility_mode: type,
      vehicle_type: undefined,
      license_plate: undefined
    }));

    if (type === 'peaton' || type === 'turista') {
      changeStep(4);
    } else if (type === 'moto') {
      changeStep(3);
    } else {
      changeStep(2);
    }
  };

  const handleCarTypeSelect = (type: 'particular' | 'taxi') => {
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

  const containerStyle = tw`flex-1 bg-${theme === 'dark' ? 'black' : 'light-gray'}`;
  const wizardContainerStyle = tw`flex-1 justify-center p-l`;
  const successContainerStyle = tw`flex-1 justify-center items-center px-l`;
  const successTextStyle = tw`text-2xl font-bold text-center text-${theme === 'dark' ? 'white' : 'shark-blue'}`;

  if (isSuccess) {
    return (
      <SafeAreaView style={containerStyle}>
        <View style={successContainerStyle}>
          <Text style={successTextStyle}>{`¡Bienvenido ${formData.full_name}! Tu registro ha sido exitoso.`}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <MobilityStep
            selectedMode={formData.mobility_mode}
            handleVehicleTypeSelect={handleVehicleTypeSelect}
          />
        );
      case 2:
        const carType = (formData.vehicle_type === 'particular' || formData.vehicle_type === 'taxi')
          ? formData.vehicle_type
          : undefined;
        return (
          <CarTypeStep
            selectedType={carType}
            handleCarTypeSelect={handleCarTypeSelect}
          />
        );
      case 3:
        return (
          <LicensePlateStep
            formData={formData}
            setPlate={setPlate}
            setCurrentStep={setCurrentStep}
          />
        );
      case 4:
        return (
          <UserDetailsStep
            formData={formData}
            setFormData={setFormData}
            handleRegister={handleRegister}
            isLoading={isLoading}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={containerStyle}>
      <View style={wizardContainerStyle}>
        {renderStep()}
      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;