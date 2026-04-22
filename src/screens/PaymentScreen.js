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
import { registerPayment } from '../services/api/paymentService';

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
    
    try {
      const result = await registerPayment(
        userId, 
        plan.price,           // amount
        plan.price,           // monto
        'Tarjeta',            // metodoPago
        `LUMEX: ${plan.title} (${plan.credits} créditos)`, // description
        plan.credits          // creditsToAdd
      );

      if (result.success) {
        Alert.alert(
          '¡Pago Exitoso!',
          result.message || 'La transacción ha sido realizada con éxito. Gracias por utilizar nuestros servicios.',
          [{ text: 'Comenzar Análisis', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.message || 'No se pudo procesar el pago en la base de datos.');
      }
    } catch (error) {
      console.log('Error en handlePayment:', error);
      Alert.alert('Error', 'Ocurrió un problema inesperado al procesar el pago.');
    } finally {
      setLoading(false);
    }
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
      </View>

      <View style={styles.fixedContent}>
        <View style={styles.topInfo}>
          <Ionicons name="wallet-outline" size={44} color="#0f6d78" />
          <Text style={styles.mainTitle}>Elige tu Plan</Text>
          <Text style={styles.mainSubtitle}>
            LUMEX: Bioanalítica de precisión para un monitoreo integral de tu bienestar.
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
                  <Text style={styles.popularBadgeText}>RECOMENDADO</Text>
                </View>
              )}
              
              <View style={styles.planCardHeader}>
                <View style={[styles.planIconBox, { backgroundColor: plan.color }]}>
                  <Ionicons name={plan.icon} size={22} color="white" />
                </View>
                <View style={styles.planTextMain}>
                  <Text style={styles.planTitleText}>{plan.title}</Text>
                  <Text style={styles.planDescText}>{plan.description}</Text>
                </View>
              </View>

              <View style={styles.planPriceRow}>
                <View style={styles.creditsBox}>
                  <Text style={styles.creditsText}>{plan.credits} Análisis</Text>
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
          <Ionicons name="shield-checkmark-outline" size={14} color="#5f7f8d" />
          <Text style={styles.secureText}>Pago seguro y encriptado (USD)</Text>
        </View>
      </View>

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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 5,
  },

  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f6fbfd',
  },
  fixedContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  topInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#173746',
    marginTop: 8,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#5f7f8d',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
    paddingHorizontal: 15,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
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
