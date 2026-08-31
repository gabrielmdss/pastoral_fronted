import type { Routes } from '@angular/router';
import { anonymousGuard, authGuard } from '../infrastructure/auth/auth.guard';
export const appRoutes: Routes = [
  { path:'login', canActivate:[anonymousGuard], loadComponent:()=>import('../presentation/auth/pages/login.page') },
  { path:'', canActivate:[authGuard], loadComponent:()=>import('../presentation/layout/authenticated-layout.component'), children:[
    { path:'', pathMatch:'full', redirectTo:'dashboard' },
    { path:'dashboard', loadComponent:()=>import('../presentation/dashboard/pages/dashboard.page') },
  ]},
  { path:'**', redirectTo:'' },
];
