import * as Notifications from 'expo-notifications';

import { cancelReminder, getTaskIdFromResponse, scheduleReminder } from '../notifications';

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(async () => 'notif-1'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { HIGH: 4 },
}));

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const cancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;

const NOW = new Date('2026-12-10T12:00:00');

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  schedule.mockClear();
  cancel.mockClear();
});

afterEach(() => jest.useRealTimers());

const task = { id: 't1', title: 'Informe', dueAt: new Date('2026-12-12T18:00:00') };

describe('scheduleReminder', () => {
  it('programa en due_at - offset y devuelve el notification_id', async () => {
    const id = await scheduleReminder(task, 1440);

    expect(id).toBe('notif-1');
    expect(schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: '"Informe" vence en 1 día.',
          data: { taskId: 't1' },
        }),
        trigger: expect.objectContaining({
          type: 'date',
          date: new Date('2026-12-11T18:00:00'),
          channelId: 'reminders',
        }),
      })
    );
  });

  it('omite los recordatorios cuyo momento ya pasó', async () => {
    const id = await scheduleReminder(task, 3 * 1440);
    expect(id).toBeNull();
    expect(schedule).not.toHaveBeenCalled();
  });

  it('devuelve null si el sistema rechaza la notificación', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    schedule.mockRejectedValueOnce(new Error('limit'));
    expect(await scheduleReminder(task, 60)).toBeNull();
    warn.mockRestore();
  });
});

describe('cancelReminder', () => {
  it('cancela por id', async () => {
    await cancelReminder('notif-1');
    expect(cancel).toHaveBeenCalledWith('notif-1');
  });

  it('ignora ids vacíos', async () => {
    await cancelReminder(null);
    expect(cancel).not.toHaveBeenCalled();
  });
});

describe('getTaskIdFromResponse', () => {
  it('extrae el taskId de los datos de la notificación', () => {
    const response = {
      notification: { request: { content: { data: { taskId: 't1' } } } },
    } as unknown as Notifications.NotificationResponse;
    expect(getTaskIdFromResponse(response)).toBe('t1');
    expect(getTaskIdFromResponse(null)).toBeNull();
  });
});
