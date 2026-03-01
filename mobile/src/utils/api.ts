import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const DEFAULT_LOCAL_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000/api'
  : 'http://localhost:3000/api';

const DEFAULT_CLOUD_BASE_URL = 'https://telehealth-backend-cn5a.onrender.com/api';
const ENV_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
const EXTRA_BASE_URL = ((Constants.expoConfig as any)?.extra?.apiBaseUrl || '').trim();

const getBaseURL = () => {
  if (ENV_BASE_URL) {
    return ENV_BASE_URL.replace(/\/$/, '');
  }

  if (EXTRA_BASE_URL) {
    return EXTRA_BASE_URL.replace(/\/$/, '');
  }

  if (!__DEV__) {
    return DEFAULT_CLOUD_BASE_URL;
  }

  return DEFAULT_LOCAL_BASE_URL;
};

const API_URL = getBaseURL();

console.log('🌐 API URL:', API_URL);

// Get auth token from storage
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function for fetch requests (with optional auth)
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 30000,
  includeAuth = false
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header for protected endpoints
    if (includeAuth) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// API Methods
const api = {
  // Authentication
  login: async (email: string, password: string, userType: 'patient' | 'doctor', language?: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          userType,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Login failed',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Login error:', error.message);
      if (error.message?.includes('Network request failed') || error.name === 'AbortError') {
        return {
          data: null,
          error: `Cannot connect to server (${API_URL}).`,
        };
      }
      return {
        data: null,
        error: error.message || 'Login failed',
      };
    }
  },

  register: async (userData: any) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Registration failed',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Registration error:', error.message);
      if (error.message?.includes('Network request failed') || error.name === 'AbortError') {
        return {
          data: null,
          error: `Cannot connect to server (${API_URL}).`,
        };
      }
      return {
        data: null,
        error: error.message || 'Registration failed',
      };
    }
  },

  getUserProfile: async (userId: string, userType: 'patient' | 'doctor') => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/auth/profile/${encodeURIComponent(userId)}?userType=${encodeURIComponent(userType)}`,
        {
          method: 'GET',
        },
        30000,
        true
      );

      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to fetch profile' };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error('Get profile error:', error.message);
      return { data: null, error: error.message || 'Failed to fetch profile' };
    }
  },

  updateUserLanguage: async (userId: string, userType: 'patient' | 'doctor', language: 'en' | 'fr' | 'ar') => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/profile/${encodeURIComponent(userId)}/language`, {
        method: 'PUT',
        body: JSON.stringify({ userType, language }),
      }, 30000, true);

      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to update language' };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error('Update language error:', error.message);
      return { data: null, error: error.message || 'Failed to update language' };
    }
  },

  // Triage
  triageChat: async (payload: { messages: any[]; patientId?: string; biometrics?: any; language?: string }) => {
    try {
      console.log('📤 Sending triage request to:', `${API_URL}/triage/chat`);
      const response = await fetchWithTimeout(`${API_URL}/triage/chat`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Triage error:', data);

        if (response.status === 500) {
          return {
            data: null,
            error: data.message || 'Server error. Check if OpenAI API key is configured.',
          };
        }

        return {
          data: null,
          error: data.message || 'Failed to process triage request',
        };
      }

      console.log('✅ Triage response received:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Triage error:', error.message);

      if (error.message.includes('Network request failed') || error.name === 'AbortError') {
        return {
          data: null,
          error: 'Cannot connect to server. Make sure the backend is running.',
        };
      }

      return {
        data: null,
        error: error.message || 'Failed to process triage request',
      };
    }
  },

  // Insights
  getInsights: async (patientId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/insights/${patientId}`, {
        method: 'GET',
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to get insights',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Get insights error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to get insights',
      };
    }
  },

  // Patients
  getPatientQueue: async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/patients/queue`, {
        method: 'GET',
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to get patient queue',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Get queue error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to get patient queue',
      };
    }
  },

  // Biometrics
  saveBiometrics: async (patientId: string, biometricData: any) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/patients/${patientId}/biometrics`, {
        method: 'POST',
        body: JSON.stringify(biometricData),
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to save biometrics',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Save biometrics error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to save biometrics',
      };
    }
  },

  getBiometrics: async (patientId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/patients/${patientId}/biometrics`, {
        method: 'GET',
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to get biometrics',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Get biometrics error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to get biometrics',
      };
    }
  },

  getPatient: async (patientId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/patients/${patientId}`, {
        method: 'GET',
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to get patient data',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Get patient error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to get patient data',
      };
    }
  },

  // Triage Data (for doctor view)
  getTriageData: async (patientId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/insights/${patientId}/triage`, {
        method: 'GET',
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to get triage data',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Get triage data error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to get triage data',
      };
    }
  },

  // AI Assist (Doctor)
  askAI: async (question: string, patientId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/ai-assist/ask`, {
        method: 'POST',
        body: JSON.stringify({ question, patientId }),
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to get AI response',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('AI assist error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to get AI response',
      };
    }
  },

  getMedicationInsights: async (payload: { patientId?: string; locale?: string; conversationSummary?: string }) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/medication-assist/insights`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, 45000, true);

      const data = await response.json();

      if (!response.ok) {
        const routeMissing = response.status === 404 || String(data.message || '').toLowerCase().includes('route');
        if (routeMissing) {
          // Backward-compatible fallback for older backends that only expose /ai-assist/ask.
          const fallbackResponse = await fetchWithTimeout(`${API_URL}/ai-assist/ask`, {
            method: 'POST',
            body: JSON.stringify({
              patientId: payload.patientId,
              question:
                `Provide concise clinical medication support for this consultation context.` +
                ` Locale: ${payload.locale || 'global'}.` +
                ` Conversation summary: ${payload.conversationSummary || 'N/A'}.` +
                ` Include: summary, considerations, contraindications, and possible medication options.` +
                ` This is assistive only, not a prescription.`,
            }),
          }, 45000, true);

          const fallbackData = await fallbackResponse.json();
          if (fallbackResponse.ok) {
            return {
              data: {
                summary: fallbackData.answer || 'Medication guidance generated.',
                insights: [],
                suggestedQuestions: [],
                possibleMedication: [],
                considerations: [],
                contraindications: [],
                provenance: 'ai-assist fallback',
                confidence: 'medium',
                disclaimer:
                  'AI assist only. This is not a prescription. Doctor must independently verify all facts before prescribing.',
              },
              error: null,
            };
          }
        }
        return { data: null, error: data.message || 'Failed to get medication insights' };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Medication insights error:', error.message);
      return { data: null, error: error.message || 'Failed to get medication insights' };
    }
  },

  askMedicationAI: async (payload: { patientId?: string; locale?: string; question: string }) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/medication-assist/chat`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, 45000, true);

      const data = await response.json();

      if (!response.ok) {
        const routeMissing = response.status === 404 || String(data.message || '').toLowerCase().includes('route');
        if (routeMissing) {
          // Backward-compatible fallback for deployments without medication-assist route.
          const fallbackResponse = await fetchWithTimeout(`${API_URL}/ai-assist/ask`, {
            method: 'POST',
            body: JSON.stringify({
              patientId: payload.patientId,
              question:
                `${payload.question}\n\n` +
                `Context: medication research for doctor workflow. Locale: ${payload.locale || 'global'}.\n` +
                `Important: this is assistive only, not a prescription. Include safety checks and contraindication reminders.`,
            }),
          }, 45000, true);
          const fallbackData = await fallbackResponse.json();

          if (!fallbackResponse.ok) {
            return { data: null, error: fallbackData.message || 'Failed to query medication assistant' };
          }

          return {
            data: {
              answer: fallbackData.answer,
              disclaimer:
                'AI assist only. This is not a prescription. Doctor must independently verify all facts before prescribing.',
              confidence: 'medium',
              provenance: 'ai-assist fallback',
            },
            error: null,
          };
        }
        return { data: null, error: data.message || 'Failed to query medication assistant' };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Medication chat error:', error.message);
      return { data: null, error: error.message || 'Failed to query medication assistant' };
    }
  },

  // Consultation Notes
  saveConsultationNotes: async (patientId: string, notes: string, roomName?: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/consultations/${patientId}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes, roomName }),
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to save notes',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Save notes error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to save notes',
      };
    }
  },

  completeConsultation: async (
    patientId: string,
    roomName?: string,
    doctorName?: string,
    doctorLanguage?: 'en' | 'fr' | 'ar',
    patientLanguage?: 'en' | 'fr' | 'ar'
  ) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/consultations/${patientId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ roomName, doctorName, doctorLanguage, patientLanguage }),
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to complete consultation',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Complete consultation error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to complete consultation',
      };
    }
  },

  getConsultationHistory: async (patientId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/consultations/${patientId}/history`, {
        method: 'GET',
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to get consultation history',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Get consultation history error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to get consultation history',
      };
    }
  },

  // Get all consultations across all patients for doctor history view (#91)
  getAllConsultations: async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/consultations/all`, {
        method: 'GET',
      }, 30000, true);
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to get consultations' };
      }
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get consultations' };
    }
  },

  // Update the report draft for the latest consultation (#99)
  updateConsultationReport: async (patientId: string, report: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/consultations/${encodeURIComponent(patientId)}/report`, {
        method: 'PATCH',
        body: JSON.stringify({ report }),
      }, 15000, true);
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to update report' };
      }
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to update report' };
    }
  },

  // Sign and finalize the consultation report (#99)
  signConsultationReport: async (
    patientId: string,
    payload: { report?: string; signerName: string; signatureMethod?: string }
  ) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/consultations/${encodeURIComponent(patientId)}/report/sign`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, 15000, true);
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to sign report' };
      }
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to sign report' };
    }
  },

  getMessageThread: async (patientId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/messages/${encodeURIComponent(patientId)}`, {
        method: 'GET',
      }, 30000, true);
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to get message thread' };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error('Get message thread error:', error.message);
      return { data: null, error: error.message || 'Failed to get message thread' };
    }
  },

  postThreadMessage: async (
    patientId: string,
    payload: { senderType: 'patient' | 'doctor'; senderName?: string; senderLanguage?: 'en' | 'fr' | 'ar'; message: string }
  ) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/messages/${encodeURIComponent(patientId)}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, 30000, true);
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to post message' };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error('Post message error:', error.message);
      return { data: null, error: error.message || 'Failed to post message' };
    }
  },

  // Video Calls
  createVideoRoom: async (patientId: string, sessionId?: string, patientName?: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/video/create-room`, {
        method: 'POST',
        body: JSON.stringify({ patientId, sessionId, patientName }),
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to create video room',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Create video room error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to create video room',
      };
    }
  },

  joinVideoRoom: async (roomName: string, userId: string, userName: string, userType: 'patient' | 'doctor') => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/video/join-room`, {
        method: 'POST',
        body: JSON.stringify({ roomName, userId, userName, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to join video room',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Join video room error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to join video room',
      };
    }
  },

  endVideoCall: async (roomName: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/video/end-call`, {
        method: 'POST',
        body: JSON.stringify({ roomName }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to end call',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('End call error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to end call',
      };
    }
  },

  // Analytics
  trackEvent: async (event: string, properties?: Record<string, any>) => {
    try {
      await fetchWithTimeout(`${API_URL}/analytics/track`, {
        method: 'POST',
        body: JSON.stringify({ event, properties }),
      }, 5000);
    } catch (error) {
      console.log('Analytics tracking failed (non-critical):', event);
    }
  },

  getActiveCalls: async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/video/active-calls`, {
        method: 'GET',
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Failed to get active calls',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Get active calls error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to get active calls',
      };
    }
  },

  // Translation
  translate: async (text: string, from: string, to: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/translate`, {
        method: 'POST',
        body: JSON.stringify({ text, from, to }),
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Translation failed',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Translate error:', error.message);
      return {
        data: null,
        error: error.message || 'Translation failed',
      };
    }
  },

  translateBatch: async (texts: string[], from: string, to: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/translate/batch`, {
        method: 'POST',
        body: JSON.stringify({ texts, from, to }),
      }, 60000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Batch translation failed',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Batch translate error:', error.message);
      return {
        data: null,
        error: error.message || 'Batch translation failed',
      };
    }
  },

  // Live Transcript & Insights
  addLiveTranscript: async (roomName: string, speaker: string, text: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/live-insights/transcript`, {
        method: 'POST',
        body: JSON.stringify({ roomName, speaker, text }),
      }, 10000, true);

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to add transcript' };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Add transcript error:', error.message);
      return { data: null, error: error.message || 'Failed to add transcript' };
    }
  },

  getLiveTranscript: async (roomName: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/live-insights/transcript/${encodeURIComponent(roomName)}`, {
        method: 'GET',
      }, 10000, true);

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to get transcript' };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Get transcript error:', error.message);
      return { data: null, error: error.message || 'Failed to get transcript' };
    }
  },

  analyzeLiveConversation: async (roomName: string, patientId?: string, locale?: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/live-insights/analyze`, {
        method: 'POST',
        body: JSON.stringify({ roomName, patientId, locale }),
      }, 30000, true);

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to analyze conversation' };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Analyze conversation error:', error.message);
      return { data: null, error: error.message || 'Failed to analyze conversation' };
    }
  },

  clearLiveTranscript: async (roomName: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/live-insights/transcript/${encodeURIComponent(roomName)}`, {
        method: 'DELETE',
      }, 10000, true);

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to clear transcript' };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Clear transcript error:', error.message);
      return { data: null, error: error.message || 'Failed to clear transcript' };
    }
  },

  addLiveTranscriptBatch: async (
    roomName: string,
    entries: Array<{ speaker: string; text: string }>,
    patientId?: string,
    locale?: string
  ) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/live-insights/transcript-batch`, {
        method: 'POST',
        body: JSON.stringify({ roomName, entries, patientId, locale }),
      }, 10000, true);

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.message || 'Failed to add transcript batch' };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Add transcript batch error:', error.message);
      return { data: null, error: error.message || 'Failed to add transcript batch' };
    }
  },

  getBaseURL: () => {
    return API_URL;
  },

  // Report Generation
  generateReport: async (patientId: string, doctorName: string, prescriptions?: string, instructions?: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/ai-assist/generate-report`, {
        method: 'POST',
        body: JSON.stringify({ patientId, doctorName, prescriptions, instructions }),
      }, 60000, true);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.message || 'Report generation failed',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Generate report error:', error.message);
      return {
        data: null,
        error: error.message || 'Report generation failed',
      };
    }
  },

  // OpenAI Realtime Voice Session
  createRealtimeSession: async (language: string, patientId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/realtime/session`, {
        method: 'POST',
        body: JSON.stringify({ language, patientId }),
      }, 15000);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.error || 'Failed to create realtime session',
        };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Realtime session error:', error.message);
      return {
        data: null,
        error: error.message || 'Failed to create realtime session',
      };
    }
  },

  // Text-to-Speech
  getTtsAudioUrl: (text: string, voice: string = 'nova') => {
    return `${API_URL}/tts`;
  },

  fetchTtsAudio: async (text: string, voice: string = 'nova'): Promise<{ data: ArrayBuffer | null; error: string | null }> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/tts`, {
        method: 'POST',
        body: JSON.stringify({ text, voice }),
      }, 15000, true);

      if (!response.ok) {
        return { data: null, error: 'TTS request failed' };
      }

      const buffer = await response.arrayBuffer();
      return { data: buffer, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'TTS failed' };
    }
  },
};

export default api;
