import { CupomDesconto } from '../models/CupomDesconto.js';

// Validade sempre no futuro, calculada na hora (o seed nunca "vence" sozinho).
const daqui = (dias) => new Date(Date.now() + dias * 86_400_000);

const cuponsDeExemplo = [
  { codigo: 'BEMVINDO10', tipo: 'percentual', valor: 10, validade: daqui(365) },
  { codigo: 'PDA15', tipo: 'fixo', valor: 15, validade: daqui(365), valorMinimo: 50 },
  { codigo: 'FRETEZERO', tipo: 'frete', valor: 0, validade: daqui(365) },
  // Não cumulativo: serve para demonstrar a regra "só pode ser usado sozinho"
  { codigo: 'UNICO20', tipo: 'percentual', valor: 20, validade: daqui(365), cumulativo: false },
];

// Passa pela validação do Zod; entrada inválida é descartada, nunca derruba o programa.
export const criarCuponsSeed = () =>
  cuponsDeExemplo.flatMap((entrada) => {
    const resultado = CupomDesconto.criar(entrada);
    return resultado.ok ? [resultado.dados] : [];
  });
