import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../../theme';

export default function InsightsScreen({ route, navigation }: any) {
  const { insights } = route.params || {};

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
          <Text style={styles.headerTitle}>AI Health Insights</Text>
          <Text style={styles.headerSubtitle}>
            Generated from your symptoms and health data
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Summary */}
          <Surface style={[styles.section, shadows.medium]}>
            <SectionHeader icon="file-document" title="Summary" />
            <Text style={styles.summaryText}>{data.summary}</Text>
          </Surface>

          {/* Key Findings */}
          <Surface style={[styles.section, shadows.medium]}>
            <SectionHeader icon="clipboard-list" title="Key Findings" />
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
            <SectionHeader icon="medical-bag" title="What This Could Be" />
            <View style={styles.disclaimer}>
              <MaterialCommunityIcons
                name="information"
                size={16}
                color={theme.colors.info}
              />
              <Text style={styles.disclaimerText}>
                These are possibilities, not diagnoses. Only a doctor can provide a diagnosis.
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
            <SectionHeader icon="shoe-print" title="Next Steps" />
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
            icon="video"
          >
            Start Video Consultation
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Home')}
            style={styles.secondaryButton}
            contentStyle={styles.buttonContent}
          >
            Save for Later
          </Button>

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
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
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
