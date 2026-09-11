import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Wallet,
  Filter,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export interface CashflowTransaction {
  id: string;
  originId: string;
  originType: 'receivable' | 'payable';
  date: string;
  description: string;
  category: string;
  entityName: string; // Client or Supplier
  type: 'inflow' | 'outflow';
  isForecast: boolean;
  amount: number;
  accountId?: string;
  accountName: string;
  status: 'Pago' | 'Pendente' | 'Vencido' | 'Cancelado';
  paymentMethod: string;
}

export const CashflowView: React.FC = () => {
  const {
    data,
    deleteReceivable,
    deletePayable,
    setCurrentView,
  } = useApp();

  // Filters
  const [flowTypeFilter, setFlowTypeFilter] = useState<'all' | 'realized' | 'forecast'>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'this_month' | 'next_30_days' | 'this_year'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Delete modal state
  const [transactionToDelete, setTransactionToDelete] = useState<CashflowTransaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Today's date string for comparisons
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Construct comprehensive cashflow timeline from receivables and payables
  const allTransactions = useMemo(() => {
    const list: CashflowTransaction[] = [];

    // 1. Receivables (Realized & Forecast)
    (data.receivables || []).forEach((r) => {
      const client = data.clients.find((c) => c.id === r.clientId)?.companyName || 'Cliente';
      const acc = data.financialAccounts.find((a) => a.id === r.accountId)?.name || 'Conta PJ';
      const isPaid = r.status === 'Pago';
      const date = isPaid ? (r.paymentDate || r.dueDate) : r.dueDate;
      const amount = r.netAmount || r.grossAmount;

      list.push({
        id: `rec-${r.id}`,
        originId: r.id,
        originType: 'receivable',
        date: date || todayStr,
        description: r.description,
        category: r.category || 'Receitas',
        entityName: client,
        type: 'inflow',
        isForecast: !isPaid,
        amount,
        accountId: r.accountId,
        accountName: acc,
        status: r.status,
        paymentMethod: r.paymentMethod || 'Pix',
      });
    });

    // 2. Payables (Realized & Forecast)
    (data.payables || []).forEach((p) => {
      const acc = data.financialAccounts.find((a) => a.id === p.accountId)?.name || 'Conta PJ';
      const isPaid = p.status === 'Pago';
      const date = isPaid ? (p.paymentDate || p.dueDate) : p.dueDate;

      list.push({
        id: `pay-${p.id}`,
        originId: p.id,
        originType: 'payable',
        date: date || todayStr,
        description: p.description,
        category: p.category || 'Despesas',
        entityName: p.supplier || 'Fornecedor',
        type: 'outflow',
        isForecast: !isPaid,
        amount: p.amount,
        accountId: p.accountId,
        accountName: acc,
        status: p.status,
        paymentMethod: p.paymentMethod || 'Pix',
      });
    });

    // Sort chronologically: future/recent dates first
    return list.sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [data.receivables, data.payables, data.clients, data.financialAccounts, todayStr]);

  // Filtered transactions based on user selection
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      // 1. Flow type filter
      if (flowTypeFilter === 'realized' && t.isForecast) return false;
      if (flowTypeFilter === 'forecast' && !t.isForecast) return false;

      // 2. Account filter
      if (selectedAccountId !== 'all' && t.accountId !== selectedAccountId) {
        return false;
      }

      // 3. Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.entityName.toLowerCase().includes(query) ||
          t.accountName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // 4. Period filter
      if (periodFilter === 'this_month') {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const monthPrefix = `${year}-${month}`;
        if (!t.date.startsWith(monthPrefix)) return false;
      } else if (periodFilter === 'next_30_days') {
        const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (t.date < todayStr || t.date > in30Days) return false;
      } else if (periodFilter === 'this_year') {
        const year = new Date().getFullYear().toString();
        if (!t.date.startsWith(year)) return false;
      }

      return true;
    });
  }, [allTransactions, flowTypeFilter, selectedAccountId, searchTerm, periodFilter, todayStr]);

  // Financial Accounts Totals
  const currentAvailableBalance = useMemo(() => {
    if (selectedAccountId !== 'all') {
      const acc = data.financialAccounts.find((a) => a.id === selectedAccountId);
      return acc ? acc.balance : 0;
    }
    return data.financialAccounts.reduce((sum, a) => sum + a.balance, 0);
  }, [data.financialAccounts, selectedAccountId]);

  // KPIs calculation
  const realizedInflows = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'inflow' && !t.isForecast).reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );
  const forecastInflows = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'inflow' && t.isForecast).reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );
  const totalInflows = realizedInflows + forecastInflows;

  const realizedOutflows = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'outflow' && !t.isForecast).reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );
  const forecastOutflows = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'outflow' && t.isForecast).reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );
  const totalOutflows = realizedOutflows + forecastOutflows;

  const netCashflow = totalInflows - totalOutflows;
  const projectedFutureBalance = currentAvailableBalance + forecastInflows - forecastOutflows;

  // Chart data: chronological cumulative progression
  const chartData = useMemo(() => {
    const sortedChronological = [...filteredTransactions].reverse();
    let balance = currentAvailableBalance;

    // Start with a base point if list has items
    return sortedChronological.map((item) => {
      if (item.type === 'inflow') balance += item.amount;
      else balance -= item.amount;

      return {
        date: formatDate(item.date),
        saldo: balance,
        inflow: item.type === 'inflow' ? item.amount : 0,
        outflow: item.type === 'outflow' ? item.amount : 0,
        isForecast: item.isForecast,
      };
    });
  }, [filteredTransactions, currentAvailableBalance]);

  // Delete handler
  const handleOpenDelete = (transaction: CashflowTransaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!transactionToDelete) return;

    if (transactionToDelete.originType === 'receivable') {
      deleteReceivable(transactionToDelete.originId);
      setActionSuccessMessage(
        `Conta a receber "${transactionToDelete.description}" removida com sucesso. Fluxo de caixa atualizado.`
      );
    } else {
      deletePayable(transactionToDelete.originId);
      setActionSuccessMessage(
        `Conta a pagar "${transactionToDelete.description}" removida com sucesso. Fluxo de caixa atualizado.`
      );
    }

    setIsDeleteModalOpen(false);
    setTransactionToDelete(null);

    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  return (
    <div id="cashflow-module" className="space-y-6 pb-12">
      {/* Top Notification Banner if action succeeded */}
      {actionSuccessMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Header & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Fluxo de Caixa Operacional</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Visão unificada em tempo real de entradas e saídas realizadas e projetadas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentView('receivables')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 text-xs hover:bg-white/[0.08] transition"
          >
            <span>Contas a Receber</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentView('payables')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 text-xs hover:bg-white/[0.08] transition"
          >
            <span>Contas a Pagar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards: 5 Essential Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Saldo em Conta */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Saldo Atual em Caixa</span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {formatCurrency(currentAvailableBalance)}
          </p>
          <span className="text-[10px] text-neutral-500">
            {selectedAccountId === 'all' ? 'Soma das contas ativas' : 'Saldo da conta selecionada'}
          </span>
        </div>

        {/* 2. Entradas */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Total de Entradas</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowDownLeft className="w-4 h-4" />
            <span>{formatCurrency(totalInflows)}</span>
          </p>
          <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
            <span>{formatCurrency(realizedInflows)} realiz.</span>
            {forecastInflows > 0 && (
              <span className="text-emerald-500/80 font-mono">
                (+{formatCurrency(forecastInflows)} prev.)
              </span>
            )}
          </span>
        </div>

        {/* 3. Saídas */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Total de Saídas</span>
          <p className="text-xl font-bold font-mono text-red-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>{formatCurrency(totalOutflows)}</span>
          </p>
          <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
            <span>{formatCurrency(realizedOutflows)} pagas</span>
            {forecastOutflows > 0 && (
              <span className="text-red-400/80 font-mono">
                (+{formatCurrency(forecastOutflows)} prev.)
              </span>
            )}
          </span>
        </div>

        {/* 4. Saldo Líquido do Período */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Resultado do Período</span>
          <p
            className={`text-xl font-bold font-mono mt-1 ${
              netCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(netCashflow)}
          </p>
          <span className="text-[10px] text-neutral-500">Entradas - Saídas</span>
        </div>

        {/* 5. Saldo Final Projetado */}
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Saldo Projetado</span>
          <p
            className={`text-xl font-bold font-mono mt-1 ${
              projectedFutureBalance >= 0 ? 'text-blue-400' : 'text-amber-400'
            }`}
          >
            {formatCurrency(projectedFutureBalance)}
          </p>
          <span className="text-[10px] text-neutral-500">Após compensar previsões</span>
        </div>
      </div>

      {/* Filter Toolbar: Flow Mode, Accounts, Period, and Search */}
      <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Flow Mode Tabs */}
          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/5 overflow-x-auto">
            <button
              onClick={() => setFlowTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                flowTypeFilter === 'all'
                  ? 'bg-white text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos ({allTransactions.length})
            </button>
            <button
              onClick={() => setFlowTypeFilter('realized')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                flowTypeFilter === 'realized'
                  ? 'bg-emerald-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Realizado ({allTransactions.filter((t) => !t.isForecast).length})
            </button>
            <button
              onClick={() => setFlowTypeFilter('forecast')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                flowTypeFilter === 'forecast'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Previsto ({allTransactions.filter((t) => t.isForecast).length})
            </button>
          </div>

          {/* Account Filter & Period Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1.5">
              <Wallet className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-[#181920]">
                  Todas as Contas
                </option>
                {data.financialAccounts.map((a) => (
                  <option key={a.id} value={a.id} className="bg-[#181920]">
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-[#181920]">
                  Todo o Período
                </option>
                <option value="this_month" className="bg-[#181920]">
                  Este Mês
                </option>
                <option value="next_30_days" className="bg-[#181920]">
                  Próximos 30 Dias
                </option>
                <option value="this_year" className="bg-[#181920]">
                  Ano Atual
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar lançamentos por descrição, cliente, fornecedor ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/20 transition"
          />
        </div>
      </div>

      {/* Chart: Cash Movement Evolution */}
      {chartData.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Evolução do Saldo de Caixa</h3>
              <p className="text-xs text-neutral-400">
                Trajetória do saldo acumulado considerando entradas e saídas
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
              Saldo Atual: {formatCurrency(currentAvailableBalance)}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181920',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [formatCurrency(val), 'Saldo Acumulado']}
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCash)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Extrato do Fluxo de Caixa (Statement Table) */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Extrato Operacional de Caixa</h3>
            <p className="text-xs text-neutral-400">
              Movimentações registradas e sincronizadas diretamente com Contas a Pagar e Receber
            </p>
          </div>
          <span className="text-xs text-neutral-400 bg-white/[0.04] px-2.5 py-1 rounded-xl border border-white/5">
            {filteredTransactions.length} lançamento(s) exibido(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium">
                <th className="p-4 whitespace-nowrap">Data</th>
                <th className="p-4 min-w-[220px]">Descrição da Operação</th>
                <th className="p-4 whitespace-nowrap">Vínculo / Entidade</th>
                <th className="p-4 whitespace-nowrap">Categoria</th>
                <th className="p-4 whitespace-nowrap">Conta</th>
                <th className="p-4 text-center whitespace-nowrap">Fluxo & Status</th>
                <th className="p-4 text-right whitespace-nowrap">Valor</th>
                <th className="p-4 text-center whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-neutral-500">
                    <p className="text-sm text-neutral-400 font-medium">
                      Nenhum lançamento financeiro encontrado para os filtros selecionados.
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Ao registrar ou remover lançamentos em Contas a Pagar ou Receber, o fluxo é atualizado automaticamente.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition">
                    {/* Date */}
                    <td className="p-4 text-neutral-300 font-mono whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>

                    {/* Description */}
                    <td className="p-4">
                      <p className="font-semibold text-white">{t.description}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {t.originType === 'receivable' ? 'Recebimento' : 'Pagamento / Despesa'} •{' '}
                        {t.paymentMethod}
                      </p>
                    </td>

                    {/* Entity (Client or Supplier) */}
                    <td className="p-4 text-neutral-300 whitespace-nowrap font-medium">
                      {t.entityName}
                    </td>

                    {/* Category */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 text-[11px]">
                        {t.category}
                      </span>
                    </td>

                    {/* Bank Account */}
                    <td className="p-4 text-neutral-300 whitespace-nowrap">
                      {t.accountName}
                    </td>

                    {/* Type & Status Tag */}
                    <td className="p-4 text-center whitespace-nowrap">
                      {t.type === 'inflow' ? (
                        t.isForecast ? (
                          <span className="px-2.5 py-1 rounded-lg font-medium text-[11px] inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Clock className="w-3 h-3" />
                            <span>Entrada Prevista</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg font-medium text-[11px] inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>Entrada Realizada</span>
                          </span>
                        )
                      ) : t.isForecast ? (
                        <span className="px-2.5 py-1 rounded-lg font-medium text-[11px] inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Saída Prevista</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg font-medium text-[11px] inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Saída Realizada</span>
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td
                      className={`p-4 text-right font-mono font-bold whitespace-nowrap ${
                        t.type === 'inflow' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {t.type === 'inflow' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDelete(t)}
                        title="Remover lançamento e recalcular saldos"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal: Delete from Cashflow */}
      {isDeleteModalOpen && transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#181920] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remover Lançamento</h3>
                <p className="text-xs text-neutral-400">
                  {transactionToDelete.originType === 'receivable'
                    ? 'Exclusão em Contas a Receber'
                    : 'Exclusão em Contas a Pagar'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Operação:</span>
                <span className="text-white font-medium">{transactionToDelete.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Entidade:</span>
                <span className="text-neutral-200">{transactionToDelete.entityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Data:</span>
                <span className="text-neutral-200">{formatDate(transactionToDelete.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Valor:</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(transactionToDelete.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Status atual:</span>
                <span className="text-neutral-200 font-medium">{transactionToDelete.status}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              {transactionToDelete.status === 'Pago'
                ? transactionToDelete.originType === 'receivable'
                  ? 'Como este recebimento já foi liquidado, o valor creditado será estornado do saldo bancário e o fluxo de caixa será imediatamente recalculado.'
                  : 'Como esta despesa já foi liquidada, o valor debitado será estornado de volta ao saldo bancário e o fluxo de caixa será imediatamente recalculado.'
                : 'Este lançamento pendente será removido da base de dados e o fluxo de caixa projetado será recalculado.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTransactionToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
