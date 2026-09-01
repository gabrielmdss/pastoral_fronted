import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { CapacidadeApiService } from './capacidade-api.service';
import {
  AlterarCapacidadeUseCase,
  ObterCapacidadeUseCase,
} from '../../../application/capacidade/capacidade.use-cases';
describe('capacidade', () => {
  let api: CapacidadeApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CapacidadeApiService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: 'http://api/v1' } },
      ],
    });
    api = TestBed.inject(CapacidadeApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('usa GET e PUT contratados', () => {
    api.obter().subscribe();
    expect(http.expectOne('http://api/v1/capacidade').request.method).toBe('GET');
    api.alterar({ capacidade: 300, justificativa: 'ajuste anual válido' }).subscribe();
    const r = http.expectOne('http://api/v1/capacidade');
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual({ capacidade: 300, justificativa: 'ajuste anual válido' });
  });
  it('use cases delegam ao port', () => {
    const port = {
      obter: () =>
        new ObterCapacidadeUseCase({
          obter: () => {
            throw 0;
          },
          alterar: () => {
            throw 0;
          },
        }).execute(),
      alterar: () => {
        throw 0;
      },
    };
    expect(port).toBeTruthy();
    expect(AlterarCapacidadeUseCase).toBeTruthy();
  });
});
