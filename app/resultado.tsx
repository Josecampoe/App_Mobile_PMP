import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

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
  const displayImageUri =
    imageUri || 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a';

  // Obtener nombre del cultivo
  const targetCultivo =
    cultivos.find((c) => c.id === cultivoId) ||
    cultivos[0] || { id: 'c-1', nombre: cultivoNombre || 'Finca El Porvenir' };

  const finalCultivoNombre = cultivoNombre || targetCultivo.nombre;
  const finalCultivoId = cultivoId || targetCultivo.id;

  const sintomasDetectados = [
    'Pigmentación púrpura / amarillenta en bordes foliares apicales',
    'Foliolos erguidos con enrollamiento hacia el haz',
    'Ligero engrosamiento en nudos de los tallos superiores',
  ];

  const recomendacionesAgro = [
    'Colocar trampas cromáticas amarillas para monitorear el psílido vector (Bactericera cockerelli).',
    'Aislar e inspeccionar las plantas adyacentes en un radio de 5 a 10 metros.',
    'No emplear tubérculos de lotes afectados como material de siembra (semilla).',
    'Consultar de inmediato a un agrónomo para evaluar control biológico o foliar.',
  ];

  const handleGuardarAnalisis = () => {
    try {
      setIsSaving(true);
      addAnalisis({
        cultivoId: finalCultivoId,
        cultivoNombre: finalCultivoNombre,
        imageUri: displayImageUri,
        diagnostico: 'Posible PMP',
        estado: 'alerta',
        severidad: 'moderada',
        confianza: 91,
        sintomas: sintomasDetectados,
        recomendaciones: recomendacionesAgro,
        notas: `Análisis fitosanitario preventivo realizado en ${finalCultivoNombre}.`,
      });

      Alert.alert(
        '¡Análisis Guardado!',
        `El diagnóstico ha sido vinculado exitosamente a ${finalCultivoNombre} y registrado en tu historial.`,
        [
          {
            text: 'Ver en Historial',
            onPress: () => router.push('/(tabs)/historial'),
          },
        ]
      );
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
        {/* 3. MINIATURA DE LA FOTO CAPTURADA */}
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

        {/* 4. TARJETA DE RESULTADO DE DIAGNÓSTICO */}
        <View className="bg-[#FFFDE7] border-2 border-[#F9A825] rounded-2xl p-5 items-center shadow-sm relative overflow-hidden mb-4">
          <Text className="text-4xl mb-2">⚠️</Text>
          <Text className="text-[#D97706] font-black text-xl text-center mb-1">
            POSIBLE PUNTA MORADA
          </Text>
          <View className="bg-[#F9A825]/20 px-3 py-0.5 rounded-full mb-3">
            <Text className="text-xs font-bold text-[#B45309]">
              91% Nivel de Coincidencia
            </Text>
          </View>
          <Text className="text-gray-700 text-center text-xs leading-relaxed">
            Se detectaron patrones morfológicos y pigmentarios en los brotes foliares compatibles con
            Punta Morada de la Papa (PMP).
          </Text>
        </View>

        {/* 5. SÍNTOMAS DETECTADOS */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center mb-2.5">
            <FontAwesome name="check-square-o" size={15} color="#2E7D32" />
            <Text className="font-bold text-[#263238] text-xs uppercase ml-2">
              Patrones Visuales Identificados
            </Text>
          </View>
          {sintomasDetectados.map((sintoma, idx) => (
            <View key={idx} className="flex-row items-start mb-2">
              <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2" />
              <Text className="text-xs text-gray-700 flex-1 leading-normal">{sintoma}</Text>
            </View>
          ))}
        </View>

        {/* 6. TARJETA DE RECOMENDACIÓN AGRONÓMICA */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 mb-6">
          <View className="flex-row items-center mb-2.5">
            <FontAwesome name="lightbulb-o" size={16} color="#2E7D32" />
            <Text className="font-bold text-[#2E7D32] text-xs uppercase ml-2">
              Protocolo Recomendado (ICA / FAO)
            </Text>
          </View>
          {recomendacionesAgro.map((rec, idx) => (
            <View key={idx} className="flex-row items-start mb-2">
              <Text className="text-xs font-bold text-[#2E7D32] mr-2">{idx + 1}.</Text>
              <Text className="text-xs text-gray-600 flex-1 leading-normal">{rec}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 7. BOTONES DE ACCIÓN (Fixed Bottom) */}
      <View className="bg-white p-4 border-t border-gray-100 shrink-0 pb-7 shadow-lg">
        {/* Botón Principal Guardar */}
        <TouchableOpacity
          onPress={handleGuardarAnalisis}
          disabled={isSaving}
          className="bg-[#2E7D32] rounded-xl p-3.5 flex-row items-center justify-center shadow-md active:scale-95 mb-2.5">
          <FontAwesome name="save" size={18} color="white" />
          <Text className="text-white font-bold ml-2 text-sm">
            {isSaving ? 'GUARDANDO...' : 'GUARDAR ESTE ANÁLISIS'}
          </Text>
        </TouchableOpacity>

        {/* Botón Secundario Descartar */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-transparent p-2.5 border border-gray-200 rounded-xl items-center active:scale-95">
          <Text className="text-gray-500 font-semibold text-xs">Descartar y analizar otra</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
