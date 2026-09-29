import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type MeterTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Medidor de progresso/nível (barra) com semântica `role="progressbar"`. Usa as classes globais `ui-meter*`.
 * <app-meter [value]="feitos" [max]="total" tone="success" label="Retiradas concluídas" [showLabel]="true" />
 * `label` vira o nome acessível; com `showLabel` aparece acima da barra com o percentual (ou `valueText`).
 */
@Component({
  selector: 'app-meter',
  template: `
    @if (showLabel()) {
      <div class="ui-meter-group__labels" aria-hidden="true">
        <span>{{ label() }}</span><span>{{ texto() }}</span>
      </div>
    }
    <div
      class="ui-meter"
      [class]="classes()"
      role="progressbar"
      [attr.aria-label]="label() || null"
      aria-valuemin="0"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuenow]="valorLimitado()"
      [attr.aria-valuetext]="texto()"
    >
      <span class="ui-meter__fill" [style.width.%]="percentual()"></span>
    </div>
  `,
  host: { class: 'ui-meter-group' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeterComponent {
  readonly value = input.required<number>();
  readonly max = input(100);
  readonly tone = input<MeterTone>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly label = input('');
  readonly showLabel = input(false);
  /** Texto do valor (padrão: percentual formatado). */
  readonly valueText = input<string | undefined>(undefined);

  protected readonly valorLimitado = computed(() => Math.max(0, Math.min(this.max(), this.value() || 0)));
  protected readonly percentual = computed(() =>
    this.max() > 0 ? Math.round((this.valorLimitado() / this.max()) * 100) : 0,
  );
  protected readonly texto = computed(() => this.valueText() ?? `${this.percentual()}%`);
  protected readonly classes = computed(() => {
    const size = this.size() === 'md' ? '' : ` ui-meter--${this.size()}`;
    return `ui-meter ui-meter--${this.tone()}${size}`;
  });
}
