// App.js
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { View, Text, ActivityIndicator, PanResponder, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppNavigator from './src/navigation/AppNavigator';
import './src/i18n';
import { loadSavedLanguage } from './src/i18n';
import { ThemeProvider } from './src/context/ThemeContext';
import { storageService } from './src/services/storage/storageService';
import { logoutUserSession } from './src/services/api/authService';

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#091c2b' }}>
    <ActivityIndicator size="large" color="#18c6cd" />
    <Text style={{ marginTop: 20, color: 'white' }}>Cargando Lumex...</Text>
  </View>
);

const InactivityWrapper = ({ children, navigationRef }) => {
  const isIdleWarningActive = useRef(false);
  const idleTimer = useRef(null);
  const countdownInterval = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const IDLE_TIME = 60000; // 1 minuto de inactividad

  const clearTimers = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };

  const handleLogout = async () => {
    clearTimers();
    setShowModal(false);
    isIdleWarningActive.current = false;
    
    const user = await storageService.getUser();
    if (user?.id_registro) {
      await logoutUserSession(user.id_registro, 'cierre por inactividad');
    }
    
    await storageService.removeUser();
    
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
    startIdleTimer();
  };

  const showWarning = async () => {
    const user = await storageService.getUser();
    if (!user) {
      startIdleTimer();
      return;
    }

    isIdleWarningActive.current = true;
    setTimeLeft(30);
    setShowModal(true);

    countdownInterval.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startIdleTimer = () => {
    clearTimers();
    idleTimer.current = setTimeout(() => {
      showWarning();
    }, IDLE_TIME);
  };

  const handleContinue = () => {
    clearTimers();
    setShowModal(false);
    isIdleWarningActive.current = false;
    startIdleTimer();
  };

  const resetTimersFromTouch = () => {
    if (isIdleWarningActive.current) {
       return;
    }
    startIdleTimer();
  };

  useEffect(() => {
    startIdleTimer();
    return () => clearTimers();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimersFromTouch();
        return false;
      },
      onMoveShouldSetPanResponderCapture: () => {
        resetTimersFromTouch();
        return false;
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={38} color="#18c6cd" />
            </View>
            <Text style={styles.modalTitle}>¿Sigues ahí?</Text>
            <Text style={styles.modalText}>
              Por inactividad, tu sesión se cerrará en <Text style={styles.timeText}>{timeLeft}s</Text>
            </Text>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleContinue}>
              <Text style={styles.btnPrimaryText}>Continuar conectado</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={handleLogout}>
              <Text style={styles.btnSecondaryText}>Cerrar ahora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 15, 25, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'rgba(20, 39, 56, 0.95)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(15,109,120,0.4)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(24, 198, 205, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalText: {
    color: '#6f8d99',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  timeText: {
    color: '#18c6cd',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: '#18c6cd',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnSecondary: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#ff4d4d',
    fontWeight: '600',
    fontSize: 14,
  },
});

const AppContent = () => {
  const navigationRef = useNavigationContainerRef();

  return (
    <NavigationContainer ref={navigationRef}>
      <InactivityWrapper navigationRef={navigationRef}>
        <AppNavigator />
      </InactivityWrapper>
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