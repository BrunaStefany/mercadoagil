import { Cliente } from '../models/Cliente.js';
import { CupomDesconto } from '../models/CupomDesconto.js';
import { Estoque } from '../models/Estoque.js';
import { Pedido } from '../models/Pedido.js';
import { Produto } from '../models/Produto.js';
import { Vendedor } from '../models/vendedor.js';
import {
  clientes,
  cupons,
  estoqueInicial,
  produtos,
  vendedores,
} from '../data/seed.js';
import { clienteSchema } from '../schemas/clienteSchema.js';
import { cupomSchema } from '../schemas/cupomSchema.js';
import { produtoSchema } from '../schemas/produtoSchema.js';
import { vendedorSchema } from '../schemas/vendedorSchema.js';

const validar = (schema, entrada) => {
  const resultado = schema.safeParse(entrada);
  if (resultado.success) return { ok: true, dados: resultado.data };
  return {
    ok: false,
    erros: resultado.error.issues.map(({ path, message }) =>
      path.length ? `${path.join('.')}: ${message}` : message
    ),
  };
};

const erro = (mensagem) => ({ ok: false, erros: [mensagem] });
const procurar = (registros, termo, campos) => {
  const busca = String(termo ?? '').trim().toLocaleLowerCase('pt-BR');
  return [...registros.values()]
    .map((registro) => registro.saida())
    .filter((registro) =>
      campos.some((campo) => String(registro[campo] ?? '').toLocaleLowerCase('pt-BR').includes(busca))
    );
};

export class Marketplace {
  #clientes = new Map();
  #vendedores = new Map();
  #produtos = new Map();
  #cupons = new Map();
  #pedidos = new Map();
  #estoque = new Estoque();
  #proximoId = { cliente: 1, vendedor: 1, produto: 1, cupom: 1, pedido: 1 };

  constructor({ carregarDadosIniciais = false } = {}) {
    for (const modelo of cupons) {
      const id = this.#proximoId.cupom++;
      this.#cupons.set(id, { id, modelo, saida: () => ({ id, ...modelo.toJSON() }) });
    }

    if (!carregarDadosIniciais) return;

    for (const cliente of clientes) {
      const { id } = cliente;
      const modelo = new Cliente(cliente);
      this.#clientes.set(id, {
        id,
        modelo,
        saida: () => ({ id, nome: modelo.nome, email: modelo.email, regiao: modelo.regiao }),
      });
    }

    for (const vendedor of vendedores) {
      const { id } = vendedor;
      const modelo = new Vendedor(vendedor);
      this.#vendedores.set(id, {
        id,
        modelo,
        saida: () => ({ id, nomeLoja: modelo.nomeLoja, cnpj: modelo.cnpj, email: modelo.email }),
      });
    }

    for (const produto of produtos) {
      const { id } = produto;
      const modelo = new Produto(produto);
      this.#produtos.set(id, {
        id,
        modelo,
        saida: () => ({
          id,
          nome: modelo.nome,
          preco: modelo.preco,
          categoria: modelo.categoria,
          vendedorId: modelo.vendedorId,
          estoque: this.#estoque.obterQuantidade(id),
        }),
      });
      this.#estoque.definirQuantidade(id, estoqueInicial[id] ?? 0);
    }

    this.#proximoId.cliente = this.#proximoIdSeguinte(this.#clientes);
    this.#proximoId.vendedor = this.#proximoIdSeguinte(this.#vendedores);
    this.#proximoId.produto = this.#proximoIdSeguinte(this.#produtos);
  }

  #proximoIdSeguinte(mapa) {
    return mapa.size === 0 ? 1 : Math.max(...mapa.keys()) + 1;
  }

  #criar(tipo, mapa, entrada, schema, construir, saida, verificar = () => null) {
    const validacao = validar(schema, entrada);
    if (!validacao.ok) return validacao;

    const conflito = verificar(validacao.dados);
    if (conflito) return erro(conflito);

    const id = this.#proximoId[tipo]++;
    const modelo = construir({ ...validacao.dados, id });
    const registro = { id, modelo, saida: () => saida(id, modelo) };
    mapa.set(id, registro);
    return { ok: true, dados: registro.saida() };
  }

  #listar(mapa, busca, campos) {
    if (busca !== undefined && String(busca).trim()) {
      return { ok: true, dados: procurar(mapa, busca, campos) };
    }
    return { ok: true, dados: [...mapa.values()].map((registro) => registro.saida()) };
  }

  #obter(mapa, id, nome) {
    const registro = mapa.get(Number(id));
    return registro
      ? { ok: true, dados: registro.saida() }
      : erro(`${nome} não encontrado.`);
  }

  #excluir(mapa, id, nome) {
    const chave = Number(id);
    if (!mapa.has(chave)) return erro(`${nome} não encontrado.`);
    mapa.delete(chave);
    return { ok: true, dados: { id: chave, removido: true } };
  }

  #atualizar(mapa, id, nome, entrada, schema, base, construir, saida, verificar = () => null) {
    const chave = Number(id);
    const atual = mapa.get(chave);
    if (!atual) return erro(`${nome} não encontrado.`);
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
      return erro('O corpo da atualização precisa ser um objeto.');
    }

    const { id: idIgnorado, ...alteracoes } = entrada;
    const validacao = validar(schema, { ...base, ...alteracoes });
    if (!validacao.ok) return validacao;

    const conflito = verificar(validacao.dados, chave);
    if (conflito) return erro(conflito);

    const modelo = construir(validacao.dados);
    const registro = { id: chave, modelo, saida: () => saida(chave, modelo) };
    mapa.set(chave, registro);
    return { ok: true, dados: registro.saida() };
  }

  cadastrarCliente(entrada) {
    return this.#criar(
      'cliente',
      this.#clientes,
      entrada,
      clienteSchema,
      (dados) => new Cliente(dados),
      (id, cliente) => ({ id, nome: cliente.nome, email: cliente.email, regiao: cliente.regiao }),
      ({ cpf, email }) => {
        if ([...this.#clientes.values()].some(({ modelo }) => modelo.cpf === cpf)) {
          return 'Já existe um cliente cadastrado com esse CPF.';
        }
        if ([...this.#clientes.values()].some(({ modelo }) => modelo.email === email)) {
          return 'Já existe um cliente cadastrado com esse e-mail.';
        }
        return null;
      }
    );
  }

  listarClientes(busca) {
    if (busca === undefined || !String(busca).trim()) {
      return this.#listar(this.#clientes, busca, ['nome', 'email', 'regiao']);
    }

    const texto = String(busca).trim();
    const textoNormalizado = texto.toLocaleLowerCase('pt-BR');
    const clientesEncontrados = [...this.#clientes.values()]
      .filter(({ modelo }) => {
        const correspondeAoTexto = ['nome', 'email', 'regiao'].some((campo) =>
          String(modelo[campo] ?? '').toLocaleLowerCase('pt-BR').includes(textoNormalizado)
        );
        return correspondeAoTexto || modelo.cpf === texto;
      })
      .map(({ id, modelo }) => {
        const { cpf, ...clienteSemCpf } = {
          id,
          nome: modelo.nome,
          email: modelo.email,
          regiao: modelo.regiao,
          cpf: modelo.cpf,
        };
        return clienteSemCpf;
      });

    return { ok: true, dados: clientesEncontrados };
  }

  buscarCliente(id) { return this.#obter(this.#clientes, id, 'Cliente'); }
  excluirCliente(id) { return this.#excluir(this.#clientes, id, 'Cliente'); }

  atualizarCliente(id, entrada) {
    const atual = this.#clientes.get(Number(id));
    if (!atual) return erro('Cliente não encontrado.');
    return this.#atualizar(
      this.#clientes,
      id,
      'Cliente',
      entrada,
      clienteSchema,
      {
        nome: atual.modelo.nome,
        email: atual.modelo.email,
        cpf: atual.modelo.cpf,
        regiao: atual.modelo.regiao,
      },
      (dados) => new Cliente(dados),
      (chave, cliente) => ({
        id: chave,
        nome: cliente.nome,
        email: cliente.email,
        regiao: cliente.regiao,
      }),
      ({ cpf, email }, chave) => {
        if ([...this.#clientes.values()].some(({ id: outroId, modelo }) => outroId !== chave && modelo.cpf === cpf)) {
          return 'Já existe um cliente cadastrado com esse CPF.';
        }
        if ([...this.#clientes.values()].some(({ id: outroId, modelo }) => outroId !== chave && modelo.email === email)) {
          return 'Já existe um cliente cadastrado com esse e-mail.';
        }
        return null;
      }
    );
  }

  cadastrarVendedor(entrada) {
    return this.#criar(
      'vendedor',
      this.#vendedores,
      entrada,
      vendedorSchema,
      (dados) => new Vendedor(dados),
      (id, vendedor) => ({ id, nomeLoja: vendedor.nomeLoja, cnpj: vendedor.cnpj, email: vendedor.email }),
      ({ email, cnpj }) => {
        if ([...this.#vendedores.values()].some(({ modelo }) => modelo.email === email)) {
          return 'Já existe um vendedor cadastrado com esse e-mail.';
        }
        if ([...this.#vendedores.values()].some(({ modelo }) => modelo.cnpj === cnpj)) {
          return 'Já existe um vendedor cadastrado com esse CNPJ.';
        }
        return null;
      }
    );
  }

  listarVendedores(busca) { return this.#listar(this.#vendedores, busca, ['nomeLoja', 'email', 'cnpj']); }
  buscarVendedor(id) { return this.#obter(this.#vendedores, id, 'Vendedor'); }
  excluirVendedor(id) { return this.#excluir(this.#vendedores, id, 'Vendedor'); }

  atualizarVendedor(id, entrada) {
    const atual = this.#vendedores.get(Number(id));
    if (!atual) return erro('Vendedor não encontrado.');
    return this.#atualizar(
      this.#vendedores,
      id,
      'Vendedor',
      entrada,
      vendedorSchema,
      {
        nomeLoja: atual.modelo.nomeLoja,
        cnpj: atual.modelo.cnpj,
        email: atual.modelo.email,
      },
      (dados) => new Vendedor({ ...dados, id: Number(id) }),
      (chave, vendedor) => ({
        id: chave,
        nomeLoja: vendedor.nomeLoja,
        cnpj: vendedor.cnpj,
        email: vendedor.email,
      }),
      ({ email, cnpj }, chave) => {
        if ([...this.#vendedores.values()].some(({ id: outroId, modelo }) => outroId !== chave && modelo.email === email)) {
          return 'Já existe um vendedor cadastrado com esse e-mail.';
        }
        if ([...this.#vendedores.values()].some(({ id: outroId, modelo }) => outroId !== chave && modelo.cnpj === cnpj)) {
          return 'Já existe um vendedor cadastrado com esse CNPJ.';
        }
        return null;
      }
    );
  }

  cadastrarProduto(entrada) {
    if (!entrada || !Number.isInteger(entrada.estoque ?? 0) || (entrada.estoque ?? 0) < 0) {
      return erro('estoque: informe um número inteiro maior ou igual a zero.');
    }
    const vendedorId = Number(entrada.vendedorId);
    if (!this.#vendedores.has(vendedorId)) return erro('O vendedor informado não foi encontrado.');

    const resposta = this.#criar(
      'produto',
      this.#produtos,
      { ...entrada, vendedorId },
      produtoSchema,
      (dados) => new Produto(dados),
      (id, produto) => ({
        id,
        nome: produto.nome,
        preco: produto.preco,
        categoria: produto.categoria,
        vendedorId: produto.vendedorId,
        estoque: entrada.estoque ?? this.#estoque.obterQuantidade(id),
      })
    );

    if (resposta.ok) {
      this.#estoque.definirQuantidade(resposta.dados.id, entrada.estoque ?? 0);
      return { ok: true, dados: { ...resposta.dados, estoque: entrada.estoque ?? 0 } };
    }

    return resposta;
  }

  listarProdutos(busca) { return this.#listar(this.#produtos, busca, ['nome', 'categoria']); }
  buscarProduto(id) { return this.#obter(this.#produtos, id, 'Produto'); }
  atualizarProduto(id, entrada) {
    const chave = Number(id);
    const atual = this.#produtos.get(chave);
    if (!atual) return erro('Produto não encontrado.');
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
      return erro('O corpo da atualização precisa ser um objeto.');
    }

    const estoque = entrada.estoque ?? this.#estoque.obterQuantidade(chave);
    if (!Number.isInteger(estoque) || estoque < 0) {
      return erro('estoque: informe um número inteiro maior ou igual a zero.');
    }

    const vendedorId = entrada.vendedorId === undefined
      ? atual.modelo.vendedorId
      : Number(entrada.vendedorId);
    if (!this.#vendedores.has(vendedorId)) return erro('O vendedor informado não foi encontrado.');

    const { estoque: estoqueIgnorado, ...alteracoes } = entrada;
    const resposta = this.#atualizar(
      this.#produtos,
      chave,
      'Produto',
      { ...alteracoes, vendedorId },
      produtoSchema,
      {
        nome: atual.modelo.nome,
        preco: atual.modelo.preco,
        categoria: atual.modelo.categoria,
        vendedorId: atual.modelo.vendedorId,
      },
      (dados) => new Produto({ ...dados, id: chave }),
      (produtoId, produto) => ({
        id: produtoId,
        nome: produto.nome,
        preco: produto.preco,
        categoria: produto.categoria,
        vendedorId: produto.vendedorId,
        estoque,
      })
    );

    if (resposta.ok) this.#estoque.definirQuantidade(chave, estoque);
    return resposta;
  }

  excluirProduto(id) {
    const chave = Number(id);
    const resposta = this.#excluir(this.#produtos, chave, 'Produto');
    if (resposta.ok) this.#estoque.definirQuantidade(chave, 0);
    return resposta;
  }

  cadastrarCupom(entrada) {
    return this.#criar(
      'cupom',
      this.#cupons,
      entrada,
      cupomSchema,
      (dados) => new CupomDesconto(dados),
      (id, cupom) => ({ id, ...cupom.toJSON() }),
      ({ codigo }) => [...this.#cupons.values()].some(({ modelo }) => modelo.codigo === codigo)
        ? 'Já existe um cupom cadastrado com esse código.'
        : null
    );
  }

  listarCupons(busca) { return this.#listar(this.#cupons, busca, ['codigo', 'tipo']); }
  buscarCupom(id) { return this.#obter(this.#cupons, id, 'Cupom'); }
  excluirCupom(id) { return this.#excluir(this.#cupons, id, 'Cupom'); }

  atualizarCupom(id, entrada) {
    const atual = this.#cupons.get(Number(id));
    if (!atual) return erro('Cupom não encontrado.');
    return this.#atualizar(
      this.#cupons,
      id,
      'Cupom',
      entrada,
      cupomSchema,
      atual.modelo.toJSON(),
      (dados) => new CupomDesconto(dados),
      (chave, cupom) => ({ id: chave, ...cupom.toJSON() }),
      ({ codigo }, chave) => [...this.#cupons.values()].some(
        ({ id: outroId, modelo }) => outroId !== chave && modelo.codigo === codigo
      ) ? 'Já existe um cupom cadastrado com esse código.' : null
    );
  }

  criarPedido(entrada) {
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
      return erro('O corpo do pedido precisa ser um objeto.');
    }
    const cliente = this.#clientes.get(Number(entrada.clienteId));
    if (!cliente) return erro('O cliente informado não foi encontrado.');
    if (!Array.isArray(entrada.itens) || entrada.itens.length === 0) {
      return erro('O pedido precisa ter pelo menos um item.');
    }
    if (entrada.cupons !== undefined && !Array.isArray(entrada.cupons)) {
      return erro('cupons precisa ser um array de códigos.');
    }

    const id = this.#proximoId.pedido;
    const pedido = new Pedido({
      id,
      clienteId: cliente.id,
      regiao: cliente.modelo.regiao,
      estoque: this.#estoque,
    });
    const erros = [];
    for (const item of entrada.itens) {
      const produtoId = Number(item?.produtoId);
      const quantidade = item?.quantidade;
      const produto = this.#produtos.get(produtoId);
      if (!produto) {
        erros.push(`Produto ${item?.produtoId ?? ''} não encontrado.`);
        continue;
      }
      const adicao = pedido.adicionarItem({
        produtoId,
        quantidade,
        nome: produto.modelo.nome,
        categoria: produto.modelo.categoria,
        vendedorId: produto.modelo.vendedorId,
        precoUnitario: produto.modelo.preco,
      });
      if (!adicao.ok) erros.push(...adicao.erros);
    }
    if (erros.length) return { ok: false, erros };

    for (const codigo of entrada.cupons ?? []) {
      if (typeof codigo !== 'string') {
        erros.push('Cada cupom precisa ser informado pelo código em texto.');
        continue;
      }
      const cupom = [...this.#cupons.values()].find(({ modelo }) => modelo.codigo === codigo.trim().toUpperCase());
      if (!cupom) {
        erros.push(`Cupom ${codigo} não encontrado.`);
        continue;
      }
      const aplicacao = pedido.aplicarCupom(cupom.modelo);
      if (!aplicacao.ok) erros.push(...aplicacao.erros);
    }
    if (erros.length) return { ok: false, erros };

    const confirmacao = pedido.confirmar();
    if (!confirmacao.ok) return confirmacao;
    this.#proximoId.pedido++;
    this.#pedidos.set(id, pedido);
    return confirmacao;
  }

  criarPedidoRascunho(clienteId) {
    const cliente = this.#clientes.get(Number(clienteId));
    if (!cliente) return erro('O cliente informado não foi encontrado.');

    const id = this.#proximoId.pedido++;
    const pedido = new Pedido({
      id,
      clienteId: cliente.id,
      regiao: cliente.modelo.regiao,
      estoque: this.#estoque,
    });
    this.#pedidos.set(id, pedido);
    return { ok: true, dados: { id, status: pedido.status, clienteId: cliente.id } };
  }

  adicionarItemPedido(pedidoId, produtoId, quantidade) {
    const pedido = this.#pedidos.get(Number(pedidoId));
    if (!pedido) return erro('Pedido não encontrado.');
    const produto = this.#produtos.get(Number(produtoId));
    if (!produto) return erro('Produto não encontrado.');

    const resposta = pedido.adicionarItem({
      produtoId: Number(produtoId),
      quantidade: Number(quantidade),
      nome: produto.modelo.nome,
      categoria: produto.modelo.categoria,
      vendedorId: produto.modelo.vendedorId,
      precoUnitario: produto.modelo.preco,
    });
    return resposta.ok ? pedido.resumo() : resposta;
  }

  aplicarCupomPedido(pedidoId, codigo) {
    const pedido = this.#pedidos.get(Number(pedidoId));
    if (!pedido) return erro('Pedido não encontrado.');
    if (typeof codigo !== 'string' || !codigo.trim()) return erro('Informe o código do cupom.');

    const registro = [...this.#cupons.values()]
      .find(({ modelo }) => modelo.codigo === codigo.trim().toUpperCase());
    if (!registro) return erro(`Cupom ${codigo} não encontrado.`);
    const resposta = pedido.aplicarCupom(registro.modelo);
    return resposta.ok ? pedido.resumo() : resposta;
  }

  resumoPedido(pedidoId) {
    const pedido = this.#pedidos.get(Number(pedidoId));
    return pedido ? pedido.resumo() : erro('Pedido não encontrado.');
  }

  confirmarPedido(pedidoId) {
    const pedido = this.#pedidos.get(Number(pedidoId));
    if (!pedido) return erro('Pedido não encontrado.');
    return pedido.confirmar();
  }

  cancelarPedido(pedidoId) {
    const pedido = this.#pedidos.get(Number(pedidoId));
    if (!pedido) return erro('Pedido não encontrado.');
    return pedido.cancelar();
  }

  listarPedidos() {
    return { ok: true, dados: [...this.#pedidos.values()].map((pedido) => pedido.resumo().dados) };
  }
}
