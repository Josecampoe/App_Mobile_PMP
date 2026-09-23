import '../global.css';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppProvider } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Obtener sesión actual al iniciar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      // No hay sesión y no está en pantallas de auth → redirigir al login
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      // Hay sesión y está en pantallas de auth → redirigir a la app
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0A1F0D',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator size="large" color="#43A047" />
        <Text style={{ color: '#81C784', marginTop: 16, fontSize: 14 }}>
          Cargando PMP Smart...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthGate>
      <AppProvider>
        <Stack>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ headerShown: false }} />
          <Stack.Screen name="resultado" options={{ headerShown: false }} />
        </Stack>
      </AppProvider>
    </AuthGate>
  );
}
