import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAppInitializer, inject, type EnvironmentProviders, type Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AUTH_API } from '../application/auth/ports/auth-api.port';
import { SESSION_STORAGE } from '../application/auth/ports/session-storage.port';
import { GetCurrentUserUseCase } from '../application/auth/use-cases/get-current-user.use-case';
import { LoginUseCase } from '../application/auth/use-cases/login.use-case';
import { LogoutUseCase } from '../application/auth/use-cases/logout.use-case';
import { DASHBOARD_API } from '../application/dashboard/dashboard-api.port';
import { GetDashboardUseCase } from '../application/dashboard/get-dashboard.use-case';
import { AuthApiService } from '../infrastructure/api/auth/auth-api.service';
import { DashboardApiService } from '../infrastructure/api/dashboard/dashboard-api.service';
import { authInterceptor } from '../infrastructure/auth/auth.interceptor';
import { errorInterceptor } from '../infrastructure/auth/error.interceptor';
import { SessionFacade } from '../infrastructure/auth/session.facade';
import { SessionStateService } from '../infrastructure/auth/session-state.service';
import { BrowserSessionStorageService } from '../infrastructure/storage/browser-session-storage.service';
import { appRoutes } from './app.routes';
export function providePastoralApplication(): Array<Provider | EnvironmentProviders> { return [
  provideRouter(appRoutes), provideHttpClient(withInterceptors([authInterceptor,errorInterceptor])),
  BrowserSessionStorageService, AuthApiService, DashboardApiService, LoginUseCase, GetCurrentUserUseCase, LogoutUseCase, GetDashboardUseCase, SessionStateService, SessionFacade,
  {provide:SESSION_STORAGE,useExisting:BrowserSessionStorageService},{provide:AUTH_API,useExisting:AuthApiService},{provide:DASHBOARD_API,useExisting:DashboardApiService},
  provideAppInitializer(()=>inject(SessionFacade).restore()),
]; }
