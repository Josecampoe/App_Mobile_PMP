import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ApiResponse,
  AuthResponse,
  LoginDTO,
  RegisterDTO,
  PerfilResponse,
  Cultivo,
  CreateCultivoDTO,
  UpdateCultivoDTO,
  Analisis,
  CreateAnalisisDTO,
  CreateRevisionDTO,
  RevisionTecnica,
  RolUsuario,
} from './types';

// Re-exportar tipos para que los componentes importen desde aquí
export type {
  ApiResponse,
  AuthResponse,
  LoginDTO,
  RegisterDTO,
  PerfilResponse,
  Cultivo,
  CreateCultivoDTO,
  UpdateCultivoDTO,
  Analisis,
  CreateAnalisisDTO,
  CreateRevisionDTO,
  RevisionTecnica,
  RolUsuario,
};

// ============================================================
// Configuración
// ============================================================

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = '@pmp_smart_access_token';
const REFRESH_TOKEN_KEY = '@pmp_smart_refresh_token';

// ============================================================
// Gestión de tokens
// ============================================================

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

// ============================================================
// Fetch wrapper con auth automática
// ============================================================

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await response.json() as ApiResponse<T>;

    // Si el token expiró, intentar renovar
    if (response.status === 401 && token) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Reintentar con el nuevo token
        const newToken = await getAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        return retryResponse.json() as Promise<ApiResponse<T>>;
      }
    }

    return json;
  } catch (error) {
    console.warn(`Error en API ${endpoint}:`, error);
    return {
      success: false,
      error: 'Error de conexión con el servidor. Verifica tu conexión a internet.',
    };
  }
}

/** Enviar FormData (para upload de archivos) */
async function apiFetchFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {};
  // NO poner Content-Type — fetch lo establece automáticamente con boundary
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return response.json() as Promise<ApiResponse<T>>;
  } catch (error) {
    console.warn(`Error en API upload ${endpoint}:`, error);
    return {
      success: false,
      error: 'Error al subir archivo.',
    };
  }
}

/** Intentar renovar el token con el refresh token */
async function tryRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const json = await response.json() as ApiResponse<AuthResponse>;

    if (json.success && json.data) {
      await saveTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }

    // Refresh falló — limpiar tokens
    await clearTokens();
    return false;
  } catch {
    return false;
  }
}

// ============================================================
// Eventos de Autenticación
// ============================================================

type AuthListener = (isAuthenticated: boolean) => void;
const authListeners = new Set<AuthListener>();

export const authEvents = {
  subscribe: (listener: AuthListener) => {
    authListeners.add(listener);
    return () => { authListeners.delete(listener); };
  },
  notify: (isAuthenticated: boolean) => {
    authListeners.forEach(l => l(isAuthenticated));
  }
};

// ============================================================
// API de Autenticación
// ============================================================

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const result = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.data) {
      await saveTokens(result.data.accessToken, result.data.refreshToken);
      authEvents.notify(true);
    }

    return result;
  },

  async register(data: RegisterDTO): Promise<ApiResponse<AuthResponse>> {
    const result = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success && result.data) {
      await saveTokens(result.data.accessToken, result.data.refreshToken);
      authEvents.notify(true);
    }

    return result;
  },

  async logout(): Promise<void> {
    await clearTokens();
    authEvents.notify(false);
  },

  /** Verifica si hay un token válido guardado */
  async isAuthenticated(): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) return false;

    const result = await apiFetch('/api/perfil');
    return result.success;
  },
};

// ============================================================
// API de Perfil
// ============================================================

export const perfilApi = {
  async get(): Promise<ApiResponse<PerfilResponse>> {
    return apiFetch<PerfilResponse>('/api/perfil');
  },

  async update(datos: Record<string, any>): Promise<ApiResponse> {
    return apiFetch('/api/perfil', {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async cambiarRol(rol: RolUsuario): Promise<ApiResponse> {
    return apiFetch('/api/perfil/rol', {
      method: 'PUT',
      body: JSON.stringify({ rol }),
    });
  },
};

// ============================================================
// API de Cultivos
// ============================================================

export const cultivosApi = {
  async list(): Promise<ApiResponse<Cultivo[]>> {
    return apiFetch<Cultivo[]>('/api/cultivos');
  },

  async create(data: CreateCultivoDTO): Promise<ApiResponse<Cultivo>> {
    return apiFetch<Cultivo>('/api/cultivos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateCultivoDTO): Promise<ApiResponse<Cultivo>> {
    return apiFetch<Cultivo>(`/api/cultivos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<ApiResponse> {
    return apiFetch(`/api/cultivos/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// API de Análisis
// ============================================================


export const analisisApi = {
  async procesar(imageUri: string): Promise<ApiResponse<any>> {
    try {
      // Intentar limpiar la URL para Android si es necesario
      const cleanUri = decodeURIComponent(imageUri);
      
      // En React Native, fetch soporta leer archivos locales y es más confiable que FileSystem en Expo Go Android
      const response = await fetch(cleanUri);
      const blob = await response.blob();
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // El resultado es "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            const b64 = reader.result.split(',')[1];
            resolve(b64);
          } else {
            reject(new Error('FileReader no retornó un string'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      return apiFetch<any>('/api/analisis/procesar', {
        method: 'POST',
        body: JSON.stringify({ imageBase64: base64 }),
      });
    } catch (e: any) {
      console.warn('Error convirtiendo imagen a base64:', e.message);
      return { success: false, error: 'Error procesando la imagen localmente.' };
    }
  },

  async list(): Promise<ApiResponse<Analisis[]>> {
    return apiFetch<Analisis[]>('/api/analisis');
  },

  /**
   * Crear análisis con imagen.
   * Si imageUri es una ruta local, se sube como archivo.
   * Si es una URL http, se envía como string.
   */
  async create(data: CreateAnalisisDTO, localImageUri?: string): Promise<ApiResponse<Analisis>> {
    if (localImageUri && !localImageUri.startsWith('http')) {
      // Subir imagen como FormData
      const formData = new FormData();
      formData.append('image', {
        uri: localImageUri,
        name: `analysis_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      // Añadir los datos del análisis como campos
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'sintomas' || key === 'recomendaciones') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      return apiFetchFormData<Analisis>('/api/analisis', formData);
    }

    // Sin imagen local — enviar como JSON
    return apiFetch<Analisis>('/api/analisis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<ApiResponse> {
    return apiFetch(`/api/analisis/${id}`, {
      method: 'DELETE',
    });
  },

  async solicitarRevision(id: string): Promise<ApiResponse> {
    return apiFetch(`/api/analisis/${id}/solicitar-revision`, {
      method: 'PUT',
    });
  },
};

// ============================================================
// API de Revisiones Técnicas
// ============================================================

export const revisionesApi = {
  async listPendientes(): Promise<ApiResponse<Analisis[]>> {
    return apiFetch<Analisis[]>('/api/revisiones/pendientes');
  },

  async guardarDictamen(analisisId: string, data: CreateRevisionDTO): Promise<ApiResponse<RevisionTecnica>> {
    return apiFetch<RevisionTecnica>(`/api/revisiones/${analisisId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================================
// API de Vínculos (Técnico <-> Agricultor)
// ============================================================

export const vinculosApi = {
  async generarCodigo(): Promise<ApiResponse<{ codigo: string }>> {
    return apiFetch<{ codigo: string }>('/api/vinculos/generar-codigo', { method: 'POST' });
  },

  async vincular(codigo: string): Promise<ApiResponse<{ agricultorNombre: string }>> {
    return apiFetch<{ agricultorNombre: string }>('/api/vinculos/vincular', {
      method: 'POST',
      body: JSON.stringify({ codigo }),
    });
  },

  async getAgricultores(): Promise<ApiResponse<any[]>> {
    return apiFetch<any[]>('/api/vinculos/agricultores');
  },

  async revocar(id: string): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/api/vinculos/revocar/${id}`, { method: 'DELETE' });
  },
};
