import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  calculateDashboardMetrics,
  generateAttentionAlerts,
} from '../../lib/calculations';
import { formatCurrency, formatCompactCurrency } from '../../lib/formatters';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  CreditCard,
  Repeat,
  Users,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardViewProps {
  onOpenQuickAction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenQuickAction }) => {
  const { data, period, customDateRange, setCurrentView, setSelectedClientId } = useApp();

  const metrics = calculateDashboardMetrics(
    data.clients,
    data.projects,
    data.subscriptions,
    data.receivables,
    data.payables,
    data.financialAccounts,
    period,
    customDateRange
  );

  const alerts = generateAttentionAlerts(
    data.receivables,
    data.payables,
    data.subscriptions,
    data.projects
  );

  // --- CHART 1: Receitas x Despesas por Mês (Dinâmico com dados reais) ---
  const currentYear = new Date().getFullYear();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const curMonthIndex = new Date().getMonth();

  const last4Months = [3, 2, 1, 0].map((offset) => {
    const d = new Date(currentYear, curMonthIndex - offset, 1);
    return {
      monthName: monthNames[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });

  const monthlyRevenueExpenseData = last4Months.map(({ monthName, year, month }) => {
    const monthStartStr = new Date(year, month, 1).toISOString().split('T')[0];
    const monthEndStr = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const recsInMonth = data.receivables.filter(
      (r) => r.status === 'Pago' && (r.paymentDate || r.dueDate) >= monthStartStr && (r.paymentDate || r.dueDate) <= monthEndStr
    );
    const paysInMonth = data.payables.filter(
      (p) => p.status === 'Pago' && (p.paymentDate || p.dueDate) >= monthStartStr && (p.paymentDate || p.dueDate) <= monthEndStr
    );

    const receitas = recsInMonth.reduce((sum, r) => sum + r.grossAmount, 0);
    const despesas = paysInMonth.reduce((sum, p) => sum + p.amount, 0);
    const resultado = receitas - despesas;

    return {
      month: monthName,
      receitas,
      despesas,
      resultado,
    };
  });

  // --- CHART 2: Evolução do MRR (Mensalidades ativas reais) ---
  const mrrEvolutionData = last4Months.map(({ monthName, year, month }) => {
    const endOfMonthStr = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const activeInMonth = data.subscriptions.filter(
      (s) => s.status === 'Ativo' && s.startDate <= endOfMonthStr && (!s.cancelledAt || s.cancelledAt > endOfMonthStr)
    );
    const mrr = activeInMonth.reduce((sum, s) => sum + s.monthlyValue, 0);
    return {
      mes: monthName,
      mrr,
    };
  });

  // --- CHART 3: Receita por Categoria ---
  const categoryTotals: Record<string, number> = {
    'Sites': 0,
    'Plano de Cuidado Digital': 0,
    'Serviços extras': 0,
    'Outros': 0,
  };

  data.receivables
    .filter((r) => r.status === 'Pago')
    .forEach((r) => {
      const cat = r.category in categoryTotals ? r.category : 'Outros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + r.grossAmount;
    });

  const categoryPieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));

  const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  // --- CHART 4: Contas a Receber (Em dia, Vencendo, Vencidas, Pagas) ---
  const todayStr = new Date().toISOString().split('T')[0];
  const in7DaysStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let sumPagas = 0;
  let sumVencidas = 0;
  let sumVencendo = 0;
  let sumEmDia = 0;

  data.receivables.forEach((r) => {
    if (r.status === 'Pago') {
      sumPagas += r.grossAmount;
    } else if (r.status === 'Vencido' || (r.status === 'Pendente' && r.dueDate < todayStr)) {
      sumVencidas += r.grossAmount;
    } else if (r.dueDate >= todayStr && r.dueDate <= in7DaysStr) {
      sumVencendo += r.grossAmount;
    } else {
      sumEmDia += r.grossAmount;
    }
  });

  const receivablesStatusData = [
    { status: 'Pagas', valor: sumPagas, color: '#10b981' },
    { status: 'Em Dia', valor: sumEmDia, color: '#3b82f6' },
    { status: 'Vencendo', valor: sumVencendo, color: '#f59e0b' },
    { status: 'Vencidas', valor: sumVencidas, color: '#ef4444' },
  ];

  // --- CHART 5: Origem dos Clientes ---
  const originCounts: Record<string, number> = {};
  data.clients.forEach((c) => {
    originCounts[c.origin] = (originCounts[c.origin] || 0) + 1;
  });

  const originData = Object.entries(originCounts).map(([origem, total]) => ({
    origem,
    total,
  }));

  // Custom tooltip for Apple style charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#181920] border border-white/10 p-2.5 rounded-xl shadow-xl text-xs text-white">
          <p className="font-semibold text-neutral-300 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-neutral-400 capitalize">{entry.name}:</span>
              <span className="font-semibold text-white">
                {typeof entry.value === 'number' && entry.name.toLowerCase().includes('total')
                  ? entry.value
                  : formatCurrency(entry.value)}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="dashboard-view" className="space-y-6 pb-12">
      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Painel Financeiro & CRM Paradiso
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Métricas atualizadas em tempo real. Armazenamento local autônomo.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenQuickAction}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Novo Lançamento</span>
          </button>
          <button
            onClick={() => setCurrentView('cashflow')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 text-xs font-medium hover:bg-white/[0.1] transition"
          >
            <span>Ver Fluxo de Caixa</span>
          </button>
        </div>
      </div>

      {/* SECTION: Attention / Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Atenção Imediata
              </span>
            </div>
            <span className="text-[11px] text-neutral-500">
              {alerts.length} pendência(s) detectadas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                onClick={() => alert.actionRoute && setCurrentView(alert.actionRoute)}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition hover:scale-[1.01] ${
                  alert.type === 'danger'
                    ? 'bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/15'
                    : alert.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/15'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/15'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{alert.title}</p>
                  <p className="text-[11px] text-neutral-300 truncate mt-0.5">{alert.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 opacity-70" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: 10 Core Cards requested in prompt */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Faturamento do mês */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/15 transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Faturamento</span>
            <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
              {formatCurrency(metrics.faturamentoMes)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Total vendido/contratado</p>
          </div>
        </div>

        {/* Card 2: Receita Recebida */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/15 transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Receita Recebida</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-emerald-400">
              {formatCurrency(metrics.receitaRecebida)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Líquido: {formatCurrency(metrics.receitaLiquida)}
            </p>
          </div>
        </div>

        {/* Card 3: A Receber */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/15 transition flex flex-col justify-between cursor-pointer" onClick={() => setCurrentView('receivables')}>
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>A Receber</span>
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-blue-400">
              {formatCurrency(metrics.aReceberPendente)}
            </div>
            {metrics.totalInadimplencia > 0 ? (
              <p className="text-[10px] text-red-400 font-medium mt-1">
                {formatCurrency(metrics.totalInadimplencia)} em atraso
              </p>
            ) : (
              <p className="text-[10px] text-neutral-400 mt-1">Faturas pendentes</p>
            )}
          </div>
        </div>

        {/* Card 4: A Pagar */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/15 transition flex flex-col justify-between cursor-pointer" onClick={() => setCurrentView('payables')}>
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>A Pagar</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-amber-400">
              {formatCurrency(metrics.aPagarPendente)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Despesas em aberto</p>
          </div>
        </div>

        {/* Card 5: MRR (Mensalidades Ativas) */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/15 transition flex flex-col justify-between cursor-pointer" onClick={() => setCurrentView('subscriptions')}>
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>MRR Ativo</span>
            <Repeat className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-purple-400">
              {formatCurrency(metrics.mrrContratado)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              ARR: {formatCurrency(metrics.mrrContratado * 12)}
            </p>
          </div>
        </div>

        {/* Card 6: Clientes Totais */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/15 transition flex flex-col justify-between cursor-pointer" onClick={() => setCurrentView('clients')}>
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Total Clientes</span>
            <Users className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
              {metrics.totalClientes}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Clínicas cadastradas</p>
          </div>
        </div>

        {/* Card 7: Clientes Recorrentes */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/15 transition flex flex-col justify-between cursor-pointer" onClick={() => setCurrentView('subscriptions')}>
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Recorrentes</span>
            <Repeat className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-cyan-400">
              {metrics.clientesRecorrentes}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Plano de Cuidado ativo</p>
          </div>
        </div>

        {/* Card 8: Caixa Disponível */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/15 transition flex flex-col justify-between cursor-pointer" onClick={() => setCurrentView('accounts')}>
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Caixa Disponível</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
              {formatCurrency(metrics.caixaDisponivel)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Saldos Inter, InfinitePay e Caixa</p>
          </div>
        </div>

        {/* Card 9: Resultado do Mês (Lucro) */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/15 transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Resultado Período</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <div
              className={`text-lg sm:text-xl font-bold font-mono tracking-tight ${
                metrics.resultadoMes >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {formatCurrency(metrics.resultadoMes)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Entradas - Saídas pagas</p>
          </div>
        </div>

        {/* Card 10: Inadimplência */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/15 transition flex flex-col justify-between cursor-pointer" onClick={() => setCurrentView('receivables')}>
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Inadimplência</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div>
            <div
              className={`text-lg sm:text-xl font-bold font-mono tracking-tight ${
                metrics.totalInadimplencia > 0 ? 'text-red-400' : 'text-neutral-400'
              }`}
            >
              {formatCurrency(metrics.totalInadimplencia)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Cobranças em atraso</p>
          </div>
        </div>
      </div>

      {/* SECTION: 5 Charts Requested in prompt (Section 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: Receitas x Despesas */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Receitas x Despesas</h3>
              <p className="text-xs text-neutral-400">Comparação mensal de fluxo financeiro</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Lucro: {formatCurrency(metrics.resultadoMes)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueExpenseData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resultado" name="Resultado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: Evolução do MRR */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Evolução do MRR</h3>
              <p className="text-xs text-neutral-400">Crescimento do Plano de Cuidado Digital</p>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              MRR Atual: {formatCurrency(metrics.mrrContratado)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrEvolutionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="mrr" name="MRR Mensal" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 3: Receita por Categoria */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Receita por Categoria</h3>
              <p className="text-xs text-neutral-400">Sites, Plano de Cuidado e Serviços Extras</p>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/[0.06]">
            {categoryPieData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-neutral-400 truncate">{cat.name}</span>
                </div>
                <span className="font-mono text-white font-medium ml-2 shrink-0">
                  {formatCurrency(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GRÁFICO 4: Contas a Receber (Status) */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Contas a Receber por Status</h3>
              <p className="text-xs text-neutral-400">Pagas, Em Dia, Vencendo e Vencidas</p>
            </div>
            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Total: {formatCurrency(sumPagas + sumEmDia + sumVencendo + sumVencidas)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={receivablesStatusData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="status" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" name="Valor" radius={[4, 4, 0, 0]}>
                  {receivablesStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 5: Origem dos Clientes */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Origem dos Clientes & Leads</h3>
              <p className="text-xs text-neutral-400">Canais de aquisição de clínicas e empresas</p>
            </div>
            <span className="text-xs text-neutral-400">
              {data.clients.length} cadastros totais
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={originData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="origem" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total de Clientes" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RECENT MOVEMENTS & PIPELINE SNAPSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Receivables */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Últimos Recebimentos</h3>
            <button
              onClick={() => setCurrentView('receivables')}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {data.receivables.slice(0, 5).map((r) => {
              const client = data.clients.find((c) => c.id === r.clientId)?.companyName || 'Cliente';
              return (
                <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{client}</p>
                    <p className="text-neutral-400 truncate text-[11px]">{r.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-mono font-semibold text-white">{formatCurrency(r.grossAmount)}</p>
                    <span
                      className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        r.status === 'Pago'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : r.status === 'Vencido'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Subscriptions Summary */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Plano de Cuidado Digital</h3>
            <button
              onClick={() => setCurrentView('subscriptions')}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition"
            >
              <span>Gerenciar assinaturas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {data.subscriptions.map((s) => {
              const client = data.clients.find((c) => c.id === s.clientId)?.companyName || 'Cliente';
              return (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-white">{client}</p>
                    <p className="text-neutral-400 text-[11px]">
                      Vencimento todo dia {s.dueDay} • Próx: {s.nextDueDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-purple-400">
                      {formatCurrency(s.monthlyValue)}/mês
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        s.status === 'Ativo'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : s.status === 'Em atraso'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
