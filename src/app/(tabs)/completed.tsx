import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { TaskCard } from '@/components/task-card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTasksStore } from '@/store/tasks';
import { filterTasks } from '@/utils/task-filters';

export default function CompletedScreen() {
  const colors = useTheme();
  const tasks = useTasksStore((s) => s.tasks);
  const setCompleted = useTasksStore((s) => s.setCompleted);
  const completed = useMemo(() => filterTasks(tasks, 'completed'), [tasks]);

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={completed}
      keyExtractor={(t) => t.id}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      ListEmptyComponent={
        <EmptyState
          icon="checkmark-done-outline"
          title="Aún no completas tareas"
          message="Las tareas que marques como completadas aparecerán aquí."
        />
      }
      renderItem={({ item }) => (
        <TaskCard
          task={item}
          onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
          onToggleComplete={() => setCompleted(item.id, false)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
});
