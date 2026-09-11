import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  UserCheck,
  Plus,
  ShieldAlert,
  Calendar,
  Wallet,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

export const ProLaboreView: React.FC = () => {
  const { data, addProLabore, updateSettings } = useApp();

  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(data.financialAccounts[0]?.id || '');
  const [notes, setNotes] = useState('Retirada mensal sócio');

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [newTarget, setNewTarget] = useState(
    (data.settings.defaultProLaboreMonthly || 3000).toString()
  );

  // Current month withdrawals
  const currentMonthPrefix = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  const currentMonthWithdrawals = (data.proLabore || []).filter((w) =>
    (w.withdrawalDate || '').startsWith(currentMonthPrefix)
  );

  const totalWithdrawnThisMonth = currentMonthWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const monthlyTarget = data.settings.defaultProLaboreMonthly || 3000;
  const remainingToTarget = Math.max(0, monthlyTarget - totalWithdrawnThisMonth);

  const currentAvailableBalance = data.financialAccounts.reduce((sum, a) => sum + a.balance, 0);
  const safetyWarning = currentAvailableBalance < 3000;

  const handleCreateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;

    addProLabore({
      amount: parseFloat(amount),
      withdrawalDate: date,
      accountId,
      status: 'Efetivado',
      notes,
    });

    setIsWithdrawalModalOpen(false);
    setAmount('');
  };

  const handleUpdateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget) return;

    updateSettings({
      defaultProLaboreMonthly: parseFloat(newTarget),
    });
    setIsTargetModalOpen(false);
  };

  return (
    <div id="pro-labore-module" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div>
          <h2 className="text-sm font-semibold text-white">Pró-labore & Retiradas do Sócio</h2>
          <p className="text-xs text-neutral-400">
            Separação estrita entre o patrimônio do proprietário e as finanças da agência Paradiso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTargetModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 text-xs font-medium hover:bg-white/[0.1] transition"
          >
            Ajustar Meta Mensal
          </button>
          <button
            onClick={() => setIsWithdrawalModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Registrar Retirada</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Meta de Pró-labore Mensal</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{formatCurrency(monthlyTarget)}</p>
          <span className="text-[10px] text-neutral-400">Teto planejado para o mês</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Total Retirado no Mês</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(totalWithdrawnThisMonth)}
          </p>
          <span className="text-[10px] text-neutral-400">
            {currentMonthWithdrawals.length} retirada(s) realizada(s)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Disponível para Retirar</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(remainingToTarget)}
          </p>
          <span className="text-[10px] text-neutral-400">Até atingir o teto orçado</span>
        </div>
      </div>

      {/* Safety Warning */}
      {safetyWarning && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">
            <strong className="text-white">Alerta de Caixa:</strong> O saldo total disponível em contas está abaixo de R$ 3.000,00 ({formatCurrency(currentAvailableBalance)}). Recomenda-se postergar retiradas para manter a solvência operacional da agência.
          </p>
        </div>
      )}

      {/* Withdrawals History Table */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Histórico de Retiradas de Sócios</h3>
          <span className="text-xs text-neutral-400">
            {(data.proLabore || []).length} retiradas registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium">
                <th className="p-4">Data</th>
                <th className="p-4">Conta de Saída</th>
                <th className="p-4">Observações</th>
                <th className="p-4 text-right">Valor Retirado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {(data.proLabore || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">
                    Nenhuma retirada de pró-labore registrada.
                  </td>
                </tr>
              ) : (
                data.proLabore.map((w) => {
                  const acc = data.financialAccounts.find((a) => a.id === w.accountId)?.name || 'Conta PJ';
                  return (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-4 text-neutral-300 font-mono">{formatDate(w.withdrawalDate)}</td>
                      <td className="p-4 text-white font-medium">{acc}</td>
                      <td className="p-4 text-neutral-400">{w.notes || 'Retirada regular'}</td>
                      <td className="p-4 text-right font-mono font-bold text-amber-400">
                        {formatCurrency(w.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WITHDRAWAL MODAL */}
      <Modal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        title="Registrar Retirada de Pró-labore"
        subtitle="O valor será debitado da conta bancária selecionada e lançado nas despesas"
      >
        <form onSubmit={handleCreateWithdrawal} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Valor da Retirada (R$)</label>
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
            <label className="block text-xs font-medium text-neutral-400 mb-1">Conta Bancária de Saída</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            >
              {data.financialAccounts.map((a) => (
                <option key={a.id} value={a.id} className="bg-neutral-900 text-white">
                  {a.name} (Saldo: {formatCurrency(a.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Data da Retirada</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Observações</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Confirmar Retirada
          </button>
        </form>
      </Modal>

      {/* TARGET MODAL */}
      <Modal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        title="Meta Mensal de Pró-labore"
        subtitle="Defina o teto de retirada planejado para cada mês"
      >
        <form onSubmit={handleUpdateTarget} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Novo Valor Mensal (R$)</label>
            <input
              type="number"
              step="0.01"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Salvar Meta
          </button>
        </form>
      </Modal>
    </div>
  );
};
