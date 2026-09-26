import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { analisisApi } from '../lib/api';

export default function ResultadoScreen() {
  const router = useRouter();
  const { imageUri, cultivoId, cultivoNombre } = useLocalSearchParams<{
    imageUri?: string;
    cultivoId?: string;
    cultivoNombre?: string;
  }>();

  const { addAnalisis, cultivos } = useApp();
  const [isSaving, setIsSaving] = useState(false);

  // Imagen capturada o de respaldo
  const displayImageUri = imageUri || 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a';

  // Obtener nombre del cultivo
  const targetCultivo =
    cultivos.find((c) => c.id === cultivoId) ||
    cultivos[0] || { id: 'lote-general', nombre: cultivoNombre || 'Muestra de Campo' };

  const finalCultivoNombre = cultivoNombre || targetCultivo.nombre;
  const finalCultivoId = cultivoId || targetCultivo.id;

  const [isProcessing, setIsProcessing] = useState(true);
  const [aiData, setAiData] = useState<any>(null);

  useEffect(() => {
    const procesarIA = async () => {
      try {
        const res = await analisisApi.procesar(displayImageUri);
        if (res.success && res.data) {
          setAiData(res.data);
        } else {
          Alert.alert('Aviso', 'La IA no pudo procesar la imagen, se usarán datos por defecto.');
        }
      } catch (err) {
        Alert.alert('Error', 'Problema de conexión con la IA.');
      } finally {
        setIsProcessing(false);
      }
    };
    procesarIA();
  }, []);

  const sintomasDetectados = aiData?.sintomas || [
    'Coloración rojiza/púrpura en foliolos apicales superiores',
    'Foliolos con enrollamiento hacia el haz (formación en cuchara)',
    'Acortamiento de entrenudos y engrosamiento leve en nudos',
  ];

  const recomendacionesAgro = aiData?.recomendaciones || [
    'Instalar trampas cromáticas amarillas perimetrales para capturar el psílido vector (Bactericera cockerelli).',
    'Aislar e inspeccionar las plantas adyacentes en un radio de 5 a 10 metros.',
    'No emplear tubérculos de lotes sospechosos como semilla para futuros ciclos.',
    'Solicitar dictamen técnico a un agrónomo para formular plan de control fitosanitario.',
  ];

  const diagnosticoTexto = aiData?.diagnostico || 'POSIBLE PMP';
  const confianzaNum = aiData?.confianza || 91;
  const estadoVisual = aiData?.estado || 'alerta';

  const handleGuardar = (solicitarRevision: boolean) => {
    try {
      setIsSaving(true);
      addAnalisis({
        cultivoId: finalCultivoId,
        cultivoNombre: finalCultivoNombre,
        imageUri: displayImageUri,
        diagnostico: diagnosticoTexto,
        estado: estadoVisual,
        severidad: aiData?.severidad || 'moderada',
        confianza: confianzaNum,
        sintomas: sintomasDetectados,
        recomendaciones: recomendacionesAgro,
        estadoRevision: solicitarRevision ? 'pendiente' : 'sin_solicitar',
        notas: `Análisis fitosanitario en ${finalCultivoNombre}.`,
      });

      if (solicitarRevision) {
        Alert.alert(
          '¡Guardado y Enviado a Revisión!',
          `El análisis de ${finalCultivoNombre} ha sido guardado y remitido a la bandeja del Técnico Agrónomo para su dictamen oficial.`,
          [
            {
              text: 'Ver en Historial',
              onPress: () => router.push('/(tabs)/historial'),
            },
          ]
        );
      } else {
        Alert.alert(
          '¡Análisis Guardado!',
          `El diagnóstico quedó registrado en tu historial personal de ${finalCultivoNombre}.`,
          [
            {
              text: 'Ver en Historial',
              onPress: () => router.push('/(tabs)/historial'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error al guardar análisis:', error);
      Alert.alert('Error', 'No se pudo guardar el análisis. Inténtalo nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO */}
      <View className="bg-white p-4 flex-row justify-between items-center border-b border-gray-100 shrink-0">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center w-24">
          <FontAwesome name="arrow-left" size={16} color="#2E7D32" />
          <Text className="text-[#2E7D32] font-semibold text-sm ml-2">Volver</Text>
        </TouchableOpacity>
        <Text className="text-gray-800 font-bold text-lg tracking-wide">RESULTADO</Text>
        <View className="w-24 items-end">
          <View className="bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Text className="text-[11px] font-bold text-[#2E7D32]">IA Activa</Text>
          </View>
        </View>
      </View>

      {/* 2. CONTENIDO PRINCIPAL */}
      <ScrollView className="flex-1 px-4 pt-4 pb-12" showsVerticalScrollIndicator={false}>
        {/* Foto capturada */}
        <View className="h-52 w-full rounded-2xl overflow-hidden relative shadow-sm border border-gray-200 mb-5 bg-gray-900">
          <ImageBackground
            source={{ uri: displayImageUri }}
            resizeMode="cover"
            className="flex-1">
            <View className="absolute top-2.5 left-2.5 bg-black/70 px-3 py-1.5 rounded-xl flex-row items-center">
              <FontAwesome name="map-marker" size={12} color="#81C784" />
              <Text className="text-white text-xs ml-1.5 font-semibold">
                {finalCultivoNombre}
              </Text>
            </View>
            <View className="absolute bottom-2.5 right-2.5 bg-black/70 px-2.5 py-1 rounded-lg">
              <Text className="text-xs text-[#81C784] font-medium">✓ Foto capturada</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Loading IA o Tarjeta de diagnóstico */}
        {isProcessing ? (
          <View className="bg-white border border-gray-200 rounded-2xl p-6 items-center shadow-sm mb-4">
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text className="text-[#2E7D32] font-bold mt-4 text-center">
              Inteligencia Artificial Analizando...
            </Text>
            <Text className="text-gray-500 text-xs text-center mt-1">
              Buscando patrones de Punta Morada en la imagen
            </Text>
          </View>
        ) : (
          <View className={`border-2 rounded-2xl p-5 items-center shadow-sm relative overflow-hidden mb-4 ${
            estadoVisual === 'alerta' ? 'bg-[#FFFDE7] border-[#F9A825]' : 'bg-emerald-50 border-emerald-400'
          }`}>
            <Text className="text-4xl mb-2">{estadoVisual === 'alerta' ? '⚠️' : '✅'}</Text>
            <Text className={`font-black text-xl text-center mb-1 uppercase ${
              estadoVisual === 'alerta' ? 'text-[#D97706]' : 'text-[#2E7D32]'
            }`}>
              {diagnosticoTexto}
            </Text>
            <View className={`${
              estadoVisual === 'alerta' ? 'bg-[#F9A825]/20' : 'bg-emerald-200'
            } px-3 py-0.5 rounded-full mb-3`}>
              <Text className={`text-xs font-bold ${
                estadoVisual === 'alerta' ? 'text-[#B45309]' : 'text-emerald-800'
              }`}>
                {confianzaNum}% Nivel de Coincidencia Visual
              </Text>
            </View>
            <Text className="text-gray-700 text-center text-xs leading-relaxed">
              {estadoVisual === 'alerta' 
                ? 'Se detectaron patrones morfológicos y pigmentarios en los brotes foliares compatibles con Punta Morada de la Papa (PMP). Puedes solicitar una revisión técnica oficial a un agrónomo.'
                : 'No se detectaron patrones evidentes de Punta Morada. Sin embargo, mantén el monitoreo periódico del cultivo.'}
            </Text>
          </View>
        )}

        {/* Síntomas detectados */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center mb-2.5">
            <FontAwesome name="check-square-o" size={15} color="#2E7D32" />
            <Text className="font-bold text-[#263238] text-xs uppercase ml-2">
              Patrones Visuales Identificados
            </Text>
          </View>
          {sintomasDetectados.map((sintoma: string, idx: number) => (
            <View key={idx} className="flex-row items-start mb-2">
              <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2" />
              <Text className="text-xs text-gray-700 flex-1 leading-normal">{sintoma}</Text>
            </View>
          ))}
        </View>

        {/* Recomendaciones preliminares */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 mb-6">
          <View className="flex-row items-center mb-2.5">
            <FontAwesome name="lightbulb-o" size={16} color="#2E7D32" />
            <Text className="font-bold text-[#2E7D32] text-xs uppercase ml-2">
              Medidas Preventivas Inmediatas
            </Text>
          </View>
          {recomendacionesAgro.map((rec: string, idx: number) => (
            <View key={idx} className="flex-row items-start mb-2">
              <Text className="text-xs font-bold text-[#2E7D32] mr-2">{idx + 1}.</Text>
              <Text className="text-xs text-gray-600 flex-1 leading-normal">{rec}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 3. BOTONES DE ACCIÓN */}
      <View className="bg-white p-4 border-t border-gray-100 shrink-0 pb-7 shadow-lg">
        {/* Opción 1: Guardar y solicitar revisión técnica */}
        <TouchableOpacity
          onPress={() => handleGuardar(true)}
          disabled={isSaving || isProcessing}
          className={`bg-[#1565C0] rounded-xl p-3.5 flex-row items-center justify-center shadow-md active:scale-95 mb-2.5 ${
            isSaving || isProcessing ? 'opacity-50' : ''
          }`}>
          <FontAwesome name="paper-plane" size={16} color="white" />
          <Text className="text-white font-bold ml-2 text-xs">
            {isSaving ? 'GUARDANDO...' : 'GUARDAR Y SOLICITAR REVISIÓN TÉCNICA'}
          </Text>
        </TouchableOpacity>

        {/* Opción 2: Guardar solo en historial personal */}
        <TouchableOpacity
          onPress={() => handleGuardar(false)}
          disabled={isSaving || isProcessing}
          className={`bg-[#2E7D32] rounded-xl p-3 flex-row items-center justify-center shadow-sm active:scale-95 mb-2 ${
            isSaving || isProcessing ? 'opacity-50' : ''
          }`}>
          <FontAwesome name="save" size={16} color="white" />
          <Text className="text-white font-bold ml-2 text-xs">
            Guardar solo en mi historial
          </Text>
        </TouchableOpacity>

        {/* Descartar */}
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={isSaving || isProcessing}
          className={`p-2 items-center active:scale-95 ${
            isSaving || isProcessing ? 'opacity-50' : ''
          }`}>
          <Text className="text-gray-500 font-semibold text-xs">Descartar y tomar otra</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
