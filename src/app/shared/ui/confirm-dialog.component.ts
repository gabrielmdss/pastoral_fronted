import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm-backdrop">
      <div
        class="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="message() ? descriptionId : null"
      >
        <h2 [id]="titleId">{{ title() }}</h2>
        @if (message()) {
          <p [id]="descriptionId">{{ message() }}</p>
        }
        <ng-content />
        <div class="dialog-actions">
          <button type="button" class="secondary" (click)="dismiss.emit()" #cancelButton>
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            [class.danger]="danger()"
            [disabled]="disabled()"
            (click)="confirm.emit()"
          >
            {{ disabled() ? 'Processando…' : confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .confirm-backdrop {
        position: fixed;
        inset: 0;
        z-index: var(--z-modal, 200);
        display: grid;
        place-items: center;
        padding: var(--space-4);
        background: #152c2466;
      }
      .confirm-dialog {
        width: min(100%, 30rem);
        padding: var(--space-5);
        border-radius: var(--radius-lg);
        background: var(--color-surface);
        box-shadow: var(--shadow-lg);
        display: grid;
        gap: var(--space-3);
      }
      .confirm-dialog h2 {
        margin: 0;
      }
      .confirm-dialog p {
        margin: 0;
        color: var(--color-text-muted);
      }
      .dialog-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--space-2);
        margin-top: var(--space-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly danger = input(false);
  readonly disabled = input(false);
  readonly confirm = output<void>();
  readonly dismiss = output<void>();

  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');
  protected readonly titleId = `confirm-dialog-title-${crypto.randomUUID()}`;
  protected readonly descriptionId = `confirm-dialog-desc-${crypto.randomUUID()}`;

  constructor() {
    afterNextRender(() => this.cancelButton()?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dismiss.emit();
  }
}
