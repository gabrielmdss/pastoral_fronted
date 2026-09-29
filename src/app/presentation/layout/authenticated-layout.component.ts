import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SessionFacade } from '../../infrastructure/auth/session.facade';
import { ThemeService } from '../../shared/theme/theme.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { ToastHostComponent } from '../../shared/ui/toast.service';
import { NAVIGATION, buildBreadcrumbs, filterNavigation, isRouteActive, type NavItem } from './navigation';

const EXPANDED_KEY = 'pastoral-nav-expanded';

function readExpanded(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(EXPANDED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

@Component({
  selector: 'app-authenticated-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ToastHostComponent],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuthenticatedLayoutComponent {
  readonly session = inject(SessionFacade);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroy = inject(DestroyRef);

  readonly menuOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly currentUrl = signal(this.router.url);
  /** Estado explícito de expansão (grupos e itens com subitens), persistido em localStorage. */
  private readonly expanded = signal<Record<string, boolean>>(readExpanded());

  /** Menu já filtrado pelas permissões do usuário. */
  readonly menu = computed(() => filterNavigation(NAVIGATION, (p) => this.session.hasPermission(p)));
  readonly crumbs = computed(() => buildBreadcrumbs(this.currentUrl()));
  readonly pageTitle = computed(() => this.crumbs().at(-1)?.label ?? 'Início');
  readonly user = computed(() => this.session.currentUser());
  readonly initials = computed(() => (this.user()?.login ?? '?').slice(0, 2).toUpperCase());
  readonly perfis = computed(() => (this.user()?.perfis ?? []).join(', '));

  constructor() {
    this.expandActive();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.menuOpen.set(false);
        this.userMenuOpen.set(false);
        this.expandActive();
      });
  }

  isGroupOpen(id: string): boolean {
    return this.expanded()[`g:${id}`] ?? true;
  }
  isItemOpen(id: string): boolean {
    return this.expanded()[`i:${id}`] ?? false;
  }
  toggleGroup(id: string): void {
    this.setExpanded(`g:${id}`, !this.isGroupOpen(id));
  }
  toggleItem(id: string): void {
    this.setExpanded(`i:${id}`, !this.isItemOpen(id));
  }
  isItemActive(item: NavItem): boolean {
    const url = this.currentUrl();
    if (item.route) return isRouteActive(url, item.route);
    return (item.children ?? []).some((c) => isRouteActive(url, c.route));
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.session.logout();
    void this.router.navigate(['/login']);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.userMenuOpen.set(false);
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen()) return;
    const menu = this.host.nativeElement.querySelector('.shell-user');
    if (menu && event.target instanceof Node && !menu.contains(event.target)) this.userMenuOpen.set(false);
  }

  /** Abre o grupo e o item (com subitens) que contêm a rota atual. */
  private expandActive(): void {
    for (const group of this.menu()) {
      for (const item of group.items) {
        if (!this.isItemActive(item)) continue;
        const next = { ...this.expanded(), [`g:${group.id}`]: true };
        if (item.children) next[`i:${item.id}`] = true;
        this.expanded.set(next);
        return;
      }
    }
  }

  private setExpanded(key: string, value: boolean): void {
    this.expanded.update((state) => ({ ...state, [key]: value }));
    try {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify(this.expanded()));
    } catch {
      // Storage indisponível: o estado vale apenas nesta sessão.
    }
  }
}
