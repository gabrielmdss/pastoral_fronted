import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { USUARIOS_API } from '../../../application/usuarios/usuarios-api.port';
import { CriarUsuarioUseCase, ListarPerfisUseCase } from '../../../application/usuarios/usuarios.use-cases';
import { filterNavigation, NAVIGATION } from '../../layout/navigation';
import UsuariosPage from './usuarios.page';

const perfis = [
  { id: '1', codigo: 'ADMINISTRADOR', nome: 'Administrador' },
  { id: '2', codigo: 'ATENDIMENTO', nome: 'Atendimento' },
  { id: '3', codigo: 'ESTOQUE', nome: 'Estoque' },
];

async function setup(api?: Partial<Record<'listarPerfis' | 'criar', ReturnType<typeof vi.fn>>>) {
  const mock = {
    listarPerfis: api?.listarPerfis ?? vi.fn(() => of(perfis)),
    criar: api?.criar ?? vi.fn(() => of({ id: '9', login: 'maria', perfis: ['ATENDIMENTO', 'ESTOQUE'] })),
  };
  TestBed.configureTestingModule({
    providers: [ListarPerfisUseCase, CriarUsuarioUseCase, { provide: USUARIOS_API, useValue: mock }],
  });
  const fixture = TestBed.createComponent(UsuariosPage);
  const page = fixture.componentInstance;
  fixture.detectChanges();
  await vi.waitFor(() => expect(page.perfisLoading()).toBe(false));
  fixture.detectChanges();
  return { fixture, page, api: mock };
}

function marcar(fixture: Awaited<ReturnType<typeof setup>>['fixture'], codigo: string) {
  const checkbox = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
    `input[data-perfil="${codigo}"]`,
  )!;
  checkbox.click();
  fixture.detectChanges();
}

function preencher(page: UsuariosPage, senha = 'segredo123', confirmar = senha) {
  page.form.patchValue({ login: '  maria ', senha, confirmarSenha: confirmar });
}

describe('Cadastro de usuários', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('lista os perfis ativos como opções', async () => {
    const { fixture } = await setup();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Atendimento');
    expect(texto).toContain('Estoque');
    expect(texto).toContain('Acesso total');
  });

  it('cria usuário com os perfis marcados e limpa o formulário', async () => {
    const { fixture, page, api } = await setup();
    preencher(page);
    marcar(fixture, 'ATENDIMENTO');
    marcar(fixture, 'ESTOQUE');

    await page.submit();
    fixture.detectChanges();

    expect(api.criar).toHaveBeenCalledWith({ login: 'maria', senha: 'segredo123', perfilIds: ['2', '3'] });
    expect(page.ultimoCriado()?.login).toBe('maria');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Atendimento, Estoque');
    expect(page.form.controls.login.value).toBe('');
    expect(page.form.controls.perfilIds.value).toEqual([]);
  });

  it('não envia sem perfil ou com senhas diferentes', async () => {
    const { fixture, page, api } = await setup();
    preencher(page);
    await page.submit();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Selecione pelo menos um perfil.');

    marcar(fixture, 'ATENDIMENTO');
    preencher(page, 'segredo123', 'outraSenha1');
    await page.submit();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('As senhas não coincidem.');

    preencher(page, 'curta');
    await page.submit();
    expect(api.criar).not.toHaveBeenCalled();
  });

  it('mostra a mensagem do backend quando o login já existe', async () => {
    const criar = vi.fn(() =>
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: { error: { code: 'LOGIN_JA_EXISTE', message: 'Login já cadastrado' } },
      })),
    );
    const { fixture, page } = await setup({ criar });
    preencher(page);
    marcar(fixture, 'ATENDIMENTO');

    await page.submit();
    fixture.detectChanges();

    expect(page.errorMessage()).toBe('Já existe um usuário com esse login.');
    expect(page.form.controls.login.value).toBe('  maria ');
    expect(page.saving()).toBe(false);
  });

  it('permite tentar de novo quando os perfis não carregam', async () => {
    const listarPerfis = vi.fn()
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })))
      .mockReturnValue(of(perfis));
    const { fixture, page } = await setup({ listarPerfis });
    expect(page.perfisError()).not.toBe('');
    const enviar = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(enviar.disabled).toBe(true);

    await page.carregarPerfis();
    expect(page.perfis()).toHaveLength(3);
    expect(page.perfisError()).toBe('');
  });

  it('mostra Usuários no menu só para quem tem PERFIL_GERENCIAR', () => {
    const rotas = (can: (p: string) => boolean) =>
      filterNavigation(NAVIGATION, can).flatMap((grupo) => grupo.items.map((item) => item.route));
    expect(rotas((p) => p === 'PERFIL_GERENCIAR')).toContain('/usuarios');
    expect(rotas((p) => p === 'BENEFICIARIO_VISUALIZAR')).not.toContain('/usuarios');
  });
});
