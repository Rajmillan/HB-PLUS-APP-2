import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth';
import { useProfile } from '../../src/features/profile';
import { Avatar, ErrorBanner, RoleBadge } from '../../src/components';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  touchTargets,
  useResponsive,
} from '../../src/theme';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { profile, updateProfileName } = useProfile();
  const router = useRouter();
  const { isPhoneSm, maxContentWidth, contentPadding } = useResponsive();

  const [fullName, setFullName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveName = async () => {
    if (!fullName.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await updateProfileName(fullName.trim());
      if (res.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { padding: contentPadding },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.container, { maxWidth: Math.min(maxContentWidth, 760) }]}>
        {/* Navigation Breadcrumb */}
        <View style={styles.breadcrumbRow}>
          <Pressable
            onPress={() => router.push('/')}
            accessibilityRole="button"
            accessibilityLabel="Return to Dashboard"
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Dashboard</Text>
          </Pressable>
          <Text style={styles.breadcrumbSeparator}>/</Text>
          <Text style={styles.breadcrumbCurrent}>Profile & Account</Text>
        </View>

        <Text accessibilityRole="header" style={styles.pageTitle}>
          Account Profile
        </Text>
        <Text style={styles.pageSubtitle}>
          Manage your verified corporate identity and personal preferences.
        </Text>

        {/* Profile Card */}
        <View style={[styles.card, shadows.card, isPhoneSm && styles.cardSm]}>
          <View
            style={[
              styles.cardTopRow,
              isPhoneSm && styles.cardTopRowStacked,
            ]}
          >
            <Avatar
              url={profile?.avatar_url || user?.user_metadata?.avatar_url}
              name={profile?.full_name || user?.user_metadata?.full_name}
              email={user?.email}
              size={isPhoneSm ? 52 : 64}
            />
            <View
              style={[
                styles.cardTopDetails,
                isPhoneSm && styles.cardTopDetailsStacked,
              ]}
            >
              <Text style={styles.displayName} numberOfLines={1}>
                {profile?.full_name || 'HBPLUS Team Member'}
              </Text>
              <Text style={styles.emailText} numberOfLines={1}>
                {user?.email}
              </Text>
              <View style={styles.badgeRow}>
                <RoleBadge role={profile?.role || 'user'} size="sm" />
                <View style={styles.domainPill}>
                  <Text style={styles.domainPillText}>Verified @hbplus.fit</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Edit Display Name Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionHeading}>Profile Information</Text>

            {Boolean(saveError) && (
              <ErrorBanner
                message={saveError}
                onDismiss={() => setSaveError(null)}
              />
            )}

            {saveSuccess && (
              <View style={styles.successBanner} accessibilityRole="alert">
                <Text style={styles.successText}>
                  ✓ Display name updated successfully in public.profiles!
                </Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Display Name</Text>
              <View style={[styles.inputRow, isPhoneSm && styles.inputRowStacked]}>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.text.muted}
                  style={styles.textInput}
                  accessibilityLabel="Full Display Name Input"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save updated profile name"
                  onPress={handleSaveName}
                  disabled={isSaving || !fullName.trim()}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    pressed && styles.btnPressed,
                    (!fullName.trim() || isSaving) && styles.btnDisabled,
                    isPhoneSm && styles.saveBtnFull,
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </Pressable>
              </View>
              <Text style={styles.fieldHint}>
                This name is stored in your database profile and displayed in team
                dashboards.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Corporate Email (Immutable)</Text>
              <View style={styles.disabledInputBox}>
                <Text style={styles.disabledInputText} numberOfLines={1}>
                  {user?.email}
                </Text>
                <Text style={styles.lockBadge}>🔒 OAuth Bound</Text>
              </View>
              <Text style={styles.fieldHint}>
                Corporate email is anchored to your authenticated Google account and
                cannot be edited.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Assigned Role (Server Managed)</Text>
              <View style={styles.disabledInputBox}>
                <RoleBadge role={profile?.role || 'user'} size="sm" />
                <Text style={styles.lockBadge}>🔒 RLS Enforced</Text>
              </View>
              <Text style={styles.fieldHint}>
                Role escalation is strictly prohibited by PostgreSQL database triggers
                and RLS policies. Only service-role administrators can modify roles.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Account Metadata */}
          <View style={styles.metadataSection}>
            <Text style={styles.sectionHeading}>System Identifiers</Text>
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>User UUID</Text>
                <Text style={styles.metaVal} numberOfLines={1}>
                  {user?.id || '—'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>Profile Created</Text>
                <Text style={styles.metaVal}>
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleString()
                    : '—'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>Auth Provider</Text>
                <Text style={styles.metaVal}>Google OAuth (Supabase)</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>RLS Status</Text>
                <Text style={styles.metaVal}>Enforced (Self-only read/write)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security Policy Information Card */}
        <View style={[styles.card, shadows.card, styles.securityCard]}>
          <Text style={styles.securityTitle}>
            🛡️ Security & Role Assignment Notice
          </Text>
          <Text style={styles.securityBody}>
            Under HBPLUS access architecture, user roles (<Text style={styles.boldText}>user</Text> or <Text style={styles.boldText}>admin</Text>) cannot be assigned or changed through the client application or user metadata. All attempts by regular users to modify the <Text style={styles.codeText}>role</Text> column are rejected by database triggers and Row Level Security policies.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    width: '100%',
    alignSelf: 'center',
    gap: spacing.md,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    minHeight: touchTargets.minHeight,
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand.accent,
  },
  breadcrumbSeparator: {
    fontSize: 13,
    color: colors.text.muted,
  },
  breadcrumbCurrent: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: -4,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardSm: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTopRowStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  cardTopDetails: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  cardTopDetailsStacked: {
    marginLeft: 0,
    width: '100%',
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emailText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  domainPill: {
    backgroundColor: colors.status.successBg,
    borderColor: colors.status.successBorder,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  domainPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.status.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.lg,
  },
  formSection: {
    gap: spacing.md,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputRowStacked: {
    flexDirection: 'column',
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: touchTargets.minHeight,
    fontSize: 14,
    color: colors.text.primary,
  },
  saveBtn: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    minHeight: touchTargets.minHeight,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  saveBtnFull: {
    width: '100%',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.text.muted,
    lineHeight: 16,
  },
  disabledInputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: touchTargets.minHeight,
  },
  disabledInputText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing.sm,
  },
  lockBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  successBanner: {
    backgroundColor: colors.status.successBg,
    borderColor: colors.status.successBorder,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.status.success,
  },
  // Metadata Section
  metadataSection: {
    gap: spacing.sm,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flex: 1,
    minWidth: 160,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.sm,
    padding: spacing.sm + 2,
  },
  metaKey: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 2,
  },
  // Security Notice Card
  securityCard: {
    backgroundColor: colors.status.infoBg,
    borderColor: colors.status.infoBorder,
    borderWidth: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.brand,
    marginBottom: spacing.xs,
  },
  securityBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: colors.brand.accent,
  },
});
