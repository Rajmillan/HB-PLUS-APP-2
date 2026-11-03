import React from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, shadows, spacing } from '../theme';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

// Crisp official Google "G" emblem (base64 PNG for 100% native & web zero-dependency compatibility)
const GOOGLE_G_ICON_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA1lJREFUeNrs2VtIVFEcx/HrnGvOGZ3KysdSWppBFEQUJdBDUSK9RRAkUfRQUBFFQRRUEEURBEUvQUVvBUEPFT1U+FCQ9FBEQZAgGvSwbF0znU5n5nbW/nO2O9eZ0Wb1pB44nHO2mb3P/q/fOWdmR4jIq3wT/Q1YAYuA1UB+77gW2AlsA84CGd970eN101y24263U253uJ11m7vdznf48n3AeeCcl7lXAgngp9sdbtvu3nU73b64uQ9Y4WVgV4BtwAXgh3sdt7Nux2kCjwA3vYy8W4DfgDPAnF53xK0xM0y7b7j9s0e8VcDvgJ+Ae4ALbqeA94BPXmZe5Y9m92tgyW39rGZ4N40BvgK2eRl5FwG/AGeAK27nAVeAXd4m3vOAY8Bp4JZb2+lYVnMbkAG+epl47wWc9q5zPec3F+A6sNW7yvst4Ihbz7q37Z6TAmZ723l1wGHgSbeztbV5023t3p7m82m2n07n97m52r9+Ww888jJxFcBhgC/u7b212fG/Z8fLgS1eJn4OOBa099b/k0f7q/l+V1W1f5+Xp/n9ms/naX8U2Ah88tLx36sZ3r7b+cbt1B4/fvBwdPTw4cjIS10hRFN7e1N7b+8rXRH7gPXAey8T/083f2O23zH/1dLSZvf4+GfHjo3vjI2N7I6MjOwW0Q5Z77k975/36Tf5p/wX4N7y8jN7h4aGHhwZGdmdyWb8iYmJP5yK6Pq9drt309873Dve3gY44XbO7Tnvf2/n0tJ/l5eW/nQ6nZeA771s/HPAi8DbZ2tX5+f/nF9ZebWb0/E4l3v95qPj9i1vI1cC24B1wEfgC/AZ6ACuAheBFmA5sM7Ly/8VqAG2Al+B58ALoBt4D7wFXgGNgBqw3tvMezswCmgD5gGvgGZgAegF3gDvgbPAEuCAt5m/H7gAPAOagfPAGyANPABeAw3Aan/q/F+BKmB18J0MNAHrgBfAPGAB8MDbhPcGMAw0A/uBdcAK4BXwDsgAK/yprx3Aev+9B/w8uQZ0A2uAjcBSYI0/9fW9v3wJcAnY7f858yKw21+/wN/D+5f/k9s32z/8f8v94f8b0N//G2AAaM33/9L6fJMAAAAASUVORK5CYII=';

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  title = 'Sign in with Google',
}) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        shadows.subtle,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.brand.accent}
            style={styles.spinner}
          />
        ) : (
          <Image
            source={{ uri: GOOGLE_G_ICON_URI }}
            style={styles.icon}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        )}
        <Text style={[styles.text, isDisabled && styles.disabledText]}>
          {loading ? 'Connecting to Google...' : title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
      } as ViewStyle,
    }),
  },
  pressed: {
    backgroundColor: colors.background.elevated,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: spacing.md,
  } as ImageStyle,
  spinner: {
    marginRight: spacing.md,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  disabledText: {
    color: colors.text.muted,
  },
});
