import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { SessionFacade } from '../../infrastructure/auth/session.facade';
import AuthenticatedLayoutComponent from './authenticated-layout.component';
describe('visibilidade por permissão', () => {
  it.each([
    [[], []],
    [['ESTOQUE_VISUALIZAR'], ['/relatorios']],
    [['BENEFICIARIO_VISUALIZAR'], ['/distribuicoes', '/relatorios']],
    [['BENEFICIARIO_VISUALIZAR', 'ESTOQUE_VISUALIZAR'], ['/dashboard', '/distribuicoes', '/relatorios']],
  ])('renderiza navegação autorizada para %j', (permissions, links) => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), {
        provide: SessionFacade,
        useValue: {
          hasPermission: (p: string) => permissions.includes(p),
          currentUser: () => ({ login: 'u' }),
        },
      }],
    });
    const fixture = TestBed.createComponent(AuthenticatedLayoutComponent);
    fixture.detectChanges();
    const menu = Array.from(fixture.nativeElement.querySelectorAll('nav > a:not(.subitem)')) as HTMLAnchorElement[];
    expect(menu.map(a => a.getAttribute('href'))).toEqual(links);
  });
  it('mostra somente itens autorizados em Assistência', () => {
    TestBed.configureTestingModule({
      imports: [AuthenticatedLayoutComponent],
      providers: [
        provideRouter([]),
        {
          provide: SessionFacade,
          useValue: {
            hasPermission: (p: string) => p === 'BENEFICIARIO_VISUALIZAR',
            currentUser: () => ({ login: 'u' }),
            logout: () => undefined,
          },
        },
      ],
    });
    const page = TestBed.createComponent(AuthenticatedLayoutComponent).componentInstance;
    expect(page.assistanceMenu().map((x) => x.label)).toEqual([
      'Beneficiários',
      'Capacidade',
      'Competências',
    ]);
  });
});
