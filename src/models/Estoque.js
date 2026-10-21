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
    verificar(itens) {
    return itens
      .filter(({ produtoId, quantidade }) => this.obterQuantidade(produtoId) < quantidade)
      .map(({ produtoId, quantidade }) => ({
        produtoId,
        pedido: quantidade,
        disponivel: this.obterQuantidade(produtoId),
      }));
  }

  darBaixa(itens) {
  const faltas = this.verificar(itens);

  if (faltas.length > 0) {
    return {
      ok: false,
      erros: faltas,
    };
  }

  itens.forEach(({ produtoId, quantidade }) => {
    this.definirQuantidade(
      produtoId,
      this.obterQuantidade(produtoId) - quantidade
    );
  });

  return { ok: true };
}

devolver(itens) {
  itens.forEach(({ produtoId, quantidade }) => {
    this.definirQuantidade(
      produtoId,
      this.obterQuantidade(produtoId) + quantidade
    );
  });

  return { ok: true };
}

}