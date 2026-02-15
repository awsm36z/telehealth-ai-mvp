import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, List, Avatar, Divider, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { theme, spacing } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import { LANGUAGES, changeLanguage, getCurrentLanguage, type LanguageCode } from '../../i18n';

export default function DoctorProfileScreen({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const { contentContainerStyle } = useResponsive();
  const [userName, setUserName] = useState('Doctor');
  const [userEmail, setUserEmail] = useState('doctor@email.com');
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);

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

  const handleLanguageChange = async (code: LanguageCode) => {
    await changeLanguage(code);
    setLanguageMenuVisible(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === getCurrentLanguage());

  const avatarLabel = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'D';

  const specialty = userEmail.toLowerCase().includes('pediatric') ? 'Pediatrician' : 'Primary Care Physician';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, contentContainerStyle]}>
        <View style={styles.profileHeader}>
          <Avatar.Text size={80} label={avatarLabel} />
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
          <Text style={styles.specialty}>{specialty}</Text>
        </View>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Item
            title={t('doctor.availability')}
            description={t('doctor.availabilityDescription')}
            left={(props) => <List.Icon {...props} icon="calendar-clock" />}
            onPress={() => Alert.alert(t('doctor.availability'), t('doctor.availabilityMessage'))}
          />
          <List.Item
            title={t('doctor.credentials')}
            description="License #12345"
            left={(props) => <List.Icon {...props} icon="certificate" />}
            onPress={() => Alert.alert(t('doctor.credentials'), t('doctor.credentialsMessage'))}
          />
          <Menu
            visible={languageMenuVisible}
            onDismiss={() => setLanguageMenuVisible(false)}
            anchor={
              <List.Item
                title={t('common.language')}
                description={currentLang?.nativeLabel || 'English'}
                left={(props) => <List.Icon {...props} icon="translate" />}
                onPress={() => setLanguageMenuVisible(true)}
              />
            }
          >
            {LANGUAGES.map((lang) => (
              <Menu.Item
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code as LanguageCode)}
                title={`${lang.nativeLabel} (${lang.label})`}
                leadingIcon={getCurrentLanguage() === lang.code ? 'check' : undefined}
              />
            ))}
          </Menu>
          <List.Item
            title={t('profile.settings')}
            description={t('profile.settingsDescription')}
            left={(props) => <List.Icon {...props} icon="cog" />}
            onPress={() => Alert.alert(t('profile.settings'), t('profile.settingsMessage'))}
          />
        </List.Section>

        <Button
          mode="outlined"
          onPress={onLogout}
          style={styles.logoutButton}
          icon="logout"
        >
          {t('common.logout')}
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
