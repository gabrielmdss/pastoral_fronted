import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdmitirBeneficiarioUseCase, BuscarBeneficiariosUseCase } from '../../../application/beneficiarios/beneficiarios.use-cases';
import { ListarGruposUseCase } from '../../../application/beneficiarios/catalogos.use-cases';
import { AdmitirCandidaturaUseCase, CriarCandidaturaUseCase, ListarCandidaturasUseCase, MarcarNaoLocalizadoUseCase, PriorizarCandidaturaUseCase, RegistrarContatoUseCase } from '../../../application/candidaturas/candidaturas.use-cases';
import { ObterCapacidadeUseCase } from '../../../application/capacidade/capacidade.use-cases';
import { BuscarPessoasUseCase, CriarPessoaUseCase } from '../../../application/pessoas/pessoas.use-cases';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import BeneficiariosListPage from '../../beneficiarios/pages/beneficiarios-list.page';
import CandidaturasPage from '../../candidaturas/pages/candidaturas.page';
import { PessoaSearchFieldComponent } from './pessoa-search-field.component';

const pessoa = { id: '42', nomeCompleto: 'Maria', dataNascimento: null, documentos: [], beneficiario: null };

function setup(kind: 'beneficiarios' | 'candidaturas') {
  const consultar = vi.fn().mockReturnValue(of([]));
  const salvar = vi.fn().mockReturnValue(of({ id: '9' }));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: SessionFacade, useValue: { hasPermission: () => true } },
      { provide: ListarGruposUseCase, useValue: { execute: () => of([]) } },
      { provide: BuscarBeneficiariosUseCase, useValue: { execute: consultar } },
      { provide: ListarCandidaturasUseCase, useValue: { execute: consultar } },
      { provide: AdmitirBeneficiarioUseCase, useValue: { execute: salvar } },
      { provide: CriarCandidaturaUseCase, useValue: { execute: salvar } },
      { provide: PriorizarCandidaturaUseCase, useValue: { execute: salvar } },
      { provide: RegistrarContatoUseCase, useValue: { execute: salvar } },
      { provide: MarcarNaoLocalizadoUseCase, useValue: { execute: salvar } },
      { provide: AdmitirCandidaturaUseCase, useValue: { execute: salvar } },
      { provide: ObterCapacidadeUseCase, useValue: { execute: () => of(null) } },
      { provide: BuscarPessoasUseCase, useValue: { execute: () => of([]) } },
      { provide: CriarPessoaUseCase, useValue: { execute: () => of(pessoa) } },
    ],
  });
  const fixture = kind === 'beneficiarios'
    ? TestBed.createComponent(BeneficiariosListPage)
    : TestBed.createComponent(CandidaturasPage);
  const page = fixture.componentInstance;
  const refresh = () => page instanceof BeneficiariosListPage ? page.applyFilters() : page.refresh();
  const open = () => {
    if (page instanceof BeneficiariosListPage) {
      page.openAdmission();
      page.admission.controls.grupoId.setValue('2');
    } else page.open('nova');
    fixture.detectChanges();
  };
  const submit = () => page instanceof BeneficiariosListPage ? page.submitAdmission() : page.submit();
  return { fixture, page, consultar, salvar, refresh, open, submit };
}

describe('candidaturas - recarga de comandos existentes', () => {
  it.each(['priorizar', 'contato', 'nao-localizado', 'admitir'] as const)('recarrega após %s', async mode => {
    const { page, consultar, salvar } = setup('candidaturas');
    if (!(page instanceof CandidaturasPage)) throw new Error('Página inesperada');
    page.open(mode, {
      id: '1', pessoaId: '42', nome: 'Maria', documentos: [], status: 'AGUARDANDO',
      dataEntrada: '2026-09-01', prioridadeExcepcional: false, tentativasContato: 0,
      ultimaTentativaContato: null,
    });
    page.prioridade.setValue('Justificativa válida para prioridade');
    page.contato.controls.resultado.setValue('Contato realizado');
    page.admissao.controls.grupoId.setValue('2');
    await page.submit();
    expect(salvar).toHaveBeenCalledOnce();
    expect(consultar).toHaveBeenCalledTimes(2);
  });
});

describe.each(['beneficiarios', 'candidaturas'] as const)('%s - atualização e seleção', kind => {
  afterEach(() => { vi.useRealTimers(); TestBed.resetTestingModule(); });

  it('mantém debounce e permite refresh repetido com busca inalterada', async () => {
    vi.useFakeTimers();
    const { page, consultar, refresh } = setup(kind);
    page.search.setValue('Ma');
    await vi.advanceTimersByTimeAsync(200);
    page.search.setValue('Maria');
    await vi.advanceTimersByTimeAsync(349);
    expect(consultar).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(consultar).toHaveBeenCalledTimes(2);
    refresh();
    refresh();
    expect(consultar).toHaveBeenCalledTimes(4);
    expect(consultar).toHaveBeenLastCalledWith(expect.objectContaining({ nome: 'Maria' }));
    expect(page.search.value).toBe('Maria');
    page.search.setValue('Maria');
    await vi.advanceTimersByTimeAsync(350);
    expect(consultar).toHaveBeenCalledTimes(4);
  });

  it('aplica filtros sem alterar a busca e permite retry após erro', () => {
    const { fixture, page, consultar, refresh } = setup(kind);
    if (page instanceof BeneficiariosListPage) page.filters.setValue({ status: 'ATIVO', grupoId: '2' });
    else page.status.setValue('AGUARDANDO');
    refresh();
    expect(consultar).toHaveBeenCalledTimes(2);
    expect(consultar).toHaveBeenLastCalledWith(page instanceof BeneficiariosListPage
      ? { status: 'ATIVO', grupoId: '2' } : { status: 'AGUARDANDO' });
    consultar.mockReturnValueOnce(throwError(() => new Error('falha')));
    refresh();
    fixture.detectChanges();
    const retry = fixture.nativeElement.querySelector('app-error-state button') as HTMLButtonElement;
    expect(retry).not.toBeNull();
    retry.click();
    expect(consultar).toHaveBeenCalledTimes(4);
    expect(page.error()).toBe('');
  });

  it('reconsulta após mutação sem alterar busca ou filtros', async () => {
    vi.useFakeTimers();
    const { page, consultar, salvar, open, submit } = setup(kind);
    page.search.setValue('Maria');
    await vi.advanceTimersByTimeAsync(350);
    open();
    page.pessoa.set(pessoa);
    await submit();
    expect(salvar).toHaveBeenCalledOnce();
    expect(consultar).toHaveBeenCalledTimes(3);
    expect(consultar).toHaveBeenLastCalledWith(expect.objectContaining({ nome: 'Maria' }));
    expect(page.search.value).toBe('Maria');
  });

  it('Trocar pessoa limpa o pai e impede envio do ID anterior', async () => {
    const { fixture, page, salvar, open, submit } = setup(kind);
    open();
    const picker = fixture.debugElement.query(By.directive(PessoaSearchFieldComponent)).componentInstance as PessoaSearchFieldComponent;
    picker.select(pessoa);
    expect(page.pessoa()?.id).toBe('42');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.selected button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(picker.selected()).toBeNull();
    expect(page.pessoa()).toBeNull();
    await submit();
    expect(salvar).not.toHaveBeenCalled();
  });
});
