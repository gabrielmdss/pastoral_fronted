import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  firstValueFrom,
  map,
  of,
  switchMap,
} from 'rxjs';
import {
  BuscarPessoasUseCase,
  CriarPessoaUseCase,
} from '../../../application/pessoas/pessoas.use-cases';
import type { Pessoa } from '../../../domain/pessoas/pessoa.model';
import { userErrorMessage } from '../../../shared/errors/user-error';
@Component({
  selector: 'app-pessoa-search-field',
  imports: [ReactiveFormsModule],
  templateUrl: './pessoa-search-field.component.html',
  styleUrl: './pessoa-search-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PessoaSearchFieldComponent {
  readonly canCreate = input(false);
  readonly blockExistingBeneficiary = input(false);
  readonly pessoaSelecionada = output<Pessoa | null>();
  readonly search = new FormControl('', { nonNullable: true });
  readonly results = signal<Pessoa[]>([]);
  readonly selected = signal<Pessoa | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly createMode = signal(false);
  readonly saving = signal(false);
  readonly form = new FormGroup({
    nomeCompleto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    dataNascimento: new FormControl<string | null>(null),
    telefone: new FormControl<string | null>(null),
    tipo: new FormControl('CPF', { nonNullable: true, validators: [Validators.required] }),
    numero: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
  });
  private readonly destroy = inject(DestroyRef);
  constructor(
    private readonly buscar: BuscarPessoasUseCase,
    private readonly criar: CriarPessoaUseCase,
  ) {
    this.search.valueChanges
      .pipe(
        map((x) => x.trim()),
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.length < 2) {
            this.results.set([]);
            return of([]);
          }
          this.loading.set(true);
          this.error.set('');
          const filter = /^\d+$/.test(term.replace(/\D/g, '')) ? { documento: term } : { q: term };
          return this.buscar.execute(filter).pipe(
            catchError((e) => {
              this.error.set(userErrorMessage(e, 'Não foi possível buscar pessoas.'));
              return of([]);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((items) => this.results.set(items));
  }
  select(p: Pessoa) {
    if (this.blockExistingBeneficiary() && p.beneficiario) return;
    this.selected.set(p);
    this.results.set([]);
    this.pessoaSelecionada.emit(p);
  }
  clear() {
    this.selected.set(null);
    this.pessoaSelecionada.emit(null);
    this.search.setValue('');
  }
  async create() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    try {
      const pessoa = await firstValueFrom(
        this.criar.execute({
          nomeCompleto: v.nomeCompleto,
          dataNascimento: v.dataNascimento || null,
          telefone: v.telefone?.trim() || null,
          documentos: [{ tipo: v.tipo, numero: v.numero, principal: true }],
        }),
      );
      this.createMode.set(false);
      this.select(pessoa);
    } catch (e) {
      this.error.set(userErrorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}
