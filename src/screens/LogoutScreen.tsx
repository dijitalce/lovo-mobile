import { useEffect } from 'react';
import { View } from 'react-native';
import { useAuth } from '../store/useAuth';
import { useNavigation, CommonActions } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export default function LogoutScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const performLogout = async () => {
      try {
        const auth = useAuth.getState();

        // Oturum ve alan adı bilgilerini temizle
        await auth.logout();
        await auth.setSubdomain(null);
        await SecureStore.deleteItemAsync('subdomain');

        // CommonActions ile güvenli reset
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          })
        );
      } catch (error) {
        console.error('Logout error:', error);
        // Hata durumunda da yönlendirme yap
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          })
        );
      }
    };

    performLogout();
  }, [navigation]);

  return <View />; // boş ekran
} 