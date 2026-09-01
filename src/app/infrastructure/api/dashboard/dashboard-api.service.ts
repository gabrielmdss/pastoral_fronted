import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { DashboardApiPort } from '../../../application/dashboard/dashboard-api.port';
import type { Dashboard } from '../../../application/dashboard/dashboard.model';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
import type { DashboardResponseDto } from './dashboard-api.contracts';
import { mapDashboard } from './dashboard-api.mapper';
@Injectable()
export class DashboardApiService implements DashboardApiPort {
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}
  get(): Observable<Dashboard> {
    return this.http
      .get<DashboardResponseDto>(`${this.config.apiBaseUrl}/dashboard`)
      .pipe(map(mapDashboard));
  }
}
