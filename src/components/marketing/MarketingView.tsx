import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MarketingCampaign } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  Megaphone,
  Plus,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Percent,
} from 'lucide-react';

export const MarketingView: React.FC = () => {
  const { data, addMarketingCampaign } = useApp();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [channel, setChannel] = useState('Instagram Ads');
  const [amount, setAmount] = useState('');
  const [leadsGenerated, setLeadsGenerated] = useState('');
  const [clientsConverted, setClientsConverted] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const campaigns = data.marketingCampaigns || [];

  // Marketing metrics calculation
  const totalInvested = campaigns.reduce((sum, m) => sum + (m.investmentAmount || 0), 0);
  const totalLeads = campaigns.reduce((sum, m) => sum + (m.leadsCount || 0), 0);
  const totalConverted = campaigns.reduce((sum, m) => sum + (m.clientsConvertedCount || 0), 0);

  const averageCpl = totalLeads > 0 ? totalInvested / totalLeads : 0;
  const averageCac = totalConverted > 0 ? totalInvested / totalConverted : 0;

  // Calculate revenue from converted clients
  const marketingClientRevenue = data.clients
    .filter((c) => c.origin === 'Tráfego pago' || c.origin === 'Instagram')
    .reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const roi =
    totalInvested > 0
      ? (((marketingClientRevenue - totalInvested) / totalInvested) * 100).toFixed(1)
      : '0';

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    addMarketingCampaign({
      channel,
      period: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      startDate: date,
      investmentAmount: parseFloat(amount),
      leadsCount: parseInt(leadsGenerated) || 0,
      clientsConvertedCount: parseInt(clientsConverted) || 0,
      revenueGenerated: 0,
      notes,
    });

    setIsNewModalOpen(false);
    setAmount('');
    setLeadsGenerated('');
    setClientsConverted('');
  };

  return (
    <div id="marketing-module" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div>
          <h2 className="text-sm font-semibold text-white">Marketing, CAC & Retorno de Anúncios</h2>
          <p className="text-xs text-neutral-400">
            Acompanhe o custo por lead e custo de aquisição para clínicas odontológicas e médicas.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Registrar Gasto de Anúncios</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Total Investido</span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {formatCurrency(totalInvested)}
          </p>
          <span className="text-[10px] text-neutral-500">Instagram e Google Ads</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Leads Gerados</span>
          <p className="text-xl font-bold font-mono text-blue-400 mt-1">{totalLeads}</p>
          <span className="text-[10px] text-neutral-500">Clínicas que demonstraram interesse</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Custo por Lead (CPL)</span>
          <p className="text-xl font-bold font-mono text-purple-400 mt-1">
            {formatCurrency(averageCpl)}
          </p>
          <span className="text-[10px] text-neutral-500">Média por contato qualificado</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">CAC (Custo Aquisição)</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(averageCac)}
          </p>
          <span className="text-[10px] text-neutral-500">{totalConverted} contratos fechados</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">ROI de Marketing</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{roi}%</p>
          <span className="text-[10px] text-neutral-500">
            Receita gerada: {formatCurrency(marketingClientRevenue)}
          </span>
        </div>
      </div>

      {/* Campaigns History Table */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Histórico de Investimentos em Mídia</h3>
          <span className="text-xs text-neutral-400">
            {campaigns.length} campanhas registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium">
                <th className="p-4">Canal de Mídia</th>
                <th className="p-4">Data</th>
                <th className="p-4 text-center">Leads Gerados</th>
                <th className="p-4 text-center">Clientes Fechados</th>
                <th className="p-4 text-right">CPL</th>
                <th className="p-4 text-right">CAC</th>
                <th className="p-4 text-right">Total Investido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {campaigns.map((m) => {
                const cpl = m.leadsCount > 0 ? m.investmentAmount / m.leadsCount : 0;
                const cac = m.clientsConvertedCount > 0 ? m.investmentAmount / m.clientsConvertedCount : 0;

                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <span className="font-semibold text-white block">{m.channel}</span>
                      {m.notes && <span className="text-[11px] text-neutral-500">{m.notes}</span>}
                    </td>

                    <td className="p-4 text-neutral-300 font-mono">{formatDate(m.startDate)}</td>

                    <td className="p-4 text-center font-mono font-medium text-blue-400">
                      {m.leadsCount}
                    </td>

                    <td className="p-4 text-center font-mono font-medium text-emerald-400">
                      {m.clientsConvertedCount}
                    </td>

                    <td className="p-4 text-right font-mono text-neutral-300">
                      {formatCurrency(cpl)}
                    </td>

                    <td className="p-4 text-right font-mono text-neutral-300">
                      {formatCurrency(cac)}
                    </td>

                    <td className="p-4 text-right font-mono font-bold text-white">
                      {formatCurrency(m.investmentAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW MARKETING EXPENSE MODAL */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Registrar Investimento de Marketing"
        subtitle="Adicione gasto com anúncios ou campanhas de tráfego"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Canal de Aquisição</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="Instagram Ads" className="bg-neutral-900 text-white">Instagram Ads</option>
              <option value="Google Ads" className="bg-neutral-900 text-white">Google Ads</option>
              <option value="LinkedIn Ads" className="bg-neutral-900 text-white">LinkedIn Ads</option>
              <option value="Prospecção ativa" className="bg-neutral-900 text-white">Prospecção Ativa (Ferramentas)</option>
              <option value="Parcerias" className="bg-neutral-900 text-white">Parcerias e Eventos</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Valor Investido (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Leads Gerados</label>
              <input
                type="number"
                placeholder="0"
                value={leadsGenerated}
                onChange={(e) => setLeadsGenerated(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Clientes Fechados</label>
              <input
                type="number"
                placeholder="0"
                value={clientsConverted}
                onChange={(e) => setClientsConverted(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Observações da Campanha</label>
            <input
              type="text"
              placeholder="Ex: Campanha de implantes dentários no feed"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Salvar Registro
          </button>
        </form>
      </Modal>
    </div>
  );
};
