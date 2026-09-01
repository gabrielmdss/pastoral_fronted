# Testes

Execute `npm test -- --watch=false`; lint, typecheck e build são gates separados.

A suíte cobre autenticação/dashboard e Assistência: services HTTP/URLs, mappers, use cases, erros de domínio, visibilidade por permissão, busca/empty/error, detalhe/desligamento, capacidade/alteração e candidaturas/priorização/admissão.

Smoke real usa `http://localhost:3101/health` e `/ready`. Login e RBAC reais exigem senhas em configuração local não versionada; nomes de usuário isolados não permitem autenticação.
