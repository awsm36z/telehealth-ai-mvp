import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, List, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing } from '../../theme';

export default function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const [userName, setUserName] = useState('Patient');
  const [userEmail, setUserEmail] = useState('patient@email.com');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [storedName, storedEmail] = await Promise.all([
        AsyncStorage.getItem('userName'),
        AsyncStorage.getItem('userEmail'),
      ]);

      if (storedName?.trim()) {
        setUserName(storedName.trim());
      }

      if (storedEmail?.trim()) {
        setUserEmail(storedEmail.trim());
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const avatarLabel = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'P';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar.Text size={80} label={avatarLabel} />
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Item
            title="Medical History"
            description="View your past consultations"
            left={(props) => <List.Icon {...props} icon="clipboard-text" />}
            onPress={() => Alert.alert('Medical History', 'Your medical history from consultations will be displayed here in a future update.')}
          />
          <List.Item
            title="Medications"
            description="Track your current medications"
            left={(props) => <List.Icon {...props} icon="pill" />}
            onPress={() => Alert.alert('Medications', 'Medication tracking will be available in a future update.')}
          />
          <List.Item
            title="Allergies"
            description="Manage your allergy information"
            left={(props) => <List.Icon {...props} icon="alert-circle" />}
            onPress={() => Alert.alert('Allergies', 'Allergy management will be available in a future update.')}
          />
          <List.Item
            title="Settings"
            description="App preferences and notifications"
            left={(props) => <List.Icon {...props} icon="cog" />}
            onPress={() => Alert.alert('Settings', 'App settings will be available in a future update.')}
          />
        </List.Section>

        <Button
          mode="outlined"
          onPress={onLogout}
          style={styles.logoutButton}
          icon="logout"
        >
          Logout
        </Button>
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
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: spacing.md,
  },
  email: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
});
