import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useResponsive } from '../hooks/useResponsive';

// Doctor Screens
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';
import DoctorVideoCallScreen from '../screens/doctor/DoctorVideoCallScreen';
import PatientDetailsScreen from '../screens/doctor/PatientDetailsScreen';
import TriageAssessmentScreen from '../screens/doctor/TriageAssessmentScreen';
import DoctorMedicationAssistScreen from '../screens/doctor/DoctorMedicationAssistScreen';
import AsyncMessagesScreen from '../screens/shared/AsyncMessagesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack (includes video call and patient details)
function DashboardStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} />
      <Stack.Screen name="PatientDetails" component={PatientDetailsScreen} />
      <Stack.Screen name="TriageAssessment" component={TriageAssessmentScreen} />
      <Stack.Screen name="DoctorVideoCall" component={DoctorVideoCallScreen} />
      <Stack.Screen name="DoctorMedicationAssist" component={DoctorMedicationAssistScreen} />
      <Stack.Screen name="AsyncMessages" component={AsyncMessagesScreen} />
    </Stack.Navigator>
  );
}

export default function DoctorNavigator({ onLogout }: { onLogout: () => void }) {
  const { isTablet } = useResponsive();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outline,
          height: isTablet ? 82 : 90,
          paddingBottom: isTablet ? 14 : 30,
          paddingTop: isTablet ? 8 : 10,
        },
        tabBarLabelStyle: {
          fontSize: isTablet ? 13 : 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: 'Patients',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      >
        {props => <DoctorProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
