import { and, eq, isNotNull } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import { reminders, tasks } from '@/db/schema';
import type { Task, TaskInput } from '@/types';
import { getTriggerDate, normalizeOffsets, shouldSchedule } from '@/utils/reminders';

import {
  cancelAllReminders,
  cancelReminder,
  MAX_SCHEDULED,
  scheduleReminder,
} from './notifications';

export async function listTasks(): Promise<Task[]> {
  return db.query.tasks.findMany({ with: { reminders: true } });
}

export async function getTask(id: string): Promise<Task | undefined> {
  return db.query.tasks.findFirst({ where: eq(tasks.id, id), with: { reminders: true } });
}

/** Cancela las notificaciones programadas de una tarea y limpia sus IDs. */
async function cancelTaskNotifications(taskId: string) {
  const rows = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.taskId, taskId), isNotNull(reminders.notificationId)));
  await Promise.all(rows.map((r) => cancelReminder(r.notificationId)));
  await db.update(reminders).set({ notificationId: null }).where(eq(reminders.taskId, taskId));
}

/** Programa cada recordatorio de la tarea y guarda el notification_id devuelto. */
async function scheduleTaskNotifications(task: Task) {
  if (task.completed) return;
  for (const reminder of task.reminders) {
    const notificationId = await scheduleReminder(task, reminder.offsetMinutes);
    await db.update(reminders).set({ notificationId }).where(eq(reminders.id, reminder.id));
    reminder.notificationId = notificationId;
  }
}

async function replaceReminders(taskId: string, offsets: number[]) {
  await db.delete(reminders).where(eq(reminders.taskId, taskId));
  const values = normalizeOffsets(offsets).map((offsetMinutes) => ({
    id: randomUUID(),
    taskId,
    offsetMinutes,
    notificationId: null,
  }));
  if (values.length > 0) await db.insert(reminders).values(values);
}

async function getTaskOrThrow(id: string): Promise<Task> {
  const task = await getTask(id);
  if (!task) throw new Error(`La tarea ${id} no existe`);
  return task;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const now = Date.now();
  const id = randomUUID();

  await db.insert(tasks).values({
    id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    dueAt: input.dueAt.getTime(),
    completed: false,
    createdAt: now,
    updatedAt: now,
  });
  await replaceReminders(id, input.reminderOffsets);

  const task = await getTaskOrThrow(id);
  await scheduleTaskNotifications(task);
  return task;
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  await cancelTaskNotifications(id);

  await db
    .update(tasks)
    .set({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      dueAt: input.dueAt.getTime(),
      updatedAt: Date.now(),
    })
    .where(eq(tasks.id, id));
  await replaceReminders(id, input.reminderOffsets);

  const task = await getTaskOrThrow(id);
  await scheduleTaskNotifications(task);
  return task;
}

export async function setTaskCompleted(id: string, completed: boolean): Promise<Task> {
  await cancelTaskNotifications(id);
  await db.update(tasks).set({ completed, updatedAt: Date.now() }).where(eq(tasks.id, id));

  const task = await getTaskOrThrow(id);
  if (!completed) await scheduleTaskNotifications(task);
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  await cancelTaskNotifications(id);
  // ON DELETE CASCADE elimina también sus recordatorios.
  await db.delete(tasks).where(eq(tasks.id, id));
}

/**
 * Reprograma todas las notificaciones desde cero, priorizando las más cercanas.
 * Se ejecuta al abrir la app: así se respeta el límite de iOS (64) y se recuperan
 * recordatorios que no se pudieron programar antes.
 */
export async function resyncAllNotifications(): Promise<number> {
  await cancelAllReminders();
  await db.update(reminders).set({ notificationId: null });

  const now = new Date();
  const pending = (await listTasks()).filter((t) => !t.completed);

  const candidates = pending
    .flatMap((task) =>
      task.reminders
        .filter((r) => shouldSchedule(task.dueAt, r.offsetMinutes, now))
        .map((reminder) => ({
          task,
          reminder,
          at: getTriggerDate(task.dueAt, reminder.offsetMinutes).getTime(),
        }))
    )
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_SCHEDULED);

  let scheduled = 0;
  for (const { task, reminder } of candidates) {
    const notificationId = await scheduleReminder(task, reminder.offsetMinutes);
    if (notificationId) {
      scheduled++;
      await db.update(reminders).set({ notificationId }).where(eq(reminders.id, reminder.id));
    }
  }
  return scheduled;
}
