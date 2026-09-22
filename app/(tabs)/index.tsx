import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';

export default function Inicio() {
  const router = useRouter();
  const { cultivos, analisisHistorial, perfil, setSelectedCultivoId } = useApp();

  // Saludo dinámico según la hora
  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // KPIs
  const totalCultivos = cultivos.length;
  const totalAnalisis = analisisHistorial.length;
  const alertasActivas = analisisHistorial.filter(
    (a) => a.estado === 'alerta' || a.diagnostico.includes('PMP')
  ).length;

  // Últimos 2 análisis
  const ultimosAnalisis = analisisHistorial.slice(0, 2);

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]">
      {/* 1. ENCABEZADO */}
      <View className="bg-white px-5 py-4 flex-row justify-between items-center border-b border-gray-100 shadow-sm shrink-0">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-lg bg-[#2E7D32]/10 items-center justify-center mr-2.5">
            <FontAwesome name="leaf" size={16} color="#2E7D32" />
          </View>
          <Text className="text-[#2E7D32] font-black text-xl tracking-tight">PMP Smart</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/perfil')}
          className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full active:scale-95">
          <FontAwesome name="user-circle" size={18} color="#2E7D32" />
          <Text className="text-xs font-bold text-gray-700 ml-1.5">{perfil.nombre.split(' ')[0]}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. CONTENIDO PRINCIPAL */}
      <ScrollView className="flex-1 px-4 pt-4 pb-20" showsVerticalScrollIndicator={false}>
        {/* Saludo personalizado */}
        <Text className="text-2xl font-bold text-[#263238] mb-0.5">
          {getSaludo()}, {perfil.nombre.split(' ')[0]} 👋
        </Text>
        <Text className="text-xs text-gray-500 mb-4">
          Monitoreo fitosanitario inteligente de tus cultivos de papa
        </Text>

        {/* Banner de alerta climática / fitosanitaria */}
        <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex-row items-center mb-4 shadow-sm">
          <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3 shrink-0">
            <FontAwesome name="sun-o" size={18} color="#2E7D32" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-[#2E7D32]">Condiciones para monitoreo: Óptimas</Text>
            <Text className="text-[11px] text-gray-600 mt-0.5 leading-snug">
              Buena iluminación solar en campo. Excelente momento para escanear brotes foliares.
            </Text>
          </View>
        </View>

        {/* 3. BOTÓN PRINCIPAL (Analizar Planta) */}
        <TouchableOpacity
          onPress={() => router.push('/camera')}
          className="w-full bg-[#2E7D32] rounded-2xl p-5 flex-col items-center justify-center shadow-md mb-5 active:scale-98">
          <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-2">
            <FontAwesome name="camera" size={32} color="white" />
          </View>
          <Text className="text-white text-lg font-black tracking-wider">ANALIZAR PLANTA</Text>
          <Text className="text-[#E8F5E9] text-xs text-center mt-1">
            Toma o sube una fotografía para detectar signos de Punta Morada
          </Text>
        </TouchableOpacity>

        {/* 4. RESUMEN DE ACTIVIDAD (KPIs) */}
        <View className="flex-row gap-2 mb-5">
          <View className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
            <Text className="text-lg font-black text-[#263238]">{totalCultivos}</Text>
            <Text className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Cultivos</Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
            <Text className="text-lg font-black text-[#2E7D32]">{totalAnalisis}</Text>
            <Text className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Análisis</Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
            <Text className="text-lg font-black text-[#D97706]">{alertasActivas}</Text>
            <Text className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Alertas</Text>
          </View>
        </View>

        {/* 5. SECCIÓN MIS CULTIVOS */}
        <View className="mb-5">
          <View className="flex-row justify-between items-center mb-2.5">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              TUS CULTIVOS ({cultivos.length})
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/cultivos')}>
              <Text className="text-xs text-[#2E7D32] font-bold">Ver todos →</Text>
            </TouchableOpacity>
          </View>

          {cultivos.slice(0, 3).map((cultivo) => (
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
                <View className="bg-[#E8F5E9] w-11 h-11 rounded-xl items-center justify-center mr-3">
                  <FontAwesome name="leaf" size={18} color="#2E7D32" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="font-bold text-gray-800 text-sm">{cultivo.nombre}</Text>
                    {cultivo.estadoFitosanitario === 'alerta' && (
                      <View className="ml-2 bg-red-100 px-1.5 py-0.2 rounded">
                        <Text className="text-[9px] font-bold text-red-700">Alerta</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {cultivo.variedad} · {cultivo.hectareas} Ha
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Text className="text-[11px] text-[#2E7D32] font-semibold mr-1.5">Escanear</Text>
                <FontAwesome name="chevron-right" size={12} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 6. ÚLTIMOS ANÁLISIS REALIZADOS */}
        {ultimosAnalisis.length > 0 && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2.5">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                ANÁLISIS RECIENTES
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/historial')}>
                <Text className="text-xs text-[#2E7D32] font-bold">Historial completo →</Text>
              </TouchableOpacity>
            </View>

            {ultimosAnalisis.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push('/(tabs)/historial')}
                className="bg-white rounded-2xl p-3 flex-row items-center border border-gray-100 shadow-sm mb-2.5">
                <Image
                  source={{ uri: item.imageUri }}
                  style={{ width: 46, height: 46, borderRadius: 10 }}
                  resizeMode="cover"
                  className="bg-gray-200"
                />
                <View className="flex-1 ml-3">
                  <Text
                    className={`text-xs font-bold ${
                      item.estado === 'alerta' ? 'text-[#D97706]' : 'text-[#2E7D32]'
                    }`}>
                    {item.diagnostico}
                  </Text>
                  <Text className="text-[11px] text-gray-700 font-medium">{item.cultivoNombre}</Text>
                  <Text className="text-[10px] text-gray-400">{item.fecha}</Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
