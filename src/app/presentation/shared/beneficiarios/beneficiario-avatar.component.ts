import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ObterFotoPessoaUseCase } from '../../../application/pessoas/pessoas.use-cases';
import { ImageLightboxComponent } from '../../../shared/ui/image-lightbox.component';

@Component({
  selector: 'app-beneficiario-avatar',
  imports: [ImageLightboxComponent],
  template: `
    <button
      type="button"
      class="ba-avatar"
      [class.ba-avatar--lg]="size() === 'lg'"
      [class.ba-avatar--clickable]="!!fotoUrl()"
      [disabled]="!fotoUrl()"
      (click)="abrir()"
      [attr.aria-label]="fotoUrl() ? 'Ampliar foto de ' + nome() : nome()"
    >
      @if (fotoUrl(); as url) {
        <img [src]="url" [alt]="'Foto de ' + nome()" />
      } @else if (!carregando()) {
        <span>{{ nome().charAt(0) }}</span>
      }
    </button>
    @if (expandido() && fotoUrl(); as url) {
      <app-image-lightbox
        [src]="url"
        [alt]="'Foto de ' + nome()"
        [caption]="nome()"
        (close)="fechar()"
      />
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .ba-avatar {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 2.3rem;
        height: 2.3rem;
        min-height: 0;
        border-radius: 50%;
        background: var(--color-primary-soft);
        color: var(--color-primary-dark);
        font-weight: 700;
        border: none;
        padding: 0;
        overflow: hidden;
        cursor: default;
      }
      .ba-avatar:disabled {
        background: var(--color-primary-soft);
        color: var(--color-primary-dark);
        cursor: default;
      }
      .ba-avatar--lg {
        width: 4rem;
        height: 4rem;
        font-size: 1.4rem;
      }
      .ba-avatar--clickable {
        cursor: zoom-in;
      }
      .ba-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeneficiarioAvatarComponent implements OnInit, OnDestroy {
  readonly pessoaId = input.required<string>();
  readonly nome = input.required<string>();
  readonly size = input<'sm' | 'lg'>('sm');

  private readonly obterFoto = inject(ObterFotoPessoaUseCase);

  readonly fotoUrl = signal<string | null>(null);
  readonly carregando = signal(true);
  readonly expandido = signal(false);

  ngOnInit(): void {
    void this.carregar();
  }

  ngOnDestroy(): void {
    this.revoke();
  }

  private revoke(): void {
    const atual = this.fotoUrl();
    if (atual) URL.revokeObjectURL(atual);
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    try {
      const blob = await firstValueFrom(this.obterFoto.execute(this.pessoaId()));
      this.revoke();
      this.fotoUrl.set(URL.createObjectURL(blob));
    } catch {
      this.revoke();
      this.fotoUrl.set(null);
    } finally {
      this.carregando.set(false);
    }
  }

  abrir(): void {
    if (this.fotoUrl()) this.expandido.set(true);
  }

  fechar(): void {
    this.expandido.set(false);
  }
}
