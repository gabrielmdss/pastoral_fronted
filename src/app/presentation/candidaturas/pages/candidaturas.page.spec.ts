import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import {
  AdmitirCandidaturaUseCase,
  CriarCandidaturaUseCase,
  ListarCandidaturasUseCase,
  MarcarNaoLocalizadoUseCase,
  PriorizarCandidaturaUseCase,
  RegistrarContatoUseCase,
} from '../../../application/candidaturas/candidaturas.use-cases';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import CandidaturasPage from './candidaturas.page';
import { ListarGruposUseCase } from '../../../application/beneficiarios/catalogos.use-cases';
import { ObterCapacidadeUseCase } from '../../../application/capacidade/capacidade.use-cases';
const candidate = {
  id: '1',
  pessoaId: '2',
  nome: 'Ana',
  documentos: [{tipo:'CPF',numeroMascarado:'***.***.***-42'}],
  status: 'AGUARDANDO',
  dataEntrada: '2026-01-01T00:00:00Z',
  prioridadeExcepcional: false,
  tentativasContato: 0,
  ultimaTentativaContato:null,
};
describe('CandidaturasPage', () => {
  it('lista, prioriza e admite pela fila', async () => {
    const priorizar = vi.fn(() => of(undefined)),
      admitir = vi.fn(() => of({ beneficiarioId: '9' }));
    TestBed.configureTestingModule({
      imports: [CandidaturasPage],
      providers: [
        { provide: ListarCandidaturasUseCase, useValue: { execute: () => of([candidate]) } },
        { provide: CriarCandidaturaUseCase, useValue: {} },
        { provide: PriorizarCandidaturaUseCase, useValue: { execute: priorizar } },
        { provide: RegistrarContatoUseCase, useValue: {} },
        { provide: MarcarNaoLocalizadoUseCase, useValue: {} },
        { provide: AdmitirCandidaturaUseCase, useValue: { execute: admitir } },
        { provide: SessionFacade, useValue: { hasPermission: () => true } },
        {provide:ListarGruposUseCase,useValue:{execute:()=>of([{id:'2',codigo:'B',nome:'Grupo B',regraCalendario:'MANUAL'}])}},
        { provide: ObterCapacidadeUseCase, useValue: { execute: () => of({ capacidade: 10, ativos: 5, vagas: 5, excedente: 0 }) } },
      ],
    });
    const page = TestBed.createComponent(CandidaturasPage).componentInstance;
    page.open('priorizar', candidate);
    page.prioridade.setValue('Situação prioritária válida');
    await page.submit();
    expect(priorizar).toHaveBeenCalled();
    page.open('admitir', candidate);
    page.admissao.setValue({
      grupoId: '2',
      autorizarAcimaCapacidade: false,
      justificativaExcecao: null,
    });
    await page.submit();
    expect(admitir).toHaveBeenCalledWith('1', expect.objectContaining({ grupoId: '2' }));
  });
});
