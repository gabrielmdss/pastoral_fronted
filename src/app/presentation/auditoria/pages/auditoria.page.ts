import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe, JsonPipe } from '@angular/common';
import { SectionCardComponent } from '../../../shared/ui/section-card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { firstValueFrom } from 'rxjs';
import {
  ListarAuditoriaUseCase,
  ObterAuditoriaUseCase,
} from '../../../application/auditoria/auditoria.use-cases';
import type {
  AuditoriaFiltro,
  RegistroAuditoria,
  RegistroAuditoriaDetalhe,
} from '../../../domain/auditoria/auditoria.model';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { PaginationComponent } from '../../../shared/ui/pagination.component';

const LIMIT = 20;
const numeric = Validators.pattern(/^\d+$/);

@Component({
  selector: 'app-auditoria-page',
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    DataBrPipe,
    SectionCardComponent,
    IconComponent,
    JsonPipe,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  templateUrl: './auditoria.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuditoriaPage {
  private readonly listarUC = inject(ListarAuditoriaUseCase);
  private readonly obterUC = inject(ObterAuditoriaUseCase);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly form = this.fb.group({
    usuarioId: ['', numeric],
    entidade: ['', Validators.maxLength(100)],
    entidadeId: ['', numeric],
    operacao: ['', Validators.maxLength(100)],
    dataInicio: '',
    dataFim: '',
  });
  readonly registros = signal<RegistroAuditoria[]>([]);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly filtroError = signal('');
  readonly detalhe = signal<RegistroAuditoriaDetalhe | null>(null);
  readonly detalheId = signal<string | null>(null);
  readonly detalheLoading = signal(false);
  readonly detalheError = signal('');
  private aplicado: Omit<AuditoriaFiltro, 'page' | 'limit'> = {};
  private requestSeq = 0;

  constructor() {
    void this.carregar();
  }

  filtrar() {
    this.filtroError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.filtroError.set('IDs de usuário e de entidade devem conter apenas números.');
      return;
    }
    const v = this.form.getRawValue();
    if (v.dataInicio && v.dataFim && v.dataInicio > v.dataFim) {
      this.filtroError.set('A data inicial deve ser anterior ou igual à data final.');
      return;
    }
    this.aplicado = {
      usuarioId: v.usuarioId.trim() || undefined,
      entidade: v.entidade.trim() || undefined,
      entidadeId: v.entidadeId.trim() || undefined,
      operacao: v.operacao.trim() || undefined,
      dataInicio: v.dataInicio || undefined,
      dataFim: v.dataFim || undefined,
    };
    this.page.set(1);
    this.fecharDetalhe();
    void this.carregar();
  }

  limpar() {
    this.form.reset();
    this.filtroError.set('');
    this.aplicado = {};
    this.page.set(1);
    this.fecharDetalhe();
    void this.carregar();
  }

  irPara(page: number) {
    if (page < 1 || this.loading()) return;
    this.page.set(page);
    this.fecharDetalhe();
    void this.carregar();
  }

  async carregar() {
    const seq = ++this.requestSeq;
    this.loading.set(true);
    this.error.set('');
    try {
      const r = await firstValueFrom(
        this.listarUC.execute({ ...this.aplicado, page: this.page(), limit: LIMIT }),
      );
      if (seq !== this.requestSeq) return;
      this.registros.set(r.data);
      this.total.set(r.meta.total);
      this.totalPages.set(r.meta.totalPages);
    } catch (e) {
      if (seq !== this.requestSeq) return;
      this.error.set(userErrorMessage(e, 'Não foi possível consultar a auditoria.'));
    } finally {
      if (seq === this.requestSeq) this.loading.set(false);
    }
  }

  async abrirDetalhe(id: string, force = false) {
    if (!force && this.detalheId() === id) {
      this.fecharDetalhe();
      return;
    }
    this.detalheId.set(id);
    this.detalhe.set(null);
    this.detalheError.set('');
    this.detalheLoading.set(true);
    try {
      const d = await firstValueFrom(this.obterUC.execute(id));
      if (this.detalheId() === id) this.detalhe.set(d);
    } catch (e) {
      if (this.detalheId() === id)
        this.detalheError.set(userErrorMessage(e, 'Não foi possível consultar o registro.'));
    } finally {
      if (this.detalheId() === id) this.detalheLoading.set(false);
    }
  }

  fecharDetalhe() {
    this.detalheId.set(null);
    this.detalhe.set(null);
    this.detalheError.set('');
    this.detalheLoading.set(false);
  }
}
