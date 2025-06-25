import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Badge, IconButton, Portal, Modal, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useAuth } from '../store/useAuth';
import * as SecureStore from 'expo-secure-store';

import DashboardScreen from '../screens/DashboardScreen';
import ReportsScreen from '../screens/ReportsScreen';
import MachinesScreen from '../screens/MachinesScreen';
import UsersScreen from '../screens/UsersScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function NotificationButton() {
  const [notificationCount, setNotificationCount] = useState(2);
  const navigation = useNavigation<any>();
  
  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };

  return (
    <TouchableOpacity onPress={handleNotificationPress} style={styles.headerButton}>
      <View style={styles.notificationContainer}>
        <MaterialCommunityIcons name="bell" size={22} color="#ff5252" />
        {notificationCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function LogoutButton() {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const navigation = useNavigation();
  
  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      const auth = useAuth.getState();
      
      await auth.logout();
      await auth.setSubdomain(null);
      await SecureStore.deleteItemAsync('subdomain');

      setLogoutModalVisible(false);
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Onboarding' }],
        })
      );
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={handleLogoutPress} style={styles.headerButton}>
        <MaterialCommunityIcons name="power" size={22} color="#ff5252" />
      </TouchableOpacity>
      
      <Portal>
        {logoutModalVisible && (
                     <BlurView intensity={25} tint="light" style={styles.modalBlurOverlay}>
            <TouchableOpacity 
              style={styles.modalContainer}
              activeOpacity={1}
              onPress={() => setLogoutModalVisible(false)}
            >
              <TouchableOpacity 
                style={styles.modalContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                              <LinearGradient
                  colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.98)']}
                  style={styles.modalGradient}
                >
              <View style={styles.modalIconContainer}>
                <MaterialCommunityIcons name="power" size={32} color="#ff5252" />
              </View>
              <Text style={styles.modalTitle}>Çıkış Yap</Text>
              <Text style={styles.modalMessage}>
                Uygulamadan çıkış yapmak istediğinizden emin misiniz?
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setLogoutModalVisible(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={confirmLogout} style={styles.confirmButton}>
                  <LinearGradient
                    colors={['#ff5252', '#ff1744']}
                    style={styles.confirmButtonGradient}
                  >
                    <Text style={styles.confirmButtonText}>Çıkış Yap</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
              </TouchableOpacity>
            </TouchableOpacity>
          </BlurView>
        )}
      </Portal>
    </>
  );
}

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }: any) {
  const getIcon = (routeName: string) => {
    switch (routeName) {
      case 'Dashboard':
        return 'home';
      case 'Machines':
        return 'factory';
      case 'Reports':
        return 'poll';
      case 'Users':
        return 'account-multiple';
      default:
        return 'circle';
    }
  };

  const getLabel = (routeName: string) => {
    switch (routeName) {
      case 'Dashboard':
        return 'Ana Sayfa';
      case 'Machines':
        return 'Makineler';
      case 'Reports':
        return 'Raporlar';
      case 'Users':
        return 'Kullanıcılar';
      default:
        return routeName;
    }
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarWrapper}>
        <BlurView intensity={30} tint="light" style={styles.tabBarBlur}>
          {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // Smooth tab transition with haptic feedback
              if (Platform.OS === 'ios') {
                // iOS haptic feedback import gerekiyor
              }
              navigation.navigate(route.name, undefined, {
                animationEnabled: true,
              });
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.tabItemInner,
                isFocused && styles.tabItemFocused
              ]}>
                <View style={isFocused ? styles.iconContainerFocused : styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={getIcon(route.name) as any}
                    size={isFocused ? 24 : 20}
                    color={isFocused ? '#ffffff' : '#64748b'}
                  />
                </View>
                <Text style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelFocused
                ]}>
                  {getLabel(route.name)}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
        </BlurView>
      </View>
    </View>
  );
}

export default function BottomNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        headerRight: () => (
          <View style={styles.headerButtons}>
            <NotificationButton />
            <LogoutButton />
          </View>
        ),
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: 'Ana Sayfa',
        }}
      />
      <Tab.Screen
        name="Machines"
        component={MachinesScreen}
        options={{
          headerTitle: 'Makineler',
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          headerTitle: 'Raporlar',
        }}
      />
      <Tab.Screen
        name="Users"
        component={UsersScreen}
        options={{
          headerTitle: 'Kullanıcılar',
        }}
      />

    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Header Styles
  header: {
    backgroundColor: '#ffffff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 8,
  },
  headerButton: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
  },
  
  // Notification Styles
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Modal Styles
  modalBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalContent: {
    width: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 30,
  },
  modalGradient: {
    padding: 28,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.2)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // Custom Tab Bar Styles
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  tabBarWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBarBlur: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 18,
    minHeight: 58,
    width: '100%',
  },
  tabItemFocused: {
    transform: [{ scale: 1.08 }, { translateY: -3 }],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
  },
  iconContainerFocused: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
    backgroundColor: '#ff5252',
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: 0.1,
    lineHeight: 11,
  },
  tabLabelFocused: {
    color: '#ff5252',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 12,
  },
}); 