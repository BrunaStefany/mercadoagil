import { TAXA_FRETE_POR_REGIAO, FRETE_POR_UNIDADE } from '../config/regras.js';


export function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula o frete único do pedido.
  @param {string} regiao - 'norte', 'nordeste', 'centro-oeste', 'sudeste' ou 'sul'
  @param {number} quantidadeTotal - total de unidades de itens no pedido
  @param {number} valorComDescontos - subtotal após a aplicação de descontos
  @param {boolean} temCupomFrete - indica se há cupom de frete grátis aplicado
 */
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