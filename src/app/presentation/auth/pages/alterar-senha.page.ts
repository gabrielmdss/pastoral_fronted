import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AlterarSenhaUseCase } from '../../../application/auth/use-cases/alterar-senha.use-case';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { PasswordFieldComponent } from '../../../shared/ui/password-field.component';

function senhasIguaisValidator(group: AbstractControl): ValidationErrors | null {
  const novaSenha = group.get('novaSenha')?.value;
  const confirmarNovaSenha = group.get('confirmarNovaSenha')?.value;
  return novaSenha && confirmarNovaSenha && novaSenha !== confirmarNovaSenha
    ? { senhasDiferentes: true }
    : null;
}

@Component({
  selector: 'app-alterar-senha-page',
  imports: [ReactiveFormsModule, PageHeaderComponent, PasswordFieldComponent],
  templateUrl: './alterar-senha.page.html',
  styleUrl: './alterar-senha.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AlterarSenhaPage {
  private readonly alterarSenha = inject(AlterarSenhaUseCase);

  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly feedback = signal('');

  readonly form = new FormGroup(
    {
      senhaAtual: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      novaSenha: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmarNovaSenha: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: senhasIguaisValidator },
  );

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    this.feedback.set('');
    const { senhaAtual, novaSenha } = this.form.getRawValue();
    try {
      await firstValueFrom(this.alterarSenha.execute({ senhaAtual, novaSenha }));
      this.feedback.set('Senha alterada com sucesso.');
      this.form.reset();
    } catch (error) {
      this.errorMessage.set(this.mensagemDeErro(error));
    } finally {
      this.saving.set(false);
    }
  }

  private mensagemDeErro(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Senha atual incorreta.';
      if (error.status === 400 || error.status === 422) {
        return 'A nova senha deve ter pelo menos 8 caracteres e os demais campos precisam estar preenchidos.';
      }
    }
    return 'Não foi possível alterar a senha agora. Tente novamente em instantes.';
  }
}
