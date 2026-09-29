import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONS, type IconName } from './icons';

/**
 * Ícone SVG inline (estilo Lucide). Herda a cor do texto (currentColor).
 * Decorativo por padrão (aria-hidden); passe `label` para ícones que carregam significado.
 *
 * <app-icon name="users" />  <app-icon name="alert-triangle" [size]="20" label="Atenção" />
 */
@Component({
  selector: 'app-icon',
  host: {
    class: 'app-icon',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
  },
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    [attr.stroke-width]="strokeWidth()"
    stroke-linecap="round"
    stroke-linejoin="round"
    [attr.width]="size()"
    [attr.height]="size()"
    focusable="false"
  >
    @for (d of paths(); track $index) {
      <path [attr.d]="d" />
    }
  </svg>`,
  styles: [
    ':host{display:inline-flex;flex-shrink:0;line-height:0;vertical-align:middle}svg{display:block;width:var(--icon-size,auto);height:var(--icon-size,auto)}',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  /** Tamanho em px (padrão 16). Pode ser sobrescrito por CSS com --icon-size. */
  readonly size = input<number | string>(16);
  readonly strokeWidth = input(2);
  readonly label = input('');
  protected readonly paths = computed<readonly string[]>(() => ICONS[this.name()] ?? []);
}
