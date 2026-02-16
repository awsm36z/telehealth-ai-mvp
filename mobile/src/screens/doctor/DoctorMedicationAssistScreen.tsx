import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, TextInput, Button, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../utils/api';

const DISCLAIMER =
  'AI assist only. This is not a prescription. Doctor must verify all facts before prescribing.';

export default function DoctorMedicationAssistScreen({ route, navigation }: any) {
  const { patientId, patientName, locale } = route.params || {};
  const { isTablet, contentContainerStyle } = useResponsive();

  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    const response = await api.getMedicationInsights({ patientId, locale });
    if (response.data) setInsights(response.data);
    setLoading(false);
  };

  useEffect(() => {
    loadInsights();
  }, [patientId]);

  const askFollowUp = async () => {
    const text = question.trim();
    if (!text) return;
    setChatLoading(true);
    setChatAnswer('');
    const response = await api.askMedicationAI({ patientId, locale, question: text });
    if (response.data?.answer) {
      setChatAnswer(response.data.answer);
    } else {
      setChatAnswer(response.error || 'Unable to generate an answer.');
    }
    setChatLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Medication Research</Text>
          <Text style={styles.subtitle}>Patient: {patientName || patientId || 'Unknown'}</Text>
        </View>
        <IconButton icon="refresh" onPress={loadInsights} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, contentContainerStyle]}>
        <Card style={styles.disclaimerCard}>
          <Card.Content>
            <View style={styles.disclaimerRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.colors.warning} />
              <Text style={styles.disclaimerText}>{DISCLAIMER}</Text>
            </View>
          </Card.Content>
        </Card>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Live Summary</Text>
                <Text style={styles.body}>{insights?.summary || 'No summary available.'}</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Possible Medication</Text>
                {(insights?.possibleMedication || []).length === 0 ? (
                  <Text style={styles.body}>No medication options generated yet.</Text>
                ) : (
                  insights.possibleMedication.map((item: any, index: number) => (
                    <View key={`${item.name}-${index}`} style={styles.listItem}>
                      <Text style={styles.itemTitle}>{item.name}</Text>
                      <Text style={styles.itemBody}>{item.rationale || 'No rationale provided.'}</Text>
                      <View style={styles.chips}>
                        <Chip compact>{item.market || 'General market'}</Chip>
                        <Chip compact>Confidence: {item.confidence || 'unknown'}</Chip>
                      </View>
                    </View>
                  ))
                )}
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Clinical Considerations</Text>
                {(insights?.considerations || []).map((item: string, index: number) => (
                  <Text key={`consideration-${index}`} style={styles.bullet}>• {item}</Text>
                ))}
                {(insights?.contraindications || []).map((item: string, index: number) => (
                  <Text key={`contra-${index}`} style={styles.bullet}>• Contraindication: {item}</Text>
                ))}
              </Card.Content>
            </Card>
          </>
        )}

        <Card style={[styles.card, isTablet && { marginTop: spacing.md }]}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Ask Medication AI</Text>
            <TextInput
              mode="outlined"
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask about dosage checks, contraindications, alternatives..."
              multiline
              style={styles.input}
            />
            <Button mode="contained" onPress={askFollowUp} loading={chatLoading} disabled={chatLoading}>
              Ask AI
            </Button>
            {!!chatAnswer && <Text style={[styles.body, { marginTop: spacing.md }]}>{chatAnswer}</Text>}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs, paddingTop: spacing.xs },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface },
  subtitle: { fontSize: 13, color: theme.colors.onSurfaceVariant },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  disclaimerCard: { marginBottom: spacing.md, backgroundColor: `${theme.colors.warning}10` },
  disclaimerRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  disclaimerText: { flex: 1, color: theme.colors.onSurface, fontSize: 13, lineHeight: 18 },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  card: { marginBottom: spacing.md, backgroundColor: theme.colors.surface },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm, color: theme.colors.onSurface },
  body: { fontSize: 14, color: theme.colors.onSurface, lineHeight: 20 },
  listItem: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.outline },
  itemTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.onSurface },
  itemBody: { marginTop: 2, fontSize: 13, color: theme.colors.onSurfaceVariant },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  bullet: { fontSize: 13, color: theme.colors.onSurface, marginBottom: spacing.xs },
  input: { marginBottom: spacing.md, backgroundColor: theme.colors.surface },
});
