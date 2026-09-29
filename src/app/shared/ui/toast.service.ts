import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';
import { IconComponent } from './icon.component';
import type { IconName } from './icons';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  title?: string;
}

/**
 * Notificações efêmeras. O host (`<app-toast-host />`) já está no layout autenticado.
 * inject(ToastService).success('Distribuição encerrada.');
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly items = signal<Toast[]>([]);
  readonly toasts = this.items.asReadonly();

  show(tone: ToastTone, message: string, options: { title?: string; durationMs?: number } = {}): number {
    const id = ++this.seq;
    this.items.update((list) => [...list.slice(-3), { id, tone, message, title: options.title }]);
    const duration = options.durationMs ?? (tone === 'error' ? 8000 : 4500);
    if (duration > 0) setTimeout(() => this.dismiss(id), duration);
    return id;
  }
  success(message: string, title?: string): number {
    return this.show('success', message, { title });
  }
  error(message: string, title?: string): number {
    return this.show('error', message, { title });
  }
  warning(message: string, title?: string): number {
    return this.show('warning', message, { title });
  }
  info(message: string, title?: string): number {
    return this.show('info', message, { title });
  }
  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }
}

const TOAST_ICONS: Record<ToastTone, IconName> = {
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert-triangle',
  info: 'info',
};

@Component({
  selector: 'app-toast-host',
  imports: [IconComponent],
  template: `<div class="ui-toasts" aria-live="polite" aria-relevant="additions">
    @for (toast of service.toasts(); track toast.id) {
      <div [class]="'ui-toast ui-toast--' + toast.tone" [attr.role]="toast.tone === 'error' ? 'alert' : 'status'">
        <app-icon class="ui-toast__icon" [name]="icons[toast.tone]" [size]="18" />
        <div class="ui-toast__body">
          @if (toast.title) {
            <strong>{{ toast.title }}</strong>
          }
          <span>{{ toast.message }}</span>
        </div>
        <button type="button" class="btn--icon btn--ghost btn--sm" aria-label="Fechar notificação" (click)="service.dismiss(toast.id)">
          <app-icon name="x" />
        </button>
      </div>
    }
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHostComponent {
  protected readonly service = inject(ToastService);
  protected readonly icons = TOAST_ICONS;
}
