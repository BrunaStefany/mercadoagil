import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { Marketplace } from './services/Marketplace.js';

const recursos = {
  clientes: {
    listar: 'listarClientes',
    criar: 'cadastrarCliente',
    obter: 'buscarCliente',
    atualizar: 'atualizarCliente',
    excluir: 'excluirCliente',
  },
  vendedores: {
    listar: 'listarVendedores',
    criar: 'cadastrarVendedor',
    obter: 'buscarVendedor',
    atualizar: 'atualizarVendedor',
    excluir: 'excluirVendedor',
  },
  produtos: {
    listar: 'listarProdutos',
    criar: 'cadastrarProduto',
    obter: 'buscarProduto',
    atualizar: 'atualizarProduto',
    excluir: 'excluirProduto',
  },
  cupons: {
    listar: 'listarCupons',
    criar: 'cadastrarCupom',
    obter: 'buscarCupom',
    atualizar: 'atualizarCupom',
    excluir: 'excluirCupom',
  },
};

const responder = (res, status, resultado) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(resultado));
};

const lerJson = (req) => new Promise((resolve, reject) => {
  let conteudo = '';
  req.setEncoding('utf8');
  req.on('data', (parte) => {
    conteudo += parte;
    if (Buffer.byteLength(conteudo) > 1_000_000) {
      reject(new Error('O corpo da requisição excede o limite de 1 MB.'));
      req.destroy();
    }
  });
  req.on('end', () => {
    if (!conteudo) return resolve({});
    try {
      resolve(JSON.parse(conteudo));
    } catch {
      reject(new Error('O corpo da requisição precisa ser um JSON válido.'));
    }
  });
  req.on('error', reject);
});

export function criarServidor(marketplace = new Marketplace({ carregarDadosIniciais: true })) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const partes = url.pathname.split('/').filter(Boolean);
    if (partes[0] !== 'api') {
      return responder(res, 404, { ok: false, erros: ['Rota não encontrada.'] });
    }

    if (partes[1] === 'pedidos') {
      if (partes.length === 2 && req.method === 'GET') {
        return responder(res, 200, marketplace.listarPedidos());
      }
      if (partes.length === 2 && req.method === 'POST') {
        try {
          const resultado = marketplace.criarPedido(await lerJson(req));
          return responder(res, resultado.ok ? 201 : 400, resultado);
        } catch (falha) {
          return responder(res, 400, { ok: false, erros: [falha.message] });
        }
      }
      return responder(res, 405, { ok: false, erros: ['Método não permitido para pedidos.'] });
    }

    const recurso = recursos[partes[1]];
    if (!recurso) return responder(res, 404, { ok: false, erros: ['Rota não encontrada.'] });

    if (partes.length === 2 && req.method === 'GET') {
      return responder(res, 200, marketplace[recurso.listar](url.searchParams.get('busca') ?? undefined));
    }
    if (partes.length === 2 && req.method === 'POST') {
      try {
        const resultado = marketplace[recurso.criar](await lerJson(req));
        return responder(res, resultado.ok ? 201 : 400, resultado);
      } catch (falha) {
        return responder(res, 400, { ok: false, erros: [falha.message] });
      }
    }
    if (partes.length === 3 && req.method === 'GET') {
      const resultado = marketplace[recurso.obter](partes[2]);
      return responder(res, resultado.ok ? 200 : 404, resultado);
    }
    if (partes.length === 3 && req.method === 'PUT') {
      const atual = marketplace[recurso.obter](partes[2]);
      if (!atual.ok) return responder(res, 404, atual);
      try {
        const resultado = marketplace[recurso.atualizar](partes[2], await lerJson(req));
        return responder(res, resultado.ok ? 200 : 400, resultado);
      } catch (falha) {
        return responder(res, 400, { ok: false, erros: [falha.message] });
      }
    }
    if (partes.length === 3 && req.method === 'DELETE') {
      const resultado = marketplace[recurso.excluir](partes[2]);
      return responder(res, resultado.ok ? 200 : 404, resultado);
    }
    return responder(res, 405, { ok: false, erros: ['Método não permitido para este recurso.'] });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const servidor = criarServidor();
  const porta = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  servidor.listen(porta, host, () => {
    console.log(`Marketplace disponível em http://${host}:${porta}`);
  });
}
