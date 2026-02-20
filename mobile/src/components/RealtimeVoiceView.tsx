import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import api from '../utils/api';

export interface RealtimeVoiceHandle {
  endSession: () => void;
  muteAudio: () => void;
  unmuteAudio: () => void;
}

interface RealtimeVoiceViewProps {
  visible: boolean;
  patientId: string;
  language: string;
  onTranscript: (message: { role: 'ai' | 'user'; content: string }) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onUserSpeaking?: (speaking: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

const RealtimeVoiceView = forwardRef<RealtimeVoiceHandle, RealtimeVoiceViewProps>(
  ({ visible, patientId, language, onTranscript, onConnected, onDisconnected, onUserSpeaking, onError, onEnd }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [htmlUri, setHtmlUri] = useState<string | null>(null);
    const sessionStarted = useRef(false);

    // Load HTML asset
    useEffect(() => {
      (async () => {
        try {
          const asset = Asset.fromModule(require('../../assets/realtime-voice.html'));
          await asset.downloadAsync();
          setHtmlUri(asset.localUri || asset.uri);
        } catch (e) {
          console.error('Failed to load realtime-voice.html:', e);
        }
      })();
    }, []);

    const sendToWebView = useCallback((message: object) => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify(message));
      }
    }, []);

    useImperativeHandle(ref, () => ({
      endSession: () => {
        sendToWebView({ type: 'end' });
        sessionStarted.current = false;
      },
      muteAudio: () => {
        sendToWebView({ type: 'mute' });
      },
      unmuteAudio: () => {
        sendToWebView({ type: 'unmute' });
      },
    }), [sendToWebView]);

    const initSession = useCallback(async () => {
      if (sessionStarted.current) return;
      sessionStarted.current = true;

      try {
        const response = await api.createRealtimeSession(language, patientId);
        if (!response.data?.clientSecret) {
          onError?.('Failed to get realtime session token');
          sessionStarted.current = false;
          return;
        }

        sendToWebView({
          type: 'start',
          config: {
            clientSecret: response.data.clientSecret,
            model: 'gpt-4o-realtime-preview',
          },
        });
      } catch (err: any) {
        console.error('Realtime session init error:', err);
        onError?.(err.message || 'Failed to initialize realtime session');
        sessionStarted.current = false;
      }
    }, [language, patientId, sendToWebView, onError]);

    const handleMessage = useCallback((event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case 'connected':
            onConnected?.();
            break;
          case 'session_started':
            // Session is live
            break;
          case 'ai_transcript':
            if (data.content) {
              onTranscript({ role: 'ai', content: data.content });
            }
            break;
          case 'user_transcript':
            if (data.content) {
              onTranscript({ role: 'user', content: data.content });
            }
            break;
          case 'user_speaking':
            onUserSpeaking?.(true);
            break;
          case 'user_stopped_speaking':
            onUserSpeaking?.(false);
            break;
          case 'response_done':
            // AI finished a response turn
            break;
          case 'disconnected':
            onDisconnected?.();
            break;
          case 'session_ended':
            onEnd?.();
            break;
          case 'error':
            console.error('Realtime WebView error:', data.message);
            onError?.(data.message || 'Realtime error');
            break;
        }
      } catch (e) {
        // ignore parse errors
      }
    }, [onTranscript, onConnected, onDisconnected, onUserSpeaking, onError, onEnd]);

    if (!visible || !htmlUri) return null;

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: htmlUri }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          mediaCapturePermissionGrantType="grant"
          onMessage={handleMessage}
          onLoad={() => {
            // WebView loaded — start the realtime session
            initSession();
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            onError?.('WebView failed to load');
          }}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
  webview: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default RealtimeVoiceView;
