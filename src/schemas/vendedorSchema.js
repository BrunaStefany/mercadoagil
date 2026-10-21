import { email, z } from "zod";

export const vendedorSchema = z.object({
    nomeLoja: z.string().trim().min(3, "O nome da loja deve ter pelo menos 3 caracteres"),
    
    cnpj: z.string().refine((cnpj) => /^\d{14}$/.test(cnpj), {
        message: "O CNPJ deve conter exatamente 14 dígitos numéricos."
    }),

    email: z.string().trim().email("Informe um e-mail válido.")
});