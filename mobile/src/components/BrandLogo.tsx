import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  light?: boolean;
}

export default function BrandLogo({ size = 108, showWordmark = false, light = true }: BrandLogoProps) {
  const badgeSize = size;
  const titleColor = light ? '#FFFFFF' : '#123A57';
  const subtitleColor = light ? 'rgba(255,255,255,0.92)' : '#3C6682';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2E86C1', '#1E4D7B']} style={[styles.badge, { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }]}>
        <View style={styles.innerRing}>
          <Text style={[styles.vMark, { fontSize: badgeSize * 0.44 }]}>V</Text>
          <MaterialCommunityIcons name="pulse" size={badgeSize * 0.2} color="#50C878" style={styles.pulse} />
        </View>
      </LinearGradient>
      {showWordmark && (
        <View style={styles.wordmark}>
          <Text style={[styles.title, { color: titleColor }]}>Vitali</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>Intelligent Health</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  innerRing: {
    width: '82%',
    height: '82%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vMark: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: -2,
    letterSpacing: -2,
  },
  pulse: {
    position: 'absolute',
    bottom: '19%',
    right: '20%',
  },
  wordmark: {
    marginTop: 14,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
});
