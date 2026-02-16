import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme, spacing } from '../theme';
import BrandLogo from '../components/BrandLogo';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  const { t } = useTranslation();

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
            <BrandLogo size={102} />
          </View>
          <Text style={styles.title}>{t('welcome.title')}</Text>
          <Text style={styles.description}>{t('welcome.subtitle')}</Text>
          <Text style={styles.fullName}>Vitali Intelligent Health</Text>
        </View>

        <View style={styles.featuresSection}>
          <FeatureItem iconName="brain" text={t('welcome.feature1Description')} />
          <FeatureItem iconName="video" text={t('welcome.feature2Description')} />
          <FeatureItem iconName="chart-line" text={t('welcome.feature3Description')} />
          <FeatureItem iconName="shield-check" text={t('welcome.feature3Title')} />
        </View>

        <View style={styles.buttonSection}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Register')}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.primaryButtonLabel}
          >
            {t('welcome.getStarted')}
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Login')}
            style={styles.secondaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.secondaryButtonLabel}
            textColor="#FFFFFF"
          >
            {t('welcome.signIn')}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ iconName, text }: { iconName: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <MaterialCommunityIcons name={iconName as any} size={22} color="rgba(255, 255, 255, 0.9)" />
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
    marginBottom: spacing.lg,
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
  fullName: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: 'rgba(255,255,255,0.86)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  featuresSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.roundness * 2,
    padding: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureText: {
    marginLeft: spacing.md,
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
