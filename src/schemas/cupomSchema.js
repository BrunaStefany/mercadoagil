import { z } from 'zod';
import { TIPOS_CUPOM } from '../config/regras.js';

// Schema do cupom. Cada campo tem mensagem de erro em português (rubrica: "Majestoso").
export const cupomSchema = z
  .object({
    codigo: z
      .string({ message: 'O código do cupom precisa ser um texto.' })
      .trim()
      .min(3, 'O código precisa ter pelo menos 3 letras.')
      .toUpperCase(),

    tipo: z.enum(TIPOS_CUPOM, {
      message: `O tipo precisa ser: ${TIPOS_CUPOM.join(', ')}.`,
    }),

    valor: z
      .number({ message: 'O valor precisa ser um número (ex.: 10).' })
      .nonnegative('O valor não pode ser negativo.'),

    // .refine #1 (obrigatório da rubrica): validade em data futura
    validade: z.coerce
      .date({ message: 'A validade precisa ser uma data válida (ex.: 2026-12-31).' })
      .refine((data) => data > new Date(), {
        message: 'A validade do cupom precisa ser uma data futura.',
      }),

    valorMinimo: z
      .number({ message: 'O valor mínimo precisa ser um número.' })
      .nonnegative('O valor mínimo não pode ser negativo.')
      .default(0),

    cumulativo: z.boolean({ message: 'Cumulativo precisa ser true ou false.' }).default(true),
  })
  // Regras que dependem de mais de um campo
  .refine((c) => c.tipo !== 'percentual' || c.valor <= 100, {
    message: 'Cupom percentual não pode passar de 100%.',
    path: ['valor'],
  })
  .refine((c) => c.tipo === 'frete' || c.valor > 0, {
    message: 'Cupom percentual ou fixo precisa ter valor maior que zero.',
    path: ['valor'],
  });
