import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  createTaskSchema,
  DESCRIPTION_MAX,
  TITLE_MAX,
  type TaskFormValues,
} from '@/utils/task-schema';

import { Button } from './button';
import { DateTimeField } from './date-time-field';
import { ReminderPicker } from './reminder-picker';

type Props = {
  initialValues: TaskFormValues;
  /** Fecha original al editar: se permite conservarla aunque ya haya pasado. */
  originalDueAt?: number;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  /** Contenido extra bajo el botón principal (completar / eliminar). */
  footer?: ReactNode;
};

export function TaskForm({ initialValues, originalDueAt, submitLabel, onSubmit, footer }: Props) {
  const colors = useTheme();
  const schema = useMemo(() => createTaskSchema({ originalDueAt }), [originalDueAt]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  const inputStyle = [
    styles.input,
    { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Field label="Título" error={errors.title?.message}>
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Ej. Entregar informe de laboratorio"
              placeholderTextColor={colors.textSecondary}
              maxLength={TITLE_MAX}
              accessibilityLabel="Título"
              style={[inputStyle, errors.title && { borderColor: colors.danger }]}
              returnKeyType="next"
            />
          )}
        />
      </Field>

      <Field label="Descripción (opcional)" error={errors.description?.message}>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Detalles, enlaces, materiales..."
              placeholderTextColor={colors.textSecondary}
              maxLength={DESCRIPTION_MAX}
              multiline
              accessibilityLabel="Descripción"
              style={[inputStyle, styles.multiline]}
            />
          )}
        />
      </Field>

      <Field label="Fecha y hora de entrega" error={errors.dueAt?.message}>
        <Controller
          control={control}
          name="dueAt"
          render={({ field }) => (
            <DateTimeField value={field.value} onChange={field.onChange} minimumDate={new Date()} />
          )}
        />
      </Field>

      <Field label="Recordatorios" error={errors.reminderOffsets?.message}>
        <Controller
          control={control}
          name="reminderOffsets"
          render={({ field }) => <ReminderPicker value={field.value} onChange={field.onChange} />}
        />
      </Field>

      <View style={styles.actions}>
        <Button title={submitLabel} onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
        {footer}
      </View>
    </ScrollView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const colors = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {children}
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: 48,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    minHeight: 48,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 13,
  },
  actions: {
    gap: Spacing.md,
  },
});
