import { Estoque } from '../models/Estoque.js';
import { Pedido } from '../models/Pedido.js';
import { CupomDesconto } from '../models/CupomDesconto.js';

const mouse = { produtoId: 1, nome: 'Mouse', quantidade: 1, precoUnitario: 120, categoria: 'eletronicos', vendedorId: 1 };
const livro = { produtoId: 2, nome: 'Livro de JavaScript', quantidade: 1, precoUnitario: 80, categoria: 'livros', vendedorId: 2 };

function novoEstoque() {
  const e = new Estoque();
  e.definirQuantidade(1, 1); // 1 Mouse
  e.definirQuantidade(2, 2); // 2 Livros
  return e;
}

console.log('--- 1. ciclo sem cupons ---');
const estoque = novoEstoque();
const pedido = new Pedido({ id: 1, clienteId: 1, regiao: 'nordeste', estoque });
pedido.adicionarItem(mouse);
pedido.adicionarItem(livro);
console.log(pedido.resumo().dados);
// esperado: subtotal 200, descontoTotal 0, frete 28, total 228, tributos 14.4, comissaoTotal 21.6
console.log(pedido.confirmar().ok, pedido.status); // true confirmado
console.log(estoque.obterQuantidade(1), estoque.obterQuantidade(2)); // 0 1
console.log(pedido.cancelar().ok, pedido.status); // true cancelado
console.log(estoque.obterQuantidade(1), estoque.obterQuantidade(2)); // 1 2
console.log(pedido.cancelar().erros); // [ 'O pedido já está cancelado.' ]

console.log('--- 2. tudo ou nada ---');
const pedido2 = new Pedido({ id: 2, clienteId: 1, regiao: 'nordeste', estoque });
pedido2.adicionarItem({ ...mouse, quantidade: 2 });
pedido2.adicionarItem({ ...livro, quantidade: 3 });
console.log(pedido2.confirmar().erros);
// esperado: as DUAS mensagens (Mouse: pedido 2, disponível 1 / Livro de JavaScript: pedido 3, disponível 2)
console.log(estoque.obterQuantidade(1), estoque.obterQuantidade(2)); // 1 2 (intacto)

console.log('--- 3. pedido de exemplo: R$ 193,00 ---');
const estoque3 = novoEstoque();
const dadosCupom = { validade: '2027-12-31', valorMinimo: 0, cumulativo: true };
const bemvindo = CupomDesconto.criar({ codigo: 'BEMVINDO10', tipo: 'percentual', valor: 10, ...dadosCupom });
const pda = CupomDesconto.criar({ codigo: 'PDA15', tipo: 'fixo', valor: 15, ...dadosCupom });
console.log(bemvindo.ok, pda.ok); // true true
if (!bemvindo.ok) console.log(bemvindo.erros);
if (!pda.ok) console.log(pda.erros);

const exemplo = new Pedido({ id: 3, clienteId: 1, regiao: 'nordeste', estoque: estoque3 });
exemplo.adicionarItem(mouse);
exemplo.adicionarItem(livro);
console.log(exemplo.aplicarCupom(bemvindo.dados).ok); // true
console.log(exemplo.aplicarCupom(pda.dados).ok); // true
const r = exemplo.confirmar();
console.log(r.dados.total); // 193
console.log(r.dados.descontoTotal); // 35
console.log(r.dados.frete); // 28
console.log(r.dados.tributosAproximados); // 14.4
console.log(r.dados.comissaoTotal); // 21.6
console.log(r.dados.repasses); // vendedor 1: valorRepasse 110.4 / vendedor 2: valorRepasse 68

console.log('--- 4. casos extremos ---');
const vazio = new Pedido({ id: 4, clienteId: 1, regiao: 'nordeste', estoque: novoEstoque() });
console.log(vazio.confirmar().erros); // [ 'Não dá para confirmar um pedido sem itens.' ]

console.log(exemplo.adicionarItem(mouse).erros); // pedido confirmado: 'não aceita mudanças'
console.log(exemplo.removerItem(1).erros); // idem

const repetido = new Pedido({ id: 5, clienteId: 1, regiao: 'nordeste', estoque: novoEstoque() });
repetido.adicionarItem(mouse);
repetido.adicionarItem(mouse);
console.log(repetido.itens[0].quantidade); // 2 (somou, não duplicou)
console.log(repetido.removerItem(99).erros); // [ 'Esse produto não está no pedido.' ]
console.log(repetido.adicionarItem({ produtoId: 'abc', quantidade: -1, precoUnitario: 0 }).erros); // 3 mensagens

const cupomRepetido = new Pedido({ id: 6, clienteId: 1, regiao: 'nordeste', estoque: novoEstoque() });
cupomRepetido.adicionarItem(mouse);
cupomRepetido.adicionarItem(livro);
console.log(cupomRepetido.aplicarCupom(bemvindo.dados).ok); // true
console.log(cupomRepetido.aplicarCupom(bemvindo.dados).erros); // 'Cupom repetido no pedido: BEMVINDO10.'

console.log('--- 5. mesmo produto, estoque insuficiente ---');

const estoque4 = new Estoque();
estoque4.definirQuantidade(1, 1); // Só existe 1 mouse

const pedido3 = new Pedido({
  id: 7,
  clienteId: 1,
  regiao: 'nordeste',
  estoque: estoque4
});

pedido3.adicionarItem({ ...mouse, quantidade: 1 });
pedido3.adicionarItem({ ...mouse, quantidade: 1 });

console.log('Quantidade pedida:', pedido3.itens[0].quantidade);

const resultado = pedido3.confirmar();

console.log('Confirmação:', resultado.ok);
console.log('Erros:', resultado.erros);
console.log('Estoque restante:', estoque4.obterQuantidade(1));

console.log('--- 6. mesmo produto, estoque suficiente ---');

const estoque5 = new Estoque();
estoque5.definirQuantidade(1, 3); // Existem 3 mouses

const pedido4 = new Pedido({
  id: 8,
  clienteId: 1,
  regiao: 'nordeste',
  estoque: estoque5
});

pedido4.adicionarItem({ ...mouse, quantidade: 1 });
pedido4.adicionarItem({ ...mouse, quantidade: 1 });

console.log('Quantidade pedida:', pedido4.itens[0].quantidade);

const resultado2 = pedido4.confirmar();

console.log('Confirmação:', resultado2.ok);
console.log('Estoque restante:', estoque5.obterQuantidade(1));

console.log('--- 7. proteção do resumo confirmado ---');

const estoque6 = new Estoque();
estoque6.definirQuantidade(1, 3);

const pedido5 = new Pedido({
  id: 9,
  clienteId: 1,
  regiao: 'nordeste',
  estoque: estoque6
});

pedido5.adicionarItem(mouse);

const confirmacao = pedido5.confirmar();

console.log('Quantidade original:', pedido5.resumo().dados.itens[0].quantidade);

confirmacao.dados.itens[0].quantidade = 999;

console.log('Quantidade após alteração externa:', pedido5.resumo().dados.itens[0].quantidade);

console.log('--- 8. proteção do resumo aberto ---');

const pedido6 = new Pedido({
  id: 10,
  clienteId: 1,
  regiao: 'nordeste',
  estoque: novoEstoque()
});

pedido6.adicionarItem(mouse);

const resumoAberto = pedido6.resumo();
resumoAberto.dados.itens[0].quantidade = 999;

console.log('Quantidade interna:', pedido6.itens[0].quantidade);

console.log('--- 9. impedir confirmação após cancelamento ---');

const estoque7 = new Estoque();
estoque7.definirQuantidade(1, 3);

const pedido7 = new Pedido({
  id: 11,
  clienteId: 1,
  regiao: 'nordeste',
  estoque: estoque7
});

pedido7.adicionarItem(mouse);

console.log('Cancelamento:', pedido7.cancelar().ok);
console.log('Status após cancelar:', pedido7.status);

const tentativa = pedido7.confirmar();

console.log('Confirmação após cancelar:', tentativa.ok);
console.log('Erros:', tentativa.erros);
console.log('Estoque restante:', estoque7.obterQuantidade(1));

console.log('--- 10. impedir devolução duplicada ---');

const estoque8 = new Estoque();
estoque8.definirQuantidade(1, 3);

const pedido8 = new Pedido({
  id: 12,
  clienteId: 1,
  regiao: 'nordeste',
  estoque: estoque8
});

pedido8.adicionarItem(mouse);

console.log('Confirmação:', pedido8.confirmar().ok);
console.log('Estoque após confirmar:', estoque8.obterQuantidade(1));

console.log('Primeiro cancelamento:', pedido8.cancelar().ok);
console.log('Estoque após cancelar:', estoque8.obterQuantidade(1));

const segundoCancelamento = pedido8.cancelar();

console.log('Segundo cancelamento:', segundoCancelamento.ok);
console.log('Erros:', segundoCancelamento.erros);
console.log('Estoque final:', estoque8.obterQuantidade(1));

console.log('--- 11. proteção da lista de itens ---');

const estoque9 = new Estoque();
estoque9.definirQuantidade(1, 3);

const pedido9 = new Pedido({
  id: 13,
  clienteId: 1,
  regiao: 'nordeste',
  estoque: estoque9
});

pedido9.adicionarItem(mouse);
pedido9.confirmar();

const itensExternos = pedido9.itens;
itensExternos[0].quantidade = 999;
itensExternos.push({ produtoId: 99, quantidade: 1 });

console.log('Quantidade interna:', pedido9.itens[0].quantidade);
console.log('Quantidade de itens internos:', pedido9.itens.length);


console.log('--- 12. limite máximo de 30% de desconto ---');

const estoque10 = new Estoque();
estoque10.definirQuantidade(1, 3);
estoque10.definirQuantidade(2, 3);

const pedido10 = new Pedido({
  id: 14,
  clienteId: 1,
  regiao: 'nordeste',
  estoque: estoque10
});

pedido10.adicionarItem(mouse); // R$ 120
pedido10.adicionarItem(livro); // R$ 80
// Subtotal: R$ 200

const cupom50 = CupomDesconto.criar({
  codigo: 'TESTE50',
  tipo: 'percentual',
  valor: 50,
  validade: '2027-12-31',
  valorMinimo: 0,
  cumulativo: true
});

const cupom100 = CupomDesconto.criar({
  codigo: 'TESTE100',
  tipo: 'fixo',
  valor: 100,
  validade: '2027-12-31',
  valorMinimo: 0,
  cumulativo: true
});

console.log('Criação dos cupons:', cupom50.ok, cupom100.ok);

if (cupom50.ok && cupom100.ok) {
  console.log('Aplicação do cupom percentual:', pedido10.aplicarCupom(cupom50.dados));
  console.log('Aplicação do cupom fixo:', pedido10.aplicarCupom(cupom100.dados));

  const resultado10 = pedido10.resumo();

  console.log('Subtotal:', resultado10.dados.subtotal);
  console.log('Desconto total:', resultado10.dados.descontoTotal);
  console.log('Subtotal após desconto:', resultado10.dados.subtotal - resultado10.dados.descontoTotal);
  console.log('Total com frete:', resultado10.dados.total);
}
