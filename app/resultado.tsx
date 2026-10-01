import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { analisisApi } from '../lib/api';

export default function ResultadoScreen() {
  const router = useRouter();
  const { cultivoId, cultivoNombre } = useLocalSearchParams<{
    cultivoId?: string;
    cultivoNombre?: string;
  }>();

  const { addAnalisis, cultivos, currentImageB64 } = useApp();
  const [isSaving, setIsSaving] = useState(false);

  const displayImageUri = currentImageB64 ? `data:image/jpeg;base64,${currentImageB64}` : 'https://images.unsplash.com/photo-1555431189-0ab279e2be3a';

  const targetCultivo =
    cultivos.find((c) => c.id === cultivoId) ||
    cultivos[0] || { id: 'lote-general', nombre: cultivoNombre || 'Muestra de Campo' };

  const finalCultivoNombre = cultivoNombre || targetCultivo.nombre;
  const finalCultivoId = cultivoId || targetCultivo.id;

  const [isProcessing, setIsProcessing] = useState(true);
  const [aiData, setAiData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const resultFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const procesarIA = async () => {
      try {
        const res = await analisisApi.procesar(displayImageUri);
        if (res.success && res.data) {
          setAiData(res.data);
        } else {
          setApiError(res.error || 'La IA no pudo procesar la imagen.');
        }
      } catch (err) {
        setApiError('Problema de conexión con la IA.');
      } finally {
        setIsProcessing(false);
        Animated.timing(resultFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      }
    };
    procesarIA();
  }, []);

  const sintomasDetectados = aiData?.sintomas || [
    'Coloración rojiza/púrpura en foliolos apicales superiores',
    'Foliolos con enrollamiento hacia el haz (formación en cuchara)',
    'Acortamiento de entrenudos y engrosamiento leve en nudos',
  ];

  const recomendacionesAgro = aiData?.recomendaciones || [
    'Instalar trampas cromáticas amarillas perimetrales para capturar el psílido vector.',
    'Aislar e inspeccionar las plantas adyacentes en un radio de 5 a 10 metros.',
    'No emplear tubérculos de lotes sospechosos como semilla para futuros ciclos.',
    'Solicitar dictamen técnico a un agrónomo para formular plan de control fitosanitario.',
  ];

  const diagnosticoTexto = aiData?.diagnostico || 'POSIBLE PMP';
  const confianzaNum = aiData?.confianza || 91;
  const estadoVisual = aiData?.estado || 'alerta';

  const handleGuardar = (solicitarRevision: boolean) => {
    try {
      setIsSaving(true);
      addAnalisis({
        cultivoId: finalCultivoId,
        cultivoNombre: finalCultivoNombre,
        imageUri: displayImageUri,
        diagnostico: diagnosticoTexto,
        estado: estadoVisual,
        severidad: aiData?.severidad || 'moderada',
        confianza: confianzaNum,
        sintomas: sintomasDetectados,
        recomendaciones: recomendacionesAgro,
        estadoRevision: solicitarRevision ? 'pendiente' : 'sin_solicitar',
        notas: `Análisis fitosanitario en ${finalCultivoNombre}.`,
      });

      Alert.alert(
        solicitarRevision ? 'Enviado a revisión' : 'Guardado',
        solicitarRevision
          ? `El análisis fue enviado al técnico agrónomo para su dictamen.`
          : `El diagnóstico quedó registrado en tu historial.`,
        [{ text: 'Ver historial', onPress: () => router.push('/(tabs)/historial') }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el análisis.');
    } finally {
      setIsSaving(false);
    }
  };

  const isAlerta = estadoVisual === 'alerta';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FontAwesome name="chevron-left" size={12} color="#888" />
          <Text style={{ color: '#888', fontSize: 13, marginLeft: 8, fontWeight: '500' }}>Volver</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>Resultado</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Image */}
          <View
            style={{
              height: 200,
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: 20,
              backgroundColor: '#1A1A1A',
            }}>
            <Image
              source={{ uri: displayImageUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                backgroundColor: 'rgba(0,0,0,0.6)',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
              }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
                {finalCultivoNombre}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Loading / Error / Result */}
        <Animated.View style={{ opacity: isProcessing ? fadeAnim : resultFade }}>
          {isProcessing ? (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 32,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#F0F0ED',
                marginBottom: 16,
              }}>
              <ActivityIndicator size="large" color="#388E3C" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#388E3C', marginTop: 16 }}>
                Analizando imagen...
              </Text>
              <Text style={{ fontSize: 11, color: '#AAA', marginTop: 4 }}>
                Buscando patrones de Punta Morada
              </Text>
            </View>
          ) : apiError ? (
            <View
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 16,
                padding: 24,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#FECACA',
                marginBottom: 16,
              }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                <FontAwesome name="exclamation-triangle" size={20} color="#DC2626" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#991B1B', marginBottom: 6 }}>
                Error en el análisis
              </Text>
              <Text style={{ fontSize: 12, color: '#7F1D1D', textAlign: 'center', lineHeight: 18 }}>
                {apiError}
              </Text>
            </View>
          ) : (
            <>
              {/* Diagnosis Card */}
              <View
                style={{
                  backgroundColor: isAlerta ? '#FFFBEB' : '#F0FDF4',
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isAlerta ? '#FDE68A' : '#BBF7D0',
                  marginBottom: 16,
                }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: isAlerta ? '#FEF3C7' : '#DCFCE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                  <FontAwesome
                    name={isAlerta ? 'exclamation-triangle' : 'check'}
                    size={20}
                    color={isAlerta ? '#D97706' : '#16A34A'}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: isAlerta ? '#92400E' : '#166534',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                  {diagnosticoTexto}
                </Text>
                <View
                  style={{
                    backgroundColor: isAlerta ? 'rgba(217, 119, 6, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 20,
                    marginBottom: 12,
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isAlerta ? '#B45309' : '#15803D' }}>
                    {confianzaNum}% coincidencia
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: isAlerta ? '#78350F' : '#14532D', textAlign: 'center', lineHeight: 18 }}>
                  {isAlerta
                    ? 'Se detectaron patrones compatibles con Punta Morada. Solicita una revisión técnica para confirmar.'
                    : 'No se detectaron patrones de Punta Morada. Mantén el monitoreo periódico.'}
                </Text>
              </View>

              {/* Symptoms */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: '#F0F0ED',
                  marginBottom: 12,
                }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  Patrones identificados
                </Text>
                {sintomasDetectados.map((sintoma: string, idx: number) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: isAlerta ? '#D97706' : '#16A34A',
                        marginTop: 5,
                        marginRight: 10,
                      }}
                    />
                    <Text style={{ fontSize: 12, color: '#555', flex: 1, lineHeight: 17 }}>{sintoma}</Text>
                  </View>
                ))}
              </View>

              {/* Recommendations */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: '#F0F0ED',
                  marginBottom: 16,
                }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  Recomendaciones
                </Text>
                {recomendacionesAgro.map((rec: string, idx: number) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#388E3C', marginRight: 8, width: 16 }}>
                      {idx + 1}.
                    </Text>
                    <Text style={{ fontSize: 12, color: '#555', flex: 1, lineHeight: 17 }}>{rec}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions */}
      <View
        style={{
          backgroundColor: '#FAFAF7',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 28,
          borderTopWidth: 1,
          borderTopColor: '#F0F0ED',
        }}>
        <TouchableOpacity
          onPress={() => handleGuardar(true)}
          disabled={isSaving || isProcessing || !!apiError}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#1565C0',
            borderRadius: 14,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            opacity: isSaving || isProcessing || !!apiError ? 0.4 : 1,
          }}>
          <FontAwesome name="paper-plane" size={13} color="white" />
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 13, marginLeft: 8 }}>
            {isSaving ? 'Guardando...' : 'Guardar y solicitar revisión'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleGuardar(false)}
          disabled={isSaving || isProcessing || !!apiError}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#2E7D32',
            borderRadius: 14,
            paddingVertical: 13,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            opacity: isSaving || isProcessing || !!apiError ? 0.4 : 1,
          }}>
          <FontAwesome name="save" size={13} color="white" />
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 13, marginLeft: 8 }}>
            Solo guardar en historial
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={isSaving || isProcessing}
          style={{ paddingVertical: 8, alignItems: 'center' }}>
          <Text style={{ color: '#AAA', fontWeight: '500', fontSize: 12 }}>Descartar y tomar otra</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
