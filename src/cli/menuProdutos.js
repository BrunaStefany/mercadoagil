import { perguntar, mostrarResposta } from './util.js';

const TEXTO_MENU = `
--- Produtos ---
1 - Cadastrar
2 - Listar todos
3 - Buscar (nome ou categoria)
4 - Atualizar
5 - Excluir (pelo id)
0 - Voltar`;

async function cadastrar(rl, marketplace) {
  const nome = await perguntar(rl, 'Nome: ');
  const preco = Number(await perguntar(rl, 'Preço: '));
  const categoria = await perguntar(rl, 'Categoria (eletronicos, livros, alimentos, vestuario ou casa): ');
  const vendedorId = Number(await perguntar(rl, 'Id do vendedor: '));
  const estoque = Number(await perguntar(rl, 'Estoque inicial: '));
  mostrarResposta(marketplace.cadastrarProduto({ nome, preco, categoria, vendedorId, estoque }));
}

async function buscar(rl, marketplace) {
  const texto = await perguntar(rl, 'Digite o nome ou categoria: ');
  mostrarResposta(marketplace.listarProdutos(texto));
}

async function atualizar(rl, marketplace) {
  const id = await perguntar(rl, 'Id do produto: ');
  const atual = marketplace.buscarProduto(Number(id));
  if (!atual.ok) return mostrarResposta(atual);
  const nome = await perguntar(rl, `Nome [${atual.dados.nome}]: `);
  const precoTexto = await perguntar(rl, `Preço [${atual.dados.preco}]: `);
  const categoria = await perguntar(rl, `Categoria [${atual.dados.categoria}]: `);
  const vendedorTexto = await perguntar(rl, `Id do vendedor [${atual.dados.vendedorId}]: `);
  const estoqueTexto = await perguntar(rl, `Estoque [${atual.dados.estoque}]: `);
  mostrarResposta(marketplace.atualizarProduto(Number(id), {
    ...(nome && { nome }),
    ...(precoTexto && { preco: Number(precoTexto) }),
    ...(categoria && { categoria }),
    ...(vendedorTexto && { vendedorId: Number(vendedorTexto) }),
    ...(estoqueTexto && { estoque: Number(estoqueTexto) }),
  }));
}

async function excluir(rl, marketplace) {
  const id = await perguntar(rl, 'Id do produto a excluir: ');
  mostrarResposta(marketplace.excluirProduto(Number(id)));
}

export async function menuProdutos(rl, marketplace) {
  let voltar = false;
  while (!voltar) {
    console.log(TEXTO_MENU);
    const escolha = await perguntar(rl, 'Escolha uma opção: ');
    if (escolha === '0') voltar = true;
    else if (escolha === '1') await cadastrar(rl, marketplace);
    else if (escolha === '2') mostrarResposta(marketplace.listarProdutos(''));
    else if (escolha === '3') await buscar(rl, marketplace);
    else if (escolha === '4') await atualizar(rl, marketplace);
    else if (escolha === '5') await excluir(rl, marketplace);
    else console.log('\nOpção inválida. Digite um dos números do menu.');
  }
}
