import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'app-empty-state',
  template: '<div class="state"><strong>{{title()}}</strong><p>{{message()}}</p></div>',
  styleUrl: './state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input('Nenhum resultado');
  readonly message = input('Não há dados para exibir.');
}
