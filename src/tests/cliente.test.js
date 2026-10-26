import { describe, test } from 'node:test';
import assert from 'node:assert';
import { Cliente } from '../models/Cliente.js';
import { clienteSchema } from '../schemas/clienteSchema.js';

describe('Testes do Modelo e Schema de Cliente', () => {

  test('Deve instanciar a classe Cliente corretamente', () => {
    const dados = {
      nome: 'Maria Silva',
      email: 'maria@email.com',
      cpf: '12345678901',
      regiao: 'nordeste'
    };

    const cliente = new Cliente(dados);

    assert.strictEqual(cliente.nome, 'Maria Silva');
    assert.strictEqual(cliente.regiao, 'nordeste');
  });

  test('Schema deve aprovar dados válidos', () => {
    const dadosValidos = {
      nome: 'João Souza',
      email: 'joao@email.com',
      cpf: '09876543210',
      regiao: 'sul'
    };

    const resultado = clienteSchema.safeParse(dadosValidos);
    assert.strictEqual(resultado.success, true);
  });

  test('Schema deve reprovar CPF com menos de 11 dígitos', () => {
    const dadosInvalidos = {
      nome: 'Ana',
      email: 'ana@email.com',
      cpf: '123', // Inválido
      regiao: 'norte'
    };

    const resultado = clienteSchema.safeParse(dadosInvalidos);
    assert.strictEqual(resultado.success, false);
    assert.match(resultado.error.issues[0].message, /Formato de CPF inválido/);
  });

  test('Schema deve reprovar região inexistente', () => {
    const dadosInvalidos = {
      nome: 'Carlos',
      email: 'carlos@email.com',
      cpf: '11122233344',
      regiao: 'exterior'
    };

    const resultado = clienteSchema.safeParse(dadosInvalidos);
    assert.strictEqual(resultado.success, false);
    assert.match(resultado.error.issues[0].message, /Região inválida/);
  });
});