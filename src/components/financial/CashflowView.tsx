import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const CashflowView: React.FC = () => {
  const { data } = useApp();
  const [viewMode, setViewMode] = useState<'mensal' | 'diario'>('mensal');

  // Build timeline of actual cash entries and exits
  const transactions = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      description: string;
      category: string;
      type: 'inflow' | 'outflow';
      amount: number;
      accountName: string;
    }> = [];

    // Paid receivables
    data.receivables
      .filter((r) => r.status === 'Pago' && r.paymentDate)
      .forEach((r) => {
        const acc = data.financialAccounts.find((a) => a.id === r.accountId)?.name || 'Conta PJ';
        list.push({
          id: `in-${r.id}`,
          date: r.paymentDate!,
          description: r.description,
          category: r.category,
          type: 'inflow',
          amount: r.netAmount || r.grossAmount,
          accountName: acc,
        });
      });

    // Paid payables
    data.payables
      .filter((p) => p.status === 'Pago' && p.paymentDate)
      .forEach((p) => {
        const acc = data.financialAccounts.find((a) => a.id === p.accountId)?.name || 'Conta PJ';
        list.push({
          id: `out-${p.id}`,
          date: p.paymentDate!,
          description: p.description,
          category: p.category,
          type: 'outflow',
          amount: p.amount,
          accountName: acc,
        });
      });

    return list.sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [data.receivables, data.payables, data.financialAccounts]);

  const totalInflows = transactions
    .filter((t) => t.type === 'inflow')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflows = transactions
    .filter((t) => t.type === 'outflow')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashflow = totalInflows - totalOutflows;

  // Chart data: chronological cash flow
  const chartData = useMemo(() => {
    const sortedAsc = [...transactions].reverse();
    let runningBalance = 0;
    return sortedAsc.map((item, idx) => {
      if (item.type === 'inflow') runningBalance += item.amount;
      else runningBalance -= item.amount;

      return {
        date: formatDate(item.date),
        saldo: runningBalance,
        movimentacao: item.type === 'inflow' ? item.amount : -item.amount,
      };
    });
  }, [transactions]);

  const currentAvailableBalance = data.financialAccounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div id="cashflow-module" className="space-y-6 pb-12">
      {/* Top Banner KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Saldo Atual em Contas</span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {formatCurrency(currentAvailableBalance)}
          </p>
          <span className="text-[10px] text-neutral-400">Dinheiro líquido disponível</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Entradas Efetivas</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowDownLeft className="w-4 h-4" />
            <span>{formatCurrency(totalInflows)}</span>
          </p>
          <span className="text-[10px] text-neutral-400">Total liquidado no período</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Saídas Efetivas</span>
          <p className="text-xl font-bold font-mono text-red-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>{formatCurrency(totalOutflows)}</span>
          </p>
          <span className="text-[10px] text-neutral-400">Despesas pagas debitadas</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Saldo Líquido Real</span>
          <p
            className={`text-xl font-bold font-mono mt-1 ${
              netCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(netCashflow)}
          </p>
          <span className="text-[10px] text-neutral-400">Entradas - Saídas</span>
        </div>
      </div>

      {/* Chart: Cash Movement Timeline */}
      <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Evolução do Saldo de Caixa</h3>
            <p className="text-xs text-neutral-400">Movimentações reais acumuladas</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Disponível: {formatCurrency(currentAvailableBalance)}
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
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

      {/* Actual Cash Statement Table (Extrato Real) */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Extrato de Entradas e Saídas</h3>
            <p className="text-xs text-neutral-400">Registro cronológico de dinheiro em conta</p>
          </div>
          <span className="text-xs text-neutral-400">
            {transactions.length} movimentações liquidadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium">
                <th className="p-4">Data</th>
                <th className="p-4">Descrição da Operação</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Conta Bancária</th>
                <th className="p-4 text-center">Tipo</th>
                <th className="p-4 text-right">Valor Efetivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    Nenhuma movimentação liquidada no período selecionado.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 text-neutral-300 font-mono">{formatDate(t.date)}</td>

                    <td className="p-4 font-semibold text-white">{t.description}</td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 text-[11px]">
                        {t.category}
                      </span>
                    </td>

                    <td className="p-4 text-neutral-300">{t.accountName}</td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-medium text-[11px] inline-flex items-center gap-1 ${
                          t.type === 'inflow'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {t.type === 'inflow' ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>Entrada</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Saída</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td
                      className={`p-4 text-right font-mono font-bold ${
                        t.type === 'inflow' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {t.type === 'inflow' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
