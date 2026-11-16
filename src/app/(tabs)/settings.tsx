import { useFocusEffect } from 'expo-router';
import type { PermissionStatus } from 'expo-notifications';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ReminderPicker } from '@/components/reminder-picker';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getPermissionStatus, getScheduledCount, requestPermissions } from '@/services/notifications';
import { resyncAllNotifications } from '@/services/tasks';
import { useSettingsStore } from '@/store/settings';

const PERMISSION_LABEL: Record<string, string> = {
  granted: 'Activadas',
  denied: 'Bloqueadas',
  undetermined: 'Sin configurar',
};

export default function SettingsScreen() {
  const colors = useTheme();
  const defaultReminders = useSettingsStore((s) => s.defaultReminders);
  const setDefaultReminders = useSettingsStore((s) => s.setDefaultReminders);
  const [permission, setPermission] = useState<PermissionStatus | null>(null);
  const [scheduled, setScheduled] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setPermission(await getPermissionStatus());
    setScheduled(await getScheduledCount());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function enableNotifications() {
    setBusy(true);
    try {
      const granted = await requestPermissions();
      if (granted) await resyncAllNotifications();
      else await Linking.openSettings();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function resync() {
    setBusy(true);
    try {
      await resyncAllNotifications();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <Section
        title="Recordatorios por defecto"
        description="Se aplican a las tareas nuevas. Puedes cambiarlos en cada tarea.">
        <ReminderPicker value={defaultReminders} onChange={setDefaultReminders} />
      </Section>

      <Section title="Notificaciones">
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Estado</Text>
          <Text
            style={{
              color: permission === 'granted' ? colors.success : colors.warning,
              fontWeight: '600',
            }}>
            {permission ? PERMISSION_LABEL[permission] ?? permission : '...'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Avisos programados</Text>
          <Text style={{ color: colors.textSecondary }}>{scheduled ?? '...'}</Text>
        </View>

        {permission !== 'granted' ? (
          <Button
            title="Activar notificaciones"
            onPress={enableNotifications}
            loading={busy}
          />
        ) : (
          <Button title="Reprogramar avisos" variant="secondary" onPress={resync} loading={busy} />
        )}
      </Section>

      <Text style={[styles.footer, { color: colors.textSecondary }]}>
        TaskAlert guarda tus tareas solo en este dispositivo y funciona sin internet.
      </Text>
    </ScrollView>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const colors = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 15,
  },
  footer: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
