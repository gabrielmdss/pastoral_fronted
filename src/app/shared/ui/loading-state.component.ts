import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LoadingVariant = 'lines' | 'table' | 'cards' | 'detail';

/**
 * Carregamento com skeleton.
 * <app-loading-state />                       (linhas, padrão)
 * <app-loading-state variant="table" [rows]="6" [columns]="5" />
 * <app-loading-state variant="cards" [rows]="4" />   (grade de KPIs/cards)
 * <app-loading-state variant="detail" />      (lista de definição)
 */
@Component({
  selector: 'app-loading-state',
  template: `<div class="state loading" [class]="'state loading loading--' + variant()" role="status" aria-live="polite">
    <span class="sr-only">{{ label() }}</span>
    @switch (variant()) {
      @case ('table') {
        <div class="sk-table" aria-hidden="true">
          <div class="sk-row sk-row--head" [style.--cols]="columns()">
            @for (c of cols(); track $index) {
              <span class="skeleton"></span>
            }
          </div>
          @for (r of rowList(); track $index) {
            <div class="sk-row" [style.--cols]="columns()">
              @for (c of cols(); track $index) {
                <span class="skeleton"></span>
              }
            </div>
          }
        </div>
      }
      @case ('cards') {
        <div class="sk-cards" aria-hidden="true">
          @for (r of rowList(); track $index) {
            <div class="sk-card"><span class="skeleton sk-w60"></span><span class="skeleton sk-big"></span><span class="skeleton sk-w40"></span></div>
          }
        </div>
      }
      @case ('detail') {
        <div class="sk-detail" aria-hidden="true">
          @for (r of rowList(); track $index) {
            <div><span class="skeleton sk-w40"></span><span class="skeleton"></span></div>
          }
        </div>
      }
      @default {
        <span class="spinner" aria-hidden="true"></span>
        <span class="loading-label" aria-hidden="true">{{ label() }}</span>
        <span class="skeleton-lines" aria-hidden="true">
          <span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span>
        </span>
      }
    }
  </div>`,
  styleUrl: './state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingStateComponent {
  readonly label = input('Carregando…');
  readonly variant = input<LoadingVariant>('lines');
  readonly rows = input(5);
  readonly columns = input(4);
  protected readonly rowList = computed(() => Array.from({ length: this.rows() }));
  protected readonly cols = computed(() => Array.from({ length: this.columns() }));
}
