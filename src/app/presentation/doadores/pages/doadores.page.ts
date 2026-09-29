import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, Observable } from 'rxjs';
import {
  AtualizarDoadorUseCase,
  CriarDoadorUseCase,
  ListarDoadoresUseCase,
} from '../../../application/estoque/estoque.use-cases';
import type { Doador, DoadorInput } from '../../../domain/estoque/estoque.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { PermissionOnlyDirective } from '../../../shared/ui/permission-only.directive';
import { SectionCardComponent } from '../../../shared/ui/section-card.component';
import { MetricCardComponent } from '../../../shared/ui/metric-card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ToastService } from '../../../shared/ui/toast.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-doadores-page',
  host: { class: 'ui-page' },
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    PermissionOnlyDirective,
    SectionCardComponent,
    MetricCardComponent,
    IconComponent,
    DecimalPipe,
  ],
  templateUrl: './doadores.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DoadoresPage {
  private readonly session = inject(SessionFacade);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly listarUC = inject(ListarDoadoresUseCase);
  private readonly criarUC = inject(CriarDoadorUseCase);
  private readonly atualizarUC = inject(AtualizarDoadorUseCase);
  readonly doadores = signal<Doador[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly mutationError = signal('');
  readonly feedback = signal('');
  readonly busca = signal('');
  readonly filtroTipo = signal<'' | DoadorInput['tipo']>('');
  readonly filtroStatus = signal<'' | 'ATIVO' | 'INATIVO'>('');
  readonly formAberto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly ativos = computed(() => this.doadores().filter((d) => d.ativo).length);
  readonly instituicoes = computed(
    () => this.doadores().filter((d) => d.tipo === 'INSTITUICAO').length,
  );
  readonly filtrados = computed(() => {
    const term = this.busca().trim().toLocaleLowerCase('pt-BR');
    const tipo = this.filtroTipo();
    const status = this.filtroStatus();
    return this.doadores().filter(
      (d) =>
        (!tipo || d.tipo === tipo) &&
        (!status || (status === 'ATIVO') === d.ativo) &&
        (d.nome + ' ' + (d.telefone ?? '')).toLocaleLowerCase('pt-BR').includes(term),
    );
  });
  readonly form = this.fb.group({
    tipo: this.fb.control<DoadorInput['tipo']>('PESSOA'),
    nome: ['', Validators.required],
    telefone: '',
    observacao: '',
    ativo: true,
  });

  constructor() {
    void this.carregar();
  }

  async carregar() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      this.doadores.set(await firstValueFrom(this.listarUC.execute()));
    } catch (e) {
      this.error.set(userErrorMessage(e, 'Não foi possível consultar os doadores.'));
    } finally {
      this.loading.set(false);
    }
  }

  abrir(doador?: Doador) {
    if (this.saving() || !this.session.hasPermission('ESTOQUE_ENTRADA')) return;
    this.mutationError.set('');
    this.feedback.set('');
    this.editandoId.set(doador?.id ?? null);
    this.form.reset({
      tipo: doador?.tipo ?? 'PESSOA',
      nome: doador?.nome ?? '',
      telefone: doador?.telefone ?? '',
      observacao: doador?.observacao ?? '',
      ativo: doador?.ativo ?? true,
    });
    this.formAberto.set(true);
  }

  cancelar() {
    if (this.saving()) return;
    this.formAberto.set(false);
    this.editandoId.set(null);
    this.mutationError.set('');
  }

  async salvar() {
    if (this.saving() || !this.session.hasPermission('ESTOQUE_ENTRADA') || this.form.invalid)
      return;
    const v = this.form.getRawValue();
    if (!v.nome.trim()) return;
    const input: DoadorInput = {
      tipo: v.tipo,
      nome: v.nome.trim(),
      telefone: v.telefone.trim() || null,
      observacao: v.observacao.trim() || null,
    };
    const id = this.editandoId();
    const request: Observable<unknown> = id
      ? this.atualizarUC.execute(id, { ...input, ativo: v.ativo })
      : this.criarUC.execute(input);
    this.saving.set(true);
    this.mutationError.set('');
    this.feedback.set('');
    try {
      await firstValueFrom(request);
      this.formAberto.set(false);
      this.editandoId.set(null);
      this.feedback.set(id ? 'Doador atualizado com sucesso.' : 'Doador cadastrado com sucesso.');
      this.toast.success(this.feedback());
      await this.carregar();
    } catch (e) {
      this.mutationError.set(userErrorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}
