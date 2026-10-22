import { z } from 'zod';

export const produtoSchema = z.object({
  id: z.number().int().positive().optional(),
  
  nome: z.string({ required_error: 'O nome do produto é obrigatório.' })
    .min(2, 'O nome deve ter pelo menos 2 caracteres.'),
    
  preco: z.number({ required_error: 'O preço é obrigatório.' })
    .positive('O preço do produto deve ser maior que zero.'),
    
  categoria: z.enum(['eletronicos', 'livros', 'alimentos', 'vestuario', 'casa'], {
    errorMap: () => ({ message: 'Categoria inválida.' }),
  }),
  
  vendedorId: z.number().int().positive('O ID do vendedor deve ser um número inteiro válido.')
});
