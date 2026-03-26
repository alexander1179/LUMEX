// src/screens/GraciasScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

const icon = require('../../assets/lumex.jpeg');

export default function GraciasScreen({ navigation }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Image source={icon} style={styles.image} />
      <Text style={styles.text}>
        {t('gracias.message') || 'Gracias por visitar Lumex.'}
      </Text>
      <TouchableOpacity
        style={[globalStyles.button, { marginTop: 20, width: 200 }]}
        onPress={() => navigation.replace("Privacy")}
      >
        <Text style={globalStyles.buttonText}>{t('common.back')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#f5f5f5"
  },
  image: {
    width: 350,
    height: 100,
    marginBottom: 20,
  },
  text: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20
  }
});