import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { TaskCard } from '@/components/task-card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTasksStore } from '@/store/tasks';
import type { TaskView } from '@/types';
import { countByView, filterTasks, VIEW_LABELS } from '@/utils/task-filters';

const VIEWS: TaskView[] = ['pending', 'today', 'upcoming', 'overdue'];

const EMPTY: Record<TaskView, { title: string; message: string }> = {
  pending: { title: 'No tienes tareas pendientes', message: 'Toca + para crear tu primera tarea.' },
  today: { title: 'Nada para hoy', message: 'No hay entregas programadas para hoy.' },
  upcoming: { title: 'Sin tareas próximas', message: 'No hay entregas después de hoy.' },
  overdue: { title: 'Sin tareas vencidas', message: 'Vas al día con tus entregas.' },
  completed: { title: '', message: '' },
};

export default function TasksScreen() {
  const colors = useTheme();
  const tasks = useTasksStore((s) => s.tasks);
  const setCompleted = useTasksStore((s) => s.setCompleted);
  const [view, setView] = useState<TaskView>('pending');

  const visible = useMemo(() => filterTasks(tasks, view), [tasks, view]);
  const counts = useMemo(() => countByView(tasks), [tasks]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {VIEWS.map((v) => (
            <Chip
              key={v}
              label={`${VIEW_LABELS[v]} ${counts[v]}`}
              selected={view === v}
              onPress={() => setView(v)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState icon="calendar-clear-outline" {...EMPTY[view]} />
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
            onToggleComplete={() => setCompleted(item.id, !item.completed)}
          />
        )}
      />

      <Pressable
        onPress={() => router.push('/task/new')}
        accessibilityRole="button"
        accessibilityLabel="Nueva tarea"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 96,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
