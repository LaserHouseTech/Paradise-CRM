import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  FileSpreadsheet,
  Download,
  DollarSign,
  TrendingUp,
  CreditCard,
  PieChart,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Users,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { data, exportCSV } = useApp();
  const [logSearch, setLogSearch] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Financial BI metrics
  const paidReceivables = data.receivables.filter((r) => r.status === 'Pago');
  const totalGrossRevenue = paidReceivables.reduce((sum, r) => sum + r.grossAmount, 0);
  const totalFees = paidReceivables.reduce((sum, r) => sum + (r.feeAmount || 0), 0);
  const totalNetRevenue = totalGrossRevenue - totalFees;

  const paidPayables = data.payables.filter((p) => p.status === 'Pago');
  const totalExpenses = paidPayables.reduce((sum, p) => sum + p.amount, 0);
  const netProfit = totalNetRevenue - totalExpenses;
  const netMargin = totalGrossRevenue > 0 ? Math.round((netProfit / totalGrossRevenue) * 100) : 0;

  // Revenue by Category
  const categoryBreakdown: { [cat: string]: number } = {};
  paidReceivables.forEach((r) => {
    const cat = r.category || 'Outros';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + r.grossAmount;
  });

  // Revenue by Payment Method
  const methodBreakdown: { [method: string]: number } = {};
  paidReceivables.forEach((r) => {
    const method = r.paymentMethod || 'Outros';
    methodBreakdown[method] = (methodBreakdown[method] || 0) + r.grossAmount;
  });

  // Churn and Delinquency
  const activeSubs = data.subscriptions.filter((s) => s.status === 'Ativo').length;
  const cancelledSubs = data.subscriptions.filter((s) => s.status === 'Cancelado').length;
  const churnRate =
    activeSubs + cancelledSubs > 0
      ? Math.round((cancelledSubs / (activeSubs + cancelledSubs)) * 100)
      : 0;

  const overdueReceivables = data.receivables.filter((r) => r.status === 'Vencido');
  const overdueAmount = overdueReceivables.reduce((sum, r) => sum + r.grossAmount, 0);

  const handleExport = (
    type: 'clients' | 'receivables' | 'payables' | 'subscriptions' | 'cashflow',
    label: string
  ) => {
    exportCSV(type);
    setDownloadSuccess(`Arquivo ${label} gerado com sucesso!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const filteredLogs = (data.auditLogs || []).filter((l) =>
    (l.action + ' ' + l.details).toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div id="reports-module" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Relatórios & Inteligência de Negócio (BI)</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Consolidado contábil, margem real líquida após taxas da InfinitePay e exportações em CSV.
          </p>
        </div>

        {downloadSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{downloadSuccess}</span>
          </div>
        )}
      </div>

      {/* Financial Executive Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Faturamento Bruto</span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {formatCurrency(totalGrossRevenue)}
          </p>
          <span className="text-[10px] text-neutral-500">Vendas recebidas</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Taxas Gateway</span>
          <p className="text-xl font-bold font-mono text-purple-400 mt-1">
            {formatCurrency(totalFees)}
          </p>
          <span className="text-[10px] text-neutral-500">InfinitePay / Outras</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Faturamento Líquido</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalNetRevenue)}
          </p>
          <span className="text-[10px] text-neutral-500">Entrada real em conta</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Despesas Pagas</span>
          <p className="text-xl font-bold font-mono text-red-400 mt-1">
            {formatCurrency(totalExpenses)}
          </p>
          <span className="text-[10px] text-neutral-500">Custos operacionais</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08] col-span-2 sm:col-span-1">
          <span className="text-[11px] text-neutral-400 font-medium">Lucro Líquido Real</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(netProfit)}
          </p>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            {netMargin}% de margem líquida
          </span>
        </div>
      </div>

      {/* CSV Export Center */}
      <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold text-white">Central de Exportação de Dados (.CSV)</h3>
          </div>
          <span className="text-xs text-neutral-400">Compatível com Excel, Numbers e Google Sheets</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
          <button
            onClick={() => handleExport('clients', 'Clientes')}
            className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] transition text-left flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Base de Clientes</span>
              <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition" />
            </div>
            <span className="text-[11px] text-neutral-400">Dados, contatos e LTV</span>
          </button>

          <button
            onClick={() => handleExport('receivables', 'Recebíveis')}
            className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] transition text-left flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Contas a Receber</span>
              <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition" />
            </div>
            <span className="text-[11px] text-neutral-400">Faturas, taxas e status</span>
          </button>

          <button
            onClick={() => handleExport('payables', 'Despesas')}
            className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] transition text-left flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Contas a Pagar</span>
              <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition" />
            </div>
            <span className="text-[11px] text-neutral-400">Despesas por categoria</span>
          </button>

          <button
            onClick={() => handleExport('subscriptions', 'Assinaturas')}
            className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] transition text-left flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Plano de Cuidado</span>
              <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition" />
            </div>
            <span className="text-[11px] text-neutral-400">Contratos de MRR</span>
          </button>

          <button
            onClick={() => handleExport('cashflow', 'Fluxo de Caixa')}
            className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] transition text-left flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Fluxo de Caixa</span>
              <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition" />
            </div>
            <span className="text-[11px] text-neutral-400">Entradas e saídas reais</span>
          </button>
        </div>
      </div>

      {/* Breakdowns by Category and Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
          <h3 className="text-sm font-semibold text-white">Receita por Categoria de Serviço</h3>
          <div className="space-y-3">
            {Object.keys(categoryBreakdown).length === 0 ? (
              <p className="text-xs text-neutral-500 py-4">Sem dados registrados.</p>
            ) : (
              Object.entries(categoryBreakdown).map(([category, amount]) => {
                const pct = totalGrossRevenue > 0 ? Math.round((amount / totalGrossRevenue) * 100) : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-neutral-300 font-sans">{category}</span>
                      <span className="text-white font-bold">
                        {formatCurrency(amount)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Method Breakdown */}
        <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
          <h3 className="text-sm font-semibold text-white">Receita por Canal de Pagamento</h3>
          <div className="space-y-3">
            {Object.keys(methodBreakdown).length === 0 ? (
              <p className="text-xs text-neutral-500 py-4">Sem dados registrados.</p>
            ) : (
              Object.entries(methodBreakdown).map(([method, amount]) => {
                const pct = totalGrossRevenue > 0 ? Math.round((amount / totalGrossRevenue) * 100) : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-neutral-300 font-sans">{method}</span>
                      <span className="text-white font-bold">
                        {formatCurrency(amount)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* System Audit & Compliance Logs */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Log de Auditoria & Conformidade</h3>
            <p className="text-xs text-neutral-400">Rastreabilidade completa de todas as alterações locais</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar em auditoria..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              Nenhum registro de auditoria encontrado.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between text-xs hover:bg-white/[0.01]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{log.action}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/5 text-neutral-400 font-mono">
                      {log.entityType}
                    </span>
                  </div>
                  <p className="text-neutral-300">{log.details}</p>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono shrink-0 ml-4">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
