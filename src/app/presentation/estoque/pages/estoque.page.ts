import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin, Observable } from 'rxjs';
import * as U from '../../../application/estoque/estoque.use-cases';
import type {
  InsumoSaldo,
  CategoriaInsumo,
  Doador,
  EntradaInput,
  DoadorInput,
} from '../../../domain/estoque/estoque.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';

@Component({
  selector: 'app-estoque-page',
  imports: [
    ReactiveFormsModule,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './estoque.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EstoquePage {
  readonly session = inject(SessionFacade);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly listar = inject(U.ListarInsumosUseCase);
  private readonly categoriasUC = inject(U.ListarCategoriasInsumoUseCase);
  private readonly doadoresUC = inject(U.ListarDoadoresUseCase);
  private readonly entradaUC = inject(U.RegistrarEntradaUseCase);
  private readonly perdaUC = inject(U.RegistrarPerdaUseCase);
  private readonly insumoUC = inject(U.CadastrarInsumoUseCase);
  private readonly criarDoador = inject(U.CriarDoadorUseCase);
  private readonly atualizarDoador = inject(U.AtualizarDoadorUseCase);
  readonly insumos = signal<InsumoSaldo[]>([]);
  readonly categorias = signal<CategoriaInsumo[]>([]);
  readonly doadores = signal<Doador[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly mutationError = signal('');
  readonly feedback = signal('');
  readonly busca = signal('');
  readonly tab = signal<'saldos' | 'doadores'>('saldos');
  readonly mode = signal<'entrada' | 'perda' | 'insumo' | 'doador' | null>(null);
  readonly doadorId = signal<string | null>(null);
  readonly filtrados = computed(() => {
    const term = this.busca().trim().toLocaleLowerCase('pt-BR');
    return this.insumos().filter((i) =>
      (i.insumo + ' ' + i.apresentacao).toLocaleLowerCase('pt-BR').includes(term),
    );
  });
  readonly positive = [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)];
  readonly entrada = this.fb.group({
    tipo: this.fb.control<EntradaInput['tipo']>('DOACAO'),
    doadorId: '',
    dataEntrada: '',
    observacao: '',
    itens: this.fb.array([this.itemEntrada()]),
  });
  readonly perda = this.fb.group({
    apresentacaoInsumoId: ['', Validators.required],
    quantidade: [1, this.positive],
    motivoId: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    observacao: '',
  });
  readonly insumo = this.fb.group({
    nome: ['', Validators.required],
    categoriaPrioridadeId: '',
    descricao: ['', Validators.required],
    quantidadeReferencia: this.fb.control<number | null>(null, [Validators.min(Number.MIN_VALUE)]),
    unidadeMedida: '',
  });
  readonly doador = this.fb.group({
    tipo: this.fb.control<DoadorInput['tipo']>('PESSOA'),
    nome: ['', Validators.required],
    telefone: '',
    observacao: '',
    ativo: true,
  });
  constructor() {
    void this.carregar();
  }
  itemEntrada() {
    return this.fb.group({
      apresentacaoInsumoId: ['', Validators.required],
      quantidade: [1, this.positive],
      validade: '',
    });
  }
  async carregar() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const data = await firstValueFrom(
        forkJoin({
          insumos: this.listar.execute(),
          categorias: this.categoriasUC.execute(),
          doadores: this.doadoresUC.execute(),
        }),
      );
      this.insumos.set(data.insumos);
      this.categorias.set(data.categorias);
      this.doadores.set(data.doadores);
    } catch (e) {
      this.error.set(userErrorMessage(e, 'Não foi possível consultar o estoque.'));
    } finally {
      this.loading.set(false);
    }
  }
  abrir(mode: NonNullable<ReturnType<typeof this.mode>>, doador?: Doador) {
    if (this.saving()) return;
    this.mode.set(mode);
    this.mutationError.set('');
    this.feedback.set('');
    if (mode === 'doador') {
      this.doadorId.set(doador?.id ?? null);
      this.doador.reset({
        tipo: doador?.tipo ?? 'PESSOA',
        nome: doador?.nome ?? '',
        telefone: doador?.telefone ?? '',
        observacao: doador?.observacao ?? '',
        ativo: doador?.ativo ?? true,
      });
    }
  }
  async salvar() {
    if (this.saving() || this.loading() || this.error()) return;
    let request: Observable<unknown>;
    const mode = this.mode();
    if (
      mode === 'entrada' &&
      this.session.hasPermission('ESTOQUE_ENTRADA') &&
      this.entrada.valid &&
      this.entrada.controls.itens.length
    ) {
      const v = this.entrada.getRawValue();
      request = this.entradaUC.execute({
        ...v,
        doadorId: v.doadorId || null,
        dataEntrada: v.dataEntrada || null,
        observacao: v.observacao.trim() || null,
        itens: v.itens.map((i) => ({ ...i, validade: i.validade || null })),
      });
    } else if (
      mode === 'perda' &&
      this.session.hasPermission('ESTOQUE_PERDA') &&
      this.perda.valid
    ) {
      if (!window.confirm('Confirmar a perda de estoque?')) return;
      const v = this.perda.getRawValue();
      request = this.perdaUC.execute({ ...v, observacao: v.observacao.trim() || null });
    } else if (
      mode === 'insumo' &&
      this.session.hasPermission('ESTOQUE_INSUMO_CADASTRAR') &&
      this.insumo.valid
    ) {
      const v = this.insumo.getRawValue();
      if (!v.nome.trim() || !v.descricao.trim()) return;
      request = this.insumoUC.execute({
        nome: v.nome.trim(),
        categoriaPrioridadeId: v.categoriaPrioridadeId || null,
        apresentacao: {
          descricao: v.descricao.trim(),
          quantidadeReferencia: v.quantidadeReferencia,
          unidadeMedida: v.unidadeMedida.trim() || null,
        },
      });
    } else if (
      mode === 'doador' &&
      this.session.hasPermission('ESTOQUE_ENTRADA') &&
      this.doador.valid
    ) {
      const v = this.doador.getRawValue();
      if (!v.nome.trim()) return;
      const input: DoadorInput = {
        tipo: v.tipo,
        nome: v.nome.trim(),
        telefone: v.telefone?.trim() || null,
        observacao: v.observacao?.trim() || null,
      };
      request = this.doadorId()
        ? this.atualizarDoador.execute(this.doadorId()!, { ...input, ativo: v.ativo })
        : this.criarDoador.execute(input);
    } else return;
    this.saving.set(true);
    this.mutationError.set('');
    this.feedback.set('');
    try {
      await firstValueFrom(request);
      this.mode.set(null);
      this.feedback.set('Operação concluída com sucesso.');
      if (mode === 'entrada') {
        this.entrada.reset();
        this.entrada.controls.itens.clear();
        this.entrada.controls.itens.push(this.itemEntrada());
      }
      if (mode === 'perda') this.perda.reset();
      if (mode === 'insumo') this.insumo.reset();
      await this.carregar();
    } catch (e) {
      this.mutationError.set(userErrorMessage(e));
      await this.carregar();
    } finally {
      this.saving.set(false);
    }
  }
}
