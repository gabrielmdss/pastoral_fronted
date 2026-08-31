import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { loadAppConfig } from './app/infrastructure/config/app-config.loader';
import { createAppConfig } from './app/main/app.config';

loadAppConfig()
  .then((config) => bootstrapApplication(App, createAppConfig(config)))
  .catch(() => {
    document.body.innerHTML = '<main class="bootstrap-error"><h1>Não foi possível iniciar o sistema</h1><p>Verifique o arquivo <code>config.json</code> e tente novamente.</p></main>';
  });
