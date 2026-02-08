import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, spacing } from '../theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.heroIcon}>🩺</Text>
          </View>
          <Text style={styles.title}>Welcome to{'\n'}TeleHealth AI</Text>
          <Text style={styles.description}>
            AI-powered health consultations{'\n'}
            connecting you with doctors{'\n'}
            anytime, anywhere
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <FeatureItem icon="💬" text="Smart symptom assessment" />
          <FeatureItem icon="📊" text="Real-time health insights" />
          <FeatureItem icon="🎥" text="Video consultations" />
          <FeatureItem icon="🔒" text="Secure & HIPAA compliant" />
        </View>

        <View style={styles.buttonSection}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Register')}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.primaryButtonLabel}
          >
            Get Started
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Login')}
            style={styles.secondaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.secondaryButtonLabel}
            textColor="#FFFFFF"
          >
            Sign In
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroIcon: {
    fontSize: 50,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.roundness * 2,
    padding: spacing.lg,
    backdropFilter: 'blur(10px)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  buttonSection: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.roundness * 1.5,
  },
  secondaryButton: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: theme.roundness * 1.5,
  },
  buttonContent: {
    height: 56,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
