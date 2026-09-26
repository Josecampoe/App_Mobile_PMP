import '../global.css';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppProvider } from '../context/AppContext';
import { getAccessToken, authApi, authEvents } from '../lib/api';

function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay un token válido al iniciar
    checkAuth();

    // Escuchar eventos de login/registro/logout
    const unsubscribe = authEvents.subscribe((isAuth) => {
      setIsAuthenticated(isAuth);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        // Verificar que el token siga siendo válido
        const isValid = await authApi.isAuthenticated();
        setIsAuthenticated(isValid);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || isAuthenticated === null) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // No hay sesión y no está en pantallas de auth → redirigir al login
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Hay sesión y está en pantallas de auth → redirigir a la app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading]);

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
