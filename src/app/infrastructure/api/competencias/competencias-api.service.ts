import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { CompetenciasApiPort } from '../../../application/competencias/competencias-api.port';
import type { GerarCompetenciaInput } from '../../../domain/competencias/competencia.model';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { DataResponse } from '../beneficiarios/beneficiarios-api.contracts';
import type { CompetenciaDto, GerarCompetenciaRequestDto } from './competencias-api.contracts';
import { mapCompetenciaDto } from './competencias-api.mapper';
@Injectable()
export class CompetenciasApiService implements CompetenciasApiPort {
  private readonly url: string;
  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppConfig) {
    this.url = `${config.apiBaseUrl}/competencias`;
  }
  listar() { return this.http.get<DataResponse<CompetenciaDto[]>>(this.url).pipe(map(r => r.data.map(mapCompetenciaDto))); }
  obter(id: string) { return this.http.get<DataResponse<CompetenciaDto>>(`${this.url}/${id}`).pipe(map(r => mapCompetenciaDto(r.data))); }
  gerar(input: GerarCompetenciaInput) {
    const body: GerarCompetenciaRequestDto = { ano: input.ano, mes: input.mes };
    return this.http.post<DataResponse<CompetenciaDto>>(`${this.url}/gerar`, body).pipe(map(r => mapCompetenciaDto(r.data)));
  }
}

