import React, { useState } from 'react';
import {
  Image,
  ImageStyle,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { borderRadius, colors } from '../theme';

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
  url,
  name,
  email,
  size = 40,
}) => {
  const [imageError, setImageError] = useState(false);

  const initial = (
    name?.trim()?.charAt(0) ||
    email?.trim()?.charAt(0) ||
    'U'
  ).toUpperCase();

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: borderRadius.full,
  };

  const fontSize = Math.max(12, Math.floor(size * 0.42));

  if (url && !imageError) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Image
          source={{ uri: url }}
          style={[styles.image, containerStyle as ImageStyle]}
          onError={() => setImageError(true)}
          resizeMode="cover"
          accessibilityLabel={`Avatar for ${name || email || 'user'}`}
        />
      </View>
    );
  }

  return (
    <View style={[styles.placeholder, containerStyle]}>
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.background.elevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '700',
    color: colors.text.inverse,
  },
});
