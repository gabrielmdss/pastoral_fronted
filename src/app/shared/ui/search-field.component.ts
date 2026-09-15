import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

@Component({
  selector: 'app-search-field',
  imports: [ReactiveFormsModule],
  template: `
    <label class="search-field">
      <span [class.sr-only]="!showLabel()">{{ label() }}</span>
      <input type="search" [formControl]="control" [placeholder]="placeholder()" />
    </label>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .search-field {
        display: grid;
        gap: var(--space-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFieldComponent {
  readonly label = input('Buscar');
  readonly showLabel = input(true);
  readonly placeholder = input('');
  readonly debounceMs = input(300);
  readonly termChange = output<string>();
  readonly control = new FormControl('', { nonNullable: true });
  private readonly destroy = inject(DestroyRef);

  constructor() {
    this.control.valueChanges
      .pipe(
        map((v) => v.trim()),
        debounceTime(this.debounceMs()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((term) => this.termChange.emit(term));
  }
}
