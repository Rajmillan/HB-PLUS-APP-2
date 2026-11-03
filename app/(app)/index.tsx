import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth';
import {
  getAdminAnnouncements,
  postAdminAnnouncement,
  useProfile,
} from '../../src/features/profile';
import type { AdminAnnouncement } from '../../src/features/profile/types';
import { Avatar, ErrorBanner, RoleBadge } from '../../src/components';
import { borderRadius, colors, shadows, spacing } from '../../src/theme';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { profile, isAdmin, loading: profileLoading } = useProfile();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Responsive breakpoints
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  // Admin capability state
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  // New announcement inputs
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Fetch admin announcements if user is verified as admin
  useEffect(() => {
    if (isAdmin) {
      loadAnnouncements();
    }
  }, [isAdmin]);

  const loadAnnouncements = async () => {
    setAnnouncementsLoading(true);
    setAnnouncementError(null);
    try {
      const res = await getAdminAnnouncements();
      if (res.error) {
        setAnnouncementError(res.error);
      } else {
        setAnnouncements(res.data || []);
      }
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsPosting(true);
    setAnnouncementError(null);
    setPostSuccess(false);

    try {
      const res = await postAdminAnnouncement(newTitle, newContent, 'standard');
      if (res.error) {
        setAnnouncementError(res.error);
      } else {
        setNewTitle('');
        setNewContent('');
        setPostSuccess(true);
        await loadAnnouncements();
        setTimeout(() => setPostSuccess(false), 4000);
      }
    } finally {
      setIsPosting(false);
    }
  };

  const greetingName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Team Member';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        isDesktop && styles.desktopScrollPadding,
      ]}
    >
      <View style={styles.container}>
        {/* Welcome Greeting Header */}
        <View style={styles.greetingHeader}>
          <View style={styles.greetingTextColumn}>
            <Text style={styles.greetingTitle}>Welcome back, {greetingName}</Text>
            <Text style={styles.greetingSubtitle}>
              Corporate Workspace for{' '}
              <Text style={styles.boldText}>{user?.email}</Text>
            </Text>
          </View>
          <View style={styles.greetingBadgeRow}>
            <RoleBadge role={profile?.role || 'user'} size="md" />
            <View style={styles.verifiedDomainPill}>
              <Text style={styles.verifiedDomainIcon}>✓</Text>
              <Text style={styles.verifiedDomainText}>@hbplus.fit</Text>
            </View>
          </View>
        </View>

        {/* Responsive Grid of Overview Cards */}
        <View style={[styles.grid, (isDesktop || isTablet) && styles.gridRow]}>
          {/* 1. Profile & Account Overview Card */}
          <View
            style={[
              styles.card,
              shadows.card,
              (isDesktop || isTablet) && styles.gridCol,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>Account Profile</Text>
              <Pressable
                onPress={() => router.push('/profile')}
                style={styles.cardActionLink}
              >
                <Text style={styles.cardActionLinkText}>Edit Name →</Text>
              </Pressable>
            </View>

            <View style={styles.profileSummaryRow}>
              <Avatar
                url={profile?.avatar_url || user?.user_metadata?.avatar_url}
                name={profile?.full_name || user?.user_metadata?.full_name}
                email={user?.email}
                size={52}
              />
              <View style={styles.profileDetails}>
                <Text style={styles.profileFullName}>{greetingName}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <Text style={styles.profileCreatedAt}>
                  Provisioned:{' '}
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : 'Active'}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Assigned Role:</Text>
              <RoleBadge role={profile?.role || 'user'} size="sm" />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Role Immutability:</Text>
              <Text style={styles.metaValue}>Enforced by PostgreSQL RLS</Text>
            </View>
          </View>

          {/* 2. Security & RLS Architecture Card */}
          <View
            style={[
              styles.card,
              shadows.card,
              (isDesktop || isTablet) && styles.gridCol,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>
                Phase 2 RLS Security Boundary
              </Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.checklist}>
              <View style={styles.checkItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checkText}>
                  <Text style={styles.boldText}>Database RLS Enabled</Text> on{' '}
                  <Text style={styles.codeText}>public.profiles</Text>
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checkText}>
                  Role escalation blocked by trigger + RLS WITH CHECK
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checkText}>
                  Automatic profile provisioned via{' '}
                  <Text style={styles.codeText}>auth.users</Text> trigger
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checkText}>
                  Exact <Text style={styles.codeText}>@hbplus.fit</Text> domain
                  checked server-side
                </Text>
              </View>
            </View>

            <View style={styles.infoNoteBox}>
              <Text style={styles.infoNoteText}>
                🛡️ Database queries are constrained to auth.uid() = id. Client-side
                route tampering cannot bypass server RLS.
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Admin Capability Panel (Secured by RLS) */}
        <View style={[styles.card, shadows.card, styles.adminCard]}>
          <View style={styles.adminCardHeader}>
            <View style={styles.adminTitleRow}>
              <Text style={styles.adminBadgeIcon}>🛡️</Text>
              <Text style={styles.cardHeaderTitle}>
                {isAdmin
                  ? 'Administrator Management Panel'
                  : 'Administrator Resource (RLS Protected)'}
              </Text>
            </View>
            <RoleBadge role={profile?.role || 'user'} size="sm" />
          </View>

          {isAdmin ? (
            /* ADMIN VIEW: Server Verified Admin */
            <View style={styles.adminContent}>
              <Text style={styles.adminDescription}>
                You have verified <Text style={styles.boldText}>admin</Text> privileges
                backed by database table records. You are authorized to read and publish
                announcements stored in{' '}
                <Text style={styles.codeText}>public.admin_announcements</Text>.
              </Text>

              {/* Publish Announcement Form */}
              <View style={styles.publishBox}>
                <Text style={styles.publishBoxTitle}>
                  Publish Corporate Announcement
                </Text>

                {Boolean(announcementError) && (
                  <ErrorBanner
                    message={announcementError}
                    onDismiss={() => setAnnouncementError(null)}
                  />
                )}

                {postSuccess && (
                  <View style={styles.successBanner}>
                    <Text style={styles.successBannerText}>
                      ✓ Announcement published successfully via server RLS.
                    </Text>
                  </View>
                )}

                <TextInput
                  placeholder="Announcement Title..."
                  placeholderTextColor={colors.text.muted}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  style={styles.textInput}
                />
                <TextInput
                  placeholder="Announcement Content..."
                  placeholderTextColor={colors.text.muted}
                  value={newContent}
                  onChangeText={setNewContent}
                  multiline
                  numberOfLines={3}
                  style={[styles.textInput, styles.textArea]}
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Publish announcement"
                  onPress={handleCreateAnnouncement}
                  disabled={isPosting || !newTitle.trim() || !newContent.trim()}
                  style={({ pressed }) => [
                    styles.publishBtn,
                    pressed && styles.btnPressed,
                    (!newTitle.trim() || !newContent.trim()) && styles.btnDisabled,
                  ]}
                >
                  {isPosting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.publishBtnText}>
                      Publish to Team (Admin RLS)
                    </Text>
                  )}
                </Pressable>
              </View>

              {/* Announcements Feed */}
              <View style={styles.announcementsFeed}>
                <View style={styles.feedHeaderRow}>
                  <Text style={styles.feedHeaderTitle}>
                    Active Announcements ({announcements.length})
                  </Text>
                  <Pressable
                    onPress={loadAnnouncements}
                    disabled={announcementsLoading}
                  >
                    <Text style={styles.refreshLink}>
                      {announcementsLoading ? 'Refreshing...' : '↻ Refresh'}
                    </Text>
                  </Pressable>
                </View>

                {announcementsLoading && announcements.length === 0 ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.brand.accent}
                    style={styles.feedSpinner}
                  />
                ) : announcements.length === 0 ? (
                  <Text style={styles.emptyFeedText}>
                    No announcements published yet.
                  </Text>
                ) : (
                  announcements.map((item) => (
                    <View key={item.id} style={styles.announcementItem}>
                      <View style={styles.announcementTopRow}>
                        <Text style={styles.announcementItemTitle}>
                          {item.title}
                        </Text>
                        <View style={styles.priorityPill}>
                          <Text style={styles.priorityText}>
                            {item.priority.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.announcementItemContent}>
                        {item.content}
                      </Text>
                      <Text style={styles.announcementItemDate}>
                        {new Date(item.created_at).toLocaleString()}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          ) : (
            /* NON-ADMIN VIEW: Restricted & Educational Notice */
            <View style={styles.restrictedNotice}>
              <View style={styles.restrictedIconBox}>
                <Text style={styles.restrictedLockIcon}>🔒</Text>
              </View>
              <View style={styles.restrictedTextBox}>
                <Text style={styles.restrictedHeading}>
                  Access Restricted by Row Level Security
                </Text>
                <Text style={styles.restrictedBody}>
                  Your authenticated role is{' '}
                  <Text style={styles.boldText}>User</Text>. The admin table{' '}
                  <Text style={styles.codeText}>public.admin_announcements</Text>{' '}
                  is guarded by the server function{' '}
                  <Text style={styles.codeText}>public.is_admin()</Text>.
                </Text>
                <Text style={styles.restrictedHint}>
                  To test admin capabilities, an existing administrator or service
                  role must execute an update in the Supabase SQL editor:
                </Text>
                <View style={styles.codeSnippet}>
                  <Text style={styles.codeSnippetText}>
                    UPDATE public.profiles SET role = 'admin' WHERE email = '
                    {user?.email}';
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 4. Runtime & Architecture Summary Card */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardHeaderTitle}>Runtime & Session Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Platform</Text>
              <Text style={styles.summaryItemValue}>
                {Platform.OS === 'web'
                  ? 'React Native Web'
                  : Platform.OS.toUpperCase()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Storage Engine</Text>
              <Text style={styles.summaryItemValue}>
                {Platform.OS === 'web' ? 'AsyncStorage (Local)' : 'AsyncStorage (Native)'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Identity Gateway</Text>
              <Text style={styles.summaryItemValue}>Google OAuth 2.0</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Access Scope</Text>
              <Text style={styles.summaryItemValue}>Exact @hbplus.fit</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  desktopScrollPadding: {
    padding: spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  // Greeting Header
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  greetingTextColumn: {
    flex: 1,
    minWidth: 260,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  greetingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  verifiedDomainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successBg,
    borderColor: colors.status.successBorder,
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
  verifiedDomainIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.status.success,
    marginRight: 4,
  },
  verifiedDomainText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.status.success,
  },
  // Grid
  grid: {
    gap: spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCol: {
    flex: 1,
  },
  // Card
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cardActionLink: {
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  cardActionLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand.accent,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  // Profile Summary Row
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  profileFullName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  profileCreatedAt: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  metaLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  // Status Pill
  statusPill: {
    backgroundColor: colors.status.successBg,
    borderColor: colors.status.successBorder,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.status.success,
    letterSpacing: 0.5,
  },
  // Checklist
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
    fontSize: 13,
  },
  checkText: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  infoNoteBox: {
    backgroundColor: colors.status.infoBg,
    borderColor: colors.status.infoBorder,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
  },
  infoNoteText: {
    fontSize: 12,
    color: colors.text.brand,
    lineHeight: 16,
    fontWeight: '500',
  },
  // Admin Card
  adminCard: {
    borderColor: '#D8B4FE', // Light purple
  },
  adminCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  adminTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadgeIcon: {
    fontSize: 16,
    marginRight: spacing.xs + 2,
  },
  adminContent: {
    gap: spacing.md,
  },
  adminDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
  },
  publishBox: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.sm,
  },
  publishBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  textInput: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  publishBtn: {
    backgroundColor: '#7E22CE', // Admin purple
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  publishBtnText: {
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
  successBanner: {
    backgroundColor: colors.status.successBg,
    borderColor: colors.status.successBorder,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.status.success,
  },
  announcementsFeed: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  refreshLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand.accent,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  feedSpinner: {
    paddingVertical: spacing.md,
  },
  emptyFeedText: {
    fontSize: 13,
    color: colors.text.muted,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  announcementItem: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 4,
  },
  announcementTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  announcementItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  priorityPill: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: borderRadius.full,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7E22CE',
  },
  announcementItemContent: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  announcementItemDate: {
    fontSize: 11,
    color: colors.text.muted,
  },
  // Restricted notice (Non-Admin)
  restrictedNotice: {
    flexDirection: 'row',
    backgroundColor: colors.status.warningBg,
    borderColor: colors.status.warningBorder,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  restrictedIconBox: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  restrictedLockIcon: {
    fontSize: 22,
  },
  restrictedTextBox: {
    flex: 1,
    gap: spacing.xs,
  },
  restrictedHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.status.warning,
  },
  restrictedBody: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  restrictedHint: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  codeSnippet: {
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: 4,
  },
  codeSnippetText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#38BDF8',
  },
  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  summaryItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  summaryItemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 4,
  },
  // General Typography
  boldText: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    backgroundColor: colors.background.elevated,
    color: colors.brand.accent,
  },
});
