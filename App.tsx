import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { loadSavedLanguage } from './src/locales/i18n';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { MainNavigator } from './src/navigation/MainNavigator';
import { LoadingScreen } from './src/screens/LoadingScreen';

function App(): React.JSX.Element {
  const { user, loading, initialize } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      await loadSavedLanguage();
      await initialize();
    };

    initializeApp();
  }, [initialize]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={process.env.STRIPE_PUBLISHABLE_KEY || ''}>
          <NavigationContainer theme={theme}>
            {user ? <MainNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
