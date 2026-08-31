# Rotas

- `/login`: pública e redireciona para `/dashboard` quando a sessão já existe.
- `/`: redireciona para `/dashboard` dentro do layout autenticado.
- `/dashboard`: lazy loaded e protegido pelo `authGuard` no pai.

`permissionGuard(codigo)` está disponível para rotas futuras e consulta somente permissões carregadas por `/auth/me`.
