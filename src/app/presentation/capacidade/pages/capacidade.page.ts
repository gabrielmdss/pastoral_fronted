import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AlterarCapacidadeUseCase,
  ObterCapacidadeUseCase,
} from '../../../application/capacidade/capacidade.use-cases';
import type { Capacidade } from '../../../application/capacidade/capacidade.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
@Component({
  selector: 'app-capacidade-page',
  imports: [ReactiveFormsModule, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './capacidade.page.html',
  styleUrl: './capacidade.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CapacidadePage implements OnInit {
  readonly data = signal<Capacidade | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly dialog = signal(false);
  readonly mutation = signal(false);
  readonly feedback = signal('');
  readonly form = new FormGroup({
    capacidade: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    justificativa: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
  });
  constructor(
    private readonly obter: ObterCapacidadeUseCase,
    private readonly alterar: AlterarCapacidadeUseCase,
    readonly session: SessionFacade,
  ) {}
  ngOnInit() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      this.data.set(await firstValueFrom(this.obter.execute()));
    } catch (e) {
      this.error.set(userErrorMessage(e, 'Não foi possível carregar a capacidade.'));
    } finally {
      this.loading.set(false);
    }
  }
  ocupacaoPercentual(): number {
    const cap = this.data();
    if (!cap || cap.capacidade <= 0) return 0;
    return Math.min(100, Math.round((cap.ativos / cap.capacidade) * 100));
  }
  open() {
    this.form.controls.capacidade.setValue(this.data()?.capacidade ?? null);
    this.dialog.set(true);
  }
  async submit() {
    if (this.form.invalid || this.mutation()) return;
    const value = this.form.getRawValue();
    if (value.capacidade === null) return;
    this.mutation.set(true);
    try {
      this.data.set(
        await firstValueFrom(
          this.alterar.execute({
            capacidade: value.capacidade,
            justificativa: value.justificativa,
          }),
        ),
      );
      this.feedback.set('Capacidade alterada com sucesso.');
      this.dialog.set(false);
    } catch (e) {
      this.feedback.set(userErrorMessage(e));
    } finally {
      this.mutation.set(false);
    }
  }
}
