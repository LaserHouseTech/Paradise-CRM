import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Referral, ReferralStatus } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  Gift,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const ReferralsView: React.FC = () => {
  const { data, addReferral, updateReferral, updateReferralStatus } = useApp();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [referrerType, setReferrerType] = useState<'existing' | 'manual'>('existing');
  const [selectedClientId, setSelectedClientId] = useState(data.clients[0]?.id || '');
  const [manualReferrerName, setManualReferrerName] = useState('');
  const [referredClientName, setReferredClientName] = useState('');
  const [commissionAmount, setCommissionAmount] = useState('200');
  const [saleValue, setSaleValue] = useState('997');
  const [notes, setNotes] = useState('');

  // Referral KPIs
  const totalReferrals = data.referrals.length;
  const closedReferrals = data.referrals.filter(
    (r) => r.status === 'Fechou' || r.status === 'Comissão pendente' || r.status === 'Comissão paga'
  ).length;

  const totalCommissionsPaid = data.referrals
    .filter((r) => r.status === 'Comissão paga')
    .reduce((sum, r) => sum + (r.commissionAmount || 0), 0);

  const totalCommissionsPending = data.referrals
    .filter((r) => r.status === 'Comissão pendente' || r.status === 'Fechou')
    .reduce((sum, r) => sum + (r.commissionAmount || 0), 0);

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    let finalReferrerName = manualReferrerName;
    let clientId: string | undefined = undefined;

    if (referrerType === 'existing') {
      const client = data.clients.find((c) => c.id === selectedClientId);
      finalReferrerName = client ? `${client.companyName} (${client.contactName})` : 'Cliente Parceiro';
      clientId = selectedClientId;
    }

    if (!finalReferrerName.trim() || !referredClientName.trim()) return;

    addReferral({
      referrerName: finalReferrerName,
      referredClientName,
      referredClientId: clientId,
      referralDate: new Date().toISOString().split('T')[0],
      saleValue: saleValue ? parseFloat(saleValue) : undefined,
      commissionAmount: parseFloat(commissionAmount) || 200,
      status: 'Em negociação',
      notes: notes.trim() || undefined,
    });

    setIsNewModalOpen(false);
    setReferredClientName('');
    setManualReferrerName('');
    setNotes('');
  };

  const getStatusBadge = (status: ReferralStatus) => {
    switch (status) {
      case 'Comissão paga':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Comissão pendente':
      case 'Fechou':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Em negociação':
      case 'Indicação recebida':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Não fechou':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  return (
    <div id="referrals-module" className="space-y-6 pb-12">
      {/* Top Header & Rule Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Programa de Indicações Paradiso</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Bonifique clientes e parceiros por cada novo contrato fechado (Padrão: R$ 200,00 via Pix ou desconto).
          </p>
        </div>

        <button
          id="btn-register-referral"
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Registrar Indicação</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Total de Indicações</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{totalReferrals}</p>
          <span className="text-[10px] text-neutral-500">Oportunidades de parceiros</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Contratos Convertidos</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{closedReferrals}</p>
          <span className="text-[10px] text-neutral-500">
            {totalReferrals > 0 ? Math.round((closedReferrals / totalReferrals) * 100) : 0}% de conversão
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Comissões a Pagar</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(totalCommissionsPending)}
          </p>
          <span className="text-[10px] text-neutral-500">Prêmios de vendas ganhas</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Comissões Pagas</span>
          <p className="text-xl font-bold font-mono text-purple-400 mt-1">
            {formatCurrency(totalCommissionsPaid)}
          </p>
          <span className="text-[10px] text-neutral-500">Total liquidado aos parceiros</span>
        </div>
      </div>

      {/* Referrals List Table */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Quadro de Acompanhamento de Indicações</h3>
          <span className="text-xs text-neutral-400 font-mono">
            {data.referrals.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium">
                <th className="p-4">Quem Indicou</th>
                <th className="p-4">Clínica Indicada</th>
                <th className="p-4">Data</th>
                <th className="p-4">Valor Estimado</th>
                <th className="p-4">Status</th>
                <th className="p-4">Comissão</th>
                <th className="p-4 text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.referrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    Nenhuma indicação cadastrada no momento.
                  </td>
                </tr>
              ) : (
                data.referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 font-medium text-white">
                      {r.referrerName}
                    </td>

                    <td className="p-4 text-neutral-200">
                      <span className="font-semibold text-white block">{r.referredClientName}</span>
                      {r.notes && <span className="text-[11px] text-neutral-500">{r.notes}</span>}
                    </td>

                    <td className="p-4 text-neutral-300 font-mono">{formatDate(r.referralDate)}</td>

                    <td className="p-4 font-mono text-neutral-300">
                      {r.saleValue ? formatCurrency(r.saleValue) : '-'}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-medium text-[11px] border ${getStatusBadge(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                      {r.paymentDate && (
                        <span className="block text-[10px] text-emerald-400 font-mono mt-0.5">
                          Pago em {formatDate(r.paymentDate)}
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-mono font-bold text-white">
                      {formatCurrency(r.commissionAmount)}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {r.status === 'Em negociação' && (
                          <button
                            onClick={() => updateReferralStatus(r.id, 'Fechou')}
                            className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium transition"
                          >
                            Fechar Venda
                          </button>
                        )}
                        {(r.status === 'Fechou' || r.status === 'Comissão pendente') && (
                          <button
                            onClick={() =>
                              updateReferralStatus(
                                r.id,
                                'Comissão paga',
                                new Date().toISOString().split('T')[0]
                              )
                            }
                            className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-medium border border-purple-500/30 transition"
                          >
                            Pagar R$ {r.commissionAmount}
                          </button>
                        )}
                        {r.status === 'Comissão paga' && (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Liquidado
                          </span>
                        )}
                        {r.status === 'Não fechou' && (
                          <span className="text-[11px] text-neutral-500">Sem comissão</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW REFERRAL MODAL */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Nova Indicação Recebida"
        subtitle="Cadastre o parceiro indicador e a clínica em potencial"
      >
        <form onSubmit={handleCreateReferral} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Tipo de Indicador
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setReferrerType('existing')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  referrerType === 'existing'
                    ? 'bg-white text-neutral-900 font-semibold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Cliente Existente
              </button>
              <button
                type="button"
                onClick={() => setReferrerType('manual')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  referrerType === 'manual'
                    ? 'bg-white text-neutral-900 font-semibold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Parceiro Externo
              </button>
            </div>
          </div>

          {referrerType === 'existing' ? (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Selecionar Cliente Indicador
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              >
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                    {c.companyName} ({c.contactName})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Nome do Parceiro / Indicador
              </label>
              <input
                type="text"
                placeholder="Ex: Dra. Mariana Advogada / Agência Parceira"
                value={manualReferrerName}
                onChange={(e) => setManualReferrerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Nome da Clínica / Lead Indicado
            </label>
            <input
              type="text"
              placeholder="Ex: Clínica Radiologia São Lucas"
              value={referredClientName}
              onChange={(e) => setReferredClientName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Valor Estimado do Contrato (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="997.00"
                value={saleValue}
                onChange={(e) => setSaleValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Valor da Comissão (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Observações / Informações de Contato
            </label>
            <input
              type="text"
              placeholder="Ex: Dr. solicitou contato após as 18h no WhatsApp"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Cadastrar Indicação
          </button>
        </form>
      </Modal>
    </div>
  );
};
