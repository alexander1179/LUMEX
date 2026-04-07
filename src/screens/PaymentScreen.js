// src/screens/PaymentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { storageService } from '../services/storage/storageService';
import { registerPayment } from '../services/supabase/paymentService';
import { CustomButton } from '../components/common/CustomButton';

const { width } = Dimensions.get('window');

const PLANS = [
  {
    id: 'single',
    title: 'Análisis Simple',
    description: 'Perfecto para una revisión rápida y detallada de tu salud actual.',
    credits: 1,
    price: 5,
    icon: 'document-text-outline',
    color: '#0f6d78',
    bg: '#f0f9fa'
  },
  {
    id: 'pro',
    title: 'Plan Salud Pro',
    description: 'Ahorra con 3 análisis para seguimiento preventivo mensual.',
    credits: 3,
    price: 12,
    icon: 'diamond-outline',
    color: '#1b5f79',
    bg: '#eef6f8',
    isPopular: true
  }
];

export default function PaymentScreen({ navigation }) {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUserData = async () => {
      const data = await storageService.getUser();
      setUser(data);
    };
    getUserData();
  }, []);

  const handlePayment = async () => {
    if (loading) return;
    
    const plan = PLANS.find(p => p.id === selectedPlan);
    const userId = user?.id_usuario || user?.id;

    if (!userId) {
      Alert.alert('Error', 'No se pudo identificar la sesión del usuario.');
      return;
    }

    setLoading(true);
    
    // Simulamos un pequeño delay de procesamiento de pasarela
    setTimeout(async () => {
      try {
        const result = await registerPayment(
          userId, 
          plan.price, 
          `LUMEX: ${plan.title} (${plan.credits} créditos)`, 
          plan.credits
        );

        if (result.success) {
          Alert.alert(
            '¡Pago Exitoso!',
            `Has adquirido ${plan.credits} crédito(s) de análisis correctamente en dólares (USD).`,
            [{ text: 'Comenzar Análisis', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Error', 'No se pudo procesar el pago en la base de datos.');
        }
      } catch (error) {
        Alert.alert('Error', 'Ocurrió un problema inesperado.');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back-outline" size={24} color="#0f6d78" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adquirir Análisis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topInfo}>
          <Ionicons name="wallet-outline" size={48} color="#0f6d78" />
          <Text style={styles.mainTitle}>Elige tu Plan</Text>
          <Text style={styles.mainSubtitle}>
            Para realizar un nuevo análisis de salud con IA, selecciona la opción que mejor se adapte a ti.
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              activeOpacity={0.9}
              onPress={() => setSelectedPlan(plan.id)}
              style={[
                styles.planCard,
                selectedPlan === plan.id && { borderColor: plan.color, borderWidth: 2, backgroundColor: plan.bg }
              ]}
            >
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MÁS RECOMENDADO</Text>
                </View>
              )}
              
              <View style={styles.planCardHeader}>
                <View style={[styles.planIconBox, { backgroundColor: plan.color }]}>
                  <Ionicons name={plan.icon} size={24} color="white" />
                </View>
                <View style={styles.planTextMain}>
                  <Text style={styles.planTitleText}>{plan.title}</Text>
                  <Text style={styles.planDescText}>{plan.description}</Text>
                </View>
              </View>

              <View style={styles.planPriceRow}>
                <View style={styles.creditsBox}>
                  <Text style={styles.creditsText}>{plan.credits} {plan.credits === 1 ? 'Análisis' : 'Análisis'}</Text>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <Text style={styles.priceText}>{plan.price}</Text>
                  <Text style={styles.currencyCode}>USD</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.secureBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#5f7f8d" />
          <Text style={styles.secureText}>Pago seguro y encriptado en dólares</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total a pagar:</Text>
          <Text style={styles.totalValue}>${PLANS.find(p => p.id === selectedPlan).price} USD</Text>
        </View>
        <CustomButton
           title={loading ? "Procesando..." : "Realizar Pago"}
           onPress={handlePayment}
           loading={loading}
           backgroundColor="#0f6d78"
           backgroundColorPressed="#0a4d55"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f6d78',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f6fbfd',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  topInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#173746',
    marginTop: 12,
  },
  mainSubtitle: {
    fontSize: 15,
    color: '#5f7f8d',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  plansContainer: {
    gap: 20,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#deedf3',
    shadowColor: '#173746',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#0f6d78',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  planIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTextMain: {
    flex: 1,
  },
  planTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#173746',
    marginBottom: 4,
  },
  planDescText: {
    fontSize: 13,
    color: '#5f7f8d',
    lineHeight: 18,
  },
  planPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f6f8',
  },
  creditsBox: {
    backgroundColor: '#deedf3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b5f79',
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#173746',
    marginRight: 2,
  },
  priceText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#173746',
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5f7f8d',
    marginLeft: 4,
  },
  secureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
  },
  secureText: {
    fontSize: 12,
    color: '#5f7f8d',
  },
  footer: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  totalLabel: {
    fontSize: 16,
    color: '#5f7f8d',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    color: '#173746',
    fontWeight: '900',
  }
});
