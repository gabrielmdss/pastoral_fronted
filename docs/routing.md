# Rotas

- `/login`: pública; sessão existente redireciona ao dashboard.
- `/dashboard`: área autenticada.
- `/beneficiarios` e `/beneficiarios/:id`: `BENEFICIARIO_VISUALIZAR`.
- `/capacidade`: `BENEFICIARIO_VISUALIZAR`; alteração exige `CAPACIDADE_ALTERAR`.
- `/candidaturas`: `CANDIDATURA_VISUALIZAR`.

As páginas são lazy-loaded. Botões aplicam permissões específicas; o backend permanece como segurança efetiva.
