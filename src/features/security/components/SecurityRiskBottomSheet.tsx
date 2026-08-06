import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import type { MapIconProps } from '@/components/maps/QuillaMap.icon.types';
import {
  DEFAULT_SECURITY_RISK_LABELS,
  type SecurityHeatmapPointContract,
  type SecurityRiskLevel,
} from '@/types/contracts/security.contract';

interface SecurityRiskBottomSheetProps {
  point: SecurityHeatmapPointContract;
  riskLabels?: Partial<Record<SecurityRiskLevel, string>>;
  onClose: () => void;
  themeMode?: 'light' | 'dark';
}

const SheetIcon = Ionicons as React.ComponentType<MapIconProps>;

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

const SecurityRiskBottomSheet = ({
  point,
  riskLabels,
  onClose,
  themeMode = 'light',
}: SecurityRiskBottomSheetProps) => {
  const isDark = themeMode === 'dark';
  const primary = tw.color('primary') ?? '#004574';
  const white = tw.color('white') ?? '#FFFFFF';
  const sheetBackground = isDark ? '#111B2A' : white;
  const mutedText = isDark ? '#CBD5E1' : tw.color('dark-gray') ?? '#333333';
  const titleColor = primary;
  const labels = { ...DEFAULT_SECURITY_RISK_LABELS, ...riskLabels };

  return (
    <View
      testID="security-risk-bottom-sheet"
      style={[
        tw`absolute left-0 right-0 border-t px-m pt-m pb-m`,
        {
          backgroundColor: sheetBackground,
          borderTopColor: primary,
          bottom: 64,
          maxHeight: '45%',
          zIndex: 35,
          shadowColor: primary,
          shadowOpacity: 0.2,
          shadowRadius: 18,
          elevation: 18,
        },
      ]}
    >
      <View style={tw`flex-row items-start justify-between`}>
        <View style={tw`flex-1 pr-m`}>
          <Text testID="security-risk-title" style={[tw`text-xl font-bold`, { color: titleColor }]}>
            Nivel de Riesgo de la Zona
          </Text>
          <Text testID="security-risk-level" style={[tw`mt-xs text-lg font-bold`, { color: titleColor }]}>
            {labels[point.riskLevel]}
          </Text>
        </View>
        <Pressable
          testID="security-risk-close"
          accessibilityRole="button"
          accessibilityLabel="Cerrar riesgo de seguridad"
          onPress={onClose}
          style={[tw`w-10 h-10 rounded-m items-center justify-center`, { backgroundColor: primary }]}
        >
          <SheetIcon name="close" size={20} color={white} />
        </Pressable>
      </View>

      <View style={tw`mt-m flex-row flex-wrap`}>
        <View style={tw`mr-s mb-s rounded-s bg-surface-light dark:bg-charcoal px-s py-s`}>
          <Text style={[tw`font-bold`, { color: primary }]}>Intensidad</Text>
          <Text testID="security-risk-intensity" style={[tw`mt-xs`, { color: mutedText }]}>
            {formatPercent(point.intensity)}
          </Text>
        </View>
        <View style={tw`mr-s mb-s rounded-s bg-surface-light dark:bg-charcoal px-s py-s`}>
          <Text style={[tw`font-bold`, { color: primary }]}>Veracidad</Text>
          <Text testID="security-risk-veracity" style={[tw`mt-xs`, { color: mutedText }]}>
            {formatPercent(point.veracityScore)}
          </Text>
        </View>
        <View style={tw`mr-s mb-s rounded-s bg-surface-light dark:bg-charcoal px-s py-s`}>
          <Text style={[tw`font-bold`, { color: primary }]}>Reportes</Text>
          <Text testID="security-risk-report-count" style={[tw`mt-xs`, { color: mutedText }]}>
            {point.reportCount}
          </Text>
        </View>
      </View>

      {point.hasVerifiedEvidence ? (
        <Text testID="security-risk-evidence-label" style={[tw`mt-xs`, { color: mutedText }]}>
          Reporte respaldado con evidencia de la comunidad.
        </Text>
      ) : null}
    </View>
  );
};

export default SecurityRiskBottomSheet;
