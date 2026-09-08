import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  AlterarGrupoBeneficiarioUseCase,
  DesligarBeneficiarioUseCase,
  ObterBeneficiarioUseCase,
  ReativarBeneficiarioUseCase,
} from '../../../application/beneficiarios/beneficiarios.use-cases';
import type { BeneficiarioDetalhe } from '../../../domain/beneficiarios/beneficiario.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import {
  ListarGruposUseCase,
  ListarMotivosUseCase,
} from '../../../application/beneficiarios/catalogos.use-cases';
import type {
  GrupoDistribuicao,
  MotivoDesligamento,
} from '../../../application/beneficiarios/catalogos.models';
@Component({
  selector: 'app-beneficiario-detail-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ErrorStateComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './beneficiario-detail.page.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BeneficiarioDetailPage implements OnInit {
  readonly item = signal<BeneficiarioDetalhe | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly mode = signal<'grupo' | 'desligar' | 'reativar' | null>(null);
  readonly mutation = signal(false);
  readonly feedback = signal('');
  readonly grupos = signal<GrupoDistribuicao[]>([]);
  readonly motivos = signal<MotivoDesligamento[]>([]);
  readonly grupo = new FormGroup({
    grupoDestinoId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    vigenciaCompetenciaAtual: new FormControl(false, { nonNullable: true }),
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
  });
  readonly desligarForm = new FormGroup({
    motivoId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    observacao: new FormControl<string | null>(null),
  });
  private readonly id: string;
  constructor(
    route: ActivatedRoute,
    private readonly obter: ObterBeneficiarioUseCase,
    private readonly alterar: AlterarGrupoBeneficiarioUseCase,
    private readonly desligar: DesligarBeneficiarioUseCase,
    private readonly reativar: ReativarBeneficiarioUseCase,
    grupos: ListarGruposUseCase,
    motivos: ListarMotivosUseCase,
    readonly session: SessionFacade,
  ) {
    this.id = route.snapshot.paramMap.get('id') ?? '';
    grupos.execute().subscribe((x) => this.grupos.set(x));
    motivos.execute().subscribe((x) => this.motivos.set(x));
  }
  ngOnInit() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      this.item.set(await firstValueFrom(this.obter.execute(this.id)));
    } catch (e) {
      this.error.set(userErrorMessage(e, 'Não foi possível carregar o beneficiário.'));
    } finally {
      this.loading.set(false);
    }
  }
  async submit(): Promise<void> {
    const mode = this.mode();
    if (!mode || this.mutation()) return;
    if (
      (mode === 'grupo' && this.grupo.invalid) ||
      (mode === 'desligar' && this.desligarForm.invalid)
    )
      return;
    this.mutation.set(true);
    this.feedback.set('');
    try {
      if (mode === 'grupo')
        await firstValueFrom(this.alterar.execute(this.id, this.grupo.getRawValue()));
      if (mode === 'desligar')
        await firstValueFrom(this.desligar.execute(this.id, this.desligarForm.getRawValue()));
      if (mode === 'reativar') await firstValueFrom(this.reativar.execute(this.id));
      this.feedback.set('Alteração concluída com sucesso.');
      this.mode.set(null);
      await this.load();
    } catch (e) {
      this.feedback.set(userErrorMessage(e));
    } finally {
      this.mutation.set(false);
    }
  }
}
