import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideAppInitializer,
  inject,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { RELATORIOS_API } from '../application/relatorios/relatorios-api.port';
import { RelatorioDistribuicoesUseCase,RelatorioBeneficiariosUseCase,RelatorioEstoqueUseCase } from '../application/relatorios/relatorios.use-cases';
import { RelatoriosApiService } from '../infrastructure/api/relatorios/relatorios-api.service';
import { INVENTARIOS_API } from '../application/estoque/inventarios-api.port';
import { CriarInventarioUseCase, ObterInventarioUseCase, ContarInventarioUseCase, ConcluirInventarioUseCase } from '../application/estoque/inventarios.use-cases';
import { InventariosApiService } from '../infrastructure/api/estoque/inventarios-api.service';
import { CESTAS_ADICIONAIS_API } from '../application/atendimento/ports/cestas-adicionais-api.port';
import { ListarCestasAdicionaisUseCase, AutorizarCestaAdicionalUseCase, EntregarCestaAdicionalUseCase } from '../application/atendimento/use-cases/cestas-adicionais.use-cases';
import { CestasAdicionaisApiService } from '../infrastructure/api/atendimento/cestas-adicionais-api.service';
import { LIBERACOES_API } from '../application/liberacoes/liberacoes-api.port';
import { ListarLiberacoesUseCase, LiberarCestasUseCase } from '../application/liberacoes/liberacoes.use-cases';
import { LiberacoesApiService } from '../infrastructure/api/liberacoes/liberacoes-api.service';
import { MONTAGEM_API } from '../application/montagem/montagem-api.port';
import { ListarLotesUseCase, ObterLoteUseCase, MontarLoteUseCase, AjustarLoteUseCase, DesmontarLoteUseCase } from '../application/montagem/montagem.use-cases';
import { MontagemApiService } from '../infrastructure/api/montagem/montagem-api.service';
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
import { BuscarPessoasUseCase, CriarPessoaUseCase } from '../application/pessoas/pessoas.use-cases';
import { CATALOGOS_API } from '../application/beneficiarios/catalogos-api.port';
import { ListarGruposUseCase, ListarMotivosUseCase } from '../application/beneficiarios/catalogos.use-cases';
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
import { DistribuicoesApiService } from '../infrastructure/api/distribuicoes/distribuicoes-api.service';
import { AbrirDistribuicaoUseCase } from '../application/distribuicoes/abrir-distribuicao.use-case';
import { EncerrarDistribuicaoUseCase } from '../application/distribuicoes/encerrar-distribuicao.use-case';
import { ListarDistribuicoesUseCase } from '../application/distribuicoes/listar-distribuicoes.use-case';
import { ObterDistribuicaoUseCase } from '../application/distribuicoes/obter-distribuicao.use-case';
import { DISTRIBUICOES_API } from '../application/distribuicoes/distribuicoes-api.port';
import { AtendimentoApiService } from '../infrastructure/api/atendimento/atendimento-api.service';
import { RegistrarCheckInUseCase } from '../application/atendimento/use-cases/registrar-check-in.use-case';
import { ListarCheckInsUseCase } from '../application/atendimento/use-cases/listar-check-ins.use-case';
import { ListarRetiradasUseCase } from '../application/atendimento/use-cases/listar-retiradas.use-case';
import { RegistrarRetiradaUseCase } from '../application/atendimento/use-cases/registrar-retirada.use-case';
import { EstornarRetiradaUseCase } from '../application/atendimento/use-cases/estornar-retirada.use-case';
import { ListarAusenciasBeneficiarioUseCase } from '../application/atendimento/use-cases/listar-ausencias-beneficiario.use-case';
import { RegistrarJustificativaUseCase } from '../application/atendimento/use-cases/registrar-justificativa.use-case';
import { AvaliarJustificativaUseCase } from '../application/atendimento/use-cases/avaliar-justificativa.use-case';
import { ATENDIMENTO_API } from '../application/atendimento/atendimento-api.port';
export function providePastoralApplication(): Array<Provider | EnvironmentProviders> {
  return [
    RelatoriosApiService,RelatorioDistribuicoesUseCase,RelatorioBeneficiariosUseCase,RelatorioEstoqueUseCase,
    {provide:RELATORIOS_API,useExisting:RelatoriosApiService},
    InventariosApiService, CriarInventarioUseCase, ObterInventarioUseCase, ContarInventarioUseCase, ConcluirInventarioUseCase,
    { provide: INVENTARIOS_API, useExisting: InventariosApiService },
    CestasAdicionaisApiService, ListarCestasAdicionaisUseCase, AutorizarCestaAdicionalUseCase, EntregarCestaAdicionalUseCase,
    { provide: CESTAS_ADICIONAIS_API, useExisting: CestasAdicionaisApiService },
    LiberacoesApiService, ListarLiberacoesUseCase, LiberarCestasUseCase,
    { provide: LIBERACOES_API, useExisting: LiberacoesApiService },
    MontagemApiService, ListarLotesUseCase, ObterLoteUseCase, MontarLoteUseCase, AjustarLoteUseCase, DesmontarLoteUseCase,
    { provide: MONTAGEM_API, useExisting: MontagemApiService },
    PlanejamentoApiService, ListarPlanejamentosUseCase, ObterPlanejamentoUseCase, SimularPlanejamentoUseCase,
    CriarPlanejamentoUseCase, RevisarPlanejamentoUseCase, AprovarPlanejamentoUseCase,
    { provide: PLANEJAMENTO_API, useExisting: PlanejamentoApiService },
    ModelosApiService, ListarModelosUseCase, ObterModeloUseCase, CriarModeloUseCase, CriarVersaoModeloUseCase,
    { provide: MODELOS_API, useExisting: ModelosApiService },
    EstoqueApiService, ...ESTOQUE_USE_CASES,
    { provide: ESTOQUE_API, useExisting: EstoqueApiService },
    CompetenciasApiService, ListarCompetenciasUseCase, ObterCompetenciaUseCase, GerarCompetenciaUseCase,
    RemarcarDistribuicaoUseCase,
    { provide: COMPETENCIAS_API, useExisting: CompetenciasApiService },
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    BrowserSessionStorageService,
    AuthApiService,
    DashboardApiService,
    BeneficiariosApiService,
    CapacidadeApiService,
    CandidaturasApiService,
    PessoasApiService, CatalogosApiService,
    DistribuicoesApiService,
    LoginUseCase,
    GetCurrentUserUseCase,
    LogoutUseCase,
    GetDashboardUseCase,
    BuscarBeneficiariosUseCase,
    ObterBeneficiarioUseCase,
    ListarDistribuicoesUseCase,
    ObterDistribuicaoUseCase,
    AbrirDistribuicaoUseCase,
    EncerrarDistribuicaoUseCase,
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
    BuscarPessoasUseCase, CriarPessoaUseCase, ListarGruposUseCase, ListarMotivosUseCase,
    SessionStateService,
    AtendimentoApiService,
    ListarCheckInsUseCase,
    RegistrarCheckInUseCase,
    ListarRetiradasUseCase,
    RegistrarRetiradaUseCase,
    EstornarRetiradaUseCase,
    ListarAusenciasBeneficiarioUseCase,
    RegistrarJustificativaUseCase,
    AvaliarJustificativaUseCase,
    SessionFacade,
    { provide: SESSION_STORAGE, useExisting: BrowserSessionStorageService },
    { provide: AUTH_API, useExisting: AuthApiService },
    { provide: DASHBOARD_API, useExisting: DashboardApiService },
    { provide: BENEFICIARIOS_API, useExisting: BeneficiariosApiService },
    { provide: CAPACIDADE_API, useExisting: CapacidadeApiService },
    { provide: CANDIDATURAS_API, useExisting: CandidaturasApiService },
    { provide: PESSOAS_API, useExisting: PessoasApiService }, { provide: CATALOGOS_API, useExisting: CatalogosApiService },
    {
      provide: DISTRIBUICOES_API,
      useExisting: DistribuicoesApiService,
    },
    {
      provide: ATENDIMENTO_API,
      useExisting: AtendimentoApiService,
    },
    provideAppInitializer(() => inject(SessionFacade).restore()),
  ];
}
import { COMPETENCIAS_API } from '../application/competencias/competencias-api.port';
import { ListarCompetenciasUseCase, ObterCompetenciaUseCase, GerarCompetenciaUseCase } from '../application/competencias/competencias.use-cases';
import { CompetenciasApiService } from '../infrastructure/api/competencias/competencias-api.service';
import { RemarcarDistribuicaoUseCase } from '../application/distribuicoes/remarcar-distribuicao.use-case';
import { ESTOQUE_API } from '../application/estoque/estoque-api.port';
import { EstoqueApiService } from '../infrastructure/api/estoque/estoque-api.service';
import { ListarInsumosUseCase, ObterInsumoUseCase, ListarCategoriasInsumoUseCase, CadastrarInsumoUseCase, ListarDoadoresUseCase, CriarDoadorUseCase, AtualizarDoadorUseCase, RegistrarEntradaUseCase, RegistrarPerdaUseCase } from '../application/estoque/estoque.use-cases';
const ESTOQUE_USE_CASES = [ListarInsumosUseCase, ObterInsumoUseCase, ListarCategoriasInsumoUseCase, CadastrarInsumoUseCase, ListarDoadoresUseCase, CriarDoadorUseCase, AtualizarDoadorUseCase, RegistrarEntradaUseCase, RegistrarPerdaUseCase];
import { MODELOS_API } from '../application/cestas/modelos-api.port';
import { ListarModelosUseCase, ObterModeloUseCase, CriarModeloUseCase, CriarVersaoModeloUseCase } from '../application/cestas/modelos.use-cases';
import { ModelosApiService } from '../infrastructure/api/cestas/modelos-api.service';
import { PLANEJAMENTO_API } from '../application/planejamento/planejamento-api.port';
import { ListarPlanejamentosUseCase, ObterPlanejamentoUseCase, SimularPlanejamentoUseCase, CriarPlanejamentoUseCase, RevisarPlanejamentoUseCase, AprovarPlanejamentoUseCase } from '../application/planejamento/planejamento.use-cases';
import { PlanejamentoApiService } from '../infrastructure/api/planejamento/planejamento-api.service';
