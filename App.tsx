import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './src/store/useAuth';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0063FF',
    secondary: '#00D68F',
  },
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      const sd = await SecureStore.getItemAsync('subdomain');
      const tk = await SecureStore.getItemAsync('token');
      if (sd) {
        useAuth.setState({ subdomain: sd });
      }
      if (tk) {
        useAuth.setState({ token: tk });
      }
      setAppIsReady(true);
      await SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
} 