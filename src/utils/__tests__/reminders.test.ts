import {
  formatOffset,
  formatOffsetShort,
  getTriggerDate,
  MINUTES_PER_DAY,
  MINUTES_PER_WEEK,
  normalizeOffsets,
  shouldSchedule,
  toMinutes,
} from '../reminders';

const due = new Date('2026-12-10T18:00:00');

describe('getTriggerDate', () => {
  it.each([
    [MINUTES_PER_DAY, '2026-12-09T18:00:00'],
    [MINUTES_PER_WEEK, '2026-12-03T18:00:00'],
    [180, '2026-12-10T15:00:00'],
    [30, '2026-12-10T17:30:00'],
    [0, '2026-12-10T18:00:00'],
  ])('offset de %i minutos', (offset, expected) => {
    expect(getTriggerDate(due, offset)).toEqual(new Date(expected));
  });

  it('acepta timestamps en ms', () => {
    expect(getTriggerDate(due.getTime(), 60)).toEqual(new Date('2026-12-10T17:00:00'));
  });
});

describe('shouldSchedule', () => {
  const now = new Date('2026-12-10T12:00:00');

  it('no programa recordatorios en el pasado', () => {
    expect(shouldSchedule(due, MINUTES_PER_DAY, now)).toBe(false);
    expect(shouldSchedule(due, 7 * 60, now)).toBe(false);
  });

  it('programa recordatorios futuros', () => {
    expect(shouldSchedule(due, 3 * 60, now)).toBe(true);
    expect(shouldSchedule(due, 0, now)).toBe(true);
  });

  it('programa si el momento coincide exactamente con ahora', () => {
    expect(shouldSchedule(due, 6 * 60, now)).toBe(true);
  });
});

describe('toMinutes', () => {
  it('convierte cada unidad', () => {
    expect(toMinutes(45, 'minutes')).toBe(45);
    expect(toMinutes(3, 'hours')).toBe(180);
    expect(toMinutes(2, 'days')).toBe(2880);
    expect(toMinutes(1, 'weeks')).toBe(10080);
    expect(toMinutes(1.5, 'hours')).toBe(90);
  });
});

describe('formato', () => {
  it('formatOffsetShort', () => {
    expect(formatOffsetShort(30)).toBe('30 min');
    expect(formatOffsetShort(180)).toBe('3 h');
    expect(formatOffsetShort(1440)).toBe('1 día');
    expect(formatOffsetShort(2880)).toBe('2 días');
    expect(formatOffsetShort(10080)).toBe('1 semana');
    expect(formatOffsetShort(90)).toBe('90 min');
  });

  it('formatOffset (cuerpo de la notificación)', () => {
    expect(formatOffset(1440)).toBe('en 1 día');
    expect(formatOffset(4320)).toBe('en 3 días');
    expect(formatOffset(60)).toBe('en 1 hora');
    expect(formatOffset(120)).toBe('en 2 horas');
    expect(formatOffset(1)).toBe('en 1 minuto');
    expect(formatOffset(30)).toBe('en 30 minutos');
    expect(formatOffset(20160)).toBe('en 2 semanas');
  });
});

describe('normalizeOffsets', () => {
  it('quita duplicados e inválidos y ordena de mayor a menor', () => {
    expect(normalizeOffsets([30, 1440, 30, -5, 1.5, 10080])).toEqual([10080, 1440, 30]);
  });
});
