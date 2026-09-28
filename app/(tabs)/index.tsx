import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { vinculosApi } from '../../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');

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

  const [modalCodigo, setModalCodigo] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [modalVincular, setModalVincular] = useState(false);
  const [codigoInput, setCodigoInput] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const btnScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.spring(btnScale, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const handleGenerarCodigo = async () => {
    try {
      const res = await vinculosApi.generarCodigo();
      if (res.success && res.data) {
        setCodigoGenerado(res.data.codigo);
        setModalCodigo(true);
      } else {
        Alert.alert('Error', res.error || 'No se pudo generar el código');
      }
    } catch (e) {
      Alert.alert('Error', 'Problema de conexión');
    }
  };

  const handleVincular = async () => {
    if (!codigoInput.trim()) return Alert.alert('Error', 'Ingresa el código');
    try {
      const res = await vinculosApi.vincular(codigoInput.trim().toUpperCase());
      if (res.success && res.data) {
        Alert.alert('Éxito', `Vinculado con agricultor: ${res.data.agricultorNombre}`);
        setModalVincular(false);
        setCodigoInput('');
      } else {
        Alert.alert('Error', res.error || 'Código inválido');
      }
    } catch (e) {
      Alert.alert('Error', 'Problema de conexión');
    }
  };

  const casosPendientes = (analisisHistorial || []).filter((a) => a?.estadoRevision === 'pendiente');
  const casosRevisados = (analisisHistorial || []).filter((a) => a?.estadoRevision === 'revisado');

  const nombre =
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, backgroundColor: '#FAFAF7' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: rolActivo === 'agricultor' ? '#E8F5E9' : '#E3F2FD',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <FontAwesome
                name={rolActivo === 'agricultor' ? 'leaf' : 'stethoscope'}
                size={15}
                color={rolActivo === 'agricultor' ? '#388E3C' : '#1565C0'}
              />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 }}>
              PMP Smart
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/perfil')}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F0F0ED',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
            }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: rolActivo === 'agricultor' ? '#C8E6C9' : '#BBDEFB',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 6,
              }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: rolActivo === 'agricultor' ? '#2E7D32' : '#1565C0' }}>
                {nombre.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#555' }}>{nombre}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}>

        {rolActivo === 'agricultor' ? (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Greeting */}
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 2, letterSpacing: -0.3 }}>
              {getSaludo()}, {nombre}
            </Text>
            <Text style={{ fontSize: 13, color: '#888', marginBottom: 20, fontWeight: '400' }}>
              Monitoreo fitosanitario de tus cultivos
            </Text>

            {/* Empty State */}
            {(!cultivos || cultivos.length === 0) && (
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 20,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: '#E8E8E4',
                  marginBottom: 20,
                }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: '#F1F8E9',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}>
                  <FontAwesome name="map-signs" size={20} color="#558B2F" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 }}>
                  Registra tu primera parcela
                </Text>
                <Text style={{ fontSize: 13, color: '#888', lineHeight: 19, marginBottom: 18 }}>
                  Agrega los datos de tu cultivo para comenzar a monitorear con la cámara.
                </Text>
                <TouchableOpacity
                  onPress={() => setModalNuevoLote(true)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: '#2E7D32',
                    paddingVertical: 13,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <FontAwesome name="plus" size={12} color="white" />
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>
                    Agregar parcela
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Main CTA */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                onPress={() => router.push('/camera')}
                activeOpacity={0.9}
                style={{
                  backgroundColor: '#1B5E20',
                  borderRadius: 20,
                  padding: 24,
                  marginBottom: 12,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <FontAwesome name="camera" size={22} color="white" />
                  </View>
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 }}>
                      Analizar planta
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
                      Fotografía una hoja para detectar PMP
                    </Text>
                  </View>
                  <FontAwesome name="arrow-right" size={14} color="rgba(255,255,255,0.5)" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Secondary Action */}
            <TouchableOpacity
              onPress={handleGenerarCodigo}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E0E0DC',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 24,
              }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#E8F5E9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                <FontAwesome name="share-alt" size={14} color="#388E3C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#333' }}>Compartir con técnico</Text>
                <Text style={{ fontSize: 11, color: '#999', marginTop: 1 }}>Genera un código de acceso</Text>
              </View>
              <FontAwesome name="chevron-right" size={11} color="#CCC" />
            </TouchableOpacity>

            {/* Reviewed Alert */}
            {casosRevisados.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/historial')}
                activeOpacity={0.85}
                style={{
                  backgroundColor: '#F1F8E9',
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 24,
                }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#C8E6C9',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <FontAwesome name="check" size={14} color="#2E7D32" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#2E7D32' }}>
                    Dictamen técnico disponible
                  </Text>
                  <Text style={{ fontSize: 11, color: '#558B2F', marginTop: 1 }}>
                    Tienes recomendaciones de un agrónomo
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={11} color="#81C784" />
              </TouchableOpacity>
            )}

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
              {[
                { value: cultivos.length, label: 'Parcelas', color: '#1A1A1A' },
                { value: analisisHistorial.length, label: 'Escaneos', color: '#2E7D32' },
                { value: casosPendientes.length, label: 'En revisión', color: '#E65100' },
              ].map((stat, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: '#fff',
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#F0F0ED',
                    alignItems: 'center',
                  }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: stat.color }}>{stat.value}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#AAA', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Parcelas List */}
            {cultivos.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A' }}>
                    Tus parcelas
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/cultivos')}>
                    <Text style={{ fontSize: 12, color: '#888', fontWeight: '500' }}>Ver todas →</Text>
                  </TouchableOpacity>
                </View>

                {cultivos.slice(0, 3).map((cultivo) => (
                  <TouchableOpacity
                    key={cultivo.id}
                    onPress={() => {
                      setSelectedCultivoId(cultivo.id);
                      router.push({ pathname: '/camera', params: { cultivoId: cultivo.id } });
                    }}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      padding: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#F0F0ED',
                      marginBottom: 10,
                    }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: cultivo.estadoFitosanitario === 'alerta' ? '#FFF3E0' : '#F1F8E9',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}>
                      <FontAwesome
                        name="leaf"
                        size={16}
                        color={cultivo.estadoFitosanitario === 'alerta' ? '#E65100' : '#558B2F'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A1A' }}>{cultivo.nombre}</Text>
                      <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                        {cultivo.variedad} · {cultivo.hectareas} ha
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: '#F5F5F2',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                      }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#666' }}>Escanear</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Recent Analyses */}
            {analisisHistorial.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A' }}>
                    Análisis recientes
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/historial')}>
                    <Text style={{ fontSize: 12, color: '#888', fontWeight: '500' }}>Ver todos →</Text>
                  </TouchableOpacity>
                </View>

                {analisisHistorial.slice(0, 2).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push('/(tabs)/historial')}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      padding: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#F0F0ED',
                      marginBottom: 10,
                    }}>
                    <Image
                      source={{ uri: item.imageUri || 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a' }}
                      style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F0ED' }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: item.estado === 'alerta' ? '#E65100' : '#2E7D32',
                          }}>
                          {item.diagnostico || 'Diagnóstico'}
                        </Text>
                        {item.estadoRevision === 'revisado' && (
                          <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#2E7D32' }}>Revisado</Text>
                          </View>
                        )}
                        {item.estadoRevision === 'pendiente' && (
                          <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#E65100' }}>Pendiente</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                        {item.cultivoNombre || 'Parcela'} · {item.fecha || ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        ) : (
          /* ===== MODO TÉCNICO ===== */
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Tech Panel */}
            <View
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 16,
                padding: 18,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#DBEAFE',
              }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1565C0', marginBottom: 4 }}>
                Panel técnico agronómico
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B' }}>
                {perfilTecnico?.nombre || 'Ing. Agrónomo'} · {perfilTecnico?.registroProfesional || 'Reg. Profesional'}
              </Text>
            </View>

            {/* Tech Stats */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
              {[
                { value: casosPendientes.length, label: 'Por revisar', color: '#E65100', bg: '#FFF3E0' },
                { value: casosRevisados.length, label: 'Auditados', color: '#2E7D32', bg: '#E8F5E9' },
                { value: cultivos.length, label: 'Parcelas', color: '#1565C0', bg: '#E3F2FD' },
              ].map((stat, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: '#fff',
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#F0F0ED',
                    alignItems: 'center',
                  }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: stat.color }}>{stat.value}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: '#AAA', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Pending Cases */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 14 }}>
                Casos pendientes ({casosPendientes.length})
              </Text>

              {casosPendientes.length === 0 ? (
                <View
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 32,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#F0F0ED',
                  }}>
                  <FontAwesome name="check-circle" size={28} color="#C8E6C9" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#555', marginTop: 10 }}>
                    Sin revisiones pendientes
                  </Text>
                  <Text style={{ fontSize: 11, color: '#AAA', textAlign: 'center', marginTop: 4 }}>
                    Los casos nuevos aparecerán aquí
                  </Text>
                </View>
              ) : (
                casosPendientes.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push('/(tabs)/historial')}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: '#FFFBF5',
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: '#FDE68A',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image
                        source={{ uri: item.imageUri || 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a' }}
                        style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0F0ED' }}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#E65100' }}>
                          {item.diagnostico || 'Posible PMP'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                          {item.cultivoNombre || 'Parcela'} · {item.confianza || 90}% IA
                        </Text>
                      </View>
                      <FontAwesome name="chevron-right" size={11} color="#CCC" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Actions */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/historial')}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#1565C0',
                paddingVertical: 14,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}>
              <FontAwesome name="clipboard" size={13} color="white" />
              <Text style={{ color: 'white', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>
                Ver historial completo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVincular(true)}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#DBEAFE',
                paddingVertical: 14,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
              <FontAwesome name="user-plus" size={13} color="#1565C0" />
              <Text style={{ color: '#1565C0', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>
                Vincular agricultor
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* MODAL: Nueva Parcela */}
      <Modal visible={modalNuevoLote} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>Nueva parcela</Text>
              <TouchableOpacity onPress={() => setModalNuevoLote(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FontAwesome name="times" size={16} color="#AAA" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nombre</Text>
              <TextInput
                value={nombreLote}
                onChangeText={setNombreLote}
                placeholder="Ej: Lote El Mirador"
                placeholderTextColor="#CCC"
                style={{ backgroundColor: '#F8F8F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#EEEEE8' }}
              />
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Variedad</Text>
              <TextInput
                value={variedadLote}
                onChangeText={setVariedadLote}
                placeholder="Ej: Pastusa Suprema"
                placeholderTextColor="#CCC"
                style={{ backgroundColor: '#F8F8F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#EEEEE8' }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hectáreas</Text>
                <TextInput
                  value={hectareasLote}
                  onChangeText={setHectareasLote}
                  placeholder="2.0"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#CCC"
                  style={{ backgroundColor: '#F8F8F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#EEEEE8' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ubicación</Text>
                <TextInput
                  value={ubicacionLote}
                  onChangeText={setUbicacionLote}
                  placeholder="Pasto, Nariño"
                  placeholderTextColor="#CCC"
                  style={{ backgroundColor: '#F8F8F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#EEEEE8' }}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setModalNuevoLote(false)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E0E0DC', alignItems: 'center' }}>
                <Text style={{ color: '#888', fontWeight: '600', fontSize: 14 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCrearPrimerLote}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#2E7D32', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: Código */}
      <Modal visible={modalCodigo} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, width: '100%', padding: 28, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 }}>Código de acceso</Text>
            <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 20 }}>
              Comparte este código con tu técnico agrónomo
            </Text>
            <View style={{ backgroundColor: '#F8F8F5', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 14, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: '#EEEEE8' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', textAlign: 'center', letterSpacing: 6, color: '#2E7D32' }}>
                {codigoGenerado}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalCodigo(false)}
              style={{ backgroundColor: '#2E7D32', width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Vincular */}
      <Modal visible={modalVincular} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#1565C0' }}>Vincular agricultor</Text>
              <TouchableOpacity onPress={() => setModalVincular(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FontAwesome name="times" size={16} color="#AAA" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: '#888', marginBottom: 18 }}>
              Ingresa el código de 6 caracteres proporcionado por el agricultor.
            </Text>
            <TextInput
              value={codigoInput}
              onChangeText={setCodigoInput}
              placeholder="A7B9X2"
              autoCapitalize="characters"
              maxLength={6}
              placeholderTextColor="#CCC"
              style={{
                backgroundColor: '#F8F8F5',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 20,
                fontWeight: '700',
                textAlign: 'center',
                letterSpacing: 8,
                color: '#1565C0',
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#EEEEE8',
              }}
            />
            <TouchableOpacity
              onPress={handleVincular}
              style={{ backgroundColor: '#1565C0', width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Verificar código</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
