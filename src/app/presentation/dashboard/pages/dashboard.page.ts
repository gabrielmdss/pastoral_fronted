import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GetDashboardUseCase } from '../../../application/dashboard/get-dashboard.use-case';
import type { Dashboard } from '../../../application/dashboard/dashboard.model';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
@Component({
  selector: 'app-dashboard-page',
  imports: [LoadingStateComponent, ErrorStateComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardPage implements OnInit {
  readonly data = signal<Dashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  constructor(private readonly getDashboard: GetDashboardUseCase) {}
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.data.set(await firstValueFrom(this.getDashboard.execute()));
    } catch (e) {
      this.error.set(userErrorMessage(e, 'Não foi possível carregar o dashboard.'));
    } finally {
      this.loading.set(false);
    }
  }
}
