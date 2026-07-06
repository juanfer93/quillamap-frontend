import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useKarmaRewards } from '@/features/navigation/hooks/useKarmaRewards';

type IconProps = { name: string; size: number; color: string };
type Props = {
  canReportShadow: boolean;
  isReportShadowDisabled?: boolean;
  isReportingShadow?: boolean;
  reportShadowLabel?: string;
  onReportShadow?: () => Promise<void> | void;
  onLogout: () => void;
};

const Icon = Ionicons as React.ComponentType<IconProps>;
const GOLD = '#F8D84A';
const PANEL = '#151E2D';
const ROW = '#101622';

const UserToolsMenuDarkTheme = ({
  canReportShadow,
  isReportShadowDisabled = false,
  isReportingShadow = false,
  reportShadowLabel = 'Reportar sombra',
  onReportShadow,
  onLogout,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = useThemeStore((state) => state.mode === 'dark');
  const karma = useAuthStore((state) => state.user?.karma ?? 0) + useKarmaRewards((state) => state.karmaPoints);
  const primary = tw.color('primary') ?? '#004574';
  const active = isDark ? GOLD : primary;
  const row = isDark ? { backgroundColor: ROW } : tw`bg-surface-light`;
  const panel = isDark ? { backgroundColor: PANEL, borderColor: '#3B4D68' } : tw`bg-white border-medium-gray`;
  const exit = () => { setIsOpen(false); onLogout(); };
  const report = async () => {
    if (!canReportShadow || isReportShadowDisabled) return;
    await onReportShadow?.();
    setIsOpen(false);
  };

  return (
    <View testID="user-tools-menu" style={tw`items-center justify-center`}>
      {isOpen ? (
        <View testID="user-tools-menu-panel" style={[tw`absolute right-0 bottom-12 w-56 rounded-m border p-s`, panel]}>
          <View testID="user-tools-karma" style={[tw`mb-s min-h-11 flex-row items-center rounded-s px-s py-s`, row]}>
            <Icon name="star-outline" size={18} color={active} />
            <Text style={[tw`ml-s flex-1 font-bold`, { color: active }]}>Karma</Text>
            <Text testID="user-tools-karma-points" style={[tw`font-bold`, { color: active }]}>{karma}</Text>
          </View>
          {canReportShadow ? (
            <Pressable testID="user-tools-report-shadow" onPress={report} disabled={isReportShadowDisabled} style={[tw`min-h-11 flex-row items-center rounded-s px-s py-s`, row, isReportShadowDisabled && { opacity: 0.55 }]}>
              <Icon name="umbrella-outline" size={18} color={isReportShadowDisabled ? '#738199' : active} />
              <Text style={[tw`ml-s font-bold`, { color: isReportShadowDisabled ? '#738199' : active }]}>{isReportingShadow ? 'Guardando sombra' : reportShadowLabel}</Text>
            </Pressable>
          ) : null}
          <Pressable testID="user-tools-logout" onPress={exit} style={[tw`mt-s min-h-11 flex-row items-center rounded-s px-s py-s`, isDark ? { backgroundColor: ROW, borderWidth: 1, borderColor: GOLD } : tw`bg-primary`]}>
            <Icon name="log-out-outline" size={18} color={isDark ? GOLD : '#FFFFFF'} />
            <Text style={[tw`ml-s font-bold`, { color: isDark ? GOLD : '#FFFFFF' }]}>Cerrar Sesion</Text>
          </Pressable>
        </View>
      ) : null}
      <Pressable testID="user-tools-profile-button" onPress={() => setIsOpen((value) => !value)} style={tw`h-10 w-10 items-center justify-center`}>
        <Icon name="people" size={20} color={active} />
      </Pressable>
    </View>
  );
};

export default UserToolsMenuDarkTheme;
