import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Text, IconButton, Surface, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

export default function VideoCallScreen({ route, navigation }: any) {
  const { roomName, patientId } = route.params;

  const [isConnecting, setIsConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dailyJoinUrl, setDailyJoinUrl] = useState<string | null>(null);

  const callStartTime = useRef<number | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    joinCall();

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const joinCall = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const storedName = await AsyncStorage.getItem('userName');
      const participantName = storedName?.trim() || 'Patient';
      const response = await api.joinVideoRoom(roomName, patientId, participantName, 'patient');
      if (response.error) {
        throw new Error(response.error);
      }

      const roomUrl = response.data?.roomUrl;
      const token = response.data?.token;
      if (!roomUrl || !token) {
        throw new Error('Video room token is missing. Please try again.');
      }

      const separator = roomUrl.includes('?') ? '&' : '?';
      const joinUrl = `${roomUrl}${separator}t=${encodeURIComponent(token)}`;

      setDailyJoinUrl(joinUrl);
      setIsConnecting(false);
      console.log('✅ Joined Daily call:', roomName);
    } catch (joinError: any) {
      console.error('Failed to join call:', joinError);
      setError(joinError.message || 'Failed to join video call');
      setIsConnecting(false);

      Alert.alert(
        'Connection Failed',
        'Unable to connect to the video call. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const startCallTimer = () => {
    if (callStartTime.current) return;

    callStartTime.current = Date.now();
    timerInterval.current = setInterval(() => {
      if (!callStartTime.current) return;
      const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
      setCallDuration(duration);
    }, 1000);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const endCall = async () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.endVideoCall(roomName);
            } catch (endError) {
              console.error('Error ending call:', endError);
            } finally {
              if (timerInterval.current) {
                clearInterval(timerInterval.current);
              }
              navigation.navigate('PatientHome');
            }
          },
        },
      ]
    );
  };

  if (isConnecting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Connecting to doctor...</Text>
          <Text style={styles.loadingSubtext}>Preparing secure Daily video room</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !dailyJoinUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>{error || 'Unable to load video room.'}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.errorButton}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        <WebView
          source={{ uri: dailyJoinUrl }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          onLoadEnd={startCallTimer}
          onError={(webError) => {
            console.error('Daily webview error:', webError.nativeEvent);
            setError('Video call failed to load.');
          }}
          onHttpError={(syntheticEvent) => {
            const { statusCode } = syntheticEvent.nativeEvent;
            console.error(`WebView HTTP error: ${statusCode}`);
            if (statusCode >= 400) {
              setError(`Video room returned error ${statusCode}`);
            }
          }}
        />

        <View style={styles.callInfoOverlay} pointerEvents="none">
          <Surface style={[styles.callInfoBadge, shadows.medium]}>
            <MaterialCommunityIcons name="circle" size={8} color="#4CAF50" />
            <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
          </Surface>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <Surface style={[styles.controlsPanel, shadows.large]}>
          <View style={styles.controlButton}>
            <IconButton
              icon="information"
              size={26}
              iconColor="#FFFFFF"
              style={[styles.iconButton, styles.iconButtonActive]}
              onPress={() =>
                Alert.alert('Daily controls', 'Use the on-screen mic/camera controls inside the call window.')
              }
            />
            <Text style={styles.controlLabel}>Help</Text>
          </View>

          <View style={styles.controlButton}>
            <IconButton
              icon="phone-hangup"
              size={32}
              iconColor="#FFFFFF"
              style={[styles.iconButton, styles.iconButtonEnd]}
              onPress={endCall}
            />
            <Text style={styles.controlLabel}>End</Text>
          </View>
        </Surface>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  loadingSubtext: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.lg,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: spacing.xl,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  callInfoOverlay: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
  },
  callInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: theme.roundness * 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: spacing.sm,
  },
  callDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  controlsContainer: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  controlsPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: theme.roundness * 3,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
  },
  controlButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    margin: 0,
  },
  iconButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  iconButtonEnd: {
    backgroundColor: theme.colors.error,
  },
  controlLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
