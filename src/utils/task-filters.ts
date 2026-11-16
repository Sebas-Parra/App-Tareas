import { endOfDay, isSameDay } from 'date-fns';

import type { Task, TaskView } from '@/types';

export const VIEW_LABELS: Record<TaskView, string> = {
  pending: 'Pendientes',
  today: 'Hoy',
  upcoming: 'Próximas',
  overdue: 'Vencidas',
  completed: 'Completadas',
};

export function isOverdue(task: Pick<Task, 'dueAt' | 'completed'>, now = new Date()): boolean {
  return !task.completed && task.dueAt < now.getTime();
}

export function filterTasks(tasks: Task[], view: TaskView, now = new Date()): Task[] {
  const nowMs = now.getTime();
  const todayEnd = endOfDay(now).getTime();

  const result = tasks.filter((t) => {
    switch (view) {
      case 'pending':
        return !t.completed;
      case 'today':
        return !t.completed && isSameDay(t.dueAt, now);
      case 'upcoming':
        return !t.completed && t.dueAt > todayEnd;
      case 'overdue':
        return !t.completed && t.dueAt < nowMs;
      case 'completed':
        return t.completed;
    }
  });

  // Completadas: las más recientes primero. El resto: la entrega más cercana primero.
  return view === 'completed'
    ? result.sort((a, b) => b.updatedAt - a.updatedAt)
    : result.sort((a, b) => a.dueAt - b.dueAt);
}

export function countByView(tasks: Task[], now = new Date()): Record<TaskView, number> {
  const views: TaskView[] = ['pending', 'today', 'upcoming', 'overdue', 'completed'];
  return Object.fromEntries(views.map((v) => [v, filterTasks(tasks, v, now).length])) as Record<
    TaskView,
    number
  >;
}
