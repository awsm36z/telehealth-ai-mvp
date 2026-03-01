import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { Text, Surface, Chip, ActivityIndicator, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { theme, spacing, shadows } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../utils/api';

type Consultation = {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar: string | null;
  doctorName: string;
  roomName: string;
  completedAt: string;
  summary: string;
  chiefComplaint: string | null;
  urgency: string | null;
  notes: string;
  possibleConditions: string[];
  nextSteps: string[];
  reportStatus?: 'generating' | 'ready' | 'failed';
  report?: string;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') {
        const name = (entry as any).name || (entry as any).label || (entry as any).title;
        if (typeof name === 'string') return name;
      }
      return String(entry ?? '').trim();
    })
    .filter(Boolean);
}

function normalizeConsultation(raw: any, index: number): Consultation {
  const id = String(raw?.id || raw?._id || raw?.consultationId || `consultation-${index}`);
  const completedAt = raw?.completedAt || raw?.endedAt || raw?.updatedAt || new Date().toISOString();
  const patientName = raw?.patientName || raw?.patient?.name || raw?.name || 'Unknown patient';
  return {
    id,
    patientId: String(raw?.patientId || raw?.patient?._id || raw?.patient?.id || ''),
    patientName,
    patientAvatar: raw?.patientAvatar || null,
    doctorName: raw?.doctorName || raw?.doctor?.name || 'Doctor',
    roomName: raw?.roomName || '',
    completedAt,
    summary: typeof raw?.summary === 'string' ? raw.summary : '',
    chiefComplaint: typeof raw?.chiefComplaint === 'string' ? raw.chiefComplaint : null,
    urgency: typeof raw?.urgency === 'string' ? raw.urgency : null,
    notes: typeof raw?.notes === 'string' ? raw.notes : '',
    possibleConditions: toStringArray(raw?.possibleConditions),
    nextSteps: toStringArray(raw?.nextSteps),
    reportStatus: raw?.reportStatus,
    report: typeof raw?.report === 'string' ? raw.report : '',
  };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function UrgencyChip({ urgency }: { urgency: string | null }) {
  if (!urgency) return null;
  const color =
    urgency === 'high' ? theme.colors.error :
    urgency === 'medium' ? '#F59E0B' :
    theme.colors.primary;
  return (
    <Chip
      compact
      style={[styles.urgencyChip, { borderColor: color }]}
      textStyle={[styles.urgencyText, { color }]}
    >
      {urgency.charAt(0).toUpperCase() + urgency.slice(1)} priority
    </Chip>
  );
}

function ConsultationCard({ item, onPress }: { item: Consultation; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Surface style={[styles.card, shadows.small]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.dateText}>{formatDate(item.completedAt)}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
        </View>
        {item.chiefComplaint && (
          <Text style={styles.complaint} numberOfLines={2}>{item.chiefComplaint}</Text>
        )}
        <View style={styles.cardFooter}>
          <UrgencyChip urgency={item.urgency} />
          {item.possibleConditions?.length > 0 && (
            <Text style={styles.conditionText} numberOfLines={1}>
              Dx: {item.possibleConditions.slice(0, 2).join(', ')}
            </Text>
          )}
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

function DetailModal({ item, onClose }: { item: Consultation; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Consultation Detail</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Patient info */}
          <Surface style={[styles.detailCard, shadows.small]}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>Patient</Text>
              <Text style={styles.detailValue}>{item.patientName}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(item.completedAt)}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="doctor" size={20} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>Doctor</Text>
              <Text style={styles.detailValue}>{item.doctorName}</Text>
            </View>
            {item.urgency && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.detailLabel}>Urgency</Text>
                <UrgencyChip urgency={item.urgency} />
              </View>
            )}
          </Surface>

          {/* Chief complaint */}
          {item.chiefComplaint && (
            <Surface style={[styles.detailCard, shadows.small]}>
              <Text style={styles.sectionTitle}>Chief Complaint</Text>
              <Text style={styles.sectionBody}>{item.chiefComplaint}</Text>
            </Surface>
          )}

          {/* Diagnoses */}
          {item.possibleConditions?.length > 0 && (
            <Surface style={[styles.detailCard, shadows.small]}>
              <Text style={styles.sectionTitle}>Possible Diagnoses</Text>
              {item.possibleConditions.map((c, i) => (
                <Text key={i} style={styles.bulletItem}>• {c}</Text>
              ))}
            </Surface>
          )}

          {/* Doctor notes */}
          {item.notes?.trim() ? (
            <Surface style={[styles.detailCard, shadows.small]}>
              <Text style={styles.sectionTitle}>Doctor Notes</Text>
              <Text style={styles.sectionBody}>{item.notes}</Text>
            </Surface>
          ) : null}

          {/* Next steps */}
          {item.nextSteps?.length > 0 && (
            <Surface style={[styles.detailCard, shadows.small]}>
              <Text style={styles.sectionTitle}>Next Steps</Text>
              {item.nextSteps.map((s, i) => (
                <Text key={i} style={styles.bulletItem}>• {s}</Text>
              ))}
            </Surface>
          )}

          {/* Report */}
          {item.report && (
            <Surface style={[styles.detailCard, shadows.small]}>
              <View style={styles.reportHeader}>
                <MaterialCommunityIcons name="file-document" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}> Consultation Report</Text>
              </View>
              <Text style={styles.sectionBody}>{item.report}</Text>
            </Surface>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function DoctorHistoryScreen({ route }: any) {
  const { t } = useTranslation();
  const { contentContainerStyle } = useResponsive();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [filtered, setFiltered] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Consultation | null>(null);
  const todayOnly = !!route?.params?.todayOnly;

  const isSameLocalDay = (iso: string) => {
    const day = new Date(iso);
    const now = new Date();
    return (
      day.getFullYear() === now.getFullYear() &&
      day.getMonth() === now.getMonth() &&
      day.getDate() === now.getDate()
    );
  };

  const load = useCallback(async () => {
    const result = await api.getAllConsultations();
    const normalized: Consultation[] = (result.data || []).map((item: any, index: number) =>
      normalizeConsultation(item, index)
    );
    const data = todayOnly ? normalized.filter((c) => isSameLocalDay(c.completedAt)) : normalized;
    setConsultations(data);
    setFiltered(data);
    const openId = route?.params?.openConsultationId;
    if (openId) {
      const target = data.find((item) => String(item.id) === String(openId));
      if (target) setSelected(target);
    }
    setLoading(false);
    setRefreshing(false);
  }, [route?.params?.openConsultationId, todayOnly]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  const onSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFiltered(consultations);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(consultations.filter((c) =>
      c.patientName.toLowerCase().includes(q) ||
      c.chiefComplaint?.toLowerCase().includes(q) ||
      c.possibleConditions?.some((d) => d.toLowerCase().includes(q))
    ));
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {todayOnly ? t('doctor.todayCompletedTitle', { defaultValue: 'Completed Today' }) : t('doctor.historyTitle', { defaultValue: 'Consultation History' })}
        </Text>
        <Text style={styles.headerSub}>
          {t('doctor.historyCount', { count: consultations.length, defaultValue: `${consultations.length} consultations` })}
        </Text>
      </View>

      <Searchbar
        placeholder={t('doctor.historySearchPlaceholder', { defaultValue: 'Search patient, diagnosis...' })}
        value={searchQuery}
        onChangeText={onSearch}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.centerText}>{t('doctor.historyLoading', { defaultValue: 'Loading history...' })}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons name="history" size={48} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.centerText}>
            {searchQuery
              ? t('doctor.historyNoResults', { defaultValue: 'No results found' })
              : t('doctor.historyEmpty', { defaultValue: 'No consultations yet' })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[contentContainerStyle, styles.listContent]}
          renderItem={({ item }) => (
            <ConsultationCard item={item} onPress={() => setSelected(item)} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  headerSub: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  searchBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  complaint: {
    fontSize: 13,
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  urgencyChip: {
    borderWidth: 1,
    backgroundColor: 'transparent',
    height: 24,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  conditionText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  centerText: {
    fontSize: 15,
    color: theme.colors.onSurfaceVariant,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  modalContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailCard: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    width: 64,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  bulletItem: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 22,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
});
