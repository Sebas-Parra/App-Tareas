import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatTime } from '@/utils/format';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
};

/** Combina una fecha nueva conservando la hora (o al revés). */
function merge(base: Date, picked: Date, part: 'date' | 'time'): Date {
  const next = new Date(base);
  if (part === 'date') {
    next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  } else {
    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  }
  return next;
}

export function DateTimeField({ value, onChange, minimumDate }: Props) {
  const colors = useTheme();
  const scheme = useColorScheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.iosRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        <DateTimePicker
          value={value}
          mode="datetime"
          display="compact"
          minimumDate={minimumDate}
          minuteInterval={5}
          locale="es-ES"
          accentColor={colors.primary}
          themeVariant={scheme === 'dark' ? 'dark' : 'light'}
          onValueChange={(_, date) => onChange(date)}
        />
      </View>
    );
  }

  // Android: el selector es un diálogo; se abre fecha y hora por separado.
  const openPicker = (mode: 'date' | 'time') =>
    DateTimePickerAndroid.open({
      value,
      mode,
      is24Hour: true,
      minimumDate: mode === 'date' ? minimumDate : undefined,
      onValueChange: (_, date) => onChange(merge(value, date, mode)),
    });

  return (
    <View style={styles.androidRow}>
      <FieldButton
        icon="calendar-outline"
        label={formatDate(value)}
        accessibilityLabel="Cambiar fecha de entrega"
        onPress={() => openPicker('date')}
        flex={2}
      />
      <FieldButton
        icon="time-outline"
        label={formatTime(value)}
        accessibilityLabel="Cambiar hora de entrega"
        onPress={() => openPicker('time')}
        flex={1}
      />
    </View>
  );
}

function FieldButton({
  icon,
  label,
  accessibilityLabel,
  onPress,
  flex,
}: {
  icon: 'calendar-outline' | 'time-outline';
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  flex: number;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.field,
        { flex, backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text style={[styles.fieldText, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  androidRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  fieldText: {
    fontSize: 15,
    flexShrink: 1,
  },
});
