import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  TouchableOpacity,
  Alert
} from 'react-native';
import {
  Text,
  Card,
  Surface,
  FAB,
  Chip,
  Button,
  Divider,
  Menu,
  ActivityIndicator,
  Searchbar,
  Snackbar
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { createApi } from '../services/api';
import { useAuth } from '../store/useAuth';

interface MachineReport {
  id: number;
  name: string;
  status: 'Çevrimiçi' | 'Çevrimdışı' | 'Uyarı';
  totalLogs: number;
  shellVolume: number;
  netVolume: number;
  grossVolume: number;
  lastUpdate: string;
}

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const { subdomain } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [monthMenuVisible, setMonthMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'logs' | 'volume'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [reports, setReports] = useState<MachineReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const api = createApi();

  const fetchReports = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      console.log('=== REPORTS API DEBUG ===');
      console.log('Subdomain:', subdomain);
      
      // Dashboard API'sini kullanarak makine verilerini çekelim
      const response = await api.get('dashboard.php');
      console.log('✅ Reports API başarılı:', response.data);
      
      if (response.data && response.data.machines) {
        // İlk makineyi debug et
        if (response.data.machines.length > 0) {
          const firstMachine = response.data.machines[0];
          console.log('🔍 İlk makine debug:', {
            last_backup: firstMachine.last_backup,
            last_update: firstMachine.last_update,
            created_at: firstMachine.created_at,
            updated_at: firstMachine.updated_at
          });
        }
        // Dashboard verilerini reports formatına çevir
        const reportsData: MachineReport[] = response.data.machines.map((machine: any) => {
          // Son güncelleme tarihini bul
          let lastUpdate = 'Bilinmiyor';
          
          // Mevcut tarih field'larını kontrol et
          const dateFields = [
            machine.last_update,
            machine.updated_at, 
            machine.last_backup,
            machine.created_at
          ];
          
          for (const dateField of dateFields) {
            if (dateField && dateField !== '0000-00-00 00:00:00' && dateField !== null) {
              try {
                let date;
                const dateStr = dateField.toString();
                
                if (dateStr.includes('-')) {
                  // SQL format: 2024-12-25 15:30:45 veya 2024-12-25
                  date = new Date(dateStr.replace(' ', 'T'));
                } else if (dateStr.includes('/')) {
                  // US format: 12/25/2024 
                  date = new Date(dateStr);
                } else if (!isNaN(parseInt(dateStr))) {
                  // Unix timestamp
                  const timestamp = parseInt(dateStr);
                  date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
                } else {
                  date = new Date(dateStr);
                }
                
                if (!isNaN(date.getTime()) && date.getFullYear() > 2020) {
                  lastUpdate = date.toLocaleString('tr-TR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  break; // İlk geçerli tarihi bul ve çık
                }
              } catch (error) {
                console.log('Date parse error:', error, 'Raw value:', dateField);
                continue;
              }
            }
          }
          
          // Hiçbir geçerli tarih bulunamazsa raw değeri kullan
          if (lastUpdate === 'Bilinmiyor' && dateFields.some(field => field)) {
            const firstValidField = dateFields.find(field => field && field !== '0000-00-00 00:00:00');
            if (firstValidField) {
              lastUpdate = firstValidField.toString();
            }
          }
          
          return {
            id: machine.id,
            name: machine.name,
            status: machine.statusText || 'Çevrimiçi',
            totalLogs: parseInt(machine.total_logs) || 0,
            shellVolume: parseFloat(machine.total_shell_volume) || 0,
            netVolume: parseFloat(machine.total_net_volume) || 0,
            grossVolume: parseFloat(machine.total_gross_volume) || 0,
            lastUpdate: lastUpdate
          };
        });
        
        setReports(reportsData);
        console.log('✅ Reports data formatted:', reportsData);
      }
      
      // Animasyonları başlat
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (e: any) {
      console.error('❌ Reports API ERROR:', e.message);
      setError('Raporlar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (subdomain) {
      fetchReports();
    }
  }, [subdomain]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Çevrimiçi': return '#4CAF50';
      case 'Çevrimdışı': return '#F44336';
      case 'Uyarı': return '#FF9800';
      default: return '#2196F3';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Çevrimiçi': return '🟢';
      case 'Çevrimdışı': return '🔴';
      case 'Uyarı': return '🟠';
      default: return '🔵';
    }
  };

  const formatVolume = (volume: number) => {
    return volume.toFixed(2);
  };

  const calculateTotals = () => {
    return reports.reduce((totals, report) => ({
      totalLogs: totals.totalLogs + report.totalLogs,
      shellVolume: totals.shellVolume + report.shellVolume,
      netVolume: totals.netVolume + report.netVolume,
      grossVolume: totals.grossVolume + report.grossVolume,
    }), { totalLogs: 0, shellVolume: 0, netVolume: 0, grossVolume: 0 });
  };

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'logs':
        comparison = a.totalLogs - b.totalLogs;
        break;
      case 'volume':
        comparison = a.netVolume - b.netVolume;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totals = calculateTotals();

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports(true);
  };

  const handleExport = () => {
    Alert.alert(
      'Rapor Dışa Aktar',
      'Hangi formatta dışa aktarmak istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Excel', onPress: () => Alert.alert('Bilgi', 'Excel dışa aktarma özelliği yakında!') },
        { text: 'PDF', onPress: () => Alert.alert('Bilgi', 'PDF dışa aktarma özelliği yakında!') }
      ]
    );
  };

  const handleSort = (type: 'name' | 'logs' | 'volume') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { label: 'Ocak', value: 1 }, { label: 'Şubat', value: 2 }, { label: 'Mart', value: 3 },
    { label: 'Nisan', value: 4 }, { label: 'Mayıs', value: 5 }, { label: 'Haziran', value: 6 },
    { label: 'Temmuz', value: 7 }, { label: 'Ağustos', value: 8 }, { label: 'Eylül', value: 9 },
    { label: 'Ekim', value: 10 }, { label: 'Kasım', value: 11 }, { label: 'Aralık', value: 12 }
  ];

  // Loading ekranı
  if (loading) {
    return (
      <LinearGradient colors={['#fafafa', '#f5f5f5']} style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ff5252" />
          <Text style={styles.loadingMainText}>Raporlar yükleniyor...</Text>
          <Text style={styles.loadingSubText}>Lütfen bekleyin</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#ffffff', '#f8faff']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#ff5252']}
              tintColor="#ff5252"
            />
          }
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>📊 Raporlar</Text>
              <Text style={styles.headerSubtitle}>Makine performans raporları</Text>
            </View>

            {/* Filters Section */}
            <Card style={styles.filtersCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>🔍 Filtreler</Text>
                
                <Searchbar
                  placeholder="Makine ara..."
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={styles.searchBar}
                  iconColor="#ff5252"
                />

                <View style={styles.dateFilters}>
                  <View style={styles.dateRow}>
                    <Menu
                      visible={yearMenuVisible}
                      onDismiss={() => setYearMenuVisible(false)}
                      anchor={
                        <TouchableOpacity
                          onPress={() => setYearMenuVisible(true)}
                          style={styles.filterButton}
                        >
                          <Text style={styles.filterButtonText}>📅 {selectedYear}</Text>
                        </TouchableOpacity>
                      }
                    >
                      {years.map(year => (
                        <Menu.Item
                          key={year}
                          onPress={() => {
                            setSelectedYear(year);
                            setYearMenuVisible(false);
                          }}
                          title={year.toString()}
                        />
                      ))}
                    </Menu>

                    <Menu
                      visible={monthMenuVisible}
                      onDismiss={() => setMonthMenuVisible(false)}
                      anchor={
                        <TouchableOpacity
                          onPress={() => setMonthMenuVisible(true)}
                          style={styles.filterButton}
                        >
                          <Text style={styles.filterButtonText}>
                            📅 {months.find(m => m.value === selectedMonth)?.label}
                          </Text>
                        </TouchableOpacity>
                      }
                    >
                      {months.map(month => (
                        <Menu.Item
                          key={month.value}
                          onPress={() => {
                            setSelectedMonth(month.value);
                            setMonthMenuVisible(false);
                          }}
                          title={month.label}
                        />
                      ))}
                    </Menu>
                  </View>
                </View>

                <View style={styles.filterActions}>
                  <Button
                    mode="contained"
                    onPress={() => Alert.alert('Bilgi', 'Filtre uygulama özelliği yakında!')}
                    style={styles.applyButton}
                    buttonColor="#ff5252"
                  >
                    Uygula
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedYear(new Date().getFullYear());
                      setSelectedMonth(new Date().getMonth() + 1);
                    }}
                    style={styles.resetButton}
                    textColor="#ff5252"
                  >
                    Sıfırla
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Sort Controls */}
            <Card style={styles.sortCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>📈 Sıralama</Text>
                <View style={styles.sortButtons}>
                  <Chip
                    selected={sortBy === 'name'}
                    onPress={() => handleSort('name')}
                    style={[styles.sortChip, sortBy === 'name' && styles.sortChipSelected]}
                    textStyle={styles.sortChipText}
                  >
                    İsim {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Chip>
                  <Chip
                    selected={sortBy === 'logs'}
                    onPress={() => handleSort('logs')}
                    style={[styles.sortChip, sortBy === 'logs' && styles.sortChipSelected]}
                    textStyle={styles.sortChipText}
                  >
                    Tomruk {sortBy === 'logs' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Chip>
                  <Chip
                    selected={sortBy === 'volume'}
                    onPress={() => handleSort('volume')}
                    style={[styles.sortChip, sortBy === 'volume' && styles.sortChipSelected]}
                    textStyle={styles.sortChipText}
                  >
                    Hacim {sortBy === 'volume' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Chip>
                </View>
              </Card.Content>
            </Card>

            {/* Summary Card */}
            <Card style={styles.summaryCard}>
              <LinearGradient
                colors={['#ff5252', '#ff7961']}
                style={styles.summaryGradient}
              >
                <Text style={styles.summaryTitle}>📊 Genel Toplam</Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{totals.totalLogs}</Text>
                    <Text style={styles.summaryLabel}>Toplam Tomruk</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{formatVolume(totals.netVolume)}</Text>
                    <Text style={styles.summaryLabel}>Net Hacim (m³)</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{formatVolume(totals.grossVolume)}</Text>
                    <Text style={styles.summaryLabel}>Brüt Hacim (m³)</Text>
                  </View>
                </View>
              </LinearGradient>
            </Card>

            {/* Reports List */}
            <Text style={styles.listTitle}>🏭 Makine Raporları ({sortedReports.length})</Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Button
                  mode="outlined"
                  onPress={() => fetchReports()}
                  style={styles.retryButton}
                  textColor="#ff5252"
                  icon="refresh"
                >
                  Tekrar Dene
                </Button>
              </View>
            ) : sortedReports.length > 0 ? (
              <View style={styles.reportsList}>
                {sortedReports.map((report, index) => (
                  <Animated.View
                    key={report.id}
                    style={[
                      styles.reportCard,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                      }
                    ]}
                  >
                    <Surface style={styles.reportSurface} elevation={2}>
                      <View style={styles.reportHeader}>
                        <View style={styles.reportTitleContainer}>
                          <Text style={styles.reportName}>{report.name}</Text>
                          <View style={styles.reportId}>
                            <Text style={styles.reportIdText}>ID: {report.id}</Text>
                          </View>
                        </View>
                        <View style={styles.reportStatus}>
                          <Text style={styles.statusIcon}>{getStatusIcon(report.status)}</Text>
                          <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                            {report.status}
                          </Text>
                        </View>
                      </View>

                      <Divider style={styles.reportDivider} />

                      <View style={styles.reportStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{report.totalLogs}</Text>
                          <Text style={styles.statLabel}>Tomruk</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{formatVolume(report.shellVolume)}</Text>
                          <Text style={styles.statLabel}>Kabuk</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{formatVolume(report.netVolume)}</Text>
                          <Text style={styles.statLabel}>Net</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{formatVolume(report.grossVolume)}</Text>
                          <Text style={styles.statLabel}>Brüt</Text>
                        </View>
                      </View>

                      <View style={styles.reportFooter}>
                        <Text style={styles.lastUpdate}>
                          🕒 {report.lastUpdate}
                        </Text>
                        <TouchableOpacity 
                          style={styles.detailButton}
                          onPress={() => navigation.navigate('MachineDetail', { 
                            machineId: report.id, 
                            machineName: report.name 
                          })}
                        >
                          <Text style={styles.detailButtonText}>Detay</Text>
                        </TouchableOpacity>
                      </View>
                    </Surface>
                  </Animated.View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Henüz rapor verisi bulunmuyor</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <FAB
          icon="download"
          label="Dışa Aktar"
          onPress={handleExport}
          style={styles.fab}
          color="#ffffff"
        />
      </LinearGradient>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={5000}
        style={styles.snackbar}
        action={{
          label: 'Tekrar Dene',
          onPress: () => {
            setError(null);
            fetchReports();
          },
          textColor: '#ff5252'
        }}
      >
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  content: { padding: 16, paddingBottom: 80 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#2c3e50', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: '#7f8c8d', fontWeight: '500' },
  filtersCard: { marginBottom: 16, borderRadius: 16, backgroundColor: '#ffffff', elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50', marginBottom: 16 },
  searchBar: { marginBottom: 16, backgroundColor: '#f8f9fa', borderRadius: 12 },
  dateFilters: { marginBottom: 16 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 12 },
  filterButton: { flex: 1, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e9ecef' },
  filterButtonText: { color: '#495057', fontWeight: '500' },
  filterActions: { flexDirection: 'row', gap: 12 },
  applyButton: { flex: 1, borderRadius: 12 },
  resetButton: { flex: 1, borderRadius: 12, borderColor: '#ff5252' },
  sortCard: { marginBottom: 16, borderRadius: 16, backgroundColor: '#ffffff', elevation: 2 },
  sortButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  sortChip: { backgroundColor: '#f8f9fa', height: 32 },
  sortChipSelected: { backgroundColor: '#ff5252' },
  sortChipText: { fontSize: 12, fontWeight: '500' },
  summaryCard: { marginBottom: 24, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  summaryGradient: { padding: 20 },
  summaryTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 16, textAlign: 'center' },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  listTitle: { fontSize: 20, fontWeight: '600', color: '#2c3e50', marginBottom: 16 },
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
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#7f8c8d', fontSize: 16 },
  errorContainer: { padding: 40, alignItems: 'center' },
  errorText: { color: '#e74c3c', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { borderColor: '#ff5252' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#7f8c8d', fontSize: 16, textAlign: 'center' },
  reportsList: { gap: 12 },
  reportCard: { marginBottom: 8 },
  reportSurface: { borderRadius: 16, backgroundColor: '#ffffff', overflow: 'hidden' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12 },
  reportTitleContainer: { flex: 1 },
  reportName: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  reportId: { backgroundColor: '#f8f9fa', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  reportIdText: { fontSize: 10, color: '#6c757d', fontWeight: '500' },
  reportStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusIcon: { fontSize: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  reportDivider: { marginHorizontal: 16, marginVertical: 8 },
  reportStats: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 12 },
  statItem: { alignItems: 'center', minWidth: 60 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#6c757d', textAlign: 'center' },
  reportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 12, backgroundColor: '#f8f9fa' },
  lastUpdate: { fontSize: 12, color: '#6c757d', flex: 1 },
  detailButton: { backgroundColor: '#ff5252', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  detailButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 120, backgroundColor: '#ff5252' },
  snackbar: { backgroundColor: '#2c3e50' },
}); 