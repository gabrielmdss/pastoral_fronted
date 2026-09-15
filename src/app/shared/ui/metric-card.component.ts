import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type MetricCardVariant = 'default' | 'attention' | 'critical';

@Component({
  selector: 'app-metric-card',
  host: {
    class: 'fade-in-stagger',
    '[style.--delay.ms]': 'delayMs()',
  },
  template: `
    <span>{{ label() }}</span>
    <strong
      [class.is-attention]="variant() === 'attention'"
      [class.is-critical]="variant() === 'critical'"
      [class.is-mono]="mono()"
    >
      <ng-content />
    </strong>
  `,
  styles: [
    `
      :host {
        display: grid;
        align-content: start;
        gap: var(--space-2);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-5);
      }
      span {
        color: var(--color-text-muted);
        font-size: 0.875rem;
      }
      strong {
        font-size: 1.875rem;
        color: var(--color-primary-dark);
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }
      strong.is-attention {
        color: var(--color-warning);
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
}
