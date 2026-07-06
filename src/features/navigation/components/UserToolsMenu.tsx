import React, { useState } from 'react';
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
  onReportShadow?: () => Promise<void> | void;
  onLogout: () => void;
}

const NavigationIcon = Ionicons as React.ComponentType<NavigationIconProps>;

const UserToolsMenu = ({
  canReportShadow,
  isReportShadowDisabled = false,
  isReportingShadow = false,
  reportShadowLabel = 'Reportar sombra',
  onReportShadow,
  onLogout,
}: UserToolsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const profileKarma = useAuthStore((state) => state.user?.karma ?? 0);
  const earnedSessionKarma = useKarmaRewards((state) => state.karmaPoints);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const totalKarma = profileKarma + earnedSessionKarma;
  const primaryText = tw.color('primary') ?? '';
  const mutedText = tw.color('dark-gray') ?? '';
  const goldText = tw.color('secondary') ?? '#F9D84A';

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

  return (
    <View testID="user-tools-menu" style={tw`items-center justify-center`}>
      {isOpen ? (
        <View
          testID="user-tools-menu-panel"
          style={tw`absolute right-0 bottom-12 w-56 rounded-m border border-medium-gray bg-white dark:bg-slate p-s`}
        >
          <View
            testID="user-tools-karma"
            style={tw`mb-s min-h-11 flex-row items-center rounded-s px-s py-s bg-surface-light dark:bg-charcoal`}
          >
            <NavigationIcon name="star-outline" size={18} color={isDark ? goldText : primaryText} />
            <Text numberOfLines={1} style={tw`ml-s flex-1 font-bold text-primary dark:text-secondary`}>
              Karma
            </Text>
            <Text testID="user-tools-karma-points" numberOfLines={1} style={tw`font-bold text-primary dark:text-secondary`}>
              {totalKarma}
            </Text>
          </View>

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
              ]}
            >
              <NavigationIcon
                name="umbrella-outline"
                size={18}
                color={isReportShadowDisabled ? mutedText : isDark ? goldText : primaryText}
              />
              <Text
                numberOfLines={1}
                style={[
                  tw`ml-s font-bold`,
                  isReportShadowDisabled ? tw`text-dark-gray dark:text-light-gray` : tw`text-primary dark:text-secondary`,
                ]}
              >
                {isReportingShadow ? 'Guardando sombra' : reportShadowLabel}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            testID="user-tools-logout"
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesion"
            onPress={handleLogout}
            style={tw`mt-s min-h-11 flex-row items-center rounded-s px-s py-s bg-primary dark:bg-charcoal border dark:border-secondary`}
          >
            <NavigationIcon name="log-out-outline" size={18} color={isDark ? goldText : tw.color('white') ?? ''} />
            <Text numberOfLines={1} style={tw`ml-s font-bold text-white dark:text-secondary`}>
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
        <NavigationIcon name="people" size={20} color={isDark ? goldText : primaryText} />
      </Pressable>
    </View>
  );
};

export default UserToolsMenu;
