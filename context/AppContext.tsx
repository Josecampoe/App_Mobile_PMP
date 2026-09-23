import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RolUsuario = 'agricultor' | 'tecnico';

export interface Cultivo {
  id: string;
  nombre: string;
  variedad: string;
  hectareas: number;
  ubicacion: string;
  fechaSiembra: string;
  estadoFitosanitario: 'optimo' | 'observacion' | 'alerta';
  analisisCount: number;
  ultimaRevision: string;
}

export interface RevisionTecnica {
  tecnicoNombre: string;
  registroProfesional?: string;
  fechaRevision: string;
  diagnosticoValidado:
    | 'PMP Confirmado'
    | 'Sospecha Moderada'
    | 'Descartado - Sano'
    | 'Deficiencia Nutricional'
    | 'Virosis / Otra Afección';
  observaciones: string;
  tratamientoRecomendado: string;
}

export interface Analisis {
  id: string;
  cultivoId: string;
  cultivoNombre: string;
  fecha: string;
  imageUri: string;
  diagnostico: 'Posible PMP' | 'Sano' | 'PMP Severo' | 'Deficiencia Nutricional';
  estado: 'alerta' | 'sano' | 'observacion';
  severidad: 'baja' | 'moderada' | 'alta' | 'ninguna';
  confianza: number;
  sintomas: string[];
  recomendaciones: string[];
  notas?: string;
  estadoRevision: 'sin_solicitar' | 'pendiente' | 'revisado';
  revisionTecnica?: RevisionTecnica;
}

export interface PerfilAgricultor {
  nombre: string;
  fincaPrincipal: string;
  ubicacion: string;
  telefono: string;
  email: string;
  notificaciones: boolean;
  modoOffline: boolean;
}

export interface PerfilTecnico {
  nombre: string;
  registroProfesional: string;
  especialidad: string;
  entidad: string;
  telefono: string;
  email: string;
  notificaciones: boolean;
}

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
  addAnalisis: (analisis: Omit<Analisis, 'id' | 'fecha'>) => Analisis;
  deleteAnalisis: (id: string) => void;
  solicitarRevisionTecnica: (analisisId: string) => void;
  guardarRevisionTecnica: (analisisId: string, revision: Omit<RevisionTecnica, 'fechaRevision'>) => void;
  updatePerfilAgricultor: (datos: Partial<PerfilAgricultor>) => void;
  updatePerfilTecnico: (datos: Partial<PerfilTecnico>) => void;
  cargarDatosDemo: () => void;
  limpiarTodosLosDatos: () => void;
  isLoading: boolean;
}

const STORAGE_KEYS = {
  ROL_ACTIVO: '@pmp_smart_rol_activo_v2',
  CULTIVOS: '@pmp_smart_cultivos_v2',
  HISTORIAL: '@pmp_smart_historial_v2',
  PERFIL_AGRICULTOR: '@pmp_smart_perfil_agr_v2',
  PERFIL_TECNICO: '@pmp_smart_perfil_tec_v2',
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

  // Cargar datos persistidos desde AsyncStorage de manera segura
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedRol = await AsyncStorage.getItem(STORAGE_KEYS.ROL_ACTIVO);
        const storedCultivos = await AsyncStorage.getItem(STORAGE_KEYS.CULTIVOS);
        const storedHistorial = await AsyncStorage.getItem(STORAGE_KEYS.HISTORIAL);
        const storedPerfilAgr = await AsyncStorage.getItem(STORAGE_KEYS.PERFIL_AGRICULTOR);
        const storedPerfilTec = await AsyncStorage.getItem(STORAGE_KEYS.PERFIL_TECNICO);

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
            const sanitizado: Analisis[] = parsedHist.map((item: any) => ({
              id: item.id || `a-${Date.now()}`,
              cultivoId: item.cultivoId || 'lote-general',
              cultivoNombre: item.cultivoNombre || 'Muestra de Campo',
              fecha: item.fecha || 'Fecha no registrada',
              imageUri: item.imageUri || 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a',
              diagnostico: item.diagnostico || 'Posible PMP',
              estado: item.estado || 'alerta',
              severidad: item.severidad || 'moderada',
              confianza: item.confianza || 90,
              sintomas: Array.isArray(item.sintomas) ? item.sintomas : [],
              recomendaciones: Array.isArray(item.recomendaciones) ? item.recomendaciones : [],
              notas: item.notas || '',
              estadoRevision: item.estadoRevision || 'sin_solicitar',
              revisionTecnica: item.revisionTecnica || undefined,
            }));
            setAnalisisHistorial(sanitizado);
          }
        }

        if (storedPerfilAgr) {
          const parsedAgr = JSON.parse(storedPerfilAgr);
          if (parsedAgr && typeof parsedAgr === 'object') {
            setPerfilAgricultor({
              ...DEFAULT_PERFIL_AGRICULTOR,
              ...parsedAgr,
              nombre: parsedAgr.nombre || DEFAULT_PERFIL_AGRICULTOR.nombre,
            });
          }
        }

        if (storedPerfilTec) {
          const parsedTec = JSON.parse(storedPerfilTec);
          if (parsedTec && typeof parsedTec === 'object') {
            setPerfilTecnico({
              ...DEFAULT_PERFIL_TECNICO,
              ...parsedTec,
              nombre: parsedTec.nombre || DEFAULT_PERFIL_TECNICO.nombre,
              registroProfesional: parsedTec.registroProfesional || DEFAULT_PERFIL_TECNICO.registroProfesional,
            });
          }
        }
      } catch (e) {
        console.warn('Error al cargar datos desde AsyncStorage:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  // Cambiar rol y persistir de manera segura
  const setRolActivo = async (rol: RolUsuario) => {
    setRolActivoState(rol);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ROL_ACTIVO, rol);
    } catch (e) {
      console.warn('Error al guardar rol:', e);
    }
  };

  // Guardar cultivos
  const saveCultivos = async (newCultivos: Cultivo[]) => {
    try {
      setCultivos(newCultivos);
      await AsyncStorage.setItem(STORAGE_KEYS.CULTIVOS, JSON.stringify(newCultivos));
    } catch (e) {
      console.warn('Error al persistir cultivos:', e);
    }
  };

  // Guardar historial
  const saveHistorial = async (newHistorial: Analisis[]) => {
    try {
      setAnalisisHistorial(newHistorial);
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORIAL, JSON.stringify(newHistorial));
    } catch (e) {
      console.warn('Error al persistir historial:', e);
    }
  };

  // Guardar perfil de agricultor
  const updatePerfilAgricultor = async (datos: Partial<PerfilAgricultor>) => {
    try {
      const updated: PerfilAgricultor = {
        ...DEFAULT_PERFIL_AGRICULTOR,
        ...perfilAgricultor,
        ...datos,
      };
      setPerfilAgricultor(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.PERFIL_AGRICULTOR, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error al persistir perfil agricultor:', e);
    }
  };

  // Guardar perfil de técnico
  const updatePerfilTecnico = async (datos: Partial<PerfilTecnico>) => {
    try {
      const updated: PerfilTecnico = {
        ...DEFAULT_PERFIL_TECNICO,
        ...perfilTecnico,
        ...datos,
      };
      setPerfilTecnico(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.PERFIL_TECNICO, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error al persistir perfil técnico:', e);
    }
  };

  // Agregar nuevo cultivo
  const addCultivo = (cultivoData: Omit<Cultivo, 'id' | 'analisisCount' | 'ultimaRevision'>): Cultivo => {
    const nuevo: Cultivo = {
      ...cultivoData,
      id: `c-${Date.now()}`,
      analisisCount: 0,
      ultimaRevision: 'Recién registrado',
    };
    const updated = [nuevo, ...cultivos];
    saveCultivos(updated);
    setSelectedCultivoId(nuevo.id);
    return nuevo;
  };

  // Eliminar cultivo
  const deleteCultivo = (id: string) => {
    const updated = cultivos.filter((c) => c.id !== id);
    saveCultivos(updated);
    if (selectedCultivoId === id && updated.length > 0) {
      setSelectedCultivoId(updated[0].id);
    } else if (updated.length === 0) {
      setSelectedCultivoId('');
    }
  };

  // Formateador de fecha amigable
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

  // Agregar nuevo análisis desde resultado de escaneo
  const addAnalisis = (analisisData: Omit<Analisis, 'id' | 'fecha'>): Analisis => {
    const nuevo: Analisis = {
      ...analisisData,
      id: `a-${Date.now()}`,
      fecha: formatearFechaActual(),
      estadoRevision: analisisData.estadoRevision || 'sin_solicitar',
      sintomas: analisisData.sintomas || [],
      recomendaciones: analisisData.recomendaciones || [],
    };

    const updatedHistorial = [nuevo, ...analisisHistorial];
    saveHistorial(updatedHistorial);

    // Actualizar estado del cultivo asociado si existe
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
    saveCultivos(updatedCultivos);

    return nuevo;
  };

  // Eliminar análisis
  const deleteAnalisis = (id: string) => {
    const updated = analisisHistorial.filter((a) => a.id !== id);
    saveHistorial(updated);
  };

  // Solicitar revisión técnica
  const solicitarRevisionTecnica = (analisisId: string) => {
    const updated = analisisHistorial.map((a) => {
      if (a.id === analisisId) {
        return {
          ...a,
          estadoRevision: 'pendiente' as const,
        };
      }
      return a;
    });
    saveHistorial(updated);
  };

  // El técnico emite el dictamen oficial fitosanitario
  const guardarRevisionTecnica = (
    analisisId: string,
    revision: Omit<RevisionTecnica, 'fechaRevision'>
  ) => {
    const revisionCompleta: RevisionTecnica = {
      ...revision,
      fechaRevision: formatearFechaActual(),
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
    saveHistorial(updated);
  };

  // Cargar datos de demostración
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

    saveCultivos(demoCultivos);
    saveHistorial(demoHistorial);
  };

  // Limpiar todos los datos locales
  const limpiarTodosLosDatos = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CULTIVOS,
        STORAGE_KEYS.HISTORIAL,
        STORAGE_KEYS.PERFIL_AGRICULTOR,
        STORAGE_KEYS.PERFIL_TECNICO,
      ]);
      setCultivos([]);
      setAnalisisHistorial([]);
      setSelectedCultivoId('');
      setPerfilAgricultor(DEFAULT_PERFIL_AGRICULTOR);
      setPerfilTecnico(DEFAULT_PERFIL_TECNICO);
    } catch (e) {
      console.warn('Error al limpiar datos:', e);
    }
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
