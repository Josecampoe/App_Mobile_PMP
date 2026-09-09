import { View, Text, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Historial() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO */}
      <View className="bg-white p-5 items-center justify-center border-b border-gray-100 shadow-sm z-10 shrink-0">
        <Text className="text-[#2E7D32] font-bold text-lg tracking-wide">Historial de Análisis</Text>
      </View>

      {/* 2. CONTENIDO PRINCIPAL */}
      <ScrollView className="flex-1 px-4 pt-4 pb-24">
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">ESTA SEMANA</Text>

        {/* 3. TARJETA DE HISTORIAL 1 */}
        <TouchableOpacity
          onPress={() => router.push('/resultado')}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-row items-center mb-3">
          {/* Miniatura */}
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a' }}
            className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200"
          />
          {/* Textos */}
          <View className="flex-col flex-1 ml-4">
            <Text className="text-sm font-bold text-[#F9A825]">⚠️ Posible PMP</Text>
            <Text className="text-xs text-[#263238] mt-1 font-medium">🌱 Finca El Porvenir</Text>
            <Text className="text-xs text-gray-400 mt-1">09 Sep 2026</Text>
          </View>
          <FontAwesome name="chevron-right" size={18} color="#D1D5DB" />
        </TouchableOpacity>

        {/* 4. TARJETA DE HISTORIAL 2 */}
        <TouchableOpacity
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-row items-center mb-3">
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a' }}
            className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200"
          />
          <View className="flex-col flex-1 ml-4">
            <Text className="text-sm font-bold text-[#2E7D32]">🟢 Sin señales</Text>
            <Text className="text-xs text-[#263238] mt-1 font-medium">🌱 Finca El Porvenir</Text>
            <Text className="text-xs text-gray-400 mt-1">06 Sep 2026</Text>
          </View>
          <FontAwesome name="chevron-right" size={18} color="#D1D5DB" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
