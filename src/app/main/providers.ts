import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideAppInitializer,
  inject,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { AUTH_API } from '../application/auth/ports/auth-api.port';
import { SESSION_STORAGE } from '../application/auth/ports/session-storage.port';
import { GetCurrentUserUseCase } from '../application/auth/use-cases/get-current-user.use-case';
import { LoginUseCase } from '../application/auth/use-cases/login.use-case';
import { LogoutUseCase } from '../application/auth/use-cases/logout.use-case';
import { DASHBOARD_API } from '../application/dashboard/dashboard-api.port';
import { GetDashboardUseCase } from '../application/dashboard/get-dashboard.use-case';
import { BENEFICIARIOS_API } from '../application/beneficiarios/beneficiarios-api.port';
import {
  AdmitirBeneficiarioUseCase,
  AlterarGrupoBeneficiarioUseCase,
  BuscarBeneficiariosUseCase,
  DesligarBeneficiarioUseCase,
  ObterBeneficiarioUseCase,
  ReativarBeneficiarioUseCase,
} from '../application/beneficiarios/beneficiarios.use-cases';
import { CAPACIDADE_API } from '../application/capacidade/capacidade-api.port';
import {
  AlterarCapacidadeUseCase,
  ObterCapacidadeUseCase,
} from '../application/capacidade/capacidade.use-cases';
import { CANDIDATURAS_API } from '../application/candidaturas/candidaturas-api.port';
import { PESSOAS_API } from '../application/pessoas/pessoas-api.port';
import { BuscarPessoasUseCase,CriarPessoaUseCase } from '../application/pessoas/pessoas.use-cases';
import { CATALOGOS_API } from '../application/beneficiarios/catalogos-api.port';
import { ListarGruposUseCase,ListarMotivosUseCase } from '../application/beneficiarios/catalogos.use-cases';
import {
  AdmitirCandidaturaUseCase,
  CriarCandidaturaUseCase,
  ListarCandidaturasUseCase,
  MarcarNaoLocalizadoUseCase,
  PriorizarCandidaturaUseCase,
  RegistrarContatoUseCase,
} from '../application/candidaturas/candidaturas.use-cases';
import { AuthApiService } from '../infrastructure/api/auth/auth-api.service';
import { DashboardApiService } from '../infrastructure/api/dashboard/dashboard-api.service';
import { BeneficiariosApiService } from '../infrastructure/api/beneficiarios/beneficiarios-api.service';
import { CapacidadeApiService } from '../infrastructure/api/capacidade/capacidade-api.service';
import { CandidaturasApiService } from '../infrastructure/api/candidaturas/candidaturas-api.service';
import { PessoasApiService } from '../infrastructure/api/pessoas/pessoas-api.service';
import { CatalogosApiService } from '../infrastructure/api/beneficiarios/catalogos-api.service';
import { authInterceptor } from '../infrastructure/auth/auth.interceptor';
import { errorInterceptor } from '../infrastructure/auth/error.interceptor';
import { SessionFacade } from '../infrastructure/auth/session.facade';
import { SessionStateService } from '../infrastructure/auth/session-state.service';
import { BrowserSessionStorageService } from '../infrastructure/storage/browser-session-storage.service';
import { appRoutes } from './app.routes';
export function providePastoralApplication(): Array<Provider | EnvironmentProviders> {
  return [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    BrowserSessionStorageService,
    AuthApiService,
    DashboardApiService,
    BeneficiariosApiService,
    CapacidadeApiService,
    CandidaturasApiService,
    PessoasApiService,CatalogosApiService,
    LoginUseCase,
    GetCurrentUserUseCase,
    LogoutUseCase,
    GetDashboardUseCase,
    BuscarBeneficiariosUseCase,
    ObterBeneficiarioUseCase,
    AdmitirBeneficiarioUseCase,
    AlterarGrupoBeneficiarioUseCase,
    DesligarBeneficiarioUseCase,
    ReativarBeneficiarioUseCase,
    ObterCapacidadeUseCase,
    AlterarCapacidadeUseCase,
    ListarCandidaturasUseCase,
    CriarCandidaturaUseCase,
    PriorizarCandidaturaUseCase,
    RegistrarContatoUseCase,
    MarcarNaoLocalizadoUseCase,
    AdmitirCandidaturaUseCase,
    BuscarPessoasUseCase,CriarPessoaUseCase,ListarGruposUseCase,ListarMotivosUseCase,
    SessionStateService,
    SessionFacade,
    { provide: SESSION_STORAGE, useExisting: BrowserSessionStorageService },
    { provide: AUTH_API, useExisting: AuthApiService },
    { provide: DASHBOARD_API, useExisting: DashboardApiService },
    { provide: BENEFICIARIOS_API, useExisting: BeneficiariosApiService },
    { provide: CAPACIDADE_API, useExisting: CapacidadeApiService },
    { provide: CANDIDATURAS_API, useExisting: CandidaturasApiService },
    {provide:PESSOAS_API,useExisting:PessoasApiService},{provide:CATALOGOS_API,useExisting:CatalogosApiService},
    provideAppInitializer(() => inject(SessionFacade).restore()),
  ];
}
