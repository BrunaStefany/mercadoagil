import { cupomSchema } from '../schemas/cupomSchema.js';

// Arredonda para 2 casas (evita 14.399999...)
const arredondar = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Formata em reais: R$ 1.234,50
const emReais = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export class CupomDesconto {
  #codigo;
  #tipo;
  #valor;
  #validade;
  #valorMinimo;
  #cumulativo;

  // Use CupomDesconto.criar(): o construtor assume dados já validados.
  constructor({ codigo, tipo, valor, validade, valorMinimo, cumulativo }) {
    this.#codigo = codigo;
    this.#tipo = tipo;
    this.#valor = valor;
    this.#validade = validade;
    this.#valorMinimo = valorMinimo;
    this.#cumulativo = cumulativo;
  }

  /**
   * Valida com Zod (safeParse) e devolve no formato do serviço:
   * { ok: true, dados: CupomDesconto } ou { ok: false, erros: [...] }
   */
  static criar(entrada) {
    const resultado = cupomSchema.safeParse(entrada);
    if (!resultado.success) {
      const erros = resultado.error.issues.map(
        ({ path, message }) => (path.length ? `${path.join('.')}: ${message}` : message),
      );
      return { ok: false, erros };
    }
    return { ok: true, dados: new CupomDesconto(resultado.data) };
  }

  get codigo() { return this.#codigo; }
  get tipo() { return this.#tipo; }
  get valor() { return this.#valor; }
  get validade() { return this.#validade; }
  get valorMinimo() { return this.#valorMinimo; }
  get cumulativo() { return this.#cumulativo; }

  // Vencido é conferido na hora do uso (não só no cadastro).
  estaVencido(agora = new Date()) {
    return this.#validade <= agora;
  }

  /**
   * "Sabe dizer se está válido" para um pedido com esse subtotal.
   * Combinação (limite de 2, repetido, não cumulativo) é regra do Pedido,
   * mas esta classe expõe `cumulativo` para ele consultar.
   */
  validar(subtotal, agora = new Date()) {
    const erros = [];
    if (this.estaVencido(agora)) {
      erros.push(`Cupom ${this.#codigo} está vencido.`);
    }
    if (subtotal < this.#valorMinimo) {
      erros.push(
        `Cupom ${this.#codigo} exige subtotal mínimo de ${emReais(this.#valorMinimo)}.`,
      );
    }
    return erros.length ? { ok: false, erros } : { ok: true, dados: this };
  }

  /**
   * Desconto em R$ sobre uma base. O cupom de frete devolve 0 aqui:
   * quem zera o frete é o Pedido (tipo === 'frete').
   * Percentual usa a base recebida; fixo nunca passa da base.
   */
  calcularDesconto(base) {
    switch (this.#tipo) {
      case 'percentual':
        return arredondar((base * this.#valor) / 100);
      case 'fixo':
        return arredondar(Math.min(this.#valor, base));
      default:
        return 0;
    }
  }

  // Ordem de aplicação do Pedido: percentual (0) → fixo (1) → frete (2)
  get ordemDeAplicacao() {
    return { percentual: 0, fixo: 1, frete: 2 }[this.#tipo];
  }

  /**
   * Valida o conjunto de cupons de um pedido:
   * máx. 2, sem repetir, não cumulativo só sozinho, e cada um válido
   * (vencimento + valor mínimo sobre o subtotal). Devolve TODOS os erros.
   * O Pedido chama com [...cuponsAtuais, novoCupom] antes de aceitar.
   */
  static validarCombinacao(cupons, subtotal, agora = new Date()) {
    const erros = [];

    if (cupons.length > 2) erros.push('Máximo de 2 cupons por pedido.');

    const repetidos = cupons
      .filter((c, i) => cupons.findIndex((outro) => outro.codigo === c.codigo) !== i)
      .map((c) => c.codigo);
    if (repetidos.length) erros.push(`Cupom repetido no pedido: ${repetidos.join(', ')}.`);

    const exclusivos = cupons.filter((c) => !c.cumulativo);
    if (cupons.length > 1 && exclusivos.length) {
      erros.push(
        `Cupom ${exclusivos.map((c) => c.codigo).join(', ')} não é cumulativo e só pode ser usado sozinho.`,
      );
    }

    const errosIndividuais = cupons.flatMap((c) => c.validar(subtotal, agora).erros ?? []);
    const todos = [...erros, ...errosIndividuais];
    return todos.length ? { ok: false, erros: todos } : { ok: true, dados: cupons };
  }

  /**
   * Aplica os cupons na ordem da regra (percentual → fixo → frete) e respeita
   * o teto: a soma dos descontos nunca passa de 30% do subtotal.
   * Percentual incide sobre o valor ATUAL (já com os descontos anteriores).
   * Cupom de frete não gera desconto em R$: só avisa `zeraFrete`.
   * O teto deveria vir de config/regras.js; aqui é parâmetro com padrão 30%.
   */
  static calcularDescontos(cupons, subtotal, tetoPercentual = 0.3) {
    const tetoTotal = arredondar(subtotal * tetoPercentual);
    const emOrdem = [...cupons].sort((a, b) => a.ordemDeAplicacao - b.ordemDeAplicacao);

    const { descontos, totalDescontos, limitadoPeloTeto } = emOrdem.reduce(
      (acc, cupom) => {
        const valorAtual = arredondar(subtotal - acc.totalDescontos);
        const bruto = cupom.calcularDesconto(valorAtual);
        const aplicado = arredondar(Math.min(bruto, tetoTotal - acc.totalDescontos));
        return {
          descontos: [...acc.descontos, { codigo: cupom.codigo, tipo: cupom.tipo, valor: aplicado }],
          totalDescontos: arredondar(acc.totalDescontos + aplicado),
          limitadoPeloTeto: acc.limitadoPeloTeto || aplicado < bruto,
        };
      },
      { descontos: [], totalDescontos: 0, limitadoPeloTeto: false },
    );

    return {
      descontos,
      totalDescontos,
      subtotalComDesconto: arredondar(subtotal - totalDescontos), // nunca negativo (teto de 30%)
      zeraFrete: cupons.some((c) => c.tipo === 'frete'),
      limitadoPeloTeto,
    };
  }

  // Para listagens (campos privados não aparecem no console.log/JSON sozinhos)
  toJSON() {
    return {
      codigo: this.#codigo,
      tipo: this.#tipo,
      valor: this.#valor,
      validade: this.#validade,
      valorMinimo: this.#valorMinimo,
      cumulativo: this.#cumulativo,
    };
  }
}
