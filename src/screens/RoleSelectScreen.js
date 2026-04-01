import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LanguageSelector } from '../components/common/LanguageSelector';

const adminImage = require('../../assets/icon.png');
const userImage = require('../../assets/lumex.jpeg');

export default function RoleSelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LanguageSelector />
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Lumex</Text>
        <Text style={styles.title}>Selecciona tu acceso</Text>
        <Text style={styles.subtitle}>Elige el perfil con el que deseas ingresar a la aplicación.</Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login', { role: 'admin' })}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.imageFrameAdmin}>
              <Image source={adminImage} style={styles.adminImage} />
            </View>
            <View style={styles.cardTextBlock}>
              <Text style={styles.badgeText}>Administrador</Text>
              <Text style={styles.cardTitle}>Panel administrativo</Text>
              <Text style={styles.cardDescription}>Accede con credenciales autorizadas para gestionar la aplicación.</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Welcome')}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.imageFrameUser}>
              <Image source={userImage} style={styles.userImage} />
              <View style={styles.imageOverlay} />
            </View>
            <View style={styles.cardTextBlock}>
              <Text style={styles.badgeText}>Usuario</Text>
              <Text style={styles.cardTitle}>Portal de usuario</Text>
              <Text style={styles.cardDescription}>Continúa si ya tienes cuenta o crea un nuevo acceso personal.</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <StatusBar barStyle="dark-content" backgroundColor="#f3f1ec" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f1ec',
    paddingHorizontal: 20,
    paddingTop: 58,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 28,
  },
  hero: {
    marginBottom: 28,
  },
  eyebrow: {
    color: '#6f6a62',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: '#161616',
    fontSize: 31,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    color: '#5f5a54',
    fontSize: 15,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 18,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fbfaf7',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dfd9cf',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardTextBlock: {
    flex: 1,
  },
  imageFrameAdmin: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#ece7de',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageFrameUser: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#e5e0d6',
    overflow: 'hidden',
    position: 'relative',
  },
  adminImage: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
    opacity: 0.72,
  },
  userImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.65,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(236, 231, 222, 0.38)',
  },
  badgeText: {
    color: '#6b655f',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  cardTitle: {
    color: '#161616',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDescription: {
    color: '#5f5a54',
    fontSize: 14,
    lineHeight: 21,
  },
});
