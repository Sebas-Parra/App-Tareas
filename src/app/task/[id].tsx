import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { TaskForm } from '@/components/task-form';
import { useTasksStore } from '@/store/tasks';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useTasksStore((s) => s.tasks.find((t) => t.id === id));
  const { updateTask, setCompleted, deleteTask } = useTasksStore.getState();
  const [busy, setBusy] = useState(false);

  // Se fijan al montar para que el formulario no se reinicie al guardar.
  const [initialValues] = useState(() =>
    task
      ? {
          title: task.title,
          description: task.description ?? '',
          dueAt: new Date(task.dueAt),
          reminderOffsets: task.reminders.map((r) => r.offsetMinutes),
        }
      : null
  );

  if (!task || !initialValues) {
    return <EmptyState icon="alert-circle-outline" title="Esta tarea ya no existe" />;
  }

  async function toggleCompleted() {
    if (!task) return;
    setBusy(true);
    try {
      await setCompleted(task.id, !task.completed);
      router.back();
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!task) return;
    Alert.alert('Eliminar tarea', `¿Eliminar "${task.title}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(task.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: task.completed ? 'Tarea completada' : 'Editar tarea' }} />
      <TaskForm
        initialValues={initialValues}
        originalDueAt={task.dueAt}
        submitLabel="Guardar cambios"
        onSubmit={async (values) => {
          try {
            await updateTask(task.id, values);
            router.back();
          } catch (e) {
            Alert.alert('No se pudo guardar', String(e));
          }
        }}
        footer={
          <>
            <Button
              title={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
              variant="secondary"
              onPress={toggleCompleted}
              loading={busy}
            />
            <Button title="Eliminar tarea" variant="danger" onPress={confirmDelete} />
          </>
        }
      />
    </>
  );
}
