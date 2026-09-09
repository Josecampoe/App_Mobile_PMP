import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* 1. ENCABEZADO (Top bar) */}
      <View className="bg-black/50 p-4 flex-row justify-between items-center z-10 absolute top-0 w-full mt-8">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center w-20">
          <FontAwesome name="arrow-left" size={16} color="white" />
          <Text className="text-white text-sm ml-2">Volver</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">ANALIZAR PLANTA</Text>
        <View className="w-20" />
      </View>

      {/* 2. ÁREA DE CÁMARA (Viewfinder) */}
      <View className="flex-1 bg-gray-900 items-center justify-center relative pt-16">
        {/* Fondo simulando cámara */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
          className="absolute inset-0 opacity-30"
        />

        {/* Mensaje flotante superior */}
        <View className="bg-black/70 p-3 rounded-xl absolute top-20 z-10 shadow-lg w-11/12">
          <Text className="text-white text-sm text-center">💡 Enfoca las hojas de la planta con buena iluminación</Text>
        </View>

        {/* Cuadro de enfoque central */}
        <View className="border-2 border-dashed border-[#43A047] w-3/4 h-1/2 opacity-80 rounded-lg relative z-10 items-center justify-center">
          <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#43A047] rounded-tl" />
          <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#43A047] rounded-tr" />
          <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#43A047] rounded-bl" />
          <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#43A047] rounded-br" />
        </View>
      </View>

      {/* 3. CONTROLES INFERIORES */}
      <View className="bg-black pb-12 pt-6 items-center w-full rounded-t-3xl border-t border-gray-800 z-10 mt-auto">
        {/* Selector de cultivo */}
        <TouchableOpacity className="bg-gray-800 rounded-full px-4 py-2 mb-6 flex-row items-center">
          <Text className="text-gray-200 text-sm">📍 Finca El Porvenir</Text>
          <FontAwesome name="caret-down" size={16} color="#E5E7EB" className="ml-2" />
        </TouchableOpacity>

        {/* Botón de captura */}
        <TouchableOpacity
          onPress={() => router.push('/resultado')}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 items-center justify-center shadow-lg active:scale-90">
          <View className="w-16 h-16 bg-gray-200 rounded-full shadow-inner" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
