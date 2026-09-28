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
import type { RolUsuario } from '../../lib/types';

export default function RegisterScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState<RolUsuario>('agricultor');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Completa todos los campos obligatorios.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden', 'Verifica que ambas contraseñas sean iguales.');
      return;
    }

    setIsLoading(true);

    const result = await authApi.register({
      email: email.trim(),
      password,
      nombre: nombre.trim(),
      rol,
    });

    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Error de Registro', result.error || 'No se pudo crear la cuenta.');
      return;
    }

    if (result.data) {
      router.replace('/(tabs)');
    } else {
      Alert.alert(
        '¡Cuenta Creada!',
        result.message || 'Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.',
        [{ text: 'Ir al Login', onPress: () => router.replace('/auth/login') }]
      );
    }
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
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingVertical: 20 }}
          keyboardShouldPersistTaps="handled">
          
          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              marginBottom: 28,
            }}>
            <FontAwesome name="chevron-left" size={12} color="rgba(200, 230, 201, 0.5)" />
            <Text style={{ color: 'rgba(200, 230, 201, 0.5)', fontSize: 13, marginLeft: 8, fontWeight: '500' }}>
              Volver
            </Text>
          </TouchableOpacity>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Header */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#F1F8E9', letterSpacing: -0.5 }}>
                Crear cuenta
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(200, 230, 201, 0.5)', marginTop: 6 }}>
                Elige tu rol para comenzar
              </Text>
            </View>

            {/* Rol Selector */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
              {[
                { key: 'agricultor' as RolUsuario, icon: 'pagelines', label: 'Agricultor', sub: 'Gestiono cultivos' },
                { key: 'tecnico' as RolUsuario, icon: 'stethoscope', label: 'Técnico', sub: 'Reviso diagnósticos' },
              ].map((item) => {
                const selected = rol === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setRol(item.key)}
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: selected ? '#4CAF50' : 'rgba(255,255,255,0.08)',
                      backgroundColor: selected ? 'rgba(76, 175, 80, 0.12)' : 'rgba(255,255,255,0.03)',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: selected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.06)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}>
                      <FontAwesome
                        name={item.icon as any}
                        size={18}
                        color={selected ? '#66BB6A' : 'rgba(200, 230, 201, 0.3)'}
                      />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? '#C8E6C9' : 'rgba(200, 230, 201, 0.4)', marginBottom: 2 }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 10, color: selected ? 'rgba(200, 230, 201, 0.5)' : 'rgba(200, 230, 201, 0.2)', textAlign: 'center' }}>
                      {item.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(200, 230, 201, 0.5)', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Nombre completo
              </Text>
              <View style={getFieldStyle('nombre')}>
                <FontAwesome name="user-o" size={14} color={focusedField === 'nombre' ? '#66BB6A' : 'rgba(200, 230, 201, 0.3)'} />
                <TextInput
                  value={nombre}
                  onChangeText={setNombre}
                  onFocus={() => setFocusedField('nombre')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={rol === 'agricultor' ? 'Juan Pérez' : 'Ing. María López'}
                  placeholderTextColor="rgba(200, 230, 201, 0.25)"
                  autoCapitalize="words"
                  style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 14, color: '#E8F5E9', fontSize: 15 }}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(200, 230, 201, 0.5)', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Correo electrónico
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
                  style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 14, color: '#E8F5E9', fontSize: 15 }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 16 }}>
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
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="rgba(200, 230, 201, 0.25)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 14, color: '#E8F5E9', fontSize: 15 }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={16} color="rgba(200, 230, 201, 0.4)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(200, 230, 201, 0.5)', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Confirmar contraseña
              </Text>
              <View style={getFieldStyle('confirm')}>
                <FontAwesome name="lock" size={15} color={focusedField === 'confirm' ? '#66BB6A' : 'rgba(200, 230, 201, 0.3)'} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="rgba(200, 230, 201, 0.25)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 14, color: '#E8F5E9', fontSize: 15 }}
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
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
                  Crear cuenta
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28, marginBottom: 20 }}>
              <Text style={{ color: 'rgba(200, 230, 201, 0.5)', fontSize: 13 }}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.replace('/auth/login')}>
                <Text style={{ color: '#66BB6A', fontSize: 13, fontWeight: '600' }}>
                  Inicia sesión
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
