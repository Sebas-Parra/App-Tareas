import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Task } from '@/types';
import { formatDueDate, formatRelative } from '@/utils/format';
import { formatOffsetShort } from '@/utils/reminders';
import { isOverdue } from '@/utils/task-filters';

type Props = {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
};

export function TaskCard({ task, onPress, onToggleComplete }: Props) {
  const colors = useTheme();
  const overdue = isOverdue(task);
  const offsets = [...task.reminders].sort((a, b) => b.offsetMinutes - a.offsetMinutes);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Tarea ${task.title}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Pressable
        onPress={onToggleComplete}
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}>
        <Ionicons
          name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={task.completed ? colors.success : colors.textSecondary}
        />
      </Pressable>

      <View style={styles.body}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            { color: task.completed ? colors.textSecondary : colors.text },
            task.completed && styles.titleDone,
          ]}>
          {task.title}
        </Text>

        <View style={styles.row}>
          <Ionicons
            name="time-outline"
            size={14}
            color={overdue ? colors.danger : colors.textSecondary}
          />
          <Text style={[styles.meta, { color: overdue ? colors.danger : colors.textSecondary }]}>
            {formatDueDate(task.dueAt)}
            {!task.completed ? ` · ${overdue ? 'venció ' : 'vence '}${formatRelative(task.dueAt)}` : ''}
          </Text>
        </View>

        {!task.completed && offsets.length > 0 ? (
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {offsets.map((r) => formatOffsetShort(r.offsetMinutes)).join(', ')} antes
            </Text>
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  body: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  meta: {
    fontSize: 13,
    flexShrink: 1,
  },
});
