import type { IconName } from '../../shared/ui/icons';

/** Função de verificação de permissão (normalmente SessionFacade.hasPermission). */
export type Can = (permission: string) => boolean;

export interface NavLink {
  label: string;
  route: string;
  visible: (can: Can) => boolean;
}
export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  /** Link direto (itens sem subitens). */
  route?: string;
  visible?: (can: Can) => boolean;
  children?: NavLink[];
}
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const perm = (p: string) => (can: Can) => can(p);
const beneficiario = perm('BENEFICIARIO_VISUALIZAR');
const estoque = perm('ESTOQUE_VISUALIZAR');

/**
 * Estrutura do menu lateral. Cada entrada mantém exatamente a verificação de permissão
 * das rotas em `app.routes.ts` (os guards continuam sendo a autoridade).
 */
export const NAVIGATION: NavGroup[] = [
  {
    id: 'visao-geral',
    label: 'Visão geral',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'layout-dashboard',
        route: '/dashboard',
        visible: (can) => can('BENEFICIARIO_VISUALIZAR') && can('ESTOQUE_VISUALIZAR'),
      },
    ],
  },
  {
    id: 'assistencia',
    label: 'Assistência',
    items: [
      { id: 'beneficiarios', label: 'Beneficiários', icon: 'users', route: '/beneficiarios', visible: beneficiario },
      { id: 'candidaturas', label: 'Candidaturas', icon: 'clipboard-list', route: '/candidaturas', visible: perm('CANDIDATURA_VISUALIZAR') },
      { id: 'capacidade', label: 'Capacidade', icon: 'gauge', route: '/capacidade', visible: beneficiario },
      { id: 'competencias', label: 'Competências', icon: 'calendar-range', route: '/competencias', visible: beneficiario },
    ],
  },
  {
    id: 'distribuicao',
    label: 'Distribuição',
    items: [
      { id: 'distribuicoes', label: 'Distribuições', icon: 'package-open', route: '/distribuicoes', visible: beneficiario },
    ],
  },
  {
    id: 'preparacao',
    label: 'Preparação',
    items: [
      {
        id: 'estoque',
        label: 'Estoque',
        icon: 'boxes',
        children: [
          { label: 'Insumos e saldos', route: '/estoque', visible: estoque },
          { label: 'Inventários', route: '/inventarios', visible: perm('ESTOQUE_INVENTARIO') },
          { label: 'Doadores', route: '/doadores', visible: estoque },
        ],
      },
      {
        id: 'cestas',
        label: 'Cestas',
        icon: 'layers',
        children: [
          { label: 'Modelos de cesta', route: '/modelos-cesta', visible: perm('CESTA_MODELO_GERENCIAR') },
          { label: 'Planejamentos', route: '/planejamentos', visible: estoque },
          { label: 'Montagem e lotes', route: '/montagem', visible: estoque },
        ],
      },
    ],
  },
  {
    id: 'gestao',
    label: 'Gestão',
    items: [
      {
        id: 'relatorios',
        label: 'Relatórios',
        icon: 'bar-chart-3',
        route: '/relatorios',
        visible: (can) => can('BENEFICIARIO_VISUALIZAR') || can('ESTOQUE_VISUALIZAR'),
      },
      { id: 'auditoria', label: 'Auditoria', icon: 'scroll-text', route: '/auditoria', visible: perm('AUDITORIA_VISUALIZAR') },
      { id: 'usuarios', label: 'Usuários', icon: 'shield', route: '/usuarios', visible: perm('PERFIL_GERENCIAR') },
    ],
  },
];

/** Filtra grupos/itens/subitens pelas permissões; remove grupos e itens vazios. */
export function filterNavigation(groups: NavGroup[], can: Can): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => (item.children ? { ...item, children: item.children.filter((c) => c.visible(can)) } : item))
        .filter((item) => (item.children ? item.children.length > 0 : !item.visible || item.visible(can))),
    }))
    .filter((group) => group.items.length > 0);
}

/** true quando `url` está na rota (limite de segmento: /estoque não casa /estoque-x). */
export function isRouteActive(url: string, route: string): boolean {
  const path = url.split(/[?#]/)[0];
  return path === route || path.startsWith(`${route}/`);
}

export interface Crumb {
  label: string;
  route?: string;
}

const SEGMENT_LABELS: Record<string, string> = {
  novo: 'Novo',
  atendimento: 'Atendimento',
  liberacoes: 'Liberações',
  senha: 'Alterar senha',
};
const EXTRA_ROUTES: Record<string, Crumb[]> = {
  '/perfil/senha': [{ label: 'Perfil' }, { label: 'Alterar senha' }],
  '/acesso-negado': [{ label: 'Acesso negado' }],
};

/** Deriva breadcrumbs (sem "Início") da URL usando a estrutura do menu. */
export function buildBreadcrumbs(url: string, groups: NavGroup[] = NAVIGATION): Crumb[] {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (EXTRA_ROUTES[path]) return EXTRA_ROUTES[path];
  const crumbs: Crumb[] = [];
  let base: string | undefined;
  for (const group of groups) {
    for (const item of group.items) {
      if (item.route && isRouteActive(path, item.route)) {
        crumbs.push({ label: item.label, route: item.route });
        base = item.route;
      }
      for (const child of item.children ?? []) {
        if (isRouteActive(path, child.route)) {
          crumbs.push({ label: item.label }, { label: child.label, route: child.route });
          base = child.route;
        }
      }
      if (base) break;
    }
    if (base) break;
  }
  if (!base) return [];
  const rest = path.slice(base.length).split('/').filter(Boolean);
  let acc = base;
  rest.forEach((segment, index) => {
    acc += `/${segment}`;
    const label = SEGMENT_LABELS[segment] ?? (index === 0 ? 'Detalhe' : segment);
    crumbs.push({ label, route: acc });
  });
  // O último item é a página atual (sem link).
  const last = crumbs[crumbs.length - 1];
  crumbs[crumbs.length - 1] = { label: last.label };
  return crumbs;
}
