import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { borderRadius, colors, spacing, touchTargets } from '../theme';

interface ErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onDismiss,
  type = 'error',
}) => {
  if (!message) return null;

  const isWarning = type === 'warning';
  const isInfo = type === 'info';

  const containerStyle = isWarning
    ? styles.warningContainer
    : isInfo
    ? styles.infoContainer
    : styles.errorContainer;

  const textStyle = isWarning
    ? styles.warningText
    : isInfo
    ? styles.infoText
    : styles.errorText;

  const closeTextStyle = isWarning
    ? styles.warningClose
    : isInfo
    ? styles.infoClose
    : styles.errorClose;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.baseContainer, containerStyle]}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconColumn}>
          <Text style={[styles.statusIcon, textStyle]}>
            {isWarning ? '⚠' : isInfo ? 'ℹ' : '✕'}
          </Text>
        </View>
        <Text style={[styles.message, textStyle]}>{message}</Text>
        {Boolean(onDismiss) && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss message"
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeButton}
          >
            <Text style={[styles.closeText, closeTextStyle]}>×</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    width: '100%',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  errorContainer: {
    backgroundColor: colors.status.errorBg,
    borderColor: colors.status.errorBorder,
  },
  warningContainer: {
    backgroundColor: colors.status.warningBg,
    borderColor: colors.status.warningBorder,
  },
  infoContainer: {
    backgroundColor: colors.status.infoBg,
    borderColor: colors.status.infoBorder,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconColumn: {
    marginRight: spacing.sm + 2,
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  errorText: {
    color: colors.status.error,
  },
  warningText: {
    color: colors.status.warning,
  },
  infoText: {
    color: colors.status.info,
  },
  closeButton: {
    minHeight: touchTargets.minHeight,
    minWidth: touchTargets.minWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  closeText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 22,
  },
  errorClose: {
    color: colors.status.error,
  },
  warningClose: {
    color: colors.status.warning,
  },
  infoClose: {
    color: colors.status.info,
  },
});
