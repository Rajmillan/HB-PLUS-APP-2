import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface EyeIconProps {
  visible: boolean;
  color?: string;
  size?: number;
}

/**
 * Professional, clean vector eye icon rendered using cross-platform
 * React Native primitives (zero native dependency requirement).
 * Replaces informal emoji with an enterprise-grade UI icon.
 */
export const EyeIcon: React.FC<EyeIconProps> = ({
  visible,
  color = colors.text.secondary,
  size = 20,
}) => {
  const width = size + 2;
  const height = Math.round(size * 0.65);
  const pupilSize = Math.round(size * 0.35);

  return (
    <View style={[styles.container, { width: size + 4, height: size + 4 }]}>
      {/* Eye Outline Eyelids */}
      <View
        style={[
          styles.eyelid,
          {
            width,
            height,
            borderColor: color,
            borderRadius: height,
          },
        ]}
      >
        {/* Centered Pupil */}
        <View
          style={[
            styles.pupil,
            {
              width: pupilSize,
              height: pupilSize,
              borderRadius: pupilSize / 2,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      {/* Diagonal Slash when hidden / closed */}
      {!visible && (
        <View
          style={[
            styles.slash,
            {
              width: width + 4,
              backgroundColor: color,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  eyelid: {
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    alignSelf: 'center',
  },
  slash: {
    position: 'absolute',
    height: 1.8,
    transform: [{ rotate: '-45deg' }],
    borderRadius: 1,
  },
});
