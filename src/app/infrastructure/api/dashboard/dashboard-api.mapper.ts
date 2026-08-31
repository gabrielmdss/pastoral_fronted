import type { Dashboard } from '../../../application/dashboard/dashboard.model';
import type { DashboardResponseDto } from './dashboard-api.contracts';
export function mapDashboard(response: DashboardResponseDto): Dashboard {
  const data = response.data;
  return { ...data, beneficiarios: { ...data.beneficiarios }, estoque: { ...data.estoque }, insumosCriticos: data.insumosCriticos.map((item) => ({ ...item })), alertas: data.alertas.map((item) => ({ ...item })) };
}
