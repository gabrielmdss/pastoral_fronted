import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import {
  AlterarCapacidadeUseCase,
  ObterCapacidadeUseCase,
} from '../../../application/capacidade/capacidade.use-cases';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import CapacidadePage from './capacidade.page';
describe('CapacidadePage', () => {
  it('carrega e altera capacidade sem reload', async () => {
    const alterar = vi.fn(() => of({ capacidade: 20, ativos: 10, vagas: 10, excedente: 0 }));
    TestBed.configureTestingModule({
      imports: [CapacidadePage],
      providers: [
        {
          provide: ObterCapacidadeUseCase,
          useValue: { execute: () => of({ capacidade: 10, ativos: 10, vagas: 0, excedente: 0 }) },
        },
        { provide: AlterarCapacidadeUseCase, useValue: { execute: alterar } },
        { provide: SessionFacade, useValue: { hasPermission: () => true } },
      ],
    });
    const page = TestBed.createComponent(CapacidadePage).componentInstance;
    await page.load();
    expect(page.data()?.capacidade).toBe(10);
    page.form.setValue({ capacidade: 20, justificativa: 'Ajuste anual válido' });
    await page.submit();
    expect(alterar).toHaveBeenCalled();
    expect(page.data()?.capacidade).toBe(20);
  });
});
