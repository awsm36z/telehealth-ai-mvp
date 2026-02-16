import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import BrandLogo from '../components/BrandLogo';

export default function SplashScreen() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <BrandLogo size={124} showWordmark light />
        </View>
        <Text style={styles.fullName}>Vitali Intelligent Health</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  fullName: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
