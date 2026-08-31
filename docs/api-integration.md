# Integração com a API

Contrato confirmado no backend atual:

- `POST /api/v1/auth/login`, body `{ login, senha }`, response `{ data: { accessToken, usuario } }`;
- `GET /api/v1/auth/me`, response `{ data: usuario }`;
- `GET /api/v1/dashboard`, response `{ data: dashboard }`.

`usuario` contém `id`, `login`, `ativo`, `perfis` e `permissoes`. O dashboard é consumido em uma única chamada. A URL base vem de `public/config.json`. O JWT interceptor restringe o Bearer à URL base configurada; assets, config e hosts externos não recebem o token.
