import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { SessionFacade } from '../../infrastructure/auth/session.facade';
import AuthenticatedLayoutComponent from './authenticated-layout.component';
describe('visibilidade por permissão', () => {
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
    expect(page.assistanceMenu().map((x) => x.label)).toEqual(['Beneficiários', 'Capacidade']);
  });
});
