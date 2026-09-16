// Deploy via PM2. Fluxo típico no servidor:
//   API_BASE_URL=https://api-homolog.exemplo.org/api/v1 npm run build:homolog
//   pm2 start ecosystem.config.cjs --env homologacao
//   pm2 save
//
// Este projeto é uma SPA Angular estática (sem SSR) — o PM2 não roda o Angular
// diretamente, ele roda o servidor estático em scripts/static-server.mjs, que
// serve dist/pastoral-frontend/browser com fallback de rotas para index.html.
module.exports = {
  apps: [
    {
      name: 'pastoral-frontend',
      script: 'scripts/static-server.mjs',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        PORT: 4300,
        STATIC_ROOT: 'dist/pastoral-frontend/browser',
      },
      env_homologacao: {
        NODE_ENV: 'homologacao',
        PORT: 4300,
        STATIC_ROOT: 'dist/pastoral-frontend/browser',
      },
      env_producao: {
        NODE_ENV: 'production',
        PORT: 8080,
        STATIC_ROOT: 'dist/pastoral-frontend/browser',
      },
    },
  ],
};
