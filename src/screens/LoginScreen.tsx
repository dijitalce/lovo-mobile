import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated, Dimensions, Platform } from 'react-native';
import axios from 'axios';
import { useAuth } from '../store/useAuth';
import { TextInput as PaperInput, Button, Snackbar, Text, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { subdomain, setToken } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Animasyon referansları
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const inputShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sayfa giriş animasyonu
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Kullanıcı adı ve şifre zorunlu');
      setSnackVisible(true);
      
      // Hata animasyonu
      Animated.sequence([
        Animated.timing(inputShake, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(inputShake, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(inputShake, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    try {
      setLoading(true);
      
      // Buton yükleme animasyonu
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }).start();

      const response = await axios.post(`https://${subdomain}.lovo.com.tr/api/login.php`, {
        username,
        password,
      });
      
      if (response.data?.token) {
        // Başarı animasyonu
        Animated.timing(buttonScale, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }).start();

        await setToken(response.data.token);
        // Başarılı girişten sonra Drawer'ı aç
        navigation.reset({ index: 0, routes: [{ name: 'Drawer' }] });
      } else {
        setError('Giriş başarısız');
        setSnackVisible(true);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Sunucu hatası');
      setSnackVisible(true);
    } finally {
      setLoading(false);
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <LinearGradient 
      colors={['#ffffff', '#f8faff', '#ffe5e5']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Dekoratif arka plan */}
      <View style={styles.backgroundElements}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Geri butonu */}
      <Animated.View style={[styles.backButton, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
          style={styles.backButtonGradient}
        >
                      <IconButton 
              icon="arrow-left" 
              size={24} 
              iconColor="#ff5252"
              style={styles.backBtn} 
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Subdomain');
                }
              }} 
          />
        </LinearGradient>
        <Text style={styles.backButtonText}>Fabrika Kodu</Text>
      </Animated.View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#ff6b6b', '#ff5252']}
            style={styles.logoGradient}
          >
            <Text style={styles.logoIcon}>🔐</Text>
          </LinearGradient>
        </View>

        {/* Başlık */}
        <Text variant="displaySmall" style={styles.title}>
          Hoş Geldiniz
        </Text>

        {/* Alt başlık */}
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subdomain} fabrikasına giriş yapın
        </Text>

        {/* Login Card */}
        <Animated.View 
          style={[
            styles.loginCard,
            { 
              transform: [
                { scale: cardScale },
                { translateX: inputShake }
              ]
            }
          ]}
        >
          {/* Kullanıcı adı input */}
          <View style={[styles.inputWrapper, usernameFocused && styles.inputWrapperFocused]}>
            <PaperInput
              label="Kullanıcı adı"
              mode="outlined"
              value={username}
              onChangeText={setUsername}
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
              autoCapitalize="none"
              left={<PaperInput.Icon icon="account" />}
              style={styles.input}
              contentStyle={styles.inputContent}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="#ff5252"
              outlineColor="transparent"
              textColor="#2c3e50"
              placeholderTextColor="#95a5a6"
              theme={{ 
                colors: { 
                  primary: '#ff5252',
                  onSurfaceVariant: '#7f8c8d'
                }
              }}
            />
          </View>

          {/* Şifre input */}
          <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
            <PaperInput
              label="Şifre"
              mode="outlined"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry
              left={<PaperInput.Icon icon="lock" />}
              style={styles.input}
              contentStyle={styles.inputContent}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="#ff5252"
              outlineColor="transparent"
              textColor="#2c3e50"
              placeholderTextColor="#95a5a6"
              theme={{ 
                colors: { 
                  primary: '#ff5252',
                  onSurfaceVariant: '#7f8c8d'
                }
              }}
            />
          </View>

          {/* Giriş butonu */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <LinearGradient
              colors={['#ff6b6b', '#ff5252', '#ff1744']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Button
                mode="text"
                loading={loading}
                onPress={handleLogin}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.buttonContent}
                disabled={loading}
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* Güvenlik notu */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🛡️ Verileriniz SSL ile korunmaktadır
          </Text>
        </View>

        {/* Alt İndikatör */}
        <View style={styles.indicatorContainer}>
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={[styles.indicator, styles.indicatorActive]} />
        </View>
      </Animated.View>

      <Snackbar 
        visible={snackVisible} 
        onDismiss={() => setSnackVisible(false)} 
        duration={3000}
        style={styles.snackbar}
        action={{
          label: 'Tamam',
          onPress: () => setSnackVisible(false),
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
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#ff5252',
    top: -60,
    right: -70,
  },
  circle2: {
    width: 140,
    height: 140,
    backgroundColor: '#ff1744',
    bottom: 120,
    left: -50,
  },
  circle3: {
    width: 90,
    height: 90,
    backgroundColor: '#ff6b6b',
    top: height * 0.25,
    right: 40,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonGradient: {
    borderRadius: 20,
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  backBtn: {
    margin: 0,
  },
  backButtonText: {
    marginLeft: 8,
    color: '#ff5252',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 36,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 40,
    opacity: 0.8,
  },
  loginCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 24,
  },
  inputWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#ff5252',
    backgroundColor: '#fff',
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  inputContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputOutline: {
    borderWidth: 0,
    borderRadius: 16,
  },
  buttonGradient: {
    borderRadius: 20,
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  securityNote: {
    backgroundColor: 'rgba(255, 235, 235, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 32,
  },
  securityText: {
    color: '#7f8c8d',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  indicatorActive: {
    backgroundColor: '#ff5252',
    width: 24,
  },
  snackbar: {
    backgroundColor: '#2c3e50',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 32,
  },
}); 