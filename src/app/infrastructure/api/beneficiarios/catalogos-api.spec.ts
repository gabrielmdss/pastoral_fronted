import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { APP_CONFIG } from '../../config/app-config';
import { CatalogosApiService } from './catalogos-api.service';
describe('CatalogosApiService', () => {
  let api: CatalogosApiService, http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CatalogosApiService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: 'http://api/v1' } },
      ],
    });
    api = TestBed.inject(CatalogosApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('carrega grupos uma vez e mantém cache em memória', () => {
    api.grupos().subscribe();
    api.grupos().subscribe();
    const req = http.expectOne('http://api/v1/grupos-distribuicao');
    req.flush({ data: [{ id: '1', codigo: 'A', nome: 'Grupo A', regraCalendario: 'MANUAL' }] });
    http.expectNone('http://api/v1/grupos-distribuicao');
  });
  it('carrega motivos ativos', () => {
    api.motivos().subscribe();
    http.expectOne('http://api/v1/motivos-desligamento').flush({ data: [] });
  });
});
