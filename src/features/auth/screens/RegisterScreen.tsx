import React, { useState } from 'react';
import {
  View, Text, UIManager, LayoutAnimation,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RegisterRequest, RootStackParamList } from '@/features/auth/types/auth.types';
import MobilityStep from '@/features/auth/components/register/MobilityStep';
import CarTypeStep from '@/features/auth/components/register/CarTypeStep';
import LicensePlateStep from '@/features/auth/components/register/LicensePlateStep';
import UserDetailsStep from '@/features/auth/components/register/UserDetailsStep';
import ProgressBar from '@/features/auth/components/common/ProgressBar';
import { authApi } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import tw from '@/lib/tailwind';
import { useThemeStore } from '@/store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const emailExistsMessage = 'El correo ya existe. Inicia sesion o usa otro correo.';

const getRegisterErrorMessage = (error: any) => {
  const apiMessage = error.response?.data?.message;
  const message = Array.isArray(apiMessage) ? apiMessage[0] : apiMessage;
  const fallbackMessage = String(message || error.message || 'Error de conexion con el servidor');

  const normalizedMessage = fallbackMessage.toLowerCase();

  if (
    normalizedMessage.includes('correo ya existe')
    || normalizedMessage.includes('already registered')
    || normalizedMessage.includes('already been registered')
  ) {
    return emailExistsMessage;
  }

  return fallbackMessage;
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
    vehicle_type: 'peaton',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const setSession = useAuthStore(state => state.setSession);

  const handleStepTransition = (nextStep: number) => {
    setIsStepLoading(true);

    setTimeout(() => {
      if (LayoutAnimation.Presets) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setCurrentStep(nextStep);
      setIsStepLoading(false);
    }, 300);
  };

  const handleVehicleTypeSelect = (type: 'peaton' | 'turista' | 'moto' | 'carro') => {
    setFormData(prev => ({
      ...prev,
      mobility_mode: type,
      vehicle_type: type === 'peaton' ? 'peaton' : undefined,
      license_plate: undefined
    }));

    if (type === 'peaton' || type === 'turista') handleStepTransition(4);
    else if (type === 'moto') handleStepTransition(3);
    else handleStepTransition(2);
  };

  const handleCarTypeSelect = (type: 'particular' | 'taxi') => {
    setFormData(prev => ({ ...prev, vehicle_type: type }));
    handleStepTransition(3);
  };

  const setPlate = (plate: string) => {
    setFormData(prev => ({ ...prev, license_plate: plate.toUpperCase() }));
  };

  const handleBackStep = () => {
    setIsStepLoading(true);

    setTimeout(() => {
      if (currentStep === 1) {
        navigation.navigate('Login');
      } else {
        let nextStep = 1;
        if (currentStep === 4) nextStep = 1;
        else if (currentStep === 3) nextStep = formData.mobility_mode === 'moto' ? 1 : 2;
        else if (currentStep === 2) nextStep = 1;

        if (LayoutAnimation.Presets) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setCurrentStep(nextStep);
        setIsStepLoading(false);
      }
    }, 300);
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
      const message = getRegisterErrorMessage(e);
      setError(message);
      Alert.alert('No pudimos crear tu cuenta', message);
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

  if (isStepLoading) {
    return (
      <SafeAreaView style={containerStyle}>
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator
            testID="spinner"
            size="large"
            color={theme === 'dark' ? (tw.color('sand-gold') || '#c7ad8c') : (tw.color('shark-blue') || '#004574')}
          />
        </View>
      </SafeAreaView>
    );
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
            setCurrentStep={handleStepTransition}
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

      <View style={tw`absolute top-8 left-6 right-6 z-50 flex-row items-center`}>
        {currentStep > 0 && (
          <TouchableOpacity
            testID="back-button"
            onPress={handleBackStep}
            style={tw`p-2 mr-4`} 
          >
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#c7ad8c' : '#004574'} />
          </TouchableOpacity>
        )}

        <ProgressBar currentStep={currentStep} totalSteps={4} theme={theme} />
      </View>

      {isStepLoading && (
        <View style={tw`absolute inset-0 z-50 bg-${theme === 'dark' ? 'black' : 'light-gray'} justify-center items-center`}>
          <ActivityIndicator size="large" color={theme === 'dark' ? '#c7ad8c' : '#004574'} />
        </View>
      )}

      <View style={wizardContainerStyle}>
        {renderStep()}
      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;
