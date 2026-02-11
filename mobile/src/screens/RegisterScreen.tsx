import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, HelperText, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, shadows } from '../theme';
import api from '../utils/api';

export default function RegisterScreen({ navigation, onRegister }: any) {
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    licenseNumber: '', // For doctors only
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors: any = {};

    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (userType === 'patient' && !formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (userType === 'doctor' && !formData.licenseNumber) {
      newErrors.licenseNumber = 'License number is required';
    }
    if (!agreedToTerms) newErrors.terms = 'You must agree to the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await api.register({
        ...formData,
        userType,
      });

      if (response.error) {
        setErrors({ general: response.error });
        return;
      }

      const { token, user } = response.data;
      await AsyncStorage.setItem('userName', user.fullName || user.name || formData.fullName || 'Patient');
      await AsyncStorage.setItem('userEmail', user.email || formData.email || '');
      await AsyncStorage.setItem('userId', user.id || '');
      await onRegister(token, user.type);
    } catch (err: any) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (text: string): string => {
    // Strip all non-digits
    const digits = text.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const formatDateOfBirth = (text: string): string => {
    // Strip all non-digits
    const digits = text.replace(/\D/g, '');
    // Format as MM/DD/YYYY
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const updateField = (field: string, value: string) => {
    let formattedValue = value;
    if (field === 'phone') {
      formattedValue = formatPhoneNumber(value);
    } else if (field === 'dateOfBirth') {
      formattedValue = formatDateOfBirth(value);
    }
    setFormData({ ...formData, [field]: formattedValue });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join TeleHealth AI today</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.userTypeContainer}>
              <Text style={styles.label}>I am a</Text>
              <SegmentedButtons
                value={userType}
                onValueChange={(value) => setUserType(value as 'patient' | 'doctor')}
                buttons={[
                  { value: 'patient', label: '🧑‍⚕️ Patient' },
                  { value: 'doctor', label: '⚕️ Doctor' },
                ]}
              />
            </View>

            <TextInput
              label="Full Name"
              value={formData.fullName}
              onChangeText={(v) => updateField('fullName', v)}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
              error={!!errors.fullName}
            />
            <HelperText type="error" visible={!!errors.fullName}>
              {errors.fullName}
            </HelperText>

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
              error={!!errors.email}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>

            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(v) => updateField('phone', v)}
              mode="outlined"
              keyboardType="phone-pad"
              placeholder="(555) 123-4567"
              maxLength={14}
              left={<TextInput.Icon icon="phone" />}
              style={styles.input}
              error={!!errors.phone}
            />
            <HelperText type="error" visible={!!errors.phone}>
              {errors.phone}
            </HelperText>

            {userType === 'patient' && (
              <>
                <TextInput
                  label="Date of Birth (MM/DD/YYYY)"
                  value={formData.dateOfBirth}
                  onChangeText={(v) => updateField('dateOfBirth', v)}
                  mode="outlined"
                  keyboardType="number-pad"
                  placeholder="01/15/1990"
                  maxLength={10}
                  left={<TextInput.Icon icon="calendar" />}
                  style={styles.input}
                  error={!!errors.dateOfBirth}
                />
                <HelperText type="error" visible={!!errors.dateOfBirth}>
                  {errors.dateOfBirth}
                </HelperText>
              </>
            )}

            {userType === 'doctor' && (
              <>
                <TextInput
                  label="Medical License Number"
                  value={formData.licenseNumber}
                  onChangeText={(v) => updateField('licenseNumber', v)}
                  mode="outlined"
                  left={<TextInput.Icon icon="card-account-details" />}
                  style={styles.input}
                  error={!!errors.licenseNumber}
                />
                <HelperText type="error" visible={!!errors.licenseNumber}>
                  {errors.licenseNumber}
                </HelperText>
              </>
            )}

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              mode="outlined"
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              error={!!errors.password}
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              mode="outlined"
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-check" />}
              style={styles.input}
              error={!!errors.confirmPassword}
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>

            <TouchableOpacity
              style={[
                styles.checkboxContainer,
                agreedToTerms && styles.checkboxContainerChecked,
                !!errors.terms && styles.checkboxContainerError,
              ]}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <Checkbox
                status={agreedToTerms ? 'checked' : 'unchecked'}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                color={theme.colors.primary}
              />
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text style={styles.link}>Terms of Service</Text> and{' '}
                <Text style={styles.link}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            <HelperText type="error" visible={!!errors.terms}>
              {errors.terms}
            </HelperText>

            {errors.general && (
              <HelperText type="error" visible={!!errors.general} style={styles.generalError}>
                {errors.general}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Create Account
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
            >
              Already have an account? Sign In
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  form: {
    flex: 1,
  },
  userTypeContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.xs,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  checkboxContainerChecked: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}08`,
  },
  checkboxContainerError: {
    borderColor: theme.colors.error,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  generalError: {
    marginTop: spacing.sm,
  },
  registerButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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
  loginButton: {
    marginTop: spacing.sm,
  },
});
