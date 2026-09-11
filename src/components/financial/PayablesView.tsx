import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Payable, PayableStatus, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  CreditCard,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  Repeat,
  DollarSign,
} from 'lucide-react';

export const PayablesView: React.FC = () => {
  const { data, addPayable, markPayableAsPaid } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  // Pay Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(data.financialAccounts[0]?.id || '');

  // New Payable Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Hospedagem');
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaidNow, setIsPaidNow] = useState(false);

  const filteredPayables = data.payables.filter((p) => {
    const matchesSearch =
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'todos' || p.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalAmount = filteredPayables.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = filteredPayables
    .filter((p) => p.status === 'Pago')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = filteredPayables
    .filter((p) => p.status === 'Pendente' || p.status === 'Vencido')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleOpenPayModal = (p: Payable) => {
    setSelectedPayable(p);
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable || !accountId) return;

    markPayableAsPaid(selectedPayable.id, accountId, paymentDate);
    setIsPayModalOpen(false);
    setSelectedPayable(null);
  };

  const handleCreatePayable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    addPayable({
      description: desc,
      category,
      supplier: supplier || 'Fornecedor',
      amount: parseFloat(amount),
      dueDate,
      paymentDate: isPaidNow ? dueDate : undefined,
      paymentMethod: 'Pix',
      accountId: isPaidNow ? accountId : undefined,
      isRecurring,
      status: isPaidNow ? 'Pago' : 'Pendente',
    });

    setIsNewModalOpen(false);
    setDesc('');
    setAmount('');
    setSupplier('');
  };

  return (
    <div id="payables-module" className="space-y-6 pb-12">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Total Despesas (Filtro)</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Despesas Pagas</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Despesas a Pagar</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por descrição ou fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="todos" className="bg-neutral-900 text-white">Todos os Status</option>
            <option value="Pendente" className="bg-neutral-900 text-white">Pendentes</option>
            <option value="Pago" className="bg-neutral-900 text-white">Pagas</option>
            <option value="Vencido" className="bg-neutral-900 text-white">Vencidas</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-neutral-300 focus:outline-none hidden md:block"
          >
            <option value="todos" className="bg-neutral-900 text-white">Todas as Categorias</option>
            {data.categories
              .filter((c) => c.type === 'payable')
              .map((c) => (
                <option key={c.id} value={c.name} className="bg-neutral-900 text-white">
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nova Despesa</span>
        </button>
      </div>

      {/* Payables Table */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium">
                <th className="p-4">Descrição / Despesa</th>
                <th className="p-4">Fornecedor</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Recorrência</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredPayables.map((pay) => (
                <tr key={pay.id} className="hover:bg-white/[0.02] transition">
                  <td className="p-4">
                    <p className="font-semibold text-white">{pay.description}</p>
                    {pay.paymentDate && (
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Pago em {formatDate(pay.paymentDate)}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-neutral-300">{pay.supplier}</td>

                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 text-[11px]">
                      {pay.category}
                    </span>
                  </td>

                  <td className="p-4">
                    {pay.isRecurring ? (
                      <span className="flex items-center gap-1 text-purple-400 text-[11px]">
                        <Repeat className="w-3 h-3" />
                        <span>Mensal</span>
                      </span>
                    ) : (
                      <span className="text-neutral-500 text-[11px]">Pontual</span>
                    )}
                  </td>

                  <td className="p-4 text-neutral-300 font-mono">{formatDate(pay.dueDate)}</td>

                  <td className="p-4 text-right font-mono font-semibold text-white">
                    {formatCurrency(pay.amount)}
                  </td>

                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                        pay.status === 'Pago'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : pay.status === 'Vencido'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {pay.status}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    {pay.status !== 'Pago' ? (
                      <button
                        onClick={() => handleOpenPayModal(pay)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition flex items-center gap-1 mx-auto"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Pagar</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-500 font-mono">Liquidado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAY MODAL */}
      {selectedPayable && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="Confirmar Pagamento de Despesa"
          subtitle={`Liquidando: ${selectedPayable.description} (${formatCurrency(selectedPayable.amount)})`}
        >
          <form onSubmit={handleConfirmPay} className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              O valor de {formatCurrency(selectedPayable.amount)} será debitado do saldo da conta bancária indicada e registrado como saída no fluxo de caixa.
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Conta de Saída (Débito)</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              >
                {data.financialAccounts.map((a) => (
                  <option key={a.id} value={a.id} className="bg-neutral-900 text-white">
                    {a.name} (Saldo atual: {formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Data Efetiva do Pagamento</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
            >
              Confirmar Pagamento e Debitar
            </button>
          </form>
        </Modal>
      )}

      {/* NEW PAYABLE MODAL */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Nova Conta a Pagar"
        subtitle="Cadastre custos operacionais, ferramentas ou serviços"
      >
        <form onSubmit={handleCreatePayable} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Assinatura Hostinger Pro"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                {data.categories
                  .filter((c) => c.type === 'payable')
                  .map((c) => (
                    <option key={c.id} value={c.name} className="bg-neutral-900 text-white">
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Fornecedor</label>
              <input
                type="text"
                placeholder="Ex: Hostinger"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Valor (R$)</label>
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
              <label className="block text-xs font-medium text-neutral-400 mb-1">Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded bg-white/10 border-white/20"
              />
              <span>Despesa recorrente mensal</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaidNow}
                onChange={(e) => setIsPaidNow(e.target.checked)}
                className="rounded bg-white/10 border-white/20"
              />
              <span>Já foi paga</span>
            </label>
          </div>

          {isPaidNow && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Conta para débito:</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
              >
                {data.financialAccounts.map((a) => (
                  <option key={a.id} value={a.id} className="bg-neutral-900 text-white">
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Cadastrar Despesa
          </button>
        </form>
      </Modal>
    </div>
  );
};
