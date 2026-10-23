   // Listas de valores permitidos (usadas nos schemas do Zod)
   export const CATEGORIAS = ['eletronicos', 'livros', 'alimentos', 'vestuario', 'casa'];
   export const REGIOES = ['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul'];
   export const TIPOS_CUPOM = ['percentual', 'fixo', 'frete'];
   export const STATUS_PEDIDO = ['aberto', 'confirmado', 'cancelado'];

   // Frete: taxa da região + valor por unidade
   export const TAXA_FRETE_POR_REGIAO = {
     norte: 35,
     nordeste: 25,
     'centro-oeste': 30,
     sudeste: 20,
     sul: 22,
   };
   export const FRETE_POR_UNIDADE = 1.5;
   export const FRETE_GRATIS_A_PARTIR_DE = 300;

   // Tributos aproximados por categoria (fração: 0.12 = 12%)
   export const ALIQUOTAS = {
     eletronicos: 0.12,
     livros: 0,
     alimentos: 0.05,
     vestuario: 0.08,
     casa: 0.1,
   };

   // Comissão do marketplace por categoria (fração: 0.08 = 8%)
   export const COMISSOES = {
     eletronicos: 0.08,
     livros: 0.15,
     alimentos: 0.1,
     vestuario: 0.12,
     casa: 0.1,
   };

   // Cupons
   export const TETO_DESCONTO = 0.3; // soma dos descontos: no máximo 30% do subtotal
   export const MAX_CUPONS_POR_PEDIDO = 2;

