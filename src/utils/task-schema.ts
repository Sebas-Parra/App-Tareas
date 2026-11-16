import { z } from 'zod';

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 1000;

/**
 * La fecha de entrega debe ser futura. Al editar, se permite conservar la fecha
 * original aunque ya haya pasado (para poder corregir el título de una tarea vencida).
 */
export function createTaskSchema(options: { originalDueAt?: number; now?: () => Date } = {}) {
  const now = options.now ?? (() => new Date());

  return z.object({
    title: z
      .string()
      .trim()
      .min(1, 'El título es obligatorio')
      .max(TITLE_MAX, `Máximo ${TITLE_MAX} caracteres`),
    description: z.string().trim().max(DESCRIPTION_MAX, `Máximo ${DESCRIPTION_MAX} caracteres`),
    dueAt: z
      .date()
      .refine(
        (d) => d.getTime() > now().getTime() || d.getTime() === options.originalDueAt,
        'La fecha de entrega debe ser futura'
      ),
    reminderOffsets: z.array(z.number().int().nonnegative()),
  });
}

export type TaskFormValues = z.infer<ReturnType<typeof createTaskSchema>>;
