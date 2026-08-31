import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
@Component({ selector: 'app-error-state', template: '<div class="state error" role="alert"><p>{{ message() }}</p><button type="button" (click)="retry.emit()">Tentar novamente</button></div>', styleUrl: './state.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ErrorStateComponent { readonly message = input.required<string>(); readonly retry = output<void>(); }
