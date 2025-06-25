import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  ActivityIndicator,
  IconButton,
  Surface,
  Button,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'machine_online' | 'machine_offline' | 'info';
  timestamp: Date;
  machineId?: number;
  workingTime?: number;
  isRead: boolean;
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;



  useEffect(() => {
    loadNotifications();
    animateIn();
  }, []);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Test bildirimlerini oluştur
      const testNotifications: NotificationItem[] = [
        {
          id: '1',
          title: '🟢 Makine Açıldı',
          message: 'ARABALI TESTERE BURDUR makinesi çalışmaya başladı',
          type: 'machine_online',
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 dakika önce
          machineId: 4,
          isRead: false,
        },
        {
          id: '2',
          title: '🔴 Makine Kapandı',
          message: 'ARABALI TESTERE ISPARTA makinesi durdu',
          type: 'machine_offline',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat önce
          machineId: 6,
          workingTime: 5 * 60 + 30, // 5 saat 30 dakika
          isRead: false,
        },
        {
          id: '3',
          title: '🟢 Makine Açıldı',
          message: 'PRIZMA TESTERE ISPARTA makinesi çalışmaya başladı',
          type: 'machine_online',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 saat önce
          machineId: 5,
          isRead: true,
        },
        {
          id: '4',
          title: '🔴 Makine Kapandı',
          message: 'PRIZMA TESTERE ISPARTA makinesi durdu',
          type: 'machine_offline',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 saat önce
          machineId: 5,
          workingTime: 8 * 60 + 15, // 8 saat 15 dakika
          isRead: true,
        },
        {
          id: '5',
          title: 'ℹ️ Sistem Bildirimi',
          message: 'Bildirim sistemi aktifleştirildi',
          type: 'info',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 gün önce
          isRead: true,
        },
      ];
      
      setNotifications(testNotifications);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'machine_online':
        return 'play-circle';
      case 'machine_offline':
        return 'stop-circle';
      default:
        return 'information';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'machine_online':
        return '#4CAF50';
      case 'machine_offline':
        return '#f44336';
      default:
        return '#2196F3';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  const formatWorkingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} dakika`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} saat`;
      } else {
        return `${hours} saat ${remainingMinutes} dakika`;
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderNotificationCard = (notification: NotificationItem, index: number) => (
    <Animated.View
      key={notification.id}
      style={[
        styles.notificationCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity 
        onPress={() => markAsRead(notification.id)}
        activeOpacity={0.7}
      >
        <Surface style={[
          styles.cardSurface,
          !notification.isRead && styles.unreadCard
        ]} elevation={2}>
          <View style={styles.cardHeader}>
            <View style={styles.notificationInfo}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: getNotificationColor(notification.type) }
              ]}>
                <MaterialCommunityIcons
                  name={getNotificationIcon(notification.type) as any}
                  size={20}
                  color="#ffffff"
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[
                  styles.notificationTitle,
                  !notification.isRead && styles.unreadTitle
                ]}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                {notification.workingTime && (
                  <Text style={styles.workingTime}>
                    ⏱️ Çalışma Süresi: {formatWorkingTime(notification.workingTime)}
                  </Text>
                )}
                <Text style={styles.timestamp}>
                  {formatTimestamp(notification.timestamp)}
                </Text>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              {!notification.isRead && (
                <View style={styles.unreadDot} />
              )}
              <IconButton
                icon="delete"
                size={20}
                iconColor="#f44336"
                onPress={() => deleteNotification(notification.id)}
                style={styles.deleteButton}
              />
            </View>
          </View>
        </Surface>
      </TouchableOpacity>
    </Animated.View>
  );

  // Loading ekranı
  if (loading) {
    return (
      <LinearGradient colors={['#fafafa', '#f5f5f5']} style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ff5252" />
          <Text style={styles.loadingMainText}>Bildirimler yükleniyor...</Text>
          <Text style={styles.loadingSubText}>Lütfen bekleyin</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#fafafa', '#f5f5f5']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff5252']} />}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <Card style={styles.headerCard}>
            <LinearGradient
              colors={['#ff5252', '#ff1744']}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <Text style={styles.headerTitle}>🔔 Bildirimler</Text>
                  <Text style={styles.headerSubtitle}>
                    {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={styles.notificationCountContainer}>
                    <Text style={styles.notificationCountNumber}>{notifications.length}</Text>
                    <Text style={styles.notificationCountLabel}>toplam</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Card>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <View style={styles.actionButtonsContainer}>
              <Button
                mode="outlined"
                onPress={markAllAsRead}
                style={styles.actionButton}
                textColor="#ff5252"
                icon="check-all"
                disabled={unreadCount === 0}
              >
                Tümünü Okundu Yap
              </Button>
              <Button
                mode="outlined"
                onPress={clearAllNotifications}
                style={styles.actionButton}
                textColor="#f44336"
                icon="delete-sweep"
              >
                Tümünü Sil
              </Button>
            </View>
          )}

          {/* Notifications List */}
          {notifications.length > 0 ? (
            <View style={styles.notificationsList}>
              {notifications.map((notification, index) => renderNotificationCard(notification, index))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>Henüz bildirim bulunmuyor</Text>
              <Text style={styles.emptySubText}>Makine durumu değişiklikleri burada görünecek</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>


    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingMainText: {
    marginTop: 20,
    color: '#2c3e50',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubText: {
    marginTop: 8,
    color: '#7f8c8d',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  headerGradient: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  notificationCountContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  notificationCountNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  notificationCountLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderColor: '#ff5252',
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    marginBottom: 4,
  },
  cardSurface: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff5252',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  notificationInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#5a6c7d',
    lineHeight: 18,
    marginBottom: 4,
  },
  workingTime: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff5252',
    marginRight: 8,
  },
  deleteButton: {
    margin: 0,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
}); 