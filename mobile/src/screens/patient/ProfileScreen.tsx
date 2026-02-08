import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, List, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, spacing } from '../../theme';

export default function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar.Text size={80} label="S" />
          <Text style={styles.name}>Sarah Johnson</Text>
          <Text style={styles.email}>sarah.j@email.com</Text>
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
