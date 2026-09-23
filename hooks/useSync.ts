import { useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const SYNC_QUEUE_KEY = '@pmp_smart_sync_queue';

export interface SyncOperation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: number;
}

/**
 * Hook para manejar sincronización offline/online.
 * Encola operaciones cuando no hay conexión y las ejecuta al reconectarse.
 */
export function useSync() {
  const isSyncing = useRef(false);

  /**
   * Agregar una operación a la cola de sincronización offline
   */
  const enqueueOperation = useCallback(async (op: Omit<SyncOperation, 'id' | 'timestamp'>) => {
    try {
      const queue = await getQueue();
      const newOp: SyncOperation = {
        ...op,
        id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      queue.push(newOp);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      return newOp;
    } catch (e) {
      console.warn('Error al encolar operación de sync:', e);
      return null;
    }
  }, []);

  /**
   * Obtener la cola de operaciones pendientes
   */
  const getQueue = useCallback(async (): Promise<SyncOperation[]> => {
    try {
      const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Procesar todas las operaciones pendientes en la cola
   */
  const processQueue = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const queue = await getQueue();
      if (queue.length === 0) {
        isSyncing.current = false;
        return;
      }

      const failedOps: SyncOperation[] = [];

      for (const op of queue) {
        try {
          let error: any = null;

          switch (op.operation) {
            case 'insert': {
              const result = await supabase.from(op.table).insert(op.data);
              error = result.error;
              break;
            }
            case 'update': {
              const { id, ...updateData } = op.data;
              const result = await supabase.from(op.table).update(updateData).eq('id', id);
              error = result.error;
              break;
            }
            case 'delete': {
              const result = await supabase.from(op.table).delete().eq('id', op.data.id);
              error = result.error;
              break;
            }
          }

          if (error) {
            console.warn(`Error sincronizando ${op.table}/${op.operation}:`, error.message);
            failedOps.push(op);
          }
        } catch (e) {
          console.warn('Error procesando operación de sync:', e);
          failedOps.push(op);
        }
      }

      // Guardar solo las operaciones que fallaron para reintentar después
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedOps));

      if (failedOps.length > 0) {
        console.warn(`${failedOps.length} operaciones pendientes de sincronizar.`);
      }
    } catch (e) {
      console.warn('Error general en processQueue:', e);
    } finally {
      isSyncing.current = false;
    }
  }, [getQueue]);

  /**
   * Limpiar toda la cola de sincronización
   */
  const clearQueue = useCallback(async () => {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  }, []);

  /**
   * Obtener el número de operaciones pendientes
   */
  const getPendingCount = useCallback(async (): Promise<number> => {
    const queue = await getQueue();
    return queue.length;
  }, [getQueue]);

  return {
    enqueueOperation,
    processQueue,
    clearQueue,
    getPendingCount,
  };
}
