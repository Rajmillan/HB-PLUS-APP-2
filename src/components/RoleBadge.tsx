import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing } from '../theme';
import type { UserRole } from '../features/profile/types';

interface RoleBadgeProps {
  role: UserRole | string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role = 'user',
  size = 'md',
}) => {
  const isAdmin = role === 'admin';

  const badgeStyle = isAdmin ? styles.adminBadge : styles.userBadge;
  const textStyle = isAdmin ? styles.adminText : styles.userText;

  const sizeContainerStyle =
    size === 'sm'
      ? styles.containerSm
      : size === 'lg'
      ? styles.containerLg
      : styles.containerMd;

  const sizeTextStyle =
    size === 'sm'
      ? styles.textSm
      : size === 'lg'
      ? styles.textLg
      : styles.textMd;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Role: ${isAdmin ? 'Administrator' : 'User'}`}
      style={[styles.baseBadge, badgeStyle, sizeContainerStyle]}
    >
      <Text style={[styles.iconText, sizeTextStyle]}>
        {isAdmin ? '🛡️' : '👤'}
      </Text>
      <Text style={[styles.baseText, textStyle, sizeTextStyle]}>
        {isAdmin ? 'Admin' : 'User'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  baseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  containerMd: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    gap: 5,
  },
  containerLg: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  adminBadge: {
    backgroundColor: '#FAF5FF', // Light purple
    borderColor: '#D8B4FE',
  },
  adminText: {
    color: '#7E22CE', // Deep purple
  },
  userBadge: {
    backgroundColor: colors.status.infoBg,
    borderColor: colors.status.infoBorder,
  },
  userText: {
    color: colors.status.info,
  },
  baseText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 11,
  },
  textLg: {
    fontSize: 13,
  },
  iconText: {
    fontSize: 11,
  },
});
