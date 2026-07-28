import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import { useKarmaRewards } from '@/features/navigation/hooks/useKarmaRewards';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';

interface NavigationIconProps {
  name: string;
  size: number;
  color: string;
}

interface UserToolsMenuProps {
  canReportShadow: boolean;
  isReportShadowDisabled?: boolean;
  isReportingShadow?: boolean;
  reportShadowLabel?: string;
  profileSections?: ReactNode;
  onOpenPublicTransport?: () => void;
  onReportShadow?: () => Promise<void> | void;
  onLogout: () => void;
}

const NavigationIcon = Ionicons as React.ComponentType<NavigationIconProps>;

const UserToolsMenu = ({
  canReportShadow,
  isReportShadowDisabled = false,
  isReportingShadow = false,
  reportShadowLabel = 'Reportar sombra',
  profileSections,
  onOpenPublicTransport,
  onReportShadow,
  onLogout,
}: UserToolsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const profileKarma = useAuthStore((state) => state.user?.karma ?? 0);
  const earnedSessionKarma = useKarmaRewards((state) => state.karmaPoints);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const totalKarma = profileKarma + earnedSessionKarma;
  const primaryText = tw.color('primary') ?? '#004574';
  const mutedText = tw.color('dark-gray') ?? '#333333';
  const goldText = tw.color('secondary') ?? '#F9D84A';
  const activeText = isDark ? goldText : primaryText;
  const reportText = isDark ? goldText : isReportShadowDisabled ? mutedText : primaryText;

  const handleReportShadow = async () => {
    if (!canReportShadow || isReportShadowDisabled) {
      return;
    }

    await onReportShadow?.();
    setIsOpen(false);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const handleOpenPublicTransport = () => {
    setIsOpen(false);
    onOpenPublicTransport?.();
  };

  return (
    <View testID="user-tools-menu" style={tw`items-center justify-center`}>
      {isOpen ? (
        <View
          testID="user-tools-menu-panel"
          style={tw`absolute right-0 bottom-12 w-72 rounded-m border border-medium-gray bg-white dark:bg-slate p-s`}
        >
          <View
            testID="user-tools-karma"
            style={tw`mb-s min-h-11 flex-row items-center rounded-s px-s py-s bg-surface-light dark:bg-charcoal`}
          >
            <NavigationIcon name="star-outline" size={18} color={activeText} />
            <Text numberOfLines={1} style={[tw`ml-s flex-1 font-bold`, { color: activeText }]}>
              Karma
            </Text>
            <Text testID="user-tools-karma-points" numberOfLines={1} style={[tw`font-bold`, { color: activeText }]}>
              {totalKarma}
            </Text>
          </View>

          {profileSections}

          {onOpenPublicTransport ? (
            <Pressable
              testID="public-transport-toggle"
              accessibilityRole="button"
              accessibilityLabel="Abrir transporte publico"
              onPress={handleOpenPublicTransport}
              style={tw`mb-s min-h-11 items-center justify-center rounded-s bg-primary px-s py-s`}
            >
              <Text numberOfLines={1} style={tw`font-bold text-white`}>
                Transporte público
              </Text>
            </Pressable>
          ) : null}

          {canReportShadow ? (
            <Pressable
              testID="user-tools-report-shadow"
              accessibilityRole="button"
              accessibilityLabel="Reportar sombra"
              disabled={isReportShadowDisabled}
              onPress={handleReportShadow}
              style={[
                tw`min-h-11 flex-row items-center rounded-s px-s py-s`,
                isReportShadowDisabled ? tw`bg-light-gray dark:bg-charcoal` : tw`bg-surface-light dark:bg-charcoal`,
                isDark && isReportShadowDisabled ? { opacity: 0.7 } : null,
              ]}
            >
              <NavigationIcon name="umbrella-outline" size={18} color={reportText} />
              <Text numberOfLines={1} style={[tw`ml-s font-bold`, { color: reportText }]}>
                {isReportingShadow ? 'Guardando sombra' : reportShadowLabel}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            testID="user-tools-logout"
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesion"
            onPress={handleLogout}
            style={tw`mt-s min-h-11 flex-row items-center rounded-s px-s py-s bg-primary dark:bg-primary border dark:border-secondary`}
          >
            <NavigationIcon name="log-out-outline" size={18} color={'#FFFFFF'} />
            <Text numberOfLines={1} style={tw`ml-s font-bold text-white`}>
              Cerrar Sesion
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        testID="user-tools-profile-button"
        accessibilityRole="button"
        accessibilityLabel="Abrir herramientas de perfil"
        onPress={() => setIsOpen((current) => !current)}
        style={tw`h-10 w-10 items-center justify-center`}
      >
        <NavigationIcon name="people" size={20} color={activeText} />
      </Pressable>
    </View>
  );
};

export default UserToolsMenu;
