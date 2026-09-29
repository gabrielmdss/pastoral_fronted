import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Card de seção (SectionCard do protótipo). Usa as classes globais `ui-card*`.
 * <app-section-card title="Itens" description="…" [flush]="true">
 *   <button actions class="btn--sm secondary">Exportar</button>
 *   <div class="ui-table-wrap">…</div>
 *   <p note class="ui-message ui-message--info ui-card__note">Nota com respiro mesmo em card flush.</p>
 * </app-section-card>
 * Dentro do corpo (ex.: em blocos @if aninhados) use apenas a classe `ui-card__note`.
 */
@Component({
  selector: 'app-section-card',
  host: { class: 'ui-card' },
  template: `
    @if (title()) {
      <header class="ui-card__header">
        <div>
          <h2>{{ title() }}</h2>
          @if (description()) {
            <p>{{ description() }}</p>
          }
        </div>
        <div class="ui-card__actions"><ng-content select="[actions]" /></div>
      </header>
    }
    <div class="ui-card__body" [class.ui-card__body--flush]="flush()"><ng-content /></div>
    <ng-content select="[note]" />
    <ng-content select="[footer]" />
  `,
  styles: [':host{display:block;min-width:0}.ui-card__actions:empty{display:none}'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCardComponent {
  readonly title = input('');
  readonly description = input('');
  /** Sem padding no corpo (tabelas/listas encostadas nas bordas). */
  readonly flush = input(false);
}
