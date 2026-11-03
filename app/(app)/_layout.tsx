import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth';
import { useProfile } from '../../src/features/profile';
import { Avatar, LoadingScreen, RoleBadge } from '../../src/components';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  touchTargets,
  useResponsive,
} from '../../src/theme';

export default function ProtectedAppLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarVisible, isPhone, isPhoneSm } = useResponsive();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Auth & profile loading guard - prevents any flash of protected content
  if (authLoading || (user && profileLoading && !profile)) {
    return <LoadingScreen message="Restoring authenticated workspace..." />;
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Redirect href="/login" />;
  }

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out of your HBPLUS corporate session?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: handleConfirmLogout,
          },
        ]
      );
    }
  };

  const isDashboardActive = pathname === '/' || pathname === '';
  const isProfileActive = pathname === '/profile';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.rootContainer, sidebarVisible && styles.desktopRow]}>
        {/* DESKTOP SIDEBAR NAVIGATION (>= 1024px) */}
        {sidebarVisible && (
          <View
            style={[styles.sidebar, shadows.subtle]}
            accessibilityRole="navigation"
            accessibilityLabel="Sidebar Navigation"
          >
            {/* Brand Logo */}
            <View style={styles.sidebarBrand}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandLogoText}>HB</Text>
                <View style={styles.plusContainer}>
                  <Text style={styles.plusSymbol}>+</Text>
                </View>
              </View>
              <View>
                <Text style={styles.brandTitle}>HBPLUS</Text>
                <Text style={styles.brandSubtitle}>Team Portal</Text>
              </View>
            </View>

            {/* User Profile Snapshot */}
            <View style={styles.sidebarUserCard}>
              <Avatar
                url={profile?.avatar_url || user.user_metadata?.avatar_url}
                name={profile?.full_name || user.user_metadata?.full_name}
                email={user.email}
                size={44}
              />
              <View style={styles.sidebarUserInfo}>
                <Text style={styles.sidebarUserName} numberOfLines={1}>
                  {profile?.full_name || 'HBPLUS Member'}
                </Text>
                <Text style={styles.sidebarUserEmail} numberOfLines={1}>
                  {user.email}
                </Text>
                <View style={styles.badgeWrapper}>
                  <RoleBadge role={profile?.role || 'user'} size="sm" />
                </View>
              </View>
            </View>

            {/* Nav Links */}
            <View style={styles.sidebarNav}>
              <Text style={styles.navSectionLabel}>NAVIGATION</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Navigate to Dashboard"
                accessibilityState={{ selected: isDashboardActive }}
                onPress={() => router.push('/')}
                style={[
                  styles.navItem,
                  isDashboardActive && styles.navItemActive,
                ]}
              >
                <Text style={styles.navIcon}>📊</Text>
                <Text
                  style={[
                    styles.navItemText,
                    isDashboardActive && styles.navItemTextActive,
                  ]}
                >
                  Dashboard
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Navigate to Profile and Account"
                accessibilityState={{ selected: isProfileActive }}
                onPress={() => router.push('/profile')}
                style={[
                  styles.navItem,
                  isProfileActive && styles.navItemActive,
                ]}
              >
                <Text style={styles.navIcon}>👤</Text>
                <Text
                  style={[
                    styles.navItemText,
                    isProfileActive && styles.navItemTextActive,
                  ]}
                >
                  Profile & Account
                </Text>
              </Pressable>
            </View>

            {/* Bottom Logout */}
            <View style={styles.sidebarFooter}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign out of HBPLUS"
                onPress={handleLogoutPress}
                disabled={isSigningOut}
                style={({ pressed }) => [
                  styles.sidebarLogoutBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color={colors.status.error} />
                ) : (
                  <>
                    <Text style={styles.logoutIcon}>🚪</Text>
                    <Text style={styles.sidebarLogoutText}>Sign Out</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* MOBILE & TABLET TOP NAVIGATION (< 1024px) */}
        {!sidebarVisible && (
          <View
            style={[styles.mobileNavContainer, shadows.subtle]}
            accessibilityRole="navigation"
            accessibilityLabel="Top Mobile Navigation"
          >
            {/* Row 1: Brand & User Identity & Logout */}
            <View style={styles.topHeader}>
              <View style={styles.topHeaderLeft}>
                <View style={styles.compactBrandBadge}>
                  <Text style={styles.compactBrandText}>HB</Text>
                  <Text style={styles.compactPlus}>+</Text>
                </View>
                <Text style={styles.compactAppTitle}>HBPLUS</Text>
              </View>

              <View style={styles.topHeaderRight}>
                <RoleBadge role={profile?.role || 'user'} size="sm" />
                <Pressable
                  onPress={handleLogoutPress}
                  disabled={isSigningOut}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out of HBPLUS"
                  style={styles.compactLogoutBtn}
                >
                  {isSigningOut ? (
                    <ActivityIndicator size="small" color={colors.status.error} />
                  ) : (
                    <Text style={styles.compactLogoutText}>Logout</Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Row 2: Segmented Tabs (Phone/Tablet) */}
            <View style={styles.tabBarContainer}>
              <Pressable
                onPress={() => router.push('/')}
                accessibilityRole="tab"
                accessibilityState={{ selected: isDashboardActive }}
                accessibilityLabel="Dashboard Tab"
                style={[
                  styles.tabBarButton,
                  isDashboardActive && styles.tabBarButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBarText,
                    isDashboardActive && styles.tabBarTextActive,
                  ]}
                >
                  📊 Dashboard
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/profile')}
                accessibilityRole="tab"
                accessibilityState={{ selected: isProfileActive }}
                accessibilityLabel="Profile Tab"
                style={[
                  styles.tabBarButton,
                  isProfileActive && styles.tabBarButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBarText,
                    isProfileActive && styles.tabBarTextActive,
                  ]}
                >
                  👤 Profile & Account
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* MAIN ROUTE CONTENT */}
        <View style={styles.contentArea} accessibilityRole="main">
          <Slot />
        </View>
      </View>

      {/* WEB LOGOUT CONFIRMATION MODAL */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, shadows.card]}>
            <Text style={styles.modalTitle}>Confirm Sign Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to end your HBPLUS corporate session?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel Sign Out"
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirm Sign Out"
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={handleConfirmLogout}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Sign Out</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  rootContainer: {
    flex: 1,
  },
  desktopRow: {
    flexDirection: 'row',
  },
  // Desktop Sidebar
  sidebar: {
    width: 260,
    backgroundColor: colors.background.card,
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  brandLogoText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  plusContainer: {
    marginLeft: 1,
  },
  plusSymbol: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.brand.highlight,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  brandSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  sidebarUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  sidebarUserInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  sidebarUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sidebarUserEmail: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  badgeWrapper: {
    marginTop: 4,
  },
  sidebarNav: {
    flex: 1,
  },
  navSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    minHeight: touchTargets.minHeight,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  navItemActive: {
    backgroundColor: colors.status.infoBg,
  },
  navIcon: {
    fontSize: 16,
    marginRight: spacing.sm + 2,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  navItemTextActive: {
    color: colors.brand.accent,
    fontWeight: '700',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
  },
  sidebarLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    backgroundColor: colors.status.errorBg,
    minHeight: touchTargets.minHeight,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  sidebarLogoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.status.error,
    marginLeft: spacing.sm,
  },
  logoutIcon: {
    fontSize: 14,
  },
  btnPressed: {
    opacity: 0.8,
  },
  // Mobile Navigation (< 1024px)
  mobileNavContainer: {
    backgroundColor: colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs + 2,
  },
  compactBrandText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  compactPlus: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.brand.highlight,
  },
  compactAppTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.primary,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactLogoutBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    backgroundColor: colors.status.errorBg,
    minHeight: touchTargets.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  compactLogoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.status.error,
  },
  // Mobile Tab Bar (Row 2)
  tabBarContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.elevated,
  },
  tabBarButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    minHeight: touchTargets.minHeight,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  tabBarButtonActive: {
    borderBottomColor: colors.brand.accent,
    backgroundColor: colors.background.card,
  },
  tabBarText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabBarTextActive: {
    color: colors.brand.accent,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalBtn: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minHeight: touchTargets.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  modalCancelBtn: {
    backgroundColor: colors.background.elevated,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modalConfirmBtn: {
    backgroundColor: colors.status.error,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
