import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Chip, Divider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../../theme';

export default function ConsultationDetailScreen({ route, navigation }: any) {
  const consultation = route?.params?.consultation;

  if (!consultation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={52}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.emptyTitle}>Consultation not found</Text>
          <Text style={styles.emptyText}>Please return to history and try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle}>Consultation Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={[styles.card, shadows.small]}>
          <Card.Content>
            <Text style={styles.title}>Consultation Summary</Text>
            <Text style={styles.metaText}>{formatDate(consultation.completedAt)}</Text>
            <Text style={styles.metaText}>Doctor: {consultation.doctorName || 'Doctor'}</Text>
            {consultation.roomName ? (
              <Text style={styles.metaText}>Room: {consultation.roomName}</Text>
            ) : null}
            <Divider style={styles.divider} />
            <Text style={styles.sectionLabel}>Visit Summary</Text>
            <Text style={styles.sectionText}>{consultation.summary || 'No summary provided.'}</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, shadows.small]}>
          <Card.Content>
            <Text style={styles.sectionLabel}>Doctor Notes</Text>
            <Text style={styles.sectionText}>
              {consultation.notes || consultation.doctorNotes || 'No doctor notes were added.'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, shadows.small]}>
          <Card.Content>
            <Text style={styles.sectionLabel}>Assessment</Text>
            <View style={styles.chipsRow}>
              {consultation.urgency ? (
                <Chip compact icon="alert-circle">
                  Urgency: {consultation.urgency}
                </Chip>
              ) : null}
              {consultation.chiefComplaint ? (
                <Chip compact icon="stethoscope">
                  Complaint: {consultation.chiefComplaint}
                </Chip>
              ) : null}
            </View>

            {Array.isArray(consultation.possibleConditions) && consultation.possibleConditions.length > 0 ? (
              <>
                <Text style={styles.subLabel}>Possible Conditions</Text>
                <Text style={styles.sectionText}>{consultation.possibleConditions.join(', ')}</Text>
              </>
            ) : null}

            {consultation.recommendation ? (
              <>
                <Text style={styles.subLabel}>Recommendation</Text>
                <Text style={styles.sectionText}>{consultation.recommendation}</Text>
              </>
            ) : null}

            {Array.isArray(consultation.nextSteps) && consultation.nextSteps.length > 0 ? (
              <>
                <Text style={styles.subLabel}>Next Steps</Text>
                <Text style={styles.sectionText}>{consultation.nextSteps.join(', ')}</Text>
              </>
            ) : null}
          </Card.Content>
        </Card>

        <Card style={[styles.card, shadows.small]}>
          <Card.Content>
            <Text style={styles.sectionLabel}>Triage Conversation</Text>
            {Array.isArray(consultation.triageTranscript) && consultation.triageTranscript.length > 0 ? (
              consultation.triageTranscript.map((message: any, idx: number) => (
                <View
                  key={`${consultation.id}-msg-${idx}`}
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.patientBubble : styles.aiBubble,
                  ]}
                >
                  <Text style={styles.messageRole}>
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </Text>
                  <Text style={styles.messageText}>{message.content}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.sectionText}>No triage transcript was saved for this consultation.</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  card: {
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  divider: {
    marginVertical: spacing.md,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.onSurface,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  messageBubble: {
    borderRadius: theme.roundness,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  patientBubble: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  aiBubble: {
    backgroundColor: `${theme.colors.secondary}10`,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    color: theme.colors.onSurfaceVariant,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.onSurface,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  emptyText: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
