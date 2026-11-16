import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, useColorScheme, View } from 'react-native';

import migrations from '../../drizzle/migrations';
import { db } from '@/db/client';
import { useTheme } from '@/hooks/use-theme';
import {
  configureNotificationHandler,
  ensureNotificationChannel,
  getTaskIdFromResponse,
  requestPermissions,
} from '@/services/notifications';
import { resyncAllNotifications } from '@/services/tasks';
import { useSettingsStore } from '@/store/settings';
import { useTasksStore } from '@/store/tasks';

SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success || error) SplashScreen.hideAsync();
  }, [success, error]);

  if (error) return <FatalError message={error.message} />;
  if (!success) return null;
  return <App />;
}

function App() {
  const scheme = useColorScheme();
  const colors = useTheme();
  const [ready, setReady] = useState(false);
  const lastResponse = Notifications.useLastNotificationResponse();

  // Arranque: datos, canal, permisos y reprogramación de recordatorios.
  useEffect(() => {
    (async () => {
      await Promise.all([useTasksStore.getState().load(), useSettingsStore.getState().load()]);
      setReady(true);
      await ensureNotificationChannel();
      if (await requestPermissions()) await resyncAllNotifications();
    })().catch((e) => console.error('Error al iniciar la app', e));
  }, []);

  // Al volver a primer plano: refrescar vistas (vencidas, hoy...) y reprogramar.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      useTasksStore.getState().load();
      resyncAllNotifications().catch((e) => console.warn('Error al reprogramar', e));
    });
    return () => sub.remove();
  }, []);

  // Al tocar una notificación, abrir el detalle de la tarea.
  useEffect(() => {
    if (!ready || !lastResponse) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const taskId = getTaskIdFromResponse(lastResponse);
    Notifications.clearLastNotificationResponse();
    if (taskId && useTasksStore.getState().tasks.some((t) => t.id === taskId)) {
      router.push({ pathname: '/task/[id]', params: { id: taskId } });
    }
  }, [ready, lastResponse]);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="task/new"
          options={{ title: 'Nueva tarea', presentation: 'modal' }}
        />
        <Stack.Screen name="task/[id]" options={{ title: 'Tarea' }} />
      </Stack>
    </ThemeProvider>
  );
}

function FatalError({ message }: { message: string }) {
  const colors = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={[styles.errorTitle, { color: colors.text }]}>
        No se pudo abrir la base de datos
      </Text>
      <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
