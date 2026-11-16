import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const colors = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="completed"
        options={{
          title: 'Completadas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color as string} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
