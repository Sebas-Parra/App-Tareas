import { create } from 'zustand';

import * as settingsService from '@/services/settings';
import { DEFAULT_REMINDER_OFFSETS } from '@/utils/reminders';

type SettingsState = {
  defaultReminders: number[];
  load: () => Promise<void>;
  setDefaultReminders: (offsets: number[]) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultReminders: DEFAULT_REMINDER_OFFSETS,

  load: async () => {
    set({ defaultReminders: await settingsService.getDefaultReminders() });
  },

  setDefaultReminders: async (offsets) => {
    set({ defaultReminders: await settingsService.setDefaultReminders(offsets) });
  },
}));
