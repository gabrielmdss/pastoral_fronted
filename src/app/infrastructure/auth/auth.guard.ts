import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SessionFacade } from './session.facade';
export const authGuard: CanActivateFn = () => {
  const session = inject(SessionFacade);
  return session.isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
};
export const anonymousGuard: CanActivateFn = () => {
  const session = inject(SessionFacade);
  return session.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};
