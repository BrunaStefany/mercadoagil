// Rode com: node --test src/tests/descontos.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CupomDesconto } from '../models/CupomDesconto.js';
import { aplicarCupons } from '../services/descontos.js';

const daqui = (dias) => new Date(Date.now() + dias * 86_400_000);
const cupom = (entrada) => {
  const r = CupomDesconto.criar({ validade: daqui(365), ...entrada });
  assert.ok(r.ok, `cupom de teste inválido: ${r.erros}`);
  return r.dados;
};

const bemvindo = cupom({ codigo: 'BEMVINDO10', tipo: 'percentual', valor: 10 });
const pda = cupom({ codigo: 'PDA15', tipo: 'fixo', valor: 15, valorMinimo: 50 });
const freteZero = cupom({ codigo: 'FRETEZERO', tipo: 'frete', valor: 0 });
const solo = cupom({ codigo: 'SOLO20', tipo: 'percentual', valor: 20, cumulativo: false });

test('BEMVINDO10 + PDA15 sobre R$ 200 = R$ 35 de desconto', () => {
  const r = aplicarCupons([bemvindo, pda], 200);
  assert.equal(r.ok, true);
  assert.equal(r.dados.descontoTotal, 35);
  assert.equal(r.dados.temCupomFrete, false);
});

test('a ordem em que os cupons chegam não muda o resultado', () => {
  const lista = [pda, bemvindo];
  const r = aplicarCupons(lista, 200);
  assert.equal(r.dados.descontoTotal, 35);
  assert.deepEqual(lista.map((c) => c.codigo), ['PDA15', 'BEMVINDO10']); // original intacto
});

test('teto: subtotal R$ 100, 10% e fixo R$ 40 => limitado a R$ 30', () => {
  const fixo40 = cupom({ codigo: 'FIXO40', tipo: 'fixo', valor: 40 });
  const r = aplicarCupons([bemvindo, fixo40], 100);
  assert.equal(r.dados.descontoTotal, 30);
  assert.equal(r.dados.limitadoPeloTeto, true);
});

test('cupom de frete não tira do subtotal, só avisa', () => {
  const sozinho = aplicarCupons([freteZero], 200);
  assert.equal(sozinho.dados.descontoTotal, 0);
  assert.equal(sozinho.dados.temCupomFrete, true);
  const junto = aplicarCupons([bemvindo, freteZero], 200);
  assert.equal(junto.dados.descontoTotal, 20);
  assert.equal(junto.dados.temCupomFrete, true);
});

test('sem cupons: desconto zero', () => {
  const r = aplicarCupons([], 200);
  assert.deepEqual([r.ok, r.dados.descontoTotal, r.dados.temCupomFrete], [true, 0, false]);
});

test('três cupons: recusado', () => {
  const r = aplicarCupons([bemvindo, pda, freteZero], 200);
  assert.equal(r.ok, false);
  assert.match(r.erros.join(' '), /Máximo de 2 cupons/);
});

test('cupom repetido: recusado', () => {
  const r = aplicarCupons([bemvindo, bemvindo], 200);
  assert.equal(r.ok, false);
  assert.match(r.erros.join(' '), /repetido/);
});

test('cupom vencido na hora de aplicar: recusado', () => {
  const r = aplicarCupons([bemvindo], 200, daqui(400));
  assert.equal(r.ok, false);
  assert.match(r.erros.join(' '), /vencido/);
});

test('subtotal abaixo do valor mínimo: recusado', () => {
  const r = aplicarCupons([pda], 30);
  assert.equal(r.ok, false);
  assert.match(r.erros.join(' '), /mínimo/);
});

test('cupom não cumulativo só sozinho', () => {
  assert.equal(aplicarCupons([solo, bemvindo], 200).ok, false);
  assert.equal(aplicarCupons([solo], 200).ok, true);
});

test('entradas estranhas não derrubam o programa', () => {
  assert.equal(aplicarCupons(null, 200).ok, false);
  assert.equal(aplicarCupons([bemvindo], 'abc').ok, false);
  assert.equal(aplicarCupons([{ codigo: 'FALSO' }], 200).ok, false);
});
