import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SessionFacade } from '../../infrastructure/auth/session.facade';
interface MenuItem {
  label: string;
  route?: string;
  permission?: string;
}
@Component({
  selector: 'app-authenticated-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuthenticatedLayoutComponent {
  readonly menuOpen = signal(false);
  readonly podeRelatorios = computed(() => this.session.hasPermission('BENEFICIARIO_VISUALIZAR') || this.session.hasPermission('ESTOQUE_VISUALIZAR'));
  private readonly allItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Competências', route: '/competencias', permission: 'BENEFICIARIO_VISUALIZAR' },
    { label: 'Distribuições', route: '/distribuicoes', permission: 'BENEFICIARIO_VISUALIZAR' },
  ];
  private readonly assistanceItems: MenuItem[] = [
    { label: 'Beneficiários', route: '/beneficiarios', permission: 'BENEFICIARIO_VISUALIZAR' },
    { label: 'Lista de espera', route: '/candidaturas', permission: 'CANDIDATURA_VISUALIZAR' },
    { label: 'Capacidade', route: '/capacidade', permission: 'BENEFICIARIO_VISUALIZAR' },
  ];
  private readonly preparationItems: MenuItem[] = [
    { label: 'Estoque', route: '/estoque', permission: 'ESTOQUE_VISUALIZAR' },
    { label: 'Inventários', route: '/inventarios', permission: 'ESTOQUE_INVENTARIO' },
    { label: 'Modelos de cesta', route: '/modelos-cesta', permission: 'CESTA_MODELO_GERENCIAR' },
    { label: 'Planejamento', route: '/planejamentos', permission: 'ESTOQUE_VISUALIZAR' },
    { label: 'Montagem', route: '/montagem', permission: 'ESTOQUE_VISUALIZAR' },
  ];
  private readonly relatoriosItem: MenuItem = { label: 'Relatórios', route: '/relatorios' };
  readonly menuItems = computed(() =>
    this.allItems.filter(
      (item) => item.route && (!item.permission || this.session.hasPermission(item.permission))
        && (item.route !== '/dashboard' || (this.session.hasPermission('BENEFICIARIO_VISUALIZAR') && this.session.hasPermission('ESTOQUE_VISUALIZAR'))),
    ),
  );
  readonly assistanceMenu = computed(() =>
    this.assistanceItems.filter(
      (item) => !item.permission || this.session.hasPermission(item.permission),
    ),
  );
  readonly preparationMenu = computed(() =>
    this.preparationItems.filter((item) => !item.permission || this.session.hasPermission(item.permission)),
  );
  private readonly destroy = inject(DestroyRef);
  private readonly currentUrl = signal('');
  readonly breadcrumbLabel = computed(() => {
    const primeiroSegmento = this.currentUrl().split('?')[0].split('/').filter(Boolean)[0];
    if (!primeiroSegmento) return '';
    const rota = `/${primeiroSegmento}`;
    const todos = [...this.allItems, ...this.assistanceItems, ...this.preparationItems, this.relatoriosItem];
    return todos.find((item) => item.route === rota)?.label ?? '';
  });
  constructor(
    readonly session: SessionFacade,
    private readonly router: Router,
  ) {
    this.currentUrl.set(this.router.url);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe(() => this.currentUrl.set(this.router.url));
  }
  logout(): void {
    this.session.logout();
    void this.router.navigate(['/login']);
  }
}
