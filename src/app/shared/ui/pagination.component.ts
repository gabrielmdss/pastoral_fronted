import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    <div class="pagination" role="navigation" aria-label="Paginação">
      <p class="hint">
        {{ total() }} {{ total() === 1 ? 'registro' : 'registros' }} · Página {{ page() }}
        @if (totalPages()) {
          de {{ totalPages() }}
        }
      </p>
      <div class="pagination-actions">
        <button
          type="button"
          class="secondary"
          (click)="previous.emit()"
          [disabled]="page() <= 1 || disabled()"
        >
          Página anterior</button
        ><button
          type="button"
          class="secondary"
          (click)="next.emit()"
          [disabled]="(totalPages() > 0 && page() >= totalPages()) || disabled()"
        >
          Próxima página
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .pagination {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
      }
      .pagination .hint {
        margin: 0;
      }
      .pagination-actions {
        display: flex;
        gap: var(--space-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input(0);
  readonly total = input(0);
  readonly disabled = input(false);
  readonly previous = output<void>();
  readonly next = output<void>();
}
