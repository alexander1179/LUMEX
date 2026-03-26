// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import './src/i18n';
import { loadSavedLanguage } from './src/i18n';
import { ThemeProvider } from './src/context/ThemeContext';

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#d32f2f' }}>
    <ActivityIndicator size="large" color="white" />
    <Text style={{ marginTop: 20, color: 'white' }}>Cargando Lumex...</Text>
  </View>
);

const AppContent = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadSavedLanguage();
      } catch (error) {
        console.log('Error initializing app:', error);
      } finally {
        setIsReady(true);
      }
    };
    initialize();
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}