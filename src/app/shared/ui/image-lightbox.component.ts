import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-image-lightbox',
  template: `
    <div class="lightbox-backdrop" (click)="close.emit()">
      <figure class="lightbox" (click)="$event.stopPropagation()">
        <img [src]="src()" [alt]="alt()" />
        @if (caption()) {
          <figcaption>{{ caption() }}</figcaption>
        }
        <button
          type="button"
          class="lightbox-close"
          (click)="close.emit()"
          aria-label="Fechar imagem ampliada"
        >
          ✕
        </button>
      </figure>
    </div>
  `,
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
  readonly close = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }
}
