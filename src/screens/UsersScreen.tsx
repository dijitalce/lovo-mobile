import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  ActivityIndicator,
  Surface,
  Chip,
  IconButton,
  FAB,
  Snackbar,
  Avatar,
  Badge,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../store/useAuth';

const { width } = Dimensions.get('window');

interface User {
  id: number;
  username: string;
  full_name: string;
  phone: string;
  status: 'active' | 'inactive';
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  today_registrations: number;
}

export default function UsersScreen() {
  const { subdomain } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  // Artık filteredUsers kullanılmıyor
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    today_registrations: 0,
  });
  const [error, setError] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchUsers();
    animateIn();
    
    // 30 saniyede bir otomatik yenileme
    const interval = setInterval(() => {
      fetchUsers(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // useEffect kaldırıldı, filtreleme yok

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

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError('');

      // Subdomain'i temizle
      const cleanSubdomain = subdomain?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/İ/g, 'i')
        .replace(/I/g, 'i')
        .replace(/Ğ/g, 'g')
        .replace(/Ü/g, 'u')
        .replace(/Ş/g, 's')
        .replace(/Ö/g, 'o')
        .replace(/Ç/g, 'c')
        .replace(/\u0130/g, 'i')
        .replace(/\u0131/g, 'i')
        .replace(/[^\x00-\x7F]/g, '')
        .trim();

      let response;
      try {
        // HTTPS ile dene
        response = await fetch(`https://${cleanSubdomain}.lovo.com.tr/api/users.php`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch (httpsError) {
        // HTTP ile dene
        response = await fetch(`http://${cleanSubdomain}.lovo.com.tr/api/users.php`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Users API Response:', data);

        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          calculateStats(data.users);
        } else {
          setUsers([]);
          calculateStats([]);
        }
      } else {
        throw new Error('API isteği başarısız');
      }
    } catch (err: any) {
      console.error('Users fetch error:', err);
      setError('Kullanıcılar yüklenirken hata oluştu');
      setSnackVisible(true);
      
      // Hata durumunda sample data oluştur
      const sampleUsers = generateSampleUsers();
      setUsers(sampleUsers);
      calculateStats(sampleUsers);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateSampleUsers = (): User[] => {
    return [
      {
        id: 1,
        username: 'admin',
        full_name: 'Sistem Yöneticisi',
        phone: '+90 532 123 4567',
        status: 'active'
      },
      {
        id: 2,
        username: 'operator1',
        full_name: 'Ahmet Öztürk',
        phone: '+90 532 234 5678',
        status: 'active'
      },
      {
        id: 3,
        username: 'operator2',
        full_name: 'Mehmet Kaya',
        phone: '+90 532 345 6789',
        status: 'inactive'
      },
      {
        id: 4,
        username: 'supervisor',
        full_name: 'Ayşe Demir',
        phone: '+90 532 456 7890',
        status: 'active'
      },
    ];
  };

  const calculateStats = (userData: User[]) => {
    const totalUsers = userData.length;
    const activeUsers = userData.filter(user => user.status === 'active').length;
    const inactiveUsers = userData.filter(user => user.status === 'inactive').length;
    
    // Bugünün tarihi için örnek hesaplama (gerçek veri olmadığı için sabit değer)
    const todayRegistrations = Math.floor(totalUsers * 0.1); // %10'u bugün kayıt olmuş varsayalım

    setStats({
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      today_registrations: todayRegistrations,
    });
  };

  // Filtreleme kaldırıldı, direkt users kullanılıyor

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'inactive':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'inactive':
        return 'Pasif';
      default:
        return 'Bilinmiyor';
    }
  };

  const getAvatarText = (fullName: string) => {
    return fullName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleUserAction = (userId: number, action: 'edit' | 'delete' | 'toggle') => {
    Alert.alert(
      'Kullanıcı İşlemi',
      `${action} işlemi henüz implementasyona alınmamış.`,
      [{ text: 'Tamam' }]
    );
  };

  const renderUserCard = (user: User, index: number) => (
    <Animated.View
      key={user.id}
      style={[
        styles.userCard,
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
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <Avatar.Text 
                size={48} 
                label={getAvatarText(user.full_name)}
                style={[styles.avatar, { backgroundColor: getStatusColor(user.status) }]}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.full_name}</Text>
                <Text style={styles.userUsername}>@{user.username}</Text>
                <Text style={styles.userPhone}>{user.phone}</Text>
              </View>
            </View>
            <View style={styles.userActions}>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getStatusColor(user.status) }]}
                textStyle={styles.statusText}
              >
                {getStatusText(user.status)}
              </Chip>
              <View style={styles.actionButtons}>
                <IconButton
                  icon="pencil"
                  size={20}
                  iconColor="#ff5252"
                  onPress={() => handleUserAction(user.id, 'edit')}
                />
                <IconButton
                  icon={user.status === 'active' ? 'pause' : 'play'}
                  size={20}
                  iconColor="#2196F3"
                  onPress={() => handleUserAction(user.id, 'toggle')}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  iconColor="#f44336"
                  onPress={() => handleUserAction(user.id, 'delete')}
                />
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#fafafa', '#f5f5f5']} style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ff5252" />
          <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
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
                  <Text style={styles.headerTitle}>👥 Kullanıcı Yönetimi</Text>
                  <Text style={styles.headerSubtitle}>Sistem kullanıcılarını yönetin</Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={styles.userCountContainer}>
                    <Text style={styles.userCountNumber}>{stats.total_users}</Text>
                    <Text style={styles.userCountLabel}>kullanıcı</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Card>



          {/* Kullanıcı Listesi */}
          <Card style={styles.resultsCard}>
            <Card.Content>
              {users.length > 0 ? (
                <View style={styles.usersList}>
                  {users.map((user, index) => renderUserCard(user, index))}
                </View>
              ) : (
                <Surface style={styles.noDataContainer}>
                  <Text style={styles.noDataIcon}>👤</Text>
                  <Text style={styles.noDataText}>Kullanıcı bulunamadı</Text>
                  <Text style={styles.noDataSubText}>Arama kriterlerinizi değiştirerek tekrar deneyin</Text>
                </Surface>
              )}
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>
      
      <FAB
        icon="account-plus"
        style={styles.fab}
        onPress={() => handleUserAction(0, 'edit')}
        label="Yeni Kullanıcı"
        color="#ffffff"
      />
      
      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={5000}
        style={styles.snackbar}
        action={{
          label: 'Tekrar Dene',
          onPress: () => {
            setSnackVisible(false);
            fetchUsers(false);
          },
          textColor: '#ff5252'
        }}
      >
        {error}
      </Snackbar>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#7f8c8d',
    fontSize: 16,
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
  userCountContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userCountNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  userCountLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  resultsCard: {
    borderRadius: 12,
    elevation: 2,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    marginBottom: 4,
  },
  card: {
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  cardContent: {
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 16,
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#95a5a6',
  },
  userActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusChip: {
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 120,
    backgroundColor: '#ff5252',
  },
  snackbar: {
    backgroundColor: '#2c3e50',
  },
}); 