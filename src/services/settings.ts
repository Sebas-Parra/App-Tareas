import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { settings } from '@/db/schema';
import { DEFAULT_REMINDER_OFFSETS, normalizeOffsets } from '@/utils/reminders';

const DEFAULT_REMINDERS_KEY = 'default_reminders';

export async function getDefaultReminders(): Promise<number[]> {
  const row = await db.query.settings.findFirst({
    where: eq(settings.key, DEFAULT_REMINDERS_KEY),
  });
  if (!row) return DEFAULT_REMINDER_OFFSETS;
  try {
    const parsed: unknown = JSON.parse(row.value);
    return Array.isArray(parsed) ? normalizeOffsets(parsed.map(Number)) : DEFAULT_REMINDER_OFFSETS;
  } catch {
    return DEFAULT_REMINDER_OFFSETS;
  }
}

export async function setDefaultReminders(offsets: number[]): Promise<number[]> {
  const value = normalizeOffsets(offsets);
  await db
    .insert(settings)
    .values({ key: DEFAULT_REMINDERS_KEY, value: JSON.stringify(value) })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value) } });
  return value;
}
