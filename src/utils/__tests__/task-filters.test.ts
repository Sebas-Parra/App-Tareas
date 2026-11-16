import type { Task } from '@/types';

import { countByView, filterTasks, isOverdue } from '../task-filters';

const now = new Date('2026-12-10T12:00:00');

function task(id: string, dueAt: string, completed = false, updatedAt = 0): Task {
  return {
    id,
    title: id,
    description: null,
    dueAt: new Date(dueAt).getTime(),
    completed,
    createdAt: 0,
    updatedAt,
    reminders: [],
  };
}

const tasks = [
  task('vencida', '2026-12-09T10:00:00'),
  task('hoy-pasada', '2026-12-10T08:00:00'),
  task('hoy', '2026-12-10T20:00:00'),
  task('manana', '2026-12-11T09:00:00'),
  task('semana', '2026-12-17T09:00:00'),
  task('hecha-1', '2026-12-12T09:00:00', true, 100),
  task('hecha-2', '2026-12-08T09:00:00', true, 200),
];

const ids = (list: Task[]) => list.map((t) => t.id);

describe('filterTasks', () => {
  it('pendientes: todas las no completadas, la más cercana primero', () => {
    expect(ids(filterTasks(tasks, 'pending', now))).toEqual([
      'vencida',
      'hoy-pasada',
      'hoy',
      'manana',
      'semana',
    ]);
  });

  it('hoy: entregas del día actual', () => {
    expect(ids(filterTasks(tasks, 'today', now))).toEqual(['hoy-pasada', 'hoy']);
  });

  it('próximas: después de hoy', () => {
    expect(ids(filterTasks(tasks, 'upcoming', now))).toEqual(['manana', 'semana']);
  });

  it('vencidas: fecha pasada y sin completar', () => {
    expect(ids(filterTasks(tasks, 'overdue', now))).toEqual(['vencida', 'hoy-pasada']);
  });

  it('completadas: la modificada más recientemente primero', () => {
    expect(ids(filterTasks(tasks, 'completed', now))).toEqual(['hecha-2', 'hecha-1']);
  });
});

describe('countByView', () => {
  it('cuenta cada vista', () => {
    expect(countByView(tasks, now)).toEqual({
      pending: 5,
      today: 2,
      upcoming: 2,
      overdue: 2,
      completed: 2,
    });
  });
});

describe('isOverdue', () => {
  it('una tarea completada nunca está vencida', () => {
    expect(isOverdue(task('x', '2026-12-01T00:00:00', true), now)).toBe(false);
    expect(isOverdue(task('y', '2026-12-01T00:00:00'), now)).toBe(true);
  });
});
