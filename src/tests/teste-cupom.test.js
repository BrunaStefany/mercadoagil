// Rode com: node teste-cupom.js   (precisa de: npm install zod, e "type": "module" no package.json)
import { CupomDesconto } from '../models/CupomDesconto.js';

const daqui = (dias) => new Date(Date.now() + dias * 86_400_000);

const bemvindo = CupomDesconto.criar({ codigo: 'bemvindo10', tipo: 'percentual', valor: 10, validade: daqui(30) });
const pda = CupomDesconto.criar({ codigo: 'PDA15', tipo: 'fixo', valor: 15, validade: daqui(30), valorMinimo: 50 });

// Exemplo do descritivo: subtotal R$ 200,00 → -20,00 e -15,00
console.log('BEMVINDO10:', bemvindo.dados.calcularDesconto(200)); // 20
console.log('PDA15:', pda.dados.calcularDesconto(200)); // 15

// Casos de erro (o programa NÃO pode quebrar)
console.log(CupomDesconto.criar({ codigo: 'AB', tipo: 'xyz', valor: 'abc', validade: '2020-01-01' }));
console.log(CupomDesconto.criar({ codigo: 'OFF150', tipo: 'percentual', valor: 150, validade: daqui(5) }));
console.log(pda.dados.validar(30)); // abaixo do mínimo
console.log(pda.dados.validar(200, daqui(60))); // vencido na hora do uso

// ---- Regras de combinação e teto ----
const frete = CupomDesconto.criar({ codigo: 'FRETEZERO', tipo: 'frete', valor: 0, validade: daqui(30) }).dados;
const solo = CupomDesconto.criar({ codigo: 'SOLO20', tipo: 'percentual', valor: 20, validade: daqui(30), cumulativo: false }).dados;
const [b, p] = [bemvindo.dados, pda.dados];

// Exemplo do descritivo: descontos 20 + 15 = 35, subtotal com desconto 165
console.log(CupomDesconto.calcularDescontos([p, b], 200)); // ordem certa mesmo passando fixo primeiro

console.log(CupomDesconto.validarCombinacao([b, b], 200)); // repetido
console.log(CupomDesconto.validarCombinacao([b, p, frete], 200)); // mais de 2
console.log(CupomDesconto.validarCombinacao([solo, b], 200)); // não cumulativo
console.log(CupomDesconto.validarCombinacao([b, p], 200)); // ok

// Teto: 20% + fixo 15 em subtotal 100 → teto 30, não 35
const v20 = CupomDesconto.criar({ codigo: 'VINTE', tipo: 'percentual', valor: 20, validade: daqui(30) }).dados;
console.log(CupomDesconto.calcularDescontos([v20, p], 100)); // 20 + 10, limitadoPeloTeto: true

// ---- CRUD + seed ----
import { criarCuponsSeed } from '../data/seedCupons.js';
import { cadastrarCupom, listarCupons, buscarCupom, excluirCupom } from '../services/cupons.js';

let cupons = criarCuponsSeed();
console.log('Seed:', listarCupons(cupons).dados.map((c) => c.codigo)); // 4 cupons

const novo = cadastrarCupom(cupons, { codigo: 'natal5', tipo: 'fixo', valor: 5, validade: daqui(10) });
console.log('Cadastro:', novo.ok, novo.ok ? novo.dados.cupom.codigo : novo.erros);
console.log('Duplicado:', cadastrarCupom(cupons, { codigo: 'PDA15', tipo: 'fixo', valor: 5, validade: daqui(10) }));
console.log('Busca:', buscarCupom(cupons, ' pda15 ').ok, '| inexistente:', buscarCupom(cupons, 'XXX'));
console.log('Exclusão:', excluirCupom(cupons, 'PDA15').dados.lista.length, '(original continua com', cupons.length + ')');
