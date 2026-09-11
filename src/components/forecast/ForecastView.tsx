import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateFinancialForecast } from '../../lib/calculations';
import { formatCurrency } from '../../lib/formatters';
import {
  LineChart,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const ForecastView: React.FC = () => {
  const { data } = useApp();

  const currentCash = data.financialAccounts.reduce((sum, a) => sum + a.balance, 0);

  const forecast7 = calculateFinancialForecast(
    data.receivables,
    data.payables,
    data.subscriptions,
    currentCash,
    7
  );
  const forecast30 = calculateFinancialForecast(
    data.receivables,
    data.payables,
    data.subscriptions,
    currentCash,
    30
  );
  const forecast60 = calculateFinancialForecast(
    data.receivables,
    data.payables,
    data.subscriptions,
    currentCash,
    60
  );
  const forecast90 = calculateFinancialForecast(
    data.receivables,
    data.payables,
    data.subscriptions,
    currentCash,
    90
  );
  const forecast180 = calculateFinancialForecast(
    data.receivables,
    data.payables,
    data.subscriptions,
    currentCash,
    180
  );
  const forecast365 = calculateFinancialForecast(
    data.receivables,
    data.payables,
    data.subscriptions,
    currentCash,
    365
  );

  const forecastWindows = [
    { label: '7 Dias', data: forecast7, desc: 'Curto prazo imediato' },
    { label: '30 Dias', data: forecast30, desc: 'Fechamento do mês' },
    { label: '60 Dias', data: forecast60, desc: 'Bimestre operacional' },
    { label: '90 Dias', data: forecast90, desc: 'Trimestre consolidado' },
    { label: '6 Meses', data: forecast180, desc: 'Semestre estratégico' },
    { label: '12 Meses', data: forecast365, desc: 'Ano fiscal futuro' },
  ];

  const chartData = forecastWindows.map((w) => ({
    janela: w.label,
    entradas: Math.round(w.data.projectedInflows),
    saidas: Math.round(w.data.projectedOutflows),
    saldoProjetado: Math.round(w.data.projectedEndingBalance),
  }));

  const [selectedWindow, setSelectedWindow] = useState(forecastWindows[1]); // 30 days default

  return (
    <div id="forecast-module" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div>
          <h2 className="text-sm font-semibold text-white">Previsão Financeira Futura</h2>
          <p className="text-xs text-neutral-400">
            Projeção inteligente cruzando faturas a receber, MRR de assinaturas e despesas fixas.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
            Caixa Atual de Partida
          </span>
          <span className="text-base font-bold font-mono text-emerald-400">
            {formatCurrency(currentCash)}
          </span>
        </div>
      </div>

      {/* Forecast Window Selection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {forecastWindows.map((w) => {
          const isSelected = selectedWindow.label === w.label;
          return (
            <div
              key={w.label}
              onClick={() => setSelectedWindow(w)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                isSelected
                  ? 'bg-white/10 border-white/30 shadow-lg'
                  : 'bg-[#13141a] border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{w.label}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">{w.desc}</p>
              <div className="mt-3">
                <span className="text-[10px] text-neutral-500 block">Saldo Final:</span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {formatCurrency(w.data.projectedEndingBalance)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Window Deep-Dive */}
      <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Cenário Projetado para os Próximos {selectedWindow.label}
            </h3>
            <p className="text-xs text-neutral-400">
              Considerando faturas agendadas e continuidade de assinaturas ativas
            </p>
          </div>
          <span className="text-xs font-mono text-white bg-white/10 px-3 py-1 rounded-xl">
            {selectedWindow.desc}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Entradas Previstas</span>
            </span>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              +{formatCurrency(selectedWindow.data.projectedInflows)}
            </p>
            <p className="text-[10px] text-neutral-500 mt-1">
              Contas a receber pendentes + MRR projetado
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
              <span>Saídas Previstas</span>
            </span>
            <p className="text-2xl font-bold font-mono text-red-400 mt-1">
              -{formatCurrency(selectedWindow.data.projectedOutflows)}
            </p>
            <p className="text-[10px] text-neutral-500 mt-1">
              Contas a pagar agendadas + despesas fixas recorrentes
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Saldo de Caixa Estimado</span>
            </span>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {formatCurrency(selectedWindow.data.projectedEndingBalance)}
            </p>
            <p className="text-[10px] text-neutral-500 mt-1">
              Caixa inicial ({formatCurrency(currentCash)}) + Líquido projetado
            </p>
          </div>
        </div>
      </div>

      {/* Projection Chart Across Horizons */}
      <div className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Curva de Entradas, Saídas e Caixa</h3>
            <p className="text-xs text-neutral-400">Comparativo entre horizontes temporais</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="janela" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#181920',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [formatCurrency(val)]}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="entradas" name="Entradas Previstas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas Previstas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saldoProjetado" name="Saldo Final em Caixa" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
