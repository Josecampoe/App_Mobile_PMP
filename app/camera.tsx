import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);

  // Seleccionar foto de la galería
  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        router.push({
          pathname: '/resultado',
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (error) {
      console.error('Error al abrir galería:', error);
      Alert.alert('Error', 'No se pudo abrir la galería de imágenes.');
    }
  };

  // Tomar foto con la cámara
  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      if (photo?.uri) {
        router.push({
          pathname: '/resultado',
          params: { imageUri: photo.uri },
        });
      }
    } catch (error) {
      console.error('Error al capturar foto:', error);
      Alert.alert('Error', 'No se pudo capturar la foto. Intenta de nuevo.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Alternar modo de flash
  const toggleFlash = () => {
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  // Alternar cámara frontal/trasera
  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // 1. Estado de carga de permisos
  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#43A047" />
        <Text className="text-white text-sm mt-3">Iniciando cámara...</Text>
      </View>
    );
  }

  // 2. Estado sin permisos concedidos
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-[#121815] px-6 justify-between py-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center bg-white/10 self-start px-4 py-2 rounded-full">
          <FontAwesome name="arrow-left" size={16} color="white" />
          <Text className="text-white text-sm ml-2">Volver</Text>
        </TouchableOpacity>

        <View className="items-center px-4">
          <View className="w-24 h-24 rounded-full bg-[#2E7D32]/20 items-center justify-center border-2 border-[#43A047] mb-6">
            <FontAwesome name="camera" size={40} color="#43A047" />
          </View>
          <Text className="text-white font-bold text-2xl text-center mb-3">
            Acceso a la Cámara
          </Text>
          <Text className="text-gray-300 text-sm text-center leading-relaxed mb-8">
            Para detectar síntomas de Punta Morada (PMP) en las hojas de tus cultivos de papa,
            necesitamos tu permiso para utilizar la cámara.
          </Text>

          <TouchableOpacity
            onPress={requestPermission}
            className="w-full bg-[#2E7D32] py-4 rounded-xl items-center shadow-lg active:scale-95 mb-4">
            <Text className="text-white font-bold text-base">Permitir Cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImageFromGallery}
            className="w-full bg-white/10 py-3.5 rounded-xl items-center border border-white/20 active:scale-95">
            <Text className="text-gray-200 font-semibold text-sm">O elegir de la galería</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-gray-500 text-xs text-center">
          Tus fotografías solo se procesan para el diagnóstico de cultivos.
        </Text>
      </SafeAreaView>
    );
  }

  // 3. Vista principal de la cámara
  return (
    <View className="flex-1 bg-black">
      {/* Visor en vivo con CameraView */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}>
        {/* Capa superior: Barra de navegación y controles */}
        <SafeAreaView className="flex-1 justify-between">
          <View className="bg-black/40 px-4 py-3 flex-row justify-between items-center backdrop-blur-md">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center bg-black/30 px-3 py-1.5 rounded-full">
              <FontAwesome name="arrow-left" size={14} color="white" />
              <Text className="text-white text-xs ml-2 font-medium">Volver</Text>
            </TouchableOpacity>

            <Text className="text-white text-base font-bold tracking-wider">ANALIZAR PLANTA</Text>

            {/* Botón Flash */}
            <TouchableOpacity
              onPress={toggleFlash}
              className={`w-9 h-9 rounded-full items-center justify-center ${
                flash !== 'off' ? 'bg-[#F9A825]' : 'bg-black/40 border border-white/20'
              }`}>
              <FontAwesome
                name="bolt"
                size={16}
                color={flash !== 'off' ? '#000' : 'white'}
              />
            </TouchableOpacity>
          </View>

          {/* Área central con retícula de enfoque */}
          <View className="items-center justify-center flex-1 px-8">
            {/* Mensaje de recomendación */}
            <View className="bg-black/60 px-4 py-2 rounded-full mb-6 border border-white/10">
              <Text className="text-white text-xs text-center">
                💡 Enfoca las hojas de la planta con buena luz
              </Text>
            </View>

            {/* Marco de enfoque */}
            <View className="w-64 h-64 border-2 border-dashed border-[#43A047]/70 rounded-2xl relative items-center justify-center">
              {/* Esquinas guía */}
              <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#43A047] rounded-tl-lg" />
              <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#43A047] rounded-tr-lg" />
              <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#43A047] rounded-bl-lg" />
              <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#43A047] rounded-br-lg" />

              {/* Indicador de flash activo */}
              {flash !== 'off' && (
                <View className="absolute top-3 right-3 bg-black/60 px-2 py-0.5 rounded-md">
                  <Text className="text-xs text-[#F9A825] font-bold">
                    Flash: {flash.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Capa inferior: Selector de cultivo y disparadores */}
          <View className="bg-black/75 pt-4 pb-8 px-6 rounded-t-3xl border-t border-white/10 items-center">
            {/* Selector de cultivo */}
            <TouchableOpacity className="bg-white/10 rounded-full px-4 py-1.5 mb-6 flex-row items-center border border-white/10">
              <Text className="text-gray-200 text-xs">📍 Finca El Porvenir</Text>
              <FontAwesome name="caret-down" size={14} color="#D1D5DB" className="ml-2" />
            </TouchableOpacity>

            {/* Fila de controles: Galería | Disparador | Rotar */}
            <View className="flex-row items-center justify-around w-full max-w-xs">
              {/* Botón Galería */}
              <TouchableOpacity
                onPress={pickImageFromGallery}
                className="w-12 h-12 rounded-full bg-white/15 items-center justify-center border border-white/20 active:scale-90"
                accessibilityLabel="Abrir galería">
                <FontAwesome name="image" size={18} color="white" />
              </TouchableOpacity>

              {/* Botón Disparador */}
              <TouchableOpacity
                onPress={takePicture}
                disabled={isCapturing}
                className="w-20 h-20 rounded-full border-4 border-white items-center justify-center shadow-lg active:scale-95 bg-white/20">
                {isCapturing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <View className="w-16 h-16 rounded-full bg-white shadow-md" />
                )}
              </TouchableOpacity>

              {/* Botón Cambiar Cámara */}
              <TouchableOpacity
                onPress={toggleFacing}
                className="w-12 h-12 rounded-full bg-white/15 items-center justify-center border border-white/20 active:scale-90"
                accessibilityLabel="Cambiar cámara">
                <FontAwesome name="refresh" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
