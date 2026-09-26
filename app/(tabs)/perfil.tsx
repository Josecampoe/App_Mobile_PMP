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
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../lib/api';
import RoleSelector from '../../components/RoleSelector';

export default function PerfilScreen() {
  const router = useRouter();
  const {
    rolActivo,
    perfilAgricultor,
    perfilTecnico,
    updatePerfilAgricultor,
    updatePerfilTecnico,
    cultivos,
    analisisHistorial,
    limpiarTodosLosDatos,
    cargarDatosDemo,
  } = useApp();

  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar tu sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await authApi.logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  // Estados de edición Agricultor con fallbacks seguros
  const [modalEditAgr, setModalEditAgr] = useState(false);
  const [nombreAgr, setNombreAgr] = useState(perfilAgricultor?.nombre || '');
  const [fincaAgr, setFincaAgr] = useState(perfilAgricultor?.fincaPrincipal || '');
  const [ubicacionAgr, setUbicacionAgr] = useState(perfilAgricultor?.ubicacion || '');
  const [telefonoAgr, setTelefonoAgr] = useState(perfilAgricultor?.telefono || '');
  const [emailAgr, setEmailAgr] = useState(perfilAgricultor?.email || '');

  // Estados de edición Técnico con fallbacks seguros
  const [modalEditTec, setModalEditTec] = useState(false);
  const [nombreTec, setNombreTec] = useState(perfilTecnico?.nombre || '');
  const [regTec, setRegTec] = useState(perfilTecnico?.registroProfesional || '');
  const [espTec, setEspTec] = useState(perfilTecnico?.especialidad || '');
  const [entidadTec, setEntidadTec] = useState(perfilTecnico?.entidad || '');
  const [telefonoTec, setTelefonoTec] = useState(perfilTecnico?.telefono || '');
  const [emailTec, setEmailTec] = useState(perfilTecnico?.email || '');

  // Guía colapsable
  const [seccionGuiaAbierta, setSeccionGuiaAbierta] = useState<string | null>('que-es');

  const handleGuardarPerfilAgr = () => {
    if (!nombreAgr.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu nombre.');
      return;
    }
    updatePerfilAgricultor({
      nombre: nombreAgr.trim(),
      fincaPrincipal: fincaAgr.trim() || 'Finca Principal',
      ubicacion: ubicacionAgr.trim() || 'Colombia',
      telefono: telefonoAgr.trim(),
      email: emailAgr.trim(),
    });
    setModalEditAgr(false);
    Alert.alert('Perfil actualizado', 'Datos de agricultor guardados correctamente.');
  };

  const handleGuardarPerfilTec = () => {
    if (!nombreTec.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu nombre.');
      return;
    }
    updatePerfilTecnico({
      nombre: nombreTec.trim(),
      registroProfesional: regTec.trim() || 'ICA-REG',
      especialidad: espTec.trim() || 'Sanidad Vegetal',
      entidad: entidadTec.trim() || 'Asistencia Técnica',
      telefono: telefonoTec.trim(),
      email: emailTec.trim(),
    });
    setModalEditTec(false);
    Alert.alert('Perfil actualizado', 'Datos de técnico agrónomo guardados correctamente.');
  };

  const handleLimpiarDatos = () => {
    Alert.alert(
      'Restablecer Datos Locales',
      '¿Deseas vaciar todas las parcelas y registros de escaneos para comenzar desde cero con datos reales?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer Todo',
          style: 'destructive',
          onPress: () => {
            limpiarTodosLosDatos();
            Alert.alert('Datos Restablecidos', 'Se ha limpiado la base de datos local.');
          },
        },
      ]
    );
  };

  const handleCargarDemo = () => {
    Alert.alert(
      'Cargar Datos de Demostración',
      '¿Deseas cargar parcelas y análisis de prueba para evaluar el flujo de agricultor y técnico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cargar Datos',
          onPress: () => {
            cargarDatosDemo();
            Alert.alert('Datos cargados', 'Se han cargado casos de prueba en tu historial.');
          },
        },
      ]
    );
  };

  const toggleSeccion = (seccion: string) => {
    setSeccionGuiaAbierta(seccionGuiaAbierta === seccion ? null : seccion);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO */}
      <View className="bg-white px-5 pt-3 pb-3 border-b border-gray-100 shadow-sm shrink-0">
        <View className="flex-row justify-between items-center mb-2.5">
          <View>
            <Text className="text-xl font-bold text-[#263238]">Perfil de Usuario</Text>
            <Text className="text-xs text-gray-500">
              {rolActivo === 'agricultor' ? 'Modo Productor Agrícola' : 'Modo Técnico Agrónomo'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (rolActivo === 'agricultor') {
                setNombreAgr(perfilAgricultor?.nombre || '');
                setFincaAgr(perfilAgricultor?.fincaPrincipal || '');
                setUbicacionAgr(perfilAgricultor?.ubicacion || '');
                setTelefonoAgr(perfilAgricultor?.telefono || '');
                setEmailAgr(perfilAgricultor?.email || '');
                setModalEditAgr(true);
              } else {
                setNombreTec(perfilTecnico?.nombre || '');
                setRegTec(perfilTecnico?.registroProfesional || '');
                setEspTec(perfilTecnico?.especialidad || '');
                setEntidadTec(perfilTecnico?.entidad || '');
                setTelefonoTec(perfilTecnico?.telefono || '');
                setEmailTec(perfilTecnico?.email || '');
                setModalEditTec(true);
              }
            }}
            className="bg-gray-100 p-2 rounded-xl active:scale-95">
            <FontAwesome
              name="pencil"
              size={15}
              color={rolActivo === 'agricultor' ? '#2E7D32' : '#1565C0'}
            />
          </TouchableOpacity>
        </View>

        {/* SELECTOR DE ROL */}
        <RoleSelector />
      </View>

      <ScrollView className="flex-1 px-4 pt-4 pb-20" showsVerticalScrollIndicator={false}>
        {/* 2. TARJETA DE PERFIL SEGÚN ROL */}
        {rolActivo === 'agricultor' ? (
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-16 h-16 rounded-full bg-[#2E7D32]/10 items-center justify-center border-2 border-[#2E7D32]/30 mr-3.5">
                <Text className="text-2xl">👨‍🌾</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-base font-bold text-[#263238]">
                    {perfilAgricultor?.nombre || 'Productor de Papa'}
                  </Text>
                </View>
                <Text className="text-xs text-emerald-800 font-semibold mt-0.5">
                  Productor Agrícola
                </Text>
                <Text className="text-xs text-gray-500 font-medium">
                  📍 {perfilAgricultor?.fincaPrincipal || 'Finca'} ·{' '}
                  {perfilAgricultor?.ubicacion || 'Colombia'}
                </Text>
              </View>
            </View>

            <View className="bg-gray-50 rounded-xl p-3 border border-gray-100 gap-1.5">
              <View className="flex-row items-center">
                <FontAwesome name="phone" size={12} color="#6B7280" className="w-4" />
                <Text className="text-xs text-gray-600 ml-2 font-medium">
                  {perfilAgricultor?.telefono || 'Teléfono no registrado'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <FontAwesome name="envelope-o" size={12} color="#6B7280" className="w-4" />
                <Text className="text-xs text-gray-600 ml-2 font-medium">
                  {perfilAgricultor?.email || 'Correo no registrado'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-blue-200 mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-16 h-16 rounded-full bg-[#1565C0]/10 items-center justify-center border-2 border-[#1565C0]/30 mr-3.5">
                <Text className="text-2xl">🔬</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-[#263238]">
                  {perfilTecnico?.nombre || 'Ing. Agrónomo Fitosanitario'}
                </Text>
                <Text className="text-xs text-[#1565C0] font-bold mt-0.5">
                  Reg: {perfilTecnico?.registroProfesional || 'ICA-REG'}
                </Text>
                <Text className="text-xs text-gray-600 font-medium">
                  {perfilTecnico?.especialidad || 'Sanidad Vegetal'} ·{' '}
                  {perfilTecnico?.entidad || 'Asistencia Técnica'}
                </Text>
              </View>
            </View>

            <View className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 gap-1.5">
              <View className="flex-row items-center">
                <FontAwesome name="id-badge" size={12} color="#1565C0" className="w-4" />
                <Text className="text-xs text-gray-700 ml-2 font-medium">
                  Registro ICA / Profesional:{' '}
                  {perfilTecnico?.registroProfesional || 'ICA-COL'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <FontAwesome name="envelope-o" size={12} color="#1565C0" className="w-4" />
                <Text className="text-xs text-gray-700 ml-2 font-medium">
                  {perfilTecnico?.email || 'Contacto institucional activo'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 3. RESUMEN ESTADÍSTICO */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-row justify-around mb-4">
          <View className="items-center">
            <Text className="text-xl font-black text-[#2E7D32]">{(cultivos || []).length}</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Parcelas</Text>
          </View>
          <View className="w-[1px] bg-gray-100" />
          <View className="items-center">
            <Text className="text-xl font-black text-[#263238]">
              {(analisisHistorial || []).length}
            </Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Monitoreos</Text>
          </View>
          <View className="w-[1px] bg-gray-100" />
          <View className="items-center">
            <Text className="text-xl font-black text-[#1565C0]">
              {(analisisHistorial || []).filter((a) => a?.estadoRevision === 'revisado').length}
            </Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Dictámenes</Text>
          </View>
        </View>

        {/* 4. GUÍA TÉCNICA: PUNTA MORADA */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          GUÍA AGRONÓMICA: PUNTA MORADA (PMP)
        </Text>

        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-2.5 overflow-hidden">
          <TouchableOpacity
            onPress={() => toggleSeccion('que-es')}
            className="p-3.5 flex-row justify-between items-center bg-gray-50/50">
            <View className="flex-row items-center flex-1">
              <Text className="text-base mr-2.5">🥔</Text>
              <Text className="text-xs font-bold text-gray-800">
                ¿Qué es la Punta Morada y su vector?
              </Text>
            </View>
            <FontAwesome
              name={seccionGuiaAbierta === 'que-es' ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#9CA3AF"
            />
          </TouchableOpacity>
          {seccionGuiaAbierta === 'que-es' && (
            <View className="p-3.5 border-t border-gray-100">
              <Text className="text-xs text-gray-600 leading-relaxed mb-2">
                La <Text className="font-bold text-gray-800">Punta Morada de la Papa (PMP)</Text> es
                un complejo fitosanitario causado por fitoplasmas (*Candidatus* Phytoplasma) y la bacteria
                *Liberibacter*.
              </Text>
              <Text className="text-xs text-gray-600 leading-relaxed">
                El vector transmisor es el psílido{' '}
                <Text className="font-bold text-[#2E7D32]">Bactericera cockerelli</Text> (el saltón de la papa). El monitoreo temprano con la cámara permite identificar síntomas antes de la necrosis generalizada.
              </Text>
            </View>
          )}
        </View>

        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
          <TouchableOpacity
            onPress={() => toggleSeccion('sintomas')}
            className="p-3.5 flex-row justify-between items-center bg-gray-50/50">
            <View className="flex-row items-center flex-1">
              <Text className="text-base mr-2.5">🔍</Text>
              <Text className="text-xs font-bold text-gray-800">
                Síntomas característicos y diferenciación
              </Text>
            </View>
            <FontAwesome
              name={seccionGuiaAbierta === 'sintomas' ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#9CA3AF"
            />
          </TouchableOpacity>
          {seccionGuiaAbierta === 'sintomas' && (
            <View className="p-3.5 border-t border-gray-100 gap-1.5">
              <Text className="text-xs text-gray-600">
                • <Text className="font-bold text-gray-800">Follaje:</Text> Pigmentación púrpura en brotes jóvenes apicales, hojas erectas en cuchara.
              </Text>
              <Text className="text-xs text-gray-600">
                • <Text className="font-bold text-gray-800">Tallos:</Text> Engrosamiento de nudos y desarrollo de tubérculos aéreos.
              </Text>
              <Text className="text-xs text-gray-600">
                • <Text className="font-bold text-gray-800">Tubérculo:</Text> Necrosis anular en los vasos conductores (afecta fritura y venta).
              </Text>
            </View>
          )}
        </View>

        {/* 5. GESTIÓN DE DATOS */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          ADMINISTRACIÓN DE DATOS LOCALES
        </Text>

        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 gap-2.5">
          <TouchableOpacity
            onPress={handleCargarDemo}
            className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex-row items-center justify-between active:scale-98">
            <View className="flex-row items-center">
              <FontAwesome name="download" size={14} color="#1565C0" className="mr-2.5" />
              <View>
                <Text className="text-xs font-bold text-gray-800">Cargar Datos de Demostración</Text>
                <Text className="text-[10px] text-gray-500">
                  Agrega parcelas y análisis de ejemplo para probar
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={11} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLimpiarDatos}
            className="p-3 rounded-xl bg-red-50 border border-red-200 flex-row items-center justify-between active:scale-98">
            <View className="flex-row items-center">
              <FontAwesome name="trash" size={14} color="#DC2626" className="mr-2.5" />
              <View>
                <Text className="text-xs font-bold text-red-700">Restablecer Todo a Cero</Text>
                <Text className="text-[10px] text-red-500">
                  Borra todos los lotes y análisis guardados
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={11} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity
          onPress={handleCerrarSesion}
          className="mb-4 p-3.5 rounded-2xl bg-red-600 items-center shadow-sm active:scale-95">
          <View className="flex-row items-center">
            <FontAwesome name="sign-out" size={16} color="white" />
            <Text className="text-white font-bold text-sm ml-2">Cerrar Sesión</Text>
          </View>
        </TouchableOpacity>

        <Text className="text-center text-[11px] text-gray-400 mb-6">
          PMP Smart v2.0 · Plataforma de Monitoreo y Dictamen Fitosanitario
        </Text>
      </ScrollView>

      {/* MODAL EDITAR AGRICULTOR */}
      <Modal visible={modalEditAgr} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <Text className="text-base font-bold text-[#263238]">Editar Datos del Agricultor</Text>
              <TouchableOpacity onPress={() => setModalEditAgr(false)}>
                <FontAwesome name="times" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Nombre Completo *</Text>
                <TextInput
                  value={nombreAgr}
                  onChangeText={setNombreAgr}
                  placeholder="Tu nombre real"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Finca Principal</Text>
                <TextInput
                  value={fincaAgr}
                  onChangeText={setFincaAgr}
                  placeholder="Nombre de tu finca"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Municipio / Ubicación</Text>
                <TextInput
                  value={ubicacionAgr}
                  onChangeText={setUbicacionAgr}
                  placeholder="Municipio, Departamento"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Teléfono de Contacto</Text>
                <TextInput
                  value={telefonoAgr}
                  onChangeText={setTelefonoAgr}
                  placeholder="+57..."
                  keyboardType="phone-pad"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Correo Electrónico</Text>
                <TextInput
                  value={emailAgr}
                  onChangeText={setEmailAgr}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>
            </ScrollView>

            <View className="flex-row gap-3 pt-2 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setModalEditAgr(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 items-center">
                <Text className="text-gray-600 font-bold text-xs">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGuardarPerfilAgr}
                className="flex-1 py-3 rounded-xl bg-[#2E7D32] items-center shadow-sm">
                <Text className="text-white font-bold text-xs">Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL EDITAR TÉCNICO */}
      <Modal visible={modalEditTec} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <Text className="text-base font-bold text-[#1565C0]">
                Editar Credenciales de Agrónomo
              </Text>
              <TouchableOpacity onPress={() => setModalEditTec(false)}>
                <FontAwesome name="times" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Nombre del Profesional *
                </Text>
                <TextInput
                  value={nombreTec}
                  onChangeText={setNombreTec}
                  placeholder="Ej: Ing. Mario Benavides"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Registro Profesional / Tarjeta ICA *
                </Text>
                <TextInput
                  value={regTec}
                  onChangeText={setRegTec}
                  placeholder="Ej: ICA-COL-8823 / MP-1920"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Especialidad Agronómica</Text>
                <TextInput
                  value={espTec}
                  onChangeText={setEspTec}
                  placeholder="Ej: Fitopatología y Sanidad Vegetal"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Entidad / Cooperativa</Text>
                <TextInput
                  value={entidadTec}
                  onChangeText={setEntidadTec}
                  placeholder="Ej: Cooperativa Agropecuaria / Asistencia Técnica"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Teléfono Institucional</Text>
                <TextInput
                  value={telefonoTec}
                  onChangeText={setTelefonoTec}
                  placeholder="+57..."
                  keyboardType="phone-pad"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Correo Electrónico</Text>
                <TextInput
                  value={emailTec}
                  onChangeText={setEmailTec}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>
            </ScrollView>

            <View className="flex-row gap-3 pt-2 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setModalEditTec(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 items-center">
                <Text className="text-gray-600 font-bold text-xs">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGuardarPerfilTec}
                className="flex-1 py-3 rounded-xl bg-[#1565C0] items-center shadow-sm">
                <Text className="text-white font-bold text-xs">Guardar Credenciales</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
