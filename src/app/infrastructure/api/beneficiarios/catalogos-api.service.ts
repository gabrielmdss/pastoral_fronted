import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, shareReplay } from 'rxjs';
import type { CatalogosApiPort } from '../../../application/beneficiarios/catalogos-api.port';
import type {
  GrupoDistribuicao,
  MotivoDesligamento,
} from '../../../application/beneficiarios/catalogos.models';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
@Injectable()
export class CatalogosApiService implements CatalogosApiPort {
  private readonly grupos$;
  private readonly motivos$;
  constructor(http: HttpClient, @Inject(APP_CONFIG) c: AppConfig) {
    this.grupos$ = http
      .get<{ data: GrupoDistribuicao[] }>(`${c.apiBaseUrl}/grupos-distribuicao`)
      .pipe(
        map((r) => r.data),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.motivos$ = http
      .get<{ data: MotivoDesligamento[] }>(`${c.apiBaseUrl}/motivos-desligamento`)
      .pipe(
        map((r) => r.data),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
  }
  grupos() {
    return this.grupos$;
  }
  motivos() {
    return this.motivos$;
  }
}
