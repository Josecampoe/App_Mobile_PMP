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
  TextInput,
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

  const { cultivos, selectedCultivoId, setSelectedCultivoId, addCultivo } = useApp();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  // Modal para crear parcela rápida si no tiene
  const [modalNuevoLote, setModalNuevoLote] = useState(false);
  const [nuevoLoteNombre, setNuevoLoteNombre] = useState('');
  const [nuevoLoteVariedad, setNuevoLoteVariedad] = useState('Papa Pastusa Suprema');
  const [nuevoLoteHectareas, setNuevoLoteHectareas] = useState('1.0');

  useEffect(() => {
    if (params.cultivoId) {
      setSelectedCultivoId(params.cultivoId);
    }
  }, [params.cultivoId]);

  const currentCultivo =
    cultivos.find((c) => c.id === selectedCultivoId) ||
    cultivos[0] || {
      id: 'lote-general',
      nombre: 'Muestra General de Campo',
      variedad: 'Papa Comercial',
    };

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

  const toggleFlash = () => {
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleCrearLoteRapido = () => {
    if (!nuevoLoteNombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del lote.');
      return;
    }
    const ha = parseFloat(nuevoLoteHectareas.replace(',', '.')) || 1.0;
    const nuevo = addCultivo({
      nombre: nuevoLoteNombre.trim(),
      variedad: nuevoLoteVariedad,
      hectareas: Number(ha.toFixed(1)),
      ubicacion: 'Zona Rural',
      fechaSiembra: 'Reciente',
      estadoFitosanitario: 'optimo',
    });

    setSelectedCultivoId(nuevo.id);
    setNuevoLoteNombre('');
    setModalNuevoLote(false);
    setSelectorVisible(false);
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#43A047" />
        <Text className="text-white text-sm mt-3">Iniciando cámara...</Text>
      </View>
    );
  }

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
            Para fotografiar y detectar síntomas de Punta Morada (PMP) en las hojas de tus cultivos
            de papa, necesitamos tu permiso para utilizar la cámara.
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

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        autofocus="on"
        enableTorch={flash === 'on'}
      />
      <SafeAreaView className="absolute w-full h-full justify-between" pointerEvents="box-none">
          {/* Barra superior */}
          <View className="bg-black/40 px-4 py-3 flex-row justify-between items-center backdrop-blur-md">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center bg-black/30 px-3 py-1.5 rounded-full">
              <FontAwesome name="arrow-left" size={14} color="white" />
              <Text className="text-white text-xs ml-2 font-medium">Volver</Text>
            </TouchableOpacity>

            <Text className="text-white text-base font-bold tracking-wider">ANALIZAR PLANTA</Text>

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

          {/* Área central con retícula */}
          <View className="items-center justify-center flex-1 px-8">
            <View className="bg-black/60 px-4 py-2 rounded-full mb-6 border border-white/10">
              <Text className="text-white text-xs text-center">
                💡 Enfoca hojas apicales y brotes con buena iluminación
              </Text>
            </View>

            <View className="w-64 h-64 border-2 border-dashed border-[#43A047]/70 rounded-2xl relative items-center justify-center">
              <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#43A047] rounded-tl-lg" />
              <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#43A047] rounded-tr-lg" />
              <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#43A047] rounded-bl-lg" />
              <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#43A047] rounded-br-lg" />

              {flash !== 'off' && (
                <View className="absolute top-3 right-3 bg-black/60 px-2 py-0.5 rounded-md">
                  <Text className="text-xs text-[#F9A825] font-bold">
                    Flash: {flash.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Controles inferiores */}
          <View className="bg-black/75 pt-4 pb-8 px-6 rounded-t-3xl border-t border-white/10 items-center">
            {/* Selector de cultivo */}
            <TouchableOpacity
              onPress={() => setSelectorVisible(true)}
              className="bg-white/15 active:bg-white/25 rounded-full px-4 py-2 mb-6 flex-row items-center border border-white/20">
              <FontAwesome name="map-marker" size={13} color="#81C784" />
              <Text className="text-white text-xs font-semibold ml-2">
                {currentCultivo.nombre} ({currentCultivo.variedad})
              </Text>
              <FontAwesome name="chevron-down" size={11} color="#D1D5DB" className="ml-2.5" />
            </TouchableOpacity>

            {/* Fila de disparadores */}
            <View className="flex-row items-center justify-around w-full max-w-xs">
              <TouchableOpacity
                onPress={pickImageFromGallery}
                className="w-12 h-12 rounded-full bg-white/15 items-center justify-center border border-white/20 active:scale-90"
                accessibilityLabel="Abrir galería">
                <FontAwesome name="image" size={18} color="white" />
              </TouchableOpacity>

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

              <TouchableOpacity
                onPress={toggleFacing}
                className="w-12 h-12 rounded-full bg-white/15 items-center justify-center border border-white/20 active:scale-90"
                accessibilityLabel="Cambiar cámara">
                <FontAwesome name="refresh" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

      {/* MODAL: SELECCIONAR O CREAR PARCELA */}
      <Modal visible={selectorVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-white rounded-2xl p-5 max-h-[75%]">
            <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <Text className="text-base font-bold text-[#263238]">Selecciona tu Parcela</Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <FontAwesome name="times" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-60 mb-3">
              {cultivos.length === 0 ? (
                <View className="p-4 bg-gray-50 rounded-xl items-center mb-2">
                  <Text className="text-xs text-gray-500 text-center">
                    Aún no tienes parcelas registradas. Puedes escanear como "Muestra General" o registrar tu primer lote.
                  </Text>
                </View>
              ) : (
                cultivos.map((cultivo) => {
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
                })
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setModalNuevoLote(true)}
              className="py-2.5 bg-[#2E7D32] rounded-xl items-center flex-row justify-center active:scale-95">
              <FontAwesome name="plus" size={12} color="white" />
              <Text className="text-xs font-bold text-white ml-2">Registrar Nueva Parcela</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PEQUEÑO: REGISTRAR LOTE RÁPIDO */}
      <Modal visible={modalNuevoLote} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-white rounded-2xl p-5">
            <Text className="text-base font-bold text-[#263238] mb-3">
              Registrar Parcela para este Análisis
            </Text>

            <Text className="text-xs font-bold text-gray-700 mb-1">Nombre del Lote *</Text>
            <TextInput
              value={nuevoLoteNombre}
              onChangeText={setNuevoLoteNombre}
              placeholder="Ej: Lote El Trapiche"
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 mb-3"
            />

            <Text className="text-xs font-bold text-gray-700 mb-1">Variedad de Papa *</Text>
            <TextInput
              value={nuevoLoteVariedad}
              onChangeText={setNuevoLoteVariedad}
              placeholder="Ej: Pastusa Suprema, Capiro"
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 mb-4"
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setModalNuevoLote(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl items-center">
                <Text className="text-xs font-semibold text-gray-600">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCrearLoteRapido}
                className="flex-1 py-2.5 bg-[#2E7D32] rounded-xl items-center shadow-sm">
                <Text className="text-xs font-bold text-white">Guardar y Vincular</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
