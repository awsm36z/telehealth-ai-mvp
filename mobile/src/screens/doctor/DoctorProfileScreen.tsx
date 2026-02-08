import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, List, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, spacing } from '../../theme';

export default function DoctorProfileScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar.Text size={80} label="DM" />
          <Text style={styles.name}>Dr. Martinez</Text>
          <Text style={styles.email}>dr.martinez@hospital.com</Text>
          <Text style={styles.specialty}>Primary Care Physician</Text>
        </View>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Item
            title="Availability"
            description="Set your consultation hours"
            left={(props) => <List.Icon {...props} icon="calendar-clock" />}
            onPress={() => {}}
          />
          <List.Item
            title="Credentials"
            description="License #12345"
            left={(props) => <List.Icon {...props} icon="certificate" />}
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
