import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Marketplace } from '../services/Marketplace.js';
import { menuClientes } from './menuClientes.js';
import { menuVendedores } from './menuVendedores.js';
import { menuProdutos } from './menuProdutos.js';
import { menuCupons } from './menuCupons.js';
import { menuPedidos } from './menuPedidos.js';
import { menuRelatorios } from './menuRelatorios.js';

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
  const marketplace = new Marketplace({ carregarDadosIniciais: true });
  let continuar = true;

  // O while so mantem o menu aberto (permitido pela rubrica).
  while (continuar) {
    mostrarMenu();
    const escolha = (await rl.question('Escolha uma opção: ')).trim();

    if (escolha === '0') {
      continuar = false;
    } else if (escolha === '1') {
      await menuClientes(rl, marketplace);
    } else if (escolha === '2') {
      await menuVendedores(rl, marketplace);
    } else if (escolha === '3') {
      await menuProdutos(rl, marketplace);
    } else if (escolha === '4') {
      await menuCupons(rl, marketplace);
    } else if (escolha === '5') {
      await menuPedidos(rl, marketplace);
    } else if (escolha === '6') {
      await menuRelatorios(rl, marketplace);
    } else if (Object.hasOwn(OPCOES, escolha)) {
      console.log(`\n(${OPCOES[escolha]}: esta parte ainda vai ser construída)`);
    } else {
      console.log('\nOpção inválida. Digite um dos números do menu.');
    }
  }

  rl.close();
  console.log('Até logo!');
}