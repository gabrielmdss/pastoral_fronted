import type { ComponentFixture } from '@angular/core/testing';

/**
 * Para specs: responde ao `<app-confirm-dialog>` aberto na fixture clicando em Confirmar (true) ou Cancelar (false).
 * Retorna o texto do diálogo para asserções.
 */
export async function responderConfirmacao(fixture: ComponentFixture<unknown>, aceitar = true): Promise<string> {
  fixture.detectChanges();
  const dialog = (fixture.nativeElement as HTMLElement).querySelector('app-confirm-dialog');
  if (!dialog) throw new Error('Nenhum diálogo de confirmação aberto.');
  const texto = dialog.textContent ?? '';
  const botoes = dialog.querySelectorAll<HTMLButtonElement>('.dialog-actions button');
  botoes[aceitar ? 1 : 0]!.click();
  for (let i = 0; i < 3; i++) await Promise.resolve();
  fixture.detectChanges();
  return texto;
}

/**
 * Para specs: preenche os campos (`data-campo`) do `<app-confirm-dialog>` aberto e responde.
 * Retorna o texto do diálogo para asserções.
 */
export async function preencherDialogo(
  fixture: ComponentFixture<unknown>,
  valores: Record<string, string>,
  aceitar = true,
): Promise<string> {
  fixture.detectChanges();
  const dialog = (fixture.nativeElement as HTMLElement).querySelector('app-confirm-dialog');
  if (!dialog) throw new Error('Nenhum diálogo aberto.');
  for (const [id, valor] of Object.entries(valores)) {
    const campo = dialog.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[data-campo="${id}"]`,
    );
    if (!campo) throw new Error(`Campo ${id} não encontrado no diálogo.`);
    campo.value = valor;
    campo.dispatchEvent(new Event(campo instanceof HTMLSelectElement ? 'change' : 'input'));
  }
  return responderConfirmacao(fixture, aceitar);
}
