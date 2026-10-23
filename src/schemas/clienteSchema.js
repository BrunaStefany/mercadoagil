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
  
  // Adicionamos a propriedade "message" e garantimos o errorMap para qualquer cenário do enum
  regiao: z.enum(['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'], {
    invalid_type_error: 'Região inválida. Escolha entre: Norte, Nordeste, Centro-Oeste, Sudeste ou Sul.',
    required_error: 'A região de entrega é obrigatória.',
    message: 'Região inválida. Escolha entre: Norte, Nordeste, Centro-Oeste, Sudeste ou Sul.',
    errorMap: () => ({ message: 'Região inválida. Escolha entre: Norte, Nordeste, Centro-Oeste, Sudeste ou Sul.' })
  })
});