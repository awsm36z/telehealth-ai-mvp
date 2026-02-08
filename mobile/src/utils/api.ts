import { Platform } from 'react-native';

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

// Helper function for fetch requests
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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
      });

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
      });

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
      });

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
      });

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
      });

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
};

export default api;
