import { 
  TAXA_FRETE_POR_REGIAO, 
  FRETE_POR_UNIDADE, 
  ALIQUOTAS, 
  COMISSOES 
} from '../config/regras.js';

export function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}


export function calcularFrete(regiao, quantidadeTotal, valorComDescontos, temCupomFrete = false) {
  if (temCupomFrete || valorComDescontos >= 300) {
    return 0;
  }

  const chaveRegiao = regiao.toLowerCase();
  const taxaRegiao = TAXA_FRETE_POR_REGIAO[chaveRegiao];

  if (taxaRegiao === undefined) {
    throw new Error(`Região inválida: ${regiao}`);
  }

  const custoPorUnidade = quantidadeTotal * FRETE_POR_UNIDADE;
  return arredondar(taxaRegiao + custoPorUnidade);
}


export function calcularTributos(itens = []) {
  const totalTributos = itens.reduce((acumulador, item) => {
    const aliquota = ALIQUOTAS[item.categoria] ?? 0;
    const valorItem = item.quantidade * item.precoUnitario;
    return acumulador + (valorItem * aliquota);
  }, 0);

  return arredondar(totalTributos);
}

/**
 * @param {Array} itens - Lista de itens do pedido
 * @returns {Object} { comissaoTotal, repasses }
 */
export function calcularComissoes(itens = []) {
  let comissaoTotal = 0;

  const repassesMap = itens.reduce((acumulador, item) => {
    const taxaComissao = COMISSOES[item.categoria] ?? 0;
    const valorBruto = item.quantidade * item.precoUnitario;
    const valorComissao = valorBruto * taxaComissao;

    comissaoTotal += valorComissao;

    const vendedorId = item.vendedorId;

    if (!acumulador[vendedorId]) {
      acumulador[vendedorId] = {
        vendedorId,
        valorBruto: 0,
        comissao: 0,
        valorRepasse: 0,
      };
    }

    acumulador[vendedorId].valorBruto += valorBruto;
    acumulador[vendedorId].comissao += valorComissao;
    acumulador[vendedorId].valorRepasse += (valorBruto - valorComissao);

    return acumulador;
  }, {});

  const repasses = Object.values(repassesMap).map((repasse) => ({
    vendedorId: repasse.vendedorId,
    valorBruto: arredondar(repasse.valorBruto),
    comissao: arredondar(repasse.comissao),
    valorRepasse: arredondar(repasse.valorRepasse),
  }));

  return {
    comissaoTotal: arredondar(comissaoTotal),
    repasses,
  };
}