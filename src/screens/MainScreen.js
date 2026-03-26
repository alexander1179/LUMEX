// src/screens/MainScreen.js
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { storageService } from '../services/storage/storageService';
import { colors } from '../styles/colors';
import { LanguageSelector } from '../components/common/LanguageSelector';

const icon = require('../../assets/lumex.jpeg');

export default function MainScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await storageService.getUser();
        if (userData) {
          setUser(userData);
        } else {
          navigation.replace("Login");
        }
      } catch (error) {
        console.log("Error getting user:", error);
      }
    };
    getUser();
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const cerrarSesion = async () => {
    try {
      await storageService.removeUser();
      Alert.alert(
        t('main.logoutSuccess'), 
        t('main.logoutMessage'),
        [{ text: "OK", onPress: () => navigation.replace("Login") }]
      );
    } catch (error) {
      console.log("Error logging out:", error);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      {/* Header con bienvenida y selector de idioma */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <LanguageSelector />
        </View>
        <Image source={icon} style={styles.logo} />
        <Text style={styles.welcomeText}>
          {t('main.welcome')}, {user?.nombre || user?.usuario}!
        </Text>
      </View>

      {/* Tarjeta principal */}
      <View style={styles.card}>
        <Text style={styles.title}>
          {t('main.title')}
        </Text>
        
        <View style={styles.divider} />

        <Text style={styles.paragraph}>
          {t('main.description')}
        </Text>

        <Text style={styles.paragraph}>
          {t('main.description2')}
        </Text>

        {/* Sección de aplicaciones */}
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('aplicaciones')}
        >
          <Text style={styles.sectionTitle}>📊 {t('main.applications')}</Text>
          <Text style={styles.sectionIcon}>
            {expandedSection === 'aplicaciones' ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {expandedSection === 'aplicaciones' && (
          <View style={styles.sectionContent}>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>{t('main.cybersecurity').split(':')[0]}:</Text> {t('main.cybersecurity').split(':')[1]}
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>{t('main.finance').split(':')[0]}:</Text> {t('main.finance').split(':')[1]}
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>{t('main.medicine').split(':')[0]}:</Text> {t('main.medicine').split(':')[1]}
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>{t('main.quality').split(':')[0]}:</Text> {t('main.quality').split(':')[1]}
              </Text>
            </View>
          </View>
        )}

        {/* Sección de investigadores */}
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('investigadores')}
        >
          <Text style={styles.sectionTitle}>👥 {t('main.researchers')}</Text>
          <Text style={styles.sectionIcon}>
            {expandedSection === 'investigadores' ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {expandedSection === 'investigadores' && (
          <View style={styles.sectionContent}>
            <View style={styles.researcherCard}>
              <Text style={styles.researcherName}>Luna Tatiana Riveros Rodriguez</Text>
              <Text style={styles.researcherRole}>Estudiante de Ingenieria de Software</Text>
            </View>
            <View style={styles.researcherCard}>
              <Text style={styles.researcherName}>Alexander Higuera Paz</Text>
              <Text style={styles.researcherRole}>Estudiante de Ingenieria de sistemas e Ingenieria de Software.</Text>
            </View>
          </View>
        )}

        {/* Sección de características técnicas */}
        <View style={styles.techSection}>
          <Text style={styles.techTitle}>⚙️ {t('main.techFeatures')}</Text>
          
          <View style={styles.techGrid}>
            <View style={styles.techItem}>
              <Text style={styles.techIcon}>📥</Text>
              <Text style={styles.techLabel}>{t('main.encoder')}</Text>
              <Text style={styles.techDesc}>{t('main.encoderDesc')}</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techIcon}>🧠</Text>
              <Text style={styles.techLabel}>{t('main.latentSpace')}</Text>
              <Text style={styles.techDesc}>{t('main.latentSpaceDesc')}</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techIcon}>📤</Text>
              <Text style={styles.techLabel}>{t('main.decoder')}</Text>
              <Text style={styles.techDesc}>{t('main.decoderDesc')}</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techIcon}>📊</Text>
              <Text style={styles.techLabel}>{t('main.error')}</Text>
              <Text style={styles.techDesc}>{t('main.errorDesc')}</Text>
            </View>
          </View>
        </View>

        {/* Botón de análisis */}
        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={() => Alert.alert(
            t('main.analyzeButton'),
            t('main.analyzeMessage')
          )}
        >
          <Text style={styles.analyzeButtonText}>🔍 {t('main.analyzeButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de cerrar sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={cerrarSesion}>
        <Text style={styles.logoutText}>🚪 {t('main.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTop: {
    position: 'absolute',
    top: 50,
    right: 15,
    zIndex: 10,
  },
  logo: {
    width: 350,
    height: 120,
  },
  welcomeText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  card: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 28,
  },
  divider: {
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: 15,
    opacity: 0.3,
  },
  paragraph: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 15,
    textAlign: "justify",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  sectionIcon: {
    fontSize: 16,
    color: colors.primary,
  },
  sectionContent: {
    padding: 15,
    backgroundColor: "#fafafa",
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 10,
    paddingRight: 10,
  },
  bullet: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 10,
    fontWeight: "bold",
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  bold: {
    fontWeight: "bold",
    color: "#333",
  },
  researcherCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    elevation: 1,
  },
  researcherName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  researcherRole: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  techSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
  },
  techTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  techGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  techItem: {
    width: "48%",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  techIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  techLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  techDesc: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  analyzeButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 10,
    elevation: 5,
  },
  analyzeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#666",
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 30,
  },
  logoutText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});