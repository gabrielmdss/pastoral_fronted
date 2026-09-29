import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionFacade } from '../../infrastructure/auth/session.facade';
import AuthenticatedLayoutComponent from './authenticated-layout.component';
import { NAVIGATION, buildBreadcrumbs, filterNavigation, isRouteActive } from './navigation';

function setup(permissions: string[]) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: SessionFacade,
        useValue: {
          hasPermission: (p: string) => permissions.includes(p),
          currentUser: () => ({ login: 'maria', perfis: ['Coordenação'] }),
          logout: () => undefined,
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(AuthenticatedLayoutComponent);
  fixture.detectChanges();
  return fixture;
}

const hrefs = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('#main-navigation a')).map((a) => a.getAttribute('href'));

describe('menu lateral: visibilidade por permissão', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      /* sem storage */
    }
  });

  it.each([
    [[], []],
    [['ESTOQUE_VISUALIZAR'], ['/estoque', '/doadores', '/planejamentos', '/montagem', '/relatorios']],
    [['BENEFICIARIO_VISUALIZAR'], ['/beneficiarios', '/capacidade', '/competencias', '/distribuicoes', '/relatorios']],
    [
      ['BENEFICIARIO_VISUALIZAR', 'ESTOQUE_VISUALIZAR'],
      ['/dashboard', '/beneficiarios', '/capacidade', '/competencias', '/distribuicoes', '/estoque', '/doadores', '/planejamentos', '/montagem', '/relatorios'],
    ],
    [
      ['CANDIDATURA_VISUALIZAR', 'CESTA_MODELO_GERENCIAR', 'ESTOQUE_INVENTARIO', 'AUDITORIA_VISUALIZAR'],
      ['/candidaturas', '/inventarios', '/modelos-cesta', '/auditoria'],
    ],
  ])('renderiza somente links autorizados para %j', (permissions, links) => {
    const fixture = setup(permissions);
    expect(hrefs(fixture.nativeElement)).toEqual(links);
  });

  it('mostra somente itens autorizados em Assistência', () => {
    const page = setup(['BENEFICIARIO_VISUALIZAR']).componentInstance;
    const assistencia = page.menu().find((g) => g.id === 'assistencia');
    expect(assistencia?.items.map((x) => x.label)).toEqual(['Beneficiários', 'Capacidade', 'Competências']);
  });

  it('grupos e itens com subitens expõem aria-expanded e alternam', () => {
    const fixture = setup(['ESTOQUE_VISUALIZAR']);
    const el: HTMLElement = fixture.nativeElement;
    const parent = el.querySelector('.nav-item--parent') as HTMLButtonElement;
    expect(parent.getAttribute('aria-expanded')).toBe('false');
    parent.click();
    fixture.detectChanges();
    expect(parent.getAttribute('aria-expanded')).toBe('true');
    const group = el.querySelector('.nav-group__toggle') as HTMLButtonElement;
    expect(group.getAttribute('aria-expanded')).toBe('true');
    group.click();
    fixture.detectChanges();
    expect(group.getAttribute('aria-expanded')).toBe('false');
  });

  it('abre o menu do usuário com alterar senha, tema e sair', () => {
    const fixture = setup([]);
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('.shell-user__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    const options = Array.from(el.querySelectorAll('.shell-user__option')).map((o) => o.textContent?.trim());
    expect(options[0]).toContain('Alterar senha');
    expect(options[2]).toContain('Sair');
  });
});

describe('navegação: utilitários', () => {
  it('isRouteActive respeita limite de segmento', () => {
    expect(isRouteActive('/estoque', '/estoque')).toBe(true);
    expect(isRouteActive('/estoque/1?x=1', '/estoque')).toBe(true);
    expect(isRouteActive('/estoque-x', '/estoque')).toBe(false);
  });

  it('remove grupos vazios', () => {
    expect(filterNavigation(NAVIGATION, () => false)).toEqual([]);
  });

  it('gera breadcrumbs a partir da URL', () => {
    expect(buildBreadcrumbs('/beneficiarios')).toEqual([{ label: 'Beneficiários' }]);
    expect(buildBreadcrumbs('/distribuicoes/abc/atendimento')).toEqual([
      { label: 'Distribuições', route: '/distribuicoes' },
      { label: 'Detalhe', route: '/distribuicoes/abc' },
      { label: 'Atendimento' },
    ]);
    expect(buildBreadcrumbs('/inventarios/7')).toEqual([
      { label: 'Estoque' },
      { label: 'Inventários', route: '/inventarios' },
      { label: 'Detalhe' },
    ]);
    expect(buildBreadcrumbs('/planejamentos/novo').at(-1)).toEqual({ label: 'Novo' });
    expect(buildBreadcrumbs('/perfil/senha').at(-1)).toEqual({ label: 'Alterar senha' });
  });
});
