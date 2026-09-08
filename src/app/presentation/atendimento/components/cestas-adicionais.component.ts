import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import {
  ListarCestasAdicionaisUseCase,
  AutorizarCestaAdicionalUseCase,
  EntregarCestaAdicionalUseCase,
} from '../../../application/atendimento/use-cases/cestas-adicionais.use-cases';
import { ObterDistribuicaoUseCase } from '../../../application/distribuicoes/obter-distribuicao.use-case';
import { BuscarBeneficiariosUseCase } from '../../../application/beneficiarios/beneficiarios.use-cases';
import { ListarModelosUseCase } from '../../../application/cestas/modelos.use-cases';
import type { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import type { BeneficiarioResumo } from '../../../domain/beneficiarios/beneficiario.model';
import type { ModeloCesta } from '../../../domain/cestas/modelo-cesta.model';
import type { CestaAdicional } from '../../../domain/atendimento/cesta-adicional.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';

@Component({
  selector: 'app-cestas-adicionais',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './cestas-adicionais.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CestasAdicionaisComponent {
  readonly distribuicao = input.required<Distribuicao>();
  readonly distribuicaoAtualizada = output<Distribuicao>();
  private readonly destroy = inject(DestroyRef);
  private readonly listar = inject(ListarCestasAdicionaisUseCase);
  private readonly autorizarUC = inject(AutorizarCestaAdicionalUseCase);
  private readonly entregarUC = inject(EntregarCestaAdicionalUseCase);
  private readonly obter = inject(ObterDistribuicaoUseCase);
  private readonly buscarBeneficiarios = inject(BuscarBeneficiariosUseCase);
  private readonly listarModelos = inject(ListarModelosUseCase);
  private readonly session = inject(SessionFacade);
  readonly podeAutorizar = this.session.hasPermission('CESTA_ADICIONAL_AUTORIZAR');
  readonly podeEntregar = this.session.hasPermission('RETIRADA_REGISTRAR');
  readonly podeCatalogos =
    this.session.hasPermission('BENEFICIARIO_VISUALIZAR') &&
    this.session.hasPermission('CESTA_MODELO_GERENCIAR');
  readonly atual = signal<Distribuicao | null>(null);
  readonly items = signal<CestaAdicional[]>([]);
  readonly beneficiarios = signal<BeneficiarioResumo[]>([]);
  readonly modelos = signal<ModeloCesta[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly catalogLoading = signal(false);
  readonly error = signal('');
  readonly catalogError = signal('');
  readonly mutationError = signal('');
  readonly feedback = signal('');
  readonly formulario = signal(false);
  readonly ultimaAutorizacao = signal<CestaAdicional | null>(null);
  readonly form = inject(FormBuilder).nonNullable.group({
    beneficiarioId: ['', Validators.required],
    modeloCestaId: ['', Validators.required],
    quantidade: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    justificativa: ['', Validators.required],
  });
  private contextId = '';
  private epoch = 0;
  private catalogEpoch = 0;
  constructor() {
    effect(() => {
      const d = this.distribuicao();
      untracked(() => {
        this.atual.set(d);
        if (this.contextId !== d.id) {
          this.contextId = d.id;
          this.catalogEpoch++;
          this.catalogLoading.set(false);
          this.form.reset();
          this.formulario.set(false);
          this.items.set([]);
          this.ultimaAutorizacao.set(null);
          this.feedback.set('');
          this.mutationError.set('');
          void this.carregar();
        }
      });
    });
  }
  async carregar() {
    const id = this.contextId,
      epoch = ++this.epoch;
    if (!id || (!this.podeAutorizar && !this.podeEntregar)) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await firstValueFrom(
        forkJoin({
          distribuicao: this.obter.execute(id),
          items: this.podeEntregar ? this.listar.execute(id) : of([] as CestaAdicional[]),
        }).pipe(takeUntilDestroyed(this.destroy)),
      );
      if (epoch !== this.epoch) return;
      this.items.set(result.items);
      this.atual.set(result.distribuicao);
      this.distribuicaoAtualizada.emit(result.distribuicao);
    } catch (e) {
      if (!this.destroy.destroyed && epoch === this.epoch)
        this.error.set(userErrorMessage(e, 'Não foi possível consultar as cestas adicionais.'));
    } finally {
      if (epoch === this.epoch) this.loading.set(false);
    }
  }
  async abrirFormulario() {
    if (!this.podeAutorizar || this.saving() || this.atual()?.status === 'ENCERRADA') return;
    this.formulario.set(true);
    await this.carregarCatalogos();
  }
  async carregarCatalogos() {
    if (!this.podeAutorizar || !this.podeCatalogos || this.catalogLoading()) return;
    const epoch = ++this.catalogEpoch;
    this.catalogLoading.set(true);
    this.catalogError.set('');
    try {
      const result = await firstValueFrom(
        forkJoin({
          beneficiarios: this.buscarBeneficiarios.execute({}),
          modelos: this.listarModelos.execute(),
        }).pipe(takeUntilDestroyed(this.destroy)),
      );
      if (epoch !== this.catalogEpoch) return;
      this.beneficiarios.set(result.beneficiarios);
      this.modelos.set(result.modelos);
    } catch (e) {
      if (!this.destroy.destroyed && epoch === this.catalogEpoch)
        this.catalogError.set(
          userErrorMessage(e, 'Não foi possível consultar beneficiários e modelos.'),
        );
    } finally {
      if (epoch === this.catalogEpoch) this.catalogLoading.set(false);
    }
  }
  async autorizar() {
    const d = this.atual();
    if (
      !d ||
      !this.podeAutorizar ||
      !this.podeCatalogos ||
      d.status === 'ENCERRADA' ||
      this.saving() ||
      this.loading() ||
      this.error() ||
      this.catalogLoading() ||
      this.catalogError() ||
      this.form.invalid
    )
      return;
    const input = this.form.getRawValue();
    input.justificativa = input.justificativa.trim();
    if (!input.justificativa) {
      this.mutationError.set('Informe a justificativa da autorização.');
      return;
    }
    const b = this.beneficiarios().find((b) => b.id === input.beneficiarioId),
      m = this.modelos().find((m) => m.id === input.modeloCestaId);
    if (!b || !m) return;
    if (
      !window.confirm(
        `Autorizar ${input.quantidade} cesta(s) do modelo ${m.nome} para ${b.nomeCompleto}, na distribuição de ${d.grupo.nome}?\nJustificativa: ${input.justificativa}`,
      )
    )
      return;
    await this.mutar('autorizar', () => this.autorizarUC.execute(d.id, input));
  }
  async entregar(id: string) {
    const d = this.atual(),
      item = this.items().find((i) => i.id === id);
    if (
      !d ||
      !this.podeEntregar ||
      d.status !== 'ABERTA' ||
      !item ||
      item.status !== 'AUTORIZADA' ||
      this.saving() ||
      this.loading() ||
      this.error()
    )
      return;
    if (
      !window.confirm(
        `Entregar ${item.quantidade} cesta(s) do modelo ${item.modeloCesta.nome} para ${item.beneficiario.nomeCompleto}? O estoque validará o modelo e a disponibilidade.`,
      )
    )
      return;
    await this.mutar('entregar', () => this.entregarUC.execute(id));
  }
  private async mutar(
    tipo: 'autorizar' | 'entregar',
    operation: () => ReturnType<AutorizarCestaAdicionalUseCase['execute']>,
  ) {
    const id = this.contextId;
    this.saving.set(true);
    this.mutationError.set('');
    this.feedback.set('');
    try {
      const result = await firstValueFrom(operation().pipe(takeUntilDestroyed(this.destroy)));
      if (this.destroy.destroyed || id !== this.contextId) return;
      if (tipo === 'autorizar') {
        this.ultimaAutorizacao.set(result);
        this.form.reset();
        this.formulario.set(false);
      }
      this.feedback.set(
        tipo === 'autorizar'
          ? 'Cesta adicional autorizada. A entrega ainda precisa ser registrada.'
          : 'Entrega de cesta adicional confirmada.',
      );
      await this.carregar();
    } catch (e) {
      if (!this.destroy.destroyed && id === this.contextId) {
        this.mutationError.set(
          userErrorMessage(e) +
            (e instanceof HttpErrorResponse && e.status === 409
              ? ' O estado ou a disponibilidade pode ter mudado em outra operação. Os dados serão reconsultados.'
              : ''),
        );
        await this.carregar();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
