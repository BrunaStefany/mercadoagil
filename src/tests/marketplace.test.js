import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Marketplace } from '../services/Marketplace.js';
import { criarServidor } from '../index.js';

const criarDadosBase = () => {
  const marketplace = new Marketplace();

  const cliente = marketplace.cadastrarCliente({
    nome: 'Maria Silva',
    email: 'maria@email.com',
    cpf: '12345678901',
    regiao: 'sudeste',
  });

  const vendedor = marketplace.cadastrarVendedor({
    nomeLoja: 'TechNorte',
    cnpj: '12345678000199',
    email: 'contato@technorte.com',
  });

  const produto = marketplace.cadastrarProduto({
    nome: 'Fone Bluetooth',
    preco: 100,
    categoria: 'eletronicos',
    vendedorId: vendedor.dados.id,
    estoque: 5,
  });

  return { marketplace, cliente, vendedor, produto };
};

describe('Marketplace', () => {
  test('cadastra, lista e busca cliente sem expor CPF', () => {
    const { marketplace, cliente } = criarDadosBase();

    assert.equal(cliente.ok, true);
    assert.equal(cliente.dados.nome, 'Maria Silva');
    assert.equal(Object.hasOwn(cliente.dados, 'cpf'), false);

    const lista = marketplace.listarClientes();
    assert.equal(lista.ok, true);
    assert.equal(lista.dados.length >= 1, true);

    const busca = marketplace.buscarCliente(cliente.dados.id);
    assert.equal(busca.ok, true);
    assert.equal(busca.dados.email, 'maria@email.com');
  });

  test('cadastra, lista e busca vendedor e produto', () => {
    const { marketplace, vendedor, produto } = criarDadosBase();

    assert.equal(vendedor.ok, true);
    assert.equal(produto.ok, true);
    assert.equal(produto.dados.estoque, 5);

    const listaVendedores = marketplace.listarVendedores('Tech');
    assert.equal(listaVendedores.ok, true);
    assert.equal(listaVendedores.dados.some((item) => item.nomeLoja === 'TechNorte'), true);

    const listaProdutos = marketplace.listarProdutos('Fone');
    assert.equal(listaProdutos.ok, true);
    assert.equal(listaProdutos.dados.some((item) => item.nome === 'Fone Bluetooth'), true);
  });

  test('atualiza os quatro cadastros sem expor CPF e valida duplicidades', () => {
    const { marketplace, cliente, vendedor, produto } = criarDadosBase();
    const outroCliente = marketplace.cadastrarCliente({
      nome: 'Joana Costa',
      email: 'joana@email.com',
      cpf: '98765432100',
      regiao: 'sul',
    });
    const outroVendedor = marketplace.cadastrarVendedor({
      nomeLoja: 'Livraria Central',
      cnpj: '98765432000188',
      email: 'livraria@email.com',
    });
    const outroProduto = marketplace.cadastrarProduto({
      nome: 'Livro de Teste',
      preco: 30,
      categoria: 'livros',
      vendedorId: vendedor.dados.id,
      estoque: 4,
    });
    const cupom = marketplace.buscarCupom(1);

    const clienteAtualizado = marketplace.atualizarCliente(cliente.dados.id, {
      nome: 'Maria Atualizada',
    });
    assert.equal(clienteAtualizado.ok, true);
    assert.equal(clienteAtualizado.dados.nome, 'Maria Atualizada');
    assert.equal(Object.hasOwn(clienteAtualizado.dados, 'cpf'), false);
    assert.equal(
      marketplace.atualizarCliente(cliente.dados.id, { email: outroCliente.dados.email }).ok,
      false
    );

    const vendedorAtualizado = marketplace.atualizarVendedor(vendedor.dados.id, {
      nomeLoja: 'TechNorte Atualizada',
    });
    assert.equal(vendedorAtualizado.ok, true);
    assert.equal(vendedorAtualizado.dados.email, 'contato@technorte.com');
    assert.equal(
      marketplace.atualizarVendedor(vendedor.dados.id, { cnpj: outroVendedor.dados.cnpj }).ok,
      false
    );

    const produtoAtualizado = marketplace.atualizarProduto(produto.dados.id, {
      preco: 125,
      estoque: 8,
    });
    assert.equal(produtoAtualizado.ok, true);
    assert.equal(produtoAtualizado.dados.preco, 125);
    assert.equal(produtoAtualizado.dados.estoque, 8);
    assert.equal(marketplace.buscarProduto(outroProduto.dados.id).dados.estoque, 4);

    const cupomAtualizado = marketplace.atualizarCupom(cupom.dados.id, { valor: 12 });
    assert.equal(cupomAtualizado.ok, true);
    assert.equal(cupomAtualizado.dados.valor, 12);
    assert.equal(cupomAtualizado.dados.codigo, cupom.dados.codigo);
  });

  test('PUT atualiza os quatro recursos pela API HTTP', async () => {
    const { marketplace, cliente, vendedor, produto } = criarDadosBase();
    const servidor = criarServidor(marketplace);
    await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));

    try {
      const baseUrl = `http://127.0.0.1:${servidor.address().port}/api`;
      const atualizacoes = [
        [`clientes/${cliente.dados.id}`, { nome: 'Cliente via HTTP' }],
        [`vendedores/${vendedor.dados.id}`, { nomeLoja: 'Vendedor via HTTP' }],
        [`produtos/${produto.dados.id}`, { preco: 115, estoque: 9 }],
        ['cupons/1', { valor: 11 }],
      ];

      for (const [rota, corpo] of atualizacoes) {
        const resposta = await fetch(`${baseUrl}/${rota}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(corpo),
        });
        const resultado = await resposta.json();
        assert.equal(resposta.status, 200, rota);
        assert.equal(resultado.ok, true, rota);
        assert.ok(resultado.dados, rota);
      }
    } finally {
      await new Promise((resolve, reject) => {
        servidor.close((falha) => falha ? reject(falha) : resolve());
      });
    }
  });

  test('cria pedido com cupom e confirma', () => {
    const { marketplace, cliente, produto } = criarDadosBase();
    const cupom = marketplace.cadastrarCupom({
      codigo: 'NOVA10',
      tipo: 'percentual',
      valor: 10,
      validade: '2099-12-31T23:59:59.000Z',
      valorMinimo: 0,
      cumulativo: true,
    });

    assert.equal(cupom.ok, true);

    const pedido = marketplace.criarPedido({
      clienteId: cliente.dados.id,
      itens: [{ produtoId: produto.dados.id, quantidade: 2 }],
      cupons: ['NOVA10'],
    });

    assert.equal(pedido.ok, true);
    assert.equal(pedido.dados.total > 0, true);
    assert.equal(pedido.dados.status, 'confirmado');
  });

  test('exclui registros e rejeita operações inválidas', () => {
    const { marketplace, cliente, vendedor, produto } = criarDadosBase();

    assert.equal(marketplace.excluirCliente(cliente.dados.id).ok, true);
    assert.equal(marketplace.excluirVendedor(vendedor.dados.id).ok, true);
    assert.equal(marketplace.excluirProduto(produto.dados.id).ok, true);

    const pedidoInvalido = marketplace.criarPedido({
      clienteId: 999,
      itens: [{ produtoId: 1, quantidade: 1 }],
    });

    assert.equal(pedidoInvalido.ok, false);
    assert.match(pedidoInvalido.erros.join(' '), /cliente/i);
  });
});
