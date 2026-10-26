   import readline from 'node:readline/promises';
   import { stdin as input, stdout as output } from 'node:process';

   // Opcoes do menu principal. O menu so le o teclado e mostra a resposta:
   // quem decide as regras e o Marketplace.
   const OPCOES = {
     '1': 'Clientes',
     '2': 'Vendedores',
     '3': 'Produtos',
     '4': 'Cupons',
     '5': 'Pedidos',
     '6': 'Relatórios',
     '0': 'Sair',
   };

   // Ordem em que as opcoes aparecem na tela (o Sair fica por ultimo).
   const ORDEM = ['1', '2', '3', '4', '5', '6', '0'];

   function mostrarMenu() {
     console.log('\n=== MercadoÁgil ===');
     ORDEM.forEach((numero) => console.log(`${numero} - ${OPCOES[numero]}`));
   }

   export async function iniciarMenu() {
     const rl = readline.createInterface({ input, output });
     let continuar = true;

     // O while so mantem o menu aberto (permitido pela rubrica).
     while (continuar) {
       mostrarMenu();
       const escolha = (await rl.question('Escolha uma opção: ')).trim();

       if (escolha === '0') {
         continuar = false;
       } else if (Object.hasOwn(OPCOES, escolha)) {
         console.log(`\n(${OPCOES[escolha]}: esta parte ainda vai ser construída)`);
       } else {
         console.log('\nOpção inválida. Digite um dos números do menu.');
       }
     }

     rl.close();
     console.log('Até logo!');
   }