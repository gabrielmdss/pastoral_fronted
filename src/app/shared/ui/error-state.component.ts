import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Erro amigável com "Tentar novamente".
 * <app-error-state [message]="erro()" (retry)="carregar()" />
 */
@Component({
  selector: 'app-error-state',
  imports: [IconComponent],
  template: `<div class="state error" role="alert">
    <span class="state-icon" aria-hidden="true"><app-icon name="alert-triangle" [size]="20" /></span>
    <strong>{{ title() }}</strong>
    <p>{{ message() }}</p>
    @if (retryable()) {
      <button type="button" class="secondary btn--sm" (click)="retry.emit()"><app-icon name="refresh" /> {{ retryLabel() }}</button>
    }
  </div>`,
  styleUrl: './state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly message = input.required<string>();
  readonly title = input('Não foi possível carregar');
  readonly retryLabel = input('Tentar novamente');
  readonly retryable = input(true);
  readonly retry = output<void>();
}
