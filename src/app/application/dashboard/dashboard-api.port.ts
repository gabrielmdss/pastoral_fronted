import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Dashboard } from './dashboard.model';
export interface DashboardApiPort { get(): Observable<Dashboard>; }
export const DASHBOARD_API = new InjectionToken<DashboardApiPort>('DASHBOARD_API');
