import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatOffsetShort,
  normalizeOffsets,
  REMINDER_PRESETS,
  REMINDER_UNITS,
  type ReminderUnit,
  toMinutes,
} from '@/utils/reminders';

import { Chip } from './chip';

type Props = {
  value: number[];
  onChange: (offsets: number[]) => void;
};

export function ReminderPicker({ value, onChange }: Props) {
  const colors = useTheme();
  const [showCustom, setShowCustom] = useState(false);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<ReminderUnit>('hours');

  const selected = normalizeOffsets(value);
  const customOffsets = selected.filter((o) => !REMINDER_PRESETS.includes(o));
  const parsedAmount = Number(amount.replace(',', '.'));
  const canAdd = amount.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0;

  function toggle(offset: number) {
    onChange(
      selected.includes(offset) ? selected.filter((o) => o !== offset) : [...selected, offset]
    );
  }

  function addCustom() {
    if (!canAdd) return;
    onChange(normalizeOffsets([...selected, toMinutes(parsedAmount, unit)]));
    setAmount('');
    setShowCustom(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {REMINDER_PRESETS.map((offset) => (
          <Chip
            key={offset}
            label={formatOffsetShort(offset)}
            accessibilityLabel={`${formatOffsetShort(offset)} antes`}
            selected={selected.includes(offset)}
            onPress={() => toggle(offset)}
          />
        ))}
        {customOffsets.map((offset) => (
          <Chip
            key={`custom-${offset}`}
            label={`${formatOffsetShort(offset)}  ×`}
            accessibilityLabel={`Quitar recordatorio de ${formatOffsetShort(offset)}`}
            selected
            onPress={() => toggle(offset)}
          />
        ))}
        <Chip
          label="Personalizado"
          selected={showCustom}
          onPress={() => setShowCustom((v) => !v)}
        />
      </View>

      {showCustom ? (
        <View style={[styles.custom, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.customRow}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Cantidad"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Cantidad de tiempo antes"
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              onSubmitEditing={addCustom}
            />
            <Pressable
              onPress={addCustom}
              disabled={!canAdd}
              accessibilityRole="button"
              accessibilityLabel="Agregar recordatorio personalizado"
              style={[styles.addButton, { backgroundColor: colors.primary, opacity: canAdd ? 1 : 0.4 }]}>
              <Ionicons name="add" size={22} color={colors.onPrimary} />
            </Pressable>
          </View>
          <View style={styles.chips}>
            {REMINDER_UNITS.map((u) => (
              <Chip
                key={u.value}
                label={u.label}
                selected={unit === u.value}
                onPress={() => setUnit(u.value)}
              />
            ))}
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>antes de la entrega</Text>
        </View>
      ) : null}

      {selected.length === 0 ? (
        <Text style={[styles.hint, { color: colors.warning }]}>
          Sin recordatorios: esta tarea no enviará notificaciones.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  custom: {
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  customRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 13,
  },
});
