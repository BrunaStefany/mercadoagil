import { CupomDesconto } from '../models/CupomDesconto.js';

/**
 * Pacote "Descontos" (Onda 2).
 *
 * Confere os cupons de um pedido e calcula quanto de desconto eles dão.
 * Reaproveita as regras que já estão na classe CupomDesconto:
 *   - validarCombinacao: vencido, valor mínimo, máx. de cupons (regras.js),
 *     cupom repetido e não cumulativo só sozinho.
 *   - calcularDescontos: ordem (percentual → fixo → frete) e teto
 *     (TETO_DESCONTO do regras.js). O percentual guarda o inteiro (10 = 10%)
 *     e a divisão por 100 acontece lá dentro.
 *
 * O Pedido usa esta função de duas formas:
 *   - ao APLICAR um cupom:  aplicarCupons([...cuponsAtuais, novo], subtotal)
 *     (se vier ok: false, o cupom é recusado e a lista não muda)
 *   - ao CALCULAR o total:  aplicarCupons(cuponsDoPedido, subtotal)
 *     total = subtotal - descontoTotal + frete
 *
 * O cupom de frete NÃO tira nada do subtotal: ele só liga `temCupomFrete`,
 * e quem zera o frete é calcularFrete (calculos.js).
 *
 * @param {CupomDesconto[]} cupons  cupons do pedido (instâncias de CupomDesconto)
 * @param {number} subtotal         soma dos itens, antes dos descontos
 * @param {Date} [agora]            só para teste de cupom vencido
 * @returns {{ok: true, dados: {descontoTotal: number, temCupomFrete: boolean}}
 *          | {ok: false, erros: string[]}}
 */
export function aplicarCupons(cupons, subtotal, agora = new Date()) {
  if (!Array.isArray(cupons)) {
    return { ok: false, erros: ['A lista de cupons precisa ser um array.'] };
  }
  if (typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal < 0) {
    return { ok: false, erros: ['O subtotal precisa ser um número maior ou igual a zero.'] };
  }
  if (cupons.some((c) => !(c instanceof CupomDesconto))) {
    return { ok: false, erros: ['Todos os cupons precisam ser válidos (CupomDesconto).'] };
  }

  // 1) Regras de uso: se alguma falhar, devolve TODOS os erros de uma vez.
  const combinacao = CupomDesconto.validarCombinacao(cupons, subtotal, agora);
  if (!combinacao.ok) return combinacao;

  // 2) Cálculo: já respeita a ordem e o teto de 30% (o total nunca fica negativo).
  const { descontos, totalDescontos, subtotalComDesconto, zeraFrete, limitadoPeloTeto } =
    CupomDesconto.calcularDescontos(cupons, subtotal);

  return {
    ok: true,
    dados: {
      descontoTotal: totalDescontos,
      temCupomFrete: zeraFrete,
      // Extras (não obrigatórios) para o resumo do pedido:
      descontos, // [{ codigo, tipo, valor }] na ordem de aplicação
      subtotalComDesconto,
      limitadoPeloTeto,
    },
  };
}
