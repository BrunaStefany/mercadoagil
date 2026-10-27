   import { perguntar, mostrarResposta } from './util.js';

   const TEXTO_MENU = `
   --- Pedidos ---
   1 - Criar pedido
   2 - Adicionar itens
   3 - Aplicar cupom
   4 - Ver resumo
   5 - Confirmar pedido
   6 - Cancelar pedido
   7 - Listar pedidos
   0 - Voltar`;

   async function criar(rl, marketplace) {
     // Mostra os clientes para a pessoa escolher, em vez de pedir um id de cabeca.
     const clientes = marketplace.listarClientes('');
     if (!clientes.ok || clientes.dados.length === 0) {
       console.log('\nNenhum cliente cadastrado. Cadastre um cliente antes (menu principal, opção 1).');
       return null;
     }

     console.log('\nClientes cadastrados:');
     console.table(clientes.dados);
     const clienteId = await perguntar(rl, 'Digite o id do cliente (ou 0 para voltar): ');
     if (clienteId === '0') return null;

     const resposta = marketplace.criarPedidoRascunho(Number(clienteId));
     mostrarResposta(resposta);
     return resposta.ok ? resposta.dados.id : null;
   }

   async function adicionarItem(rl, marketplace) {
     const pedidoId = await perguntar(rl, 'Id do pedido: ');
     const produtos = marketplace.listarProdutos().dados.map(({ id, nome, preco, categoria }) => ({
       id,
       nome,
       preco,
       categoria,
     }));
     console.log('\nProdutos disponíveis:');
     console.table(produtos);
     const produtoId = await perguntar(rl, 'Id do produto: ');
     const quantidade = await perguntar(rl, 'Quantidade: ');
     mostrarResposta(marketplace.adicionarItemPedido(pedidoId, produtoId, quantidade));
   }

   async function aplicarCupom(rl, marketplace) {
     const pedidoId = await perguntar(rl, 'Id do pedido: ');
     const codigo = await perguntar(rl, 'Código do cupom: ');
     mostrarResposta(marketplace.aplicarCupomPedido(pedidoId, codigo));
   }

   async function verResumo(rl, marketplace) {
     const pedidoId = await perguntar(rl, 'Id do pedido: ');
     mostrarResposta(marketplace.resumoPedido(pedidoId));
   }

   async function confirmar(rl, marketplace) {
     const pedidoId = await perguntar(rl, 'Id do pedido: ');
     mostrarResposta(marketplace.confirmarPedido(pedidoId));
   }

   async function cancelar(rl, marketplace) {
     const pedidoId = await perguntar(rl, 'Id do pedido: ');
     mostrarResposta(marketplace.cancelarPedido(pedidoId));
   }

   export async function menuPedidos(rl, marketplace) {
     let voltar = false;
     while (!voltar) {
       console.log(TEXTO_MENU);
       const escolha = await perguntar(rl, 'Escolha uma opção: ');
       if (escolha === '0') voltar = true;
       else if (escolha === '1') await criar(rl, marketplace);
       else if (escolha === '2') await adicionarItem(rl, marketplace);
       else if (escolha === '3') await aplicarCupom(rl, marketplace);
       else if (escolha === '4') await verResumo(rl, marketplace);
       else if (escolha === '5') await confirmar(rl, marketplace);
       else if (escolha === '6') await cancelar(rl, marketplace);
       else if (escolha === '7') mostrarResposta(marketplace.listarPedidos());
       else console.log('\nOpção inválida. Digite um dos números do menu.');
     }
   }