import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { authApi } from '../../lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    const result = await authApi.login(email.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Error de Acceso', result.error || 'No se pudo iniciar sesión.');
      return;
    }

    // Redirigir a la app principal
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A1F0D' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28 }}
          keyboardShouldPersistTaps="handled">
          
          {/* Logo / Branding */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: 'rgba(46, 125, 50, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#43A047',
                marginBottom: 20,
              }}>
              <FontAwesome name="leaf" size={40} color="#66BB6A" />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: '#E8F5E9',
                letterSpacing: 1,
              }}>
              PMP Smart
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#81C784',
                marginTop: 6,
                textAlign: 'center',
                lineHeight: 20,
              }}>
              Diagnóstico fitosanitario inteligente{'\n'}para tus cultivos de papa
            </Text>
          </View>

          {/* Formulario */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#A5D6A7', marginBottom: 6, letterSpacing: 0.5 }}>
              CORREO ELECTRÓNICO
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                paddingHorizontal: 14,
              }}>
              <FontAwesome name="envelope-o" size={16} color="#81C784" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor="#5C7A5E"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  color: '#E8F5E9',
                  fontSize: 15,
                }}
              />
            </View>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#A5D6A7', marginBottom: 6, letterSpacing: 0.5 }}>
              CONTRASEÑA
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                paddingHorizontal: 14,
              }}>
              <FontAwesome name="lock" size={18} color="#81C784" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#5C7A5E"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  color: '#E8F5E9',
                  fontSize: 15,
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <FontAwesome
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={18}
                  color="#81C784"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón de Login */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={{
              backgroundColor: '#2E7D32',
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              marginTop: 24,
              shadowColor: '#2E7D32',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
              opacity: isLoading ? 0.7 : 1,
            }}>
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 }}>
                Iniciar Sesión
              </Text>
            )}
          </TouchableOpacity>

          {/* Link a registro */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28 }}>
            <Text style={{ color: '#81C784', fontSize: 14 }}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={{ color: '#66BB6A', fontSize: 14, fontWeight: '700' }}>
                Regístrate aquí
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text
            style={{
              textAlign: 'center',
              color: '#4A6B4D',
              fontSize: 11,
              marginTop: 40,
              lineHeight: 16,
            }}>
            Protegemos tus datos y los de tus cultivos.{'\n'}
            PMP Smart © 2026
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
