import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, List, Avatar, Divider, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { theme, spacing } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import { LANGUAGES, changeLanguage, getCurrentLanguage, type LanguageCode } from '../../i18n';

export default function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const { contentContainerStyle } = useResponsive();
  const [userName, setUserName] = useState('Patient');
  const [userEmail, setUserEmail] = useState('patient@email.com');
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
      console.error('Error loading profile data:', error);
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
    .join('') || 'P';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, contentContainerStyle]}>
        <View style={styles.profileHeader}>
          <Avatar.Text size={80} label={avatarLabel} />
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Item
            title={t('profile.medicalHistory')}
            description={t('profile.medicalHistoryDescription')}
            left={(props) => <List.Icon {...props} icon="clipboard-text" />}
            onPress={() => Alert.alert(t('profile.medicalHistory'), t('profile.medicalHistoryMessage'))}
          />
          <List.Item
            title={t('profile.medications')}
            description={t('profile.medicationsDescription')}
            left={(props) => <List.Icon {...props} icon="pill" />}
            onPress={() => Alert.alert(t('profile.medications'), t('profile.medicationsMessage'))}
          />
          <List.Item
            title={t('profile.allergies')}
            description={t('profile.allergiesDescription')}
            left={(props) => <List.Icon {...props} icon="alert-circle" />}
            onPress={() => Alert.alert(t('profile.allergies'), t('profile.allergiesMessage'))}
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
  divider: {
    marginVertical: spacing.lg,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
});
