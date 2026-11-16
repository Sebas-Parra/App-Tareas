import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    /** Fecha/hora de entrega (timestamp en ms) */
    dueAt: integer('due_at').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('tasks_due_at_idx').on(t.dueAt)]
);

export const reminders = sqliteTable(
  'reminders',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    /** Minutos antes de due_at (1440 = 1 día) */
    offsetMinutes: integer('offset_minutes').notNull(),
    /** ID devuelto por expo-notifications, para poder cancelarla */
    notificationId: text('notification_id'),
  },
  (t) => [index('reminders_task_id_idx').on(t.taskId)]
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const tasksRelations = relations(tasks, ({ many }) => ({
  reminders: many(reminders),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  task: one(tasks, { fields: [reminders.taskId], references: [tasks.id] }),
}));
