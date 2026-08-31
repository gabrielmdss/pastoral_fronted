import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({ selector: 'app-loading-state', template: '<div class="state" role="status"><span class="spinner"></span>{{ label() }}</div>', styleUrl: './state.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class LoadingStateComponent { readonly label = input('Carregando…'); }
