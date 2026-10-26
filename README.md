# mercadoagil
Projeto final M1: microsserviço de pedidos do MercadoÁgil

## Marketplace HTTP

O servidor usa apenas módulos nativos do Node.js e mantém os dados em memória.
Os cupons de exemplo de `src/data/seedCupons.js` são carregados ao iniciar.

```bash
npm start
```

O servidor escuta em `http://localhost:3000` e pode ser ajustado com `PORT` e `HOST`.
Todas as respostas são objetos JSON no formato `{ "ok": true, "dados": ... }` ou
`{ "ok": false, "erros": [...] }`.

Recursos expostos:
- `GET /api/clientes` e `POST /api/clientes`
- `GET /api/clientes/:id`, `PUT /api/clientes/:id`, `DELETE /api/clientes/:id`
- `GET /api/vendedores` e `POST /api/vendedores`
- `GET /api/vendedores/:id`, `PUT /api/vendedores/:id`, `DELETE /api/vendedores/:id`
- `GET /api/produtos` e `POST /api/produtos`
- `GET /api/produtos/:id`, `PUT /api/produtos/:id`, `DELETE /api/produtos/:id`
- `GET /api/cupons` e `POST /api/cupons`
- `GET /api/cupons/:id`, `PUT /api/cupons/:id`, `DELETE /api/cupons/:id`
- `GET /api/pedidos`, `POST /api/pedidos`

Os endpoints `PUT` aceitam atualizações parciais: envie somente os campos a alterar.
Os campos omitidos mantêm o valor atual; todos os valores resultantes passam pela
validação e pelas regras de unicidade do cadastro. No produto, `estoque` também pode
ser atualizado separadamente. CPF continua privado nas respostas.

O cadastro de cliente exige `nome`, `email`, `cpf` e `regiao` (em minúsculas). O CPF é
usado para validar e evitar duplicidade, mas não aparece nas respostas. Produtos aceitam
`estoque` e devem estar vinculados a um vendedor cadastrado. Para criar um pedido, envie
`clienteId`, `itens` com `produtoId` e `quantidade`, e opcionalmente `cupons` por código.

O arquivo [`marketplace.http`](./marketplace.http) reúne exemplos executáveis com a extensão
REST Client do VS Code para testar os endpoints em sequência. A API é em memória: reiniciar
o processo recarrega o seed de cupons e limpa os dados cadastrados durante a execução.

## 🧪 Como executar os testes

Este projeto utiliza o executor de testes nativo do Node.js (`node:test`), mantendo a aplicação leve e sem dependências externas de teste (como Jest ou Mocha), cumprindo o requisito de focar em JavaScript puro.

Para rodar a suíte de testes automatizados, abra o terminal na raiz do projeto e execute:

```bash
npm test
```