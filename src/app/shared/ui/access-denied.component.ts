import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-access-denied',
  template: '<h1>Acesso não disponível</h1><p>Seu usuário não possui permissão para acessar esta página. Utilize as opções disponíveis no menu ou solicite acesso ao responsável.</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccessDeniedComponent {}
