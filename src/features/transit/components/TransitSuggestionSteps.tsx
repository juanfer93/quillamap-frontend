import React from 'react';
import { Text, View } from 'react-native';
import tw from '@/lib/tailwind';

interface TransitSuggestionStepsProps {
  instructions: string[];
  compact?: boolean;
}

const TransitSuggestionSteps = ({
  instructions,
  compact = false,
}: TransitSuggestionStepsProps) => {
  if (instructions.length === 0) {
    return null;
  }

  return (
    <View testID="transit-suggestion-steps" style={tw`${compact ? 'mt-xs' : 'mt-s'}`}>
      <Text style={tw`mb-xs text-xs font-bold text-primary`}>Cómo llegar</Text>
      {instructions.map((instruction, index) => (
        <Text
          key={`${index}-${instruction}`}
          testID={`transit-suggestion-step-${index}`}
          style={tw`${compact ? 'text-xs' : 'text-sm'} mb-xs text-dark-gray`}
        >
          {index + 1}. {instruction}
        </Text>
      ))}
    </View>
  );
};

export default TransitSuggestionSteps;
