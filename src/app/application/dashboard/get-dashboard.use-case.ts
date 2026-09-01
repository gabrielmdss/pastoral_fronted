import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { DASHBOARD_API, type DashboardApiPort } from './dashboard-api.port';
import type { Dashboard } from './dashboard.model';
@Injectable()
export class GetDashboardUseCase {
  constructor(@Inject(DASHBOARD_API) private readonly api: DashboardApiPort) {}
  execute(): Observable<Dashboard> {
    return this.api.get();
  }
}
