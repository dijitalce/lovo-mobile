import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Animated,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Dimensions,
  FlatList,
  Pressable,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Surface,
  Chip,
  Divider,
  ProgressBar,
  Snackbar,
  IconButton,
  Searchbar,
  Menu,
  SegmentedButtons,
  Badge,
  FAB,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../store/useAuth';

const { width } = Dimensions.get('window');

interface MachineDetail {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  status: string;
  last_update: string;
  total_logs: number;
  total_shell_volume: string;
  total_net_volume: string;
  total_gross_volume: string;
  created_at: string;
}

interface TomrukData {
  id: number;
  tarih: string;
  saat: string;
  tomruk_no: number;
  boy_cm: number;
  brut_cap_cm: number;
  kabuk_kalinlik_cm: number;
  kabuk_hacim_m3: number;
  net_hacim_m3: number;
  brut_hacim_m3: number;
  created_at: string;
}

interface MachineStats {
  total_tomruk: number;
  avg_boy: number;
  avg_cap: number;
  total_net_hacim: number;
  total_brut_hacim: number;
  today_logs: number;
  this_month_logs: number;
}

export default function MachineDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { subdomain } = useAuth();
  const { machineId, machineName } = route.params as { machineId: number; machineName: string };
  
  const [machine, setMachine] = useState<MachineDetail | null>(null);
  const [tomrukData, setTomrukData] = useState<TomrukData[]>([]);
  const [filteredData, setFilteredData] = useState<TomrukData[]>([]);
  const [stats, setStats] = useState<MachineStats>({
    total_tomruk: 0,
    avg_boy: 0,
    avg_cap: 0,
    total_net_hacim: 0,
    total_brut_hacim: 0,
    today_logs: 0,
    this_month_logs: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Filtreleme state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(0); // 0 = Tüm yıllar
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = Tüm aylar
  const [sortBy, setSortBy] = useState('tarih');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [showFilters, setShowFilters] = useState(true);
  
  // Menu state'leri
  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [monthMenuVisible, setMonthMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(50); // Sayfa başına 50 öğe
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [allTomrukData, setAllTomrukData] = useState<TomrukData[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Ocak' }, { value: 2, label: 'Şubat' }, { value: 3, label: 'Mart' },
    { value: 4, label: 'Nisan' }, { value: 5, label: 'Mayıs' }, { value: 6, label: 'Haziran' },
    { value: 7, label: 'Temmuz' }, { value: 8, label: 'Ağustos' }, { value: 9, label: 'Eylül' },
    { value: 10, label: 'Ekim' }, { value: 11, label: 'Kasım' }, { value: 12, label: 'Aralık' }
  ];

  useEffect(() => {
    fetchMachineDetail(false);
    animateIn();
    
    // 30 saniyede bir otomatik yenileme
    const interval = setInterval(() => {
      fetchMachineDetail(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [tomrukData, searchQuery, selectedYear, selectedMonth, sortBy, sortOrder, currentPage]);

  // Makine bilgileri değiştiğinde istatistikleri güncelle
  useEffect(() => {
    if (machine && tomrukData.length > 0) {
      calculateStats(tomrukData, machine);
    }
  }, [machine]);

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

  const fetchMachineDetail = async (isRefresh = false) => {
    try {
      // İlk yüklemede loading ekranı göster, yenilemede sadece refreshing
      if (isFirstLoad && !isRefresh) {
        setLoading(true);
        setLoadingStep(0);
      }
      setError('');
      console.log('=== MAKİNE DETAY API ===');
      console.log('Machine ID:', machineId);
      console.log('Machine Name:', machineName);
      console.log('Subdomain:', subdomain);
      
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

      // API çağrısı
      let machineData: any = null;
      let totalRecords = 0;
      
      try {
        if (isFirstLoad && !isRefresh) {
          setLoadingStep(1); // Makine bilgileri alınıyor
        }
        // GET isteği ile API'yi çağır
        const httpsUrl = `https://${cleanSubdomain}.lovo.com.tr/api/machine.php?id=${machineId}`;
        
        const httpsResponse = await fetch(httpsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (httpsResponse.ok) {
          machineData = await httpsResponse.json();
        } else {
          // HTTP ile dene
          const httpUrl = `http://${cleanSubdomain}.lovo.com.tr/api/machine.php?id=${machineId}`;
          
          const httpResponse = await fetch(httpUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (httpResponse.ok) {
            machineData = await httpResponse.json();
          }
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
      }

      // API'den makine verisi alındıysa kullan
      if (machineData && machineData.machine) {
        console.log('API Response:', machineData);
        console.log('Records Total:', machineData.recordsTotal);
        console.log('Records Filtered:', machineData.recordsFiltered);
        console.log('Online Status:', machineData.machine.online);
        
        const machineObj = machineData.machine;
        
        // Online status'u string değerlere göre kontrol et
        let status = 'Çevrimdışı';
        if (machineObj.online === true || machineObj.online === 'online' || machineObj.online === 'true') {
          status = 'Çevrimiçi';
        } else if (machineObj.online === false || machineObj.online === 'offline' || machineObj.online === 'false') {
          status = 'Çevrimdışı';
        }
        
        // Toplam sayıyı kontrol et - POST ile veri çekmeden önce önce kaydet
        let initialTotalCount = machineData.recordsTotal || machineData.recordsFiltered || 0;
        console.log('İlk toplam sayı:', initialTotalCount);

        const machineInfo: MachineDetail = {
          id: parseInt(machineObj.id) || machineId,
          name: machineObj.name || machineName || `Makine ${machineId}`,
          ip_address: 'N/A',
          port: 0,
          status: status,
          last_update: machineObj.last_backup || new Date().toISOString(),
          total_logs: initialTotalCount,
          total_shell_volume: machineObj.totals?.total_shell_volume || '0.00',
          total_net_volume: machineObj.totals?.total_net_volume || '0.00', 
          total_gross_volume: machineObj.totals?.total_gross_volume || '0.00',
          created_at: new Date().toISOString(),
        };
        
        setMachine(machineInfo);
        
        // Makine bilgileri set edildikten sonra istatistikleri hesapla
        calculateStats([], machineInfo);
      } else {
        // API başarısız olursa sample data oluştur
        console.log('⚠️ Makine API başarısız, sample data oluşturuluyor...');
        const sampleMachine: MachineDetail = {
          id: machineId,
          name: machineName || `Makine ${machineId}`,
          ip_address: '192.168.1.100',
          port: 8080,
          status: 'Çevrimiçi',
          last_update: new Date().toISOString(),
          total_logs: 150,
          total_shell_volume: '12.50',
          total_net_volume: '45.80',
          total_gross_volume: '58.30',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün önce
        };
        setMachine(sampleMachine);
      }
      
              // API'den tomruk verisi alındıysa kullan, yoksa sample data
      let finalTomrukData: TomrukData[] = [];
      
      // Data boş geliyorsa POST ile veri çek
      if (machineData && machineData.data && Array.isArray(machineData.data) && machineData.data.length === 0) {
        if (isFirstLoad && !isRefresh) {
          setLoadingStep(2); // Tomruk verileri yükleniyor
        }
        console.log('Data boş, POST ile veri çekiliyor...');
        
        try {
          const postData = new URLSearchParams({
            start: '0',
            length: '5000' // Daha fazla veri çek ortalamalar için
          });
          
          const postResponse = await fetch(`https://${cleanSubdomain}.lovo.com.tr/api/machine.php?id=${machineId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: postData.toString()
          });
          
          if (postResponse.ok) {
            const postMachineData = await postResponse.json();
            console.log('POST Response:', postMachineData);
            console.log('POST Records Total:', postMachineData.recordsTotal);
            console.log('POST Records Filtered:', postMachineData.recordsFiltered);
            
            if (postMachineData.data && Array.isArray(postMachineData.data)) {
              machineData = postMachineData; // POST'tan gelen veriyi kullan
              
              // POST'tan gelen toplam sayıyı makineye ekle
              if (postMachineData.recordsTotal > 0 || postMachineData.recordsFiltered > 0) {
                const postTotalCount = postMachineData.recordsTotal || postMachineData.recordsFiltered;
                console.log('POST\'tan toplam sayı güncelleniyor:', postTotalCount);
                setMachine(prev => prev ? { ...prev, total_logs: postTotalCount } : prev);
              }
            }
          }
        } catch (postError) {
          console.error('POST hatası:', postError);
        }
      }
      
      // Tomruk verilerini işle
      if (machineData && machineData.data && Array.isArray(machineData.data) && machineData.data.length > 0) {
        console.log('Tomruk verileri işleniyor:', machineData.data.length, 'adet');
        
        finalTomrukData = machineData.data.map((item: any, index: number) => ({
          id: item.id || index + 1,
          tarih: item.date || new Date().toISOString().split('T')[0],
          saat: item.time || '00:00:00',
          tomruk_no: parseInt(item.ch0) || (280 + index), // ch0 = Tomruk No
          boy_cm: parseFloat(item.ch1) || 0, // ch1 = Boy (cm)
          brut_cap_cm: parseFloat(item.ch2) || 0, // ch2 = Brüt Çap (cm)
          kabuk_kalinlik_cm: parseFloat(item.ch3) || 0, // ch3 = Kabuk Kalınlık (cm)
          kabuk_hacim_m3: parseFloat(item.ch4) || 0, // ch4 = Kabuk Hacim (m³)
          net_hacim_m3: parseFloat(item.ch5) || 0, // ch5 = Net Hacim (m³)
          brut_hacim_m3: parseFloat(item.ch6) || 0, // ch6 = Brüt Hacim (m³)
          created_at: item.created_at || new Date().toISOString(),
        }));
        
        // Tarihe göre sırala
        finalTomrukData.sort((a, b) => new Date(b.tarih + ' ' + b.saat).getTime() - new Date(a.tarih + ' ' + a.saat).getTime());
        
        if (isFirstLoad && !isRefresh) {
          setLoadingStep(3); // İstatistikler hesaplanıyor
        }
        setTomrukData(finalTomrukData);
        calculateStats(finalTomrukData, machine || undefined);
        
        // Makine bilgisini gerçek toplam ile güncelle
        const realTotalCount = machineData.recordsTotal || machineData.recordsFiltered || finalTomrukData.length;
        console.log('Gerçek toplam sayı güncelleniyor:', realTotalCount);
        setMachine(prev => prev ? { ...prev, total_logs: realTotalCount } : prev);
        
        return; // Veri varsa return
      }
      
      // API'den veri alınamadıysa sample data oluştur
      if (finalTomrukData.length === 0) {
        console.log('⚠️ API\'den veri alınamadı, sample data oluşturuluyor...');
        finalTomrukData = generateSampleTomrukData();
      }
      
      setTomrukData(finalTomrukData);
      
      // İstatistikleri hesapla
      calculateStats(finalTomrukData);
      
    } catch (err: any) {
      console.error('❌ Genel hata:', err);
      setError('Makine detayları yüklenirken hata oluştu');
      setSnackVisible(true);
      
      // Hata durumunda da sample data oluştur
      const sampleMachine: MachineDetail = {
        id: machineId,
        name: machineName || `Makine ${machineId}`,
        ip_address: '192.168.1.100',
        port: 8080,
        status: 'Çevrimdışı',
        last_update: new Date().toISOString(),
        total_logs: 0,
        total_shell_volume: '0.00',
        total_net_volume: '0.00',
        total_gross_volume: '0.00',
        created_at: new Date().toISOString(),
      };
      setMachine(sampleMachine);
      
      const sampleData = generateSampleTomrukData();
      setTomrukData(sampleData);
      calculateStats(sampleData, machine || undefined);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsFirstLoad(false); // İlk yükleme tamamlandı
    }
  };

  const generateSampleTomrukData = (): TomrukData[] => {
    const data: TomrukData[] = [];
    const now = new Date();
    
    // Son 2 yıla yayılmış 200 adet tomruk verisi
    for (let i = 0; i < 200; i++) {
      // Rastgele tarih (son 2 yıl içinde)
      const randomDays = Math.floor(Math.random() * 730); // 2 yıl = 730 gün
      const date = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
      
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      
      data.push({
        id: i + 1,
        tarih: date.toISOString().split('T')[0],
        saat: `${('0' + hour).slice(-2)}:${('0' + minute).slice(-2)}:${('0' + second).slice(-2)}`,
        tomruk_no: 280 + i,
        boy_cm: Math.floor(Math.random() * 150) + 200, // 200-350 cm
        brut_cap_cm: Math.floor(Math.random() * 60) + 15, // 15-75 cm
        kabuk_kalinlik_cm: Math.floor(Math.random() * 8) + 1, // 1-8 cm
        kabuk_hacim_m3: Math.random() * 0.3,
        net_hacim_m3: Math.random() * 1.2,
        brut_hacim_m3: Math.random() * 1.5,
        created_at: date.toISOString(),
      });
    }
    
    // Tarihe göre sırala (en yeni en başta)
    return data.sort((a, b) => new Date(b.tarih + ' ' + b.saat).getTime() - new Date(a.tarih + ' ' + a.saat).getTime());
  };

  const calculateStats = (data: TomrukData[], machineInfo?: MachineDetail) => {
    // API'den gelen makine bilgilerini kullan
    const currentMachine = machineInfo || machine;
    
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // API'den gelen totals'ı al
    const apiTotalNet = currentMachine?.total_net_volume ? parseFloat(currentMachine.total_net_volume) : 0;
    const apiTotalGross = currentMachine?.total_gross_volume ? parseFloat(currentMachine.total_gross_volume) : 0;
    const apiTotalCount = currentMachine?.total_logs || 0;
    
    // Eğer tomruk verisi varsa ortalamalar için kullan
    if (data && data.length > 0) {
      const todayLogs = data.filter(item => item.tarih === today).length;
      const thisMonthLogs = data.filter(item => {
        const itemDate = new Date(item.tarih);
        return itemDate.getMonth() + 1 === currentMonth && itemDate.getFullYear() === currentYear;
      }).length;
      
      // Geçerli değerleri filtrele (0 olmayan ve sayı olan)
      const validBoyData = data.filter(item => item.boy_cm > 0 && !isNaN(item.boy_cm));
      const validCapData = data.filter(item => item.brut_cap_cm > 0 && !isNaN(item.brut_cap_cm));
      
      // Hesaplanan değerler (fallback olarak)
      const calculatedNetHacim = data.reduce((sum, item) => sum + (isNaN(item.net_hacim_m3) ? 0 : item.net_hacim_m3), 0);
      const calculatedGrossHacim = data.reduce((sum, item) => sum + (isNaN(item.brut_hacim_m3) ? 0 : item.brut_hacim_m3), 0);
      
      setStats({
        total_tomruk: apiTotalCount > 0 ? apiTotalCount : data.length, // API'den gelen toplam sayı
        avg_boy: validBoyData.length > 0 ? validBoyData.reduce((sum, item) => sum + item.boy_cm, 0) / validBoyData.length : 0,
        avg_cap: validCapData.length > 0 ? validCapData.reduce((sum, item) => sum + item.brut_cap_cm, 0) / validCapData.length : 0,
        total_net_hacim: apiTotalNet > 0 ? apiTotalNet : calculatedNetHacim, // API'den gelen toplam net hacim
        total_brut_hacim: apiTotalGross > 0 ? apiTotalGross : calculatedGrossHacim, // API'den gelen toplam brüt hacim
        today_logs: todayLogs,
        this_month_logs: thisMonthLogs,
      });
      
      console.log('İstatistik hesaplandı (veri ile):', {
        apiTotal: apiTotalCount,
        apiNet: apiTotalNet,
        apiGross: apiTotalGross,
        dataLength: data.length,
        validBoy: validBoyData.length,
        validCap: validCapData.length
      });
    } else {
      // Veri yoksa sadece API totals'ını kullan
      setStats({
        total_tomruk: apiTotalCount,
        avg_boy: 0,
        avg_cap: 0,
        total_net_hacim: apiTotalNet,
        total_brut_hacim: apiTotalGross,
        today_logs: 0,
        this_month_logs: 0,
      });
      
      console.log('İstatistik hesaplandı (sadece API):', {
        apiTotal: apiTotalCount,
        apiNet: apiTotalNet,
        apiGross: apiTotalGross
      });
    }
  };

  const filterAndSortData = () => {
    let filtered = tomrukData.filter(item => {
      const itemDate = new Date(item.tarih);
      const matchesYear = selectedYear === 0 || itemDate.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 0 || itemDate.getMonth() + 1 === selectedMonth;
      const matchesSearch = searchQuery === '' || 
        item.tomruk_no.toString().includes(searchQuery) ||
        item.tarih.includes(searchQuery);
      
      return matchesYear && matchesMonth && matchesSearch;
    });
    
    // Sıralama
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'tarih':
          aValue = new Date(a.tarih + ' ' + a.saat).getTime();
          bValue = new Date(b.tarih + ' ' + b.saat).getTime();
          break;
        case 'tomruk_no':
          aValue = a.tomruk_no;
          bValue = b.tomruk_no;
          break;
        case 'boy':
          aValue = a.boy_cm;
          bValue = b.boy_cm;
          break;
        case 'hacim':
          aValue = a.net_hacim_m3;
          bValue = b.net_hacim_m3;
          break;
        default:
          aValue = a.tomruk_no;
          bValue = b.tomruk_no;
      }
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
    
    // Tüm filtrelenmiş veriyi sakla
    setAllTomrukData(filtered);
    
    // İlk sayfayı göster
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    setFilteredData(paginatedData);
    
    // Gerçek toplam sayıya göre hasMoreData hesapla
    const realTotal = machine?.total_logs || filtered.length;
    setHasMoreData(realTotal > endIndex && filtered.length > endIndex);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(0);
    fetchMachineDetail(true);
  };
  
  const loadMoreData = () => {
    if (!loadingMore && hasMoreData) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      
      // Bir sonraki sayfayı yükle
      const startIndex = nextPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const nextPageData = allTomrukData.slice(startIndex, endIndex);
      
      // Mevcut veriyle birleştir
      setFilteredData(prev => [...prev, ...nextPageData]);
      
      // Gerçek toplam sayıya göre hasMoreData hesapla
      const realTotal = machine?.total_logs || allTomrukData.length;
      setHasMoreData(realTotal > endIndex && allTomrukData.length > endIndex);
      setLoadingMore(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'çevrimiçi':
      case 'online':
        return '#4CAF50';
      case 'çevrimdışı':
      case 'offline':
        return '#f44336';
      case 'uyarı':
      case 'warning':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const formatVolume = (volume: number) => {
    return volume.toFixed(3) + ' m³';
  };

  const formatNumber = (num: number) => {
    return num.toFixed(1);
  };

  const getMonthName = (month: number) => {
    if (month === 0) return 'Tüm Aylar';
    return months.find(m => m.value === month)?.label || 'Tümü';
  };

  const getYearName = (year: number) => {
    if (year === 0) return 'Tüm Yıllar';
    return year.toString();
  };

  const renderTomrukCard = ({ item, index }: { item: TomrukData; index: number }) => (
    <Animated.View
      style={[
        styles.tomrukCard,
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
      <Surface style={styles.tomrukCardSurface} elevation={2}>
        <View style={styles.tomrukCardHeader}>
          <View style={styles.tomrukNumberContainer}>
            <LinearGradient
              colors={['#ff5252', '#ff1744']}
              style={styles.tomrukNumberGradient}
            >
              <Text style={styles.tomrukNumber}>#{item.tomruk_no}</Text>
            </LinearGradient>
          </View>
          <View style={styles.tomrukDateContainer}>
            <Text style={styles.tomrukDate}>{item.tarih}</Text>
            <Text style={styles.tomrukTime}>{item.saat}</Text>
          </View>
        </View>
        
        <View style={styles.tomrukMetrics}>
          <View style={styles.metricGroup}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Boy</Text>
              <Text style={styles.metricValue}>{item.boy_cm} cm</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Çap</Text>
              <Text style={styles.metricValue}>{item.brut_cap_cm} cm</Text>
            </View>
          </View>
          
          <View style={styles.metricGroup}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Net Hacim</Text>
              <Text style={styles.metricValue}>{formatVolume(item.net_hacim_m3)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Brüt Hacim</Text>
              <Text style={styles.metricValue}>{formatVolume(item.brut_hacim_m3)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.tomrukProgress}>
          <ProgressBar
            progress={item.net_hacim_m3 / (item.brut_hacim_m3 || 1)}
            color="#ff5252"
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            Verimlilik: {((item.net_hacim_m3 / (item.brut_hacim_m3 || 1)) * 100).toFixed(1)}%
          </Text>
        </View>
      </Surface>
    </Animated.View>
  );

  const renderTomrukCompact = ({ item }: { item: TomrukData }) => (
    <Surface style={styles.compactCard} elevation={1}>
      <View style={styles.compactRow}>
        <View style={styles.compactLeft}>
          <Text style={styles.compactNumber}>#{item.tomruk_no}</Text>
          <Text style={styles.compactDate}>{item.tarih} {item.saat}</Text>
        </View>
        <View style={styles.compactRight}>
          <Text style={styles.compactMetric}>{item.boy_cm}cm × {item.brut_cap_cm}cm</Text>
          <Text style={styles.compactVolume}>{formatVolume(item.net_hacim_m3)}</Text>
        </View>
      </View>
    </Surface>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#fafafa', '#f5f5f5']} style={styles.container}>
        <View style={styles.loaderContainer}>
          <LinearGradient
            colors={['#ff5252', '#ff1744']}
            style={styles.loadingCard}
          >
            <ActivityIndicator size="large" color="#ffffff" style={styles.loadingSpinner} />
            <Text style={styles.loadingTitle}>Makine Detayları Yükleniyor</Text>
            <Text style={styles.loadingSubtitle}>
              {machineName || `Makine ${machineId}`}
            </Text>
            <View style={styles.loadingSteps}>
              <Text style={[styles.loadingStep, loadingStep >= 1 && styles.loadingStepActive]}>
                {loadingStep >= 1 ? '✅' : '🔄'} Makine bilgileri alınıyor...
              </Text>
              <Text style={[styles.loadingStep, loadingStep >= 2 && styles.loadingStepActive]}>
                {loadingStep >= 2 ? '✅' : '📊'} Tomruk verileri yükleniyor...
              </Text>
              <Text style={[styles.loadingStep, loadingStep >= 3 && styles.loadingStepActive]}>
                {loadingStep >= 3 ? '✅' : '📈'} İstatistikler hesaplanıyor...
              </Text>
            </View>
          </LinearGradient>
          
          <Surface style={styles.loadingTips} elevation={2}>
            <Text style={styles.tipsTitle}>💡 Bilgi</Text>
            <Text style={styles.tipsText}>
              • Binlerce tomruk verisi yükleniyor{'\n'}
              • İstatistikler gerçek zamanlı hesaplanıyor{'\n'}
              • İlk yükleme biraz zaman alabilir
            </Text>
          </Surface>
        </View>
      </LinearGradient>
    );
  }

  if (!machine) {
    return (
      <LinearGradient colors={['#fafafa', '#f5f5f5']} style={styles.container}>
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>Makine bilgileri bulunamadı</Text>
          <Button mode="contained" onPress={() => fetchMachineDetail(false)} style={styles.retryButton}>
            Tekrar Dene
          </Button>
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
        nestedScrollEnabled={true}
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
                  <Text style={styles.machineName}>{machine.name}</Text>
                  <Text style={styles.machineId}>ID: {machine.id}</Text>
                </View>
                <View style={styles.headerRight}>
                  <Chip
                    mode="flat"
                    style={[styles.statusChip, { backgroundColor: getStatusColor(machine.status) }]}
                    textStyle={styles.statusText}
                  >
                    {machine.status}
                  </Chip>
                  <Text style={styles.lastUpdate}>
                    Son Güncelleme: {new Date(machine.last_update).toLocaleString('tr-TR')}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Card>

          {/* İstatistik Kartları */}
          <View style={styles.statsContainer}>
            <Surface style={styles.statCard}>
              <LinearGradient colors={['#ff5252', '#ff1744']} style={styles.statGradient}>
                <Text style={styles.statTitle}>Toplam Tomruk</Text>
                <Text style={styles.statValue}>{stats.total_tomruk}</Text>
                <Text style={styles.statSubtitle}>adet</Text>
              </LinearGradient>
            </Surface>
            
            <Surface style={styles.statCard}>
              <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.statGradient}>
                <Text style={styles.statTitle}>Ortalama Boy</Text>
                <Text style={styles.statValue}>{formatNumber(stats.avg_boy)}</Text>
                <Text style={styles.statSubtitle}>cm</Text>
              </LinearGradient>
            </Surface>
            
            <Surface style={styles.statCard}>
              <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.statGradient}>
                <Text style={styles.statTitle}>Ortalama Çap</Text>
                <Text style={styles.statValue}>{formatNumber(stats.avg_cap)}</Text>
                <Text style={styles.statSubtitle}>cm</Text>
              </LinearGradient>
            </Surface>
            
            <Surface style={styles.statCard}>
              <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.statGradient}>
                <Text style={styles.statTitle}>Toplam Net Hacim</Text>
                <Text style={styles.statValue}>{formatNumber(stats.total_net_hacim)}</Text>
                <Text style={styles.statSubtitle}>m³</Text>
              </LinearGradient>
            </Surface>
          </View>

          {/* Filtreler */}
          <Card style={styles.filtersCard}>
            <Card.Content>
              <View style={styles.filtersHeader}>
                <Text style={styles.sectionTitle}>🔍 Filtreler ve Arama</Text>
                <IconButton
                  icon={showFilters ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  onPress={() => setShowFilters(!showFilters)}
                  iconColor="#ff5252"
                />
              </View>
              
              <Searchbar
                placeholder="Tomruk numarası veya tarih ara..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                iconColor="#ff5252"
                theme={{ colors: { primary: '#ff5252' } }}
              />
              
              {showFilters && (
                <Animated.View style={styles.filtersContent}>
                  <View style={styles.filterRow}>
                    <Menu
                      visible={yearMenuVisible}
                      onDismiss={() => setYearMenuVisible(false)}
                      anchor={
                        <Button
                          mode={selectedYear !== 0 ? "contained" : "outlined"}
                          onPress={() => setYearMenuVisible(true)}
                          style={[
                            styles.filterButton, 
                            selectedYear !== 0 ? styles.filterButtonActive : styles.filterButtonThemed
                          ]}
                          icon="calendar"
                          textColor={selectedYear !== 0 ? "#ffffff" : "#ff5252"}
                          buttonColor={selectedYear !== 0 ? "#ff5252" : "transparent"}
                        >
                          {getYearName(selectedYear)}
                        </Button>
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          setSelectedYear(0);
                          setYearMenuVisible(false);
                        }}
                        title="Tüm Yıllar"
                      />
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
                        <Button
                          mode={selectedMonth !== 0 ? "contained" : "outlined"}
                          onPress={() => setMonthMenuVisible(true)}
                          style={[
                            styles.filterButton, 
                            selectedMonth !== 0 ? styles.filterButtonActive : styles.filterButtonThemed
                          ]}
                          icon="calendar-month"
                          textColor={selectedMonth !== 0 ? "#ffffff" : "#ff5252"}
                          buttonColor={selectedMonth !== 0 ? "#ff5252" : "transparent"}
                        >
                          {getMonthName(selectedMonth)}
                        </Button>
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          setSelectedMonth(0);
                          setMonthMenuVisible(false);
                        }}
                        title="Tüm Aylar"
                      />
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
                  
                  <View style={styles.filterRow}>
                    <SegmentedButtons
                      value={viewMode}
                      onValueChange={(value) => setViewMode(value as 'cards' | 'compact')}
                      buttons={[
                        { value: 'cards', label: 'Kartlar', icon: 'view-grid' },
                        { value: 'compact', label: 'Kompakt', icon: 'view-list' },
                      ]}
                      style={styles.viewModeSegments}
                      theme={{ 
                        colors: { 
                          primary: '#ff5252',
                          secondaryContainer: '#ff5252',
                          onSecondaryContainer: '#ffffff',
                          outline: '#ff5252'
                        } 
                      }}
                    />
                  </View>
                  
                  <View style={styles.sortContainer}>
                    <Text style={styles.sortLabel}>Sıralama:</Text>
                    <View style={styles.sortButtons}>
                      {[
                        { key: 'tarih', label: 'Tarih', icon: 'calendar' },
                        { key: 'tomruk_no', label: 'No', icon: 'numeric' },
                        { key: 'boy', label: 'Boy', icon: 'ruler' },
                        { key: 'hacim', label: 'Hacim', icon: 'cube' },
                      ].map(option => (
                        <Chip
                          key={option.key}
                          selected={sortBy === option.key}
                          onPress={() => setSortBy(option.key)}
                          style={[
                            styles.sortChip,
                            sortBy === option.key && styles.sortChipSelected
                          ]}
                          showSelectedOverlay={false}
                          icon={option.icon}
                          selectedColor="#ff5252"
                          textStyle={sortBy === option.key ? styles.sortChipTextSelected : styles.sortChipText}
                          theme={{ 
                            colors: { 
                              primary: '#ff5252',
                              onSurfaceVariant: sortBy === option.key ? '#ffffff' : '#2c3e50'
                            } 
                          }}
                        >
                          {option.label}
                        </Chip>
                      ))}
                      <IconButton
                        icon={sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'}
                        size={24}
                        onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        style={styles.sortOrderButton}
                        iconColor="#ff5252"
                      />
                    </View>
                  </View>
                </Animated.View>
              )}
            </Card.Content>
          </Card>

          {/* Sonuçlar */}
          <Card style={styles.resultsCard}>
            <Card.Content>
              <View style={styles.resultsHeader}>
                <Text style={styles.sectionTitle}>📊 Tomruk Verileri</Text>
                <Badge size={24} style={{ backgroundColor: '#ff5252' }}>
                  {machine && machine.total_logs > 0 ? `${filteredData.length}/${machine.total_logs}` : filteredData.length}
                </Badge>
              </View>
              
              {filteredData.length > 0 ? (
                <View style={styles.flatListContainer}>
                  <FlatList
                    data={filteredData}
                    renderItem={viewMode === 'cards' ? renderTomrukCard : renderTomrukCompact}
                    keyExtractor={(item) => `tomruk-${item.id}`}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    initialNumToRender={20}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    removeClippedSubviews={true}
                    getItemLayout={viewMode === 'compact' ? (data, index) => ({
                      length: 68,
                      offset: 68 * index,
                      index,
                    }) : undefined}
                    updateCellsBatchingPeriod={50}
                    disableVirtualization={false}
                    ListFooterComponent={() => 
                      hasMoreData ? (
                        <Surface style={styles.loadMoreContainer}>
                          <Button 
                            mode="outlined" 
                            onPress={loadMoreData}
                            loading={loadingMore}
                            disabled={loadingMore}
                            style={styles.loadMoreButton}
                            textColor="#ff5252"
                          >
                            {loadingMore ? 'Yükleniyor...' : `Daha Fazla Göster (${(machine?.total_logs || allTomrukData.length) - filteredData.length} kaldı)`}
                          </Button>
                        </Surface>
                      ) : (
                        (machine?.total_logs || allTomrukData.length) > itemsPerPage && (
                          <Surface style={styles.loadMoreContainer}>
                            <Text style={styles.endText}>
                              ✅ Tüm veriler gösterildi ({machine?.total_logs || allTomrukData.length} toplam)
                            </Text>
                          </Surface>
                        )
                      )
                    }
                  />
                </View>
              ) : (
                <Surface style={styles.noDataContainer}>
                  <Text style={styles.noDataIcon}>📭</Text>
                  <Text style={styles.noDataText}>Seçilen kriterlere uygun veri bulunamadı</Text>
                  <Text style={styles.noDataSubText}>Filtreleri değiştirerek tekrar deneyin</Text>
                </Surface>
              )}
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>
      
      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={onRefresh}
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
            fetchMachineDetail(false);
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
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#ff5252',
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
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  machineName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  machineId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusChip: {
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  lastUpdate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    maxWidth: (width - 48) / 2,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  statGradient: {
    borderRadius: 12,
    padding: 16,
    margin: -16,
  },
  statTitle: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filtersCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  filtersContent: {
    gap: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    minWidth: (width - 56) / 2,
    maxWidth: (width - 56) / 2,
  },
  filterButtonThemed: {
    borderColor: '#ff5252',
  },
  filterButtonActive: {
    backgroundColor: '#ff5252',
    borderColor: '#ff5252',
  },
  viewModeSegments: {
    flex: 1,
  },
  sortContainer: {
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  sortChip: {
    height: 32,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#f8f9fa',
  },
  sortChipSelected: {
    backgroundColor: '#ff5252',
  },
  sortChipText: {
    color: '#2c3e50',
    fontSize: 12,
  },
  sortChipTextSelected: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  sortOrderButton: {
    margin: 0,
  },
  resultsCard: {
    borderRadius: 12,
    elevation: 2,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tomrukCard: {
    marginBottom: 8,
  },
  tomrukCardSurface: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    minHeight: 120,
  },
  tomrukCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tomrukNumberContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tomrukNumberGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tomrukNumber: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  tomrukDateContainer: {
    alignItems: 'flex-end',
  },
  tomrukDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  tomrukTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  tomrukMetrics: {
    gap: 12,
    marginBottom: 16,
  },
  metricGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  tomrukProgress: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ecf0f1',
  },
  progressText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  compactCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLeft: {
    flex: 1,
  },
  compactNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff5252',
  },
  compactDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  compactRight: {
    alignItems: 'flex-end',
  },
  compactMetric: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  compactVolume: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  separator: {
    height: 8,
  },
  flatListContainer: {
    flex: 1,
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
  loadMoreContainer: {
    padding: 16,
    margin: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  loadMoreButton: {
    borderColor: '#ff5252',
    minWidth: 200,
  },
  endText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingCard: {
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingSteps: {
    alignItems: 'center',
    gap: 8,
  },
  loadingStep: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loadingStepActive: {
    color: 'rgba(255, 255, 255, 1)',
    fontWeight: '600',
  },
  loadingTips: {
    borderRadius: 12,
    padding: 20,
    margin: 20,
    backgroundColor: '#ffffff',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
}); 