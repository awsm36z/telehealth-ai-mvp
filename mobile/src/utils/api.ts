import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// Change this based on your environment:
// - iOS Simulator: http://localhost:3000
// - Android Emulator: http://10.0.2.2:3000
// - Physical Device: http://YOUR_COMPUTER_IP:3000 (e.g., http://192.168.1.5:3000)

const getBaseURL = () => {
  // Automatically detect the right URL based on platform
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api'; // Android emulator
  } else {
    return 'http://localhost:3000/api'; // iOS simulator or web
  }

  // For physical devices, uncomment and set your computer's IP:
  // return 'http://192.168.1.5:3000/api';
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
  login: async (email: string, password: string, userType: 'patient' | 'doctor') => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          userType,
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
      return {
        data: null,
        error: error.message || 'Registration failed',
      };
    }
  },

  // Triage
  triageChat: async (payload: { messages: any[]; patientId?: string }) => {
    try {
      console.log('📤 Sending triage request to:', `${API_URL}/triage/chat`);
      const response = await fetchWithTimeout(`${API_URL}/triage/chat`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Triage error:', data);

        // Provide more specific error messages
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

      // Provide more specific error messages
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

  // Video Calls
  createVideoRoom: async (patientId: string, sessionId?: string) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/video/create-room`, {
        method: 'POST',
        body: JSON.stringify({ patientId, sessionId }),
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
};

export default api;
