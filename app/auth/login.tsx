import { useState, useEffect, useRef } from 'react';
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
  Animated,
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

    router.replace('/(tabs)');
  };

  const getFieldStyle = (fieldName: string) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: focusedField === fieldName ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: focusedField === fieldName ? '#4CAF50' : 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F1A12' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
          keyboardShouldPersistTaps="handled">
          
          {/* Logo */}
          <Animated.View
            style={{
              alignItems: 'center',
              marginBottom: 48,
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: 'rgba(76, 175, 80, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
              <FontAwesome name="leaf" size={32} color="#66BB6A" />
            </View>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '700',
                color: '#F1F8E9',
                letterSpacing: -0.5,
              }}>
              PMP Smart
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: 'rgba(200, 230, 201, 0.7)',
                marginTop: 8,
                textAlign: 'center',
                lineHeight: 19,
              }}>
              Monitoreo fitosanitario para{'\n'}cultivos de papa
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}>
            {/* Email */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(200, 230, 201, 0.5)', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Correo
              </Text>
              <View style={getFieldStyle('email')}>
                <FontAwesome name="at" size={14} color={focusedField === 'email' ? '#66BB6A' : 'rgba(200, 230, 201, 0.3)'} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="tu@correo.com"
                  placeholderTextColor="rgba(200, 230, 201, 0.25)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={{
                    flex: 1,
                    paddingVertical: 15,
                    paddingHorizontal: 14,
                    color: '#E8F5E9',
                    fontSize: 15,
                  }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(200, 230, 201, 0.5)', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Contraseña
              </Text>
              <View style={getFieldStyle('password')}>
                <FontAwesome name="lock" size={15} color={focusedField === 'password' ? '#66BB6A' : 'rgba(200, 230, 201, 0.3)'} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(200, 230, 201, 0.25)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    paddingVertical: 15,
                    paddingHorizontal: 14,
                    color: '#E8F5E9',
                    fontSize: 15,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <FontAwesome
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={16}
                    color="rgba(200, 230, 201, 0.4)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#388E3C',
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                marginTop: 28,
                opacity: isLoading ? 0.7 : 1,
              }}>
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>
                  Iniciar Sesión
                </Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
              <Text style={{ color: 'rgba(200, 230, 201, 0.5)', fontSize: 13 }}>¿Sin cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={{ color: '#66BB6A', fontSize: 13, fontWeight: '600' }}>
                  Crear una
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <Text
            style={{
              textAlign: 'center',
              color: 'rgba(200, 230, 201, 0.2)',
              fontSize: 10,
              marginTop: 48,
              lineHeight: 15,
            }}>
            PMP Smart © 2026
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
