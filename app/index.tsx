import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../src/features/auth';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
} from '../src/theme';

export default function ProtectedHomeScreen() {
  const { user, signOut, loading } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* Top Brand Bar */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandLogoText}>HB</Text>
                <View style={styles.plusContainer}>
                  <Text style={styles.plusSymbol}>+</Text>
                </View>
              </View>
              <View>
                <Text style={styles.appTitle}>HBPLUS</Text>
                <Text style={styles.appSubtitle}>Team Workspace</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              onPress={signOut}
              disabled={loading}
              style={({ pressed }) => [
                styles.topSignOutButton,
                pressed && styles.topSignOutButtonPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text.secondary} />
              ) : (
                <Text style={styles.topSignOutText}>Sign Out</Text>
              )}
            </Pressable>
          </View>

          {/* User Profile Card */}
          <View style={[styles.card, shadows.card]}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.userName}>
                  {user?.user_metadata?.full_name || 'HBPLUS Team Member'}
                </Text>
                <Text style={styles.userEmail}>{user?.email || '—'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Verification Badge */}
            <View style={styles.statusRow}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeIcon}>✓</Text>
                <Text style={styles.verifiedBadgeText}>Verified @hbplus.fit</Text>
              </View>
              <Text style={styles.providerLabel}>Google OAuth Verified</Text>
            </View>

            {/* Session Metadata */}
            <View style={styles.metadataSection}>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataKey}>User ID:</Text>
                <Text style={styles.metadataValue} numberOfLines={1}>
                  {user?.id || '—'}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataKey}>Email Verified At:</Text>
                <Text style={styles.metadataValue}>
                  {user?.email_confirmed_at
                    ? new Date(user.email_confirmed_at).toLocaleString()
                    : 'Via Google ID Token'}
                </Text>
              </View>
            </View>
          </View>

          {/* Phase 1 Verification Status Card */}
          <View style={[styles.card, shadows.card, styles.infoCard]}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoCardTitle}>
                Phase 1 Implementation Active
              </Text>
              <View style={styles.phasePill}>
                <Text style={styles.phasePillText}>PHASE 1 COMPLETE</Text>
              </View>
            </View>

            <View style={styles.checklist}>
              <View style={styles.checkItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checkText}>
                  Supabase Google OAuth cross-platform flow operational
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checkText}>
                  Domain policy strictly enforced for <Text style={styles.bold}>@hbplus.fit</Text>
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checkText}>
                  Unauthorized domains signed out & purged automatically
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checkText}>
                  Persistent session storage active (AsyncStorage / Web storage)
                </Text>
              </View>
            </View>

            <View style={styles.securityAlert}>
              <Text style={styles.securityAlertTitle}>🔒 Security Architecture Note</Text>
              <Text style={styles.securityAlertText}>
                Client-side domain validation controls user interface access. Database security must be backed by Supabase Row Level Security (RLS) policies implemented in Phase 2.
              </Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out of HBPLUS"
              onPress={signOut}
              disabled={loading}
              style={({ pressed }) => [
                styles.largeSignOutButton,
                pressed && styles.largeSignOutButtonPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Text style={styles.largeSignOutText}>Sign Out of HBPLUS</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 600,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  appTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  topSignOutButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  topSignOutButtonPressed: {
    backgroundColor: colors.background.elevated,
  },
  topSignOutText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successBg,
    borderColor: colors.status.successBorder,
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
  verifiedBadgeIcon: {
    color: colors.status.success,
    fontWeight: '800',
    marginRight: 4,
    fontSize: 12,
  },
  verifiedBadgeText: {
    color: colors.status.success,
    fontWeight: '600',
    fontSize: 12,
  },
  providerLabel: {
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: '500',
  },
  metadataSection: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs + 2,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataKey: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  metadataValue: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '500',
    maxWidth: '65%',
  },
  infoCard: {
    borderColor: colors.status.infoBorder,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  phasePill: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  phasePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  checklist: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkIcon: {
    color: colors.status.success,
    fontWeight: '800',
    marginRight: spacing.sm,
    fontSize: 14,
  },
  checkText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    flex: 1,
  },
  bold: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  securityAlert: {
    backgroundColor: colors.status.warningBg,
    borderColor: colors.status.warningBorder,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  securityAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.status.warning,
    marginBottom: 2,
  },
  securityAlertText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  actionContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  largeSignOutButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  largeSignOutButtonPressed: {
    opacity: 0.85,
  },
  largeSignOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
