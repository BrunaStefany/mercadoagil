import { z } from 'zod';

export const clienteSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.email({ error: 'Formato de e-mail inválido.' }),
  cpf: z.string()
    .min(11, 'Formato de CPF inválido. O CPF deve ter no mínimo 11 dígitos.')
    .max(14, 'O CPF deve ter no máximo 14 caracteres.')
    .refine((cpf) => {
      const cpfLimpo = cpf.replace(/\D/g, '');
      return cpfLimpo.length === 11;
    }, { message: 'Formato de CPF inválido. Utilize 11 dígitos numéricos.' }),

  regiao: z.string().trim().toLowerCase().refine((valor) =>
    ['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul'].includes(valor),
    {
      message: 'Região inválida. Escolha entre: Norte, Nordeste, Centro-Oeste, Sudeste ou Sul.',
    }
  )
}); 