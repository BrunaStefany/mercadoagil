import { perguntar, mostrarResposta } from './util.js';

const TEXTO_MENU = `
--- Cupons ---
1 - Cadastrar
2 - Listar todos
3 - Buscar (código ou tipo)
4 - Atualizar
5 - Excluir (pelo id)
0 - Voltar`;

async function cadastrar(rl, marketplace) {
  const codigo = await perguntar(rl, 'Código: ');
  const tipo = await perguntar(rl, 'Tipo (percentual, fixo ou frete): ');
  const valor = Number(await perguntar(rl, 'Valor: '));
  const validade = await perguntar(rl, 'Validade (ex.: 2099-12-31): ');
  const valorMinimo = Number(await perguntar(rl, 'Valor mínimo [0]: ')) || 0;
  const cumulativo = (await perguntar(rl, 'Cumulativo? (s/n) [s]: ')).toLowerCase() !== 'n';
  mostrarResposta(marketplace.cadastrarCupom({ codigo, tipo, valor, validade, valorMinimo, cumulativo }));
}

async function buscar(rl, marketplace) {
  const texto = await perguntar(rl, 'Digite o código ou tipo: ');
  mostrarResposta(marketplace.listarCupons(texto));
}

async function atualizar(rl, marketplace) {
  const id = await perguntar(rl, 'Id do cupom: ');
  const atual = marketplace.buscarCupom(Number(id));
  if (!atual.ok) return mostrarResposta(atual);
  const codigo = await perguntar(rl, `Código [${atual.dados.codigo}]: `);
  const tipo = await perguntar(rl, `Tipo [${atual.dados.tipo}]: `);
  const valorTexto = await perguntar(rl, `Valor [${atual.dados.valor}]: `);
  const validade = await perguntar(rl, `Validade [${atual.dados.validade}]: `);
  const minimoTexto = await perguntar(rl, `Valor mínimo [${atual.dados.valorMinimo}]: `);
  const cumulativoTexto = await perguntar(rl, `Cumulativo (s/n) [${atual.dados.cumulativo ? 's' : 'n'}]: `);
  mostrarResposta(marketplace.atualizarCupom(Number(id), {
    ...(codigo && { codigo }),
    ...(tipo && { tipo }),
    ...(valorTexto && { valor: Number(valorTexto) }),
    ...(validade && { validade }),
    ...(minimoTexto && { valorMinimo: Number(minimoTexto) }),
    ...(cumulativoTexto && { cumulativo: cumulativoTexto.toLowerCase() === 's' }),
  }));
}

async function excluir(rl, marketplace) {
  const id = await perguntar(rl, 'Id do cupom a excluir: ');
  mostrarResposta(marketplace.excluirCupom(Number(id)));
}

export async function menuCupons(rl, marketplace) {
  let voltar = false;
  while (!voltar) {
    console.log(TEXTO_MENU);
    const escolha = await perguntar(rl, 'Escolha uma opção: ');
    if (escolha === '0') voltar = true;
    else if (escolha === '1') await cadastrar(rl, marketplace);
    else if (escolha === '2') mostrarResposta(marketplace.listarCupons(''));
    else if (escolha === '3') await buscar(rl, marketplace);
    else if (escolha === '4') await atualizar(rl, marketplace);
    else if (escolha === '5') await excluir(rl, marketplace);
    else console.log('\nOpção inválida. Digite um dos números do menu.');
  }
}
