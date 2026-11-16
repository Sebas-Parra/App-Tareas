import { format, formatDistanceToNowStrict, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

/** "Hoy, 18:30" · "Mañana, 09:00" · "lun 24 nov, 14:00" */
export function formatDueDate(dueAt: Date | number): string {
  const time = format(dueAt, 'HH:mm');
  if (isToday(dueAt)) return `Hoy, ${time}`;
  if (isTomorrow(dueAt)) return `Mañana, ${time}`;
  return format(dueAt, "EEE d MMM yyyy', 'HH:mm", { locale: es });
}

/** "en 3 días" · "hace 2 horas" */
export function formatRelative(dueAt: Date | number): string {
  return formatDistanceToNowStrict(dueAt, { locale: es, addSuffix: true });
}

export function formatDate(date: Date): string {
  return format(date, "EEEE d 'de' MMMM yyyy", { locale: es });
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}
