import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SessionFacade } from './session.facade';
export const relatoriosGuard: CanActivateFn = () => {
  const session = inject(SessionFacade);
  return session.hasPermission('BENEFICIARIO_VISUALIZAR') ||
    session.hasPermission('ESTOQUE_VISUALIZAR')
    ? true
    : inject(Router).createUrlTree(['/acesso-negado']);
};
