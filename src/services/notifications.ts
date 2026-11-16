import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { formatOffset, getTriggerDate, shouldSchedule } from '@/utils/reminders';

export const REMINDER_CHANNEL_ID = 'reminders';

/**
 * iOS solo permite 64 notificaciones locales programadas a la vez.
 * Android admite más, pero también tiene un tope de alarmas por app (~500).
 */
export const MAX_SCHEDULED = Platform.OS === 'ios' ? 64 : 400;

type SchedulableTask = { id: string; title: string; dueAt: Date | number };

/** Muestra las notificaciones aunque la app esté en primer plano. */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Android exige un canal antes de mostrar notificaciones. */
export async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') return;
  try {
    // Sin `sound`: Android usa el sonido por defecto. En el canal, `sound` es el nombre
    // de un archivo propio; con 'default' busca un recurso que no existe y falla.
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Recordatorios de tareas',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });
  } catch (error) {
    // Si el canal falla, no se debe bloquear el resto del arranque (permisos, avisos).
    console.warn('No se pudo crear el canal de notificaciones', error);
  }
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/** Pide permiso si aún no se ha concedido. Devuelve true si se puede notificar. */
export async function requestPermissions(): Promise<boolean> {
  // En Android 13+ el canal debe existir antes de pedir POST_NOTIFICATIONS.
  await ensureNotificationChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

export async function scheduleReminder(
  task: SchedulableTask,
  offsetMinutes: number
): Promise<string | null> {
  if (!shouldSchedule(task.dueAt, offsetMinutes)) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tarea próxima a vencer',
        body:
          offsetMinutes === 0
            ? `"${task.title}" vence ahora.`
            : `"${task.title}" vence ${formatOffset(offsetMinutes)}.`,
        data: { taskId: task.id },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: getTriggerDate(task.dueAt, offsetMinutes),
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  } catch (error) {
    // Por ejemplo, si se superó el límite de iOS. Se reintentará al abrir la app.
    console.warn('No se pudo programar el recordatorio', error);
    return null;
  }
}

export async function cancelReminder(notificationId: string | null | undefined) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Puede que ya se haya disparado o cancelado; no es un error.
  }
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}

/** Extrae el taskId de la respuesta a una notificación (cuando el usuario la toca). */
export function getTaskIdFromResponse(
  response: Notifications.NotificationResponse | null | undefined
): string | null {
  const taskId = response?.notification.request.content.data?.taskId;
  return typeof taskId === 'string' ? taskId : null;
}
