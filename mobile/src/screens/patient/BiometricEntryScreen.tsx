import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

export default function BiometricEntryScreen({ navigation }: any) {
  const [biometrics, setBiometrics] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    temperatureUnit: 'F',
    weight: '',
    weightUnit: 'lbs',
    height: '',
    heightUnit: 'cm',
    respiratoryRate: '',
    painLevel: '0',
    bloodOxygen: '',
    bloodSugar: '',
    bloodSugarContext: 'fasting',
  });

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setBiometrics({ ...biometrics, [field]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Get actual patient ID from auth context
      const patientId = '1';

      // Save biometrics to backend
      const { data, error } = await api.saveBiometrics(patientId, {
        ...biometrics,
        notes,
      });

      if (error) {
        Alert.alert('Error', error);
        setLoading(false);
        return;
      }

      console.log('✅ Biometrics saved:', data);
      Alert.alert('Success', 'Biometrics saved successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save biometrics');
    } finally {
      setLoading(false);
    }
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

          {/* Height */}
          <BiometricSection
            icon="human-male-height"
            title="Height"
            color="#795548"
          >
            <TextInput
              label="Height"
              value={biometrics.height}
              onChangeText={(v) => updateField('height', v)}
              mode="outlined"
              keyboardType="numeric"
              placeholder="170"
              style={styles.input}
            />
            <SegmentedButtons
              value={biometrics.heightUnit}
              onValueChange={(v) => updateField('heightUnit', v)}
              buttons={[
                { value: 'cm', label: 'cm' },
                { value: 'in', label: 'in' },
              ]}
              style={styles.unitSelector}
            />
          </BiometricSection>

          {/* Respiratory Rate */}
          <BiometricSection
            icon="lungs"
            title="Respiratory Rate"
            color="#00BCD4"
          >
            <TextInput
              label="Respiratory Rate"
              value={biometrics.respiratoryRate}
              onChangeText={(v) => updateField('respiratoryRate', v)}
              mode="outlined"
              keyboardType="numeric"
              placeholder="16"
              right={<TextInput.Affix text="breaths/min" />}
              style={styles.input}
            />
            <Text style={styles.unitLabel}>Normal range: 12-20 breaths/min</Text>
          </BiometricSection>

          {/* Pain Level */}
          <BiometricSection
            icon="emoticon-sad"
            title="Pain Level"
            color="#F44336"
          >
            <View style={styles.painLevelContainer}>
              <Text style={styles.painLevelValue}>
                {biometrics.painLevel}/10 - {getPainDescription(biometrics.painLevel)}
              </Text>
              <View style={styles.painLevelButtons}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <Button
                    key={level}
                    mode={biometrics.painLevel === level.toString() ? 'contained' : 'outlined'}
                    onPress={() => updateField('painLevel', level.toString())}
                    style={[
                      styles.painButton,
                      biometrics.painLevel === level.toString() && {
                        backgroundColor: getPainColor(level),
                      },
                    ]}
                    labelStyle={styles.painButtonLabel}
                    compact
                  >
                    {level}
                  </Button>
                ))}
              </View>
            </View>
          </BiometricSection>

          {/* Blood Oxygen */}
          <BiometricSection
            icon="water-percent"
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
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Biometrics'}
          </Button>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getPainDescription(level: string): string {
  const painLevel = parseInt(level) || 0;
  if (painLevel === 0) return 'No pain';
  if (painLevel <= 3) return 'Mild';
  if (painLevel <= 6) return 'Moderate';
  if (painLevel <= 9) return 'Severe';
  return 'Worst possible';
}

function getPainColor(level: number): string {
  if (level === 0) return '#4CAF50';
  if (level <= 3) return '#8BC34A';
  if (level <= 6) return '#FF9800';
  if (level <= 9) return '#FF5722';
  return '#D32F2F';
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
  painLevelContainer: {
    gap: spacing.md,
  },
  painLevelValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  painLevelButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  painButton: {
    minWidth: 44,
    borderRadius: theme.roundness,
  },
  painButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
