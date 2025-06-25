import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface InAppNotificationProps {
  id: string;
  title: string;
  message: string;
  type: 'machine_online' | 'machine_offline' | 'info';
  onDismiss: (id: string) => void;
  duration?: number;
  workingTime?: number;
}

export default function InAppNotification({
  id,
  title,
  message,
  type,
  onDismiss,
  duration = 8000,
  workingTime,
}: InAppNotificationProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Giriş animasyonu
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // İlerleme çubuğu animasyonu
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();

    // Otomatik kapatma
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  const getNotificationStyle = () => {
    switch (type) {
      case 'machine_online':
        return {
          colors: ['#4CAF50', '#45a049'],
          icon: 'play-circle',
          iconColor: '#ffffff',
        };
      case 'machine_offline':
        return {
          colors: ['#f44336', '#d32f2f'],
          icon: 'stop-circle',
          iconColor: '#ffffff',
        };
      default:
        return {
          colors: ['#2196F3', '#1976D2'],
          icon: 'information',
          iconColor: '#ffffff',
        };
    }
  };

  const notificationStyle = getNotificationStyle();

  const formatWorkingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} dakika`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} saat`;
      } else {
        return `${hours}s ${remainingMinutes}dk`;
      }
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity onPress={handleDismiss} activeOpacity={0.95}>
        <Surface style={styles.notification} elevation={5}>
          <LinearGradient
            colors={notificationStyle.colors as [string, string]}
            style={styles.notificationGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.notificationContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={notificationStyle.icon as any}
                  size={28}
                  color={notificationStyle.iconColor}
                />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
                {workingTime !== undefined && (
                  <Text style={styles.workingTime}>
                    ⏱️ Çalışma Süresi: {formatWorkingTime(workingTime)}
                  </Text>
                )}
              </View>
              
              <IconButton
                icon="close"
                size={20}
                iconColor="rgba(255, 255, 255, 0.8)"
                onPress={handleDismiss}
                style={styles.closeButton}
              />
            </View>
            
            {/* İlerleme çubuğu */}
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </LinearGradient>
        </Surface>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notification: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  notificationGradient: {
    padding: 16,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 18,
    marginBottom: 4,
  },
  workingTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    margin: 0,
    marginTop: -4,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 12,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
}); 