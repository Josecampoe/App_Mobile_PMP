import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export interface Perfil {
  nombre: string;
  rol: string;
  fincaPrincipal: string;
  ubicacion: string;
  telefono: string;
  email: string;
  notificaciones: boolean;
  modoOffline: boolean;
}

interface AppContextType {
  cultivos: Cultivo[];
  analisisHistorial: Analisis[];
  perfil: Perfil;
  selectedCultivoId: string;
  setSelectedCultivoId: (id: string) => void;
  addCultivo: (cultivo: Omit<Cultivo, 'id' | 'analisisCount' | 'ultimaRevision'>) => void;
  deleteCultivo: (id: string) => void;
  addAnalisis: (analisis: Omit<Analisis, 'id' | 'fecha'>) => Analisis;
  deleteAnalisis: (id: string) => void;
  updatePerfil: (datos: Partial<Perfil>) => void;
  isLoading: boolean;
}

const STORAGE_KEYS = {
  CULTIVOS: '@pmp_smart_cultivos_v1',
  HISTORIAL: '@pmp_smart_historial_v1',
  PERFIL: '@pmp_smart_perfil_v1',
};

const DEFAULT_CULTIVOS: Cultivo[] = [
  {
    id: 'c-1',
    nombre: 'Finca El Porvenir',
    variedad: 'Papa Pastusa Suprema',
    hectareas: 2.5,
    ubicacion: 'Pasto, Nariño',
    fechaSiembra: '15 Mayo 2026',
    estadoFitosanitario: 'alerta',
    analisisCount: 4,
    ultimaRevision: 'Hoy',
  },
  {
    id: 'c-2',
    nombre: 'Lote La Esperanza',
    variedad: 'Papa Diacol Capiro',
    hectareas: 4.0,
    ubicacion: 'Ipiales, Nariño',
    fechaSiembra: '02 Junio 2026',
    estadoFitosanitario: 'optimo',
    analisisCount: 2,
    ultimaRevision: 'Hace 3 días',
  },
  {
    id: 'c-3',
    nombre: 'Parcela San Isidro',
    variedad: 'Papa Criolla Colombia',
    hectareas: 1.2,
    ubicacion: 'Túquerres, Nariño',
    fechaSiembra: '20 Junio 2026',
    estadoFitosanitario: 'observacion',
    analisisCount: 1,
    ultimaRevision: 'Hace 1 semana',
  },
];

const DEFAULT_HISTORIAL: Analisis[] = [
  {
    id: 'a-1',
    cultivoId: 'c-1',
    cultivoNombre: 'Finca El Porvenir',
    fecha: '09 Sep 2026 - 10:24 AM',
    imageUri: 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a',
    diagnostico: 'Posible PMP',
    estado: 'alerta',
    severidad: 'moderada',
    confianza: 92,
    sintomas: [
      'Pigmentación púrpura/rojiza en bordes de foliolos apicales',
      'Hojas superiores erguidas y con curvatura hacia el haz',
      'Engrosamiento en nudos de los tallos',
    ],
    recomendaciones: [
      'Monitorear con trampas amarillas la presencia del psílido (Bactericera cockerelli).',
      'Aislar o marcar las plantas con síntomas para evitar diseminación de fitoplasmas.',
      'Consultar al agrónomo de confianza antes de realizar aplicaciones químicas.',
    ],
    notas: 'Detectado en el surco 4 del lote este.',
  },
  {
    id: 'a-2',
    cultivoId: 'c-1',
    cultivoNombre: 'Finca El Porvenir',
    fecha: '06 Sep 2026 - 04:15 PM',
    imageUri: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c',
    diagnostico: 'Sano',
    estado: 'sano',
    severidad: 'ninguna',
    confianza: 98,
    sintomas: ['Follaje vigoroso con coloración verde uniforme', 'Estructura foliar sin deformaciones'],
    recomendaciones: [
      'Continuar con el plan de fertirriego estándar.',
      'Mantener el monitoreo preventivo semanal de plagas vectoras.',
    ],
    notas: 'Zona norte en perfecto estado.',
  },
  {
    id: 'a-3',
    cultivoId: 'c-2',
    cultivoNombre: 'Lote La Esperanza',
    fecha: '01 Sep 2026 - 09:30 AM',
    imageUri: 'https://images.unsplash.com/photo-1589923188900-85dae523342b',
    diagnostico: 'Sano',
    estado: 'sano',
    severidad: 'ninguna',
    confianza: 95,
    sintomas: ['Crecimiento vegetativo normal', 'Sin presencia de enrollamiento'],
    recomendaciones: [
      'Inspeccionar envés de hojas en busca de ninfas de psílidos.',
    ],
    notas: 'Cultivo Diacol Capiro en etapa de floración.',
  },
];

const DEFAULT_PERFIL: Perfil = {
  nombre: 'Carlos Pérez',
  rol: 'Productor Papero',
  fincaPrincipal: 'Finca El Porvenir',
  ubicacion: 'Pasto, Nariño - Colombia',
  telefono: '+57 315 892 4410',
  email: 'carlos.perez@agropapa.com',
  notificaciones: true,
  modoOffline: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cultivos, setCultivos] = useState<Cultivo[]>(DEFAULT_CULTIVOS);
  const [analisisHistorial, setAnalisisHistorial] = useState<Analisis[]>(DEFAULT_HISTORIAL);
  const [perfil, setPerfil] = useState<Perfil>(DEFAULT_PERFIL);
  const [selectedCultivoId, setSelectedCultivoId] = useState<string>('c-1');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos persistidos
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedCultivos = await AsyncStorage.getItem(STORAGE_KEYS.CULTIVOS);
        const storedHistorial = await AsyncStorage.getItem(STORAGE_KEYS.HISTORIAL);
        const storedPerfil = await AsyncStorage.getItem(STORAGE_KEYS.PERFIL);

        if (storedCultivos) setCultivos(JSON.parse(storedCultivos));
        if (storedHistorial) setAnalisisHistorial(JSON.parse(storedHistorial));
        if (storedPerfil) setPerfil(JSON.parse(storedPerfil));
      } catch (e) {
        console.warn('Error al cargar datos desde AsyncStorage:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  // Guardar cultivos cuando cambien
  const saveCultivos = async (newCultivos: Cultivo[]) => {
    try {
      setCultivos(newCultivos);
      await AsyncStorage.setItem(STORAGE_KEYS.CULTIVOS, JSON.stringify(newCultivos));
    } catch (e) {
      console.warn('Error al persistir cultivos:', e);
    }
  };

  // Guardar historial cuando cambie
  const saveHistorial = async (newHistorial: Analisis[]) => {
    try {
      setAnalisisHistorial(newHistorial);
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORIAL, JSON.stringify(newHistorial));
    } catch (e) {
      console.warn('Error al persistir historial:', e);
    }
  };

  // Guardar perfil cuando cambie
  const savePerfil = async (newPerfil: Perfil) => {
    try {
      setPerfil(newPerfil);
      await AsyncStorage.setItem(STORAGE_KEYS.PERFIL, JSON.stringify(newPerfil));
    } catch (e) {
      console.warn('Error al persistir perfil:', e);
    }
  };

  // Agregar nuevo cultivo
  const addCultivo = (cultivoData: Omit<Cultivo, 'id' | 'analisisCount' | 'ultimaRevision'>) => {
    const nuevo: Cultivo = {
      ...cultivoData,
      id: `c-${Date.now()}`,
      analisisCount: 0,
      ultimaRevision: 'Recién registrado',
    };
    const updated = [nuevo, ...cultivos];
    saveCultivos(updated);
  };

  // Eliminar cultivo
  const deleteCultivo = (id: string) => {
    const updated = cultivos.filter((c) => c.id !== id);
    saveCultivos(updated);
    if (selectedCultivoId === id && updated.length > 0) {
      setSelectedCultivoId(updated[0].id);
    }
  };

  // Agregar nuevo análisis desde resultado de escaneo
  const addAnalisis = (analisisData: Omit<Analisis, 'id' | 'fecha'>): Analisis => {
    const now = new Date();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = meses[now.getMonth()];
    const anio = now.getFullYear();
    const horas = now.getHours();
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const hora12 = horas % 12 || 12;

    const fechaFormateada = `${dia} ${mes} ${anio} - ${hora12}:${minutos} ${ampm}`;

    const nuevo: Analisis = {
      ...analisisData,
      id: `a-${Date.now()}`,
      fecha: fechaFormateada,
    };

    const updatedHistorial = [nuevo, ...analisisHistorial];
    saveHistorial(updatedHistorial);

    // Actualizar estado y contador del cultivo asociado
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

  // Actualizar perfil
  const updatePerfil = (datos: Partial<Perfil>) => {
    const updated: Perfil = { ...perfil, ...datos };
    savePerfil(updated);
  };

  return (
    <AppContext.Provider
      value={{
        cultivos,
        analisisHistorial,
        perfil,
        selectedCultivoId,
        setSelectedCultivoId,
        addCultivo,
        deleteCultivo,
        addAnalisis,
        deleteAnalisis,
        updatePerfil,
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
