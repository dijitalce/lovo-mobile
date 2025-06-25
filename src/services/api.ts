import axios from 'axios';
import { useAuth } from '../store/useAuth';

// Türkçe karakterleri URL-safe hale getir
const sanitizeSubdomain = (subdomain: string) => {
  if (!subdomain) return subdomain;
  
  return subdomain
    .toLowerCase()
    // Unicode normalizasyonu yap
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Aksan işaretlerini kaldır
    // Türkçe karakterleri değiştir
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    // Büyük harfler için de
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c')
    // Unicode İ karakteri için özel durum
    .replace(/\u0130/g, 'i') // İ (Latin Capital Letter I With Dot Above)
    .replace(/\u0131/g, 'i') // ı (Latin Small Letter Dotless I)
    // Tüm non-ASCII karakterleri kaldır
    .replace(/[^\x00-\x7F]/g, '')
    .trim();
};

export const createApi = () => {
  const { subdomain, token } = useAuth.getState();
  const cleanSubdomain = sanitizeSubdomain(subdomain || '');

  console.log('Original subdomain:', subdomain);
  console.log('Clean subdomain:', cleanSubdomain);

  const instance = axios.create({
    baseURL: `https://${cleanSubdomain}.lovo.com.tr/api/`,
    timeout: 10000, // 10 saniye timeout
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // X-API-KEY kaldırıldı - auth bypass
    },
  });

  // Token varsa Authorization header'ını ekle
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Request interceptor - debug için
  instance.interceptors.request.use((config) => {
    console.log('API Request:', config.url, config.method?.toUpperCase());
    console.log('Full URL:', (config.baseURL || '') + (config.url || ''));
    console.log('Headers:', config.headers);
    return config;
  });

  // Response interceptor - hata yakalama
  instance.interceptors.response.use(
    (response) => {
      console.log('API Response:', response.config.url, response.status);
      return response;
    },
    (error) => {
      console.error('API Error:', error.config?.url, error.message);
      
      if (error.response?.status === 401) {
        // Token geçersizse oturumu kapat
        useAuth.getState().logout();
      }
      return Promise.reject(error);
    }
  );

  return instance;
}; 