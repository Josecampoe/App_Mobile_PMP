import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface PerfilUsuario {
  id: string;
  rol: 'agricultor' | 'tecnico';
  nombre: string;
  telefono: string;
  email: string;
  notificaciones: boolean;
  finca_principal?: string;
  ubicacion?: string;
  modo_offline?: boolean;
  registro_profesional?: string;
  especialidad?: string;
  entidad?: string;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfil(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchPerfil(session.user.id);
        } else {
          setPerfil(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error al cargar perfil:', error.message);
        setPerfil(null);
      } else {
        setPerfil(data as PerfilUsuario);
      }
    } catch (e) {
      console.warn('Error inesperado al cargar perfil:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    nombre: string,
    rol: 'agricultor' | 'tecnico'
  ) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, rol },
      },
    });

    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }

    // El trigger handle_new_user creará el perfil automáticamente
    if (data.user) {
      // Esperar un momento para que el trigger se ejecute
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await fetchPerfil(data.user.id);
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setPerfil(null);
    setIsLoading(false);
  };

  const updatePerfil = async (datos: Partial<PerfilUsuario>) => {
    if (!user) return { error: 'No hay usuario autenticado' };

    const { error } = await supabase
      .from('perfiles')
      .update({ ...datos, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) return { error: error.message };

    // Actualizar estado local
    setPerfil((prev) => (prev ? { ...prev, ...datos } : null));
    return { error: null };
  };

  return {
    session,
    user,
    perfil,
    isLoading,
    signUp,
    signIn,
    signOut,
    updatePerfil,
    refreshPerfil: () => user && fetchPerfil(user.id),
  };
}
