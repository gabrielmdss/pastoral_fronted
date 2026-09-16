import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, PercentPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import * as U from '../../../application/planejamento/planejamento.use-cases';
import { ListarCompetenciasUseCase } from '../../../application/competencias/competencias.use-cases';
import {
  ListarModelosUseCase,
  ObterModeloUseCase,
} from '../../../application/cestas/modelos.use-cases';
import { ListarInsumosUseCase } from '../../../application/estoque/estoque.use-cases';
import type { Competencia } from '../../../domain/competencias/competencia.model';
import type { ModeloCesta, VersaoModelo } from '../../../domain/cestas/modelo-cesta.model';
import type { InsumoSaldo } from '../../../domain/estoque/estoque.model';
import type {
  PlanejamentoDetalhe,
  PlanejamentoInput,
  SimulacaoPlanejamento,
} from '../../../domain/planejamento/planejamento.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';

@Component({
  selector: 'app-planejamento-detail',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    PercentPipe,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './planejamento-detail.page.html',
  styleUrl: './planejamento-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PlanejamentoDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly obter = inject(U.ObterPlanejamentoUseCase);
  private readonly simularUC = inject(U.SimularPlanejamentoUseCase);
  private readonly criar = inject(U.CriarPlanejamentoUseCase);
  private readonly revisar = inject(U.RevisarPlanejamentoUseCase);
  private readonly aprovarUC = inject(U.AprovarPlanejamentoUseCase);
  private readonly competenciasUC = inject(ListarCompetenciasUseCase);
  private readonly modelosUC = inject(ListarModelosUseCase);
  private readonly modeloUC = inject(ObterModeloUseCase);
  private readonly insumosUC = inject(ListarInsumosUseCase);
  readonly session = inject(SessionFacade);
  readonly id = signal<string | null>(null);
  readonly detalhe = signal<PlanejamentoDetalhe | null>(null);
  readonly competencias = signal<Competencia[]>([]);
  readonly modelos = signal<ModeloCesta[]>([]);
  readonly versoesModelo = signal<VersaoModelo[]>([]);
  readonly insumos = signal<InsumoSaldo[]>([]);
  readonly loading = signal(false);
  readonly catalogLoading = signal(false);
  readonly modelLoading = signal(false);
  readonly saving = signal(false);
  readonly simulating = signal(false);
  readonly editing = signal(false);
  readonly error = signal('');
  readonly catalogError = signal('');
  readonly modelError = signal('');
  readonly mutationError = signal('');
  readonly feedback = signal('');
  readonly simulacao = signal<SimulacaoPlanejamento | null>(null);
  readonly simulatedInput = signal<PlanejamentoInput | null>(null);
  readonly podeAprovar = this.session.hasPermission('CESTA_PLANEJAMENTO_APROVAR');
  readonly podeModelos = this.session.hasPermission('CESTA_MODELO_GERENCIAR');
  readonly podeCompetencias = this.session.hasPermission('BENEFICIARIO_VISUALIZAR');
  readonly podeConsultar = this.session.hasPermission('ESTOQUE_VISUALIZAR');
  readonly temPendente = computed(
    () => this.detalhe()?.versoes.some((v) => v.status === 'SIMULACAO') ?? false,
  );
  readonly insumoPorId = computed(() => new Map(this.insumos().map((i) => [i.apresentacaoId, i])));
  readonly coberturaPercentual = computed(() =>
    Math.max(0, Math.min(100, Math.round((this.simulacao()?.cobertura ?? 0) * 100))),
  );
  readonly dialValue = signal(0);
  readonly form = this.fb.group({
    competenciaId: ['', Validators.required],
    modeloId: ['', Validators.required],
    modeloCestaVersaoId: ['', Validators.required],
    quantidade: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    motivo: '',
  });
  private loadVersion = 0;
  private modelVersion = 0;
  private simulationVersion = 0;
  private catalogVersion = 0;
  constructor() {
    effect(() => {
      const alvo = this.simulacao() ? this.coberturaPercentual() : 0;
      this.dialValue.set(0);
      if (alvo > 0) {
        setTimeout(() => {
          if (!this.destroy.destroyed) this.dialValue.set(alvo);
        }, 30);
      }
    });
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => this.invalidateSimulation());
    this.form.controls.modeloId.valueChanges
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        void this.carregarModelo();
      });
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.modelVersion++;
      this.catalogVersion++;
      this.modelLoading.set(false);
      this.catalogLoading.set(false);
      this.catalogError.set('');
      this.modelError.set('');
      this.id.set(params.get('id'));
      this.detalhe.set(null);
      this.editing.set(!this.id());
      this.feedback.set(
        this.id() && this.router.getCurrentNavigation()?.extras.state?.['criado'] === true
          ? 'Planejamento criado. A aprovação ainda precisa ser confirmada.'
          : '',
      );
      this.mutationError.set('');
      this.invalidateSimulation();
      this.form.reset({}, { emitEvent: false });
      this.versoesModelo.set([]);
      void this.carregar();
    });
  }
  balancoPercentual(necessario: number, disponivel: number | null | undefined): number {
    if (necessario <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round(((disponivel ?? 0) / necessario) * 100)));
  }
  balancoSuficiente(necessario: number, disponivel: number | null | undefined): boolean {
    return (disponivel ?? 0) >= necessario;
  }
  invalidateSimulation() {
    this.simulationVersion++;
    this.simulacao.set(null);
    this.simulatedInput.set(null);
  }
  private operationError(e: unknown): string {
    const message = userErrorMessage(e);
    return e instanceof HttpErrorResponse && e.status === 409
      ? message +
          ' A disponibilidade pode ter sido alterada por outra operação. Os dados serão reconsultados.'
      : message;
  }
  async carregar() {
    const version = ++this.loadVersion;
    const id = this.id();
    this.loading.set(true);
    this.error.set('');
    try {
      if (id) {
        const result = await firstValueFrom(
          forkJoin({ detalhe: this.obter.execute(id), insumos: this.insumosUC.execute() }).pipe(
            takeUntilDestroyed(this.destroy),
          ),
        );
        if (version !== this.loadVersion) return;
        this.detalhe.set(result.detalhe);
        this.insumos.set(result.insumos);
        if (!result.detalhe) this.error.set('Planejamento não encontrado.');
      } else await this.carregarCatalogos();
    } catch (e) {
      if (!this.destroy.destroyed && version === this.loadVersion)
        this.error.set(userErrorMessage(e, 'Não foi possível consultar o planejamento.'));
    } finally {
      if (version === this.loadVersion) this.loading.set(false);
    }
  }
  async carregarCatalogos() {
    if (this.catalogLoading() || !this.podeModelos || (!this.id() && !this.podeCompetencias))
      return;
    this.catalogLoading.set(true);
    this.catalogError.set('');
    const version = ++this.catalogVersion;
    try {
      const result = await firstValueFrom(
        forkJoin({
          modelos: this.id() ? of([] as ModeloCesta[]) : this.modelosUC.execute(),
          competencias: this.id() ? of([] as Competencia[]) : this.competenciasUC.execute(),
        }).pipe(takeUntilDestroyed(this.destroy)),
      );
      if (version !== this.catalogVersion) return;
      this.modelos.set(result.modelos);
      this.competencias.set(result.competencias);
      const detalhe = this.detalhe();
      if (detalhe) {
        this.form.patchValue(
          { competenciaId: detalhe.competenciaId, modeloId: detalhe.modeloCestaId },
          { emitEvent: false },
        );
        await this.carregarModelo();
      }
    } catch (e) {
      if (!this.destroy.destroyed)
        this.catalogError.set(
          userErrorMessage(e, 'Não foi possível consultar competências e modelos.'),
        );
    } finally {
      if (version === this.catalogVersion) this.catalogLoading.set(false);
    }
  }
  async carregarModelo() {
    const version = ++this.modelVersion,
      id = this.form.controls.modeloId.value;
    this.versoesModelo.set([]);
    this.modelError.set('');
    this.form.controls.modeloCestaVersaoId.setValue('');
    this.modelLoading.set(false);
    if (!id || !this.podeModelos) return;
    this.modelLoading.set(true);
    try {
      const result = await firstValueFrom(
        this.modeloUC.execute(id).pipe(takeUntilDestroyed(this.destroy)),
      );
      if (version !== this.modelVersion) return;
      this.versoesModelo.set(result?.versoes ?? []);
      if (!result) this.modelError.set('Modelo não encontrado. Atualize a consulta.');
    } catch (e) {
      if (!this.destroy.destroyed && version === this.modelVersion)
        this.modelError.set(
          userErrorMessage(e, 'Não foi possível consultar as versões do modelo.'),
        );
    } finally {
      if (version === this.modelVersion) this.modelLoading.set(false);
    }
  }
  async abrirRevisao() {
    if (!this.podeAprovar || this.saving() || !this.detalhe()) return;
    this.editing.set(true);
    this.invalidateSimulation();
    this.mutationError.set('');
    this.form.reset({}, { emitEvent: false });
    await this.carregarCatalogos();
  }
  input(): PlanejamentoInput {
    const v = this.form.getRawValue();
    return {
      competenciaId: v.competenciaId,
      modeloCestaVersaoId: v.modeloCestaVersaoId,
      quantidade: v.quantidade,
    };
  }
  async simular() {
    if (
      !this.podeConsultar ||
      this.form.invalid ||
      this.saving() ||
      this.simulating() ||
      this.loading() ||
      this.catalogLoading() ||
      this.modelLoading() ||
      this.catalogError() ||
      this.modelError()
    )
      return;
    const input = this.input();
    this.invalidateSimulation();
    const version = this.simulationVersion;
    this.simulating.set(true);
    this.mutationError.set('');
    try {
      const result = await firstValueFrom(
        this.simularUC.execute(input).pipe(takeUntilDestroyed(this.destroy)),
      );
      if (version !== this.simulationVersion) return;
      this.simulacao.set(result);
      this.simulatedInput.set(input);
    } catch (e) {
      if (!this.destroy.destroyed && version === this.simulationVersion)
        this.mutationError.set(userErrorMessage(e, 'Não foi possível simular a produção.'));
    } finally {
      this.simulating.set(false);
    }
  }
  async salvar() {
    const input = this.simulatedInput(),
      id = this.id();
    if (
      !this.podeAprovar ||
      this.saving() ||
      this.simulating() ||
      this.loading() ||
      this.form.invalid ||
      !input ||
      !this.simulacao()
    )
      return;
    // Only use the inputs whose simulation is still displayed.
    if (JSON.stringify(input) !== JSON.stringify(this.input())) {
      this.invalidateSimulation();
      return;
    }
    const motivo = this.form.controls.motivo.value.trim();
    if (id && !motivo) {
      this.mutationError.set('Informe o motivo da revisão.');
      return;
    }
    this.saving.set(true);
    this.mutationError.set('');
    this.feedback.set('');
    try {
      if (id) {
        await firstValueFrom(
          this.revisar
            .execute(id, {
              quantidade: input.quantidade,
              modeloCestaVersaoId: input.modeloCestaVersaoId,
              motivo,
            })
            .pipe(takeUntilDestroyed(this.destroy)),
        );
        this.feedback.set('Revisão registrada. A aprovação ainda precisa ser confirmada.');
        this.editing.set(false);
        this.invalidateSimulation();
        await this.carregar();
      } else {
        const result = await firstValueFrom(
          this.criar.execute(input).pipe(takeUntilDestroyed(this.destroy)),
        );
        this.invalidateSimulation();
        if (!this.destroy.destroyed)
          await this.router.navigate(['/planejamentos', result.id], { state: { criado: true } });
      }
    } catch (e) {
      if (!this.destroy.destroyed) {
        this.mutationError.set(this.operationError(e));
        this.invalidateSimulation();
        await this.carregar();
      }
    } finally {
      this.saving.set(false);
    }
  }
  async aprovar() {
    const id = this.id();
    if (
      !id ||
      !this.podeAprovar ||
      !this.temPendente() ||
      this.error() ||
      this.loading() ||
      this.saving() ||
      this.simulating()
    )
      return;
    if (
      !window.confirm(
        'Aprovar a versão pendente mais recente e reservar os insumos? A disponibilidade será verificada novamente pelo estoque.',
      )
    )
      return;
    this.saving.set(true);
    this.feedback.set('');
    this.mutationError.set('');
    try {
      await firstValueFrom(this.aprovarUC.execute(id).pipe(takeUntilDestroyed(this.destroy)));
      this.invalidateSimulation();
      this.editing.set(false);
      await this.carregar();
      this.feedback.set(
        'Aprovação confirmada. Consulte abaixo o estado e as reservas retornados pelo estoque.',
      );
    } catch (e) {
      if (!this.destroy.destroyed) {
        this.mutationError.set(this.operationError(e));
        this.invalidateSimulation();
        await this.carregar();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
