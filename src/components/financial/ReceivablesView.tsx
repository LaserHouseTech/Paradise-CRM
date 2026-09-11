import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Receivable, PaymentMethod, ReceivableStatus } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowDownLeft,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const ReceivablesView: React.FC = () => {
  const {
    data,
    addReceivable,
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
    <div id="receivables-module" className="space-y-6 pb-12">
      {/* Top Header & Fast KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Total Cobrado (Filtro)</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{formatCurrency(totalGross)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Recebido Efetivamente</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
          <span className="text-[11px] text-neutral-400 font-medium">Aguardando Pagamento</span>
          <p className="text-xl font-bold font-mono text-blue-400 mt-1">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por descrição ou clínica..."
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
            <option value="Sites" className="bg-neutral-900 text-white">Sites</option>
            <option value="Plano de Cuidado Digital" className="bg-neutral-900 text-white">Plano de Cuidado Digital</option>
            <option value="Serviços extras" className="bg-neutral-900 text-white">Serviços extras</option>
          </select>
        </div>

        <button
          onClick={() => setIsNewReceivableOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nova Cobrança</span>
        </button>
      </div>

      {/* Receivables Table */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium">
                <th className="p-4">Descrição / Detalhes</th>
                <th className="p-4">Clínica</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Método</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4 text-right">Bruto</th>
                <th className="p-4 text-right">Taxa</th>
                <th className="p-4 text-right">Líquido</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredReceivables.map((rec) => {
                const client = data.clients.find((c) => c.id === rec.clientId);
                return (
                  <tr key={rec.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <p className="font-semibold text-white">{rec.description}</p>
                      {rec.installmentsCount && rec.installmentsCount > 1 && (
                        <span className="text-[10px] text-blue-400 font-mono">
                          Parcela {rec.currentInstallment}/{rec.installmentsCount}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-neutral-300">
                      <button
                        onClick={() => client && setSelectedClientId(client.id)}
                        className="hover:underline text-left font-medium"
                      >
                        {client?.companyName || '-'}
                      </button>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 text-[11px]">
                        {rec.category}
                      </span>
                    </td>

                    <td className="p-4 text-neutral-300">{rec.paymentMethod}</td>

                    <td className="p-4 text-neutral-300 font-mono">{formatDate(rec.dueDate)}</td>

                    <td className="p-4 text-right font-mono font-medium text-white">
                      {formatCurrency(rec.grossAmount)}
                    </td>

                    <td className="p-4 text-right font-mono text-neutral-400">
                      {rec.feeAmount > 0 ? `-${formatCurrency(rec.feeAmount)}` : 'R$ 0,00'}
                    </td>

                    <td className="p-4 text-right font-mono font-semibold text-emerald-400">
                      {formatCurrency(rec.netAmount)}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-medium text-[11px] ${
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

                    <td className="p-4 text-center">
                      {rec.status !== 'Pago' ? (
                        <button
                          onClick={() => handleOpenReceiveModal(rec)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition flex items-center gap-1 mx-auto"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Receber</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {rec.paymentDate ? formatDate(rec.paymentDate) : 'Liquidado'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
