   import { aplicarCupons } from '../services/descontos.js';
   import { calcularFrete, calcularTributos, calcularComissoes, arredondar } from '../services/calculos.js';
   import { criarCuponsSeed } from '../data/seedCupons.js';

   // Pedido de exemplo: cliente do Nordeste, Mouse (R$ 120) + Livro de JavaScript (R$ 80)
   const itens = [
     { produtoId: 1, nome: 'Mouse', quantidade: 1, precoUnitario: 120, categoria: 'eletronicos', vendedorId: 1 },
     { produtoId: 4, nome: 'Livro de JavaScript', quantidade: 1, precoUnitario: 80, categoria: 'livros', vendedorId: 2 },
   ];
   const subtotal = arredondar(itens.reduce((soma, i) => soma + i.quantidade * i.precoUnitario, 0));
   const quantidadeTotal = itens.reduce((soma, i) => soma + i.quantidade, 0);
   const cupons = criarCuponsSeed().filter((c) => ['BEMVINDO10', 'PDA15'].includes(c.codigo));

   const desconto = aplicarCupons(cupons, subtotal);

      if (desconto.ok === false) {
     console.log('Erro nos cupons:', desconto.erros);
   } else {
     const { descontoTotal, subtotalComDesconto, temCupomFrete } = desconto.dados;
     const frete = calcularFrete('nordeste', quantidadeTotal, subtotalComDesconto, temCupomFrete);
     const total = arredondar(subtotalComDesconto + frete);
     const comissoes = calcularComissoes(itens);
     console.log('Subtotal:', subtotal, '(esperado 200)');
     console.log('Descontos:', descontoTotal, '(esperado 35)');
     console.log('Frete:', frete, '(esperado 28)');
     console.log('TOTAL:', total, '(esperado 193)');
     console.log('Tributos:', calcularTributos(itens), '(esperado 14.4)');
     console.log('Comissao total:', comissoes.comissaoTotal, '(esperado 21.6)');
     console.log('Repasses:', comissoes.repasses.map((r) => r.vendedorId + ': ' + r.valorRepasse).join(' | '), '(esperado 1: 110.4 | 2: 68)');
   }