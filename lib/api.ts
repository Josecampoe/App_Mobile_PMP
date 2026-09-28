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
import * as FileSystem from 'expo-file-system/legacy'; // For reading/moving files

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

// Constantes de AsyncStorage
const TOKEN_KEY = '@pmp_smart_access_token';
const PERFIL_KEY = '@pmp_smart_perfil';
const CULTIVOS_KEY = '@pmp_smart_cultivos';
const ANALISIS_KEY = '@pmp_smart_analisis';
const USERS_KEY = '@pmp_smart_users';

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

// Generador de IDs locales
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// Formatear fecha (similar al backend anterior)
function formatearFecha(): string {
  const now = new Date();
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dia = String(now.getDate()).padStart(2, '0');
  const mes = meses[now.getMonth()];
  const anio = now.getFullYear();
  const horas = now.getHours();
  const minutos = String(now.getMinutes()).padStart(2, '0');
  const ampm = horas >= 12 ? 'PM' : 'AM';
  const hora12 = horas % 12 || 12;
  return `${dia} ${mes} ${anio} - ${hora12}:${minutos} ${ampm}`;
}

// Helper para AsyncStorage
async function getLocalData<T>(key: string, defaultValue: T): Promise<T> {
  const data = await AsyncStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

async function saveLocalData<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Fetch (Solo usado para el AI endpoint)
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    return (await response.json()) as ApiResponse<T>;
  } catch (error) {
    console.warn(`Error en API ${endpoint}:`, error);
    return { success: false, error: 'Error de conexión con el servidor.' };
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
// API de Autenticación (Mocked)
// ============================================================

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    // Validar usuario contra el registro local
    const users = await getLocalData<any[]>(USERS_KEY, []);
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      // Intentar login por defecto solo si no hay usuarios creados (para desarrollo fácil)
      if (users.length > 0) {
        return { success: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
      }
    }

    const dummyToken = 'local_dummy_token_' + email;
    await AsyncStorage.setItem(TOKEN_KEY, dummyToken);
    
    // Configurar perfil por defecto si no existe o actualizarlo al del usuario actual
    const perfil = await getLocalData<PerfilResponse | null>(PERFIL_KEY, null);
    if (!perfil || (user && perfil.rol !== user.rol)) {
      await saveLocalData<PerfilResponse>(PERFIL_KEY, {
        rol: user ? user.rol : 'agricultor',
        agricultor: {
          nombre: user ? user.nombre : 'Usuario Local',
          email,
          fincaPrincipal: 'Mi Finca',
          ubicacion: 'Local',
          telefono: '',
          notificaciones: true,
          modoOffline: true
        }
      });
    }

    authEvents.notify(true);
    return {
      success: true,
      data: {
        accessToken: dummyToken,
        refreshToken: dummyToken,
        user: { id: 'local_user', email }
      }
    };
  },

  async register(data: RegisterDTO): Promise<ApiResponse<AuthResponse>> {
    const users = await getLocalData<any[]>(USERS_KEY, []);
    const existing = users.find(u => u.email === data.email);
    
    if (existing) {
      return { success: false, error: 'Este correo ya se encuentra registrado.' };
    }
    
    users.push({
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      rol: data.rol
    });
    
    await saveLocalData(USERS_KEY, users);

    const dummyToken = 'local_dummy_token_' + data.email;
    await AsyncStorage.setItem(TOKEN_KEY, dummyToken);

    const perfil: PerfilResponse = {
      rol: data.rol,
      ...(data.rol === 'agricultor' ? {
        agricultor: {
          nombre: data.nombre,
          email: data.email,
          fincaPrincipal: 'Mi Finca',
          ubicacion: '',
          telefono: '',
          notificaciones: true,
          modoOffline: true
        }
      } : {
        tecnico: {
          nombre: data.nombre,
          email: data.email,
          registroProfesional: '',
          especialidad: '',
          entidad: '',
          telefono: '',
          notificaciones: true
        }
      })
    };

    await saveLocalData(PERFIL_KEY, perfil);

    authEvents.notify(true);
    return {
      success: true,
      data: {
        accessToken: dummyToken,
        refreshToken: dummyToken,
        user: { id: 'local_user', email: data.email }
      }
    };
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    authEvents.notify(false);
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },
};

// ============================================================
// API de Perfil (Mocked)
// ============================================================

export const perfilApi = {
  async get(): Promise<ApiResponse<PerfilResponse>> {
    const perfil = await getLocalData<PerfilResponse | null>(PERFIL_KEY, null);
    if (!perfil) return { success: false, error: 'Perfil no encontrado' };
    return { success: true, data: perfil };
  },

  async update(datos: Record<string, any>): Promise<ApiResponse> {
    const perfil = await getLocalData<PerfilResponse | null>(PERFIL_KEY, null);
    if (!perfil) return { success: false, error: 'Perfil no encontrado' };
    
    if (perfil.rol === 'agricultor' && perfil.agricultor) {
      perfil.agricultor = { ...perfil.agricultor, ...datos };
    } else if (perfil.rol === 'tecnico' && perfil.tecnico) {
      perfil.tecnico = { ...perfil.tecnico, ...datos };
    }

    await saveLocalData(PERFIL_KEY, perfil);
    return { success: true };
  },

  async cambiarRol(rol: RolUsuario): Promise<ApiResponse> {
    const perfil = await getLocalData<PerfilResponse | null>(PERFIL_KEY, null);
    if (!perfil) return { success: false, error: 'Perfil no encontrado' };
    
    perfil.rol = rol;
    if (rol === 'agricultor' && !perfil.agricultor) {
      perfil.agricultor = {
        nombre: perfil.tecnico?.nombre || 'Usuario',
        email: perfil.tecnico?.email || '',
        fincaPrincipal: 'Mi Finca',
        ubicacion: '',
        telefono: perfil.tecnico?.telefono || '',
        notificaciones: true,
        modoOffline: true
      };
    } else if (rol === 'tecnico' && !perfil.tecnico) {
      perfil.tecnico = {
        nombre: perfil.agricultor?.nombre || 'Usuario',
        email: perfil.agricultor?.email || '',
        registroProfesional: '',
        especialidad: '',
        entidad: '',
        telefono: perfil.agricultor?.telefono || '',
        notificaciones: true
      };
    }

    await saveLocalData(PERFIL_KEY, perfil);
    return { success: true };
  },
};

// ============================================================
// API de Cultivos (Local Storage)
// ============================================================

export const cultivosApi = {
  async list(): Promise<ApiResponse<Cultivo[]>> {
    const cultivos = await getLocalData<Cultivo[]>(CULTIVOS_KEY, []);
    return { success: true, data: cultivos };
  },

  async create(data: CreateCultivoDTO): Promise<ApiResponse<Cultivo>> {
    const cultivos = await getLocalData<Cultivo[]>(CULTIVOS_KEY, []);
    const newCultivo: Cultivo = {
      ...data,
      id: generateId(),
      estadoFitosanitario: data.estadoFitosanitario || 'optimo',
      analisisCount: 0,
      ultimaRevision: 'Nunca',
    };
    cultivos.push(newCultivo);
    await saveLocalData(CULTIVOS_KEY, cultivos);
    return { success: true, data: newCultivo };
  },

  async update(id: string, data: UpdateCultivoDTO): Promise<ApiResponse<Cultivo>> {
    const cultivos = await getLocalData<Cultivo[]>(CULTIVOS_KEY, []);
    const idx = cultivos.findIndex(c => c.id === id);
    if (idx === -1) return { success: false, error: 'Cultivo no encontrado' };
    
    cultivos[idx] = { ...cultivos[idx], ...data };
    await saveLocalData(CULTIVOS_KEY, cultivos);
    return { success: true, data: cultivos[idx] };
  },

  async delete(id: string): Promise<ApiResponse> {
    let cultivos = await getLocalData<Cultivo[]>(CULTIVOS_KEY, []);
    cultivos = cultivos.filter(c => c.id !== id);
    await saveLocalData(CULTIVOS_KEY, cultivos);
    return { success: true };
  },
};

// ============================================================
// API de Análisis (Local Storage + Backend AI)
// ============================================================

export const analisisApi = {
  // Procesar imagen usando IA en el backend (esto se mantiene llamando a la API)
  async procesar(imageUri: string): Promise<ApiResponse<any>> {
    try {
      const cleanUri = decodeURIComponent(imageUri);
      let base64 = '';

      if (cleanUri.startsWith('file://')) {
        base64 = await FileSystem.readAsStringAsync(cleanUri, { encoding: FileSystem.EncodingType.Base64 });
      } else {
        const response = await fetch(cleanUri);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              const b64 = reader.result.split(',')[1];
              resolve(b64);
            } else reject(new Error('FileReader no retornó string'));
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      
      return apiFetch<any>('/api/analisis/procesar', {
        method: 'POST',
        body: JSON.stringify({ imageBase64: base64 }),
      });
    } catch (e: any) {
      console.warn('Error procesando imagen localmente:', e.message);
      return { success: false, error: 'Error procesando la imagen localmente.' };
    }
  },

  async list(): Promise<ApiResponse<Analisis[]>> {
    const analisisList = await getLocalData<Analisis[]>(ANALISIS_KEY, []);
    // Ordenar por fecha o simplemente devolver invertido para mostrar los más recientes primero
    return { success: true, data: analisisList.reverse() };
  },

  async create(data: CreateAnalisisDTO, localImageUri?: string): Promise<ApiResponse<Analisis>> {
    // Si la imagen es temporal en Expo (ej. Cache), es buena idea moverla al DocumentDirectory
    // Pero para simplificar, asumiremos que Expo Camera ya nos dio una URI usable, o que 
    // la guardamos localmente tal cual.
    let finalImageUri = localImageUri || data.imageUri || '';

    // En un app real sin backend, querrás copiar la imagen a FileSystem.documentDirectory
    // para evitar que se borre de la caché.
    if (finalImageUri && finalImageUri.startsWith('file://')) {
      try {
        const fileName = finalImageUri.split('/').pop() || `img_${Date.now()}.jpg`;
        const newPath = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({ from: finalImageUri, to: newPath });
        finalImageUri = newPath;
      } catch (e) {
        console.warn('Error copiando imagen al directorio de documentos:', e);
      }
    }

    const analisisList = await getLocalData<Analisis[]>(ANALISIS_KEY, []);
    const newAnalisis: Analisis = {
      ...data,
      id: generateId(),
      fecha: formatearFecha(),
      imageUri: finalImageUri,
      estadoRevision: data.estadoRevision || 'sin_solicitar',
      sintomas: data.sintomas || [],
      recomendaciones: data.recomendaciones || [],
    };
    
    analisisList.push(newAnalisis);
    await saveLocalData(ANALISIS_KEY, analisisList);

    // Actualizar contadores del cultivo local si aplica
    if (data.cultivoId && !data.cultivoId.startsWith('c-')) {
      const cultivos = await getLocalData<Cultivo[]>(CULTIVOS_KEY, []);
      const cIdx = cultivos.findIndex(c => c.id === data.cultivoId);
      if (cIdx !== -1) {
        cultivos[cIdx].analisisCount = (cultivos[cIdx].analisisCount || 0) + 1;
        cultivos[cIdx].ultimaRevision = 'Hoy';
        if (data.estado === 'alerta') cultivos[cIdx].estadoFitosanitario = 'alerta';
        else if (data.estado === 'observacion' && cultivos[cIdx].estadoFitosanitario !== 'alerta') cultivos[cIdx].estadoFitosanitario = 'observacion';
        await saveLocalData(CULTIVOS_KEY, cultivos);
      }
    }

    return { success: true, data: newAnalisis };
  },

  async delete(id: string): Promise<ApiResponse> {
    let analisisList = await getLocalData<Analisis[]>(ANALISIS_KEY, []);
    analisisList = analisisList.filter(a => a.id !== id);
    await saveLocalData(ANALISIS_KEY, analisisList);
    return { success: true };
  },

  async solicitarRevision(id: string): Promise<ApiResponse> {
    const analisisList = await getLocalData<Analisis[]>(ANALISIS_KEY, []);
    const aIdx = analisisList.findIndex(a => a.id === id);
    if (aIdx !== -1) {
      analisisList[aIdx].estadoRevision = 'pendiente';
      await saveLocalData(ANALISIS_KEY, analisisList);
    }
    return { success: true };
  },
};

// ============================================================
// API de Revisiones Técnicas (Mocked Local Storage)
// ============================================================

export const revisionesApi = {
  async listPendientes(): Promise<ApiResponse<Analisis[]>> {
    const analisisList = await getLocalData<Analisis[]>(ANALISIS_KEY, []);
    const pendientes = analisisList.filter(a => a.estadoRevision === 'pendiente');
    return { success: true, data: pendientes };
  },

  async guardarDictamen(analisisId: string, data: CreateRevisionDTO): Promise<ApiResponse<RevisionTecnica>> {
    const analisisList = await getLocalData<Analisis[]>(ANALISIS_KEY, []);
    const aIdx = analisisList.findIndex(a => a.id === analisisId);
    if (aIdx === -1) return { success: false, error: 'Análisis no encontrado' };

    const revision: RevisionTecnica = {
      ...data,
      fechaRevision: formatearFecha(),
    };
    analisisList[aIdx].estadoRevision = 'revisado';
    analisisList[aIdx].revisionTecnica = revision;

    await saveLocalData(ANALISIS_KEY, analisisList);
    return { success: true, data: revision };
  },
};

// ============================================================
// API de Vínculos (Mocked Local Storage)
// ============================================================

export const vinculosApi = {
  async generarCodigo(): Promise<ApiResponse<{ codigo: string }>> {
    return { success: true, data: { codigo: generateId().substring(0, 5).toUpperCase() } };
  },

  async vincular(codigo: string): Promise<ApiResponse<{ agricultorNombre: string }>> {
    return { success: true, data: { agricultorNombre: 'Agricultor ' + codigo } };
  },

  async getAgricultores(): Promise<ApiResponse<any[]>> {
    return { success: true, data: [] };
  },

  async revocar(id: string): Promise<ApiResponse<void>> {
    return { success: true };
  },
};
