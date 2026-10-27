   import { perguntar, mostrarResposta } from './util.js';

   const TEXTO_MENU = `
   --- Clientes ---
   1 - Cadastrar
   2 - Listar todos
   3 - Buscar (nome, e-mail, CPF ou região)
   4 - Excluir (pelo id)
   0 - Voltar`;

   async function cadastrar(rl, marketplace) {
     const nome = await perguntar(rl, 'Nome: ');
     const email = await perguntar(rl, 'E-mail: ');
     const cpf = await perguntar(rl, 'CPF (só números): ');
     const regiao = await perguntar(rl, 'Região (norte, nordeste, centro-oeste, sudeste ou sul): ');
     mostrarResposta(marketplace.cadastrarCliente({ nome, email, cpf, regiao }));
   }

   async function buscar(rl, marketplace) {
     const texto = await perguntar(rl, 'Digite o nome, e-mail ou região: ');
     mostrarResposta(marketplace.listarClientes(texto));
   }

   async function excluir(rl, marketplace) {
     const id = await perguntar(rl, 'Id do cliente a excluir: ');
     mostrarResposta(marketplace.excluirCliente(Number(id)));
   }

   export async function menuClientes(rl, marketplace) {
     let voltar = false;

     // O while so mantem o submenu aberto (permitido pela rubrica).
     while (!voltar) {
       console.log(TEXTO_MENU);
       const escolha = await perguntar(rl, 'Escolha uma opção: ');

       if (escolha === '0') voltar = true;
       else if (escolha === '1') await cadastrar(rl, marketplace);
       else if (escolha === '2') mostrarResposta(marketplace.listarClientes(''));
       else if (escolha === '3') await buscar(rl, marketplace);
       else if (escolha === '4') await excluir(rl, marketplace);
       else console.log('\nOpção inválida. Digite um dos números do menu.');
     }
   }