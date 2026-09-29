import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CriarUsuarioUseCase, ListarPerfisUseCase } from '../../../application/usuarios/usuarios.use-cases';
import type { Perfil, UsuarioCriado } from '../../../domain/usuarios/usuario.model';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { PasswordFieldComponent } from '../../../shared/ui/password-field.component';
import { SectionCardComponent } from '../../../shared/ui/section-card.component';
import { ToastService } from '../../../shared/ui/toast.service';

function senhasIguais(group: AbstractControl): ValidationErrors | null {
  const senha = group.get('senha')?.value;
  const confirmar = group.get('confirmarSenha')?.value;
  return senha && confirmar && senha !== confirmar ? { senhasDiferentes: true } : null;
}

function peloMenosUmPerfil(control: AbstractControl): ValidationErrors | null {
  return Array.isArray(control.value) && control.value.length > 0 ? null : { semPerfil: true };
}

@Component({
  selector: 'app-usuarios-page',
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    SectionCardComponent,
    PasswordFieldComponent,
    IconComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './usuarios.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-page' },
})
export default class UsuariosPage implements OnInit {
  private readonly listarPerfis = inject(ListarPerfisUseCase);
  private readonly criarUsuario = inject(CriarUsuarioUseCase);
  private readonly toast = inject(ToastService);

  readonly perfis = signal<Perfil[]>([]);
  readonly perfisLoading = signal(true);
  readonly perfisError = signal('');
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly ultimoCriado = signal<UsuarioCriado | null>(null);

  readonly form = new FormGroup(
    {
      login: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
      }),
      senha: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), Validators.maxLength(200)],
      }),
      confirmarSenha: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      perfilIds: new FormControl<string[]>([], { nonNullable: true, validators: [peloMenosUmPerfil] }),
    },
    { validators: senhasIguais },
  );

  ngOnInit(): void {
    void this.carregarPerfis();
  }

  async carregarPerfis(): Promise<void> {
    this.perfisLoading.set(true);
    this.perfisError.set('');
    try {
      this.perfis.set(await firstValueFrom(this.listarPerfis.execute()));
    } catch (error) {
      this.perfisError.set(userErrorMessage(error, 'Não foi possível carregar os perfis de acesso.'));
    } finally {
      this.perfisLoading.set(false);
    }
  }

  perfilSelecionado(id: string): boolean {
    return this.form.controls.perfilIds.value.includes(id);
  }

  alternarPerfil(id: string, evento: Event): void {
    const marcado = (evento.target as HTMLInputElement).checked;
    const atuais = this.form.controls.perfilIds.value.filter((perfilId) => perfilId !== id);
    this.form.controls.perfilIds.setValue(marcado ? [...atuais, id] : atuais);
    this.form.controls.perfilIds.markAsTouched();
  }

  nomesPerfis(codigos: string[]): string {
    return codigos
      .map((codigo) => this.perfis().find((perfil) => perfil.codigo === codigo)?.nome ?? codigo)
      .join(', ');
  }

  campoInvalido(nome: 'login' | 'senha' | 'confirmarSenha' | 'perfilIds'): boolean {
    const control = this.form.controls[nome];
    return control.invalid && control.touched;
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    const { login, senha, perfilIds } = this.form.getRawValue();
    try {
      const criado = await firstValueFrom(
        this.criarUsuario.execute({ login: login.trim(), senha, perfilIds }),
      );
      this.ultimoCriado.set(criado);
      this.toast.success(`Usuário ${criado.login} cadastrado.`);
      this.form.reset();
    } catch (error) {
      this.errorMessage.set(userErrorMessage(error, 'Não foi possível cadastrar o usuário agora.'));
    } finally {
      this.saving.set(false);
    }
  }
}
