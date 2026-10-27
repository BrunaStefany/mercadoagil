import { perguntar } from './util.js';
import {
  calcularFaturamento,
  calcularFaturamentoPorCategoria,
  calcularRepassesPorVendedor,
  calcularTicketMedio,
  listarTopProdutos,
} from '../services/relatorios.js';

const TEXTO_MENU = `
--- Relatórios ---
1 - Exibir relatório completo
0 - Voltar`;

const emReais = (valor) => Number(valor ?? 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function exibirFaturamento(pedidos) {
  const { faturamentoTotal, quantidadePedidos } = calcularFaturamento(pedidos);
  console.table([{
    'Faturamento total': emReais(faturamentoTotal),
    'Quantidade de pedidos': quantidadePedidos,
    'Ticket médio': emReais(calcularTicketMedio(pedidos)),
  }]);
}

function exibirFaturamentoPorCategoria(pedidos) {
  const totais = calcularFaturamentoPorCategoria(pedidos);
  console.log('\nFaturamento por categoria');
  console.table(Object.entries(totais).map(([categoria, faturamento]) => ({
    categoria,
    faturamento: emReais(faturamento),
  })));
}

function exibirRepassesPorVendedor(pedidos) {
  const repasses = calcularRepassesPorVendedor(pedidos);
  console.log('\nRepasse por vendedor');
  console.table(Object.entries(repasses).map(([vendedorId, valores]) => ({
    vendedorId: Number(vendedorId),
    bruto: emReais(valores.valorBruto),
    comissao: emReais(valores.comissao),
    liquido: emReais(valores.valorRepasse),
  })));
}

function exibirTopProdutos(pedidos) {
  console.log('\nTop 3 produtos mais vendidos');
  console.table(listarTopProdutos(pedidos));
}

function exibirRelatorio(marketplace) {
  try {
    const resposta = marketplace.listarPedidos();
    if (!resposta?.ok || !Array.isArray(resposta.dados)) {
      console.log('\nNão foi possível gerar os relatórios.');
      return;
    }

    const pedidosConfirmados = resposta.dados.filter(
      (pedido) => pedido.status === 'confirmado'
    );

    if (pedidosConfirmados.length === 0) {
      console.log('\nNão existem pedidos confirmados para gerar relatórios.');
      return;
    }

    exibirFaturamento(pedidosConfirmados);
    exibirFaturamentoPorCategoria(pedidosConfirmados);
    exibirRepassesPorVendedor(pedidosConfirmados);
    exibirTopProdutos(pedidosConfirmados);
  } catch (erro) {
    console.log(`\nNão foi possível gerar os relatórios: ${erro.message}`);
  }
}

export async function menuRelatorios(rl, marketplace) {
  let voltar = false;
  while (!voltar) {
    console.log(TEXTO_MENU);
    const escolha = await perguntar(rl, 'Escolha uma opção: ');

    if (escolha === '0') voltar = true;
    else if (escolha === '1') exibirRelatorio(marketplace);
    else console.log('\nOpção inválida. Digite um dos números do menu.');
  }
}
