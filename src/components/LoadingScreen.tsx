import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { borderRadius, colors, spacing } from '../theme';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Initializing...',
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={styles.container}
        accessibilityRole="progressbar"
        accessibilityLabel={message}
        accessibilityLiveRegion="polite"
      >
        {/* HBPLUS Brand Badge */}
        <View style={styles.brandBadge}>
          <Text style={styles.brandLogoText}>HB</Text>
          <View style={styles.plusContainer}>
            <Text style={styles.plusSymbol}>+</Text>
          </View>
        </View>

        <Text style={styles.brandTitle}>HBPLUS</Text>

        <View style={styles.indicatorContainer}>
          <ActivityIndicator size="large" color={colors.brand.accent} />
          {Boolean(message) && <Text style={styles.messageText}>{message}</Text>}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  indicatorContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  messageText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
