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
  Edit3,
  Trash2,
  Repeat,
} from 'lucide-react';

export const PayablesView: React.FC = () => {
  const { data, addPayable, updatePayable, deletePayable, markPayableAsPaid } = useApp();

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

  // Edit Payable Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayable, setEditingPayable] = useState<Payable | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    category: '',
    supplier: '',
    amount: '',
    dueDate: '',
    paymentDate: '',
    accountId: '',
    status: 'Pendente' as PayableStatus,
    paymentMethod: 'Pix' as PaymentMethod,
    isRecurring: false,
    notes: '',
  });

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [payableToDelete, setPayableToDelete] = useState<Payable | null>(null);

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

  const handleOpenEdit = (p: Payable) => {
    setEditingPayable(p);
    setEditForm({
      description: p.description,
      category: p.category,
      supplier: p.supplier || '',
      amount: p.amount.toString(),
      dueDate: p.dueDate,
      paymentDate: p.paymentDate || new Date().toISOString().split('T')[0],
      accountId: p.accountId || data.financialAccounts[0]?.id || '',
      status: p.status,
      paymentMethod: p.paymentMethod || 'Pix',
      isRecurring: !!p.isRecurring,
      notes: p.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayable) return;

    const val = parseFloat(editForm.amount) || 0;

    updatePayable(editingPayable.id, {
      description: editForm.description,
      category: editForm.category,
      supplier: editForm.supplier,
      amount: val,
      dueDate: editForm.dueDate,
      paymentDate: editForm.status === 'Pago' ? editForm.paymentDate : undefined,
      accountId: editForm.status === 'Pago' ? editForm.accountId : undefined,
      status: editForm.status,
      paymentMethod: editForm.paymentMethod,
      isRecurring: editForm.isRecurring,
      notes: editForm.notes,
    });

    setIsEditModalOpen(false);
    setEditingPayable(null);
  };

  const handleConfirmDelete = () => {
    if (!payableToDelete) return;
    deletePayable(payableToDelete.id);
    setIsDeleteModalOpen(false);
    setPayableToDelete(null);
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
    <div id="payables-module" className="space-y-5 pb-12">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Total Despesas (Filtro)</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Despesas Pagas</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Despesas a Pagar</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#13141a] border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar despesa ou fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="todos" className="bg-neutral-900 text-white">Todos os Status</option>
            <option value="Pendente" className="bg-neutral-900 text-white">Pendentes</option>
            <option value="Pago" className="bg-neutral-900 text-white">Pagas</option>
            <option value="Vencido" className="bg-neutral-900 text-white">Vencidas</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-neutral-300 focus:outline-none hidden md:block"
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nova Despesa</span>
        </button>
      </div>

      {/* Payables Table */}
      <div className="rounded-xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[880px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium bg-white/[0.02]">
                <th className="px-4 py-3 whitespace-nowrap">Descrição / Despesa</th>
                <th className="px-4 py-3 whitespace-nowrap">Fornecedor</th>
                <th className="px-4 py-3 whitespace-nowrap">Categoria</th>
                <th className="px-4 py-3 whitespace-nowrap">Recorrência</th>
                <th className="px-4 py-3 whitespace-nowrap">Vencimento</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Valor</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredPayables.map((pay) => (
                <tr key={pay.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-white">{pay.description}</p>
                    {pay.paymentDate && (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Pago em {formatDate(pay.paymentDate)}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-neutral-300">{pay.supplier}</td>

                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 text-[11px] whitespace-nowrap inline-flex items-center">
                      {pay.category}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {pay.isRecurring ? (
                      <span className="inline-flex items-center gap-1 text-purple-400 text-[11px] font-medium">
                        <Repeat className="w-3 h-3" />
                        <span>Mensal</span>
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-[11px]">Pontual</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-neutral-300 font-mono whitespace-nowrap">{formatDate(pay.dueDate)}</td>

                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-white whitespace-nowrap">
                    {formatCurrency(pay.amount)}
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded font-medium text-[11px] whitespace-nowrap inline-flex items-center leading-none ${
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

                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {pay.status !== 'Pago' ? (
                        <button
                          onClick={() => handleOpenPayModal(pay)}
                          className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium border border-white/15 transition flex items-center gap-1"
                          title="Efetuar pagamento"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Pagar</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-mono px-1">Liquidado</span>
                      )}

                      <button
                        onClick={() => handleOpenEdit(pay)}
                        className="p-1 rounded-md bg-white/[0.04] hover:bg-blue-500/20 text-neutral-400 hover:text-blue-300 border border-white/5 hover:border-blue-500/30 transition"
                        title="Editar despesa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setPayableToDelete(pay);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1 rounded-md bg-white/[0.04] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition"
                        title="Excluir despesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayables.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    Nenhuma conta a pagar encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PAYABLE MODAL */}
      {editingPayable && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Editar Conta a Pagar"
          subtitle={`Atualizando despesa ID: ${editingPayable.id}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Descrição</label>
              <input
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Categoria</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
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
                  value={editForm.supplier}
                  onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Data Vencimento</label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as PayableStatus })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                >
                  <option value="Pendente" className="bg-neutral-900 text-white">Pendente</option>
                  <option value="Pago" className="bg-neutral-900 text-white">Pago (Liquidado)</option>
                  <option value="Vencido" className="bg-neutral-900 text-white">Vencido</option>
                  <option value="Cancelado" className="bg-neutral-900 text-white">Cancelado</option>
                </select>
              </div>
            </div>

            {editForm.status === 'Pago' && (
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-emerald-400">Dados do Pagamento Efetivo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Conta de Saída (Débito)</label>
                    <select
                      value={editForm.accountId}
                      onChange={(e) => setEditForm({ ...editForm, accountId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                      required={editForm.status === 'Pago'}
                    >
                      {data.financialAccounts.map((a) => (
                        <option key={a.id} value={a.id} className="bg-neutral-900 text-white">
                          {a.name} ({formatCurrency(a.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Data Efetiva de Pagamento</label>
                    <input
                      type="date"
                      value={editForm.paymentDate}
                      onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                      required={editForm.status === 'Pago'}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-neutral-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isRecurring}
                  onChange={(e) => setEditForm({ ...editForm, isRecurring: e.target.checked })}
                  className="rounded bg-white/10 border-white/20"
                />
                <span>Despesa recorrente mensal</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Observações</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Observações adicionais..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setPayableToDelete(editingPayable);
                  setIsDeleteModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Despesa</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE PAYABLE MODAL */}
      {payableToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Excluir Conta a Pagar"
          subtitle={`Esta ação removerá a despesa "${payableToDelete.description}"`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
              Tem certeza que deseja excluir esta despesa de {formatCurrency(payableToDelete.amount)}?
              {payableToDelete.status === 'Pago' && ' O valor já computado no saldo bancário será restaurado.'}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </Modal>
      )}

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
