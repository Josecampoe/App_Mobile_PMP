import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';

export default function RoleSelector() {
  const { rolActivo, setRolActivo } = useApp();

  return (
    <View className="bg-gray-100 p-1 rounded-2xl flex-row items-center border border-gray-200">
      <TouchableOpacity
        onPress={() => setRolActivo('agricultor')}
        activeOpacity={0.8}
        className={`flex-1 py-1.5 px-3 rounded-xl flex-row items-center justify-center ${
          rolActivo === 'agricultor' ? 'bg-[#2E7D32]' : 'bg-transparent'
        }`}>
        <Text className="text-xs mr-1">👨‍🌾</Text>
        <Text
          className={`text-xs font-bold ${
            rolActivo === 'agricultor' ? 'text-white' : 'text-gray-600'
          }`}>
          Agricultor
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setRolActivo('tecnico')}
        activeOpacity={0.8}
        className={`flex-1 py-1.5 px-3 rounded-xl flex-row items-center justify-center ${
          rolActivo === 'tecnico' ? 'bg-[#1565C0]' : 'bg-transparent'
        }`}>
        <Text className="text-xs mr-1">🔬</Text>
        <Text
          className={`text-xs font-bold ${
            rolActivo === 'tecnico' ? 'text-white' : 'text-gray-600'
          }`}>
          Técnico Agrónomo
        </Text>
      </TouchableOpacity>
    </View>
  );
}
