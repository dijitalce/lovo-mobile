import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  ActivityIndicator,
  Chip,
  IconButton,
  FAB,
  Snackbar,
  Badge,
  Surface,
  Divider,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/useAuth';
import { createApi } from '../services/api';

interface Machine {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  status: 'online' | 'offline';
  statusText: string;
  last_update: string;
  created_at: string;
}

interface MachineStats {
  total_machines: number;
  online_machines: number;
  offline_machines: number;
}

export default function MachinesScreen() {
  const navigation = useNavigation<any>();
  const { subdomain } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stats, setStats] = useState<MachineStats>({
    total_machines: 0,
    online_machines: 0,
    offline_machines: 0,
  });
  const [error, setError] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const api = createApi();

  useEffect(() => {
    fetchMachines();
    animateIn();
    
    // 30 saniyede bir otomatik yenileme
    const interval = setInterval(() => {
      fetchMachines(true);
    }, 30000);
    
    return () => clearInterval(interval);
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

  const fetchMachines = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError('');

      console.log('=== MACHINES API DEBUG ===');
      console.log('Subdomain:', subdomain);
      
      // Dashboard API'sini kullan - machines listesi için
      const response = await api.get('dashboard.php');
      console.log('✅ Machines API başarılı:', response.data);
      
      if (response.data && response.data.machines && Array.isArray(response.data.machines)) {
        const machinesData = response.data.machines.map((machine: any) => {
          // Dashboard API'sinden gelen format
          const isOnline = machine.statusText === 'Çevrimiçi' || machine.status === 'online';
          
          return {
            id: machine.id,
            name: machine.name,
            ip_address: machine.ftp_ip || machine.ip_address || 'Bilinmiyor',
            port: parseInt(machine.ftp_port || machine.port) || 2115,
            status: isOnline ? 'online' : 'offline',
            statusText: machine.statusText || (isOnline ? 'Çevrimiçi' : 'Çevrimdışı'),
            last_update: formatDate(machine.last_backup || machine.last_update || machine.updated_at || machine.created_at),
            created_at: machine.created_at,
          };
        });
        
        setMachines(machinesData);
        calculateStats(machinesData);
        console.log('✅ Machines data formatted:', machinesData);
      } else {
        // API'den veri gelmezse boş array
        setMachines([]);
        calculateStats([]);
        console.log('⚠️ API response boş veya hatalı format');
      }
      
    } catch (e: any) {
      console.error('❌ Machines API ERROR:', e.message);
      setError('Makineler yüklenirken hata oluştu');
      setSnackVisible(true);
      
      // Hata durumunda boş array
      setMachines([]);
      calculateStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sample data kaldırıldı - sadece API'den veri kullanılıyor

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === '0000-00-00 00:00:00' || dateString === 'Güncelleme Yok') {
      return 'Bilinmiyor';
    }
    
    try {
      let date: Date;
      
      // Dashboard API'sinden gelen format: "25.12.2024 15:30"
      if (dateString.includes('.') && dateString.includes(' ')) {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('.');
        const [hour, minute] = timePart.split(':');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      } else {
        // SQL format: "2024-12-25 15:30:00"
        date = new Date(dateString.replace(' ', 'T'));
      }
      
      if (!isNaN(date.getTime()) && date.getFullYear() > 2020) {
        return date.toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.log('Date format error:', error);
    }
    
    return dateString;
  };

  const calculateStats = (machinesData: Machine[]) => {
    const totalMachines = machinesData.length;
    const onlineMachines = machinesData.filter(machine => machine.status === 'online').length;
    const offlineMachines = machinesData.filter(machine => machine.status === 'offline').length;
    
    setStats({
      total_machines: totalMachines,
      online_machines: onlineMachines,
      offline_machines: offlineMachines,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMachines(true);
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? '#4CAF50' : '#f44336';
  };

  const getStatusIcon = (status: string) => {
    return status === 'online' ? '🟢' : '🔴';
  };

  const handleMachineAction = (machineId: number, action: 'detail' | 'edit' | 'delete') => {
    switch (action) {
      case 'detail':
        const machine = machines.find(m => m.id === machineId);
        navigation.navigate('MachineDetail', { 
          machineId: machineId, 
          machineName: machine?.name || `Makine ${machineId}`
        });
        break;
      case 'edit':
        Alert.alert(
          'Makine Düzenle',
          'Makine düzenleme özelliği yakında eklenecek.',
          [{ text: 'Tamam' }]
        );
        break;
      case 'delete':
        Alert.alert(
          'Makine Sil',
          'Bu makineyi silmek istediğinizden emin misiniz?',
          [
            { text: 'İptal', style: 'cancel' },
            { 
              text: 'Sil', 
              style: 'destructive',
              onPress: () => {
                Alert.alert('Bilgi', 'Silme özelliği yakında eklenecek.');
              }
            }
          ]
        );
        break;
    }
  };

  const handleAddMachine = () => {
    Alert.alert(
      'Yeni Makine',
      'Yeni makine ekleme özelliği yakında eklenecek.',
      [{ text: 'Tamam' }]
    );
  };

  const renderMachineCard = (machine: Machine, index: number) => (
    <Animated.View
      key={machine.id}
      style={[
        styles.machineCard,
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
      <Surface style={styles.cardSurface} elevation={2}>
        <View style={styles.cardHeader}>
          <View style={styles.machineInfo}>
            <View style={styles.machineIdContainer}>
              <Text style={styles.machineId}>#{machine.id}</Text>
            </View>
            <Text style={styles.machineName}>{machine.name}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>{getStatusIcon(machine.status)}</Text>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(machine.status) }]}
              textStyle={styles.statusText}
            >
              {machine.statusText}
            </Chip>
          </View>
        </View>

        <Divider style={styles.cardDivider} />

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🌐 IP Adresi:</Text>
            <Text style={styles.infoValue}>{machine.ip_address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🔌 Port:</Text>
            <Text style={styles.infoValue}>{machine.port}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🕒 Son Güncelleme:</Text>
            <Text style={styles.infoValue}>{machine.last_update}</Text>
          </View>
        </View>

        <Divider style={styles.cardDivider} />

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.detailButton]}
            onPress={() => handleMachineAction(machine.id, 'detail')}
          >
            <Text style={styles.detailButtonText}>Detay</Text>
          </TouchableOpacity>
          
          <View style={styles.iconActions}>
            <IconButton
              icon="pencil"
              size={20}
              iconColor="#ff5252"
              onPress={() => handleMachineAction(machine.id, 'edit')}
              style={styles.iconButton}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#f44336"
              onPress={() => handleMachineAction(machine.id, 'delete')}
              style={styles.iconButton}
            />
          </View>
        </View>
      </Surface>
    </Animated.View>
  );

  // Loading ekranı
  if (loading) {
    return (
      <LinearGradient colors={['#fafafa', '#f5f5f5']} style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ff5252" />
          <Text style={styles.loadingMainText}>Makineler yükleniyor...</Text>
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
                  <Text style={styles.headerTitle}>🏭 Makineler</Text>
                  <Text style={styles.headerSubtitle}>Makine durumları ve bilgileri</Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={styles.machineCountContainer}>
                    <Text style={styles.machineCountNumber}>{stats.total_machines}</Text>
                    <Text style={styles.machineCountLabel}>makine</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Card>

          {/* İstatistik Kartları */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <Surface style={[styles.statCard, styles.onlineCard]} elevation={2}>
                <Text style={styles.statTitle}>Çevrimiçi</Text>
                <Text style={styles.statValue}>{stats.online_machines}</Text>
                <Text style={styles.statIcon}>🟢</Text>
              </Surface>
              <Surface style={[styles.statCard, styles.offlineCard]} elevation={2}>
                <Text style={styles.statTitle}>Çevrimdışı</Text>
                <Text style={styles.statValue}>{stats.offline_machines}</Text>
                <Text style={styles.statIcon}>🔴</Text>
              </Surface>
            </View>
          </View>

          {/* Makine Listesi */}
          {machines.length > 0 ? (
            <View style={styles.machinesList}>
              {machines.map((machine, index) => renderMachineCard(machine, index))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏭</Text>
              <Text style={styles.emptyText}>Henüz makine bulunmuyor</Text>
              <Text style={styles.emptySubText}>Yeni makine eklemek için + butonunu kullanın</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <FAB
        icon="plus"
        label="Yeni Makine"
        onPress={handleAddMachine}
        style={styles.fab}
        color="#ffffff"
      />

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={4000}
        style={styles.snackbar}
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
  machineCountContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  machineCountNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  machineCountLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  onlineCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  offlineCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  statTitle: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 16,
  },
  machinesList: {
    gap: 12,
  },
  machineCard: {
    marginBottom: 4,
  },
  cardSurface: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  machineInfo: {
    flex: 1,
  },
  machineIdContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  machineId: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  machineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusChip: {
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  cardDivider: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#f8f9fa',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  detailButton: {
    backgroundColor: '#ff5252',
  },
  detailButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  iconActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
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