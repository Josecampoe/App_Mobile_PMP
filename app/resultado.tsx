import { View, Text, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResultadoScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();

  // Imagen capturada o de respaldo
  const displayImageUri =
    imageUri || 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a';

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO (Top bar) */}
      <View className="bg-white p-4 flex-row justify-between items-center border-b border-gray-100 shrink-0">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center w-24">
          <FontAwesome name="arrow-left" size={16} color="#2E7D32" />
          <Text className="text-[#2E7D32] font-semibold text-sm ml-2">Volver</Text>
        </TouchableOpacity>
        <Text className="text-gray-800 font-bold text-lg tracking-wide">RESULTADO</Text>
        <View className="w-24" />
      </View>

      {/* 2. CONTENIDO PRINCIPAL */}
      <ScrollView className="flex-1 px-4 pt-4">
        {/* 3. MINIATURA DE LA FOTO */}
        <View className="h-48 w-full rounded-2xl overflow-hidden relative shadow-sm border border-gray-200 mb-5 bg-gray-900">
          <ImageBackground
            source={{ uri: displayImageUri }}
            resizeMode="cover"
            className="flex-1"
          >
            <View className="absolute top-0 left-0 bg-black/60 px-3 py-1.5 rounded-br-xl rounded-tl-xl flex-row items-center">
              <FontAwesome name="map-marker" size={12} color="#81C784" />
              <Text className="text-white text-xs ml-1.5 font-medium">Finca El Porvenir</Text>
            </View>
            {imageUri && (
              <View className="absolute bottom-2 right-2 bg-black/70 px-2.5 py-1 rounded-lg">
                <Text className="text-xs text-[#81C784] font-medium">✓ Foto capturada</Text>
              </View>
            )}
          </ImageBackground>
        </View>

        {/* 4. TARJETA DE RESULTADO (ESTADO ADVERTENCIA) */}
        <View className="bg-[#FFFDE7] border-2 border-[#F9A825] rounded-2xl p-6 items-center shadow-sm relative overflow-hidden mb-5">
          <Text className="text-5xl mb-3">⚠️</Text>
          <Text className="text-[#F9A825] font-black text-xl text-center mb-2">POSIBLE PUNTA MORADA</Text>
          <Text className="text-gray-700 text-center text-sm leading-relaxed">
            Encontramos señales en las hojas que podrían estar relacionadas con PMP.
          </Text>
        </View>

        {/* 5. TARJETA DE RECOMENDACIÓN */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-row items-start mb-5">
          <Text className="text-2xl mr-4">💡</Text>
          <View className="flex-1">
            <Text className="font-bold text-[#263238] text-sm mb-1">Recomendación</Text>
            <Text className="text-gray-500 text-sm">
              Revisa detalladamente otras plantas cercanas a esta. Considera consultar a un técnico agrícola para una revisión presencial.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 6. BOTONES DE ACCIÓN (Bottom fixed area) */}
      <View className="bg-white p-4 border-t border-gray-100 shrink-0 pb-8">
        {/* Botón Principal */}
        <TouchableOpacity
          onPress={() => router.push('/')}
          className="bg-[#2E7D32] rounded-xl p-4 flex-row items-center justify-center shadow-md active:scale-95 mb-3"
        >
          <FontAwesome name="save" size={20} color="white" />
          <Text className="text-white font-bold ml-2">GUARDAR ESTE ANÁLISIS</Text>
        </TouchableOpacity>
        
        {/* Botón Secundario */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-transparent p-3 border border-gray-300 rounded-xl items-center active:scale-95"
        >
          <Text className="text-gray-500 font-semibold">Descartar y analizar otra</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
