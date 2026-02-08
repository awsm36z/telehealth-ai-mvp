import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../../theme';

export default function BiometricEntryScreen({ navigation }: any) {
  const [biometrics, setBiometrics] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    temperatureUnit: 'F',
    weight: '',
    weightUnit: 'lbs',
    bloodOxygen: '',
    bloodSugar: '',
    bloodSugarContext: 'fasting',
  });

  const [notes, setNotes] = useState('');

  const updateField = (field: string, value: string) => {
    setBiometrics({ ...biometrics, [field]: value });
  };

  const handleSave = async () => {
    // Validate and save biometrics
    console.log('Saving biometrics:', biometrics, notes);
    // API call here
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Log Biometrics</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Blood Pressure */}
          <BiometricSection
            icon="heart-pulse"
            title="Blood Pressure"
            color={theme.colors.error}
          >
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Systolic"
                  value={biometrics.bloodPressureSystolic}
                  onChangeText={(v) => updateField('bloodPressureSystolic', v)}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="120"
                  style={styles.input}
                />
              </View>
              <Text style={styles.separator}>/</Text>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Diastolic"
                  value={biometrics.bloodPressureDiastolic}
                  onChangeText={(v) => updateField('bloodPressureDiastolic', v)}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="80"
                  style={styles.input}
                />
              </View>
            </View>
            <Text style={styles.unitLabel}>mmHg</Text>
          </BiometricSection>

          {/* Heart Rate */}
          <BiometricSection
            icon="heart"
            title="Heart Rate"
            color="#E91E63"
          >
            <TextInput
              label="Heart Rate"
              value={biometrics.heartRate}
              onChangeText={(v) => updateField('heartRate', v)}
              mode="outlined"
              keyboardType="numeric"
              placeholder="72"
              right={<TextInput.Affix text="BPM" />}
              style={styles.input}
            />
          </BiometricSection>

          {/* Temperature */}
          <BiometricSection
            icon="thermometer"
            title="Temperature"
            color="#FF9800"
          >
            <TextInput
              label="Temperature"
              value={biometrics.temperature}
              onChangeText={(v) => updateField('temperature', v)}
              mode="outlined"
              keyboardType="numeric"
              placeholder="98.6"
              style={styles.input}
            />
            <SegmentedButtons
              value={biometrics.temperatureUnit}
              onValueChange={(v) => updateField('temperatureUnit', v)}
              buttons={[
                { value: 'F', label: '°F' },
                { value: 'C', label: '°C' },
              ]}
              style={styles.unitSelector}
            />
          </BiometricSection>

          {/* Weight */}
          <BiometricSection
            icon="scale-bathroom"
            title="Weight"
            color="#9C27B0"
          >
            <TextInput
              label="Weight"
              value={biometrics.weight}
              onChangeText={(v) => updateField('weight', v)}
              mode="outlined"
              keyboardType="numeric"
              placeholder="150"
              style={styles.input}
            />
            <SegmentedButtons
              value={biometrics.weightUnit}
              onValueChange={(v) => updateField('weightUnit', v)}
              buttons={[
                { value: 'lbs', label: 'lbs' },
                { value: 'kg', label: 'kg' },
              ]}
              style={styles.unitSelector}
            />
          </BiometricSection>

          {/* Blood Oxygen */}
          <BiometricSection
            icon="lungs"
            title="Blood Oxygen (SpO2)"
            color="#2196F3"
          >
            <TextInput
              label="Blood Oxygen"
              value={biometrics.bloodOxygen}
              onChangeText={(v) => updateField('bloodOxygen', v)}
              mode="outlined"
              keyboardType="numeric"
              placeholder="98"
              right={<TextInput.Affix text="%" />}
              style={styles.input}
            />
          </BiometricSection>

          {/* Blood Sugar */}
          <BiometricSection
            icon="water"
            title="Blood Sugar"
            color="#4CAF50"
          >
            <TextInput
              label="Blood Sugar"
              value={biometrics.bloodSugar}
              onChangeText={(v) => updateField('bloodSugar', v)}
              mode="outlined"
              keyboardType="numeric"
              placeholder="100"
              right={<TextInput.Affix text="mg/dL" />}
              style={styles.input}
            />
            <SegmentedButtons
              value={biometrics.bloodSugarContext}
              onValueChange={(v) => updateField('bloodSugarContext', v)}
              buttons={[
                { value: 'fasting', label: 'Fasting' },
                { value: 'postMeal', label: 'Post-meal' },
                { value: 'random', label: 'Random' },
              ]}
              style={styles.unitSelector}
            />
          </BiometricSection>

          {/* Notes */}
          <Surface style={[styles.notesSection, shadows.small]}>
            <Text style={styles.notesTitle}>Additional Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Any additional information about your readings..."
              style={styles.notesInput}
            />
          </Surface>

          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="check"
          >
            Save Biometrics
          </Button>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BiometricSection({ icon, title, color, children }: any) {
  return (
    <Surface style={[styles.section, shadows.small]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${color}15` }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness * 1.5,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  sectionContent: {},
  input: {
    backgroundColor: theme.colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  separator: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
  unitLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  unitSelector: {
    marginTop: spacing.sm,
  },
  notesSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness * 1.5,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  notesInput: {
    backgroundColor: theme.colors.background,
  },
  saveButton: {
    borderRadius: theme.roundness,
    ...shadows.small,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
