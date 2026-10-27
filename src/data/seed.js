   // Dados de exemplo carregados ao iniciar o sistema.
   // CPFs e CNPJs sao ficticios, mas validos nos digitos verificadores.
   import { criarCuponsSeed } from './seedCupons.js';

   export const vendedores = [
     { id: 1, nomeLoja: 'TechBahia', cnpj: '11222333000181', email: 'contato@techbahia.exemplo.com' },
     { id: 2, nomeLoja: 'Livraria Sol', cnpj: '44555666000181', email: 'contato@livrariasol.exemplo.com' },
     { id: 3, nomeLoja: 'Casa Viva', cnpj: '77888999000181', email: 'contato@casaviva.exemplo.com' },
   ];

   export const clientes = [
     { id: 1, nome: 'Ana Souza', email: 'ana.souza@exemplo.com', cpf: '12345678909', regiao: 'nordeste' },
     { id: 2, nome: 'Bruno Lima', email: 'bruno.lima@exemplo.com', cpf: '98765432100', regiao: 'sudeste' },
     { id: 3, nome: 'Carla Mendes', email: 'carla.mendes@exemplo.com', cpf: '24681357928', regiao: 'sul' },
   ];

   // 8 produtos de 3 categorias (eletronicos, livros e casa).
   // O Mouse e o Livro de JavaScript sao os itens do pedido de exemplo.
   export const produtos = [
     { id: 1, nome: 'Mouse', preco: 120, categoria: 'eletronicos', vendedorId: 1 },
     { id: 2, nome: 'Teclado Mecanico', preco: 250, categoria: 'eletronicos', vendedorId: 1 },
     { id: 3, nome: 'Fone de Ouvido', preco: 180, categoria: 'eletronicos', vendedorId: 1 },
     { id: 4, nome: 'Livro de JavaScript', preco: 80, categoria: 'livros', vendedorId: 2 },
     { id: 5, nome: 'Livro de Node.js', preco: 95, categoria: 'livros', vendedorId: 2 },
     { id: 6, nome: 'Luminaria de Mesa', preco: 70, categoria: 'casa', vendedorId: 3 },
     { id: 7, nome: 'Jogo de Panelas', preco: 220, categoria: 'casa', vendedorId: 3 },
     { id: 8, nome: 'Almofada', preco: 45, categoria: 'casa', vendedorId: 3 },
   ];

   // Quantidade em estoque por produtoId.
   // O Teclado tem so 1 unidade, para testar a regra "tudo ou nada".
   export const estoqueInicial = { 1: 10, 2: 1, 3: 8, 4: 12, 5: 6, 6: 15, 7: 4, 8: 20 };

   // Os cupons vem do seedCupons.js (ja validados pelo Zod).
   export const cupons = criarCuponsSeed();