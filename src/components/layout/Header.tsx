import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Bell,
  Lock,
  Calendar,
  ChevronDown,
  Database,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PeriodFilter } from '../../types';
import { generateAttentionAlerts } from '../../lib/calculations';

interface HeaderProps {
  onOpenQuickAction: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenAlertsModal: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickAction,
  onOpenAlertsModal,
  onToggleMobileSidebar,
}) => {
  const {
    period,
    setPeriod,
    currentView,
    setCurrentView,
    setIsLocked,
    data,
    supabaseSyncState,
    supabaseSyncMessage,
    pullFromSupabase,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useApp();

  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPeriodDropdownOpen(false);
      }
    };
    if (periodDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [periodDropdownOpen]);

  // Generate alerts
  const alerts = generateAttentionAlerts(
    data.receivables,
    data.payables,
    data.subscriptions,
    data.projects
  );

  const dangerAlertsCount = alerts.filter((a) => a.type === 'danger').length;

  const viewTitles: Record<string, { title: string; subtitle: string; tag?: string }> = {
    dashboard: { title: 'Visão Geral', subtitle: 'Painel executivo financeiro e operacional' },
    clients: { title: 'CRM & Clientes', subtitle: 'Base cadastral e histórico financeiro por clínica' },
    pipeline: { title: 'Funil de Vendas', subtitle: 'Pipeline de qualificação e fechamento de contratos' },
    projects: { title: 'Projetos & Serviços', subtitle: 'Acompanhamento de entregas e catálogo de serviços' },
    receivables: { title: 'Contas a Receber', subtitle: 'Gestão de faturas, parcelas e controle InfinitePay' },
    payables: { title: 'Contas a Pagar', subtitle: 'Despesas operacionais e custos fixos da agência' },
    cashflow: { title: 'Fluxo de Caixa', subtitle: 'Demonstrativo real de entradas, saídas e saldo líquido' },
    accounts: { title: 'Contas Financeiras', subtitle: 'Saldos bancários e transferências internas' },
    reserves: { title: 'Reservas Estratégicas', subtitle: 'Alocações para emergência, impostos e equipamentos' },
    'pro-labore': { title: 'Pró-labore', subtitle: 'Retiradas de sócios segregadas de custos operacionais' },
    subscriptions: { title: 'Plano de Cuidado Digital', subtitle: 'Contratos recorrentes ativos e controle de MRR' },
    forecast: { title: 'Previsão Financeira', subtitle: 'Projeção futura de receitas e despesas até 12 meses' },
    marketing: { title: 'Marketing & CAC', subtitle: 'Investimentos em anúncios, conversão e retorno sobre gasto' },
    referrals: { title: 'Programa de Indicações', subtitle: 'Comissões de médicos e parceiros que indicam clientes' },
    goals: { title: 'Metas do Negócio', subtitle: 'Acompanhamento de objetivos de faturamento e MRR' },
    reports: { title: 'Relatórios & BI', subtitle: 'Métricas vitais do negócio, exportações CSV e auditoria' },
    settings: { title: 'Configurações', subtitle: 'Preferências locais, categorias, backups e segurança' },
  };

  const periodLabels: Record<PeriodFilter, string> = {
    today: 'Hoje',
    this_week: 'Esta semana',
    this_month: 'Este mês',
    last_month: 'Mês anterior',
    last_30_days: 'Últimos 30 dias',
    last_90_days: 'Últimos 90 dias',
    this_year: 'Este ano',
    custom: 'Personalizado',
  };

  const currentViewInfo = viewTitles[currentView] || {
    title: 'Paradiso Gestão',
    subtitle: 'Sistema local de gestão de alta performance',
  };

  return (
    <header
      id="paradiso-header"
      className="h-16 px-3 sm:px-6 bg-[#0f1014]/90 border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl transition-all"
    >
      {/* Left: Mobile Menu Toggle + Desktop Sidebar Toggle + View Title & Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        {onToggleMobileSidebar && (
          <button
            id="mobile-menu-toggle-btn"
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white transition active:scale-[0.98] shrink-0"
            title="Abrir menu de navegação"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <button
          id="desktop-sidebar-collapse-btn"
          type="button"
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white transition active:scale-[0.98] shrink-0"
          title={isSidebarCollapsed ? 'Expandir barra lateral (Ctrl+B)' : 'Compactar barra lateral (Ctrl+B)'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-xs sm:text-base font-bold tracking-tight text-white truncate max-w-[150px] sm:max-w-none">
              {currentViewInfo.title}
            </h1>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 hidden sm:inline-block" />
          </div>
          <p className="text-[10px] sm:text-xs text-neutral-400 font-normal truncate mt-0.5 hidden sm:block">
            {currentViewInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls Container */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Period Selector with Unified Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="period-filter-btn"
            type="button"
            onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-neutral-200 transition active:scale-[0.98]"
            title="Filtrar período operacional"
          >
            <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate max-w-[70px] sm:max-w-none">{periodLabels[period]}</span>
            <ChevronDown
              className={`w-3 h-3 text-neutral-400 transition-transform duration-200 shrink-0 ${
                periodDropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {periodDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#15161d] border border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl animate-fadeIn"
            >
              <div className="px-2.5 py-1 mb-1 border-b border-white/5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500">
                  Período de Análise
                </span>
              </div>
              {(Object.keys(periodLabels) as PeriodFilter[]).map((key) => {
                const isSelected = period === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPeriod(key);
                      setPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-white/15 text-white font-semibold'
                        : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{periodLabels[key]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-white/[0.08] hidden sm:block" />

        {/* Cohesive Supabase Sync Capsule */}
        <div className="hidden md:flex items-center rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/15 transition overflow-hidden">
          <button
            id="supabase-status-header-btn"
            type="button"
            onClick={() => {
              setCurrentView('settings');
              window.dispatchEvent(new CustomEvent('open-settings-tab', { detail: 'supabase' }));
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs transition hover:bg-white/[0.04]"
            title={
              supabaseSyncMessage ||
              'Banco de Dados Supabase Conectado - Clique para gerenciar configurações'
            }
          >
            {supabaseSyncState === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            ) : supabaseSyncState === 'synced' ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : supabaseSyncState === 'error' ? (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
            )}
            <Database className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-[11px] font-medium text-neutral-200 hidden lg:inline">
              {supabaseSyncState === 'syncing'
                ? 'Sincronizando'
                : supabaseSyncState === 'synced'
                ? 'Supabase Conectado'
                : supabaseSyncState === 'error'
                ? 'Atenção Supabase'
                : 'Supabase'}
            </span>
          </button>

          <div className="h-4 w-px bg-white/10" />

          <button
            id="supabase-quick-refresh-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              pullFromSupabase();
            }}
            title="Sincronizar agora com Supabase"
            className="px-2 py-1.5 text-neutral-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                supabaseSyncState === 'syncing' ? 'animate-spin text-blue-400' : ''
              }`}
            />
          </button>
        </div>

        {/* Attention Alerts Modal Button */}
        <button
          id="alerts-btn"
          type="button"
          onClick={onOpenAlertsModal}
          className={`relative p-2 rounded-xl border transition active:scale-[0.98] shrink-0 ${
            alerts.length > 0
              ? 'bg-white/[0.04] border-white/10 text-neutral-200 hover:bg-white/[0.08]'
              : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-neutral-200'
          }`}
          title={`Notificações do sistema (${alerts.length} pendência(s))`}
        >
          <Bell className="w-4 h-4" />
          {alerts.length > 0 && (
            <span
              className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] font-bold rounded-full flex items-center justify-center text-white shadow-sm ${
                dangerAlertsCount > 0 ? 'bg-red-500' : 'bg-amber-500'
              }`}
            >
              {alerts.length}
            </span>
          )}
        </button>

        {/* Lock Session Button */}
        <button
          id="lock-screen-btn"
          type="button"
          onClick={() => setIsLocked(true)}
          className="hidden sm:flex p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-400 hover:text-neutral-200 transition active:scale-[0.98] shrink-0"
          title="Bloquear sessão (Segurança)"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* Separator */}
        <div className="h-5 w-px bg-white/[0.08] hidden sm:block" />

        {/* Primary CTA: Ação Rápida */}
        <button
          id="quick-action-btn"
          type="button"
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold shadow-sm transition active:scale-[0.98] shrink-0"
          title="Cadastrar nova entrada, saída ou ação rápida"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline whitespace-nowrap">Ação Rápida</span>
        </button>

        {/* User Profile Pill */}
        <button
          id="user-profile-header-btn"
          type="button"
          onClick={() => setCurrentView('settings')}
          className="flex items-center gap-2 pl-1 pr-1 sm:pr-2.5 py-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition text-left group shrink-0 active:scale-[0.98]"
          title="Meu Perfil e Configurações"
        >
          <div className="relative">
            <img
              src={data.settings.userAvatarUrl || '/user_avatar.svg'}
              alt="Foto de Perfil"
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/15"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0f1014]" />
          </div>
          <div className="hidden xl:block text-left pr-0.5">
            <p className="text-[11px] font-semibold text-white leading-tight group-hover:text-blue-300 transition truncate max-w-[130px]">
              {data.settings.userName || data.settings.ownerName || 'Luís Santos'}
            </p>
            <p className="text-[9px] text-neutral-400 leading-tight">
              {data.settings.userRole || 'CEO'}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};
