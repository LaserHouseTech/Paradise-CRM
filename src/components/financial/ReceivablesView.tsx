import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Receivable, PaymentMethod, ReceivableStatus } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  Search,
  Plus,
  CheckCircle,
  Edit3,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const ReceivablesView: React.FC = () => {
  const {
    data,
    addReceivable,
    updateReceivable,
    deleteReceivable,
    markReceivableAsPaid,
    createInfinitePaySale,
    setSelectedClientId,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  // Modal: Mark as Paid
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(data.financialAccounts[0]?.id || '');

  // Modal: New Receivable
  const [isNewReceivableOpen, setIsNewReceivableOpen] = useState(false);
  const [recClientId, setRecClientId] = useState(data.clients[0]?.id || '');
  const [recDesc, setRecDesc] = useState('Desenvolvimento de Site Profissional');
  const [recCategory, setRecCategory] = useState('Sites');
  const [recGross, setRecGross] = useState('697');
  const [recFee, setRecFee] = useState('0');
  const [recDueDate, setRecDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [recMethod, setRecMethod] = useState<PaymentMethod>('Pix');
  const [recInstallments, setRecInstallments] = useState('1');

  // Modal: Edit Receivable
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<Receivable | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    clientId: '',
    category: '',
    grossAmount: '',
    feeAmount: '',
    dueDate: '',
    paymentMethod: 'Pix' as PaymentMethod,
    status: 'Pendente' as ReceivableStatus,
    paymentDate: '',
    accountId: '',
    notes: '',
  });

  // Modal: Delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recToDelete, setRecToDelete] = useState<Receivable | null>(null);

  const filteredReceivables = data.receivables.filter((r) => {
    const client = data.clients.find((c) => c.id === r.clientId)?.companyName || '';
    const matchesSearch =
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      client.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || r.status === statusFilter;
    const matchesCategory = categoryFilter === 'todos' || r.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate totals
  const totalGross = filteredReceivables.reduce((sum, r) => sum + r.grossAmount, 0);
  const totalReceived = filteredReceivables
    .filter((r) => r.status === 'Pago')
    .reduce((sum, r) => sum + r.grossAmount, 0);
  const totalPending = filteredReceivables
    .filter((r) => r.status === 'Pendente' || r.status === 'Vencido')
    .reduce((sum, r) => sum + r.grossAmount, 0);

  const handleOpenReceiveModal = (r: Receivable) => {
    setSelectedReceivable(r);
    setIsPayModalOpen(true);
  };

  const handleConfirmReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable || !accountId) return;

    markReceivableAsPaid(selectedReceivable.id, accountId, paymentDate);
    setIsPayModalOpen(false);
    setSelectedReceivable(null);
  };

  const handleOpenEdit = (r: Receivable) => {
    setEditingRec(r);
    setEditForm({
      description: r.description,
      clientId: r.clientId,
      category: r.category,
      grossAmount: r.grossAmount.toString(),
      feeAmount: (r.feeAmount || 0).toString(),
      dueDate: r.dueDate,
      paymentMethod: r.paymentMethod,
      status: r.status,
      paymentDate: r.paymentDate || new Date().toISOString().split('T')[0],
      accountId: r.accountId || data.financialAccounts[0]?.id || '',
      notes: r.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRec) return;

    const gross = parseFloat(editForm.grossAmount) || 0;
    const fee = parseFloat(editForm.feeAmount) || 0;
    const net = gross - fee;

    updateReceivable(editingRec.id, {
      description: editForm.description,
      clientId: editForm.clientId,
      category: editForm.category,
      grossAmount: gross,
      feeAmount: fee,
      netAmount: net,
      dueDate: editForm.dueDate,
      paymentMethod: editForm.paymentMethod,
      status: editForm.status,
      paymentDate: editForm.status === 'Pago' ? editForm.paymentDate : undefined,
      accountId: editForm.status === 'Pago' ? editForm.accountId : undefined,
      notes: editForm.notes,
    });

    setIsEditModalOpen(false);
    setEditingRec(null);
  };

  const handleConfirmDelete = () => {
    if (!recToDelete) return;
    deleteReceivable(recToDelete.id);
    setIsDeleteModalOpen(false);
    setRecToDelete(null);
  };

  const handleCreateReceivable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recClientId || !recGross) return;

    const gross = parseFloat(recGross);
    const fee = parseFloat(recFee) || 0;
    const net = gross - fee;
    const installments = parseInt(recInstallments) || 1;

    if (recMethod === 'InfinitePay' || installments > 1) {
      createInfinitePaySale({
        clientId: recClientId,
        description: recDesc,
        grossAmount: gross,
        feeAmount: fee,
        installmentsCount: installments,
        saleDate: new Date().toISOString().split('T')[0],
        firstDueDate: recDueDate,
        category: recCategory,
      });
    } else {
      addReceivable({
        clientId: recClientId,
        description: recDesc,
        category: recCategory,
        grossAmount: gross,
        feeAmount: fee,
        netAmount: net,
        dueDate: recDueDate,
        paymentMethod: recMethod,
        installmentsCount: 1,
        currentInstallment: 1,
        status: 'Pendente',
      });
    }

    setIsNewReceivableOpen(false);
  };

  return (
    <div id="receivables-module" className="space-y-5 pb-12">
      {/* Top Header & Fast KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Total Cobrado (Filtro)</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{formatCurrency(totalGross)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Recebido Efetivamente</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Aguardando Pagamento</span>
          <p className="text-xl font-bold font-mono text-blue-400 mt-1">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#13141a] border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar cobrança ou clínica..."
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
            <option value="todos" className="bg-neutral-900 text-white">Todas Categorias</option>
            <option value="Sites" className="bg-neutral-900 text-white">Sites</option>
            <option value="Plano de Cuidado Digital" className="bg-neutral-900 text-white">Plano de Cuidado</option>
            <option value="Serviços extras" className="bg-neutral-900 text-white">Serviços extras</option>
          </select>
        </div>

        <button
          onClick={() => setIsNewReceivableOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nova Cobrança</span>
        </button>
      </div>

      {/* Receivables Table */}
      <div className="rounded-xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[940px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium bg-white/[0.02]">
                <th className="px-4 py-3 whitespace-nowrap">Descrição / Detalhes</th>
                <th className="px-4 py-3 whitespace-nowrap">Clínica</th>
                <th className="px-4 py-3 whitespace-nowrap">Categoria</th>
                <th className="px-4 py-3 whitespace-nowrap">Método</th>
                <th className="px-4 py-3 whitespace-nowrap">Vencimento</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Bruto</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Taxa</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Líquido</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredReceivables.map((rec) => {
                const client = data.clients.find((c) => c.id === rec.clientId);
                return (
                  <tr key={rec.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-white">{rec.description}</p>
                      {rec.installmentsCount && rec.installmentsCount > 1 && (
                        <span className="text-[10px] text-blue-400 font-mono">
                          Parcela {rec.currentInstallment}/{rec.installmentsCount}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-neutral-300">
                      <button
                        onClick={() => client && setSelectedClientId(client.id)}
                        className="hover:underline text-left font-medium truncate max-w-[150px] inline-block"
                        title={client?.companyName}
                      >
                        {client?.companyName || '-'}
                      </button>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 text-[11px] whitespace-nowrap inline-flex items-center">
                        {rec.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-neutral-300 whitespace-nowrap">{rec.paymentMethod}</td>

                    <td className="px-4 py-3.5 text-neutral-300 font-mono whitespace-nowrap">{formatDate(rec.dueDate)}</td>

                    <td className="px-4 py-3.5 text-right font-mono font-medium text-white whitespace-nowrap">
                      {formatCurrency(rec.grossAmount)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-neutral-400 whitespace-nowrap">
                      {rec.feeAmount > 0 ? `-${formatCurrency(rec.feeAmount)}` : 'R$ 0,00'}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap">
                      {formatCurrency(rec.netAmount)}
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-medium text-[11px] whitespace-nowrap inline-flex items-center leading-none ${
                          rec.status === 'Pago'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : rec.status === 'Vencido'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {rec.status !== 'Pago' ? (
                          <button
                            onClick={() => handleOpenReceiveModal(rec)}
                            className="px-2 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 transition flex items-center gap-1"
                            title="Confirmar recebimento"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Receber</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-neutral-500 font-mono px-1">
                            {rec.paymentDate ? formatDate(rec.paymentDate) : 'Pago'}
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1 rounded-md bg-white/[0.04] hover:bg-blue-500/20 text-neutral-400 hover:text-blue-300 border border-white/5 hover:border-blue-500/30 transition"
                          title="Editar cobrança"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setRecToDelete(rec);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1 rounded-md bg-white/[0.04] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition"
                          title="Excluir cobrança"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredReceivables.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-neutral-400">
                    Nenhuma conta a receber encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT RECEIVABLE MODAL */}
      {editingRec && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Editar Conta a Receber"
          subtitle={`Atualizando cobrança ID: ${editingRec.id}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Descrição / Referência</label>
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
                <label className="block text-xs font-medium text-neutral-400 mb-1">Cliente</label>
                <select
                  value={editForm.clientId}
                  onChange={(e) => setEditForm({ ...editForm, clientId: e.target.value })}
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
                <label className="block text-xs font-medium text-neutral-400 mb-1">Categoria</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                >
                  <option value="Sites" className="bg-neutral-900 text-white">Sites</option>
                  <option value="Plano de Cuidado Digital" className="bg-neutral-900 text-white">Plano de Cuidado Digital</option>
                  <option value="Serviços extras" className="bg-neutral-900 text-white">Serviços extras</option>
                  <option value="Consultoria" className="bg-neutral-900 text-white">Consultoria</option>
                  <option value="Outros" className="bg-neutral-900 text-white">Outros</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Valor Bruto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.grossAmount}
                  onChange={(e) => setEditForm({ ...editForm, grossAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Taxa / Desconto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.feeAmount}
                  onChange={(e) => setEditForm({ ...editForm, feeAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Líquido Previsto</label>
                <div className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-sm font-mono text-emerald-400">
                  {formatCurrency((parseFloat(editForm.grossAmount) || 0) - (parseFloat(editForm.feeAmount) || 0))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <label className="block text-xs font-medium text-neutral-400 mb-1">Forma de Pagamento</label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                >
                  <option value="Pix" className="bg-neutral-900 text-white">Pix</option>
                  <option value="InfinitePay" className="bg-neutral-900 text-white">InfinitePay</option>
                  <option value="Cartão de crédito" className="bg-neutral-900 text-white">Cartão de Crédito</option>
                  <option value="Boleto" className="bg-neutral-900 text-white">Boleto</option>
                  <option value="Transferência" className="bg-neutral-900 text-white">Transferência</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ReceivableStatus })}
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
                <p className="text-xs font-semibold text-emerald-400">Dados da Liquidação</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Conta de Entrada</label>
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
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Data Efetiva do Pagamento</label>
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

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Observações Internas</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Notas sobre a fatura, negociação..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setRecToDelete(editingRec);
                  setIsDeleteModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Cobrança</span>
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

      {/* DELETE RECEIVABLE MODAL */}
      {recToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Excluir Conta a Receber"
          subtitle={`Esta ação removerá a cobrança "${recToDelete.description}"`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
              Tem certeza que deseja excluir esta cobrança de {formatCurrency(recToDelete.grossAmount)}?
              {recToDelete.status === 'Pago' && ' O valor já computado no saldo bancário será ajustado.'}
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

      {/* MARK AS PAID MODAL */}
      {selectedReceivable && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="Confirmar Recebimento"
          subtitle={`Liquidando: ${selectedReceivable.description} (${formatCurrency(selectedReceivable.grossAmount)})`}
        >
          <form onSubmit={handleConfirmReceive} className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
              O valor líquido de {formatCurrency(selectedReceivable.netAmount)} será creditado no saldo da conta selecionada e registrado no fluxo de caixa real.
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Conta de Entrada</label>
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
              <label className="block text-xs font-medium text-neutral-400 mb-1">Data Efetiva do Recebimento</label>
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
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition"
            >
              Confirmar e Creditar na Conta
            </button>
          </form>
        </Modal>
      )}

      {/* NEW RECEIVABLE MODAL */}
      <Modal
        isOpen={isNewReceivableOpen}
        onClose={() => setIsNewReceivableOpen(false)}
        title="Nova Cobrança a Receber"
        subtitle="Lance faturas avulsas, vendas InfinitePay ou parcelas"
      >
        <form onSubmit={handleCreateReceivable} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Cliente Vinculado</label>
            <select
              value={recClientId}
              onChange={(e) => setRecClientId(e.target.value)}
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
            <label className="block text-xs font-medium text-neutral-400 mb-1">Descrição</label>
            <input
              type="text"
              value={recDesc}
              onChange={(e) => setRecDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Categoria</label>
              <select
                value={recCategory}
                onChange={(e) => setRecCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="Sites" className="bg-neutral-900 text-white">Sites</option>
                <option value="Plano de Cuidado Digital" className="bg-neutral-900 text-white">Plano de Cuidado Digital</option>
                <option value="Serviços extras" className="bg-neutral-900 text-white">Serviços extras</option>
                <option value="Outros" className="bg-neutral-900 text-white">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Forma de Pagamento</label>
              <select
                value={recMethod}
                onChange={(e) => setRecMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="Pix" className="bg-neutral-900 text-white">Pix</option>
                <option value="InfinitePay" className="bg-neutral-900 text-white">InfinitePay</option>
                <option value="Cartão de crédito" className="bg-neutral-900 text-white">Cartão de Crédito</option>
                <option value="Boleto" className="bg-neutral-900 text-white">Boleto</option>
                <option value="Transferência" className="bg-neutral-900 text-white">Transferência</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Valor Bruto (R$)</label>
              <input
                type="number"
                step="0.01"
                value={recGross}
                onChange={(e) => setRecGross(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Taxa Financeira (R$)</label>
              <input
                type="number"
                step="0.01"
                value={recFee}
                onChange={(e) => setRecFee(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Vencimento</label>
              <input
                type="date"
                value={recDueDate}
                onChange={(e) => setRecDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Parcelas</label>
              <select
                value={recInstallments}
                onChange={(e) => setRecInstallments(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                {[1, 2, 3, 4, 6, 10, 12].map((n) => (
                  <option key={n} value={n} className="bg-neutral-900 text-white">
                    {n === 1 ? '1x à vista' : `${n}x`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Registrar Cobrança
          </button>
        </form>
      </Modal>
    </div>
  );
};

