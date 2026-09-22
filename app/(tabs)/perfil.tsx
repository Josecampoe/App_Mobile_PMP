import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';

export default function PerfilScreen() {
  const { perfil, updatePerfil, cultivos, analisisHistorial } = useApp();

  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [nombre, setNombre] = useState(perfil.nombre);
  const [rol, setRol] = useState(perfil.rol);
  const [fincaPrincipal, setFincaPrincipal] = useState(perfil.fincaPrincipal);
  const [ubicacion, setUbicacion] = useState(perfil.ubicacion);
  const [telefono, setTelefono] = useState(perfil.telefono);
  const [email, setEmail] = useState(perfil.email);

  // Guía colapsable
  const [seccionGuiaAbierta, setSeccionGuiaAbierta] = useState<string | null>('que-es');

  const handleGuardarPerfil = () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu nombre.');
      return;
    }

    updatePerfil({
      nombre: nombre.trim(),
      rol: rol.trim() || 'Productor Agrícola',
      fincaPrincipal: fincaPrincipal.trim() || 'Finca Principal',
      ubicacion: ubicacion.trim() || 'Colombia',
      telefono: telefono.trim(),
      email: email.trim(),
    });

    setModalEditVisible(false);
    Alert.alert('Perfil actualizado', 'Los datos del agricultor han sido actualizados.');
  };

  const toggleSeccion = (seccion: string) => {
    setSeccionGuiaAbierta(seccionGuiaAbierta === seccion ? null : seccion);
  };

  const handleContactoAgronomo = () => {
    Alert.alert(
      'Asistencia Técnica Fitosanitaria',
      'Para consultas agronómicas presenciales y confirmación de laboratorio en casos severos de PMP, comunícate con la oficina local de sanidad vegetal (ICA) o tu cooperativa técnica.',
      [{ text: 'Entendido' }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO */}
      <View className="bg-white px-5 py-4 flex-row justify-between items-center border-b border-gray-100 shadow-sm shrink-0">
        <View>
          <Text className="text-xl font-bold text-[#263238]">Perfil de Agricultor</Text>
          <Text className="text-xs text-gray-500">Gestión de usuario y guía agronómica</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setNombre(perfil.nombre);
            setRol(perfil.rol);
            setFincaPrincipal(perfil.fincaPrincipal);
            setUbicacion(perfil.ubicacion);
            setTelefono(perfil.telefono);
            setEmail(perfil.email);
            setModalEditVisible(true);
          }}
          className="bg-gray-100 p-2 rounded-xl active:scale-95">
          <FontAwesome name="pencil" size={16} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4 pb-20" showsVerticalScrollIndicator={false}>
        {/* 2. TARJETA DE USUARIO */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center mb-3">
            <View className="w-16 h-16 rounded-full bg-[#2E7D32]/10 items-center justify-center border-2 border-[#2E7D32]/30 mr-3.5">
              <FontAwesome name="user" size={28} color="#2E7D32" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-lg font-bold text-[#263238]">{perfil.nombre}</Text>
                <View className="ml-2 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-[#2E7D32]">Verificado</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500 font-medium">{perfil.rol}</Text>
              <Text className="text-xs text-[#2E7D32] font-semibold mt-0.5">
                📍 {perfil.fincaPrincipal} · {perfil.ubicacion}
              </Text>
            </View>
          </View>

          {/* Datos de contacto */}
          <View className="bg-gray-50 rounded-xl p-3 border border-gray-100 gap-1.5">
            <View className="flex-row items-center">
              <FontAwesome name="phone" size={12} color="#6B7280" className="w-4" />
              <Text className="text-xs text-gray-600 ml-2 font-medium">{perfil.telefono}</Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="envelope-o" size={12} color="#6B7280" className="w-4" />
              <Text className="text-xs text-gray-600 ml-2 font-medium">{perfil.email}</Text>
            </View>
          </View>
        </View>

        {/* 3. RESUMEN ESTADÍSTICO RÁPIDO */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-row justify-around mb-4">
          <View className="items-center">
            <Text className="text-xl font-black text-[#2E7D32]">{cultivos.length}</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Parcelas</Text>
          </View>
          <View className="w-[1px] bg-gray-100" />
          <View className="items-center">
            <Text className="text-xl font-black text-[#263238]">{analisisHistorial.length}</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Monitoreos</Text>
          </View>
          <View className="w-[1px] bg-gray-100" />
          <View className="items-center">
            <Text className="text-xl font-black text-[#D97706]">
              {cultivos.reduce((a, b) => a + (Number(b.hectareas) || 0), 0).toFixed(1)}
            </Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Hectáreas</Text>
          </View>
        </View>

        {/* 4. GUÍA TÉCNICA: PUNTA MORADA DE LA PAPA (PMP) */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          GUÍA AGRONÓMICA: PUNTA MORADA (PMP)
        </Text>

        {/* Sección 1: ¿Qué es? */}
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
                un complejo fitosanitario causado principalmente por fitoplasmas (*Candidatus* Phytoplasma)
                y bacterias del género *Liberibacter*.
              </Text>
              <Text className="text-xs text-gray-600 leading-relaxed">
                El vector transmisor principal es el psílido{' '}
                <Text className="font-bold text-[#2E7D32]">Bactericera cockerelli</Text> (conocido
                como el saltón de la papa). Su monitoreo temprano es crucial para evitar pérdidas de hasta el 80% del cultivo.
              </Text>
            </View>
          )}
        </View>

        {/* Sección 2: Síntomas Clave */}
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-2.5 overflow-hidden">
          <TouchableOpacity
            onPress={() => toggleSeccion('sintomas')}
            className="p-3.5 flex-row justify-between items-center bg-gray-50/50">
            <View className="flex-row items-center flex-1">
              <Text className="text-base mr-2.5">🔍</Text>
              <Text className="text-xs font-bold text-gray-800">
                Síntomas característicos en campo
              </Text>
            </View>
            <FontAwesome
              name={seccionGuiaAbierta === 'sintomas' ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#9CA3AF"
            />
          </TouchableOpacity>
          {seccionGuiaAbierta === 'sintomas' && (
            <View className="p-3.5 border-t border-gray-100 gap-2">
              <View className="flex-row items-start">
                <Text className="text-xs text-[#D97706] font-bold mr-2">• Hojas:</Text>
                <Text className="text-xs text-gray-600 flex-1">
                  Pigmentación violácea o rojiza en bordes apicales, erectas y con enrollamiento hacia arriba en forma de cuchara.
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-xs text-[#D97706] font-bold mr-2">• Tallos:</Text>
                <Text className="text-xs text-gray-600 flex-1">
                  Engrosamiento de entrenudos, acortamiento apical y formación de tubérculos aéreos axilares.
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-xs text-[#D97706] font-bold mr-2">• Tubérculo:</Text>
                <Text className="text-xs text-gray-600 flex-1">
                  Pardeamiento o estrías oscuras en el anillo vascular interno (pérdida de valor culinario y de fritura).
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Sección 3: Manejo Integrado */}
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
          <TouchableOpacity
            onPress={() => toggleSeccion('prevencion')}
            className="p-3.5 flex-row justify-between items-center bg-gray-50/50">
            <View className="flex-row items-center flex-1">
              <Text className="text-base mr-2.5">🛡️</Text>
              <Text className="text-xs font-bold text-gray-800">
                Buenas prácticas y control fitosanitario
              </Text>
            </View>
            <FontAwesome
              name={seccionGuiaAbierta === 'prevencion' ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#9CA3AF"
            />
          </TouchableOpacity>
          {seccionGuiaAbierta === 'prevencion' && (
            <View className="p-3.5 border-t border-gray-100 gap-2">
              <Text className="text-xs text-gray-600">
                1. Instalar <Text className="font-bold text-gray-800">trampas pegajosas amarillas</Text> en el perímetro de los lotes.
              </Text>
              <Text className="text-xs text-gray-600">
                2. Utilizar únicamente semilla certificada libre del vector y de fitoplasmas.
              </Text>
              <Text className="text-xs text-gray-600">
                3. Eliminar plantas hospederas silvestres (solanáceas) en linderos y acequias.
              </Text>
              <Text className="text-xs text-gray-600">
                4. Realizar inspecciones semanales con la cámara de PMP Smart en brotes jóvenes.
              </Text>
            </View>
          )}
        </View>

        {/* 5. CONFIGURACIÓN DE LA APP */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          AJUSTES DE LA APLICACIÓN
        </Text>

        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
          <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
            <View className="flex-1 pr-2">
              <Text className="text-xs font-bold text-gray-800">Notificaciones de Monitoreo</Text>
              <Text className="text-[11px] text-gray-400">
                Recordatorios para inspeccionar parcelas semanalmente
              </Text>
            </View>
            <Switch
              value={perfil.notificaciones}
              onValueChange={(val) => updatePerfil({ notificaciones: val })}
              trackColor={{ false: '#E5E7EB', true: '#A5D6A7' }}
              thumbColor={perfil.notificaciones ? '#2E7D32' : '#9CA3AF'}
            />
          </View>

          <View className="flex-row items-center justify-between py-2">
            <View className="flex-1 pr-2">
              <Text className="text-xs font-bold text-gray-800">Modo Campo (Offline)</Text>
              <Text className="text-[11px] text-gray-400">
                Guardar capturas localmente cuando no hay señal móvil
              </Text>
            </View>
            <Switch
              value={perfil.modoOffline}
              onValueChange={(val) => updatePerfil({ modoOffline: val })}
              trackColor={{ false: '#E5E7EB', true: '#A5D6A7' }}
              thumbColor={perfil.modoOffline ? '#2E7D32' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Botón asistencia técnica */}
        <TouchableOpacity
          onPress={handleContactoAgronomo}
          className="bg-white border border-[#2E7D32] rounded-2xl p-4 flex-row items-center justify-center mb-6 active:scale-98">
          <FontAwesome name="comments-o" size={18} color="#2E7D32" />
          <Text className="text-[#2E7D32] font-bold text-xs ml-2">
            Contacto con Asistencia Técnica Agronómica
          </Text>
        </TouchableOpacity>

        <Text className="text-center text-[11px] text-gray-400 mb-6">
          PMP Smart v1.0.0 · Sistema de Vigilancia de Punta Morada
        </Text>
      </ScrollView>

      {/* 6. MODAL PARA EDITAR PERFIL */}
      <Modal visible={modalEditVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <Text className="text-base font-bold text-[#263238]">Editar Datos del Productor</Text>
              <TouchableOpacity
                onPress={() => setModalEditVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                <FontAwesome name="times" size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Nombre Completo *</Text>
                <TextInput
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Rol / Ocupación</Text>
                <TextInput
                  value={rol}
                  onChangeText={setRol}
                  placeholder="Ej: Productor Papero, Administrador"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Finca Principal</Text>
                <TextInput
                  value={fincaPrincipal}
                  onChangeText={setFincaPrincipal}
                  placeholder="Nombre de tu finca"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Ubicación</Text>
                <TextInput
                  value={ubicacion}
                  onChangeText={setUbicacion}
                  placeholder="Municipio, Departamento"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Teléfono Móvil</Text>
                <TextInput
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="+57..."
                  keyboardType="phone-pad"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">Correo Electrónico</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </View>
            </ScrollView>

            <View className="flex-row gap-3 pt-2 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setModalEditVisible(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 items-center">
                <Text className="text-gray-600 font-bold text-xs">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGuardarPerfil}
                className="flex-1 py-3 rounded-xl bg-[#2E7D32] items-center shadow-sm">
                <Text className="text-white font-bold text-xs">Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
