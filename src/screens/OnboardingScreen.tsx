import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { Button, Text } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Onboarding'>) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Giriş animasyonları
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
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 700,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleButtonPress = () => {
    // Buton basım animasyonu
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.replace('Subdomain');
    });
  };

  return (
    <LinearGradient 
      colors={["#ffffff", "#f8faff", "#ffe5e5"]} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Dekoratif arka plan elementleri */}
      <View style={styles.backgroundElements}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Lottie Animasyon */}
        <View style={styles.animationContainer}>
          <LottieView
            source={require('../../assets/lottie/welcome.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>

        {/* Ana Başlık */}
        <Text variant="displaySmall" style={styles.title}>
          LOVO'ya Hoş Geldiniz
        </Text>

        {/* Alt Başlık */}
        <Text variant="bodyLarge" style={styles.subtitle}>
          Fabrikanızdaki makineleri artık{'\n'}cebinizden kolayca izleyin
        </Text>

        {/* Özellik Kartları */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text variant="bodyMedium" style={styles.featureText}>Mobil İzleme</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text variant="bodyMedium" style={styles.featureText}>Gerçek Zamanlı</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔔</Text>
            <Text variant="bodyMedium" style={styles.featureText}>Anlık Bildirim</Text>
          </View>
        </View>

        {/* Başlayalım Butonu */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <LinearGradient
            colors={['#ff6b6b', '#ff5252', '#ff1744']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Button
              mode="text"
              onPress={handleButtonPress}
              labelStyle={styles.buttonLabel}
              contentStyle={styles.buttonContent}
            >
              Başlayalım
            </Button>
          </LinearGradient>
        </Animated.View>

        {/* Alt İndikatör */}
        <View style={styles.indicatorContainer}>
          <View style={[styles.indicator, styles.indicatorActive]} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
        </View>
      </Animated.View>
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
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#ff5252',
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#ff1744',
    bottom: 100,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#ff6b6b',
    top: height * 0.3,
    right: 30,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  animationContainer: {
    marginBottom: 32,
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  lottieAnimation: {
    width: width * 0.65,
    height: width * 0.65,
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
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 50,
    paddingHorizontal: 16,
    gap: 12,
  },
  featureCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    width: (width - 80) / 3,
    height: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.1)',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  featureText: {
    color: '#5a6c7d',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  buttonGradient: {
    borderRadius: 25,
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 32,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginTop: 30,
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
}); 