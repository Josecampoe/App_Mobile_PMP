import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import RoleSelector from '../../components/RoleSelector';

export default function Inicio() {
  const router = useRouter();
  const {
    rolActivo,
    cultivos,
    analisisHistorial,
    perfilAgricultor,
    perfilTecnico,
    setSelectedCultivoId,
    addCultivo,
  } = useApp();

  const [modalNuevoLote, setModalNuevoLote] = useState(false);
  const [nombreLote, setNombreLote] = useState('');
  const [variedadLote, setVariedadLote] = useState('Papa Pastusa Suprema');
  const [hectareasLote, setHectareasLote] = useState('');
  const [ubicacionLote, setUbicacionLote] = useState('');

  // Saludo dinámico según la hora
  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // KPIs seguros
  const casosPendientes = (analisisHistorial || []).filter((a) => a?.estadoRevision === 'pendiente');
  const casosRevisados = (analisisHistorial || []).filter((a) => a?.estadoRevision === 'revisado');
  const alertasFitosanitarias = (analisisHistorial || []).filter(
    (a) => a?.estado === 'alerta' || (a?.diagnostico && a.diagnostico.includes('PMP'))
  ).length;

  const nombreUsuarioHeader =
    rolActivo === 'agricultor'
      ? (perfilAgricultor?.nombre || 'Agricultor').trim().split(' ')[0]
      : (perfilTecnico?.nombre || 'Técnico').trim().split(' ')[0];

  const handleCrearPrimerLote = () => {
    if (!nombreLote.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre de tu parcela o finca.');
      return;
    }
    const ha = parseFloat(hectareasLote.replace(',', '.'));
    if (isNaN(ha) || ha <= 0) {
      Alert.alert('Campo inválido', 'Ingresa un número válido de hectáreas.');
      return;
    }

    addCultivo({
      nombre: nombreLote.trim(),
      variedad: variedadLote,
      hectareas: Number(ha.toFixed(1)),
      ubicacion: ubicacionLote.trim() || perfilAgricultor?.ubicacion || 'Zona Rural',
      fechaSiembra: 'Reciente',
      estadoFitosanitario: 'optimo',
    });

    setNombreLote('');
    setHectareasLote('');
    setUbicacionLote('');
    setModalNuevoLote(false);
    Alert.alert('¡Parcela Registrada!', 'Tu lote ha sido agregado correctamente.');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO SUPERIOR */}
      <View className="bg-white px-5 pt-3 pb-3 border-b border-gray-100 shadow-sm shrink-0">
        <View className="flex-row justify-between items-center mb-2.5">
          <View className="flex-row items-center">
            <View
              className={`w-8 h-8 rounded-lg items-center justify-center mr-2 ${
                rolActivo === 'agricultor' ? 'bg-[#2E7D32]/10' : 'bg-[#1565C0]/10'
              }`}>
              <FontAwesome
                name={rolActivo === 'agricultor' ? 'leaf' : 'stethoscope'}
                size={16}
                color={rolActivo === 'agricultor' ? '#2E7D32' : '#1565C0'}
              />
            </View>
            <View>
              <Text
                className={`font-black text-lg tracking-tight ${
                  rolActivo === 'agricultor' ? 'text-[#2E7D32]' : 'text-[#1565C0]'
                }`}>
                PMP Smart
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/perfil')}
            className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full active:scale-95">
            <FontAwesome
              name="user-circle"
              size={16}
              color={rolActivo === 'agricultor' ? '#2E7D32' : '#1565C0'}
            />
            <Text className="text-xs font-bold text-gray-700 ml-1.5">{nombreUsuarioHeader}</Text>
          </TouchableOpacity>
        </View>

        {/* SELECTOR DE ROL RÁPIDO */}
        <RoleSelector />
      </View>

      {/* 2. CONTENIDO PRINCIPAL */}
      <ScrollView className="flex-1 px-4 pt-4 pb-20" showsVerticalScrollIndicator={false}>
        {/* ======================================================== */}
        {/* VISTA 1: MODO AGRICULTOR                                 */}
        {/* ======================================================== */}
        {rolActivo === 'agricultor' ? (
          <>
            <Text className="text-2xl font-bold text-[#263238] mb-0.5">
              {getSaludo()},{' '}
              {(perfilAgricultor?.nombre || 'Agricultor').trim().split(' ')[0]} 👋
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              Monitoreo fitosanitario de tus cultivos de papa en campo
            </Text>

            {/* Si no tiene cultivos registrados aún */}
            {(!cultivos || cultivos.length === 0) ? (
              <View className="bg-white rounded-2xl p-5 border-2 border-dashed border-[#2E7D32]/40 mb-5 shadow-sm">
                <View className="w-12 h-12 rounded-full bg-emerald-50 items-center justify-center mb-3">
                  <FontAwesome name="map-signs" size={20} color="#2E7D32" />
                </View>
                <Text className="text-base font-bold text-gray-800">
                  Comienza registrando tu primera parcela real
                </Text>
                <Text className="text-xs text-gray-600 mt-1 mb-4 leading-relaxed">
                  Ingresa los datos de tu finca (variedad sembrada, hectáreas y ubicación) para
                  comenzar a escanear plantas y solicitar revisión técnica a un agrónomo.
                </Text>
                <TouchableOpacity
                  onPress={() => setModalNuevoLote(true)}
                  className="bg-[#2E7D32] py-3 rounded-xl flex-row items-center justify-center shadow-sm active:scale-95">
                  <FontAwesome name="plus" size={13} color="white" />
                  <Text className="text-white text-xs font-bold ml-2">
                    Registrar Mi Primera Parcela
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* BOTÓN PRINCIPAL: ANALIZAR PLANTA */}
            <TouchableOpacity
              onPress={() => router.push('/camera')}
              className="w-full bg-[#2E7D32] rounded-2xl p-5 flex-col items-center justify-center shadow-md mb-4 active:scale-98">
              <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mb-2">
                <FontAwesome name="camera" size={28} color="white" />
              </View>
              <Text className="text-white text-lg font-black tracking-wider">ANALIZAR PLANTA</Text>
              <Text className="text-[#E8F5E9] text-xs text-center mt-0.5">
                Toma o sube una fotografía real para revisar signos de Punta Morada
              </Text>
            </TouchableOpacity>

            {/* ALERTA DE DICTAMEN DE AGRÓNOMO DISPONIBLE */}
            {casosRevisados.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/historial')}
                className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex-row items-center mb-4 shadow-sm">
                <View className="w-9 h-9 rounded-full bg-emerald-200 items-center justify-center mr-3 shrink-0">
                  <FontAwesome name="check-circle" size={18} color="#2E7D32" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#2E7D32]">
                    ¡Dictamen Técnico Disponible!
                  </Text>
                  <Text className="text-[11px] text-gray-600 mt-0.5">
                    Un agrónomo ha emitido recomendaciones oficiales para tus análisis.
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color="#2E7D32" />
              </TouchableOpacity>
            )}

            {/* KPIs DEL AGRICULTOR */}
            <View className="flex-row gap-2 mb-5">
              <View className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
                <Text className="text-lg font-black text-[#263238]">{cultivos.length}</Text>
                <Text className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Parcelas</Text>
              </View>
              <View className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
                <Text className="text-lg font-black text-[#2E7D32]">{analisisHistorial.length}</Text>
                <Text className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Escaneos</Text>
              </View>
              <View className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
                <Text className="text-lg font-black text-[#D97706]">{casosPendientes.length}</Text>
                <Text className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">En Revisión</Text>
              </View>
            </View>

            {/* SECCIÓN MIS CULTIVOS */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2.5">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  TUS PARCELAS ({cultivos.length})
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/cultivos')}>
                  <Text className="text-xs text-[#2E7D32] font-bold">Gestionar →</Text>
                </TouchableOpacity>
              </View>

              {cultivos.length === 0 ? (
                <Text className="text-xs text-gray-400 italic">No hay parcelas registradas.</Text>
              ) : (
                cultivos.slice(0, 3).map((cultivo) => (
                  <TouchableOpacity
                    key={cultivo.id}
                    onPress={() => {
                      setSelectedCultivoId(cultivo.id);
                      router.push({
                        pathname: '/camera',
                        params: { cultivoId: cultivo.id },
                      });
                    }}
                    className="bg-white rounded-2xl p-3.5 flex-row items-center justify-between border border-gray-100 shadow-sm mb-2.5 active:scale-[0.99]">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="bg-[#E8F5E9] w-10 h-10 rounded-xl items-center justify-center mr-3">
                        <FontAwesome name="leaf" size={16} color="#2E7D32" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-gray-800 text-sm">{cultivo.nombre}</Text>
                        <Text className="text-gray-500 text-xs mt-0.5">
                          {cultivo.variedad} · {cultivo.hectareas} Ha
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-[11px] text-[#2E7D32] font-semibold mr-1">Escanear</Text>
                      <FontAwesome name="chevron-right" size={11} color="#D1D5DB" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* SECCIÓN ÚLTIMOS ANÁLISIS */}
            {analisisHistorial.length > 0 && (
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-2.5">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    ÚLTIMOS ANÁLISIS REALIZADOS
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/historial')}>
                    <Text className="text-xs text-[#2E7D32] font-bold">Ver todos →</Text>
                  </TouchableOpacity>
                </View>

                {analisisHistorial.slice(0, 2).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push('/(tabs)/historial')}
                    className="bg-white rounded-2xl p-3 flex-row items-center border border-gray-100 shadow-sm mb-2.5">
                    <Image
                      source={{
                        uri: item.imageUri || 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a',
                      }}
                      style={{ width: 44, height: 44, borderRadius: 10 }}
                      resizeMode="cover"
                      className="bg-gray-200"
                    />
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`text-xs font-bold ${
                            item.estado === 'alerta' ? 'text-[#D97706]' : 'text-[#2E7D32]'
                          }`}>
                          {item.diagnostico || 'Diagnóstico'}
                        </Text>
                        {item.estadoRevision === 'revisado' ? (
                          <View className="bg-emerald-100 px-1.5 py-0.5 rounded">
                            <Text className="text-[9px] font-bold text-emerald-800">
                              ✓ Dictamen
                            </Text>
                          </View>
                        ) : item.estadoRevision === 'pendiente' ? (
                          <View className="bg-amber-100 px-1.5 py-0.5 rounded">
                            <Text className="text-[9px] font-bold text-amber-800">
                              ⏳ En revisión
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="text-[11px] text-gray-700 font-medium">
                        {item.cultivoNombre || 'Parcela'}
                      </Text>
                      <Text className="text-[10px] text-gray-400">{item.fecha || ''}</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={11} color="#D1D5DB" className="ml-2" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          /* ======================================================== */
          /* VISTA 2: MODO TÉCNICO AGRÓNOMO                           */
          /* ======================================================== */
          <>
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center mb-1">
                <FontAwesome name="stethoscope" size={16} color="#1565C0" className="mr-2" />
                <Text className="text-sm font-bold text-[#1565C0]">
                  Panel de Asistencia Técnica Agronómica
                </Text>
              </View>
              <Text className="text-xs text-gray-700">
                Agrónomo:{' '}
                <Text className="font-bold">
                  {perfilTecnico?.nombre || 'Ing. Agrónomo Fitosanitario'}
                </Text>{' '}
                ({perfilTecnico?.registroProfesional || 'ICA-COL'})
              </Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">
                Supervisa y valida las alertas fitosanitarias de Punta Morada reportadas por los productores.
              </Text>
            </View>

            {/* KPIs DEL TÉCNICO */}
            <View className="flex-row gap-2 mb-5">
              <View className="flex-1 bg-white p-3 rounded-2xl border border-amber-200 shadow-sm items-center">
                <Text className="text-xl font-black text-[#D97706]">
                  {casosPendientes.length}
                </Text>
                <Text className="text-[10px] uppercase font-bold text-gray-500 mt-0.5 text-center">
                  Por Revisar
                </Text>
              </View>
              <View className="flex-1 bg-white p-3 rounded-2xl border border-emerald-200 shadow-sm items-center">
                <Text className="text-xl font-black text-[#2E7D32]">
                  {casosRevisados.length}
                </Text>
                <Text className="text-[10px] uppercase font-bold text-gray-500 mt-0.5 text-center">
                  Auditados
                </Text>
              </View>
              <View className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
                <Text className="text-xl font-black text-[#1565C0]">{cultivos.length}</Text>
                <Text className="text-[10px] uppercase font-bold text-gray-500 mt-0.5 text-center">
                  Parcelas
                </Text>
              </View>
            </View>

            {/* BANDEJA PRIORITARIA: CASOS PENDIENTES */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2.5">
                <Text className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  ⚠️ CASOS QUE REQUIEREN TU REVISIÓN ({casosPendientes.length})
                </Text>
              </View>

              {casosPendientes.length === 0 ? (
                <View className="bg-white rounded-2xl p-6 items-center border border-gray-100 shadow-sm">
                  <FontAwesome name="check-circle" size={28} color="#2E7D32" />
                  <Text className="text-sm font-bold text-gray-800 mt-2">
                    ¡Al día! No hay revisiones pendientes
                  </Text>
                  <Text className="text-xs text-gray-500 text-center mt-1">
                    Cuando un agricultor solicite revisión técnica de un análisis de campo, aparecerá aquí para tu evaluación.
                  </Text>
                </View>
              ) : (
                casosPendientes.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push('/(tabs)/historial')}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-2.5 shadow-sm active:scale-[0.99]">
                    <View className="flex-row items-center">
                      <Image
                        source={{
                          uri: item.imageUri || 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a',
                        }}
                        style={{ width: 52, height: 52, borderRadius: 10 }}
                        resizeMode="cover"
                        className="bg-gray-200"
                      />
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs font-bold text-[#D97706]">
                            {item.diagnostico || 'Posible PMP'}
                          </Text>
                          <Text className="text-[10px] text-gray-500">{item.confianza || 90}% IA</Text>
                        </View>
                        <Text className="text-xs text-[#263238] font-bold mt-0.5">
                          📍 {item.cultivoNombre || 'Parcela'}
                        </Text>
                        <Text className="text-[10px] text-gray-500 mt-0.5">{item.fecha || ''}</Text>
                      </View>
                    </View>
                    <View className="mt-2.5 pt-2 border-t border-amber-200 flex-row justify-between items-center">
                      <Text className="text-[11px] text-amber-800 font-semibold">
                        Toca para examinar foto y emitir dictamen
                      </Text>
                      <FontAwesome name="arrow-right" size={11} color="#D97706" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* BOTÓN IR A BANDEJA COMPLETA */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/historial')}
              className="bg-[#1565C0] py-3.5 rounded-xl flex-row items-center justify-center shadow-md active:scale-95 mb-4">
              <FontAwesome name="clipboard" size={14} color="white" />
              <Text className="text-white text-xs font-bold ml-2">
                Ver Historial Completo y Dictámenes
              </Text>
            </TouchableOpacity>

            {/* GUÍA TÉCNICA RÁPIDA PARA EL AGÓNOMO */}
            <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
              <Text className="text-xs font-bold text-gray-700 uppercase mb-2">
                📋 Protocolo de Validación ICA para PMP
              </Text>
              <Text className="text-xs text-gray-600 leading-relaxed mb-2">
                • <Text className="font-semibold text-gray-800">Diferenciación:</Text> Descartar deficiencia de fósforo (púrpura en hojas basales viejas vs. PMP en brotes jóvenes apicales erguidos).
              </Text>
              <Text className="text-xs text-gray-600 leading-relaxed">
                • <Text className="font-semibold text-gray-800">Vector:</Text> Recomendar al productor inspección minuciosa de ninfas y huevos del psílido (*Bactericera cockerelli*) en el envés de foliolos medios.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* MODAL REGISTRAR PARCELA RÁPIDA (PARA AGRICULTOR) */}
      <Modal visible={modalNuevoLote} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <Text className="text-base font-bold text-[#263238]">Registrar Parcela de Papa</Text>
              <TouchableOpacity onPress={() => setModalNuevoLote(false)}>
                <FontAwesome name="times" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-3">
              <Text className="text-xs font-bold text-gray-700 mb-1">Nombre de la Parcela *</Text>
              <TextInput
                value={nombreLote}
                onChangeText={setNombreLote}
                placeholder="Ej: Lote El Mirador / Finca San Isidro"
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
              />
            </View>

            <View className="mb-3">
              <Text className="text-xs font-bold text-gray-700 mb-1">Variedad de Papa *</Text>
              <TextInput
                value={variedadLote}
                onChangeText={setVariedadLote}
                placeholder="Ej: Pastusa Suprema, Capiro, Criolla"
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
              />
            </View>

            <View className="flex-row gap-2 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-700 mb-1">Hectáreas (Ha) *</Text>
                <TextInput
                  value={hectareasLote}
                  onChangeText={setHectareasLote}
                  placeholder="Ej: 2.0"
                  keyboardType="decimal-pad"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-700 mb-1">Municipio / Vereda</Text>
                <TextInput
                  value={ubicacionLote}
                  onChangeText={setUbicacionLote}
                  placeholder="Ej: Pasto, Nariño"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setModalNuevoLote(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 items-center">
                <Text className="text-gray-600 font-bold text-xs">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCrearPrimerLote}
                className="flex-1 py-3 rounded-xl bg-[#2E7D32] items-center shadow-md">
                <Text className="text-white font-bold text-xs">Guardar Parcela</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
