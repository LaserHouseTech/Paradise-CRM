import React from 'react';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  FolderKanban,
  Receipt,
  CreditCard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  UserCheck,
  Repeat,
  LineChart,
  Target,
  Megaphone,
  Gift,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, data } = useApp();

  // Active counts for badges
  const pendingReceivablesCount = data.receivables.filter(
    (r) => r.status === 'Pendente' || r.status === 'Vencido'
  ).length;

  const overdueCount = data.receivables.filter((r) => r.status === 'Vencido').length +
    data.subscriptions.filter((s) => s.status === 'Em atraso').length;

  const activeSubsCount = data.subscriptions.filter((s) => s.status === 'Ativo').length;

  const sections: NavSection[] = [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'CRM & VENDAS',
      items: [
        { id: 'clients', label: 'Clientes', icon: Users, badge: data.clients.length },
        { id: 'pipeline', label: 'Funil de Vendas', icon: KanbanSquare },
        { id: 'projects', label: 'Projetos & Serviços', icon: FolderKanban, badge: data.projects.filter(p => p.status !== 'Finalizado' && p.status !== 'Cancelado').length },
      ],
    },
    {
      title: 'FINANCEIRO',
      items: [
        { id: 'receivables', label: 'Contas a Receber', icon: Receipt, badge: pendingReceivablesCount, badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
        { id: 'payables', label: 'Contas a Pagar', icon: CreditCard },
        { id: 'cashflow', label: 'Fluxo de Caixa', icon: ArrowLeftRight },
        { id: 'accounts', label: 'Contas Financeiras', icon: Wallet },
        { id: 'reserves', label: 'Reservas', icon: PiggyBank },
        { id: 'pro-labore', label: 'Pró-labore', icon: UserCheck },
      ],
    },
    {
      title: 'RECORRÊNCIA',
      items: [
        { id: 'subscriptions', label: 'Planos de Cuidado', icon: Repeat, badge: activeSubsCount, badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
        { id: 'forecast', label: 'Previsão Financeira', icon: LineChart },
      ],
    },
    {
      title: 'ESTRATÉGIA',
      items: [
        { id: 'marketing', label: 'Marketing & CAC', icon: Megaphone },
        { id: 'referrals', label: 'Indicações', icon: Gift },
        { id: 'goals', label: 'Metas', icon: Target },
        { id: 'reports', label: 'Relatórios & BI', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        { id: 'settings', label: 'Configurações', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      id="paradiso-sidebar"
      className="w-64 shrink-0 bg-[#121318]/95 border-r border-white/[0.08] h-screen flex flex-col justify-between overflow-y-auto backdrop-blur-xl z-20"
    >
      {/* Navigation Links */}
      <div className="flex-1 px-3 pt-5 pb-4 space-y-6 overflow-y-auto">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && (
              <p className="px-3 text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mb-2">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-white/[0.12] text-white shadow-sm shadow-black/30'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-medium px-2 py-0.2 rounded-full ${
                        item.badgeColor || 'bg-white/10 text-neutral-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Profile Card */}
      <div className="p-3 border-t border-white/[0.06] bg-white/[0.02]">
        <button
          onClick={() => setCurrentView('settings')}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.06] transition text-left group"
          title="Ver configurações do perfil"
        >
          <div className="relative shrink-0">
            <img
              src={data.settings.userAvatarUrl || '/user_avatar.svg'}
              alt="Foto do Usuário"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/40 shadow"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#121318]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition">
              {data.settings.userName || data.settings.ownerName || 'Luís Santos (CEO)'}
            </p>
            <p className="text-[10px] text-neutral-400 truncate">
              {data.settings.userRole || 'CEO'}
            </p>
          </div>
        </button>
      </div>

      {/* Footer Local Status & Overdue Warning */}
      <div className="p-3 border-t border-white/[0.06] bg-black/20">
        {overdueCount > 0 && (
          <div
            onClick={() => setCurrentView('receivables')}
            className="mb-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/15 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-red-400">
                {overdueCount} alerta(s) de cobrança
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-red-400" />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between px-2 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Modo Local Seguro</span>
          </div>
          <span className="text-[10px] text-neutral-400">v1.2</span>
        </div>
      </div>
    </aside>
  );
};
