# Integração com a API

Autenticação usa `POST /auth/login` e `GET /auth/me`; dashboard usa exclusivamente `GET /dashboard`.

Assistência consome:

- `GET/POST /beneficiarios`, `GET /beneficiarios/:id` e os POSTs `desligar`, `reativar`, `alterar-grupo`;
- `GET/PUT /capacidade`;
- `GET/POST /candidaturas` e os POSTs `priorizar`, `tentativas-contato`, `nao-localizado`, `admitir`.
- `GET/POST /pessoas` e `GET /pessoas/:id` para localizar ou cadastrar a pessoa antes da operação;
- `GET /grupos-distribuicao` e `GET /motivos-desligamento` para os catálogos usados nos formulários.

A busca de beneficiários aceita `nome`, `documento`, `status`, `grupoId`, retorna até 50 itens e não possui paginação. Candidaturas aceitam `status`, `nome`, `documento`.

A busca de pessoas usa `q` para nome ou `documento` para documento. Os formulários mantêm os identificadores apenas internamente: o operador escolhe pessoas, grupos e motivos por dados legíveis. Os catálogos são compartilhados em memória durante a sessão.

O detalhe de beneficiário apresenta a identificação mascarada, contato, endereço, grupo, retirada mais recente, direitos atual e próximo, pendências e histórico resumido devolvidos pela API. Candidaturas preservam os documentos já mascarados pelo backend e mostram a tentativa de contato mais recente quando disponível.

A URL base vem de `public/config.json`. Bearer é restrito à API configurada.
