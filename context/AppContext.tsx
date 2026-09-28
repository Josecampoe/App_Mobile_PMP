import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  perfilApi,
  cultivosApi,
  analisisApi,
  revisionesApi,
  getAccessToken,
  authEvents,
} from '../lib/api';
import type {
  RolUsuario,
  Cultivo,
  Analisis,
  RevisionTecnica,
  PerfilAgricultor,
  PerfilTecnico,
  CreateRevisionDTO,
} from '../lib/types';

// Re-exportar tipos para que los componentes los importen desde aquí
export type {
  RolUsuario,
  Cultivo,
  Analisis,
  RevisionTecnica,
  PerfilAgricultor,
  PerfilTecnico,
};

interface AppContextType {
  rolActivo: RolUsuario;
  setRolActivo: (rol: RolUsuario) => void;
  cultivos: Cultivo[];
  analisisHistorial: Analisis[];
  perfilAgricultor: PerfilAgricultor;
  perfilTecnico: PerfilTecnico;
  selectedCultivoId: string;
  setSelectedCultivoId: (id: string) => void;
  addCultivo: (cultivo: Omit<Cultivo, 'id' | 'analisisCount' | 'ultimaRevision'>) => Cultivo;
  deleteCultivo: (id: string) => void;
  addAnalisis: (analisis: Omit<Analisis, 'id' | 'fecha'>, localImageUri?: string) => void;
  deleteAnalisis: (id: string) => void;
  solicitarRevisionTecnica: (analisisId: string) => void;
  guardarRevisionTecnica: (analisisId: string, revision: Omit<RevisionTecnica, 'fechaRevision'>) => void;
  updatePerfilAgricultor: (datos: Partial<PerfilAgricultor>) => void;
  updatePerfilTecnico: (datos: Partial<PerfilTecnico>) => void;
  cargarDatosDemo: () => void;
  limpiarTodosLosDatos: () => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

// Claves para caché local (respaldo offline)
const CACHE_KEYS = {
  ROL_ACTIVO: '@pmp_smart_rol_activo_v4',
  CULTIVOS: '@pmp_smart_cultivos_v4',
  HISTORIAL: '@pmp_smart_historial_v4',
  PERFIL_AGRICULTOR: '@pmp_smart_perfil_agr_v4',
  PERFIL_TECNICO: '@pmp_smart_perfil_tec_v4',
};

const DEFAULT_PERFIL_AGRICULTOR: PerfilAgricultor = {
  nombre: 'Mi Nombre (Agricultor)',
  fincaPrincipal: 'Mi Parcela de Papa',
  ubicacion: 'Municipio, Departamento',
  telefono: '',
  email: '',
  notificaciones: true,
  modoOffline: true,
};

const DEFAULT_PERFIL_TECNICO: PerfilTecnico = {
  nombre: 'Ing. Agrónomo Fitosanitario',
  registroProfesional: 'MP-04821',
  especialidad: 'Sanidad Vegetal y Fitopatología',
  entidad: 'Asistencia Técnica Agrícola',
  telefono: '',
  email: '',
  notificaciones: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rolActivo, setRolActivoState] = useState<RolUsuario>('agricultor');
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [analisisHistorial, setAnalisisHistorial] = useState<Analisis[]>([]);
  const [perfilAgricultor, setPerfilAgricultor] = useState<PerfilAgricultor>(DEFAULT_PERFIL_AGRICULTOR);
  const [perfilTecnico, setPerfilTecnico] = useState<PerfilTecnico>(DEFAULT_PERFIL_TECNICO);
  const [selectedCultivoId, setSelectedCultivoId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // Cargar datos al iniciar
  // ==========================================
  useEffect(() => {
    loadAllData();
    
    // Escuchar eventos de auth (login/logout)
    const unsubscribe = authEvents.subscribe(async (isAuthenticated) => {
      if (isAuthenticated) {
        setIsLoading(true);
        await loadAllData();
      } else {
        // Logout: Limpiar TODO el estado y caché
        setRolActivoState('agricultor');
        setCultivos([]);
        setAnalisisHistorial([]);
        setPerfilAgricultor(DEFAULT_PERFIL_AGRICULTOR);
        setPerfilTecnico(DEFAULT_PERFIL_TECNICO);
        setSelectedCultivoId('');
        
        await AsyncStorage.multiRemove([
          CACHE_KEYS.ROL_ACTIVO,
          CACHE_KEYS.CULTIVOS,
          CACHE_KEYS.HISTORIAL,
          CACHE_KEYS.PERFIL_AGRICULTOR,
          CACHE_KEYS.PERFIL_TECNICO,
        ]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadAllData = async () => {
    try {
      const token = await getAccessToken();

      if (!token) {
        await loadFromCache();
        setIsLoading(false);
        return;
      }

      // Cargar datos en paralelo desde la API
      const [perfilRes, cultivosRes, analisisRes] = await Promise.all([
        perfilApi.get(),
        cultivosApi.list(),
        analisisApi.list(),
      ]);

      // Perfil
      if (perfilRes.success && perfilRes.data) {
        const p = perfilRes.data;
        setRolActivoState(p.rol);

        if (p.rol === 'agricultor') {
          if (p.agricultor) {
            setPerfilAgricultor(p.agricultor);
            await AsyncStorage.setItem(CACHE_KEYS.PERFIL_AGRICULTOR, JSON.stringify(p.agricultor));
          }
          // Limpiar datos técnicos de sesión anterior
          setPerfilTecnico(DEFAULT_PERFIL_TECNICO);
          await AsyncStorage.removeItem(CACHE_KEYS.PERFIL_TECNICO);
        } else if (p.rol === 'tecnico') {
          if (p.tecnico) {
            setPerfilTecnico(p.tecnico);
            await AsyncStorage.setItem(CACHE_KEYS.PERFIL_TECNICO, JSON.stringify(p.tecnico));
          }
          // Limpiar datos de agricultor de sesión anterior
          setPerfilAgricultor(DEFAULT_PERFIL_AGRICULTOR);
          await AsyncStorage.removeItem(CACHE_KEYS.PERFIL_AGRICULTOR);
        }

        await AsyncStorage.setItem(CACHE_KEYS.ROL_ACTIVO, p.rol);
      }

      // Cultivos
      if (cultivosRes.success && cultivosRes.data) {
        setCultivos(cultivosRes.data);
        if (cultivosRes.data.length > 0) setSelectedCultivoId(cultivosRes.data[0].id);
        await AsyncStorage.setItem(CACHE_KEYS.CULTIVOS, JSON.stringify(cultivosRes.data));
      }

      // Análisis
      if (analisisRes.success && analisisRes.data) {
        setAnalisisHistorial(analisisRes.data);
        await AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(analisisRes.data));
      }
    } catch (e) {
      console.warn('Error al cargar datos desde la API, intentando caché local:', e);
      await loadFromCache();
    } finally {
      setIsLoading(false);
    }
  };

  /** Cargar datos desde caché local (modo offline) */
  const loadFromCache = async () => {
    try {
      const storedRol = await AsyncStorage.getItem(CACHE_KEYS.ROL_ACTIVO);
      const storedCultivos = await AsyncStorage.getItem(CACHE_KEYS.CULTIVOS);
      const storedHistorial = await AsyncStorage.getItem(CACHE_KEYS.HISTORIAL);
      const storedPerfilAgr = await AsyncStorage.getItem(CACHE_KEYS.PERFIL_AGRICULTOR);
      const storedPerfilTec = await AsyncStorage.getItem(CACHE_KEYS.PERFIL_TECNICO);

      if (storedRol === 'agricultor' || storedRol === 'tecnico') {
        setRolActivoState(storedRol);
      }

      if (storedCultivos) {
        const parsed = JSON.parse(storedCultivos);
        if (Array.isArray(parsed)) {
          setCultivos(parsed);
          if (parsed.length > 0) setSelectedCultivoId(parsed[0].id);
        }
      }

      if (storedHistorial) {
        const parsedHist = JSON.parse(storedHistorial);
        if (Array.isArray(parsedHist)) {
          setAnalisisHistorial(parsedHist);
        }
      }

      if (storedPerfilAgr) {
        const parsedAgr = JSON.parse(storedPerfilAgr);
        if (parsedAgr && typeof parsedAgr === 'object') {
          setPerfilAgricultor({ ...DEFAULT_PERFIL_AGRICULTOR, ...parsedAgr });
        }
      }

      if (storedPerfilTec) {
        const parsedTec = JSON.parse(storedPerfilTec);
        if (parsedTec && typeof parsedTec === 'object') {
          setPerfilTecnico({ ...DEFAULT_PERFIL_TECNICO, ...parsedTec });
        }
      }
    } catch (e) {
      console.warn('Error al cargar datos desde caché local:', e);
    }
  };

  /** Recargar datos desde la API */
  const refreshData = async () => {
    await loadAllData();
  };

  // ==========================================
  // Operaciones de Rol
  // ==========================================

  const setRolActivo = async (rol: RolUsuario) => {
    setRolActivoState(rol);
    await AsyncStorage.setItem(CACHE_KEYS.ROL_ACTIVO, rol);

    // Sincronizar con la API en background
    perfilApi.cambiarRol(rol).catch((e) => {
      console.warn('Error al cambiar rol en API:', e);
    });
  };

  // ==========================================
  // Operaciones de Cultivos
  // ==========================================

  const addCultivo = (cultivoData: Omit<Cultivo, 'id' | 'analisisCount' | 'ultimaRevision'>) => {
    // Crear localmente con ID temporal para respuesta inmediata
    const tempId = `c-${Date.now()}`;
    const nuevo: Cultivo = {
      ...cultivoData,
      id: tempId,
      analisisCount: 0,
      ultimaRevision: 'Recién registrado',
    };
    const updated = [nuevo, ...cultivos];
    setCultivos(updated);
    setSelectedCultivoId(nuevo.id);
    AsyncStorage.setItem(CACHE_KEYS.CULTIVOS, JSON.stringify(updated));

    // Crear en la API en background
    cultivosApi
      .create({
        nombre: cultivoData.nombre,
        variedad: cultivoData.variedad,
        hectareas: cultivoData.hectareas,
        ubicacion: cultivoData.ubicacion,
        fechaSiembra: cultivoData.fechaSiembra,
        estadoFitosanitario: cultivoData.estadoFitosanitario,
      })
      .then((res) => {
        if (res.success && res.data) {
          // Reemplazar ID temporal por el UUID real
          setCultivos((prev) => {
            const withRealId = prev.map((c) =>
              c.id === tempId ? res.data! : c
            );
            AsyncStorage.setItem(CACHE_KEYS.CULTIVOS, JSON.stringify(withRealId));
            return withRealId;
          });
          if (selectedCultivoId === tempId) {
            setSelectedCultivoId(res.data.id);
          }
        }
      })
      .catch((e) => console.warn('Error al crear cultivo en API:', e));

    return nuevo;
  };

  const deleteCultivo = (id: string) => {
    const updated = cultivos.filter((c) => c.id !== id);
    setCultivos(updated);
    AsyncStorage.setItem(CACHE_KEYS.CULTIVOS, JSON.stringify(updated));

    if (selectedCultivoId === id && updated.length > 0) {
      setSelectedCultivoId(updated[0].id);
    } else if (updated.length === 0) {
      setSelectedCultivoId('');
    }

    // Eliminar en la API en background
    cultivosApi.delete(id).catch((e) => {
      console.warn('Error al eliminar cultivo en API:', e);
    });
  };

  // ==========================================
  // Operaciones de Análisis
  // ==========================================

  const addAnalisis = (analisisData: Omit<Analisis, 'id' | 'fecha'>, localImageUri?: string) => {
    const tempId = `a-${Date.now()}`;
    const fechaActual = formatearFechaActual();
    const nuevo: Analisis = {
      ...analisisData,
      id: tempId,
      fecha: fechaActual,
      estadoRevision: analisisData.estadoRevision || 'sin_solicitar',
      sintomas: analisisData.sintomas || [],
      recomendaciones: analisisData.recomendaciones || [],
    };

    const updatedHistorial = [nuevo, ...analisisHistorial];
    setAnalisisHistorial(updatedHistorial);
    AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(updatedHistorial));

    // Actualizar estado del cultivo asociado
    const updatedCultivos = cultivos.map((c) => {
      if (c.id === nuevo.cultivoId || c.nombre === nuevo.cultivoNombre) {
        return {
          ...c,
          analisisCount: (c.analisisCount || 0) + 1,
          ultimaRevision: 'Hoy',
          estadoFitosanitario:
            nuevo.estado === 'alerta'
              ? ('alerta' as const)
              : nuevo.estado === 'observacion'
              ? ('observacion' as const)
              : c.estadoFitosanitario,
        };
      }
      return c;
    });
    setCultivos(updatedCultivos);
    AsyncStorage.setItem(CACHE_KEYS.CULTIVOS, JSON.stringify(updatedCultivos));

    // Crear en la API en background
    analisisApi
      .create(
        {
          cultivoId: analisisData.cultivoId,
          cultivoNombre: analisisData.cultivoNombre,
          diagnostico: analisisData.diagnostico,
          estado: analisisData.estado,
          severidad: analisisData.severidad,
          confianza: analisisData.confianza,
          sintomas: analisisData.sintomas,
          recomendaciones: analisisData.recomendaciones,
          notas: analisisData.notas,
          estadoRevision: analisisData.estadoRevision || 'sin_solicitar',
          imageUri: analisisData.imageUri,
        },
        localImageUri
      )
      .then((res) => {
        if (res.success && res.data) {
          setAnalisisHistorial((prev) => {
            const withRealId = prev.map((a) =>
              a.id === tempId ? res.data! : a
            );
            AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(withRealId));
            return withRealId;
          });
        }
      })
      .catch((e) => console.warn('Error al crear análisis en API:', e));
  };

  const deleteAnalisis = (id: string) => {
    const updated = analisisHistorial.filter((a) => a.id !== id);
    setAnalisisHistorial(updated);
    AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(updated));

    // Eliminar en la API en background
    analisisApi.delete(id).catch((e) => {
      console.warn('Error al eliminar análisis en API:', e);
    });
  };

  // ==========================================
  // Revisiones Técnicas
  // ==========================================

  const solicitarRevisionTecnica = (analisisId: string) => {
    const updated = analisisHistorial.map((a) => {
      if (a.id === analisisId) {
        return { ...a, estadoRevision: 'pendiente' as const };
      }
      return a;
    });
    setAnalisisHistorial(updated);
    AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(updated));

    // Sincronizar con la API
    analisisApi.solicitarRevision(analisisId).catch((e) => {
      console.warn('Error al solicitar revisión en API:', e);
    });
  };

  const guardarRevisionTecnica = (
    analisisId: string,
    revision: Omit<RevisionTecnica, 'fechaRevision'>
  ) => {
    const fechaRevision = formatearFechaActual();
    const revisionCompleta: RevisionTecnica = {
      ...revision,
      fechaRevision,
    };

    const updated = analisisHistorial.map((a) => {
      if (a.id === analisisId) {
        const esAlerta =
          revisionCompleta.diagnosticoValidado === 'PMP Confirmado' ||
          revisionCompleta.diagnosticoValidado === 'Sospecha Moderada';
        return {
          ...a,
          estadoRevision: 'revisado' as const,
          revisionTecnica: revisionCompleta,
          estado: esAlerta ? ('alerta' as const) : ('sano' as const),
        };
      }
      return a;
    });
    setAnalisisHistorial(updated);
    AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(updated));

    // Sincronizar con la API
    const dto: CreateRevisionDTO = {
      tecnicoNombre: revision.tecnicoNombre,
      registroProfesional: revision.registroProfesional,
      diagnosticoValidado: revision.diagnosticoValidado,
      observaciones: revision.observaciones,
      tratamientoRecomendado: revision.tratamientoRecomendado,
    };
    revisionesApi.guardarDictamen(analisisId, dto).catch((e) => {
      console.warn('Error al guardar revisión en API:', e);
    });
  };

  // ==========================================
  // Perfiles
  // ==========================================

  const updatePerfilAgricultor = async (datos: Partial<PerfilAgricultor>) => {
    try {
      const updated: PerfilAgricultor = {
        ...DEFAULT_PERFIL_AGRICULTOR,
        ...perfilAgricultor,
        ...datos,
      };
      setPerfilAgricultor(updated);
      await AsyncStorage.setItem(CACHE_KEYS.PERFIL_AGRICULTOR, JSON.stringify(updated));

      // Sincronizar con la API
      perfilApi.update(datos).catch((e) => {
        console.warn('Error al actualizar perfil agricultor en API:', e);
      });
    } catch (e) {
      console.warn('Error al actualizar perfil agricultor:', e);
    }
  };

  const updatePerfilTecnico = async (datos: Partial<PerfilTecnico>) => {
    try {
      const updated: PerfilTecnico = {
        ...DEFAULT_PERFIL_TECNICO,
        ...perfilTecnico,
        ...datos,
      };
      setPerfilTecnico(updated);
      await AsyncStorage.setItem(CACHE_KEYS.PERFIL_TECNICO, JSON.stringify(updated));

      // Sincronizar con la API
      perfilApi.update(datos).catch((e) => {
        console.warn('Error al actualizar perfil técnico en API:', e);
      });
    } catch (e) {
      console.warn('Error al actualizar perfil técnico:', e);
    }
  };

  // ==========================================
  // Datos Demo y Limpieza
  // ==========================================

  const cargarDatosDemo = () => {
    const demoCultivos: Cultivo[] = [
      {
        id: 'demo-c-1',
        nombre: 'Lote El Porvenir',
        variedad: 'Papa Pastusa Suprema',
        hectareas: 2.5,
        ubicacion: 'Pasto, Nariño',
        fechaSiembra: '15 Mayo 2026',
        estadoFitosanitario: 'alerta',
        analisisCount: 1,
        ultimaRevision: 'Hoy',
      },
      {
        id: 'demo-c-2',
        nombre: 'Finca La Esmeralda',
        variedad: 'Papa Diacol Capiro',
        hectareas: 3.0,
        ubicacion: 'Ipiales, Nariño',
        fechaSiembra: '01 Junio 2026',
        estadoFitosanitario: 'optimo',
        analisisCount: 1,
        ultimaRevision: 'Ayer',
      },
    ];

    const demoHistorial: Analisis[] = [
      {
        id: 'demo-a-1',
        cultivoId: 'demo-c-1',
        cultivoNombre: 'Lote El Porvenir',
        fecha: '18 Sep 2026 - 10:30 AM',
        imageUri: 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a',
        diagnostico: 'Posible PMP',
        estado: 'alerta',
        severidad: 'moderada',
        confianza: 92,
        sintomas: [
          'Coloración violácea en bordes de hojas superiores',
          'Curvatura hacia arriba de los foliolos',
          'Entrenudos cortos en el ápice',
        ],
        recomendaciones: [
          'Instalar trampas amarillas para monitoreo de Bactericera cockerelli.',
          'Solicitar confirmación técnica presencial.',
        ],
        estadoRevision: 'pendiente',
        notas: 'Muestra tomada en surco 3.',
      },
      {
        id: 'demo-a-2',
        cultivoId: 'demo-c-2',
        cultivoNombre: 'Finca La Esmeralda',
        fecha: '12 Sep 2026 - 03:15 PM',
        imageUri: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c',
        diagnostico: 'Sano',
        estado: 'sano',
        severidad: 'ninguna',
        confianza: 96,
        sintomas: ['Follaje verde vigoroso sin enrollamiento'],
        recomendaciones: ['Continuar con plan de monitoreo preventivo semanal.'],
        estadoRevision: 'revisado',
        revisionTecnica: {
          tecnicoNombre: 'Ing. Mario Benavides',
          registroProfesional: 'ICA-COL-9941',
          fechaRevision: '13 Sep 2026 - 09:00 AM',
          diagnosticoValidado: 'Descartado - Sano',
          observaciones: 'Planta en excelente estado vegetativo, sin ninfas de psílidos en envés.',
          tratamientoRecomendado: 'Mantener fertilización foliar balanceada y trampeo preventivo.',
        },
      },
    ];

    setCultivos(demoCultivos);
    setAnalisisHistorial(demoHistorial);
    setSelectedCultivoId(demoCultivos[0].id);
    AsyncStorage.setItem(CACHE_KEYS.CULTIVOS, JSON.stringify(demoCultivos));
    AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(demoHistorial));
  };

  const limpiarTodosLosDatos = async () => {
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEYS.CULTIVOS,
        CACHE_KEYS.HISTORIAL,
        CACHE_KEYS.PERFIL_AGRICULTOR,
        CACHE_KEYS.PERFIL_TECNICO,
      ]);
      setCultivos([]);
      setAnalisisHistorial([]);
      setSelectedCultivoId('');
      setPerfilAgricultor(DEFAULT_PERFIL_AGRICULTOR);
      setPerfilTecnico(DEFAULT_PERFIL_TECNICO);

      // Nota: La limpieza en la API se haría con endpoints dedicados
      // Por ahora solo limpia datos locales
    } catch (e) {
      console.warn('Error al limpiar datos:', e);
    }
  };

  // ==========================================
  // Helper
  // ==========================================

  const formatearFechaActual = () => {
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
  };

  return (
    <AppContext.Provider
      value={{
        rolActivo,
        setRolActivo,
        cultivos,
        analisisHistorial,
        perfilAgricultor,
        perfilTecnico,
        selectedCultivoId,
        setSelectedCultivoId,
        addCultivo,
        deleteCultivo,
        addAnalisis,
        deleteAnalisis,
        solicitarRevisionTecnica,
        guardarRevisionTecnica,
        updatePerfilAgricultor,
        updatePerfilTecnico,
        cargarDatosDemo,
        limpiarTodosLosDatos,
        refreshData,
        isLoading,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}
