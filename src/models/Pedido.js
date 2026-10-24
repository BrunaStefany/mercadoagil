import {
  arredondar,
  calcularFrete,
  calcularTributos,
  calcularComissoes,
} from '../services/calculos.js';
import { aplicarCupons } from '../services/descontos.js';
import { STATUS_PEDIDO } from '../config/regras.js';

// ordem da lista em regras.js: aberto, confirmado, cancelado
const [ABERTO, CONFIRMADO, CANCELADO] = STATUS_PEDIDO;

export class Pedido {
  #id;
  #clienteId;
  #regiao;
  #estoque;
  #itens = [];
  #cupons = [];
  #status = ABERTO;
  #resumoFinal = null; // foto do pedido no momento da confirmação

  constructor({ id, clienteId, regiao, estoque }) {
    this.#id = id;
    this.#clienteId = clienteId;
    this.#regiao = regiao;
    this.#estoque = estoque;
  }

  get id() {
    return this.#id;
  }

  get clienteId() {
    return this.#clienteId;
  }

  get status() {
    return this.#status;
  }

  // devolve cópias, para quem está de fora não alterar o pedido
  get itens() {
    return this.#itens.map((item) => ({ ...item }));
  }

  get cupons() {
    return [...this.#cupons];
  }

  // itens e cupons só mudam com o pedido aberto
  #exigirAberto() {
    return this.#status === ABERTO
      ? null
      : { ok: false, erros: [`O pedido está ${this.#status} e não aceita mudanças.`] };
  }

  #subtotal() {
    return arredondar(
      this.#itens.reduce((soma, { quantidade, precoUnitario }) => soma + quantidade * precoUnitario, 0)
    );
  }

    #copiarResumo(resumo) {
    return {
      ...resumo,
      itens: resumo.itens.map((item) => ({ ...item })),
      cupons: [...resumo.cupons],
      repasses: resumo.repasses.map((repasse) => ({ ...repasse })),
    };
  }

  adicionarItem(item) {
    const bloqueio = this.#exigirAberto();
    if (bloqueio) return bloqueio;

    const { produtoId, quantidade, precoUnitario } = item ?? {};
    const erros = [
      !Number.isInteger(produtoId) && 'O produto precisa ter um id inteiro.',
      (!Number.isInteger(quantidade) || quantidade <= 0) &&
        'A quantidade precisa ser um número inteiro maior que zero.',
      !(precoUnitario > 0) && 'O preço unitário precisa ser maior que zero.',
    ].filter(Boolean);
    if (erros.length > 0) return { ok: false, erros };

    // mesmo produto duas vezes: soma a quantidade em vez de repetir o item
    const jaExiste = this.#itens.some((i) => i.produtoId === produtoId);
    this.#itens = jaExiste
      ? this.#itens.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + quantidade } : i))
      : [...this.#itens, { ...item }];

    return { ok: true };
  }

  removerItem(produtoId) {
    const bloqueio = this.#exigirAberto();
    if (bloqueio) return bloqueio;

    if (!this.#itens.some((i) => i.produtoId === produtoId)) {
      return { ok: false, erros: ['Esse produto não está no pedido.'] };
    }
    this.#itens = this.#itens.filter((i) => i.produtoId !== produtoId);
    return { ok: true };
  }

  // recebe o CupomDesconto em si (resposta.dados do CupomDesconto.criar)
  aplicarCupom(cupom) {
    const bloqueio = this.#exigirAberto();
    if (bloqueio) return bloqueio;

    // o descontos.js confere vencido, mínimo, máx. de 2, repetido e cumulativo
    const resposta = aplicarCupons([...this.#cupons, cupom], this.#subtotal());
    if (!resposta.ok) return resposta;

    this.#cupons = [...this.#cupons, cupom];
    return { ok: true, dados: resposta.dados };
  }

  // monta todos os valores do pedido: total = subtotal - descontos + frete
  #calcular() {
    const subtotal = this.#subtotal();

    const descontos = this.#cupons.length === 0
      ? { ok: true, dados: { descontoTotal: 0, temCupomFrete: false } }
      : aplicarCupons(this.#cupons, subtotal);
    if (!descontos.ok) return descontos;
    const { descontoTotal, temCupomFrete } = descontos.dados;

    const quantidadeTotal = this.#itens.reduce((soma, { quantidade }) => soma + quantidade, 0);

    // o calcularFrete lança erro se a região for inválida
    let frete;
    try {
      frete = calcularFrete(this.#regiao, quantidadeTotal, subtotal - descontoTotal, temCupomFrete);
    } catch (erro) {
      return { ok: false, erros: [erro.message] };
    }

    const { comissaoTotal, repasses } = calcularComissoes(this.#itens);

    return {
      ok: true,
      dados: {
        id: this.#id,
        clienteId: this.#clienteId,
        itens: this.#itens.map((item) => ({ ...item })),
        cupons: this.#cupons.map(({ codigo }) => codigo),
        subtotal,
        descontoTotal,
        frete,
        total: Math.max(0, arredondar(subtotal - descontoTotal + frete)),
        tributosAproximados: calcularTributos(this.#itens),
        comissaoTotal,
        repasses,
      },
    };
  }

  resumo() {
    if (this.#resumoFinal) {
  return {
    ok: true,
    dados: {
      ...this.#copiarResumo(this.#resumoFinal),
      status: this.#status,
    },
  };
}
    const calculo = this.#calcular();
    return calculo.ok ? { ok: true, dados: { ...calculo.dados, status: this.#status } } : calculo;
  }

  confirmar() {
    const bloqueio = this.#exigirAberto();
    if (bloqueio) return bloqueio;
    if (this.#itens.length === 0) {
      return { ok: false, erros: ['Não dá para confirmar um pedido sem itens.'] };
    }

    // calcula ANTES de mexer no estoque: se algo estiver errado, nada sai
    const calculo = this.#calcular();
    if (!calculo.ok) return calculo;

    // tudo ou nada: o Estoque só dá baixa se TODOS os itens couberem
    const baixa = this.#estoque.darBaixa(
      this.#itens.map(({ produtoId, quantidade }) => ({ produtoId, quantidade }))
    );
    if (!baixa.ok) {
      return {
        ok: false,
        erros: baixa.erros.map(({ produtoId, pedido, disponivel }) => {
          const { nome } = this.#itens.find((i) => i.produtoId === produtoId);
          return `Estoque insuficiente: ${nome} (pedido ${pedido}, disponível ${disponivel})`;
        }),
      };
    }

    this.#status = CONFIRMADO;
    this.#resumoFinal = this.#copiarResumo(calculo.dados);

    return {
     ok: true,
    dados: {
        ...this.#copiarResumo(this.#resumoFinal),
        status: this.#status,
    },
};
  }

  cancelar() {
    if (this.#status === CANCELADO) {
      return { ok: false, erros: ['O pedido já está cancelado.'] };
    }
    // só pedido confirmado já tirou itens do estoque, então só ele devolve
    if (this.#status === CONFIRMADO) {
      this.#estoque.devolver(
        this.#itens.map(({ produtoId, quantidade }) => ({ produtoId, quantidade }))
      );
    }
    this.#status = CANCELADO;
    return { ok: true, dados: { id: this.#id, status: this.#status } };
  }
}