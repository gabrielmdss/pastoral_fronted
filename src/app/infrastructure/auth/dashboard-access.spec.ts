import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { GetDashboardUseCase } from '../../application/dashboard/get-dashboard.use-case';
import { appRoutes } from '../../main/app.routes';
import { SessionFacade } from './session.facade';

describe('acesso ao dashboard pelas rotas reais', () => {
  it.each([
    { permissions: [] },
    { permissions: ['BENEFICIARIO_VISUALIZAR'] },
    { permissions: ['ESTOQUE_VISUALIZAR'] },
    { permissions: ['BENEFICIARIO_VISUALIZAR', 'ESTOQUE_VISUALIZAR'] },
  ])('exige ambas as permissions: $permissions', async ({ permissions }) => {
    const execute = vi.fn(() => of(null));
    TestBed.configureTestingModule({ providers: [
      provideRouter(appRoutes),
      { provide: SessionFacade, useValue: {
        isAuthenticated: () => true,
        hasPermission: (p: string) => permissions.includes(p),
        currentUser: () => ({ login: 'operador' }),
      } },
      { provide: GetDashboardUseCase, useValue: { execute } },
    ] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/dashboard');
    const authorized = permissions.length === 2;
    expect(TestBed.inject(Router).url).toBe(authorized ? '/dashboard' : '/acesso-negado');
    expect(execute).toHaveBeenCalledTimes(authorized ? 1 : 0);
    if (!authorized) {
      await harness.navigateByUrl('/');
      expect(TestBed.inject(Router).url).toBe('/acesso-negado');
      expect(execute).not.toHaveBeenCalled();
    }
  });
});
