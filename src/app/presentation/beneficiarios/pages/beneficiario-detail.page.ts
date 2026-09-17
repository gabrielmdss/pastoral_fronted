import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  AlterarGrupoBeneficiarioUseCase,
  DesligarBeneficiarioUseCase,
  ObterBeneficiarioUseCase,
  ReativarBeneficiarioUseCase,
} from '../../../application/beneficiarios/beneficiarios.use-cases';
import {
  EnviarFotoPessoaUseCase,
  ObterFotoPessoaUseCase,
} from '../../../application/pessoas/pessoas.use-cases';
import type { BeneficiarioDetalhe } from '../../../domain/beneficiarios/beneficiario.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { ImageLightboxComponent } from '../../../shared/ui/image-lightbox.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
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
    ImageLightboxComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './beneficiario-detail.page.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BeneficiarioDetailPage implements OnInit, OnDestroy {
  readonly item = signal<BeneficiarioDetalhe | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly tab = signal<'dados' | 'retiradas' | 'pendencias'>('dados');
  readonly mode = signal<'grupo' | 'desligar' | 'reativar' | null>(null);
  readonly mutation = signal(false);
  readonly feedback = signal('');
  private static readonly TIPOS_FOTO_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
  private static readonly TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;
  readonly fotoUrl = signal<string | null>(null);
  readonly fotoCarregando = signal(false);
  readonly fotoEnviando = signal(false);
  readonly fotoErro = signal('');
  readonly fotoExpandida = signal(false);
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
    private readonly obterFoto: ObterFotoPessoaUseCase,
    private readonly enviarFoto: EnviarFotoPessoaUseCase,
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
  ngOnDestroy() {
    this.revokeFotoUrl();
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const item = await firstValueFrom(this.obter.execute(this.id));
      this.item.set(item);
      void this.loadFoto(item.pessoa.id);
    } catch (e) {
      this.error.set(userErrorMessage(e, 'Não foi possível carregar o beneficiário.'));
    } finally {
      this.loading.set(false);
    }
  }
  private revokeFotoUrl() {
    const atual = this.fotoUrl();
    if (atual) URL.revokeObjectURL(atual);
  }
  async loadFoto(pessoaId: string) {
    this.fotoCarregando.set(true);
    try {
      const blob = await firstValueFrom(this.obterFoto.execute(pessoaId));
      this.revokeFotoUrl();
      this.fotoUrl.set(URL.createObjectURL(blob));
    } catch {
      this.revokeFotoUrl();
      this.fotoUrl.set(null);
    } finally {
      this.fotoCarregando.set(false);
    }
  }
  onFotoSelecionada(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    input.value = '';
    if (!arquivo) return;
    this.fotoErro.set('');
    if (!BeneficiarioDetailPage.TIPOS_FOTO_ACEITOS.includes(arquivo.type)) {
      this.fotoErro.set('Envie uma imagem nos formatos JPEG, PNG ou WEBP.');
      return;
    }
    if (arquivo.size > BeneficiarioDetailPage.TAMANHO_MAXIMO_FOTO) {
      this.fotoErro.set('A imagem deve ter no máximo 5MB.');
      return;
    }
    void this.enviarFotoArquivo(arquivo);
  }
  private async enviarFotoArquivo(arquivo: File) {
    if (this.fotoEnviando()) return;
    const pessoaId = this.item()?.pessoa.id;
    if (!pessoaId) return;
    this.fotoEnviando.set(true);
    this.fotoErro.set('');
    try {
      await firstValueFrom(this.enviarFoto.execute(pessoaId, arquivo));
      await this.loadFoto(pessoaId);
      this.feedback.set('Foto atualizada com sucesso.');
    } catch (e) {
      this.fotoErro.set(userErrorMessage(e, 'Não foi possível enviar a foto agora.'));
    } finally {
      this.fotoEnviando.set(false);
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
