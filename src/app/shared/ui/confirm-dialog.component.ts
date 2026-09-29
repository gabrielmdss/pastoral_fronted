import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

export interface CampoDialogo {
  id: string;
  label: string;
  tipo?: 'texto' | 'textarea' | 'select';
  obrigatorio?: boolean;
  placeholder?: string;
  valorInicial?: string;
  opcoes?: readonly { valor: string; label: string }[];
}

export interface ConfirmacaoOpcoes {
  title: string;
  campos?: readonly CampoDialogo[];
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

/**
 * Estado de uma confirmação assíncrona (substitui `window.confirm`). Uso na página:
 *   readonly confirmacao = new Confirmacao();
 *   if (!(await this.confirmacao.pedir({ title: 'Concluir?', message: '…' }))) return;
 * e no template (fora de blocos condicionais):
 *   @if (confirmacao.atual(); as c) {
 *     <app-confirm-dialog [title]="c.title" [message]="c.message ?? ''" [confirmLabel]="c.confirmLabel ?? 'Confirmar'"
 *       [danger]="!!c.danger" (confirm)="confirmacao.responder(true)" (dismiss)="confirmacao.responder(false)" />
 *   }
 * Enquanto uma confirmação está aberta, novos pedidos resolvem `false` (proteção contra duplo clique).
 *
 * Para coletar dados (substitui `window.prompt`), use `pedirDados` com `campos` e ligue no template
 *   [campos]="c.campos ?? []" [valores]="confirmacao.valores()" (campoAlterado)="confirmacao.alterarCampo($event)"
 * O retorno é `null` quando cancelado ou um mapa `id -> valor` (sem espaços nas pontas).
 */
export class Confirmacao {
  readonly atual = signal<ConfirmacaoOpcoes | null>(null);
  readonly valores = signal<Record<string, string>>({});
  private resolver: ((aceito: boolean) => void) | null = null;

  async pedirDados(opcoes: ConfirmacaoOpcoes): Promise<Record<string, string> | null> {
    if (this.resolver) return null;
    this.valores.set(
      Object.fromEntries((opcoes.campos ?? []).map((campo) => [campo.id, campo.valorInicial ?? ''])),
    );
    const aceito = await this.pedir(opcoes);
    if (!aceito) return null;
    return Object.fromEntries(
      Object.entries(this.valores()).map(([id, valor]) => [id, valor.trim()]),
    );
  }

  alterarCampo(evento: { id: string; valor: string }): void {
    this.valores.update((atuais) => ({ ...atuais, [evento.id]: evento.valor }));
  }

  pedir(opcoes: ConfirmacaoOpcoes): Promise<boolean> {
    if (this.resolver) return Promise.resolve(false);
    this.atual.set(opcoes);
    return new Promise<boolean>((resolve) => (this.resolver = resolve));
  }

  responder(aceito: boolean): void {
    const resolver = this.resolver;
    this.resolver = null;
    this.atual.set(null);
    resolver?.(aceito);
  }
}

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
        @for (campo of campos(); track campo.id) {
          <div class="ui-field">
            <label class="ui-field__label" [for]="prefixoCampo + campo.id">
              {{ campo.label }}@if (!campo.obrigatorio) { <span class="text-muted"> (opcional)</span> }
            </label>
            @switch (campo.tipo ?? 'texto') {
              @case ('textarea') {
                <textarea
                  rows="3"
                  [id]="prefixoCampo + campo.id"
                  [attr.data-campo]="campo.id"
                  [placeholder]="campo.placeholder ?? ''"
                  [value]="valores()[campo.id]"
                  (input)="alterar(campo.id, $event)"
                ></textarea>
              }
              @case ('select') {
                <select
                  [id]="prefixoCampo + campo.id"
                  [attr.data-campo]="campo.id"
                  [value]="valores()[campo.id]"
                  (change)="alterar(campo.id, $event)"
                >
                  @for (opcao of campo.opcoes ?? []; track opcao.valor) {
                    <option [value]="opcao.valor" [selected]="opcao.valor === valores()[campo.id]">
                      {{ opcao.label }}
                    </option>
                  }
                </select>
              }
              @default {
                <input
                  type="text"
                  [id]="prefixoCampo + campo.id"
                  [attr.data-campo]="campo.id"
                  [placeholder]="campo.placeholder ?? ''"
                  [value]="valores()[campo.id]"
                  (input)="alterar(campo.id, $event)"
                  (keydown.enter)="confirmarSeValido($event)"
                />
              }
            }
          </div>
        }
        <ng-content />
        <div class="dialog-actions">
          <button type="button" class="secondary" (click)="dismiss.emit()" #cancelButton>
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            [class.danger]="danger()"
            [disabled]="disabled() || faltaObrigatorio()"
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
        background: var(--color-overlay);
      }
      .confirm-dialog {
        width: min(100%, 30rem);
        padding: var(--space-5);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
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
        white-space: pre-line;
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
  readonly campos = input<readonly CampoDialogo[]>([]);
  readonly valores = input<Record<string, string>>({});
  readonly confirm = output<void>();
  readonly dismiss = output<void>();
  readonly campoAlterado = output<{ id: string; valor: string }>();

  protected readonly faltaObrigatorio = computed(() =>
    this.campos().some((campo) => campo.obrigatorio && !(this.valores()[campo.id] ?? '').trim()),
  );

  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');
  protected readonly titleId = `confirm-dialog-title-${crypto.randomUUID()}`;
  protected readonly descriptionId = `confirm-dialog-desc-${crypto.randomUUID()}`;
  protected readonly prefixoCampo = `confirm-dialog-campo-${crypto.randomUUID()}-`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      const primeiroCampo = this.host.nativeElement.querySelector<HTMLElement>('[data-campo]');
      (primeiroCampo ?? this.cancelButton()?.nativeElement)?.focus();
    });
  }

  protected alterar(id: string, evento: Event): void {
    const alvo = evento.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    this.campoAlterado.emit({ id, valor: alvo.value });
  }

  protected confirmarSeValido(evento: Event): void {
    evento.preventDefault();
    if (!this.disabled() && !this.faltaObrigatorio()) this.confirm.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dismiss.emit();
  }
}
