import React, { useEffect } from 'react';
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
  X,
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

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const {
    currentView,
    setCurrentView,
    data,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useApp();

  // Close on Escape key press if mobile sidebar is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Active counts for badges
  const pendingReceivablesCount = data.receivables.filter(
    (r) => r.status === 'Pendente' || r.status === 'Vencido'
  ).length;

  const overdueCount =
    data.receivables.filter((r) => r.status === 'Vencido').length +
    data.subscriptions.filter((s) => s.status === 'Em atraso').length;

  const activeSubsCount = data.subscriptions.filter((s) => s.status === 'Ativo').length;

  const sections: NavSection[] = [
    {
      items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'CRM & VENDAS',
      items: [
        { id: 'clients', label: 'Clientes', icon: Users, badge: data.clients.length },
        { id: 'pipeline', label: 'Funil de Vendas', icon: KanbanSquare },
        {
          id: 'projects',
          label: 'Projetos & Serviços',
          icon: FolderKanban,
          badge: data.projects.filter((p) => p.status !== 'Finalizado' && p.status !== 'Cancelado').length,
        },
      ],
    },
    {
      title: 'FINANCEIRO',
      items: [
        {
          id: 'receivables',
          label: 'Contas a Receber',
          icon: Receipt,
          badge: pendingReceivablesCount,
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        },
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
        {
          id: 'subscriptions',
          label: 'Planos de Cuidado',
          icon: Repeat,
          badge: activeSubsCount,
          badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        },
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
      items: [{ id: 'settings', label: 'Configurações', icon: Settings }],
    },
  ];

  const handleItemClick = (id: string) => {
    setCurrentView(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderSidebarContent = (isDrawer = false) => {
    const isCollapsed = !isDrawer && isSidebarCollapsed;

    return (
      <>
        {/* Top Header */}
        <div
          className={`p-3.5 border-b border-white/[0.08] flex items-center shrink-0 bg-white/[0.02] ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ring-1 ring-white/20 shadow-[0_0_14px_rgba(59,130,246,0.35)] shrink-0 bg-[#080910]"
            >
              <img src="/logo.svg" alt="Paradiso" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30 pointer-events-none" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                  Paradiso
                  <span className="text-[9px] font-mono px-1.5 py-0.2 text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    PRO
                  </span>
                </span>
                <span className="text-[10px] text-neutral-400 truncate">Workspace Espacial</span>
              </div>
            )}
          </div>

          {isDrawer && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition"
              title="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div
          className={`flex-1 ${
            isCollapsed ? 'px-2 pt-2.5 space-y-3' : 'px-3 pt-3 space-y-5'
          } pb-4 overflow-y-auto overflow-x-hidden`}
        >
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && !isCollapsed && (
                <p className="px-3 text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mb-2">
                  {section.title}
                </p>
              )}
              {section.title && isCollapsed && sIdx > 0 && (
                <div className="h-px bg-white/[0.08] my-2 mx-1.5" />
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                if (isCollapsed) {
                  return (
                    <button
                      key={item.id}
                      id={`nav-item-${item.id}`}
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      title={item.badge ? `${item.label} (${item.badge})` : item.label}
                      className={`w-full flex items-center justify-center p-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 relative group active:scale-[0.97] ${
                        isActive
                          ? 'bg-white/[0.12] text-white border border-white/20 shadow-[0_0_15px_rgba(59,130,246,0.18)]'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-colors shrink-0 ${
                          isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
                        }`}
                      />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`absolute top-1 right-1 min-w-[15px] h-3.5 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-[#080a12] ${
                            item.badgeColor || 'bg-emerald-500 text-neutral-950'
                          }`}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group active:scale-[0.99] ${
                      isActive
                        ? 'bg-white/[0.1] text-white border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_15px_rgba(59,130,246,0.15)] font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors shrink-0 ${
                          isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
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
        <div
          className={`border-t border-white/[0.06] bg-white/[0.02] shrink-0 ${
            isCollapsed ? 'p-2 flex justify-center' : 'p-3'
          }`}
        >
          <button
            type="button"
            onClick={() => handleItemClick('settings')}
            className={`rounded-xl hover:bg-white/[0.06] transition text-left group active:scale-95 ${
              isCollapsed ? 'p-1.5 flex justify-center' : 'w-full flex items-center gap-3 p-2'
            }`}
            title={
              isCollapsed
                ? `Perfil: ${data.settings.userName || 'Luís Santos'} (${data.settings.userRole || 'CEO'})`
                : 'Ver configurações do perfil'
            }
          >
            <div className="relative shrink-0">
              <img
                src={data.settings.userAvatarUrl || '/user_avatar.svg'}
                alt="Foto do Usuário"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#121318]" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition">
                  {data.settings.userName || data.settings.ownerName || 'Luís Santos'}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">
                  {data.settings.userRole || 'CEO'}
                </p>
              </div>
            )}
          </button>
        </div>

        {/* Footer Local Status & Overdue Warning */}
        <div
          className={`border-t border-white/[0.06] bg-black/20 shrink-0 ${
            isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3'
          }`}
        >
          {overdueCount > 0 && (
            <div
              onClick={() => handleItemClick('receivables')}
              className={`rounded-lg bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/15 transition ${
                isCollapsed ? 'p-1.5 flex items-center justify-center' : 'mb-2 p-2'
              }`}
              title={`${overdueCount} alerta(s) de cobrança`}
            >
              {isCollapsed ? (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-red-400 truncate">
                    {overdueCount} alerta(s) de cobrança
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-red-400 shrink-0" />
                </div>
              )}
            </div>
          )}
          {isCollapsed ? (
            <div
              className="flex items-center justify-center text-neutral-400 p-1 cursor-help"
              title="Modo Local Seguro v1.2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[10px]">Modo Local Seguro</span>
              </div>
              <span className="text-[10px] text-neutral-400">v1.2</span>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop Persistent Sidebar (Hidden on < lg) */}
      <aside
        id="paradiso-sidebar-desktop"
        className={`hidden lg:flex shrink-0 bg-[#080a12]/85 border-r border-white/[0.08] h-screen flex-col justify-between overflow-y-auto backdrop-blur-2xl z-20 transition-all duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.5)] ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Overlay (Shown on < lg when isMobileOpen is true) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <aside
            id="paradiso-sidebar-mobile"
            className="relative w-72 max-w-[85vw] bg-[#080a12]/95 border-r border-white/10 h-full flex flex-col justify-between overflow-y-auto shadow-2xl z-10 backdrop-blur-2xl animate-in slide-in-from-left duration-200"
          >
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
