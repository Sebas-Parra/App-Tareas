import { create } from 'zustand';

import * as tasksService from '@/services/tasks';
import type { Task, TaskInput } from '@/types';

type TasksState = {
  tasks: Task[];
  loaded: boolean;
  load: () => Promise<void>;
  createTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: string, input: TaskInput) => Promise<Task>;
  setCompleted: (id: string, completed: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
};

function upsert(list: Task[], task: Task): Task[] {
  const exists = list.some((t) => t.id === task.id);
  return exists ? list.map((t) => (t.id === task.id ? task : t)) : [...list, task];
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  loaded: false,

  load: async () => {
    const tasks = await tasksService.listTasks();
    set({ tasks, loaded: true });
  },

  createTask: async (input) => {
    const task = await tasksService.createTask(input);
    set((s) => ({ tasks: upsert(s.tasks, task) }));
    return task;
  },

  updateTask: async (id, input) => {
    const task = await tasksService.updateTask(id, input);
    set((s) => ({ tasks: upsert(s.tasks, task) }));
    return task;
  },

  setCompleted: async (id, completed) => {
    const task = await tasksService.setTaskCompleted(id, completed);
    set((s) => ({ tasks: upsert(s.tasks, task) }));
  },

  deleteTask: async (id) => {
    await tasksService.deleteTask(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },
}));
