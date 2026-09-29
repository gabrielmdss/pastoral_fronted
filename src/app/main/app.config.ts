import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID, type ApplicationConfig } from '@angular/core';
import { APP_CONFIG, type AppConfig } from '../infrastructure/config/app-config';
import { providePastoralApplication } from './providers';

registerLocaleData(localePt, 'pt-BR');

export function createAppConfig(config: AppConfig): ApplicationConfig {
  return {
    providers: [
      { provide: APP_CONFIG, useValue: config },
      { provide: LOCALE_ID, useValue: 'pt-BR' },
      { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
      ...providePastoralApplication(),
    ],
  };
}
