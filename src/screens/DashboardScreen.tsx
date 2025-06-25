import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Dimensions, Animated } from 'react-native';
import { Card, Text, ActivityIndicator, Chip, Button, Snackbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { createApi } from '../services/api';
import { useAuth } from '../store/useAuth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { notificationService, useInAppNotifications } from '../services/notifications';
import InAppNotification from '../components/InAppNotification';

const { width } = Dimensions.get('window');

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Drawer'>;

interface Machine {
  id: number;
  name: string;
  ftp_ip: string;
  ftp_port: number;
  total_logs: number;
  total_shell_volume: string;
  total_net_volume: string;
  total_gross_volume: string;
  statusClass: string;
  statusText: string;
  last_backup: string;
}

interface DashboardResponse {
  machines: Machine[];
  totals: {
    total_logs: number;
    total_shell_volume: string;
    total_net_volume: string;
    total_gross_volume: string;
  };
}

export default function DashboardScreen() {
  const { subdomain } = useAuth();
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackVisible, setSnackVisible] = useState(false);
  const [previousMachineStatuses, setPreviousMachineStatuses] = useState<Map<number, string>>(new Map());
  
  // Bildirim hook'u
  const {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  } = useInAppNotifications();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const api = createApi();

  // Makine durumu değişikliklerini kontrol et
  const checkMachineStatusChanges = (machines: Machine[]) => {
    machines.forEach((machine) => {
      const previousStatus = previousMachineStatuses.get(machine.id);
      const currentStatus = machine.statusText;
      
      if (previousStatus && previousStatus !== currentStatus) {
        // Durum değişikliği tespit edildi
        if (currentStatus === 'Çevrimiçi' && previousStatus === 'Çevrimdışı') {
          // Makine açıldı
          addNotification({
            title: '🟢 Makine Açıldı',
            message: `${machine.name} makinesi çalışmaya başladı`,
            type: 'machine_online',
            machineId: machine.id,
          });
          
          // Notification service'e de bildir
          notificationService.updateMachineStatus({
            id: machine.id,
            name: machine.name,
            status: 'online',
            lastSeen: new Date(),
          });
        } else if (currentStatus === 'Çevrimdışı' && previousStatus === 'Çevrimiçi') {
          // Makine kapandı
          addNotification({
            title: '🔴 Makine Kapandı',
            message: `${machine.name} makinesi durdu`,
            type: 'machine_offline',
            machineId: machine.id,
          });
          
          // Notification service'e de bildir
          notificationService.updateMachineStatus({
            id: machine.id,
            name: machine.name,
            status: 'offline',
            lastSeen: new Date(),
          });
        }
      }
      
      // Mevcut durumu kaydet
      previousMachineStatuses.set(machine.id, currentStatus);
    });
    
    setPreviousMachineStatuses(new Map(previousMachineStatuses));
  };

  const fetchData = async () => {
    try {
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
      
      console.log('=== DASHBOARD API DEBUG ===');
      console.log('Original subdomain:', subdomain);
      console.log('Clean subdomain:', cleanSubdomain);
      console.log('Base URL:', `https://${cleanSubdomain}.lovo.com.tr/api/`);
      console.log('Full URL:', `https://${cleanSubdomain}.lovo.com.tr/api/dashboard.php`);
      
      const res = await api.get<DashboardResponse>('dashboard.php');
      console.log('✅ Dashboard API başarılı:', res.data);
      setData(res.data);
      
      // Makine durumu değişikliklerini kontrol et
      if (res.data?.machines) {
        checkMachineStatusChanges(res.data.machines);
      }
      
      // Veri yüklendiğinde animasyon başlat
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (e: any) {
      console.error('❌ API ERROR:', e.message);
      console.error('Error details:', {
        code: e.code,
        status: e.response?.status,
        data: e.response?.data,
        url: e.config?.url
      });
      
      // Gerçek API'ye HTTP ile deneyelim
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
        
      try {
        console.log('🔄 HTTP Fallback denemesi...');
        const httpUrl = `http://${cleanSubdomain}.lovo.com.tr/api/dashboard.php`;
        console.log('HTTP URL:', httpUrl);
        
        const httpResponse = await fetch(httpUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        
        console.log('HTTP Status:', httpResponse.status);
        
        if (httpResponse.ok) {
          const httpData = await httpResponse.json();
          console.log('✅ HTTP başarılı:', httpData);
          setData(httpData);
          
          // Makine durumu değişikliklerini kontrol et
          if (httpData?.machines) {
            checkMachineStatusChanges(httpData.machines);
          }
          
          // HTTP başarılı olursa animasyon
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();
          
          return;
        } else {
          console.error('❌ HTTP Error:', httpResponse.status, await httpResponse.text());
        }
      } catch (httpError: any) {
        console.error('❌ HTTP fallback başarısız:', httpError.message);
      }
      
      // Hiçbir şekilde bağlanamadık
      setError('API\'ye bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
      setSnackVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (subdomain) fetchData();
  }, [subdomain]);

  // Otomatik yenileme için interval
  useEffect(() => {
    if (!subdomain) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 saniyede bir
    
    return () => clearInterval(interval);
  }, [subdomain]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'çevrimiçi':
      case 'online':
        return '#4caf50';
      case 'çevrimdışı':
      case 'offline':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'çevrimiçi':
      case 'online':
        return '🟢';
      case 'çevrimdışı':
      case 'offline':
        return '🔴';
      default:
        return '🟡';
    }
  };

  if (loading) {
    return (
      <LinearGradient 
        colors={['#ffffff', '#f8faff']} 
        style={styles.loaderContainer}
      >
        <ActivityIndicator animating size="large" color="#ff5252" />
        <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
      </LinearGradient>
    );
  }

  const renderStatsCard = () => (
    <Animated.View 
      style={[
        styles.statsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Haziran Ayı Toplam Tomruk Sayısı */}
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statIcon}>
          <Text style={styles.statIconText}>📊</Text>
        </View>
        <Text style={styles.statTitle}>Haziran Ayı</Text>
        <Text style={styles.statSubtitle}>Toplam Tomruk Sayısı</Text>
        <Text style={styles.statValue}>{data?.totals.total_logs?.toLocaleString() || '0'}</Text>
      </LinearGradient>

      {/* Toplam Net Tomruk Hacmi */}
      <LinearGradient
        colors={['#00BCD4', '#0097A7']}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statIcon}>
          <Text style={styles.statIconText}>📏</Text>
        </View>
        <Text style={styles.statTitle}>Haziran Ayı</Text>
        <Text style={styles.statSubtitle}>Toplam Net Tomruk Hacmi (m³)</Text>
        <Text style={styles.statValue}>{data?.totals.total_net_volume || '0.00'}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderMachineItem = ({ item, index }: { item: Machine; index: number }) => (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ 
            translateY: Animated.add(slideAnim, new Animated.Value(index * 10))
          }]
        }
      ]}
    >
      <Card style={styles.machineCard}>
        <Card.Content>
          {/* Makine Başlığı ve Durum */}
          <View style={styles.machineHeader}>
            <Text variant="titleMedium" style={styles.machineName}>
              {item.name}
            </Text>
            <Chip 
              icon={() => <Text>{getStatusIcon(item.statusText)}</Text>}
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.statusText) + '20' }]}
              textStyle={[styles.statusText, { color: getStatusColor(item.statusText) }]}
            >
              {item.statusText || 'Çevrimiçi'}
            </Chip>
          </View>

          {/* Makine ID */}
          <Text style={styles.machineId}>ID: {item.id}</Text>

          {/* Veriler Grid */}
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Toplam Tomruk Sayısı</Text>
              <Text style={styles.dataValue}>{item.total_logs?.toLocaleString()}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Toplam Kabuk Hacmi (m³)</Text>
              <Text style={styles.dataValue}>{item.total_shell_volume || '0.00'}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Toplam Net Tomruk Hacmi (m³)</Text>
              <Text style={styles.dataValue}>{item.total_net_volume}</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Toplam Brüt Tomruk Hacmi (m³)</Text>
              <Text style={styles.dataValue}>{item.total_gross_volume}</Text>
            </View>
          </View>

          {/* Son Güncelleme */}
          <Text style={styles.lastUpdate}>
            Son Güncelleme: {item.last_backup || '24.06.2025 13:28'}
          </Text>

          {/* Aksiyon Butonları */}
          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              icon="information"
              style={styles.detailButton}
              labelStyle={styles.detailButtonLabel}
              onPress={() => navigation.navigate('MachineDetail', { 
                machineId: item.id, 
                machineName: item.name 
              })}
            >
              Makine Detay
            </Button>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  return (
    <LinearGradient 
      colors={['#ffffff', '#f8faff']} 
      style={styles.container}
    >
      <FlatList
        data={data?.machines}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => {
              setRefreshing(true); 
              fetchData();
            }}
            colors={['#ff5252']}
            tintColor="#ff5252"
          />
        }
        ListHeaderComponent={renderStatsCard}
        renderItem={renderMachineItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz makine verisi bulunmuyor</Text>
          </View>
        )}
      />
      
      {/* In-App Notifications */}
      {notifications.map((notification) => (
        <InAppNotification
          key={notification.id}
          id={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onDismiss={removeNotification}
          workingTime={notification.workingTime}
        />
      ))}



      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={5000}
        style={styles.snackbar}
        action={{
          label: 'Tekrar Dene',
          onPress: () => {
            setSnackVisible(false);
            fetchData();
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
  },
  loadingText: {
    marginTop: 16,
    color: '#7f8c8d',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 140,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIconText: {
    fontSize: 20,
  },
  statTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 4,
  },
  statSubtitle: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 8,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  machineCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  machineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  machineName: {
    flex: 1,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusChip: {
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  machineId: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  dataGrid: {
    marginBottom: 16,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataLabel: {
    flex: 1,
    fontSize: 13,
    color: '#5a6c7d',
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'right',
  },
  lastUpdate: {
    fontSize: 11,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderColor: '#ff5252',
  },
  actionButtonLabel: {
    color: '#ff5252',
    fontSize: 12,
  },
  detailButton: {
    flex: 1,
    backgroundColor: '#ff5252',
    borderRadius: 12,
  },
  detailButtonLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
}); 