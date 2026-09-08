import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type CanActivateFn } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { appRoutes } from '../../../main/app.routes';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import Layout from '../../layout/authenticated-layout.component';
describe('Acesso à Montagem', () => {
  afterEach(() => TestBed.resetTestingModule());
  it.each([false, true])('menu e rotas respeitam ESTOQUE_VISUALIZAR: %s', (allowed) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: SessionFacade,
          useValue: {
            hasPermission: (p: string) => allowed && p === 'ESTOQUE_VISUALIZAR',
            currentUser: () => ({ login: 'operador' }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(Layout);
    fixture.detectChanges();
    expect(!!fixture.nativeElement.querySelector('a[href="/montagem"]')).toBe(allowed);
    for (const path of ['montagem', 'montagem/:id']) {
      const route = appRoutes.find((r) => r.children)?.children?.find((r) => r.path === path);
      expect(route).toBeDefined();
      const guard = route!.canActivate![0] as CanActivateFn;
      const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));
      if (allowed) expect(result).toBe(true);
      else
        expect(
          TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>),
        ).toBe('/acesso-negado');
    }
  });
});
