# Entrega Certa — frontend

Frontend Angular standalone da Pastoral de Distribuição de Cestas. O primeiro slice funcional cobre login, restauração de sessão, área autenticada e dashboard.

## Executar

Requisitos: Node.js `^20.19`, `^22.12` ou `>=24` e npm 10+.

```bash
npm install
npm start
```

Antes de iniciar, ajuste `public/config.json`. `apiBaseUrl` deve apontar para a API incluindo `/api/v1`, por exemplo `http://localhost:3000/api/v1`. Essa configuração é carregada antes do bootstrap e não é compilada no bundle.

## Qualidade

```bash
npm run lint
npm run typecheck
npm test -- --watch=false
npm run build
```

O código segue camadas no topo de `src/app`: `domain`, `application`, `infrastructure`, `presentation`, `main` e `shared`. Consulte `docs/` para decisões e contratos.
