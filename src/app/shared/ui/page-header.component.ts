import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';

/**
 * Cabeçalho de página (PageHeader do protótipo).
 * <app-page-header title="Beneficiários" description="…" backLink="/distribuicoes" backLabel="Distribuições">
 *   <button actions>Novo</button>
 *   <button actions class="secondary">Exportar</button>  <!-- vários [actions] são aceitos -->
 *   <ng-container ngProjectAs="[actions]">@if (x) { <button>…</button> }</ng-container>
 * </app-page-header>
 * Ações dentro de @if/@for precisam de um wrapper `ngProjectAs="[actions]"` para cair no slot certo.
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink, IconComponent],
  template: `
    @if (backLink()) {
      <a class="back-link" [routerLink]="backLink()"><app-icon name="arrow-left" /> {{ backLabel() }}</a>
    }
    <header class="page-header">
      <div class="page-header-text">
        @if (eyebrow()) {
          <p class="eyebrow">{{ eyebrow() }}</p>
        }
        <h1>{{ title() }}</h1>
        @if (description()) {
          <p>{{ description() }}</p>
        }
        <ng-content select="[meta]" />
      </div>
      <div class="page-header-actions">
        <ng-content select="[actions]" />
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .back-link {
        gap: 0.375rem;
        min-height: 2rem;
        margin-bottom: var(--space-2);
        text-decoration: none;
      }
      .page-header-text {
        min-width: 0;
      }
      .page-header-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-2);
      }
      .page-header-actions:empty {
        display: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly eyebrow = input<string>('');
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly backLink = input<string | readonly unknown[] | null>(null);
  readonly backLabel = input('Voltar');
}
