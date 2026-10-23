export class Estoque {
  #quantidades = {}; // { [produtoId]: quantidade }

  // define quanto tem de cada produto
  definirQuantidade(produtoId, quantidade) {
    this.#quantidades = { ...this.#quantidades, [produtoId]: quantidade };
  }

  // consulta quanto tem de cada produto (0 se o produto nunca foi cadastrado)
  obterQuantidade(produtoId) {
    return this.#quantidades[produtoId] ?? 0;
  }

  // verifica se é possível atender a quant. pedida por um cliente
  // devolve só os itens que faltam (lista vazia = tudo ok)
  verificar(itens) {
    return itens
      .filter(({ produtoId, quantidade }) => this.obterQuantidade(produtoId) < quantidade)
      .map(({ produtoId, quantidade }) => ({
        produtoId,
        pedido: quantidade,
        disponivel: this.obterQuantidade(produtoId),
      }));
  }

  // tudo ou nada: só retira se TODOS os itens couberem
  darBaixa(itens) {
    const faltas = this.verificar(itens);

    if (faltas.length > 0) {
      return { ok: false, erros: faltas };
    }

    this.#quantidades = itens.reduce(
      (acumulado, { produtoId, quantidade }) => ({
        ...acumulado,
        [produtoId]: (acumulado[produtoId] ?? 0) - quantidade,
      }),
      this.#quantidades
    );

    return { ok: true };
  }

  // cancelamento de pedido confirmado: devolve os itens ao estoque
  devolver(itens) {
    this.#quantidades = itens.reduce(
      (acumulado, { produtoId, quantidade }) => ({
        ...acumulado,
        [produtoId]: (acumulado[produtoId] ?? 0) + quantidade,
      }),
      this.#quantidades
    );

    return { ok: true };
  }
}