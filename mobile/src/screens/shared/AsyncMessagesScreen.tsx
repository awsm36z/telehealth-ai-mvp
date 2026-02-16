import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Chip, IconButton, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing } from '../../theme';
import api from '../../utils/api';
import { getCurrentLanguage, type LanguageCode } from '../../i18n';

export default function AsyncMessagesScreen({ route, navigation }: any) {
  const { patientId, senderType = 'patient', title = 'Care Team Messages' } = route.params || {};
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(getCurrentLanguage());
  const [translatedById, setTranslatedById] = useState<Record<string, string>>({});

  const loadThread = async () => {
    if (!patientId) return;
    setLoading(true);
    const response = await api.getMessageThread(patientId);
    if (Array.isArray(response.data)) {
      setMessages(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage());
    loadThread();
    const timer = setInterval(loadThread, 7000);
    return () => clearInterval(timer);
  }, [patientId]);

  useEffect(() => {
    const translateIncoming = async () => {
      const pending = messages.filter(
        (m) =>
          m.id &&
          m.senderType !== senderType &&
          m.senderLanguage &&
          m.senderLanguage !== currentLanguage &&
          !translatedById[m.id]
      );
      if (!pending.length) return;

      for (const msg of pending) {
        try {
          const tr = await api.translate(msg.message, msg.senderLanguage, currentLanguage);
          if (tr.data?.translated) {
            setTranslatedById((prev) => ({ ...prev, [msg.id]: tr.data.translated }));
          }
        } catch {
          // Ignore translation errors; show source text.
        }
      }
    };
    translateIncoming();
  }, [messages, currentLanguage, senderType, translatedById]);

  const send = async () => {
    const message = newMessage.trim();
    if (!message || !patientId) return;
    setPosting(true);
    const senderName = (await AsyncStorage.getItem('userName')) || (senderType === 'doctor' ? 'Doctor Office' : 'Patient');
    const response = await api.postThreadMessage(patientId, {
      senderType,
      senderName,
      senderLanguage: currentLanguage,
      message,
    });
    if (response.data?.data) {
      setMessages((prev) => [...prev, response.data.data]);
      setNewMessage('');
    }
    setPosting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Asynchronous care-team messaging (not instant chat)</Text>
        </View>
        <IconButton icon="refresh" onPress={loadThread} />
      </View>

      <Card style={styles.noticeCard}>
        <Card.Content>
          <Text style={styles.noticeText}>
            Messages are reviewed periodically by the doctor or care office. For emergencies, use local emergency services.
          </Text>
        </Card.Content>
      </Card>

      <ScrollView contentContainerStyle={styles.thread}>
        {loading && messages.length === 0 ? (
          <Text style={styles.placeholder}>Loading messages…</Text>
        ) : messages.length === 0 ? (
          <Text style={styles.placeholder}>No messages yet. Start the thread below.</Text>
        ) : (
          messages.map((item) => (
            <View
              key={item.id}
              style={[styles.message, item.senderType === senderType ? styles.ownMessage : styles.otherMessage]}
            >
              <Text style={styles.sender}>{item.senderName}</Text>
              <Text style={styles.messageText}>{translatedById[item.id] || item.message}</Text>
              <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.compose}>
        <Chip compact style={styles.chip}>
          Slow messaging
        </Chip>
        <TextInput
          mode="outlined"
          multiline
          numberOfLines={3}
          placeholder="Write a follow-up update..."
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.input}
        />
        <Button mode="contained" onPress={send} loading={posting} disabled={posting}>
          Send Message
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs, paddingTop: spacing.xs },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface },
  subtitle: { fontSize: 12, color: theme.colors.onSurfaceVariant },
  noticeCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: `${theme.colors.info}10` },
  noticeText: { color: theme.colors.onSurface, fontSize: 13, lineHeight: 19 },
  thread: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  placeholder: { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xl },
  message: { borderRadius: theme.roundness, padding: spacing.sm, maxWidth: '90%' },
  ownMessage: { alignSelf: 'flex-end', backgroundColor: `${theme.colors.primary}12` },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: `${theme.colors.secondary}12` },
  sender: { fontSize: 12, fontWeight: '700', color: theme.colors.onSurfaceVariant, marginBottom: 2 },
  messageText: { fontSize: 14, color: theme.colors.onSurface },
  timestamp: { marginTop: 4, fontSize: 11, color: theme.colors.onSurfaceVariant },
  compose: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.outline, backgroundColor: theme.colors.surface },
  chip: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  input: { marginBottom: spacing.sm, backgroundColor: theme.colors.surface },
});
