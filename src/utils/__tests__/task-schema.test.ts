import { createTaskSchema } from '../task-schema';

const now = new Date('2026-12-10T12:00:00');
const schema = createTaskSchema({ now: () => now });

const valid = {
  title: 'Entregar informe',
  description: '',
  dueAt: new Date('2026-12-11T09:00:00'),
  reminderOffsets: [1440],
};

describe('createTaskSchema', () => {
  it('acepta una tarea válida y recorta el título', () => {
    const result = schema.safeParse({ ...valid, title: '  Entregar informe  ' });
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Entregar informe');
  });

  it('exige título', () => {
    const result = schema.safeParse({ ...valid, title: '   ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('El título es obligatorio');
  });

  it('exige fecha futura', () => {
    const result = schema.safeParse({ ...valid, dueAt: new Date('2026-12-10T11:00:00') });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('La fecha de entrega debe ser futura');
  });

  it('al editar permite conservar la fecha original aunque ya pasó', () => {
    const past = new Date('2026-12-01T10:00:00');
    const editSchema = createTaskSchema({ originalDueAt: past.getTime(), now: () => now });
    expect(editSchema.safeParse({ ...valid, dueAt: past }).success).toBe(true);
    expect(
      editSchema.safeParse({ ...valid, dueAt: new Date('2026-12-02T10:00:00') }).success
    ).toBe(false);
  });

  it('permite tareas sin recordatorios', () => {
    expect(schema.safeParse({ ...valid, reminderOffsets: [] }).success).toBe(true);
  });
});
