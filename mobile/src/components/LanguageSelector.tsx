import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage, getCurrentLanguage, type LanguageCode } from '../i18n';
import { theme, spacing } from '../theme';

interface LanguageSelectorProps {
  style?: object;
  light?: boolean; // For use on dark/gradient backgrounds
}

export default function LanguageSelector({ style, light = false }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);
  const currentLang = getCurrentLanguage();
  const currentLanguage = LANGUAGES.find((l) => l.code === currentLang);

  const handleLanguageChange = async (code: LanguageCode) => {
    setMenuVisible(false);
    if (code !== currentLang) {
      await changeLanguage(code);
    }
  };

  const textColor = light ? '#FFFFFF' : theme.colors.onSurface;
  const bgColor = light ? 'rgba(255,255,255,0.15)' : `${theme.colors.primary}10`;

  return (
    <View style={[styles.container, style]}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity
            style={[styles.button, { backgroundColor: bgColor }]}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="translate" size={18} color={textColor} />
            <Text style={[styles.label, { color: textColor }]}>
              {currentLanguage?.nativeLabel || 'English'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color={textColor} />
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        {LANGUAGES.map((lang) => (
          <Menu.Item
            key={lang.code}
            onPress={() => handleLanguageChange(lang.code)}
            title={`${lang.nativeLabel} (${lang.label})`}
            leadingIcon={lang.code === currentLang ? 'check' : undefined}
            titleStyle={lang.code === currentLang ? styles.selectedItem : undefined}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuContent: {
    backgroundColor: theme.colors.surface,
  },
  selectedItem: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
