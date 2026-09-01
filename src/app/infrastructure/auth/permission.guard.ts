import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SessionFacade } from './session.facade';
export const permissionGuard =
  (permission: string): CanActivateFn =>
  () =>
    inject(SessionFacade).hasPermission(permission)
      ? true
      : inject(Router).createUrlTree(['/dashboard']);
