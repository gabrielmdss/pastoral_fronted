#!/usr/bin/env node
// Gera public/config.json a partir da variável de ambiente API_BASE_URL antes do
// `ng build`. O Angular copia tudo em public/ para o bundle final (ver angular.json),
// e o app busca /config.json em runtime (src/app/infrastructure/config/app-config.loader.ts).
// Isso permite usar o MESMO build para dev/homologação/produção — só troca o config.json.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  console.error(
    'API_BASE_URL não definido. Defina a variável de ambiente antes de buildar ' +
      '(ex.: API_BASE_URL=https://api-homolog.exemplo.org/api/v1 npm run build:homolog).',
  );
  process.exit(1);
}

const target = resolve(process.cwd(), 'public/config.json');
writeFileSync(target, JSON.stringify({ apiBaseUrl }, null, 2) + '\n');
console.log(`public/config.json atualizado com apiBaseUrl=${apiBaseUrl}`);
