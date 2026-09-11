import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Subscription, SubscriptionStatus } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  Repeat,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  DollarSign,
  TrendingUp,
  XCircle,
  Pause,
  Play,
} from 'lucide-react';

export const SubscriptionsView: React.FC = () => {
  const {
    data,
    addSubscription,
    updateSubscriptionStatus,
    markReceivableAsPaid,
    setSelectedClientId,
  } = useApp();

  const [isNewSubModalOpen, setIsNewSubModalOpen] = useState(false);
  const [subClientId, setSubClientId] = useState(data.clients[0]?.id || '');
  const [subPlanName, setSubPlanName] = useState('Plano de Cuidado Digital');
  const [subMonthlyValue, setSubMonthlyValue] = useState('197');
  const [subDueDay, setSubDueDay] = useState('10');
  const [subPaymentMethod, setSubPaymentMethod] = useState('Pix');

  // MRR Metrics
  const activeSubs = data.subscriptions.filter((s) => s.status === 'Ativo');
  const overdueSubs = data.subscriptions.filter((s) => s.status === 'Em atraso');
  const pausedSubs = data.subscriptions.filter((s) => s.status === 'Pausado');

  const mrrContratado = activeSubs.reduce((sum, s) => sum + s.monthlyValue, 0);
  const mrrEmRisco = overdueSubs.reduce((sum, s) => sum + s.monthlyValue, 0);
  const arrContratado = mrrContratado * 12;

  // Received this month for subscriptions
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const mrrRecebidoMes = data.receivables
    .filter(
      (r) =>
        r.category === 'Plano de Cuidado Digital' &&
        r.status === 'Pago' &&
        r.paymentDate?.startsWith(currentMonthPrefix)
    )
    .reduce((sum, r) => sum + r.grossAmount, 0);

  const taxaInadimplencia =
    data.subscriptions.length > 0
      ? Math.round((overdueSubs.length / data.subscriptions.length) * 100)
      : 0;

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenClientId = subClientId || data.clients[0]?.id;
    if (!chosenClientId || !subMonthlyValue) return;

    const dueDayNum = parseInt(subDueDay) || 10;
    const now = new Date();
    const nextDue = new Date(now.getFullYear(), now.getMonth() + 1, dueDayNum)
      .toISOString()
      .split('T')[0];

    addSubscription({
      clientId: chosenClientId,
      planName: subPlanName,
      monthlyValue: parseFloat(subMonthlyValue),
      dueDay: dueDayNum,
      startDate: new Date().toISOString().split('T')[0],
      nextDueDate: nextDue,
      status: 'Ativo',
      paymentMethod: subPaymentMethod,
    });

    setIsNewSubModalOpen(false);
  };

  return (
    <div id="subscriptions-module" className="space-y-6 pb-12">
      {/* Top MRR KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">MRR Contratado</span>
          <p className="text-xl font-bold font-mono text-purple-400 mt-1">
            {formatCurrency(mrrContratado)}
          </p>
          <span className="text-[10px] text-neutral-400">{activeSubs.length} assinaturas ativas</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">ARR Projetado</span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {formatCurrency(arrContratado)}
          </p>
          <span className="text-[10px] text-neutral-400">Receita anual recorrente</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">MRR em Risco</span>
          <p className="text-xl font-bold font-mono text-red-400 mt-1">
            {formatCurrency(mrrEmRisco)}
          </p>
          <span className="text-[10px] text-neutral-400">{overdueSubs.length} clientes em atraso</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Taxa de Inadimplência</span>
          <p
            className={`text-xl font-bold font-mono mt-1 ${
              taxaInadimplencia > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {taxaInadimplencia}%
          </p>
          <span className="text-[10px] text-neutral-400">Meta: abaixo de 5%</span>
        </div>
      </div>

      {/* Overdue Subscriptions Warning / Cobrança Rápida */}
      {overdueSubs.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Clientes com Mensalidade em Atraso ({overdueSubs.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {overdueSubs.map((sub) => {
              const client = data.clients.find((c) => c.id === sub.clientId);
              const cleanPhone = client?.phone?.replace(/\D/g, '') || '';
              const whatsappMsg = encodeURIComponent(
                `Olá ${client?.contactName || ''}, tudo bem? Aqui é da Paradiso Digital. Notamos uma pendência na mensalidade do Plano de Cuidado Digital do seu site (vencimento dia ${sub.dueDay}). Segue a chave Pix para regularização.`
              );

              return (
                <div
                  key={sub.id}
                  className="p-3 rounded-lg bg-black/40 border border-red-500/30 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{client?.companyName}</p>
                    <p className="text-red-300 text-[11px]">
                      {formatCurrency(sub.monthlyValue)} • Venc: {formatDate(sub.nextDueDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/55${cleanPhone}?text=${whatsappMsg}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Cobrar WhatsApp</span>
                      </a>
                    )}
                    <button
                      onClick={() => updateSubscriptionStatus(sub.id, 'Ativo')}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition"
                    >
                      Regularizar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions and Active Subscriptions Table */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Contratos do Plano de Cuidado Digital</h3>
            <p className="text-xs text-neutral-400">
              Gerenciamento individual de assinaturas recorrentes
            </p>
          </div>

          <button
            onClick={() => setIsNewSubModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nova Assinatura</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium">
                <th className="p-4">Clínica / Contratante</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Dia Vencimento</th>
                <th className="p-4">Próxima Mensalidade</th>
                <th className="p-4">Forma de Cobrança</th>
                <th className="p-4 text-right">Valor Mensal</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.subscriptions.map((sub) => {
                const client = data.clients.find((c) => c.id === sub.clientId);
                return (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <button
                        onClick={() => client && setSelectedClientId(client.id)}
                        className="font-semibold text-white hover:underline text-left"
                      >
                        {client?.companyName || 'Clínica não vinculada'}
                      </button>
                      <p className="text-neutral-400 text-[11px]">{client?.contactName}</p>
                    </td>

                    <td className="p-4 text-neutral-300">{sub.planName}</td>

                    <td className="p-4 text-neutral-300 font-mono">Todo dia {sub.dueDay}</td>

                    <td className="p-4 text-neutral-300 font-mono">{formatDate(sub.nextDueDate)}</td>

                    <td className="p-4 text-neutral-300">{sub.paymentMethod}</td>

                    <td className="p-4 text-right font-mono font-bold text-purple-400">
                      {formatCurrency(sub.monthlyValue)}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                          sub.status === 'Ativo'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : sub.status === 'Em atraso'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {sub.status === 'Ativo' && (
                          <button
                            onClick={() => updateSubscriptionStatus(sub.id, 'Pausado')}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
                            title="Pausar cobrança"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {sub.status === 'Pausado' && (
                          <button
                            onClick={() => updateSubscriptionStatus(sub.id, 'Ativo')}
                            className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                            title="Reativar plano"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {sub.status !== 'Cancelado' && (
                          <button
                            onClick={() => updateSubscriptionStatus(sub.id, 'Cancelado')}
                            className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition"
                            title="Cancelar plano"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW SUBSCRIPTION MODAL */}
      <Modal
        isOpen={isNewSubModalOpen}
        onClose={() => setIsNewSubModalOpen(false)}
        title="Nova Assinatura Recorrente"
        subtitle="Ative o Plano de Cuidado Digital para uma clínica"
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Cliente / Clínica</label>
            <select
              value={subClientId}
              onChange={(e) => setSubClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            >
              {data.clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Nome do Plano</label>
            <input
              type="text"
              value={subPlanName}
              onChange={(e) => setSubPlanName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Mensalidade (R$/mês)</label>
              <input
                type="number"
                step="0.01"
                value={subMonthlyValue}
                onChange={(e) => setSubMonthlyValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Dia do Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={subDueDay}
                onChange={(e) => setSubDueDay(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Forma de Pagamento</label>
            <select
              value={subPaymentMethod}
              onChange={(e) => setSubPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="Pix" className="bg-neutral-900 text-white">Pix</option>
              <option value="InfinitePay" className="bg-neutral-900 text-white">InfinitePay</option>
              <option value="Cartão de crédito" className="bg-neutral-900 text-white">Cartão de Crédito</option>
              <option value="Boleto" className="bg-neutral-900 text-white">Boleto</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Ativar Assinatura Recorrente
          </button>
        </form>
      </Modal>
    </div>
  );
};
