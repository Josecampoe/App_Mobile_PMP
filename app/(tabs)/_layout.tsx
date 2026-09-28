import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

function TabIcon({ name, color, focused, label }: { name: any; color: string; focused: boolean; label: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <View
        style={{
          backgroundColor: focused ? 'rgba(56, 142, 60, 0.1)' : 'transparent',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 6,
        }}>
        <FontAwesome name={name} size={20} color={color} />
      </View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? '700' : '500',
          color: color,
          marginTop: 2,
        }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#A0A0A0',
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: '#FAFAFA',
          paddingBottom: 8,
          paddingTop: 4,
          height: 68,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} label="Inicio" />
          ),
        }}
      />
      <Tabs.Screen
        name="cultivos"
        options={{
          title: 'Cultivos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="leaf" color={color} focused={focused} label="Cultivos" />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="clipboard" color={color} focused={focused} label="Historial" />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={color} focused={focused} label="Perfil" />
          ),
        }}
      />
    </Tabs>
  );
}
