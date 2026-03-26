// src/styles/globalStyles.js
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  loginContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    paddingTop: 60
  },
  
  card: {
    width: "90%",
    backgroundColor: colors.secondary,
    borderRadius: 25,
    padding: 20,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  
  input: {
    backgroundColor: colors.secondaryLight,
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    color: colors.text.white,
    fontSize: 16
  },
  
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 25,
    alignItems: "center"
  },
  
  buttonText: {
    color: colors.text.white,
    fontWeight: "bold",
    fontSize: 16
  },
  
  disabledButton: {
    backgroundColor: "#999",
    opacity: 0.7
  },
  
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: colors.text.white
  },
  
  errorText: {
    color: colors.text.error,
    fontSize: 12,
    marginTop: 5
  },
  
  successText: {
    color: colors.text.success,
    fontSize: 12,
    marginTop: 5
  }
});