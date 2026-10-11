# Entrega Certa — frontend

Frontend Angular standalone da Pastoral de Distribuição de Cestas. Os slices funcionais cobrem autenticação, dashboard e Assistência: pessoas, beneficiários, capacidade, catálogos e lista de espera.

## Executar

Requisitos: Node.js `^20.19`, `^22.12` ou `>=24` e npm 10+.

```bash
npm install
npm start
```

Configure `public/config.json`. `apiBaseUrl` deve incluir `/api/v1`; no ambiente atual, `http://localhost:3101/api/v1`. A configuração é carregada antes do bootstrap e não é compilada no bundle.

## Qualidade

```bash
npm run lint
npm run typecheck
npm test -- --watch=false
npm run build
```

O código segue camadas no topo de `src/app`: `domain`, `application`, `infrastructure`, `presentation`, `main` e `shared`. Consulte `docs/` para contratos e limitações.
