import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-password-field',
  template: `
    <div class="password-field">
      <input
        [id]="id()"
        [type]="visible() ? 'text' : 'password'"
        [attr.autocomplete]="autocomplete()"
        [attr.aria-invalid]="ariaInvalid()"
        [value]="value"
        [disabled]="disabled"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <button
        type="button"
        class="password-field__toggle"
        (click)="visible.set(!visible())"
        [attr.aria-label]="visible() ? 'Ocultar senha' : 'Mostrar senha'"
        [attr.aria-pressed]="visible()"
      >
        {{ visible() ? '🙈' : '👁' }}
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .password-field {
        position: relative;
        display: flex;
      }
      .password-field input {
        width: 100%;
        padding-right: 2.75rem;
      }
      .password-field__toggle {
        position: absolute;
        top: 0;
        right: 0;
        width: 2.75rem;
        height: 100%;
        min-height: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--color-text-muted);
        font-size: 1rem;
        cursor: pointer;
      }
      .password-field__toggle:hover {
        color: var(--color-primary-dark);
        background: transparent;
        box-shadow: none;
      }
      .password-field__toggle:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: PasswordFieldComponent,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFieldComponent implements ControlValueAccessor {
  readonly id = input.required<string>();
  readonly autocomplete = input('current-password');
  readonly ariaInvalid = input(false);
  readonly visible = signal(false);
  value = '';
  disabled = false;
  private onChangeFn: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChangeFn(this.value);
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
