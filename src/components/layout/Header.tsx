import React, { useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Lock,
  Calendar,
  ChevronDown,
  Sparkles,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PeriodFilter } from '../../types';
import { generateAttentionAlerts } from '../../lib/calculations';

interface HeaderProps {
  onOpenQuickAction: () => void;
  onOpenGlobalSearch: () => void;
  onOpenAlertsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickAction,
  onOpenGlobalSearch,
  onOpenAlertsModal,
}) => {
  const {
    period,
    setPeriod,
    customDateRange,
    setCustomDateRange,
    currentView,
    setCurrentView,
    setIsLocked,
    data,
    supabaseSyncState,
    supabaseSyncMessage,
  } = useApp();

  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

  // Generate alerts
  const alerts = generateAttentionAlerts(
    data.receivables,
    data.payables,
    data.subscriptions,
    data.projects
  );

  const dangerAlertsCount = alerts.filter((a) => a.type === 'danger').length;

  const viewTitles: Record<string, { title: string; subtitle: string }> = {
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
      className="h-16 px-6 bg-[#0f1014]/90 border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl"
    >
      {/* View Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold tracking-tight text-white">
            {currentViewInfo.title}
          </h1>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
        <p className="text-xs text-neutral-400 font-normal">
          {currentViewInfo.subtitle}
        </p>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Period Selector (Relevant on Dashboard, Cashflow, Receivables, Payables, Reports) */}
        <div className="relative">
          <button
            id="period-filter-btn"
            onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-medium text-neutral-200 hover:bg-white/[0.1] transition"
          >
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>{periodLabels[period]}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {periodDropdownOpen && (
            <div
              className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#1a1b22] border border-white/10 shadow-2xl py-1 z-30 backdrop-blur-2xl"
              onClick={() => setPeriodDropdownOpen(false)}
            >
              {(Object.keys(periodLabels) as PeriodFilter[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition flex items-center justify-between ${
                    period === key
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <span>{periodLabels[key]}</span>
                  {period === key && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Button */}
        <button
          id="global-search-btn"
          onClick={onOpenGlobalSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] transition"
          title="Buscar clientes, faturas, projetos (Ctrl+K ou Cmd+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Buscar...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[10px] bg-white/10 text-neutral-400 rounded font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Attention Alerts Button */}
        <button
          id="alerts-btn"
          onClick={onOpenAlertsModal}
          className={`relative p-2 rounded-lg border transition ${
            alerts.length > 0
              ? 'bg-white/[0.05] border-white/10 text-neutral-200 hover:bg-white/10'
              : 'bg-white/[0.02] border-white/5 text-neutral-400'
          }`}
          title="Central de Alertas e Atenção"
        >
          <Bell className="w-4 h-4" />
          {alerts.length > 0 && (
            <span
              className={`absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center text-white ${
                dangerAlertsCount > 0 ? 'bg-red-500' : 'bg-amber-500'
              }`}
            >
              {alerts.length}
            </span>
          )}
        </button>

        {/* Quick Action Button */}
        <button
          id="quick-action-btn"
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-neutral-900 text-xs font-semibold hover:bg-neutral-200 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Ação Rápida</span>
        </button>

        {/* Supabase Database Status Pill */}
        <button
          id="supabase-status-header-btn"
          onClick={() => {
            setCurrentView('settings');
            window.dispatchEvent(new CustomEvent('open-settings-tab', { detail: 'supabase' }));
          }}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition group ${
            supabaseSyncState === 'syncing'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20'
              : supabaseSyncState === 'synced'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20'
              : supabaseSyncState === 'error'
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/20'
              : 'bg-white/[0.04] border-white/10 text-neutral-300 hover:bg-white/[0.08]'
          }`}
          title={supabaseSyncMessage || 'Banco de Dados Supabase (uzidzjkolebplnyipwlz.supabase.co) - Clique para gerenciar'}
        >
          {supabaseSyncState === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          ) : supabaseSyncState === 'synced' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-500" />
              <Database className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
            </>
          ) : supabaseSyncState === 'error' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-500" />
              <Database className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <Database className="w-3.5 h-3.5 text-neutral-400 group-hover:scale-110 transition" />
            </>
          )}
          <span className="text-[11px] font-medium text-white">
            {supabaseSyncState === 'syncing'
              ? 'Salvando no Supabase...'
              : supabaseSyncState === 'synced'
              ? 'Supabase Nuvem'
              : supabaseSyncState === 'error'
              ? 'Supabase (Aguardando SQL)'
              : 'Supabase'}
          </span>
        </button>

        {/* Lock Screen Button */}
        <button
          id="lock-screen-btn"
          onClick={() => setIsLocked(true)}
          className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] transition"
          title="Bloquear sessão local"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* User Profile Avatar Pill */}
        <button
          id="user-profile-header-btn"
          onClick={() => setCurrentView('settings')}
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition text-left group"
          title="Meu Perfil / Configurações"
        >
          <div className="relative">
            <img
              src={data.settings.userAvatarUrl || '/user_avatar.svg'}
              alt="Foto de Perfil"
              className="w-7 h-7 rounded-full object-cover ring-1.5 ring-blue-400/60 shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-[#0d0e12]" />
          </div>
          <div className="hidden lg:block text-left pr-0.5">
            <p className="text-[11px] font-semibold text-white leading-tight group-hover:text-blue-300 transition truncate max-w-[140px]">
              {data.settings.userName || data.settings.ownerName || 'Luís Santos (CEO)'}
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
