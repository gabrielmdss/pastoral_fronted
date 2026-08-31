import type { ApplicationConfig } from '@angular/core';
import { APP_CONFIG, type AppConfig } from '../infrastructure/config/app-config';
import { providePastoralApplication } from './providers';
export function createAppConfig(config:AppConfig):ApplicationConfig{return{providers:[{provide:APP_CONFIG,useValue:config},...providePastoralApplication()]};}
