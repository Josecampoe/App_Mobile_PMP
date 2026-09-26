import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO */}
      <View className="bg-white px-5 pt-3 pb-3 border-b border-gray-100 shadow-sm shrink-0">
        <View className="flex-row justify-between items-center mb-2.5">
          <View>
            <Text className="text-xl font-bold text-[#263238]">
              {rolActivo === 'agricultor' ? 'Mis Parcelas y Fincas' : 'Lotes en Vigilancia'}
            </Text>
            <Text className="text-xs text-gray-500">
              {rolActivo === 'agricultor'
                ? 'Control fitosanitario de tus cultivos'
                : 'Inspección de predios agrícolas registrados'}
            </Text>
          </View>

          {rolActivo === 'agricultor' && (
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="bg-[#2E7D32] flex-row items-center px-3.5 py-2 rounded-xl active:scale-95 shadow-sm">
              <FontAwesome name="plus" size={13} color="white" />
              <Text className="text-white text-xs font-bold ml-1.5">Nuevo Lote</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>

      <ScrollView className="flex-1 px-4 pt-4 pb-20" showsVerticalScrollIndicator={false}>
        {/* 2. RESUMEN DE INDICADORES (KPIs) */}
        <View className="flex-row gap-2.5 mb-5">
          <View className="flex-1 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-[11px] font-semibold text-gray-400 uppercase">Superficie</Text>
              <FontAwesome name="globe" size={13} color="#2E7D32" />
            </View>
            <Text className="text-xl font-extrabold text-[#263238]">
              {totalHectareas.toFixed(1)} <Text className="text-xs font-medium text-gray-500">Ha</Text>
            </Text>
            <Text className="text-[10px] text-gray-400 mt-0.5">{cultivos.length} lotes totales</Text>
          </View>

          <View className="flex-1 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-[11px] font-semibold text-gray-400 uppercase">Alertas</Text>
              <FontAwesome name="exclamation-circle" size={13} color="#DC2626" />
            </View>
            <Text className="text-xl font-extrabold text-[#DC2626]">{cultivosEnAlerta}</Text>
            <Text className="text-[10px] text-gray-400 mt-0.5">En vigilancia</Text>
          </View>

          <View className="flex-1 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-[11px] font-semibold text-gray-400 uppercase">Sanos</Text>
              <FontAwesome name="check-circle" size={13} color="#16A34A" />
            </View>
            <Text className="text-xl font-extrabold text-[#16A34A]">{cultivosOptimos}</Text>
            <Text className="text-[10px] text-gray-400 mt-0.5">Estado óptimo</Text>
          </View>
        </View>

        {/* 3. LISTADO DE CULTIVOS */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            PARCELAS REGISTRADAS ({cultivos.length})
          </Text>
          {rolActivo === 'agricultor' && cultivos.length > 0 && (
            <Text className="text-xs text-[#2E7D32] font-semibold">Toca para escanear</Text>
          )}
        </View>

        {cultivos.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center justify-center border-2 border-dashed border-gray-200 mt-2">
            <View className="w-16 h-16 rounded-full bg-emerald-50 items-center justify-center mb-3">
              <FontAwesome name="leaf" size={28} color="#2E7D32" />
            </View>
            <Text className="text-base font-bold text-gray-800 text-center">
              {rolActivo === 'agricultor'
                ? 'No has registrado parcelas aún'
                : 'No hay parcelas registradas para supervisar'}
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1 mb-4 leading-relaxed">
              {rolActivo === 'agricultor'
                ? 'Ingresa los datos reales de tus lotes de papa (variedad, ubicación y hectáreas) para vincular los análisis con la cámara.'
                : 'Pide a los agricultores que registren sus fincas o utiliza el botón para añadir un lote de demostración.'}
            </Text>
            {rolActivo === 'agricultor' && (
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-[#2E7D32] px-5 py-2.5 rounded-xl shadow-sm active:scale-95">
                <Text className="text-white text-xs font-bold">+ Registrar Mi Parcela</Text>
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
                className="bg-white rounded-2xl p-4 mb-3.5 border border-gray-100 shadow-sm">
                <View className="flex-row items-start justify-between mb-2.5">
                  <View className="flex-1 mr-2">
                    <Text className="text-base font-bold text-[#263238]">{cultivo.nombre}</Text>
                    <View className="flex-row items-center mt-0.5">
                      <FontAwesome name="map-marker" size={11} color="#6B7280" />
                      <Text className="text-xs text-gray-500 ml-1.5">{cultivo.ubicacion}</Text>
                    </View>
                  </View>

                  <View className={`px-2.5 py-1 rounded-full border flex-row items-center ${badge.bg}`}>
                    <View
                      style={{ backgroundColor: badge.dotColor }}
                      className="w-2 h-2 rounded-full mr-1.5"
                    />
                    <Text className={`text-[11px] font-bold ${badge.textColor}`}>{badge.text}</Text>
                  </View>
                </View>

                {/* Detalles de la parcela */}
                <View className="bg-[#FAF9F5] rounded-xl p-3 mb-3 flex-row justify-between">
                  <View>
                    <Text className="text-[10px] text-gray-400 uppercase font-semibold">Variedad</Text>
                    <Text className="text-xs font-bold text-gray-700 mt-0.5">{cultivo.variedad}</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-[10px] text-gray-400 uppercase font-semibold">Área</Text>
                    <Text className="text-xs font-bold text-gray-700 mt-0.5">{cultivo.hectareas} Ha</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-gray-400 uppercase font-semibold">Análisis</Text>
                    <Text className="text-xs font-bold text-gray-700 mt-0.5">
                      {analisisDeEsteLote.length} {analisisDeEsteLote.length === 1 ? 'escaneo' : 'escaneos'}
                    </Text>
                  </View>
                </View>

                {/* Pie de tarjeta */}
                <View className="flex-row items-center justify-between pt-1 border-t border-gray-100">
                  <Text className="text-[11px] text-gray-400">
                    Siembra: <Text className="text-gray-600 font-medium">{cultivo.fechaSiembra}</Text>
                  </Text>

                  <View className="flex-row items-center gap-2">
                    {rolActivo === 'agricultor' && (
                      <>
                        <TouchableOpacity
                          onPress={() => handleEliminarCultivo(cultivo)}
                          className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                          <FontAwesome name="trash-o" size={14} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => iniciarEscaneoCultivo(cultivo.id)}
                          className="bg-[#2E7D32] flex-row items-center px-3.5 py-2 rounded-xl active:scale-95 shadow-sm">
                          <FontAwesome name="camera" size={12} color="white" />
                          <Text className="text-white text-xs font-bold ml-1.5">Analizar</Text>
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
                <Text className="text-xs font-bold text-gray-700 mb-1.5">Ubicación / Municipio</Text>
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
