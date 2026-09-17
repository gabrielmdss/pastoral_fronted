import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { BeneficiariosApiService } from './beneficiarios-api.service';
import { mapBeneficiarioDetalhe, mapBeneficiarioResumo } from './beneficiarios-api.mapper';
const detail={id:'1',status:'ATIVO' as const,dataAdmissao:'2020-01-01',pessoa:{id:'2',nomeCompleto:'Ana',dataNascimento:null,telefone:null,fotoPrincipal:null,documentos:[],enderecoPrincipal:null},grupo:null,ultimaRetirada:null,direitoAtual:null,proximoDireito:null,pendenciasAtuais:[],historicoResumido:[]};
describe('BeneficiariosApiService e mapper', () => {
  let api: BeneficiariosApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BeneficiariosApiService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: 'http://api/v1' } },
      ],
    });
    api = TestBed.inject(BeneficiariosApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('mapeia resumo e detalhe', () => {
    expect(
      mapBeneficiarioResumo({
        id: '1',
        pessoaId: '2',
        nomeCompleto: 'Ana',
        status: 'ATIVO',
        grupo: null,
        fotoPrincipal: null,
        documentos: [],
      }),
    ).toMatchObject({ id: '1', nomeCompleto: 'Ana' });
    expect(
      mapBeneficiarioDetalhe(detail),
    ).toEqual(detail);
  });
  it('envia filtros reais server-side', () => {
    api.listar({ nome: 'Ana', status: 'ATIVO' }).subscribe();
    const r = http.expectOne((x) => x.url === 'http://api/v1/beneficiarios');
    expect(r.request.params.get('nome')).toBe('Ana');
    expect(r.request.params.get('status')).toBe('ATIVO');
    r.flush({ data: [] });
  });
  it('consome detalhe e comandos reais', () => {
    api.obter('3').subscribe();
    http
      .expectOne('http://api/v1/beneficiarios/3')
      .flush({ data: {...detail,id:'3'} });
    api
      .admitir({
        pessoaId: '4',
        grupoId: '2',
        autorizarAcimaCapacidade: false,
        justificativaExcecao: null,
      })
      .subscribe();
    expect(http.expectOne('http://api/v1/beneficiarios').request.method).toBe('POST');
    api.desligar('3', { motivoId: '1', observacao: null }).subscribe();
    expect(http.expectOne('http://api/v1/beneficiarios/3/desligar').request.method).toBe('POST');
    api.reativar('3').subscribe();
    expect(http.expectOne('http://api/v1/beneficiarios/3/reativar').request.method).toBe('POST');
    api
      .alterarGrupo('3', {
        grupoDestinoId: '2',
        vigenciaCompetenciaAtual: false,
        motivo: 'Mudança',
      })
      .subscribe();
    expect(http.expectOne('http://api/v1/beneficiarios/3/alterar-grupo').request.method).toBe(
      'POST',
    );
  });
});
