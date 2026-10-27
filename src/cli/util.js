   // Funcoes de apoio do menu: ler do teclado e mostrar a resposta do Marketplace.

   const formatadorReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

   // A formatacao em reais (R$ 1.234,50) acontece so aqui, no menu.
   export const formatarReais = (valor) => formatadorReais.format(valor).replace(/\u00a0/g, ' ');

   export async function perguntar(rl, texto) {
     return (await rl.question(texto)).trim();
   }

   const ehPedido = (dados) =>
     Boolean(dados) && typeof dados === 'object' && Array.isArray(dados.itens) && 'subtotal' in dados;

   const linha = (rotulo, valor) => console.log(`  ${rotulo.padEnd(26)}${valor.padStart(14)}`);

   // Mostra um pedido como uma "nota": itens, descontos, frete, total e repasses.
   function mostrarPedido(pedido) {
     console.log(`\n=== Pedido #${pedido.id} (${pedido.status}) | cliente ${pedido.clienteId} ===`);

     console.log('Itens:');
     pedido.itens.forEach((item) => {
       const valorItem = formatarReais(item.quantidade * item.precoUnitario);
       console.log(`  ${item.quantidade}x ${item.nome} (${formatarReais(item.precoUnitario)} cada) = ${valorItem}`);
     });
     console.log(`Cupons: ${pedido.cupons.length > 0 ? pedido.cupons.join(', ') : 'nenhum'}`);

     console.log('');
     linha('Subtotal', formatarReais(pedido.subtotal));
     linha('(-) Descontos', formatarReais(pedido.descontoTotal));
     linha('(+) Frete', formatarReais(pedido.frete));
     linha('TOTAL', formatarReais(pedido.total));

     console.log('');
     linha('Tributos aprox. (info)', formatarReais(pedido.tributosAproximados));
     linha('Comissão do marketplace', formatarReais(pedido.comissaoTotal));
     console.log('Repasse aos vendedores:');
     pedido.repasses.forEach((r) => {
       console.log(`  Vendedor ${r.vendedorId}: bruto ${formatarReais(r.valorBruto)}, comissão ${formatarReais(r.comissao)}, a repassar ${formatarReais(r.valorRepasse)}`);
     });

     if (pedido.status === 'aberto') {
       console.log('\nPróximo passo: adicione itens, aplique um cupom ou confirme o pedido.');
     }
   }

   // Mostra na tela o que o Marketplace respondeu: { ok, dados } ou { ok, erros }.
   export function mostrarResposta(resposta) {
     if (!resposta?.ok) {
       const erros = resposta?.erros ?? ['Algo deu errado.'];
       console.log('\nNão foi possível concluir:');
       erros.forEach((erro) => console.log(` - ${erro}`));
       return;
     }

     const { dados } = resposta;
     if (Array.isArray(dados)) {
       if (dados.length === 0) {
         console.log('\nNenhum registro encontrado.');
       } else if (dados.every(ehPedido)) {
         console.table(dados.map((p) => ({
           pedido: p.id, cliente: p.clienteId, status: p.status,
           itens: p.itens.length, total: formatarReais(p.total),
         })));
       } else {
         console.table(dados);
       }
     } else if (ehPedido(dados)) {
       mostrarPedido(dados);
     } else if (dados) {
       console.log('\nFeito! Resultado:');
       console.table([dados]);
     } else {
       console.log('\nFeito!');
     }
   }