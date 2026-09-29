import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from './icon.component';
import type { IconName } from './icons';

export type MetricCardVariant = 'default' | 'attention' | 'critical';
export type MetricTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * KPI (KpiCard do protótipo). O valor vem por projeção de conteúdo.
 * <app-metric-card label="Beneficiários ativos" icon="users" tone="success" hint="+12 no mês">{{ n | number }}</app-metric-card>
 */
@Component({
  selector: 'app-metric-card',
  imports: [IconComponent],
  host: {
    class: 'fade-in-stagger',
    '[style.--delay.ms]': 'delayMs()',
  },
  template: `
    <div class="head">
      <span class="label">{{ label() }}</span>
      @if (icon(); as name) {
        <span [class]="'ui-tone ui-tone--' + effectiveTone()"><app-icon [name]="name" /></span>
      }
    </div>
    <strong
      [class.is-attention]="variant() === 'attention'"
      [class.is-critical]="variant() === 'critical'"
      [class.is-mono]="mono()"
    >
      <ng-content />
    </strong>
    @if (hint()) {
      <span class="hint">{{ hint() }}</span>
    }
  `,
  styles: [
    `
      :host {
        display: grid;
        align-content: start;
        gap: var(--space-2);
        min-width: 0;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 1.25rem;
        box-shadow: var(--shadow-card);
      }
      .head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-3);
      }
      .label {
        color: var(--color-text-muted);
        font-size: 0.875rem;
        font-weight: 500;
      }
      .hint {
        color: var(--color-text-muted);
        font-size: 0.75rem;
      }
      strong {
        font-size: 1.875rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.2;
        color: var(--color-text);
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }
      strong.is-attention {
        color: var(--color-warning-text);
      }
      strong.is-critical {
        color: var(--color-danger);
      }
      strong.is-mono {
        font-size: 0.9375rem;
        font-family: var(--font-mono, monospace);
        color: var(--color-text-muted);
        word-break: break-all;
      }
      @media (max-width: 650px) {
        :host {
          padding: var(--space-4);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardComponent {
  readonly label = input.required<string>();
  readonly variant = input<MetricCardVariant>('default');
  readonly delayMs = input(0);
  readonly mono = input(false);
  readonly icon = input<IconName | undefined>(undefined);
  readonly tone = input<MetricTone | undefined>(undefined);
  readonly hint = input('');
  protected readonly effectiveTone = computed<MetricTone>(() => {
    const tone = this.tone();
    if (tone) return tone;
    const variant = this.variant();
    return variant === 'critical' ? 'danger' : variant === 'attention' ? 'warning' : 'neutral';
  });
}
