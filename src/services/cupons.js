import { CupomDesconto } from '../models/CupomDesconto.js';

// CRUD de cupons como funções puras: recebem a lista atual e devolvem uma lista NOVA
// (spread/filter, sem mutar a original). O Marketplace guarda a lista e chama estas funções:
//   const r = cadastrarCupom(this.#cupons, entrada);
//   if (r.ok) this.#cupons = r.dados.lista;
//   return r;

const normalizar = (codigo) => String(codigo ?? '').trim().toUpperCase();

export function cadastrarCupom(lista, entrada) {
  const criado = CupomDesconto.criar(entrada);
  if (!criado.ok) return criado;

  const { dados: cupom } = criado;
  if (lista.some((c) => c.codigo === cupom.codigo)) {
    return { ok: false, erros: [`Já existe um cupom com o código ${cupom.codigo}.`] };
  }
  return { ok: true, dados: { cupom, lista: [...lista, cupom] } };
}

export const listarCupons = (lista) => ({
  ok: true,
  dados: lista.map((c) => c.toJSON()),
});

export function buscarCupom(lista, codigo) {
  const cupom = lista.find((c) => c.codigo === normalizar(codigo));
  return cupom
    ? { ok: true, dados: cupom }
    : { ok: false, erros: [`Cupom ${normalizar(codigo)} não encontrado.`] };
}

export function excluirCupom(lista, codigo) {
  const alvo = normalizar(codigo);
  if (!lista.some((c) => c.codigo === alvo)) {
    return { ok: false, erros: [`Cupom ${alvo} não encontrado.`] };
  }
  return { ok: true, dados: { lista: lista.filter((c) => c.codigo !== alvo) } };
}
