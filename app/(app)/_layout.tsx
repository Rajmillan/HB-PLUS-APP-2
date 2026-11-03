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
  useWindowDimensions,
  View,
} from 'react-native';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth';
import { useProfile } from '../../src/features/profile';
import { Avatar, LoadingScreen, RoleBadge } from '../../src/components';
import { borderRadius, colors, shadows, spacing } from '../../src/theme';

export default function ProtectedAppLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, isAdmin } = useProfile();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Responsive breakpoints
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

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
      <View style={[styles.rootContainer, isDesktop && styles.desktopRow]}>
        {/* DESKTOP SIDEBAR NAVIGATION */}
        {isDesktop && (
          <View style={[styles.sidebar, shadows.subtle]}>
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
                accessibilityLabel="Go to Dashboard"
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
                accessibilityLabel="Go to Profile"
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
                accessibilityLabel="Sign out"
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

        {/* MOBILE & TABLET TOP HEADER */}
        {!isDesktop && (
          <View style={[styles.topHeader, shadows.subtle]}>
            <View style={styles.topHeaderLeft}>
              <View style={styles.compactBrandBadge}>
                <Text style={styles.compactBrandText}>HB</Text>
                <Text style={styles.compactPlus}>+</Text>
              </View>
              <Text style={styles.compactAppTitle}>HBPLUS</Text>
            </View>

            {/* Navigation Switcher Pills */}
            <View style={styles.navPillsRow}>
              <Pressable
                onPress={() => router.push('/')}
                style={[
                  styles.pillButton,
                  isDashboardActive && styles.pillButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.pillButtonText,
                    isDashboardActive && styles.pillButtonTextActive,
                  ]}
                >
                  Dashboard
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/profile')}
                style={[
                  styles.pillButton,
                  isProfileActive && styles.pillButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.pillButtonText,
                    isProfileActive && styles.pillButtonTextActive,
                  ]}
                >
                  Profile
                </Text>
              </Pressable>
            </View>

            {/* Top Right User & Logout */}
            <View style={styles.topHeaderRight}>
              <RoleBadge role={profile?.role || 'user'} size="sm" />
              <Pressable
                onPress={handleLogoutPress}
                disabled={isSigningOut}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                style={styles.compactLogoutBtn}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color={colors.text.secondary} />
                ) : (
                  <Text style={styles.compactLogoutText}>Logout</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* MAIN ROUTE CONTENT */}
        <View style={styles.contentArea}>
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
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.status.errorBorder,
    backgroundColor: colors.status.errorBg,
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
  // Mobile / Tablet Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
  navPillsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.full,
    padding: 3,
  },
  pillButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: borderRadius.full,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  pillButtonActive: {
    backgroundColor: colors.background.card,
    ...shadows.subtle,
  },
  pillButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  pillButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  compactLogoutBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.elevated,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  compactLogoutText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
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
