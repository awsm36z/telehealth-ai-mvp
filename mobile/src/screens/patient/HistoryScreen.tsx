import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

interface Consultation {
  id: string;
  doctorName: string;
  summary: string;
  completedAt: string;
  notes?: string;
}

export default function HistoryScreen() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await api.getConsultationHistory(userId);
      if (response.data && Array.isArray(response.data)) {
        setConsultations(response.data.reverse());
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
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
        <Text style={styles.title}>Consultation History</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.placeholderText}>Loading...</Text>
        ) : consultations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="history"
              size={64}
              color={theme.colors.onSurfaceVariant}
              style={{ opacity: 0.4, marginBottom: spacing.md }}
            />
            <Text style={styles.emptyTitle}>No Consultations Yet</Text>
            <Text style={styles.placeholderText}>
              Your past consultations will appear here after you complete a video call with a doctor.
            </Text>
          </View>
        ) : (
          consultations.map((consultation) => (
            <Card key={consultation.id} style={[styles.card, shadows.small]}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Avatar.Text
                    size={44}
                    label={consultation.doctorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    style={styles.avatar}
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.doctorName}>{consultation.doctorName}</Text>
                    <Text style={styles.date}>{formatDate(consultation.completedAt)}</Text>
                    <Text style={styles.summary} numberOfLines={2}>
                      {consultation.summary}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.success} />
                  <Text style={styles.statusText}>Completed</Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.md,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  cardInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  summary: {
    fontSize: 13,
    color: theme.colors.onSurface,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.roundness,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.success,
  },
});
