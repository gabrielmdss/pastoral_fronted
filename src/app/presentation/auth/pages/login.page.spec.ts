import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import LoginPage from './login.page';
describe('LoginPage', () => {
  const login = vi.fn().mockResolvedValue(undefined);
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: SessionFacade, useValue: { loading: () => false, login } },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
      ],
    }),
  );
  it('valida campos obrigatórios', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(login).not.toHaveBeenCalled();
  });
  it('envia credenciais sem persistir senha na página', async () => {
    const page = TestBed.createComponent(LoginPage).componentInstance;
    page.form.setValue({ login: 'admin', senha: 'segredo' });
    await page.submit();
    expect(login).toHaveBeenCalledWith({ login: 'admin', senha: 'segredo' });
  });
});
