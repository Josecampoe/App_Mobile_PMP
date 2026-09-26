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
import { useApp, Analisis, RevisionTecnica } from '../../context/AppContext';

const OPCIONES_DIAGNOSTICO_TECNICO: RevisionTecnica['diagnosticoValidado'][] = [
  'PMP Confirmado',
  'Sospecha Moderada',
  'Descartado - Sano',
  'Deficiencia Nutricional',
  'Virosis / Otra Afección',
];

export default function Historial() {
  const router = useRouter();
  const {
    rolActivo,
    analisisHistorial,
    deleteAnalisis,
    solicitarRevisionTecnica,
    guardarRevisionTecnica,
    perfilTecnico,
  } = useApp();

  const [filtro, setFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [selectedAnalisis, setSelectedAnalisis] = useState<Analisis | null>(null);

  // Estados para el formulario de dictamen técnico
  const [modalDictamenVisible, setModalDictamenVisible] = useState(false);
  const [diagValidado, setDiagValidado] = useState<RevisionTecnica['diagnosticoValidado']>(
    'PMP Confirmado'
  );
  const [observacionesTecnicas, setObservacionesTecnicas] = useState('');
  const [tratamientoSugerido, setTratamientoSugerido] = useState('');

  // Filtrado de análisis a prueba de errores
  const itemsFiltrados = (analisisHistorial || []).filter((item) => {
    if (!item) return false;

    // Filtro según rol
    let matchFiltro = true;
    if (rolActivo === 'tecnico') {
      if (filtro === 'pendientes') matchFiltro = item.estadoRevision === 'pendiente';
      else if (filtro === 'revisados') matchFiltro = item.estadoRevision === 'revisado';
    } else {
      if (filtro === 'alerta')
        matchFiltro = item.estado === 'alerta' || Boolean(item.diagnostico?.includes('PMP'));
      else if (filtro === 'pendiente') matchFiltro = item.estadoRevision === 'pendiente';
      else if (filtro === 'revisado') matchFiltro = item.estadoRevision === 'revisado';
    }

    const busq = (busqueda || '').toLowerCase().trim();
    if (!busq) return matchFiltro;

    const matchBusqueda =
      (item.cultivoNombre || '').toLowerCase().includes(busq) ||
      (item.diagnostico || '').toLowerCase().includes(busq) ||
      (Array.isArray(item.sintomas) &&
        item.sintomas.some((s) => (s || '').toLowerCase().includes(busq))) ||
      Boolean(item.revisionTecnica?.observaciones?.toLowerCase().includes(busq));

    return matchFiltro && matchBusqueda;
  });

  const handleEliminar = (analisis: Analisis) => {
    Alert.alert(
      'Eliminar Registro',
      `¿Deseas eliminar este reporte fitosanitario de ${analisis.cultivoNombre || 'esta parcela'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteAnalisis(analisis.id);
            setSelectedAnalisis(null);
          },
        },
      ]
    );
  };

  const handleSolicitarRevision = (analisis: Analisis) => {
    solicitarRevisionTecnica(analisis.id);
    setSelectedAnalisis({
      ...analisis,
      estadoRevision: 'pendiente',
    });
    Alert.alert(
      '¡Solicitud Enviada!',
      'Tu caso fitosanitario ha sido remitido a la bandeja del Técnico Agrónomo para su revisión y dictamen.'
    );
  };

  const abrirFormularioDictamen = (analisis: Analisis) => {
    if (analisis.revisionTecnica) {
      setDiagValidado(analisis.revisionTecnica.diagnosticoValidado);
      setObservacionesTecnicas(analisis.revisionTecnica.observaciones || '');
      setTratamientoSugerido(analisis.revisionTecnica.tratamientoRecomendado || '');
    } else {
      setDiagValidado('PMP Confirmado');
      setObservacionesTecnicas('');
      setTratamientoSugerido('');
    }
    setModalDictamenVisible(true);
  };

  const handleGuardarDictamen = () => {
    if (!selectedAnalisis) return;
    if (!observacionesTecnicas.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tus observaciones técnicas de campo.');
      return;
    }

    guardarRevisionTecnica(selectedAnalisis.id, {
      tecnicoNombre: perfilTecnico?.nombre || 'Ing. Agrónomo Fitosanitario',
      registroProfesional: perfilTecnico?.registroProfesional || 'ICA-COL',
      diagnosticoValidado: diagValidado,
      observaciones: observacionesTecnicas.trim(),
      tratamientoRecomendado:
        tratamientoSugerido.trim() ||
        'Seguimiento visual periódico e instalación de trampas amarillas perimetrales.',
    });

    setModalDictamenVisible(false);
    setSelectedAnalisis(null);
    Alert.alert(
      'Dictamen Emitido',
      'El informe técnico ha sido firmado y notificado al agricultor exitosamente.'
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO */}
      <View className="bg-white px-5 pt-3 pb-3 border-b border-gray-100 shadow-sm shrink-0">
        <View className="flex-row justify-between items-center mb-2.5">
          <View>
            <Text className="text-xl font-bold text-[#263238]">
              {rolActivo === 'agricultor' ? 'Historial de Monitoreos' : 'Bandeja Fitosanitaria'}
            </Text>
            <Text className="text-xs text-gray-500">
              {rolActivo === 'agricultor'
                ? 'Reportes y dictámenes de tus parcelas'
                : 'Casos remitidos por agricultores para dictamen'}
            </Text>
          </View>
          {rolActivo === 'agricultor' && (
            <TouchableOpacity
              onPress={() => router.push('/camera')}
              className="bg-[#2E7D32] w-9 h-9 rounded-full items-center justify-center active:scale-95 shadow-sm">
              <FontAwesome name="camera" size={14} color="white" />
            </TouchableOpacity>
          )}
        </View>

      </View>

      <ScrollView className="flex-1 px-4 pt-3 pb-24" showsVerticalScrollIndicator={false}>
        {/* 2. BUSCADOR */}
        <View className="bg-white rounded-xl px-3.5 py-2.5 flex-row items-center border border-gray-200 mb-3 shadow-sm">
          <FontAwesome name="search" size={14} color="#9CA3AF" className="mr-2" />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por lote, síntoma o dictamen..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-xs text-gray-800 py-0"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <FontAwesome name="times-circle" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 3. FILTROS SEGÚN ROL ACTIVO */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-4">
          {rolActivo === 'agricultor' ? (
            <>
              <TouchableOpacity
                onPress={() => setFiltro('todos')}
                className={`px-3 py-1.5 rounded-full border ${
                  filtro === 'todos'
                    ? 'bg-[#2E7D32] border-[#2E7D32]'
                    : 'bg-white border-gray-200'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    filtro === 'todos' ? 'text-white' : 'text-gray-600'
                  }`}>
                  Todos ({analisisHistorial.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFiltro('alerta')}
                className={`px-3 py-1.5 rounded-full border ${
                  filtro === 'alerta'
                    ? 'bg-amber-600 border-amber-600'
                    : 'bg-white border-gray-200'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    filtro === 'alerta' ? 'text-white' : 'text-gray-600'
                  }`}>
                  ⚠️ Alerta PMP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFiltro('revisado')}
                className={`px-3 py-1.5 rounded-full border ${
                  filtro === 'revisado'
                    ? 'bg-emerald-600 border-emerald-600'
                    : 'bg-white border-gray-200'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    filtro === 'revisado' ? 'text-white' : 'text-gray-600'
                  }`}>
                  ✓ Con Dictamen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFiltro('pendiente')}
                className={`px-3 py-1.5 rounded-full border ${
                  filtro === 'pendiente'
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-200'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    filtro === 'pendiente' ? 'text-white' : 'text-gray-600'
                  }`}>
                  ⏳ En Revisión
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setFiltro('pendientes')}
                className={`px-3.5 py-1.5 rounded-full border ${
                  filtro === 'pendientes'
                    ? 'bg-amber-600 border-amber-600'
                    : 'bg-white border-gray-200'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    filtro === 'pendientes' ? 'text-white' : 'text-gray-600'
                  }`}>
                  ⏳ Por Revisar (
                  {analisisHistorial.filter((a) => a.estadoRevision === 'pendiente').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFiltro('revisados')}
                className={`px-3.5 py-1.5 rounded-full border ${
                  filtro === 'revisados'
                    ? 'bg-emerald-600 border-emerald-600'
                    : 'bg-white border-gray-200'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    filtro === 'revisados' ? 'text-white' : 'text-gray-600'
                  }`}>
                  ✓ Dictámenes Emitidos (
                  {analisisHistorial.filter((a) => a.estadoRevision === 'revisado').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFiltro('todos')}
                className={`px-3.5 py-1.5 rounded-full border ${
                  filtro === 'todos'
                    ? 'bg-[#1565C0] border-[#1565C0]'
                    : 'bg-white border-gray-200'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    filtro === 'todos' ? 'text-white' : 'text-gray-600'
                  }`}>
                  Todos ({analisisHistorial.length})
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* 4. LISTADO DE ANÁLISIS */}
        {itemsFiltrados.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center justify-center border-2 border-dashed border-gray-200 mt-2">
            <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
              <FontAwesome name="clipboard" size={24} color="#9CA3AF" />
            </View>
            <Text className="text-base font-bold text-gray-800 text-center">
              No hay análisis en esta vista
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1 mb-4 leading-relaxed">
              {rolActivo === 'agricultor'
                ? 'Toma fotos de tus plantas de papa con la cámara para guardarlas aquí y solicitar revisión de un técnico.'
                : 'No hay casos pendientes con los filtros seleccionados.'}
            </Text>
            {rolActivo === 'agricultor' && (
              <TouchableOpacity
                onPress={() => router.push('/camera')}
                className="bg-[#2E7D32] px-4 py-2.5 rounded-xl shadow-sm">
                <Text className="text-white text-xs font-bold">+ Escanear Planta Ahora</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          itemsFiltrados.map((item) => {
            const esAlerta = item.estado === 'alerta' || Boolean(item.diagnostico?.includes('PMP'));
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedAnalisis(item)}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex-row items-center mb-3 active:scale-[0.99]">
                <Image
                  source={{
                    uri: item.imageUri || 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a',
                  }}
                  style={{ width: 72, height: 72, borderRadius: 12 }}
                  className="bg-gray-100"
                  resizeMode="cover"
                />

                <View className="flex-1 ml-3.5 justify-center">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className={`text-xs font-bold ${
                        esAlerta ? 'text-[#D97706]' : 'text-[#2E7D32]'
                      }`}>
                      {item.diagnostico || 'Diagnóstico'}
                    </Text>
                    <View className="bg-gray-100 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-bold text-gray-600">
                        {item.confianza || 90}% IA
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs text-[#263238] font-bold">
                    📍 {item.cultivoNombre || 'Parcela'}
                  </Text>
                  <Text className="text-[10px] text-gray-400 mt-0.5">{item.fecha || ''}</Text>

                  {/* BADGES DE ESTADO DE REVISIÓN */}
                  <View className="flex-row items-center mt-1.5">
                    {item.estadoRevision === 'revisado' ? (
                      <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex-row items-center">
                        <FontAwesome name="check" size={10} color="#16A34A" className="mr-1" />
                        <Text className="text-[10px] font-bold text-emerald-800">
                          Dictamen emitido
                        </Text>
                      </View>
                    ) : item.estadoRevision === 'pendiente' ? (
                      <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex-row items-center">
                        <FontAwesome name="clock-o" size={10} color="#D97706" className="mr-1" />
                        <Text className="text-[10px] font-bold text-amber-800">
                          En espera de agrónomo
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-[10px] text-gray-400 italic">Sin revisión técnica</Text>
                    )}
                  </View>
                </View>

                <FontAwesome name="chevron-right" size={13} color="#D1D5DB" className="ml-2" />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 5. MODAL DE DETALLE DE ANÁLISIS */}
      <Modal
        visible={!!selectedAnalisis}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAnalisis(null)}>
        {selectedAnalisis && (
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-3xl p-5 max-h-[92%]">
              <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <View>
                  <Text className="text-base font-bold text-[#263238]">Reporte Fitosanitario</Text>
                  <Text className="text-xs text-gray-500">{selectedAnalisis.fecha || ''}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedAnalisis(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                  <FontAwesome name="times" size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                {/* Imagen del análisis */}
                <View className="w-full h-52 rounded-2xl overflow-hidden mb-4 bg-gray-900 relative shadow-sm">
                  <Image
                    source={{
                      uri:
                        selectedAnalisis.imageUri ||
                        'https://images.unsplash.com/photo-1555431189-0ab279e2be3a',
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-2.5 left-2.5 bg-black/70 px-3 py-1 rounded-lg flex-row items-center">
                    <FontAwesome name="map-marker" size={12} color="#81C784" />
                    <Text className="text-white text-xs ml-1.5 font-medium">
                      {selectedAnalisis.cultivoNombre || 'Parcela'}
                    </Text>
                  </View>
                </View>

                {/* ======================================================== */}
                {/* SECCIÓN DICTAMEN OFICIAL DEL TÉCNICO (SI YA EXISTE)     */}
                {/* ======================================================== */}
                {selectedAnalisis.estadoRevision === 'revisado' && selectedAnalisis.revisionTecnica ? (
                  <View className="bg-emerald-50 border-2 border-[#2E7D32] rounded-2xl p-4 mb-4 shadow-sm">
                    <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-emerald-200">
                      <View className="flex-row items-center">
                        <FontAwesome name="certificate" size={16} color="#2E7D32" />
                        <Text className="text-xs font-black text-[#2E7D32] uppercase ml-1.5">
                          Dictamen Técnico Oficial
                        </Text>
                      </View>
                      <Text className="text-[10px] text-gray-500">
                        {selectedAnalisis.revisionTecnica.fechaRevision || ''}
                      </Text>
                    </View>

                    <Text className="text-xs font-bold text-gray-800">
                      Evaluado por: {selectedAnalisis.revisionTecnica.tecnicoNombre || 'Agrónomo'}
                    </Text>
                    {selectedAnalisis.revisionTecnica.registroProfesional ? (
                      <Text className="text-[11px] text-gray-500">
                        Reg. Profesional: {selectedAnalisis.revisionTecnica.registroProfesional}
                      </Text>
                    ) : null}

                    <View className="bg-white rounded-xl p-2.5 my-2 border border-emerald-200">
                      <Text className="text-[11px] font-bold text-gray-500 uppercase">
                        Diagnóstico Validado:
                      </Text>
                      <Text className="text-sm font-extrabold text-[#2E7D32] mt-0.5">
                        {selectedAnalisis.revisionTecnica.diagnosticoValidado || 'Sin diagnóstico'}
                      </Text>
                    </View>

                    <Text className="text-xs font-bold text-gray-700 mt-1">Observaciones:</Text>
                    <Text className="text-xs text-gray-700 leading-relaxed mb-2">
                      {selectedAnalisis.revisionTecnica.observaciones || 'Sin observaciones'}
                    </Text>

                    <Text className="text-xs font-bold text-[#2E7D32]">Tratamiento Prescrito:</Text>
                    <Text className="text-xs text-gray-700 leading-relaxed">
                      {selectedAnalisis.revisionTecnica.tratamientoRecomendado || 'Sin prescripción'}
                    </Text>
                  </View>
                ) : null}

                {/* Banner de Diagnóstico IA */}
                <View
                  className={`p-4 rounded-2xl border mb-4 ${
                    Boolean(selectedAnalisis.diagnostico?.includes('PMP')) ||
                    selectedAnalisis.estado === 'alerta'
                      ? 'bg-[#FFFDE7] border-[#F9A825]'
                      : 'bg-emerald-50 border-emerald-300'
                  }`}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className={`text-base font-black uppercase ${
                        Boolean(selectedAnalisis.diagnostico?.includes('PMP'))
                          ? 'text-[#D97706]'
                          : 'text-[#2E7D32]'
                      }`}>
                      {selectedAnalisis.diagnostico || 'Evaluación'} (IA)
                    </Text>
                    <View className="bg-white/80 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-bold text-gray-800">
                        {selectedAnalisis.confianza || 90}% Nivel
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-700 mt-1">
                    {Boolean(selectedAnalisis.diagnostico?.includes('PMP'))
                      ? 'Signos visuales coincidentes con síntomas foliares de Punta Morada.'
                      : 'Follaje en buenas condiciones sin señales visibles de fitoplasmas.'}
                  </Text>
                </View>

                {/* ACCIONES DE REVISIÓN SEGÚN EL ROL ACTIVO */}
                {rolActivo === 'agricultor' ? (
                  selectedAnalisis.estadoRevision === 'sin_solicitar' ? (
                    <TouchableOpacity
                      onPress={() => handleSolicitarRevision(selectedAnalisis)}
                      className="bg-[#1565C0] p-3.5 rounded-2xl mb-4 flex-row items-center justify-center shadow-md active:scale-98">
                      <FontAwesome name="paper-plane" size={14} color="white" />
                      <Text className="text-white text-xs font-bold ml-2">
                        Solicitar Revisión a un Técnico Agrónomo
                      </Text>
                    </TouchableOpacity>
                  ) : selectedAnalisis.estadoRevision === 'pendiente' ? (
                    <View className="bg-amber-50 border border-amber-200 p-3 rounded-2xl mb-4 flex-row items-center">
                      <FontAwesome name="clock-o" size={16} color="#D97706" className="mr-2" />
                      <Text className="text-xs text-amber-800 flex-1 leading-snug font-medium">
                        Tu muestra está en la bandeja del Técnico Agrónomo para su revisión y dictamen oficial.
                      </Text>
                    </View>
                  ) : null
                ) : (
                  <TouchableOpacity
                    onPress={() => abrirFormularioDictamen(selectedAnalisis)}
                    className="bg-[#1565C0] p-3.5 rounded-2xl mb-4 flex-row items-center justify-center shadow-md active:scale-98">
                    <FontAwesome name="pencil-square-o" size={16} color="white" />
                    <Text className="text-white text-xs font-bold ml-2">
                      {selectedAnalisis.estadoRevision === 'revisado'
                        ? 'Editar Dictamen Técnico'
                        : '🔬 Emitir Dictamen Técnico Fitosanitario'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Síntomas identificados por IA */}
                <View className="bg-[#F9FAFB] rounded-2xl p-4 mb-4 border border-gray-100">
                  <Text className="text-xs font-bold text-gray-700 uppercase mb-2">
                    🔍 Patrones Evaluados en Follaje
                  </Text>
                  {(selectedAnalisis.sintomas || []).map((s, idx) => (
                    <View key={idx} className="flex-row items-start mb-1.5">
                      <Text className="text-xs text-[#2E7D32] mr-2">•</Text>
                      <Text className="text-xs text-gray-700 flex-1">{s}</Text>
                    </View>
                  ))}
                </View>

                {/* Recomendaciones agronómicas preliminares */}
                <View className="bg-white rounded-2xl p-4 mb-4 border border-emerald-100 shadow-sm">
                  <Text className="text-xs font-bold text-[#2E7D32] uppercase mb-2">
                    📋 Protocolo Preventivo ICA / FAO
                  </Text>
                  {(selectedAnalisis.recomendaciones || []).map((r, idx) => (
                    <View key={idx} className="flex-row items-start mb-1.5">
                      <Text className="text-xs font-bold text-[#2E7D32] mr-2">{idx + 1}.</Text>
                      <Text className="text-xs text-gray-600 flex-1">{r}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Botones inferiores del modal */}
              <View className="flex-row gap-3 pt-2 border-t border-gray-100">
                <TouchableOpacity
                  onPress={() => handleEliminar(selectedAnalisis)}
                  className="flex-1 py-3 rounded-xl border border-red-200 bg-red-50 flex-row items-center justify-center">
                  <FontAwesome name="trash" size={14} color="#DC2626" />
                  <Text className="text-red-700 font-bold text-xs ml-2">Eliminar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedAnalisis(null)}
                  className="flex-1 py-3 rounded-xl bg-[#2E7D32] items-center justify-center shadow-sm">
                  <Text className="text-white font-bold text-xs">Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* 6. MODAL: FORMULARIO DE DICTAMEN TÉCNICO (PARA EL AGRÓNOMO) */}
      <Modal visible={modalDictamenVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <View>
                <Text className="text-base font-bold text-[#1565C0]">
                  Dictamen Fitosanitario de Campo
                </Text>
                <Text className="text-xs text-gray-500">
                  Emitido por: {perfilTecnico?.nombre || 'Ing. Agrónomo'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalDictamenVisible(false)}>
                <FontAwesome name="times" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {/* Selector de Diagnóstico Validado */}
              <Text className="text-xs font-bold text-gray-700 mb-1.5">
                Diagnóstico Técnico Validado *
              </Text>
              <View className="gap-1.5 mb-3.5">
                {OPCIONES_DIAGNOSTICO_TECNICO.map((opcion) => {
                  const isSelected = diagValidado === opcion;
                  return (
                    <TouchableOpacity
                      key={opcion}
                      onPress={() => setDiagValidado(opcion)}
                      className={`p-2.5 rounded-xl border flex-row items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 border-[#1565C0]'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-[#1565C0]' : 'text-gray-700'
                        }`}>
                        {opcion}
                      </Text>
                      {isSelected && <FontAwesome name="check-circle" size={14} color="#1565C0" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Observaciones de campo */}
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Observaciones Técnicas del Agrónomo *
                </Text>
                <TextInput
                  value={observacionesTecnicas}
                  onChangeText={setObservacionesTecnicas}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholder="Ej: Se observa sintomatología típica con engrosamiento de nudos apicales. No se evidencian ninfas activas en la muestra..."
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 min-h-[70px]"
                />
              </View>

              {/* Tratamiento Prescrito */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Tratamiento y Prescripción de Manejo (MIP)
                </Text>
                <TextInput
                  value={tratamientoSugerido}
                  onChangeText={setTratamientoSugerido}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholder="Ej: Instalar 10 trampas amarillas por hectárea. Aplicación focalizada preventiva. No utilizar tubérculos como semilla..."
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 min-h-[70px]"
                />
              </View>
            </ScrollView>

            <View className="flex-row gap-3 pt-2 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setModalDictamenVisible(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 items-center">
                <Text className="text-gray-600 font-bold text-xs">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGuardarDictamen}
                className="flex-1 py-3 rounded-xl bg-[#1565C0] items-center shadow-md">
                <Text className="text-white font-bold text-xs">Firmar y Enviar Dictamen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
