import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { PasswordFieldComponent } from '../../../shared/ui/password-field.component';
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, PasswordFieldComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginPage {
  readonly errorMessage = signal('');
  readonly form = new FormGroup({
    login: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    senha: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  constructor(
    readonly session: SessionFacade,
    private readonly router: Router,
  ) {}
  async submit(): Promise<void> {
    if (this.form.invalid || this.session.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set('');
    try {
      await this.session.login(this.form.getRawValue());
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage.set(userErrorMessage(error, 'Não foi possível entrar. Tente novamente.'));
    }
  }
}
