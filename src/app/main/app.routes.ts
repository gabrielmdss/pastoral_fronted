import type { Routes } from '@angular/router';
import { relatoriosGuard } from '../infrastructure/auth/relatorios.guard';
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
      {path:'relatorios',canActivate:[relatoriosGuard],loadComponent:()=>import('../presentation/relatorios/pages/relatorios.page')},
      { path: 'inventarios', canActivate: [permissionGuard('ESTOQUE_INVENTARIO')], loadComponent: () => import('../presentation/estoque/pages/inventarios.page') },
      { path: 'inventarios/:id', canActivate: [permissionGuard('ESTOQUE_INVENTARIO')], loadComponent: () => import('../presentation/estoque/pages/inventarios.page') },
      { path: 'distribuicoes/:id/liberacoes', canActivate: [permissionGuard('BENEFICIARIO_VISUALIZAR'), permissionGuard('ESTOQUE_VISUALIZAR')], loadComponent: () => import('../presentation/liberacoes/pages/liberacoes.page') },
      { path: 'montagem', canActivate: [permissionGuard('ESTOQUE_VISUALIZAR')], loadComponent: () => import('../presentation/montagem/pages/montagem.page') },
      { path: 'montagem/:id', canActivate: [permissionGuard('ESTOQUE_VISUALIZAR')], loadComponent: () => import('../presentation/montagem/pages/montagem.page') },
      { path: 'planejamentos', canActivate: [permissionGuard('ESTOQUE_VISUALIZAR')], loadComponent: () => import('../presentation/planejamento/pages/planejamentos-list.page') },
      { path: 'planejamentos/novo', canActivate: [permissionGuard('ESTOQUE_VISUALIZAR')], loadComponent: () => import('../presentation/planejamento/pages/planejamento-detail.page') },
      { path: 'planejamentos/:id', canActivate: [permissionGuard('ESTOQUE_VISUALIZAR')], loadComponent: () => import('../presentation/planejamento/pages/planejamento-detail.page') },
      { path: 'modelos-cesta', canActivate: [permissionGuard('CESTA_MODELO_GERENCIAR')], loadComponent: () => import('../presentation/cestas/pages/modelos.page') },
      { path: 'estoque', canActivate: [permissionGuard('ESTOQUE_VISUALIZAR')], loadComponent: () => import('../presentation/estoque/pages/estoque.page') },
      {
        path: 'competencias',
        canActivate: [permissionGuard('BENEFICIARIO_VISUALIZAR')],
        loadComponent: () => import('../presentation/competencias/pages/competencias.page'),
      },
      {
        path: 'competencias/:id',
        canActivate: [permissionGuard('BENEFICIARIO_VISUALIZAR')],
        loadComponent: () => import('../presentation/competencias/pages/competencias.page'),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [permissionGuard('BENEFICIARIO_VISUALIZAR'), permissionGuard('ESTOQUE_VISUALIZAR')],
        loadComponent: () => import('../presentation/dashboard/pages/dashboard.page'),
      },
      {
        path: 'acesso-negado',
        loadComponent: () => import('../shared/ui/access-denied.component'),
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
      {
        path: 'distribuicoes',
        canActivate: [permissionGuard('BENEFICIARIO_VISUALIZAR')],
        loadComponent: () =>
          import('../presentation/distribuicoes/pages/distribuicoes-list.page'),
      },
      {
        path: 'distribuicoes/:id',
        canActivate: [permissionGuard('BENEFICIARIO_VISUALIZAR')],
        loadComponent: () =>
          import('../presentation/distribuicoes/pages/distribuicao-detail.page'),
      },
      {
        path: 'distribuicoes/:id/atendimento',
        canActivate: [
          permissionGuard('BENEFICIARIO_VISUALIZAR'),
          permissionGuard('DISTRIBUICAO_TRIAGEM'),
        ],
        loadComponent: () =>
          import('../presentation/atendimento/pages/atendimento-distribuicao.page'),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
