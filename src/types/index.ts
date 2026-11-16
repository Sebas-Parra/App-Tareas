import type { reminders, tasks } from '@/db/schema';

export type TaskRow = typeof tasks.$inferSelect;
export type ReminderRow = typeof reminders.$inferSelect;

export type Task = TaskRow & { reminders: ReminderRow[] };

export type TaskInput = {
  title: string;
  description?: string | null;
  dueAt: Date;
  /** Minutos antes de la entrega para cada recordatorio */
  reminderOffsets: number[];
};

export type TaskView = 'pending' | 'today' | 'upcoming' | 'overdue' | 'completed';
