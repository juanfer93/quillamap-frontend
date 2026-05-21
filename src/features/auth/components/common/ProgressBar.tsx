import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import tw from '@/lib/tailwind';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  theme: 'light' | 'dark';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, theme }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const progress = currentStep / (totalSteps - 1); 

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500, 
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps]);

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const borderColor = theme === 'dark' ? 'border-[#c7ad8c]' : 'border-black';
  const backgroundColor = theme === 'dark' ? 'bg-[#c7ad8c]' : 'bg-[#004574]';

  return (
    <View style={tw`h-1.5 flex-1 bg-transparent overflow-hidden border ${borderColor}`}>
      <Animated.View 
        style={[
          tw`h-full ${backgroundColor}`, 
          { width: widthInterpolated }
        ]} 
      />
    </View>
  );
};

export default ProgressBar;