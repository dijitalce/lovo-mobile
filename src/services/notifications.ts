import React from 'react';
import { Alert } from 'react-native';

interface MachineStatus {
  id: number;
  name: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  workingTime?: number; // dakika cinsinden
}

class NotificationService {
  private machineStatuses: Map<number, MachineStatus> = new Map();
  private workingStartTimes: Map<number, Date> = new Map();

  async setupNotifications() {
    console.log('📱 Bildirim sistemi hazır!');
    // Expo notifications kurulduğunda gerçek implementasyon yapılacak
  }

  async updateMachineStatus(machine: MachineStatus) {
    const previousStatus = this.machineStatuses.get(machine.id);
    this.machineStatuses.set(machine.id, machine);

    // Makine durumu değişikliklerini kontrol et
    if (previousStatus) {
      // Makine açıldı
      if (previousStatus.status === 'offline' && machine.status === 'online') {
        this.workingStartTimes.set(machine.id, new Date());
        await this.sendMachineOnlineNotification(machine);
      }
      
      // Makine kapandı
      if (previousStatus.status === 'online' && machine.status === 'offline') {
        const workingTime = this.calculateWorkingTime(machine.id);
        this.workingStartTimes.delete(machine.id);
        await this.sendMachineOfflineNotification(machine, workingTime);
      }
    } else {
      // İlk durum kaydı
      if (machine.status === 'online') {
        this.workingStartTimes.set(machine.id, new Date());
      }
    }
  }

  private calculateWorkingTime(machineId: number): number {
    const startTime = this.workingStartTimes.get(machineId);
    if (!startTime) return 0;
    
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    return Math.floor(diffMs / (1000 * 60)); // dakika cinsinden
  }

  getCurrentWorkingTime(machineId: number): number {
    return this.calculateWorkingTime(machineId);
  }

  getWorkingTimeText(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} dakika`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} saat`;
      } else {
        return `${hours} saat ${remainingMinutes} dakika`;
      }
    }
  }

  private async sendMachineOnlineNotification(machine: MachineStatus) {
    console.log(`🟢 Bildirim: ${machine.name} açıldı`);
    
    // Simülasyon için alert göster (gerçek uygulamada expo-notifications kullanılacak)
    if (__DEV__) {
      Alert.alert(
        '🟢 Makine Açıldı',
        `${machine.name} makinesi çalışmaya başladı`,
        [{ text: 'Tamam' }]
      );
    }
  }

  private async sendMachineOfflineNotification(machine: MachineStatus, workingTimeMinutes: number) {
    const workingTimeText = this.getWorkingTimeText(workingTimeMinutes);
    console.log(`🔴 Bildirim: ${machine.name} kapandı (${workingTimeText})`);
    
    // Simülasyon için alert göster (gerçek uygulamada expo-notifications kullanılacak)
    if (__DEV__) {
      Alert.alert(
        '🔴 Makine Kapandı',
        `${machine.name} makinesi ${workingTimeText} çalıştıktan sonra kapandı`,
        [{ text: 'Tamam' }]
      );
    }
  }

  // Çalışan makinelerin süre bilgilerini al
  getActiveWorkingTimes(): { machineId: number; workingTime: number }[] {
    const activeTimes: { machineId: number; workingTime: number }[] = [];
    
    this.workingStartTimes.forEach((startTime, machineId) => {
      const machine = this.machineStatuses.get(machineId);
      if (machine?.status === 'online') {
        const workingTime = this.calculateWorkingTime(machineId);
        activeTimes.push({ machineId, workingTime });
      }
    });
    
    return activeTimes;
  }

  // Test bildirimi gönder
  async sendTestNotification() {
    Alert.alert(
      '🧪 Test Bildirimi',
      'Bildirim sistemi çalışıyor!',
      [{ text: 'Tamam' }]
    );
  }

  // Makine durumlarını temizle (logout için)
  clearAllStatuses() {
    this.machineStatuses.clear();
    this.workingStartTimes.clear();
  }
}

export const notificationService = new NotificationService();

// Uygulama içi bildirim hook'u
export function useInAppNotifications() {
  const [notifications, setNotifications] = React.useState<{
    id: string;
    title: string;
    message: string;
    type: 'machine_online' | 'machine_offline' | 'info';
    timestamp: Date;
    machineId?: number;
    workingTime?: number;
  }[]>([]);

  const addNotification = (notification: Omit<typeof notifications[0], 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Son 50 bildirimi tut
    
    // 10 saniye sonra otomatik kaldır
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 10000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Test bildirimleri ekle
  const addTestNotifications = () => {
    addNotification({
      title: '🟢 Makine Açıldı',
      message: 'Testere Makinesi çalışmaya başladı',
      type: 'machine_online',
      machineId: 1,
    });

    setTimeout(() => {
      addNotification({
        title: '🔴 Makine Kapandı',
        message: 'Testere Makinesi kapandı',
        type: 'machine_offline',
        machineId: 1,
        workingTime: 85, // 1 saat 25 dakika
      });
    }, 3000);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    addTestNotifications,
  };
} 