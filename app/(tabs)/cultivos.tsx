import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useApp, Cultivo } from '../../context/AppContext';


const VARIEDADES_PAPA = [
  'Papa Pastusa Suprema',
  'Papa Diacol Capiro',
  'Papa Criolla Colombia',
  'Papa Única',
  'Papa Betina',
  'Papa Superior',
];

export default function CultivosScreen() {
  const router = useRouter();
  const {
    rolActivo,
    cultivos,
    addCultivo,
    deleteCultivo,
    setSelectedCultivoId,
    analisisHistorial,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [variedad, setVariedad] = useState(VARIEDADES_PAPA[0]);
  const [hectareas, setHectareas] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [fechaSiembra, setFechaSiembra] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const obtenerUbicacionGPS = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación del dispositivo.');
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const ubicacionFormat = `${address.city || address.subregion || ''}, ${address.region || address.country || ''}`;
        setUbicacion(ubicacionFormat.replace(/^, |, $/g, '').trim() || `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
      } else {
        setUbicacion(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    } finally {
      setIsLocating(false);
    }
  };

  // Estadísticas calculadas
  const totalHectareas = cultivos.reduce((acc, c) => acc + (Number(c.hectareas) || 0), 0);
  const cultivosEnAlerta = cultivos.filter((c) => c.estadoFitosanitario === 'alerta').length;
  const cultivosOptimos = cultivos.filter((c) => c.estadoFitosanitario === 'optimo').length;

  const handleCrearCultivo = () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre de la finca o parcela.');
      return;
    }
    const haNum = parseFloat(hectareas.replace(',', '.'));
    if (isNaN(haNum) || haNum <= 0) {
      Alert.alert('Campo inválido', 'Ingresa un número válido de hectáreas.');
      return;
    }

    addCultivo({
      nombre: nombre.trim(),
      variedad,
      hectareas: Number(haNum.toFixed(1)),
      ubicacion: ubicacion.trim() || 'Zona Rural',
      fechaSiembra: fechaSiembra.trim() || 'Reciente',
      estadoFitosanitario: 'optimo',
    });

    setNombre('');
    setVariedad(VARIEDADES_PAPA[0]);
    setHectareas('');
    setUbicacion('');
    setFechaSiembra('');
    setModalVisible(false);
    Alert.alert('¡Éxito!', 'Parcela registrada correctamente.');
  };

  const handleEliminarCultivo = (cultivo: Cultivo) => {
    Alert.alert(
      'Eliminar Parcela',
      `¿Estás seguro de eliminar "${cultivo.nombre}"? Los análisis previos continuarán en tu historial.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteCultivo(cultivo.id),
        },
      ]
    );
  };

  const iniciarEscaneoCultivo = (cultivoId: string) => {
    setSelectedCultivoId(cultivoId);
    router.push({
      pathname: '/camera',
      params: { cultivoId },
    });
  };

  const getBadgeEstado = (estado: Cultivo['estadoFitosanitario']) => {
    switch (estado) {
      case 'alerta':
        return {
          text: 'Alerta PMP',
          bg: 'bg-red-50 border-red-200',
          textColor: 'text-red-700',
          dotColor: '#DC2626',
        };
      case 'observacion':
        return {
          text: 'En observación',
          bg: 'bg-amber-50 border-amber-200',
          textColor: 'text-amber-800',
          dotColor: '#D97706',
        };
      case 'optimo':
      default:
        return {
          text: 'Óptimo / Sano',
          bg: 'bg-emerald-50 border-emerald-200',
          textColor: 'text-emerald-800',
          dotColor: '#16A34A',
        };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F7F6]">
      {/* 1. ENCABEZADO PREMIUM */}
      <View className="bg-[#1B4332] px-6 pt-5 pb-6 rounded-b-[32px] shadow-lg shrink-0">
        <View className="flex-row justify-between items-center mb-1">
          <View>
            <Text className="text-2xl font-black text-white tracking-tight">
              {rolActivo === 'agricultor' ? 'Mis Parcelas' : 'Vigilancia'}
            </Text>
            <Text className="text-emerald-100 text-xs font-medium mt-1">
              {rolActivo === 'agricultor'
                ? 'Control fitosanitario de tus cultivos'
                : 'Inspección de predios agrícolas registrados'}
            </Text>
          </View>

          {rolActivo === 'agricultor' && (
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="bg-emerald-400 flex-row items-center px-4 py-2.5 rounded-2xl active:scale-95 shadow-sm">
              <FontAwesome name="plus" size={14} color="#064E3B" />
              <Text className="text-[#064E3B] text-xs font-bold ml-2">Nuevo Lote</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-5 pb-20" showsVerticalScrollIndicator={false}>
        {/* 2. RESUMEN DE INDICADORES (KPIs) PREMIUM */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white p-4 rounded-3xl border border-gray-100/50 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Superficie</Text>
              <View className="bg-emerald-50 p-1.5 rounded-full"><FontAwesome name="globe" size={12} color="#10B981" /></View>
            </View>
            <Text className="text-2xl font-black text-[#1E293B]">
              {totalHectareas.toFixed(1)} <Text className="text-xs font-semibold text-gray-400">Ha</Text>
            </Text>
            <Text className="text-[10px] font-medium text-emerald-600 mt-1 bg-emerald-50 self-start px-2 py-0.5 rounded-full">{cultivos.length} lotes totales</Text>
          </View>

          <View className="flex-1 bg-white p-4 rounded-3xl border border-gray-100/50 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alertas</Text>
              <View className="bg-rose-50 p-1.5 rounded-full"><FontAwesome name="exclamation-circle" size={12} color="#F43F5E" /></View>
            </View>
            <Text className="text-2xl font-black text-[#1E293B]">{cultivosEnAlerta}</Text>
            <Text className="text-[10px] font-medium text-rose-600 mt-1 bg-rose-50 self-start px-2 py-0.5 rounded-full">En vigilancia</Text>
          </View>

          <View className="flex-1 bg-white p-4 rounded-3xl border border-gray-100/50 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sanos</Text>
              <View className="bg-teal-50 p-1.5 rounded-full"><FontAwesome name="check-circle" size={12} color="#14B8A6" /></View>
            </View>
            <Text className="text-2xl font-black text-[#1E293B]">{cultivosOptimos}</Text>
            <Text className="text-[10px] font-medium text-teal-600 mt-1 bg-teal-50 self-start px-2 py-0.5 rounded-full">Estado óptimo</Text>
          </View>
        </View>

        {/* 3. LISTADO DE CULTIVOS */}
        <View className="flex-row justify-between items-center mb-4 px-1">
          <Text className="text-xs font-black text-slate-800 uppercase tracking-widest">
            PARCELAS REGISTRADAS ({cultivos.length})
          </Text>
          {rolActivo === 'agricultor' && cultivos.length > 0 && (
            <Text className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Toca para escanear</Text>
          )}
        </View>

        {cultivos.length === 0 ? (
          <View className="bg-white rounded-[32px] p-8 items-center justify-center border border-gray-100 shadow-sm mt-2">
            <View className="w-20 h-20 rounded-full bg-emerald-50 items-center justify-center mb-4 border-4 border-emerald-100/50">
              <FontAwesome name="leaf" size={32} color="#10B981" />
            </View>
            <Text className="text-lg font-black text-slate-800 text-center mb-2">
              {rolActivo === 'agricultor'
                ? 'Empieza tu cultivo digital'
                : 'Sin lotes en vigilancia'}
            </Text>
            <Text className="text-xs text-slate-500 text-center mb-6 leading-relaxed px-2">
              {rolActivo === 'agricultor'
                ? 'Añade tu primera parcela para empezar a llevar el control fitosanitario con la cámara de IA.'
                : 'Pide a los agricultores que registren sus fincas o utiliza el botón superior para añadir un lote de demostración.'}
            </Text>
            {rolActivo === 'agricultor' && (
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-[#1B4332] px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-95 flex-row items-center">
                <FontAwesome name="plus-circle" size={16} color="#A7F3D0" />
                <Text className="text-[#A7F3D0] text-sm font-bold ml-2">Registrar Parcela</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          cultivos.map((cultivo) => {
            const badge = getBadgeEstado(cultivo.estadoFitosanitario);
            const analisisDeEsteLote = analisisHistorial.filter(
              (a) => a.cultivoId === cultivo.id || a.cultivoNombre === cultivo.nombre
            );
            return (
              <View
                key={cultivo.id}
                className="bg-white rounded-3xl p-5 mb-4 border border-slate-100 shadow-sm">
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-black text-slate-800 mb-1">{cultivo.nombre}</Text>
                    <View className="flex-row items-center bg-slate-50 self-start px-2.5 py-1 rounded-lg">
                      <FontAwesome name="map-marker" size={11} color="#64748B" />
                      <Text className="text-[11px] font-medium text-slate-500 ml-1.5">{cultivo.ubicacion}</Text>
                    </View>
                  </View>

                  <View className={`px-3 py-1.5 rounded-xl border flex-row items-center ${badge.bg}`}>
                    <View
                      style={{ backgroundColor: badge.dotColor }}
                      className="w-2 h-2 rounded-full mr-2"
                    />
                    <Text className={`text-[10px] font-black uppercase tracking-wider ${badge.textColor}`}>{badge.text}</Text>
                  </View>
                </View>

                {/* Detalles de la parcela PREMIUM */}
                <View className="bg-slate-50/50 rounded-2xl p-4 mb-4 flex-row justify-between border border-slate-100">
                  <View>
                    <Text className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Variedad</Text>
                    <Text className="text-sm font-bold text-slate-800">{cultivo.variedad}</Text>
                  </View>
                  <View className="items-center border-l border-slate-200 pl-4">
                    <Text className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Área</Text>
                    <Text className="text-sm font-bold text-slate-800">{cultivo.hectareas} Ha</Text>
                  </View>
                  <View className="items-end border-l border-slate-200 pl-4">
                    <Text className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Análisis</Text>
                    <Text className="text-sm font-bold text-slate-800">
                      {analisisDeEsteLote.length} {analisisDeEsteLote.length === 1 ? 'vez' : 'veces'}
                    </Text>
                  </View>
                </View>

                {/* Pie de tarjeta & Acciones */}
                <View className="flex-row items-center justify-between pt-1">
                  <Text className="text-[11px] font-medium text-slate-400">
                    Siembra: <Text className="text-slate-700 font-bold">{cultivo.fechaSiembra}</Text>
                  </Text>

                  <View className="flex-row items-center gap-2.5">
                    {rolActivo === 'agricultor' && (
                      <>
                        <TouchableOpacity
                          onPress={() => handleEliminarCultivo(cultivo)}
                          className="w-10 h-10 rounded-xl bg-rose-50 items-center justify-center border border-rose-100 active:scale-95">
                          <FontAwesome name="trash-o" size={16} color="#F43F5E" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => iniciarEscaneoCultivo(cultivo.id)}
                          className="bg-emerald-500 flex-row items-center px-4 py-2.5 rounded-xl active:scale-95 shadow-md shadow-emerald-600/20">
                          <FontAwesome name="camera" size={14} color="white" />
                          <Text className="text-white text-xs font-bold ml-2 tracking-wide">Analizar Lote</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL: REGISTRAR NUEVA PARCELA */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <View>
                <Text className="text-lg font-bold text-[#263238]">Registrar Nueva Parcela</Text>
                <Text className="text-xs text-gray-500">Datos reales de tu cultivo de papa</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                <FontAwesome name="times" size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-gray-700 mb-1.5">Nombre de la Finca / Lote *</Text>
                <TextInput
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Ej: Lote El Trébol / Finca San José"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800"
                />
              </View>

              <View className="mb-3.5">
                <Text className="text-xs font-bold text-gray-700 mb-1.5">Variedad de Papa *</Text>
                <View className="flex-row flex-wrap gap-2">
                  {VARIEDADES_PAPA.map((v) => {
                    const isSelected = variedad === v;
                    return (
                      <TouchableOpacity
                        key={v}
                        onPress={() => setVariedad(v)}
                        className={`px-3 py-1.5 rounded-xl border ${
                          isSelected
                            ? 'bg-[#2E7D32] border-[#2E7D32]'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                        <Text
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-white' : 'text-gray-700'
                          }`}>
                          {v}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="flex-row gap-3 mb-3.5">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-700 mb-1.5">Hectáreas (Ha) *</Text>
                  <TextInput
                    value={hectareas}
                    onChangeText={setHectareas}
                    placeholder="Ej: 1.5"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-700 mb-1.5">Fecha de Siembra</Text>
                  <TextInput
                    value={fechaSiembra}
                    onChangeText={setFechaSiembra}
                    placeholder="Ej: 15 Jul 2026"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800"
                  />
                </View>
              </View>

              <View className="mb-4">
                <View className="flex-row justify-between items-end mb-1.5">
                  <Text className="text-xs font-bold text-gray-700">Ubicación / Municipio *</Text>
                  <TouchableOpacity onPress={obtenerUbicacionGPS} disabled={isLocating} className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-md">
                    {isLocating ? <ActivityIndicator size="small" color="#2E7D32" /> : <FontAwesome name="map-marker" size={12} color="#2E7D32" />}
                    <Text className="text-[10px] font-bold text-[#2E7D32] ml-1 uppercase tracking-wider">{isLocating ? 'Buscando...' : 'Usar mi GPS'}</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={ubicacion}
                  onChangeText={setUbicacion}
                  placeholder="Ej: Túquerres, Nariño (Vereda El Espino)"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800"
                />
              </View>
            </ScrollView>

            <View className="flex-row gap-3 pt-2 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 items-center">
                <Text className="text-gray-600 font-bold text-sm">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCrearCultivo}
                className="flex-1 py-3 rounded-xl bg-[#2E7D32] items-center shadow-md">
                <Text className="text-white font-bold text-sm">Guardar Parcela</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
