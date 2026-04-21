// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import SuperAdminDashboardScreen from '../screens/SuperAdminDashboardScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyTokenScreen from '../screens/VerifyTokenScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';


import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();

const HeaderBackButton = ({ onPress }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={{
      width: 38, 
      height: 38, 
      borderRadius: 10, 
      backgroundColor: 'rgba(255,255,255,0.15)', 
      justifyContent: 'center', 
      alignItems: 'center',
      marginLeft: 15,
      marginRight: 5
    }}
  >
    <Ionicons name="chevron-back" size={22} color="#ffffff" />
  </TouchableOpacity>
);

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
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
        name="SuperAdminDashboard"
        component={SuperAdminDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminPatientRecords"
        component={AdminPatientRecordsScreen}
        options={({ navigation }) => ({
          headerShown: true, 
          title: 'Historial',
          headerStyle: { backgroundColor: '#173746' },
          headerTintColor: '#ffffff',
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />
        })}
      />
      <Stack.Screen
        name="AdminPatientTracking"
        component={AdminPatientTrackingScreen}
        options={({ navigation }) => ({ 
          headerShown: true, 
          title: 'Seguimiento médico',
          headerStyle: { backgroundColor: '#173746' },
          headerTintColor: '#ffffff',
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />
        })}
      />
      <Stack.Screen
        name="AdminPatientAccess"
        component={AdminPatientAccessScreen}
        options={({ navigation }) => ({ 
          headerShown: true, 
          title: 'Control de acceso',
          headerStyle: { backgroundColor: '#173746' },
          headerTintColor: '#ffffff',
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />
        })}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ headerShown: false }}
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
    </Stack.Navigator>
    
  );
}