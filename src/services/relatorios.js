import { COMISSOES } from '../config/regras.js';
import { arredondar } from './calculos.js';

export function calcularFaturamento(pedidos) {
  // Pedidos abertos e cancelados ficam fora do faturamento.
  const pedidosConfirmados = pedidos.filter(
    (pedido) => pedido.status === 'confirmado'
  );

  const faturamentoTotal = pedidosConfirmados.reduce(
    (acumulado, pedido) => acumulado + pedido.total,
    0
  );

  return {
    faturamentoTotal: arredondar(faturamentoTotal),
    quantidadePedidos: pedidosConfirmados.length
  };
}

export function calcularTicketMedio(pedidos) {
  const { faturamentoTotal, quantidadePedidos } =
    calcularFaturamento(pedidos);

  if (quantidadePedidos === 0) {
    return 0;
  }

  return arredondar(faturamentoTotal / quantidadePedidos);
}

export function calcularFaturamentoPorCategoria(pedidos) {
  const itensConfirmados = pedidos
    .filter((pedido) => pedido.status === 'confirmado')
    .flatMap((pedido) => pedido.itens);

  return itensConfirmados.reduce((totais, item) => {
    // Usa o valor dos produtos antes dos descontos, sem incluir frete.
    const valorItem = item.precoUnitario * item.quantidade;
    const totalAtual = totais[item.categoria] ?? 0;

    return {
      ...totais,
      [item.categoria]: arredondar(totalAtual + valorItem)
    };
  }, {});
}

export function calcularRepassesPorVendedor(pedidos) {
  const itensConfirmados = pedidos
    .filter((pedido) => pedido.status === 'confirmado')
    .flatMap((pedido) => pedido.itens);

  return itensConfirmados.reduce((repasses, item) => {
    // Comissão sobre o valor dos produtos, antes dos descontos e sem frete.
    const valorItem = arredondar(
      item.precoUnitario * item.quantidade
    );

    const comissaoItem = arredondar(
      valorItem * COMISSOES[item.categoria]
    );

    const acumuladoVendedor = repasses[item.vendedorId] ?? {
      valorBruto: 0,
      comissao: 0
    };

    const valorBruto = arredondar(
      acumuladoVendedor.valorBruto + valorItem
    );

    const comissao = arredondar(
      acumuladoVendedor.comissao + comissaoItem
    );

    return {
      ...repasses,
      [item.vendedorId]: {
        valorBruto,
        comissao,
        valorRepasse: arredondar(valorBruto - comissao)
      }
    };
  }, {});
}

export function listarTopProdutos(pedidos) {
  const itensConfirmados = pedidos
    .filter((pedido) => pedido.status === 'confirmado')
    .flatMap((pedido) => pedido.itens);

  const produtosAgrupados = itensConfirmados.reduce(
    (produtos, item) => {
      const produtoAtual = produtos[item.produtoId] ?? {
        quantidade: 0
      };

      return {
        ...produtos,
        [item.produtoId]: {
          produtoId: item.produtoId,
          nome: item.nome,
          quantidade: produtoAtual.quantidade + item.quantidade
        }
      };
    },
    {}
  );

  // Ranking por unidades vendidas, somando o mesmo produto entre pedidos.
  return Object.values(produtosAgrupados)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 3);
}
