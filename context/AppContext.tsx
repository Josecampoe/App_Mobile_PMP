import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

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

// Claves para caché local (respaldo offline)
const CACHE_KEYS = {
  ROL_ACTIVO: '@pmp_smart_rol_activo_v3',
  CULTIVOS: '@pmp_smart_cultivos_v3',
  HISTORIAL: '@pmp_smart_historial_v3',
  PERFIL_AGRICULTOR: '@pmp_smart_perfil_agr_v3',
  PERFIL_TECNICO: '@pmp_smart_perfil_tec_v3',
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

// ==========================================
// Helpers para mapeo Supabase <-> App
// ==========================================

/** Mapear row de Supabase a interfaz Cultivo local */
function mapCultivoFromDB(row: any): Cultivo {
  return {
    id: row.id,
    nombre: row.nombre,
    variedad: row.variedad,
    hectareas: Number(row.hectareas),
    ubicacion: row.ubicacion || '',
    fechaSiembra: row.fecha_siembra || '',
    estadoFitosanitario: row.estado_fitosanitario || 'optimo',
    analisisCount: row.analisis_count || 0,
    ultimaRevision: row.ultima_revision || 'Sin revisar',
  };
}

/** Mapear row de Supabase a interfaz Analisis local */
function mapAnalisisFromDB(row: any): Analisis {
  return {
    id: row.id,
    cultivoId: row.cultivo_id || 'lote-general',
    cultivoNombre: row.cultivo_nombre || 'Muestra de Campo',
    fecha: row.fecha || 'Fecha no registrada',
    imageUri: row.image_url || '',
    diagnostico: row.diagnostico || 'Posible PMP',
    estado: row.estado || 'alerta',
    severidad: row.severidad || 'moderada',
    confianza: Number(row.confianza) || 90,
    sintomas: Array.isArray(row.sintomas) ? row.sintomas : [],
    recomendaciones: Array.isArray(row.recomendaciones) ? row.recomendaciones : [],
    notas: row.notas || '',
    estadoRevision: row.estado_revision || 'sin_solicitar',
    revisionTecnica: undefined, // Se carga aparte si existe
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rolActivo, setRolActivoState] = useState<RolUsuario>('agricultor');
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [analisisHistorial, setAnalisisHistorial] = useState<Analisis[]>([]);
  const [perfilAgricultor, setPerfilAgricultor] = useState<PerfilAgricultor>(DEFAULT_PERFIL_AGRICULTOR);
  const [perfilTecnico, setPerfilTecnico] = useState<PerfilTecnico>(DEFAULT_PERFIL_TECNICO);
  const [selectedCultivoId, setSelectedCultivoId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // Cargar datos desde Supabase al iniciar
  // ==========================================
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        // Sin sesión: intentar cargar caché local
        await loadFromCache();
        setIsLoading(false);
        return;
      }

      const userId = session.user.id;

      // Cargar datos en paralelo desde Supabase
      const [perfilRes, cultivosRes, analisisRes] = await Promise.all([
        supabase.from('perfiles').select('*').eq('id', userId).single(),
        supabase.from('cultivos').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }),
        supabase.from('analisis').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }),
      ]);

      // Perfil
      if (perfilRes.data) {
        const p = perfilRes.data;
        setRolActivoState(p.rol as RolUsuario);

        if (p.rol === 'agricultor') {
          setPerfilAgricultor({
            nombre: p.nombre || DEFAULT_PERFIL_AGRICULTOR.nombre,
            fincaPrincipal: p.finca_principal || DEFAULT_PERFIL_AGRICULTOR.fincaPrincipal,
            ubicacion: p.ubicacion || DEFAULT_PERFIL_AGRICULTOR.ubicacion,
            telefono: p.telefono || '',
            email: p.email || '',
            notificaciones: p.notificaciones ?? true,
            modoOffline: p.modo_offline ?? true,
          });
        } else {
          setPerfilTecnico({
            nombre: p.nombre || DEFAULT_PERFIL_TECNICO.nombre,
            registroProfesional: p.registro_profesional || DEFAULT_PERFIL_TECNICO.registroProfesional,
            especialidad: p.especialidad || DEFAULT_PERFIL_TECNICO.especialidad,
            entidad: p.entidad || DEFAULT_PERFIL_TECNICO.entidad,
            telefono: p.telefono || '',
            email: p.email || '',
            notificaciones: p.notificaciones ?? true,
          });
        }
      }

      // Cultivos
      if (cultivosRes.data) {
        const mapped = cultivosRes.data.map(mapCultivoFromDB);
        setCultivos(mapped);
        if (mapped.length > 0) setSelectedCultivoId(mapped[0].id);
        // Guardar en caché local
        await AsyncStorage.setItem(CACHE_KEYS.CULTIVOS, JSON.stringify(mapped));
      }

      // Análisis
      if (analisisRes.data) {
        // Cargar revisiones técnicas para cada análisis revisado
        const analisisIds = analisisRes.data
          .filter((a: any) => a.estado_revision === 'revisado')
          .map((a: any) => a.id);

        let revisionesMap: Record<string, RevisionTecnica> = {};
        if (analisisIds.length > 0) {
          const { data: revData } = await supabase
            .from('revisiones_tecnicas')
            .select('*')
            .in('analisis_id', analisisIds);

          if (revData) {
            for (const rev of revData) {
              revisionesMap[rev.analisis_id] = {
                tecnicoNombre: rev.tecnico_nombre,
                registroProfesional: rev.registro_profesional,
                fechaRevision: rev.fecha_revision,
                diagnosticoValidado: rev.diagnostico_validado,
                observaciones: rev.observaciones || '',
                tratamientoRecomendado: rev.tratamiento_recomendado || '',
              };
            }
          }
        }

        const mapped = analisisRes.data.map((row: any) => {
          const analisis = mapAnalisisFromDB(row);
          if (revisionesMap[analisis.id]) {
            analisis.revisionTecnica = revisionesMap[analisis.id];
          }
          return analisis;
        });

        setAnalisisHistorial(mapped);
        await AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(mapped));
      }
    } catch (e) {
      console.warn('Error al cargar datos desde Supabase, intentando caché local:', e);
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

  // ==========================================
  // Helpers internos
  // ==========================================

  const getUserId = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  };

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

  // ==========================================
  // Operaciones de Rol
  // ==========================================

  const setRolActivo = async (rol: RolUsuario) => {
    setRolActivoState(rol);
    try {
      await AsyncStorage.setItem(CACHE_KEYS.ROL_ACTIVO, rol);
      const userId = await getUserId();
      if (userId) {
        await supabase.from('perfiles').update({ rol }).eq('id', userId);
      }
    } catch (e) {
      console.warn('Error al cambiar rol:', e);
    }
  };

  // ==========================================
  // Operaciones de Cultivos
  // ==========================================

  const addCultivo = (cultivoData: Omit<Cultivo, 'id' | 'analisisCount' | 'ultimaRevision'>): Cultivo => {
    // Crear localmente con ID temporal
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

    // Insertar en Supabase en background
    (async () => {
      const userId = await getUserId();
      if (!userId) return;
      const { data, error } = await supabase
        .from('cultivos')
        .insert({
          usuario_id: userId,
          nombre: cultivoData.nombre,
          variedad: cultivoData.variedad,
          hectareas: cultivoData.hectareas,
          ubicacion: cultivoData.ubicacion,
          fecha_siembra: cultivoData.fechaSiembra,
          estado_fitosanitario: cultivoData.estadoFitosanitario,
        })
        .select()
        .single();

      if (data && !error) {
        // Reemplazar el ID temporal por el UUID real de Supabase
        setCultivos((prev) => {
          const withRealId = prev.map((c) =>
            c.id === tempId ? mapCultivoFromDB(data) : c
          );
          AsyncStorage.setItem(CACHE_KEYS.CULTIVOS, JSON.stringify(withRealId));
          return withRealId;
        });
        if (selectedCultivoId === tempId) {
          setSelectedCultivoId(data.id);
        }
      } else if (error) {
        console.warn('Error al insertar cultivo en Supabase:', error.message);
      }
    })();

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

    // Eliminar de Supabase en background
    supabase.from('cultivos').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Error al eliminar cultivo en Supabase:', error.message);
    });
  };

  // ==========================================
  // Operaciones de Análisis
  // ==========================================

  const addAnalisis = (analisisData: Omit<Analisis, 'id' | 'fecha'>): Analisis => {
    const tempId = `a-${Date.now()}`;
    const nuevo: Analisis = {
      ...analisisData,
      id: tempId,
      fecha: formatearFechaActual(),
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

    // Insertar en Supabase en background
    (async () => {
      const userId = await getUserId();
      if (!userId) return;

      // Si hay una imagen local, subirla a Supabase Storage primero
      let imageUrl = analisisData.imageUri;
      if (analisisData.imageUri && !analisisData.imageUri.startsWith('http')) {
        try {
          const fileName = `${userId}/${Date.now()}.jpg`;
          const response = await fetch(analisisData.imageUri);
          const blob = await response.blob();

          const { error: uploadError } = await supabase.storage
            .from('analisis-fotos')
            .upload(fileName, blob, { contentType: 'image/jpeg' });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('analisis-fotos')
              .getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
          }
        } catch (e) {
          console.warn('Error al subir imagen:', e);
        }
      }

      const { data, error } = await supabase
        .from('analisis')
        .insert({
          usuario_id: userId,
          cultivo_id: analisisData.cultivoId.startsWith('c-') ? null : analisisData.cultivoId,
          cultivo_nombre: analisisData.cultivoNombre,
          fecha: nuevo.fecha,
          image_url: imageUrl,
          diagnostico: analisisData.diagnostico,
          estado: analisisData.estado,
          severidad: analisisData.severidad,
          confianza: analisisData.confianza,
          sintomas: analisisData.sintomas,
          recomendaciones: analisisData.recomendaciones,
          notas: analisisData.notas || null,
          estado_revision: analisisData.estadoRevision || 'sin_solicitar',
        })
        .select()
        .single();

      if (data && !error) {
        setAnalisisHistorial((prev) => {
          const withRealId = prev.map((a) =>
            a.id === tempId ? { ...mapAnalisisFromDB(data), imageUri: imageUrl } : a
          );
          AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(withRealId));
          return withRealId;
        });
      } else if (error) {
        console.warn('Error al insertar análisis en Supabase:', error.message);
      }

      // Actualizar cultivo en Supabase
      const cultivo = updatedCultivos.find(
        (c) => c.id === nuevo.cultivoId || c.nombre === nuevo.cultivoNombre
      );
      if (cultivo && !cultivo.id.startsWith('c-')) {
        await supabase
          .from('cultivos')
          .update({
            analisis_count: cultivo.analisisCount,
            ultima_revision: 'Hoy',
            estado_fitosanitario: cultivo.estadoFitosanitario,
          })
          .eq('id', cultivo.id);
      }
    })();

    return nuevo;
  };

  const deleteAnalisis = (id: string) => {
    const updated = analisisHistorial.filter((a) => a.id !== id);
    setAnalisisHistorial(updated);
    AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(updated));

    // Eliminar de Supabase en background
    supabase.from('analisis').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Error al eliminar análisis en Supabase:', error.message);
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

    // Actualizar en Supabase
    supabase
      .from('analisis')
      .update({ estado_revision: 'pendiente' })
      .eq('id', analisisId)
      .then(({ error }) => {
        if (error) console.warn('Error al solicitar revisión en Supabase:', error.message);
      });
  };

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
    setAnalisisHistorial(updated);
    AsyncStorage.setItem(CACHE_KEYS.HISTORIAL, JSON.stringify(updated));

    // Guardar revisión en Supabase
    (async () => {
      const userId = await getUserId();
      if (!userId) return;

      const esAlerta =
        revisionCompleta.diagnosticoValidado === 'PMP Confirmado' ||
        revisionCompleta.diagnosticoValidado === 'Sospecha Moderada';

      // Insertar revisión técnica
      await supabase.from('revisiones_tecnicas').insert({
        analisis_id: analisisId,
        tecnico_id: userId,
        tecnico_nombre: revisionCompleta.tecnicoNombre,
        registro_profesional: revisionCompleta.registroProfesional || null,
        fecha_revision: revisionCompleta.fechaRevision,
        diagnostico_validado: revisionCompleta.diagnosticoValidado,
        observaciones: revisionCompleta.observaciones,
        tratamiento_recomendado: revisionCompleta.tratamientoRecomendado,
      });

      // Actualizar estado del análisis
      await supabase
        .from('analisis')
        .update({
          estado_revision: 'revisado',
          estado: esAlerta ? 'alerta' : 'sano',
        })
        .eq('id', analisisId);
    })();
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

      // Actualizar en Supabase
      const userId = await getUserId();
      if (userId) {
        await supabase
          .from('perfiles')
          .update({
            nombre: updated.nombre,
            finca_principal: updated.fincaPrincipal,
            ubicacion: updated.ubicacion,
            telefono: updated.telefono,
            email: updated.email,
            notificaciones: updated.notificaciones,
            modo_offline: updated.modoOffline,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
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

      // Actualizar en Supabase
      const userId = await getUserId();
      if (userId) {
        await supabase
          .from('perfiles')
          .update({
            nombre: updated.nombre,
            registro_profesional: updated.registroProfesional,
            especialidad: updated.especialidad,
            entidad: updated.entidad,
            telefono: updated.telefono,
            email: updated.email,
            notificaciones: updated.notificaciones,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
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

      // También limpiar en Supabase
      const userId = await getUserId();
      if (userId) {
        await supabase.from('analisis').delete().eq('usuario_id', userId);
        await supabase.from('cultivos').delete().eq('usuario_id', userId);
      }
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
