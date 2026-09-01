import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import {
  AdmitirBeneficiarioUseCase,
  AlterarGrupoBeneficiarioUseCase,
  BuscarBeneficiariosUseCase,
  DesligarBeneficiarioUseCase,
  ObterBeneficiarioUseCase,
  ReativarBeneficiarioUseCase,
} from '../../../application/beneficiarios/beneficiarios.use-cases';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import BeneficiarioDetailPage from './beneficiario-detail.page';
import BeneficiariosListPage from './beneficiarios-list.page';
import { ListarGruposUseCase,ListarMotivosUseCase } from '../../../application/beneficiarios/catalogos.use-cases';
const groups={provide:ListarGruposUseCase,useValue:{execute:()=>of([])}};
const session = { hasPermission: () => true };
describe('páginas de beneficiários', () => {
  it('lista, busca e representa empty state', async () => {
    const execute = vi.fn(() => of([]));
    TestBed.configureTestingModule({
      imports: [BeneficiariosListPage],
      providers: [
        provideRouter([]),
        { provide: BuscarBeneficiariosUseCase, useValue: { execute } },
        { provide: AdmitirBeneficiarioUseCase, useValue: {} },
        { provide: SessionFacade, useValue: session },
        groups,
      ],
    });
    const f = TestBed.createComponent(BeneficiariosListPage);
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 400));
    f.detectChanges();
    expect(execute).toHaveBeenCalled();
    expect(f.nativeElement.textContent).toContain('Nenhum beneficiário encontrado');
    f.componentInstance.search.setValue('Maria');
    await new Promise((r) => setTimeout(r, 400));
    expect(execute).toHaveBeenLastCalledWith(expect.objectContaining({ nome: 'Maria' }));
  });
  it('representa erro de listagem', async () => {
    TestBed.configureTestingModule({
      imports: [BeneficiariosListPage],
      providers: [
        provideRouter([]),
        {
          provide: BuscarBeneficiariosUseCase,
          useValue: { execute: () => throwError(() => new Error()) },
        },
        { provide: AdmitirBeneficiarioUseCase, useValue: {} },
        { provide: SessionFacade, useValue: session },
        groups,
      ],
    });
    const f = TestBed.createComponent(BeneficiariosListPage);
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 400));
    expect(f.componentInstance.error()).toBeTruthy();
  });
  it('carrega detalhe e executa desligamento', async () => {
    const desligar = vi.fn(() => of(undefined));
    TestBed.configureTestingModule({
      imports: [BeneficiarioDetailPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '9' } } } },
        {
          provide: ObterBeneficiarioUseCase,
          useValue: {
            execute: () =>
              of({id:'9',status:'ATIVO',dataAdmissao:'2020-01-01',pessoa:{id:'2',nomeCompleto:'Ana',dataNascimento:null,telefone:null,fotoPrincipal:null,documentos:[],enderecoPrincipal:null},grupo:{id:'1',codigo:'A',nome:'Grupo A'},ultimaRetirada:null,direitoAtual:null,proximoDireito:null,pendenciasAtuais:[],historicoResumido:[]}),
          },
        },
        { provide: DesligarBeneficiarioUseCase, useValue: { execute: desligar } },
        { provide: AlterarGrupoBeneficiarioUseCase, useValue: {} },
        { provide: ReativarBeneficiarioUseCase, useValue: {} },
        { provide: SessionFacade, useValue: session },
        groups,{provide:ListarMotivosUseCase,useValue:{execute:()=>of([])}},
      ],
    });
    const page = TestBed.createComponent(BeneficiarioDetailPage).componentInstance;
    await page.load();
    page.mode.set('desligar');
    page.desligarForm.setValue({ motivoId: '1', observacao: null });
    await page.submit();
    expect(desligar).toHaveBeenCalledWith('9', { motivoId: '1', observacao: null });
  });
});
