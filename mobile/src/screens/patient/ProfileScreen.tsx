import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
            left={(props) => <List.Icon {...props} icon="clipboard-text" />}
            onPress={() => {}}
          />
          <List.Item
            title="Medications"
            left={(props) => <List.Icon {...props} icon="pill" />}
            onPress={() => {}}
          />
          <List.Item
            title="Allergies"
            left={(props) => <List.Icon {...props} icon="alert-circle" />}
            onPress={() => {}}
          />
          <List.Item
            title="Settings"
            left={(props) => <List.Icon {...props} icon="cog" />}
            onPress={() => {}}
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
