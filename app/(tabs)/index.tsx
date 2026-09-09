import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Inicio() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO */}
      <View className="bg-transparent p-4 flex-row justify-between items-center shrink-0">
        <Text className="text-[#2E7D32] font-bold text-xl">PMP Smart</Text>
        <FontAwesome name="user-circle" size={28} color="#263238" />
      </View>

      {/* 2. CONTENIDO PRINCIPAL */}
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Saludo */}
        <Text className="text-2xl font-bold text-[#263238] mb-1">Buenos días 👋</Text>
        <Text className="text-sm text-gray-600 mb-6">¿Qué quieres hacer hoy?</Text>

        {/* 3. BOTÓN PRINCIPAL (Analizar Planta) */}
        <TouchableOpacity
          onPress={() => router.push('/camera')}
          className="w-full bg-[#2E7D32] rounded-2xl p-6 flex-col items-center justify-center shadow-md mb-8 active:scale-95">
          <FontAwesome name="camera" size={48} color="white" />
          <Text className="text-white text-xl font-bold mt-3 tracking-wide">ANALIZAR PLANTA</Text>
          <Text className="text-[#E8F5E9] text-sm text-center mt-2">Toma una foto para revisar tu planta</Text>
        </TouchableOpacity>

        {/* 4. SECCIÓN MIS CULTIVOS */}
        <View className="mb-4">
          <Text className="text-sm font-bold text-gray-500 uppercase mb-3">Tus cultivos</Text>
          {/* Card temporal */}
          <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between border border-gray-100 shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="bg-[#E8F5E9] w-12 h-12 rounded-full items-center justify-center">
                <FontAwesome name="leaf" size={24} color="#2E7D32" />
              </View>
              <View>
                <Text className="font-bold text-gray-800 text-base">Finca El Porvenir</Text>
                <Text className="text-gray-500 text-xs">Papa · 2 Hectáreas</Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={16} color="#D1D5DB" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
