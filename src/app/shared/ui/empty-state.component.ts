import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';
import type { IconName } from './icons';

/**
 * Estado vazio (EmptyState do protótipo). Conteúdo projetado = ação.
 * <app-empty-state title="Nenhum beneficiário" message="Ajuste os filtros." icon="users">
 *   <button type="button" (click)="limpar()">Limpar filtros</button>
 * </app-empty-state>
 */
@Component({
  selector: 'app-empty-state',
  imports: [IconComponent],
  template: `<div class="state empty">
    <span class="state-icon" aria-hidden="true"><app-icon [name]="icon()" [size]="20" /></span>
    <strong>{{ title() }}</strong>
    @if (message()) {
      <p>{{ message() }}</p>
    }
    <div class="state-actions"><ng-content /></div>
  </div>`,
  styleUrl: './state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input('Nenhum resultado');
  readonly message = input('Não há dados para exibir.');
  readonly icon = input<IconName>('inbox');
}
