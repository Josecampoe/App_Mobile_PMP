import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cultivoId?: string }>();
  const cameraRef = useRef<CameraView>(null);

  const { cultivos, selectedCultivoId, setSelectedCultivoId } = useApp();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  // Inicializar cultivo seleccionado si vino por parámetro
  useEffect(() => {
    if (params.cultivoId) {
      setSelectedCultivoId(params.cultivoId);
    }
  }, [params.cultivoId]);

  const currentCultivo =
    cultivos.find((c) => c.id === selectedCultivoId) ||
    cultivos[0] || {
      id: 'default',
      nombre: 'Finca General',
      variedad: 'Papa Comercial',
    };

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
          params: {
            imageUri: result.assets[0].uri,
            cultivoId: currentCultivo.id,
            cultivoNombre: currentCultivo.nombre,
          },
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
          params: {
            imageUri: photo.uri,
            cultivoId: currentCultivo.id,
            cultivoNombre: currentCultivo.nombre,
          },
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
          Tus fotografías solo se procesan para el diagnóstico fitosanitario de tus parcelas.
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
                💡 Enfoca las hojas apicales y brotes con buena luz
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
            {/* Selector interactivo de cultivo */}
            <TouchableOpacity
              onPress={() => setSelectorVisible(true)}
              className="bg-white/15 active:bg-white/25 rounded-full px-4 py-2 mb-6 flex-row items-center border border-white/20">
              <FontAwesome name="map-marker" size={13} color="#81C784" />
              <Text className="text-white text-xs font-semibold ml-2">
                {currentCultivo.nombre} ({currentCultivo.variedad})
              </Text>
              <FontAwesome name="chevron-down" size={11} color="#D1D5DB" className="ml-2.5" />
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

      {/* MODAL: SELECCIONAR PARCELA / CULTIVO */}
      <Modal visible={selectorVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-white rounded-2xl p-5 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <Text className="text-base font-bold text-[#263238]">Selecciona el Cultivo / Lote</Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <FontAwesome name="times" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-gray-500 mb-3">
              Indica en qué parcela estás tomando la fotografía para vincular el diagnóstico.
            </Text>

            <ScrollView className="max-h-60">
              {cultivos.map((cultivo) => {
                const isSelected = cultivo.id === currentCultivo.id;
                return (
                  <TouchableOpacity
                    key={cultivo.id}
                    onPress={() => {
                      setSelectedCultivoId(cultivo.id);
                      setSelectorVisible(false);
                    }}
                    className={`p-3 rounded-xl mb-2 flex-row justify-between items-center border ${
                      isSelected
                        ? 'bg-emerald-50 border-[#2E7D32]'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-[#2E7D32]' : 'text-gray-800'
                        }`}>
                        {cultivo.nombre}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {cultivo.variedad} · {cultivo.hectareas} Ha
                      </Text>
                    </View>
                    {isSelected && <FontAwesome name="check" size={14} color="#2E7D32" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setSelectorVisible(false);
                router.push('/(tabs)/cultivos');
              }}
              className="mt-3 py-2.5 bg-gray-100 rounded-xl items-center flex-row justify-center">
              <FontAwesome name="plus" size={12} color="#4B5563" />
              <Text className="text-xs font-semibold text-gray-700 ml-2">Registrar Nuevo Lote</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
