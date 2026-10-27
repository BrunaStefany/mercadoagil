   import { arredondar, calcularFrete, calcularTributos, calcularComissoes } from '../services/calculos.js';

   const itens = [
     { produtoId: 1, nome: 'Mouse', quantidade: 1, precoUnitario: 120, categoria: 'eletronicos', vendedorId: 1 },
     { produtoId: 4, nome: 'Livro de JavaScript', quantidade: 1, precoUnitario: 80, categoria: 'livros', vendedorId: 2 },
   ];

   console.log('arredondar(14.399999):', arredondar(14.399999), '(esperado 14.4)');
   console.log('frete Nordeste, 2 unidades:', calcularFrete('nordeste', 2, 165, false), '(esperado 28)');
   console.log('frete com cupom de frete:', calcularFrete('nordeste', 2, 165, true), '(esperado 0)');
   console.log('frete acima de R$ 300:', calcularFrete('sudeste', 3, 309, false), '(esperado 0)');
   console.log('tributos:', calcularTributos(itens), '(esperado 14.4)');
   console.log('comissoes:', JSON.stringify(calcularComissoes(itens)), '(esperado total 21.6; repasses 110.4 e 68)');