import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Platform } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import ReportsScreen from '../screens/ReportsScreen';
import MachinesScreen from '../screens/MachinesScreen';
import UsersScreen from '../screens/UsersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LogoutScreen from '../screens/LogoutScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const theme = useTheme();
  return (
    <Drawer.Navigator
      screenOptions={{
        headerTintColor: theme.colors.primary,
        drawerActiveTintColor: theme.colors.primary,
        drawerType: Platform.OS === 'ios' ? 'slide' : 'front',
        drawerStyle: {
          backgroundColor: '#ffffff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
          marginLeft: -10,
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 8,
          marginVertical: 2,
        },
        drawerActiveBackgroundColor: 'rgba(255, 82, 82, 0.1)',
        sceneContainerStyle: {
          backgroundColor: '#f8fafc',
        },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-chart" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Machines"
        component={MachinesScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot-industrial" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Users"
        component={UsersScreen}
        options={{
          drawerLabel: 'Kullanıcılar',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          drawerLabel: 'Bildirimler',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Logout"
        component={LogoutScreen}
        options={{
          drawerItemStyle: { marginTop: 'auto' },
          drawerLabel: 'Çıkış Yap',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="logout" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
} 