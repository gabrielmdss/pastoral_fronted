import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-image-lightbox',
  template: `
    <div class="lightbox-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="alt() || 'Imagem ampliada'">
      <button type="button" class="lightbox-scrim" tabindex="-1" aria-hidden="true" (click)="dismiss.emit()"></button>
      <figure class="lightbox">
        <img [src]="src()" [alt]="alt()" />
        @if (caption()) {
          <figcaption>{{ caption() }}</figcaption>
        }
        <button
          type="button"
          class="lightbox-close"
          (click)="dismiss.emit()"
          aria-label="Fechar imagem ampliada"
        >
          <app-icon name="x" [size]="18" />
        </button>
      </figure>
    </div>
  `,
  imports: [IconComponent],
  styles: [
    `
      :host {
        display: contents;
      }
      .lightbox-backdrop {
        position: fixed;
        inset: 0;
        background: var(--color-overlay);
        display: grid;
        place-items: center;
        padding: var(--space-4);
        z-index: var(--z-modal);
      }
      .lightbox-scrim {
        position: absolute;
        inset: 0;
        min-height: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        cursor: zoom-out;
      }
      .lightbox-scrim:hover:not(:disabled) {
        background: transparent;
        box-shadow: none;
      }
      .lightbox {
        margin: 0;
        position: relative;
        display: grid;
        gap: var(--space-3);
        justify-items: center;
        max-width: min(92vw, 32rem);
      }
      .lightbox img {
        max-width: 100%;
        max-height: 75vh;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
      }
      .lightbox figcaption {
        color: #fff;
        font-weight: 600;
        text-align: center;
      }
      .lightbox-close {
        position: absolute;
        top: -0.75rem;
        right: -0.75rem;
        width: 2.25rem;
        height: 2.25rem;
        min-height: 0;
        padding: 0;
        display: grid;
        place-items: center;
        border-radius: 50%;
        border: none;
        background: var(--color-surface);
        color: var(--color-text);
        cursor: pointer;
        font-size: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageLightboxComponent {
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly caption = input<string>('');
  /** Emitido ao fechar (botão, clique fora ou Esc). */
  readonly dismiss = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dismiss.emit();
  }
}
