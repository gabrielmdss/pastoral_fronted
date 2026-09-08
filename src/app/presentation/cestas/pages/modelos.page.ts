import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import * as U from '../../../application/cestas/modelos.use-cases';
import { ListarInsumosUseCase } from '../../../application/estoque/estoque.use-cases';
import type {
  ModeloCesta,
  ModeloDetalhe,
  ModeloInput,
} from '../../../domain/cestas/modelo-cesta.model';
import type { InsumoSaldo } from '../../../domain/estoque/estoque.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
@Component({
  selector: 'app-modelos-page',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './modelos.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ModelosPage {
  readonly session = inject(SessionFacade);
  private fb = inject(FormBuilder).nonNullable;
  private listar = inject(U.ListarModelosUseCase);
  private obter = inject(U.ObterModeloUseCase);
  private criar = inject(U.CriarModeloUseCase);
  private versaoUC = inject(U.CriarVersaoModeloUseCase);
  private insumosUC = inject(ListarInsumosUseCase);
  readonly modelos = signal<ModeloCesta[]>([]);
  readonly detalhe = signal<ModeloDetalhe | null>(null);
  readonly insumos = signal<InsumoSaldo[]>([]);
  readonly selectedId = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly feedback = signal('');
  readonly mutationError = signal('');
  readonly positive = [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)];
  readonly novo = this.fb.group({
    nome: ['', Validators.required],
    tipo: this.fb.control<ModeloInput['tipo']>('REGULAR'),
  });
  readonly versao = this.fb.group({
    metaItens: [1, this.positive],
    itens: this.fb.array([this.item()]),
  });
  item() {
    return this.fb.group({
      apresentacaoInsumoId: ['', Validators.required],
      quantidade: [1, this.positive],
    });
  }
  constructor() {
    void this.carregar();
  }
  async carregar() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const r = await firstValueFrom(
        forkJoin({
          modelos: this.listar.execute(),
          insumos: this.session.hasPermission('ESTOQUE_VISUALIZAR')
            ? this.insumosUC.execute()
            : of([]),
        }),
      );
      this.modelos.set(r.modelos);
      this.insumos.set(r.insumos);
      if (this.selectedId())
        this.detalhe.set(await firstValueFrom(this.obter.execute(this.selectedId())));
    } catch (e) {
      this.error.set(userErrorMessage(e, 'Não foi possível consultar modelos.'));
    } finally {
      this.loading.set(false);
    }
  }
  async selecionar(id: string) {
    if (this.loading() || this.saving()) return;
    this.selectedId.set(id);
    this.detalhe.set(null);
    this.versao.controls.itens.clear();
    this.versao.controls.itens.push(this.item());
    this.versao.controls.metaItens.setValue(1);
    await this.carregar();
  }
  async salvar(kind: 'modelo' | 'versao') {
    if (
      this.loading() ||
      this.saving() ||
      this.error() ||
      !this.session.hasPermission('CESTA_MODELO_GERENCIAR')
    )
      return;
    if (kind === 'modelo' && (this.novo.invalid || !this.novo.controls.nome.value.trim())) return;
    if (
      kind === 'versao' &&
      (this.versao.invalid ||
        !this.detalhe() ||
        !this.session.hasPermission('ESTOQUE_VISUALIZAR') ||
        !this.versao.controls.itens.length)
    )
      return;
    this.saving.set(true);
    this.mutationError.set('');
    this.feedback.set('');
    try {
      if (kind === 'modelo') {
        const v = this.novo.getRawValue();
        const r = await firstValueFrom(this.criar.execute({ ...v, nome: v.nome.trim() }));
        this.selectedId.set(r.id);
        this.novo.reset();
      } else {
        await firstValueFrom(this.versaoUC.execute(this.selectedId(), this.versao.getRawValue()));
        this.versao.controls.itens.clear();
        this.versao.controls.itens.push(this.item());
      }
      this.feedback.set(
        kind === 'modelo'
          ? 'Modelo criado. Defina sua composição em uma versão.'
          : 'Versão criada com sucesso.',
      );
      await this.carregar();
    } catch (e) {
      this.mutationError.set(userErrorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}
