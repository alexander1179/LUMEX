// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoleSelectScreen from '../screens/RoleSelectScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import GraciasScreen from '../screens/GraciasScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainScreen from '../screens/MainScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminPatientRecordsScreen from '../screens/AdminPatientRecordsScreen';
import AdminPatientTrackingScreen from '../screens/AdminPatientTrackingScreen';
import AdminPatientAccessScreen from '../screens/AdminPatientAccessScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyTokenScreen from '../screens/VerifyTokenScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import TestConnectionScreen from '../screens/TestConnectionScreen';
import TestSupabaseScreen from '../screens/TestSupabaseScreen';
import SimpleTestScreen from '../screens/SimpleTestScreen';
import TestRegistroScreen from '../screens/TestRegistroScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="RoleSelect"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#d32f2f',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="RoleSelect" 
        component={RoleSelectScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Gracias" 
        component={GraciasScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Main" 
        component={MainScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminPatientRecords"
        component={AdminPatientRecordsScreen}
        options={{
          headerShown: true, 
          title: 'Historial',
          headerStyle: { backgroundColor: '#173746' },
          headerTintColor: '#ffffff'
        }}
      />
      <Stack.Screen
        name="AdminPatientTracking"
        component={AdminPatientTrackingScreen}
        options={{ headerShown: true, title: 'Seguimiento médico' }}
      />
      <Stack.Screen
        name="AdminPatientAccess"
        component={AdminPatientAccessScreen}
        options={{ headerShown: true, title: 'Control de acceso' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VerifyToken" 
        component={VerifyTokenScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen} 
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="TestSupabase" 
        component={TestSupabaseScreen} 
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="SimpleTest" 
        component={SimpleTestScreen} 
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="TestConnection" 
        component={TestConnectionScreen} 
        options={{ headerShown: true, title: 'Test Supabase' }}
      />

      <Stack.Screen 
        name="TestRegistro" 
        component={TestRegistroScreen} 
        options={{ headerShown: true, title: 'Prueba Registro' }}
      />
    </Stack.Navigator>
    
  );
}