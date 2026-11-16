import { isBefore, subMinutes } from 'date-fns';

export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = 1440;
export const MINUTES_PER_WEEK = 10080;

/** Recordatorio por defecto: 1 día antes */
export const DEFAULT_REMINDER_OFFSETS = [MINUTES_PER_DAY];

export const REMINDER_PRESETS: number[] = [
  5,
  15,
  30,
  60,
  3 * MINUTES_PER_HOUR,
  12 * MINUTES_PER_HOUR,
  MINUTES_PER_DAY,
  2 * MINUTES_PER_DAY,
  MINUTES_PER_WEEK,
];

export type ReminderUnit = 'minutes' | 'hours' | 'days' | 'weeks';

export const REMINDER_UNITS: { value: ReminderUnit; label: string }[] = [
  { value: 'minutes', label: 'min' },
  { value: 'hours', label: 'horas' },
  { value: 'days', label: 'días' },
  { value: 'weeks', label: 'semanas' },
];

const UNIT_MINUTES: Record<ReminderUnit, number> = {
  minutes: 1,
  hours: MINUTES_PER_HOUR,
  days: MINUTES_PER_DAY,
  weeks: MINUTES_PER_WEEK,
};

export function toMinutes(amount: number, unit: ReminderUnit): number {
  return Math.round(amount * UNIT_MINUTES[unit]);
}

/** Momento en que debe sonar un recordatorio. */
export function getTriggerDate(dueAt: Date | number, offsetMinutes: number): Date {
  return subMinutes(dueAt, offsetMinutes);
}

/** Un recordatorio solo se programa si su momento aún no ha pasado. */
export function shouldSchedule(
  dueAt: Date | number,
  offsetMinutes: number,
  now: Date = new Date()
): boolean {
  return !isBefore(getTriggerDate(dueAt, offsetMinutes), now);
}

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/** Etiqueta corta: "1 día", "3 h", "30 min", "1 semana". */
export function formatOffsetShort(min: number): string {
  if (min > 0 && min % MINUTES_PER_WEEK === 0) {
    return plural(min / MINUTES_PER_WEEK, 'semana', 'semanas');
  }
  if (min > 0 && min % MINUTES_PER_DAY === 0) {
    return plural(min / MINUTES_PER_DAY, 'día', 'días');
  }
  if (min > 0 && min % MINUTES_PER_HOUR === 0) return `${min / MINUTES_PER_HOUR} h`;
  return `${min} min`;
}

/** Texto para el cuerpo de la notificación: "vence en 1 día". */
export function formatOffset(min: number): string {
  if (min <= 0) return 'ahora';
  if (min % MINUTES_PER_WEEK === 0) {
    return `en ${plural(min / MINUTES_PER_WEEK, 'semana', 'semanas')}`;
  }
  if (min % MINUTES_PER_DAY === 0) return `en ${plural(min / MINUTES_PER_DAY, 'día', 'días')}`;
  if (min % MINUTES_PER_HOUR === 0) {
    return `en ${plural(min / MINUTES_PER_HOUR, 'hora', 'horas')}`;
  }
  return `en ${plural(min, 'minuto', 'minutos')}`;
}

/** Quita duplicados y valores inválidos, y ordena de mayor a menor anticipación. */
export function normalizeOffsets(offsets: number[]): number[] {
  return [...new Set(offsets.filter((o) => Number.isInteger(o) && o >= 0))].sort(
    (a, b) => b - a
  );
}
