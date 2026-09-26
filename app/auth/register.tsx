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
      // Registro exitoso con sesión automática
      router.replace('/(tabs)');
    } else {
      // Se requiere confirmación de email
      Alert.alert(
        '¡Cuenta Creada!',
        result.message || 'Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.',
        [{ text: 'Ir al Login', onPress: () => router.replace('/auth/login') }]
      );
    }
  };

  const RolButton = ({
    rolOption,
    icon,
    label,
    desc,
  }: {
    rolOption: RolUsuario;
    icon: string;
    label: string;
    desc: string;
  }) => {
    const isSelected = rol === rolOption;
    return (
      <TouchableOpacity
        onPress={() => setRol(rolOption)}
        style={{
          flex: 1,
          padding: 14,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: isSelected ? '#43A047' : 'rgba(255,255,255,0.12)',
          backgroundColor: isSelected ? 'rgba(46,125,50,0.2)' : 'rgba(255,255,255,0.05)',
          alignItems: 'center',
        }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isSelected ? 'rgba(67,160,71,0.3)' : 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}>
          <FontAwesome
            name={icon as any}
            size={20}
            color={isSelected ? '#66BB6A' : '#6B7280'}
          />
        </View>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: isSelected ? '#A5D6A7' : '#9CA3AF',
            marginBottom: 2,
          }}>
          {label}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: isSelected ? '#81C784' : '#6B7280',
            textAlign: 'center',
          }}>
          {desc}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A1F0D' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingVertical: 20 }}
          keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.08)',
              marginBottom: 20,
            }}>
            <FontAwesome name="arrow-left" size={14} color="#81C784" />
            <Text style={{ color: '#81C784', fontSize: 13, marginLeft: 8, fontWeight: '600' }}>
              Volver
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#E8F5E9', letterSpacing: 0.5 }}>
              Crear Cuenta
            </Text>
            <Text style={{ fontSize: 13, color: '#81C784', marginTop: 6, textAlign: 'center' }}>
              Únete a PMP Smart y protege tus cultivos
            </Text>
          </View>

          {/* Selector de Rol */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#A5D6A7', marginBottom: 10, letterSpacing: 0.5 }}>
            ¿CUÁL ES TU ROL?
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
            <RolButton
              rolOption="agricultor"
              icon="pagelines"
              label="Agricultor"
              desc="Gestiono mis parcelas"
            />
            <RolButton
              rolOption="tecnico"
              icon="stethoscope"
              label="Técnico"
              desc="Reviso diagnósticos"
            />
          </View>

          {/* Campo Nombre */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#A5D6A7', marginBottom: 6, letterSpacing: 0.5 }}>
              NOMBRE COMPLETO
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
              <FontAwesome name="user-o" size={16} color="#81C784" />
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder={rol === 'agricultor' ? 'Juan Pérez' : 'Ing. María López'}
                placeholderTextColor="#5C7A5E"
                autoCapitalize="words"
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  paddingHorizontal: 12,
                  color: '#E8F5E9',
                  fontSize: 15,
                }}
              />
            </View>
          </View>

          {/* Campo Email */}
          <View style={{ marginBottom: 16 }}>
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
                  paddingVertical: 13,
                  paddingHorizontal: 12,
                  color: '#E8F5E9',
                  fontSize: 15,
                }}
              />
            </View>
          </View>

          {/* Campo Contraseña */}
          <View style={{ marginBottom: 16 }}>
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
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#5C7A5E"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  paddingHorizontal: 12,
                  color: '#E8F5E9',
                  fontSize: 15,
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color="#81C784" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar Contraseña */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#A5D6A7', marginBottom: 6, letterSpacing: 0.5 }}>
              CONFIRMAR CONTRASEÑA
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
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#5C7A5E"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  paddingHorizontal: 12,
                  color: '#E8F5E9',
                  fontSize: 15,
                }}
              />
            </View>
          </View>

          {/* Botón Registrar */}
          <TouchableOpacity
            onPress={handleRegister}
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
                Crear Cuenta como {rol === 'agricultor' ? 'Agricultor' : 'Técnico'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Link a login */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 20 }}>
            <Text style={{ color: '#81C784', fontSize: 14 }}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={{ color: '#66BB6A', fontSize: 14, fontWeight: '700' }}>
                Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
