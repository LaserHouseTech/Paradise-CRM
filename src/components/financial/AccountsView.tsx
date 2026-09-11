import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialAccount } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  Building2,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Plus,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { data, executeTransfer, addFinancialAccount, updateFinancialAccount } = useApp();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState(data.financialAccounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(data.financialAccounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Add Account Modal
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<FinancialAccount['type']>('Banco');
  const [newAccBalance, setNewAccBalance] = useState('0');

  // Edit Account Balance Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [editBalance, setEditBalance] = useState('');

  const totalBalance = data.financialAccounts.reduce((sum, a) => sum + a.balance, 0);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId || !amount || fromAccountId === toAccountId) return;

    executeTransfer(fromAccountId, toAccountId, parseFloat(amount), notes);
    setIsTransferModalOpen(false);
    setAmount('');
    setNotes('');
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    addFinancialAccount({
      name: newAccName.trim(),
      type: newAccType,
      balance: parseFloat(newAccBalance) || 0,
      isActive: true,
    });

    setIsNewAccountModalOpen(false);
    setNewAccName('');
    setNewAccBalance('0');
  };

  const handleUpdateBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    updateFinancialAccount(editingAccount.id, {
      balance: parseFloat(editBalance) || 0,
    });

    setIsEditModalOpen(false);
    setEditingAccount(null);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Banco':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'Gateway':
        return <CreditCard className="w-5 h-5 text-purple-400" />;
      default:
        return <Banknote className="w-5 h-5 text-emerald-400" />;
    }
  };

  // Find audit logs regarding transfers or data.transfers
  const transferLogs = data.auditLogs.filter((l) => l.action.includes('Transferência'));

  return (
    <div id="accounts-module" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Contas Financeiras & Saldos</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Gestão de saldos no Banco Inter, InfinitePay e Caixa local da Paradiso.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block mr-2">
            <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
              Saldo Total em Caixa
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {formatCurrency(totalBalance)}
            </span>
          </div>

          <button
            onClick={() => setIsNewAccountModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-medium hover:bg-white/10 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Conta</span>
          </button>

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0 shadow-sm"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transferência</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.financialAccounts.map((account) => (
          <div
            key={account.id}
            className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/20 transition flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  {getAccountIcon(account.type)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{account.name}</h3>
                  <span className="text-[11px] text-neutral-400">{account.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingAccount(account);
                    setEditBalance(account.balance.toString());
                    setIsEditModalOpen(true);
                  }}
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/5 transition"
                  title="Ajustar saldo da conta"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ativa
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.04] flex items-end justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 font-medium block uppercase tracking-wider">
                  Saldo Disponível
                </span>
                <p className="text-2xl font-bold font-mono text-white mt-0.5">
                  {formatCurrency(account.balance)}
                </p>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                {account.balance >= 0 ? 'Positivo' : 'Negativo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Transfer Rule Warning Banner */}
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
        <ArrowLeftRight className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-200">
          <p className="font-semibold text-white">Regra de Transferência Neutra</p>
          <p className="mt-0.5 text-neutral-300">
            Transferências entre contas (como resgatar saldo da InfinitePay para o Banco Inter PJ) apenas movimentam a custódia dos fundos. O sistema não altera o Faturamento nem gera despesas fictícias.
          </p>
        </div>
      </div>

      {/* Internal Transfer History */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Histórico de Transferências Internas</h3>
          <span className="text-xs text-neutral-400 font-mono">
            {data.transfers?.length || transferLogs.length} transferências registradas
          </span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {(data.transfers && data.transfers.length > 0) ? (
            data.transfers.map((trf) => {
              const fromAcc = data.financialAccounts.find((a) => a.id === trf.fromAccountId)?.name || 'Conta Origem';
              const toAcc = data.financialAccounts.find((a) => a.id === trf.toAccountId)?.name || 'Conta Destino';
              return (
                <div key={trf.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {fromAcc} <span className="text-neutral-400 font-normal">➔</span> {toAcc}
                      </p>
                      <p className="text-neutral-400 text-[11px] mt-0.5">
                        {formatDate(trf.date)} • {trf.description || 'Transferência entre contas'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white block">
                      {formatCurrency(trf.amount)}
                    </span>
                    <span className="font-medium text-emerald-400 text-[11px]">Liquidado</span>
                  </div>
                </div>
              );
            })
          ) : transferLogs.length > 0 ? (
            transferLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{log.details}</p>
                    <p className="text-neutral-400 text-[11px] mt-0.5">
                      {formatDate(log.timestamp)} • Paradiso Local
                    </p>
                  </div>
                </div>
                <span className="font-medium text-emerald-400 text-xs">Concluída</span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-neutral-500">
              Nenhuma transferência interna realizada recentemente.
            </div>
          )}
        </div>
      </div>

      {/* TRANSFER MODAL */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transferência Entre Contas"
        subtitle="Mova saldo entre contas bancárias sem alterar lucros ou despesas"
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Conta Origem (Débito)</label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
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
            <label className="block text-xs font-medium text-neutral-400 mb-1">Conta Destino (Crédito)</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
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
            <label className="block text-xs font-medium text-neutral-400 mb-1">Valor a Transferir (R$)</label>
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
            <label className="block text-xs font-medium text-neutral-400 mb-1">Motivo / Descrição</label>
            <input
              type="text"
              placeholder="Ex: Resgate de vendas InfinitePay para Inter PJ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Executar Transferência
          </button>
        </form>
      </Modal>

      {/* NEW ACCOUNT MODAL */}
      <Modal
        isOpen={isNewAccountModalOpen}
        onClose={() => setIsNewAccountModalOpen(false)}
        title="Cadastrar Nova Conta Financeira"
        subtitle="Adicione um novo banco, gateway ou carteira da agência"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Nome da Conta</label>
            <input
              type="text"
              placeholder="Ex: Nubank PJ, Itaú Empresas, Caixa Dinheiro"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Tipo de Conta</label>
            <select
              value={newAccType}
              onChange={(e) => setNewAccType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="Banco" className="bg-neutral-900 text-white">Banco (Conta Corrente / Investimento)</option>
              <option value="Gateway" className="bg-neutral-900 text-white">Gateway / Adquirente (InfinitePay, Mercado Pago)</option>
              <option value="Dinheiro" className="bg-neutral-900 text-white">Dinheiro Físico / Caixa Pequeno</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Saldo Inicial (R$)</label>
            <input
              type="number"
              step="0.01"
              value={newAccBalance}
              onChange={(e) => setNewAccBalance(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Cadastrar Conta
          </button>
        </form>
      </Modal>

      {/* EDIT BALANCE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Ajustar Saldo: ${editingAccount?.name || ''}`}
        subtitle="Ajuste manual de conciliação bancária"
      >
        <form onSubmit={handleUpdateBalance} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Novo Saldo Real (R$)</label>
            <input
              type="number"
              step="0.01"
              value={editBalance}
              onChange={(e) => setEditBalance(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Confirmar Ajuste de Saldo
          </button>
        </form>
      </Modal>
    </div>
  );
};
