import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { BeneficiariosApiPort } from '../../../application/beneficiarios/beneficiarios-api.port';
import type {
  AdmitirBeneficiarioInput,
  AlterarGrupoInput,
  BeneficiarioFiltro,
  DesligarBeneficiarioInput,
} from '../../../application/beneficiarios/beneficiarios.models';
import type {
  BeneficiarioDetalhe,
  BeneficiarioResumo,
} from '../../../domain/beneficiarios/beneficiario.model';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
import type {
  BeneficiarioDetalheDto,
  BeneficiarioResumoDto,
  DataResponse,
} from './beneficiarios-api.contracts';
import { mapBeneficiarioDetalhe, mapBeneficiarioResumo } from './beneficiarios-api.mapper';
@Injectable()
export class BeneficiariosApiService implements BeneficiariosApiPort {
  private readonly url: string;
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) c: AppConfig,
  ) {
    this.url = `${c.apiBaseUrl}/beneficiarios`;
  }
  listar(f: BeneficiarioFiltro): Observable<BeneficiarioResumo[]> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(f)) if (v) params = params.set(k, v);
    return this.http
      .get<DataResponse<BeneficiarioResumoDto[]>>(this.url, { params })
      .pipe(map((r) => r.data.map(mapBeneficiarioResumo)));
  }
  obter(id: string): Observable<BeneficiarioDetalhe> {
    return this.http
      .get<DataResponse<BeneficiarioDetalheDto>>(`${this.url}/${id}`)
      .pipe(map((r) => mapBeneficiarioDetalhe(r.data)));
  }
  admitir(i: AdmitirBeneficiarioInput) {
    return this.http.post<DataResponse<{ id: string }>>(this.url, i).pipe(map((r) => r.data));
  }
  desligar(id: string, i: DesligarBeneficiarioInput) {
    return this.http.post<void>(`${this.url}/${id}/desligar`, i);
  }
  reativar(id: string) {
    return this.http.post<void>(`${this.url}/${id}/reativar`, {});
  }
  alterarGrupo(id: string, i: AlterarGrupoInput) {
    return this.http.post<void>(`${this.url}/${id}/alterar-grupo`, i);
  }
}
