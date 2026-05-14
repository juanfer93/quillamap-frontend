import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TextInput } from 'react-native';
import tw from 'twrnc';

interface AnimatedInputProps {
  label: string;
  hasError: boolean;
  isDark: boolean;
  [key: string]: any; 
}

const AnimatedInput = ({ label, hasError, isDark, ...props }: AnimatedInputProps) => {
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderColorAnim, {
      toValue: hasError ? 1 : 0,
      duration: 400, 
      useNativeDriver: false,
    }).start();
  }, [hasError]);

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDark ? '#333333' : '#e0e0e0', 
      '#FF3B30' 
    ],
  });

  return (
    <View style={tw`mb-m`}>
      <Text style={tw`text-s font-semibold text-dark-gray dark:text-light-gray mb-s ml-1`}>
        {label}
      </Text>
      <Animated.View 
        style={[
          tw`w-full bg-light-gray dark:bg-black rounded-m border`,
          { borderColor: borderColor, borderWidth: 1.5 }
        ]}
      >
        <TextInput
          {...props}
          testID={props.testID} 
          style={tw`w-full text-black dark:text-white px-m py-m rounded-m`}
          placeholderTextColor={isDark ? '#666' : '#999'}
        />
      </Animated.View>
    </View>
  );
};

export default AnimatedInput