import { perguntar, mostrarResposta } from './util.js';

const TEXTO_MENU = `
--- Vendedores ---
1 - Cadastrar
2 - Listar todos
3 - Buscar (loja, CNPJ ou e-mail)
4 - Atualizar
5 - Excluir (pelo id)
0 - Voltar`;

async function cadastrar(rl, marketplace) {
  const nomeLoja = await perguntar(rl, 'Nome da loja: ');
  const cnpj = await perguntar(rl, 'CNPJ (só números): ');
  const email = await perguntar(rl, 'E-mail: ');
  mostrarResposta(marketplace.cadastrarVendedor({ nomeLoja, cnpj, email }));
}

async function buscar(rl, marketplace) {
  const texto = await perguntar(rl, 'Digite a loja, CNPJ ou e-mail: ');
  mostrarResposta(marketplace.listarVendedores(texto));
}

async function atualizar(rl, marketplace) {
  const id = await perguntar(rl, 'Id do vendedor: ');
  const atual = marketplace.buscarVendedor(Number(id));
  if (!atual.ok) return mostrarResposta(atual);
  const nomeLoja = await perguntar(rl, `Nome da loja [${atual.dados.nomeLoja}]: `);
  const cnpj = await perguntar(rl, `CNPJ [${atual.dados.cnpj}]: `);
  const email = await perguntar(rl, `E-mail [${atual.dados.email}]: `);
  mostrarResposta(marketplace.atualizarVendedor(Number(id), {
    ...(nomeLoja && { nomeLoja }),
    ...(cnpj && { cnpj }),
    ...(email && { email }),
  }));
}

async function excluir(rl, marketplace) {
  const id = await perguntar(rl, 'Id do vendedor a excluir: ');
  mostrarResposta(marketplace.excluirVendedor(Number(id)));
}

export async function menuVendedores(rl, marketplace) {
  let voltar = false;
  while (!voltar) {
    console.log(TEXTO_MENU);
    const escolha = await perguntar(rl, 'Escolha uma opção: ');
    if (escolha === '0') voltar = true;
    else if (escolha === '1') await cadastrar(rl, marketplace);
    else if (escolha === '2') mostrarResposta(marketplace.listarVendedores(''));
    else if (escolha === '3') await buscar(rl, marketplace);
    else if (escolha === '4') await atualizar(rl, marketplace);
    else if (escolha === '5') await excluir(rl, marketplace);
    else console.log('\nOpção inválida. Digite um dos números do menu.');
  }
}
