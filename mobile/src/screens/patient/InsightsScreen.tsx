import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Surface, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, shadows } from '../../theme';

export default function InsightsScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { insights } = route.params || {};
  const fromWaitingRoom = !!route.params?.fromWaitingRoom;
  const fromTriageComplete = !!route.params?.fromTriageComplete;

  // Mock insights data (would come from API)
  const mockInsights = {
    summary: "Patient presents with sore throat (7/10 severity) for 3 days, accompanied by fever (101.5°F) and difficulty swallowing.",
    keyFindings: [
      "Sore throat severity: 7/10 for 3 days",
      "Fever: 101.5°F (38.6°C)",
      "Odynophagia (painful swallowing)",
      "No respiratory distress",
    ],
    possibleConditions: [
      {
        name: "Streptococcal Pharyngitis",
        description: "Bacterial throat infection requiring antibiotic treatment",
        confidence: "High",
      },
      {
        name: "Viral Pharyngitis",
        description: "Viral throat infection, typically self-limiting",
        confidence: "Medium",
      },
      {
        name: "Tonsillitis",
        description: "Inflammation of the tonsils",
        confidence: "Medium",
      },
    ],
    nextSteps: [
      "Schedule video consultation with doctor",
      "Prepare to show throat to doctor during call",
      "Note any new symptoms before consultation",
    ],
  };

  const data = insights || mockInsights;

  const handleConsultation = () => {
    if (fromWaitingRoom) {
      navigation.navigate('WaitingRoom', {
        triageData: route.params?.triageData,
        insights: data,
        roomName: route.params?.roomName,
      });
      return;
    }

    navigation.navigate('WaitingRoom', {
      triageData: route.params?.triageData,
      insights: data,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <MaterialCommunityIcons name="brain" size={48} color="#FFFFFF" />
          <Text style={styles.headerTitle}>{t('insights.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('insights.subtitle')}
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Medical Disclaimer Banner */}
          <Surface style={[styles.disclaimerBanner, shadows.small]}>
            <MaterialCommunityIcons name="shield-alert" size={24} color="#FF9500" />
            <View style={styles.disclaimerBannerContent}>
              <Text style={styles.disclaimerBannerTitle}>{t('insights.disclaimerTitle')}</Text>
              <Text style={styles.disclaimerBannerText}>
                {t('insights.disclaimerText')}
              </Text>
            </View>
          </Surface>

          {/* Summary */}
          <Surface style={[styles.section, shadows.medium]}>
            <SectionHeader icon="file-document" title={t('insights.summary')} />
            <Text style={styles.summaryText}>{data.summary}</Text>
          </Surface>

          {/* Key Findings */}
          <Surface style={[styles.section, shadows.medium]}>
            <SectionHeader icon="clipboard-list" title={t('insights.keyFindings')} />
            {data.keyFindings.map((finding: string, index: number) => (
              <View key={index} style={styles.findingItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.findingText}>{finding}</Text>
              </View>
            ))}
          </Surface>

          {/* Possible Conditions */}
          <Surface style={[styles.section, shadows.medium]}>
            <SectionHeader icon="medical-bag" title={t('insights.possibleConditions')} />
            <View style={styles.disclaimer}>
              <MaterialCommunityIcons
                name="information"
                size={16}
                color={theme.colors.info}
              />
              <Text style={styles.disclaimerText}>
                {t('insights.conditionsDisclaimer')}
              </Text>
            </View>
            {data.possibleConditions.map((condition: any, index: number) => (
              <View key={index}>
                <ConditionCard condition={condition} />
                {index < data.possibleConditions.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </View>
            ))}
          </Surface>

          {/* Next Steps */}
          <Surface style={[styles.section, shadows.medium]}>
            <SectionHeader icon="shoe-print" title={t('insights.nextSteps')} />
            {data.nextSteps.map((step: string, index: number) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </Surface>

          {/* CTA */}
          <Button
            mode="contained"
            onPress={handleConsultation}
            style={styles.ctaButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon={fromWaitingRoom ? 'arrow-left' : 'video'}
          >
            {fromWaitingRoom
              ? t('insights.backToWaitingRoom')
              : fromTriageComplete
                ? t('insights.continueToWaitingRoom')
                : t('insights.startConsultation')}
          </Button>

          {!fromWaitingRoom && (
            <Button
              mode="outlined"
              onPress={async () => {
                try {
                  const patientId = await AsyncStorage.getItem('userId');
                  const savedInsights = {
                    ...data,
                    triageData: route.params?.triageData,
                    savedAt: new Date().toISOString(),
                    patientId,
                  };
                  await AsyncStorage.setItem('savedInsights', JSON.stringify(savedInsights));
                  Alert.alert(
                    t('insights.savedTitle'),
                    t('insights.savedMessage'),
                    [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
                  );
                } catch {
                  navigation.navigate('Home');
                }
              }}
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
            >
              {t('insights.saveForLater')}
            </Button>
          )}

          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconContainer}>
        <MaterialCommunityIcons name={icon as any} size={24} color={theme.colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ConditionCard({ condition }: { condition: any }) {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High':
        return theme.colors.error;
      case 'Medium':
        return theme.colors.warning;
      case 'Low':
        return theme.colors.info;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  return (
    <View style={styles.conditionCard}>
      <View style={styles.conditionHeader}>
        <Text style={styles.conditionName}>{condition.name}</Text>
        <Chip
          mode="flat"
          style={[
            styles.confidenceChip,
            { backgroundColor: `${getConfidenceColor(condition.confidence)}15` },
          ]}
          textStyle={[styles.confidenceText, { color: getConfidenceColor(condition.confidence) }]}
        >
          {condition.confidence}
        </Chip>
      </View>
      <Text style={styles.conditionDescription}>{condition.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: spacing.lg * 2,
    borderBottomRightRadius: spacing.lg * 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: theme.roundness * 1.5,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  disclaimerBannerContent: {
    flex: 1,
  },
  disclaimerBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: spacing.xs,
  },
  disclaimerBannerText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#795548',
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness * 1.5,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.onSurface,
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  findingText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.onSurface,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${theme.colors.info}10`,
    padding: spacing.md,
    borderRadius: theme.roundness,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.info,
  },
  conditionCard: {
    paddingVertical: spacing.md,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  conditionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  confidenceChip: {
    height: 28,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  conditionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.onSurfaceVariant,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.onSurface,
    paddingTop: spacing.xs / 2,
  },
  ctaButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: theme.roundness,
    ...shadows.medium,
  },
  secondaryButton: {
    borderRadius: theme.roundness,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
