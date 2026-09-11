import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  Target,
  TrendingUp,
  Users,
  Repeat,
  DollarSign,
  Edit2,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Flame,
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { data, updateGoals } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [revenueGoal, setRevenueGoal] = useState(data.goals?.monthlyRevenueGoal?.toString() || '10000');
  const [mrrGoal, setMrrGoal] = useState(data.goals?.monthlyMrrGoal?.toString() || '3500');
  const [clientsGoal, setClientsGoal] = useState(data.goals?.totalClientsGoal?.toString() || '20');
  const [recurringGoal, setRecurringGoal] = useState(data.goals?.recurringClientsGoal?.toString() || '15');

  // Current calculations
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const currentMonthReceivables = data.receivables.filter(
    (r) => (r.paymentDate || r.dueDate || '').startsWith(currentMonthPrefix)
  );

  const currentRevenue = currentMonthReceivables.reduce((sum, r) => sum + r.grossAmount, 0);
  const currentMrr = data.subscriptions
    .filter((s) => s.status === 'Ativo')
    .reduce((sum, s) => sum + s.monthlyValue, 0);

  const activeClientsCount = data.clients.filter(
    (c) => c.status === 'Cliente ativo' || c.status === 'Cliente recorrente'
  ).length;

  const activeRecurringCount = data.subscriptions.filter((s) => s.status === 'Ativo').length;

  // Goals targets
  const targetRevenue = data.goals?.monthlyRevenueGoal || 10000;
  const targetMrr = data.goals?.monthlyMrrGoal || 3500;
  const targetClients = data.goals?.totalClientsGoal || 20;
  const targetRecurring = data.goals?.recurringClientsGoal || 15;

  // Percentages (capped at 100 for progress bar, but showing real % in text)
  const revenuePct = Math.round((currentRevenue / (targetRevenue || 1)) * 100);
  const mrrPct = Math.round((currentMrr / (targetMrr || 1)) * 100);
  const clientsPct = Math.round((activeClientsCount / (targetClients || 1)) * 100);
  const recurringPct = Math.round((activeRecurringCount / (targetRecurring || 1)) * 100);

  // Gap analysis
  const revenueGap = Math.max(0, targetRevenue - currentRevenue);
  const mrrGap = Math.max(0, targetMrr - currentMrr);
  const sitesNeeded = Math.ceil(revenueGap / 997);
  const plansNeeded = Math.ceil(mrrGap / 197);

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoals({
      monthlyRevenueGoal: parseFloat(revenueGoal) || 10000,
      monthlyMrrGoal: parseFloat(mrrGoal) || 3500,
      totalClientsGoal: parseInt(clientsGoal, 10) || 20,
      recurringClientsGoal: parseInt(recurringGoal, 10) || 15,
    });
    setIsEditModalOpen(false);
  };

  return (
    <div id="goals-module" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Metas & Objetivos do Negócio</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Acompanhamento de faturamento mensal, expansão de MRR e carteira de clientes ativos.
          </p>
        </div>

        <button
          onClick={() => {
            setRevenueGoal(targetRevenue.toString());
            setMrrGoal(targetMrr.toString());
            setClientsGoal(targetClients.toString());
            setRecurringGoal(targetRecurring.toString());
            setIsEditModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0 shadow-sm"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Configurar Metas</span>
        </button>
      </div>

      {/* Main 4 Goals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Goal 1: Monthly Revenue */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 font-medium">Faturamento Mensal</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {formatCurrency(currentRevenue)}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-400">Meta: {formatCurrency(targetRevenue)}</span>
              <span className={`font-semibold ${revenuePct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {revenuePct}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  revenuePct >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, revenuePct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Goal 2: Monthly MRR */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 font-medium">MRR Recorrente</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {formatCurrency(currentMrr)}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Repeat className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-400">Meta: {formatCurrency(targetMrr)}</span>
              <span className={`font-semibold ${mrrPct >= 100 ? 'text-emerald-400' : 'text-purple-400'}`}>
                {mrrPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  mrrPct >= 100 ? 'bg-emerald-400' : 'bg-purple-400'
                }`}
                style={{ width: `${Math.min(100, mrrPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Goal 3: Total Clients */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 font-medium">Clientes Ativos</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {activeClientsCount}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-400">Meta: {targetClients} clínicas</span>
              <span className={`font-semibold ${clientsPct >= 100 ? 'text-emerald-400' : 'text-blue-400'}`}>
                {clientsPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  clientsPct >= 100 ? 'bg-emerald-400' : 'bg-blue-400'
                }`}
                style={{ width: `${Math.min(100, clientsPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Goal 4: Recurring Subscriptions */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 font-medium">Planos de Cuidado Ativos</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {activeRecurringCount}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-400">Meta: {targetRecurring} planos</span>
              <span className={`font-semibold ${recurringPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {recurringPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  recurringPct >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, recurringPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Gap & Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gap to Revenue Goal */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Plano de Ação para Meta de Faturamento</h3>
          </div>

          {revenueGap <= 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Parabéns! A meta de faturamento mensal foi batida com sucesso!</span>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <p className="text-neutral-300 leading-relaxed">
                Faltam <strong className="font-mono text-amber-400">{formatCurrency(revenueGap)}</strong> para atingir a meta de {formatCurrency(targetRevenue)} no mês.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-neutral-400 block text-[11px]">Em Sites Avulsos (R$ 997)</span>
                  <span className="text-lg font-bold font-mono text-white mt-1 block">
                    {sitesNeeded} vendas
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-neutral-400 block text-[11px]">Em Combos Site+Plano (R$ 697)</span>
                  <span className="text-lg font-bold font-mono text-white mt-1 block">
                    {Math.ceil(revenueGap / 697)} vendas
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gap to MRR Goal */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Construção da Recorrência (MRR)</h3>
          </div>

          {mrrGap <= 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Excelente! A meta de MRR foi superada. A previsibilidade do negócio está forte.</span>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <p className="text-neutral-300 leading-relaxed">
                Faltam <strong className="font-mono text-purple-400">{formatCurrency(mrrGap)}/mês</strong> em assinaturas para atingir a meta de {formatCurrency(targetMrr)}.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-neutral-400 block text-[11px]">Novos Planos de Cuidado (R$ 197)</span>
                  <span className="text-lg font-bold font-mono text-white mt-1 block">
                    +{plansNeeded} adesões
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-neutral-400 block text-[11px]">Receita Anual Prevista (ARR)</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
                    {formatCurrency(currentMrr * 12)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT GOALS MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Configurar Metas do Negócio"
        subtitle="Defina os parâmetros estratégicos da Paradiso"
      >
        <form onSubmit={handleSaveGoals} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Meta de Faturamento Mensal (R$)
            </label>
            <input
              type="number"
              step="100"
              value={revenueGoal}
              onChange={(e) => setRevenueGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Meta de MRR Recorrente (R$/mês)
            </label>
            <input
              type="number"
              step="50"
              value={mrrGoal}
              onChange={(e) => setMrrGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Meta de Clientes Totais
              </label>
              <input
                type="number"
                step="1"
                value={clientsGoal}
                onChange={(e) => setClientsGoal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Meta de Planos Recorrentes
              </label>
              <input
                type="number"
                step="1"
                value={recurringGoal}
                onChange={(e) => setRecurringGoal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Salvar Metas
          </button>
        </form>
      </Modal>
    </div>
  );
};
