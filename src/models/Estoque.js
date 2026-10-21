export class Estoque {
  #quantidades = {}; // { [produtoId]: quantidade }

  definirQuantidade(produtoId, quantidade) {
  this.#quantidades = { ...this.#quantidades, [produtoId]: quantidade };
}


  obterQuantidade(produtoId) {
    return this.#quantidades[produtoId] ?? 0;
  }
}