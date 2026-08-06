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
  canReportSecurity?: boolean;
  isReportShadowDisabled?: boolean;
  isReportSecurityDisabled?: boolean;
  isReportingShadow?: boolean;
  isReportingSecurity?: boolean;
  reportShadowLabel?: string;
  reportSecurityLabel?: string;
  profileSections?: ReactNode;
  isSecurityMapEnabled?: boolean;
  isSecurityMapLoading?: boolean;
  onOpenPublicTransport?: () => void;
  onOpenThermalComfortRouteSearch?: () => void;
  onToggleSecurityMap?: () => void;
  onReportShadow?: () => Promise<void> | void;
  onReportSecurity?: () => Promise<void> | void;
  onLogout: () => void;
}

const NavigationIcon = Ionicons as React.ComponentType<NavigationIconProps>;

const UserToolsMenu = ({
  canReportShadow,
  canReportSecurity = false,
  isReportShadowDisabled = false,
  isReportSecurityDisabled = false,
  isReportingShadow = false,
  isReportingSecurity = false,
  reportShadowLabel = 'Reportar sombra',
  reportSecurityLabel = 'Reportar zona peligrosa',
  profileSections,
  isSecurityMapEnabled = false,
  isSecurityMapLoading = false,
  onOpenPublicTransport,
  onOpenThermalComfortRouteSearch,
  onToggleSecurityMap,
  onReportShadow,
  onReportSecurity,
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
  const securityReportText = isDark ? goldText : isReportSecurityDisabled ? mutedText : primaryText;

  const handleReportShadow = async () => {
    if (!canReportShadow || isReportShadowDisabled) {
      return;
    }

    await onReportShadow?.();
    setIsOpen(false);
  };

  const handleReportSecurity = async () => {
    if (!canReportSecurity || isReportSecurityDisabled) {
      return;
    }

    await onReportSecurity?.();
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

  const handleOpenThermalComfortRouteSearch = () => {
    setIsOpen(false);
    onOpenThermalComfortRouteSearch?.();
  };

  const handleToggleSecurityMap = () => {
    onToggleSecurityMap?.();
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

          {onToggleSecurityMap ? (
            <Pressable
              testID="security-map-toggle"
              accessibilityRole="switch"
              accessibilityState={{ checked: isSecurityMapEnabled, busy: isSecurityMapLoading }}
              accessibilityLabel="Mapa de Seguridad"
              onPress={handleToggleSecurityMap}
              style={tw`mb-s min-h-11 flex-row items-center rounded-s bg-primary px-s py-s`}
            >
              <NavigationIcon name="shield-checkmark-outline" size={18} color={'#FFFFFF'} />
              <Text numberOfLines={1} style={tw`ml-s flex-1 font-bold text-white`}>
                {isSecurityMapEnabled ? 'Ocultar Mapa de Seguridad' : 'Mapa de Seguridad'}
              </Text>
              {isSecurityMapLoading ? (
                <Text testID="security-map-loading" style={tw`ml-s text-white`}>
                  ...
                </Text>
              ) : null}
            </Pressable>
          ) : null}

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

          {onOpenThermalComfortRouteSearch ? (
            <Pressable
              testID="thermal-comfort-route-search-toggle"
              accessibilityRole="button"
              accessibilityLabel="Buscar ruta fresca"
              onPress={handleOpenThermalComfortRouteSearch}
              style={tw`mb-s min-h-11 flex-row items-center rounded-s bg-surface-light dark:bg-charcoal px-s py-s`}
            >
              <NavigationIcon name="leaf-outline" size={18} color={activeText} />
              <Text numberOfLines={1} style={[tw`ml-s font-bold`, { color: activeText }]}>
                Buscar ruta fresca
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

          {canReportSecurity ? (
            <Pressable
              testID="user-tools-report-security"
              accessibilityRole="button"
              accessibilityLabel="Reportar zona peligrosa"
              disabled={isReportSecurityDisabled}
              onPress={handleReportSecurity}
              style={[
                tw`mt-s min-h-11 flex-row items-center rounded-s px-s py-s`,
                isReportSecurityDisabled ? tw`bg-light-gray dark:bg-charcoal` : tw`bg-surface-light dark:bg-charcoal`,
                isDark && isReportSecurityDisabled ? { opacity: 0.7 } : null,
              ]}
            >
              <NavigationIcon name="warning-outline" size={18} color={securityReportText} />
              <Text numberOfLines={1} style={[tw`ml-s font-bold`, { color: securityReportText }]}>
                {isReportingSecurity ? 'Guardando zona' : reportSecurityLabel}
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
