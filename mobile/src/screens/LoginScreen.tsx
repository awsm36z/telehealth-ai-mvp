import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, spacing, shadows } from '../theme';
import api from '../utils/api';

export default function LoginScreen({ navigation, onLogin }: any) {
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    const response = await api.login(email, password, userType);

    if (response.error) {
      setError(response.error);
      setLoading(false);
      return;
    }

    const { token, user } = response.data;
    await onLogin(token, user.type);
    setLoading(false);
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
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.userTypeContainer}>
              <Text style={styles.label}>I am a</Text>
              <SegmentedButtons
                value={userType}
                onValueChange={(value) => setUserType(value as 'patient' | 'doctor')}
                buttons={[
                  {
                    value: 'patient',
                    label: '🧑‍⚕️ Patient',
                    style: userType === 'patient' ? styles.segmentActive : styles.segment,
                  },
                  {
                    value: 'doctor',
                    label: '⚕️ Doctor',
                    style: userType === 'doctor' ? styles.segmentActive : styles.segment,
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon="email" />}
                style={styles.input}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
              />
            </View>

            {error ? (
              <HelperText type="error" visible={!!error} style={styles.errorText}>
                {error}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Sign In
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              style={styles.registerButton}
            >
              Don't have an account? Sign Up
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
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
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
  segmentedButtons: {
    borderRadius: theme.roundness,
  },
  segment: {
    backgroundColor: theme.colors.surface,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    marginBottom: spacing.sm,
  },
  loginButton: {
    marginTop: spacing.md,
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
  registerButton: {
    marginTop: spacing.sm,
  },
});
