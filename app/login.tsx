import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../src/features/auth';
import { ErrorBanner, GoogleSignInButton } from '../src/components';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  useResponsive,
} from '../src/theme';

export default function LoginScreen() {
  const { signInWithGoogle, isSigningIn, error, clearError } = useAuth();
  const { isPhoneSm } = useResponsive();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isPhoneSm && styles.scrollContentSm,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.cardWrapper}>
            <View
              style={[
                styles.card,
                shadows.card,
                isPhoneSm && styles.cardSm,
              ]}
              accessibilityRole="main"
            >
              {/* Brand Header */}
              <View style={styles.header}>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandLogoText}>HB</Text>
                  <View style={styles.plusContainer}>
                    <Text style={styles.plusSymbol}>+</Text>
                  </View>
                </View>
                <Text
                  accessibilityRole="header"
                  style={[styles.brandTitle, isPhoneSm && styles.brandTitleSm]}
                >
                  HBPLUS
                </Text>
                <Text style={styles.brandSubtitle}>
                  Enterprise Performance & Team Portal
                </Text>
              </View>

              {/* Concise Domain Policy Notice */}
              <View
                style={styles.domainNoticeContainer}
                accessibilityRole="alert"
                accessibilityLabel="Restricted corporate access notice"
              >
                <View style={styles.noticeHeaderRow}>
                  <Text style={styles.noticeIcon}>🔒</Text>
                  <Text style={styles.noticeTitle}>Restricted Access</Text>
                </View>
                <Text style={styles.noticeDescription}>
                  Sign in is strictly restricted to verified corporate Google accounts ending in{' '}
                  <Text style={styles.noticeHighlight}>@hbplus.fit</Text>. All other domains will be rejected immediately.
                </Text>
              </View>

              {/* Error Display */}
              {Boolean(error) && (
                <View style={styles.errorWrapper}>
                  <ErrorBanner
                    message={error}
                    onDismiss={clearError}
                    type="error"
                  />
                </View>
              )}

              {/* Google Sign-In Action */}
              <View style={styles.actionSection}>
                <GoogleSignInButton
                  onPress={signInWithGoogle}
                  loading={isSigningIn}
                  title="Sign in with Google"
                />
              </View>

              {/* Security Compliance Footnote */}
              <Text style={styles.complianceFootnote}>
                By connecting, you confirm compliance with HBPLUS corporate information security and data protection policies.
              </Text>
            </View>

            {/* Application Meta Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                HBPLUS Inc. • Identity & Access Management
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: '100%',
  },
  scrollContentSm: {
    padding: spacing.sm,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...Platform.select({
      web: {
        maxWidth: 440,
      },
    }),
  },
  cardSm: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  brandLogoText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: 1.5,
  },
  plusContainer: {
    marginLeft: 2,
  },
  plusSymbol: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.brand.highlight,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  brandTitleSm: {
    fontSize: 20,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  domainNoticeContainer: {
    backgroundColor: colors.status.infoBg,
    borderColor: colors.status.infoBorder,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  noticeIcon: {
    fontSize: 14,
    marginRight: spacing.xs + 2,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noticeDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  noticeHighlight: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  errorWrapper: {
    marginBottom: spacing.md,
  },
  actionSection: {
    marginVertical: spacing.sm,
  },
  complianceFootnote: {
    marginTop: spacing.lg,
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.muted,
    textAlign: 'center',
  },
  footerContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: '500',
  },
});
