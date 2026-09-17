import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ObterFotoPessoaUseCase } from '../../../application/pessoas/pessoas.use-cases';
import { BeneficiarioAvatarComponent } from './beneficiario-avatar.component';

describe('BeneficiarioAvatarComponent', () => {
  it('mostra as iniciais quando não há foto (404)', async () => {
    TestBed.configureTestingModule({
      imports: [BeneficiarioAvatarComponent],
      providers: [
        {
          provide: ObterFotoPessoaUseCase,
          useValue: { execute: () => throwError(() => new Error('404')) },
        },
      ],
    });
    const f = TestBed.createComponent(BeneficiarioAvatarComponent);
    f.componentRef.setInput('pessoaId', '1');
    f.componentRef.setInput('nome', 'Ana Silva');
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('A');
    expect(f.nativeElement.querySelector('img')).toBeNull();
  });

  it('mostra a foto e permite ampliar ao clicar', async () => {
    const blob = new Blob(['foto']);
    TestBed.configureTestingModule({
      imports: [BeneficiarioAvatarComponent],
      providers: [{ provide: ObterFotoPessoaUseCase, useValue: { execute: () => of(blob) } }],
    });
    const f = TestBed.createComponent(BeneficiarioAvatarComponent);
    f.componentRef.setInput('pessoaId', '1');
    f.componentRef.setInput('nome', 'Ana Silva');
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    f.detectChanges();
    const img = f.nativeElement.querySelector('img');
    expect(img).not.toBeNull();
    expect(f.componentInstance.expandido()).toBe(false);
    (f.nativeElement.querySelector('button.ba-avatar') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.expandido()).toBe(true);
    expect(f.nativeElement.querySelector('.lightbox')).not.toBeNull();
  });
});
