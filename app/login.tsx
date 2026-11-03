import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../src/features/auth';
import { isAllowedEmail } from '../src/features/auth/domainPolicy';
import { DOMAIN_RESTRICTION_MESSAGE } from '../src/constants/config';
import { ErrorBanner, GoogleSignInButton } from '../src/components';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  touchTargets,
  useResponsive,
} from '../src/theme';

export default function LoginScreen() {
  const {
    signInWithGoogle,
    signInWithEmail,
    sendLoginLink,
    isSigningIn,
    error,
    clearError,
  } = useAuth();
  const { isPhoneSm } = useResponsive();

  // Mode: 'password' | 'magic-link'
  const [authMode, setAuthMode] = useState<'password' | 'magic-link'>('password');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);

  const activeError = localError || error;

  const handleClearErrors = () => {
    setLocalError(null);
    clearError();
  };

  const handleEmailPasswordSubmit = async () => {
    handleClearErrors();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setLocalError('Please enter your official @hbplus.fit email.');
      return;
    }

    if (!isAllowedEmail(trimmedEmail)) {
      setLocalError(DOMAIN_RESTRICTION_MESSAGE);
      return;
    }

    if (!password) {
      setLocalError('Please enter your account password.');
      return;
    }

    await signInWithEmail(trimmedEmail, password);
  };

  const handleMagicLinkSubmit = async () => {
    handleClearErrors();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setLocalError('Please enter your official @hbplus.fit email.');
      return;
    }

    if (!isAllowedEmail(trimmedEmail)) {
      setLocalError(DOMAIN_RESTRICTION_MESSAGE);
      return;
    }

    setIsSendingMagicLink(true);
    try {
      const res = await sendLoginLink(trimmedEmail);
      if (res.success) {
        setMagicLinkSent(true);
      }
    } finally {
      setIsSendingMagicLink(false);
    }
  };

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
                  <Text style={styles.noticeTitle}>Restricted Domain Access</Text>
                </View>
                <Text style={styles.noticeDescription}>
                  Corporate access is restricted to verified accounts ending in{' '}
                  <Text style={styles.noticeHighlight}>@hbplus.fit</Text>. All other domains are rejected.
                </Text>
              </View>

              {/* Error Display */}
              {Boolean(activeError) && (
                <View style={styles.errorWrapper}>
                  <ErrorBanner
                    message={activeError}
                    onDismiss={handleClearErrors}
                    type="error"
                  />
                </View>
              )}

              {/* Success Banner for Magic Link */}
              {magicLinkSent && (
                <View style={styles.successBanner} accessibilityRole="alert">
                  <Text style={styles.successIcon}>✓</Text>
                  <View style={styles.successTextContainer}>
                    <Text style={styles.successTitle}>Login Link Sent!</Text>
                    <Text style={styles.successBody}>
                      Check your inbox at <Text style={styles.boldText}>{email.trim()}</Text> for your single-click sign in link.
                    </Text>
                  </View>
                </View>
              )}

              {/* OPTION 1: MANUAL EMAIL LOGIN */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>
                  {authMode === 'password'
                    ? 'Sign In with Email & Password'
                    : 'Sign In via Passwordless Magic Link'}
                </Text>

                {/* Email Input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Official Email Address</Text>
                  <TextInput
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (activeError) handleClearErrors();
                    }}
                    placeholder="user@hbplus.fit"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSigningIn && !isSendingMagicLink}
                    style={styles.textInput}
                    accessibilityLabel="Corporate Email Address"
                  />
                </View>

                {/* Password Input (only in password mode) */}
                {authMode === 'password' && (
                  <View style={styles.fieldGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.fieldLabel}>Password</Text>
                      <Pressable
                        onPress={() => {
                          setAuthMode('magic-link');
                          handleClearErrors();
                        }}
                        style={styles.subtleLink}
                        accessibilityRole="button"
                        accessibilityLabel="Switch to passwordless login link"
                      >
                        <Text style={styles.subtleLinkText}>Need login link?</Text>
                      </Pressable>
                    </View>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        value={password}
                        onChangeText={(val) => {
                          setPassword(val);
                          if (activeError) handleClearErrors();
                        }}
                        placeholder="••••••••••••"
                        placeholderTextColor={colors.text.muted}
                        secureTextEntry={!showPassword}
                        editable={!isSigningIn}
                        style={[styles.textInput, styles.passwordInput]}
                        accessibilityLabel="Account Password"
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeToggleBtn}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Submit Action for Email */}
                {authMode === 'password' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Sign in with email and password"
                    onPress={handleEmailPasswordSubmit}
                    disabled={isSigningIn || !email.trim() || !password}
                    style={({ pressed }) => [
                      styles.emailSubmitBtn,
                      pressed && styles.btnPressed,
                      (isSigningIn || !email.trim() || !password) && styles.btnDisabled,
                    ]}
                  >
                    {isSigningIn ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.emailSubmitText}>Sign In with Email</Text>
                    )}
                  </Pressable>
                ) : (
                  <View style={styles.magicLinkActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Send magic sign-in link"
                      onPress={handleMagicLinkSubmit}
                      disabled={isSendingMagicLink || !email.trim()}
                      style={({ pressed }) => [
                        styles.emailSubmitBtn,
                        pressed && styles.btnPressed,
                        (isSendingMagicLink || !email.trim()) && styles.btnDisabled,
                      ]}
                    >
                      {isSendingMagicLink ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.emailSubmitText}>Send Magic Sign-In Link</Text>
                      )}
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setAuthMode('password');
                        handleClearErrors();
                      }}
                      style={styles.switchModeBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Switch back to password sign in"
                    >
                      <Text style={styles.switchModeText}>← Back to Password Login</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* DIVIDER: OR CONTINUE WITH GOOGLE */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* OPTION 2: GOOGLE OAUTH CTA */}
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
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
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
    marginBottom: spacing.sm,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.status.successBg,
    borderColor: colors.status.successBorder,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.status.success,
    marginRight: spacing.sm,
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.status.success,
    marginBottom: 2,
  },
  successBody: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  // Form Section
  formSection: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subtleLink: {
    minHeight: touchTargets.minHeight - 16,
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  subtleLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand.accent,
  },
  textInput: {
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    minHeight: touchTargets.minHeight,
    fontSize: 14,
    color: colors.text.primary,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeToggleBtn: {
    position: 'absolute',
    right: 0,
    height: '100%',
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  eyeIcon: {
    fontSize: 16,
  },
  emailSubmitBtn: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.xs,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  emailSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  magicLinkActions: {
    gap: spacing.sm,
  },
  switchModeBtn: {
    minHeight: touchTargets.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand.accent,
  },
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
    marginHorizontal: spacing.md,
    letterSpacing: 0.8,
  },
  // Google CTA
  actionSection: {
    marginBottom: spacing.xs,
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
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
