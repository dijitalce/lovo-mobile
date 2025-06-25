import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import BottomNavigator from './BottomNavigator';
import { useAuth } from '../store/useAuth';
import SubdomainScreen from '../screens/SubdomainScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MachineDetailScreen from '../screens/MachineDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { subdomain } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_right',
        animationDuration: 350,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
      initialRouteName={subdomain ? 'Drawer' : 'Onboarding'}
    >
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{
          animation: 'fade',
          animationDuration: 500,
        }}
      />
      <Stack.Screen 
        name="Subdomain" 
        component={SubdomainScreen}
        options={{
          animation: 'slide_from_right',
          animationDuration: 400,
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="MachineDetail" 
        component={MachineDetailScreen}
        options={{ 
          headerShown: true,
          title: 'Makine Detay',
          headerBackTitleVisible: false,
          animation: 'slide_from_right',
          animationDuration: 350,
          headerStyle: {
            backgroundColor: '#ff5252',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          headerShown: true,
          title: 'Bildirimler',
          headerBackTitleVisible: false,
          animation: 'slide_from_bottom',
          animationDuration: 400,
          presentation: 'modal',
          headerStyle: {
            backgroundColor: '#ff5252',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }}
      />

      {subdomain && (
        <Stack.Screen 
          name="Drawer" 
          component={BottomNavigator}
          options={{
            animation: 'fade',
            animationDuration: 600,
          }}
        />
      )}
    </Stack.Navigator>
  );
} 