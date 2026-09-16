# Deploy (homologação e produção)

Este projeto é uma SPA Angular pura, sem SSR. O build é o mesmo em qualquer
ambiente — o que muda é apenas `public/config.json` (`apiBaseUrl`), que o app
busca em runtime via `fetch('/config.json')` (ver
`src/app/infrastructure/config/app-config.loader.ts`). Por isso não existem
configurações `angular.json` separadas por ambiente: existe **um** build de
produção, e o `apiBaseUrl` é injetado antes de cada build por
`scripts/write-runtime-config.mjs`, a partir da variável de ambiente
`API_BASE_URL`.

```
API_BASE_URL=https://api-homolog.exemplo.org/api/v1 npm run build:homolog
```

O script grava `public/config.json` com essa URL; o `ng build` copia esse
arquivo para `dist/pastoral-frontend/browser/config.json` (glob de assets em
`angular.json`).

## 1. PM2 (servidor próprio)

O build gera arquivos estáticos, sem servidor Node embutido. O PM2 roda um
servidor estático mínimo (`scripts/static-server.mjs`, zero dependências) que
serve `dist/pastoral-frontend/browser` com fallback de rotas para
`index.html` (necessário porque o Angular Router usa URLs sem `#`).

```bash
npm ci
API_BASE_URL=https://api-homolog.exemplo.org/api/v1 npm run build:homolog
pm2 start ecosystem.config.cjs --env homologacao   # ou --env producao
pm2 save
```

Scripts auxiliares: `npm run pm2:restart`, `npm run pm2:stop`, `npm run pm2:logs`.
Para trocar só a URL da API sem recompilar, rode de novo
`API_BASE_URL=... node scripts/write-runtime-config.mjs`, refaça `ng build` e
reinicie o PM2 (o `config.json` não é versionado por ambiente, é gerado).

Porta padrão: `4300` (homologação) / `8080` (produção) — ajuste em
`ecosystem.config.cjs` ou via variável `PORT`. Coloque um Nginx/Caddy na
frente para TLS se o servidor for exposto direto na internet.

## 2. Vercel (grátis)

`vercel.json` já está configurado: build command, diretório de saída e
rewrite de SPA. Só falta configurar, no painel do projeto na Vercel, a
variável de ambiente `API_BASE_URL` apontando para a API de homologação (ou
produção, usando os ambientes "Preview"/"Production" da própria Vercel).

```bash
npx vercel        # deploy de preview (usa API_BASE_URL do ambiente "Preview")
npx vercel --prod # deploy de produção (usa API_BASE_URL do ambiente "Production")
```

## 3. Render (grátis)

`render.yaml` define um "Static Site". Ao criar o serviço a partir do
repositório, o Render lê esse arquivo automaticamente; só é preciso preencher
o valor de `API_BASE_URL` no painel (o `sync: false` no `render.yaml` existe
justamente para isso — o Render pede o valor na criação em vez de commitá-lo).

## Checklist antes de apontar para uma API nova

- [ ] `API_BASE_URL` aponta para `.../api/v1` (o path já inclui o prefixo de
      versão, como em `public/config.json` local).
- [ ] CORS da API libera a origem do domínio de homologação/produção.
- [ ] `npm run typecheck && npm run lint && npm test -- --watch=false && npm run build:homolog`
      passam antes de publicar.
