import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { SessionFacade } from '../../infrastructure/auth/session.facade';

@Directive({
  selector: '[appPermissionOnly]',
})
export class PermissionOnlyDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly session = inject(SessionFacade);
  private created = false;

  readonly appPermissionOnly = input.required<string>();

  constructor() {
    effect(() => {
      const allowed = this.session.hasPermission(this.appPermissionOnly());
      if (allowed && !this.created) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.created = true;
      } else if (!allowed && this.created) {
        this.viewContainer.clear();
        this.created = false;
      }
    });
  }
}
