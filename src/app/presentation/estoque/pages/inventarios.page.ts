import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import * as U from '../../../application/estoque/inventarios.use-cases';
import { ListarInsumosUseCase } from '../../../application/estoque/estoque.use-cases';
import type { Inventario } from '../../../domain/estoque/inventario.model';
import type { InsumoSaldo } from '../../../domain/estoque/estoque.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';

@Component({
  selector: 'app-inventarios',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './inventarios.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InventariosPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly criarUC = inject(U.CriarInventarioUseCase);
  private readonly obterUC = inject(U.ObterInventarioUseCase);
  private readonly contarUC = inject(U.ContarInventarioUseCase);
  private readonly concluirUC = inject(U.ConcluirInventarioUseCase);
  private readonly estoqueUC = inject(ListarInsumosUseCase);
  private readonly session = inject(SessionFacade);
  readonly permitido = this.session.hasPermission('ESTOQUE_INVENTARIO');
  readonly podeEstoque = this.session.hasPermission('ESTOQUE_VISUALIZAR');
  readonly id = signal<string | null>(null);
  readonly inventario = signal<Inventario | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly savingItem = signal<string | null>(null);
  readonly error = signal('');
  readonly mutationError = signal('');
  readonly feedback = signal('');
  readonly estoqueError = signal('');
  readonly estoque = signal<InsumoSaldo[]>([]);
  readonly estoquePorId = computed(() => new Map(this.estoque().map((i) => [i.apresentacaoId, i])));
  readonly controles = signal<Record<string, FormControl<number | null>>>({});
  readonly codigo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d+$/)],
  });
  readonly divergentes = computed(
    () => this.inventario()?.itens.filter((i) => i.diferenca !== 0).length ?? 0,
  );
  private epoch = 0;
  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.id.set(params.get('id'));
      this.inventario.set(null);
      this.controles.set({});
      this.mutationError.set('');
      this.feedback.set(
        this.router.getCurrentNavigation()?.extras.state?.['criado'] === true
          ? 'Inventário aberto. O saldo foi capturado pelo estoque.'
          : '',
      );
      void this.carregar();
    });
  }
  consultar() {
    if (this.codigo.invalid || this.saving()) return;
    void this.router.navigate(['/inventarios', this.codigo.value]);
  }
  async carregar() {
    const epoch = ++this.epoch,
      id = this.id();
    this.error.set('');
    if (!id || !this.permitido) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.estoqueError.set('');
    try {
      const result = await firstValueFrom(
        forkJoin({
          inventario: this.obterUC.execute(id),
          estoque: this.podeEstoque
            ? this.estoqueUC.execute().pipe(
                catchError((e) => {
                  if (epoch === this.epoch)
                    this.estoqueError.set(
                      userErrorMessage(e, 'Não foi possível atualizar o saldo atual do estoque.'),
                    );
                  return of([] as InsumoSaldo[]);
                }),
              )
            : of([] as InsumoSaldo[]),
        }).pipe(takeUntilDestroyed(this.destroy)),
      );
      if (epoch !== this.epoch) return;
      this.inventario.set(result.inventario);
      this.estoque.set(result.estoque);
      if (!result.inventario) {
        this.error.set('Inventário não encontrado. Confira o código informado.');
        return;
      }
      const previous = this.controles(),
        next: Record<string, FormControl<number | null>> = {};
      for (const item of result.inventario.itens) {
        const existing = previous[item.apresentacaoId];
        if (existing?.dirty && result.inventario.status === 'ABERTO')
          next[item.apresentacaoId] = existing;
        else
          next[item.apresentacaoId] = new FormControl(item.saldoFisico, [
            Validators.required,
            Validators.min(0),
            Validators.pattern(/^\d+$/),
          ]);
      }
      this.controles.set(next);
    } catch (e) {
      if (!this.destroy.destroyed && epoch === this.epoch)
        this.error.set(userErrorMessage(e, 'Não foi possível consultar o inventário.'));
    } finally {
      if (epoch === this.epoch) this.loading.set(false);
    }
  }
  pendentesLocais() {
    return Object.values(this.controles()).filter((c) => c.dirty).length;
  }
  async criar() {
    if (!this.permitido || this.saving() || this.loading()) return;
    if (
      !window.confirm(
        'Abrir um novo inventário? O backend capturará o saldo atual. Alterações posteriores no estoque podem impedir a conclusão.',
      )
    )
      return;
    this.saving.set(true);
    this.feedback.set('');
    this.mutationError.set('');
    try {
      const result = await firstValueFrom(
        this.criarUC.execute().pipe(takeUntilDestroyed(this.destroy)),
      );
      if (!this.destroy.destroyed)
        await this.router.navigate(['/inventarios', result.id], { state: { criado: true } });
    } catch (e) {
      if (!this.destroy.destroyed) {
        this.mutationError.set(userErrorMessage(e));
        await this.carregar();
      }
    } finally {
      this.saving.set(false);
    }
  }
  async contar(apresentacaoId: string) {
    const inv = this.inventario(),
      control = this.controles()[apresentacaoId];
    if (
      !this.permitido ||
      !inv ||
      inv.status !== 'ABERTO' ||
      !control ||
      control.invalid ||
      control.value === null ||
      this.loading() ||
      this.error() ||
      this.saving()
    )
      return;
    this.saving.set(true);
    this.savingItem.set(apresentacaoId);
    this.feedback.set('');
    this.mutationError.set('');
    try {
      await firstValueFrom(
        this.contarUC
          .execute(inv.id, apresentacaoId, control.value)
          .pipe(takeUntilDestroyed(this.destroy)),
      );
      if (this.destroy.destroyed || this.id() !== inv.id) return;
      control.markAsPristine();
      this.feedback.set('Contagem registrada. A divergência será consultada novamente.');
      await this.carregar();
    } catch (e) {
      if (!this.destroy.destroyed && this.id() === inv.id) {
        this.mutationError.set(this.operationError(e));
        await this.carregar();
      }
    } finally {
      this.saving.set(false);
      this.savingItem.set(null);
    }
  }
  async concluir() {
    const inv = this.inventario();
    if (
      !this.permitido ||
      !inv ||
      inv.status !== 'ABERTO' ||
      this.loading() ||
      this.error() ||
      this.saving()
    )
      return;
    const pending = this.pendentesLocais();
    if (
      !window.confirm(
        `Concluir o inventário ${inv.id}?\n${inv.itens.length} itens retornados; ${this.divergentes()} com divergência registrada.\n${pending ? `${pending} edição(ões) não salva(s) nesta tela não serão aplicadas.\n` : ''}O backend não informa quais itens foram conferidos. Serão aplicadas somente as contagens já registradas, se o saldo capturado ainda for válido.`,
      )
    )
      return;
    this.saving.set(true);
    this.feedback.set('');
    this.mutationError.set('');
    try {
      await firstValueFrom(this.concluirUC.execute(inv.id).pipe(takeUntilDestroyed(this.destroy)));
      if (this.destroy.destroyed || this.id() !== inv.id) return;
      this.feedback.set('Conclusão confirmada. Consulte o estado e os saldos atualizados.');
      await this.carregar();
    } catch (e) {
      if (!this.destroy.destroyed && this.id() === inv.id) {
        this.mutationError.set(this.operationError(e));
        await this.carregar();
      }
    } finally {
      this.saving.set(false);
    }
  }
  private operationError(e: unknown) {
    return (
      userErrorMessage(e) +
      (e instanceof HttpErrorResponse && e.status === 409
        ? ' O estado ou o estoque pode ter mudado em outra operação. Os dados serão reconsultados.'
        : '')
    );
  }
}
