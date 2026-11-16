import { addDays, setHours, setMinutes, startOfMinute } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { TaskForm } from '@/components/task-form';
import { useSettingsStore } from '@/store/settings';
import { useTasksStore } from '@/store/tasks';

/** Valor inicial: mañana a las 23:59, una hora típica de entrega. */
function defaultDueDate() {
  return startOfMinute(setMinutes(setHours(addDays(new Date(), 1), 23), 59));
}

export default function NewTaskScreen() {
  const createTask = useTasksStore((s) => s.createTask);
  const defaultReminders = useSettingsStore((s) => s.defaultReminders);
  const [initialValues] = useState(() => ({
    title: '',
    description: '',
    dueAt: defaultDueDate(),
    reminderOffsets: defaultReminders,
  }));

  return (
    <TaskForm
      initialValues={initialValues}
      submitLabel="Crear tarea"
      onSubmit={async (values) => {
        try {
          await createTask(values);
          router.back();
        } catch (e) {
          Alert.alert('No se pudo crear la tarea', String(e));
        }
      }}
    />
  );
}
