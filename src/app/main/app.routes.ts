import type { Routes } from '@angular/router';
import { anonymousGuard, authGuard } from '../infrastructure/auth/auth.guard';
import { permissionGuard } from '../infrastructure/auth/permission.guard';
export const appRoutes: Routes = [
  {
    path: 'login',
    canActivate: [anonymousGuard],
    loadComponent: () => import('../presentation/auth/pages/login.page'),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('../presentation/layout/authenticated-layout.component'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('../presentation/dashboard/pages/dashboard.page'),
      },
      {
        path: 'beneficiarios',
        canActivate: [permissionGuard('BENEFICIARIO_VISUALIZAR')],
        loadComponent: () => import('../presentation/beneficiarios/pages/beneficiarios-list.page'),
      },
      {
        path: 'beneficiarios/:id',
        canActivate: [permissionGuard('BENEFICIARIO_VISUALIZAR')],
        loadComponent: () => import('../presentation/beneficiarios/pages/beneficiario-detail.page'),
      },
      {
        path: 'candidaturas',
        canActivate: [permissionGuard('CANDIDATURA_VISUALIZAR')],
        loadComponent: () => import('../presentation/candidaturas/pages/candidaturas.page'),
      },
      {
        path: 'capacidade',
        canActivate: [permissionGuard('BENEFICIARIO_VISUALIZAR')],
        loadComponent: () => import('../presentation/capacidade/pages/capacidade.page'),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
