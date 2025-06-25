import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Animated, Dimensions } from 'react-native';
import { Button, Text, TextInput as PaperInput, Snackbar, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../store/useAuth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');

export default function SubdomainScreen() {
  const { setSubdomain } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [snack, setSnack] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animasyon referansları
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const inputScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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
    ]).start();
  }, []);

  const handleContinue = () => {
    if (value.trim()) {
      // Buton animasyonu
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Subdomain'i temizle ve küçük harfe çevir
      const cleanSubdomain = value.trim()
        .toLowerCase()
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
        .replace(/[^\x00-\x7F]/g, '');

      console.log('Original input:', value.trim());
      console.log('Clean subdomain:', cleanSubdomain);

      setSubdomain(cleanSubdomain);
      navigation.navigate('Login');
    } else {
      setError('Fabrika kodu gerekli');
      setSnack(true);
      
      // Hata animasyonu
      Animated.sequence([
        Animated.timing(inputScale, {
          toValue: 1.02,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(inputScale, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(inputScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(inputScale, {
      toValue: 1.02,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(inputScale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
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
      {navigation.canGoBack() && (
        <Animated.View style={[styles.backButton, { opacity: fadeAnim }]}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#5a6c7d"
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          />
        </Animated.View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.keyboardContainer}
      >
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
          {/* İkon Container */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#ff6b6b', '#ff5252']}
              style={styles.iconGradient}
            >
              <Text style={styles.factoryIcon}>🏭</Text>
            </LinearGradient>
          </View>

          {/* Başlık */}
          <Text variant="displaySmall" style={styles.title}>
            Fabrika Kodunuz
          </Text>

          {/* Alt başlık */}
          <Text variant="bodyLarge" style={styles.subtitle}>
            Fabrikanıza özel kodunuzu girerek{'\n'}sisteme erişim sağlayın
          </Text>

          {/* Input Container */}
          <Animated.View 
            style={[
              styles.inputContainer,
              { transform: [{ scale: inputScale }] }
            ]}
          >
            <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
              <PaperInput
                mode="flat"
                placeholder="örn. fabrikaadi"
                value={value}
                onChangeText={(text) => {
                  // Gerçek zamanlı temizlik - sadece küçük harf göster
                  const cleanText = text
                    .toLowerCase()
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
                    .replace(/[^\x00-\x7Fa-z0-9]/g, ''); // Sadece ASCII + rakam + harf
                  setValue(cleanText);
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                left={<PaperInput.Icon icon="factory" />}
                right={<PaperInput.Affix text=".lovo.com.tr" textStyle={styles.suffixText} />}
                style={styles.input}
                contentStyle={styles.inputContent}
                underlineStyle={{ display: 'none' }}
                activeUnderlineColor="transparent"
                textColor="#2c3e50"
                placeholderTextColor="#95a5a6"
              />
            </View>
          </Animated.View>

          {/* Örnek gösterge */}
          <View style={styles.exampleContainer}>
            <Text style={styles.exampleText}>
              💡 Örnek: fabrikaadi → fabrikaadi.lovo.com.tr
            </Text>
          </View>

          {/* Devam butonu */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <LinearGradient
              colors={['#ff6b6b', '#ff5252', '#ff1744']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Button
                mode="text"
                onPress={handleContinue}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.buttonContent}
              >
                Devam Et
              </Button>
            </LinearGradient>
          </Animated.View>

          {/* Alt İndikatör */}
          <View style={styles.indicatorContainer}>
            <View style={styles.indicator} />
            <View style={[styles.indicator, styles.indicatorActive]} />
            <View style={styles.indicator} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      <Snackbar 
        visible={snack} 
        onDismiss={() => setSnack(false)} 
        duration={3000}
        style={styles.snackbar}
        action={{
          label: 'Tamam',
          onPress: () => setSnack(false),
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
    width: 180,
    height: 180,
    backgroundColor: '#ff5252',
    top: -40,
    right: -60,
  },
  circle2: {
    width: 120,
    height: 120,
    backgroundColor: '#ff1744',
    bottom: 150,
    left: -40,
  },
  circle3: {
    width: 80,
    height: 80,
    backgroundColor: '#ff6b6b',
    top: height * 0.2,
    right: 50,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
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
  factoryIcon: {
    fontSize: 36,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 40,
    lineHeight: 24,
    opacity: 0.8,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#ff5252',
    shadowColor: '#ff5252',
    shadowOpacity: 0.2,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  inputContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  suffixText: {
    color: '#95a5a6',
    fontSize: 14,
  },
  exampleContainer: {
    backgroundColor: 'rgba(255, 235, 235, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#ff5252',
  },
  exampleText: {
    color: '#7f8c8d',
    fontSize: 13,
    fontStyle: 'italic',
  },
  buttonGradient: {
    borderRadius: 25,
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 32,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 40,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
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