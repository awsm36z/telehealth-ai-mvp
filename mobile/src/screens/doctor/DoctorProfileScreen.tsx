import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, List, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing } from '../../theme';

export default function DoctorProfileScreen({ onLogout }: { onLogout: () => void }) {
  const [userName, setUserName] = useState('Doctor');
  const [userEmail, setUserEmail] = useState('doctor@email.com');

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
      console.error('Error loading doctor profile data:', error);
    }
  };

  const avatarLabel = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'D';

  const specialty = userEmail.toLowerCase().includes('pediatric') ? 'Pediatrician' : 'Primary Care Physician';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar.Text size={80} label={avatarLabel} />
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
          <Text style={styles.specialty}>{specialty}</Text>
        </View>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Item
            title="Availability"
            description="Set your consultation hours"
            left={(props) => <List.Icon {...props} icon="calendar-clock" />}
            onPress={() => Alert.alert('Availability', 'Availability scheduling will be available in a future update.')}
          />
          <List.Item
            title="Credentials"
            description="License #12345"
            left={(props) => <List.Icon {...props} icon="certificate" />}
            onPress={() => Alert.alert('Credentials', 'Credential management will be available in a future update.')}
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
  specialty: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.lg,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
});
