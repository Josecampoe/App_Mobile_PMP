import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, Analisis } from '../../context/AppContext';

export default function Historial() {
  const router = useRouter();
  const { analisisHistorial, deleteAnalisis } = useApp();

  const [filtro, setFiltro] = useState<'todos' | 'alerta' | 'sano'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [selectedAnalisis, setSelectedAnalisis] = useState<Analisis | null>(null);

  // Filtrado de análisis
  const itemsFiltrados = analisisHistorial.filter((item) => {
    const matchFiltro =
      filtro === 'todos' ||
      (filtro === 'alerta' && (item.estado === 'alerta' || item.diagnostico.includes('PMP'))) ||
      (filtro === 'sano' && item.estado === 'sano');

    const matchBusqueda =
      item.cultivoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.diagnostico.toLowerCase().includes(busqueda.toLowerCase()) ||
      (item.sintomas && item.sintomas.some((s) => s.toLowerCase().includes(busqueda.toLowerCase())));

    return matchFiltro && matchBusqueda;
  });

  const handleEliminar = (analisis: Analisis) => {
    Alert.alert(
      'Eliminar Registro',
      `¿Deseas eliminar este reporte fitosanitario de ${analisis.cultivoNombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteAnalisis(analisis.id);
            setSelectedAnalisis(null);
          },
        },
      ]
    );
  };

  const getDiagnosticoConfig = (diagnostico: string, estado: string) => {
    if (diagnostico.includes('Severo') || estado === 'alerta' && diagnostico.includes('Confirmado')) {
      return {
        badgeBg: 'bg-red-100 text-red-800 border-red-200',
        textColor: 'text-red-700',
        icon: 'warning',
        label: diagnostico,
      };
    }
    if (diagnostico.includes('PMP') || estado === 'alerta') {
      return {
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        textColor: 'text-[#D97706]',
        icon: 'exclamation-triangle',
        label: diagnostico,
      };
    }
    return {
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      textColor: 'text-[#2E7D32]',
      icon: 'check-circle',
      label: diagnostico,
    };
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO */}
      <View className="bg-white px-5 py-4 flex-row justify-between items-center border-b border-gray-100 shadow-sm shrink-0">
        <View>
          <Text className="text-xl font-bold text-[#263238]">Historial de Análisis</Text>
          <Text className="text-xs text-gray-500">Reportes de diagnóstico y monitoreo</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/camera')}
          className="bg-[#2E7D32] w-9 h-9 rounded-full items-center justify-center active:scale-95 shadow-sm">
          <FontAwesome name="camera" size={14} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-3 pb-24" showsVerticalScrollIndicator={false}>
        {/* 2. BUSCADOR */}
        <View className="bg-white rounded-xl px-3.5 py-2.5 flex-row items-center border border-gray-200 mb-3 shadow-sm">
          <FontAwesome name="search" size={14} color="#9CA3AF" className="mr-2" />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por finca, síntoma o estado..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-xs text-gray-800 py-0"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <FontAwesome name="times-circle" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 3. FILTROS RÁPIDOS */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={() => setFiltro('todos')}
            className={`px-3.5 py-1.5 rounded-full border ${
              filtro === 'todos'
                ? 'bg-[#2E7D32] border-[#2E7D32]'
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
            <Text
              className={`text-xs font-semibold ${
                filtro === 'todos' ? 'text-white' : 'text-gray-600'
              }`}>
              Todos ({analisisHistorial.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFiltro('alerta')}
            className={`px-3.5 py-1.5 rounded-full border ${
              filtro === 'alerta'
                ? 'bg-amber-600 border-amber-600'
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
            <Text
              className={`text-xs font-semibold ${
                filtro === 'alerta' ? 'text-white' : 'text-gray-600'
              }`}>
              ⚠️ Con Alerta PMP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFiltro('sano')}
            className={`px-3.5 py-1.5 rounded-full border ${
              filtro === 'sano'
                ? 'bg-emerald-600 border-emerald-600'
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
            <Text
              className={`text-xs font-semibold ${
                filtro === 'sano' ? 'text-white' : 'text-gray-600'
              }`}>
              🟢 Sanos
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. LISTA DE ANÁLISIS */}
        {itemsFiltrados.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center justify-center border border-dashed border-gray-300 mt-2">
            <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
              <FontAwesome name="clipboard" size={24} color="#9CA3AF" />
            </View>
            <Text className="text-base font-bold text-gray-800 text-center">No hay registros</Text>
            <Text className="text-xs text-gray-500 text-center mt-1 mb-4">
              {busqueda
                ? 'No encontramos coincidencias para tu búsqueda.'
                : 'Aún no has guardado análisis con la cámara.'}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/camera')}
              className="bg-[#2E7D32] px-4 py-2 rounded-xl shadow-sm">
              <Text className="text-white text-xs font-bold">+ Escanear Planta Ahora</Text>
            </TouchableOpacity>
          </View>
        ) : (
          itemsFiltrados.map((item) => {
            const config = getDiagnosticoConfig(item.diagnostico, item.estado);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedAnalisis(item)}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex-row items-center mb-3 active:scale-[0.99]">
                {/* Miniatura */}
                <Image
                  source={{ uri: item.imageUri }}
                  className="w-18 h-18 rounded-xl bg-gray-100"
                  style={{ width: 72, height: 72 }}
                  resizeMode="cover"
                />

                {/* Info */}
                <View className="flex-1 ml-3.5 justify-center">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`text-xs font-bold ${config.textColor}`}>
                      {config.label}
                    </Text>
                    <View className="bg-gray-100 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-bold text-gray-600">
                        {item.confianza}% conf.
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs text-[#263238] font-semibold">
                    📍 {item.cultivoNombre}
                  </Text>
                  <Text className="text-[11px] text-gray-400 mt-0.5">{item.fecha}</Text>
                </View>

                <FontAwesome name="chevron-right" size={14} color="#D1D5DB" className="ml-2" />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 5. MODAL DE DETALLE DEL ANÁLISIS */}
      <Modal
        visible={!!selectedAnalisis}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAnalisis(null)}>
        {selectedAnalisis && (
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-3xl p-5 max-h-[92%]">
              {/* Header Modal */}
              <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <View>
                  <Text className="text-base font-bold text-[#263238]">Detalle de Análisis</Text>
                  <Text className="text-xs text-gray-500">{selectedAnalisis.fecha}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedAnalisis(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                  <FontAwesome name="times" size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                {/* Imagen en grande */}
                <View className="w-full h-52 rounded-2xl overflow-hidden mb-4 bg-gray-900 relative shadow-sm">
                  <Image
                    source={{ uri: selectedAnalisis.imageUri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-2.5 left-2.5 bg-black/70 px-3 py-1 rounded-lg flex-row items-center">
                    <FontAwesome name="map-marker" size={12} color="#81C784" />
                    <Text className="text-white text-xs ml-1.5 font-medium">
                      {selectedAnalisis.cultivoNombre}
                    </Text>
                  </View>
                </View>

                {/* Banner de Diagnóstico */}
                <View
                  className={`p-4 rounded-2xl border mb-4 ${
                    selectedAnalisis.diagnostico.includes('PMP') || selectedAnalisis.estado === 'alerta'
                      ? 'bg-[#FFFDE7] border-[#F9A825]'
                      : 'bg-emerald-50 border-emerald-300'
                  }`}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className={`text-base font-black uppercase ${
                        selectedAnalisis.diagnostico.includes('PMP')
                          ? 'text-[#D97706]'
                          : 'text-[#2E7D32]'
                      }`}>
                      {selectedAnalisis.diagnostico}
                    </Text>
                    <View className="bg-white/80 px-2.5 py-0.5 rounded-full">
                      <Text className="text-xs font-bold text-gray-800">
                        {selectedAnalisis.confianza}% Confianza
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-700 mt-1">
                    {selectedAnalisis.diagnostico.includes('PMP')
                      ? 'Se identificaron patrones visuales característicos de Punta Morada en el follaje.'
                      : 'No se observan síntomas visibles de infestación o fitoplasmas en la muestra evaluada.'}
                  </Text>
                </View>

                {/* Síntomas identificados */}
                <View className="bg-[#F9FAFB] rounded-2xl p-4 mb-4 border border-gray-100">
                  <Text className="text-xs font-bold text-gray-700 uppercase mb-2">
                    🔍 Síntomas Evaluados
                  </Text>
                  {selectedAnalisis.sintomas.map((s, idx) => (
                    <View key={idx} className="flex-row items-start mb-1.5">
                      <Text className="text-xs text-[#2E7D32] mr-2">•</Text>
                      <Text className="text-xs text-gray-700 flex-1">{s}</Text>
                    </View>
                  ))}
                </View>

                {/* Recomendaciones agronómicas */}
                <View className="bg-white rounded-2xl p-4 mb-4 border border-emerald-100 shadow-sm">
                  <Text className="text-xs font-bold text-[#2E7D32] uppercase mb-2">
                    📋 Recomendaciones de Manejo
                  </Text>
                  {selectedAnalisis.recomendaciones.map((r, idx) => (
                    <View key={idx} className="flex-row items-start mb-2">
                      <Text className="text-xs font-bold text-[#2E7D32] mr-2">{idx + 1}.</Text>
                      <Text className="text-xs text-gray-600 flex-1">{r}</Text>
                    </View>
                  ))}
                </View>

                {selectedAnalisis.notas ? (
                  <View className="bg-gray-50 rounded-xl p-3 mb-2">
                    <Text className="text-[11px] font-semibold text-gray-500 uppercase">
                      Notas de campo
                    </Text>
                    <Text className="text-xs text-gray-700 mt-0.5">{selectedAnalisis.notas}</Text>
                  </View>
                ) : null}
              </ScrollView>

              {/* Acciones */}
              <View className="flex-row gap-3 pt-2 border-t border-gray-100">
                <TouchableOpacity
                  onPress={() => handleEliminar(selectedAnalisis)}
                  className="flex-1 py-3 rounded-xl border border-red-200 bg-red-50 flex-row items-center justify-center">
                  <FontAwesome name="trash" size={14} color="#DC2626" />
                  <Text className="text-red-700 font-bold text-xs ml-2">Eliminar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedAnalisis(null)}
                  className="flex-1 py-3 rounded-xl bg-[#2E7D32] items-center justify-center shadow-sm">
                  <Text className="text-white font-bold text-xs">Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
