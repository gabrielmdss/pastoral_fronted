import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  private readonly allItems: MenuItem[] = [{ label: 'Dashboard', route: '/dashboard' }];
  private readonly assistanceItems: MenuItem[] = [
    { label: 'Beneficiários', route: '/beneficiarios', permission: 'BENEFICIARIO_VISUALIZAR' },
    { label: 'Lista de espera', route: '/candidaturas', permission: 'CANDIDATURA_VISUALIZAR' },
    { label: 'Capacidade', route: '/capacidade', permission: 'BENEFICIARIO_VISUALIZAR' },
  ];
  readonly menuItems = computed(() =>
    this.allItems.filter(
      (item) => item.route && (!item.permission || this.session.hasPermission(item.permission)),
    ),
  );
  readonly assistanceMenu = computed(() =>
    this.assistanceItems.filter(
      (item) => !item.permission || this.session.hasPermission(item.permission),
    ),
  );
  constructor(
    readonly session: SessionFacade,
    private readonly router: Router,
  ) {}
  logout(): void {
    this.session.logout();
    void this.router.navigate(['/login']);
  }
}
