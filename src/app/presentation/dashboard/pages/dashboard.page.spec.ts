import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { GetDashboardUseCase } from '../../../application/dashboard/get-dashboard.use-case';
import DashboardPage from './dashboard.page';
describe('DashboardPage', () => {
  it('representa erro sem renderizar dado indefinido', async () => {
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        {
          provide: GetDashboardUseCase,
          useValue: { execute: () => throwError(() => new Error()) },
        },
      ],
    });
    const page = TestBed.createComponent(DashboardPage).componentInstance;
    await page.load();
    expect(page.loading()).toBe(false);
    expect(page.error()).toBeTruthy();
    expect(page.data()).toBeNull();
  });
  it('representa sucesso', async () => {
    const data = { beneficiarios: { capacidade: 0 } };
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [{ provide: GetDashboardUseCase, useValue: { execute: () => of(data) } }],
    });
    const page = TestBed.createComponent(DashboardPage).componentInstance;
    await page.load();
    expect(page.data()).toBe(data);
  });
});
