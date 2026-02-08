import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PatientNavigator from './src/navigation/PatientNavigator';
import DoctorNavigator from './src/navigation/DoctorNavigator';

// Import theme colors only
import { theme } from './src/theme';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

// Minimal theme - only colors, use default fonts
const appTheme = {
  ...MD3LightTheme,
  colors: theme.colors,
  roundness: theme.roundness,
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<'patient' | 'doctor' | null>(null);

  // Initialize font system (even with empty fonts) to prevent errors
  const [fontsLoaded] = useFonts({
    // Empty object - we're using system fonts, but this initializes the font system
  });

  useEffect(() => {
    console.log('Fonts loaded:', fontsLoaded);
    if (fontsLoaded) {
      console.log('Starting auth check...');
      checkAuth();
    }
  }, [fontsLoaded]);

  const checkAuth = async () => {
    try {
      console.log('Checking auth...');
      const token = await AsyncStorage.getItem('userToken');
      const type = await AsyncStorage.getItem('userType');
      console.log('Token:', token, 'Type:', type);
      setUserToken(token);
      setUserType(type as 'patient' | 'doctor' | null);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setTimeout(async () => {
        console.log('Setting isLoading to false');
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }, 1000);
    }
  };

  const handleLogin = async (token: string, type: 'patient' | 'doctor') => {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userType', type);
    setUserToken(token);
    setUserType(type);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userType');
    setUserToken(null);
    setUserType(null);
  };

  // Wait for fonts to initialize
  if (!fontsLoaded || isLoading) {
    console.log('Still loading... fontsLoaded:', fontsLoaded, 'isLoading:', isLoading);
    return null; // Splash screen is showing
  }

  console.log('Rendering main app. UserToken:', userToken, 'UserType:', userType);

  return (
    <PaperProvider theme={appTheme}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!userToken ? (
              <>
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login">
                  {props => <LoginScreen {...props} onLogin={handleLogin} />}
                </Stack.Screen>
                <Stack.Screen name="Register">
                  {props => <RegisterScreen {...props} onRegister={handleLogin} />}
                </Stack.Screen>
              </>
            ) : userType === 'patient' ? (
              <Stack.Screen name="PatientMain">
                {props => <PatientNavigator {...props} onLogout={handleLogout} />}
              </Stack.Screen>
            ) : (
              <Stack.Screen name="DoctorMain">
                {props => <DoctorNavigator {...props} onLogout={handleLogout} />}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
