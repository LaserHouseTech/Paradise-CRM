import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import {
  CreditCard,
  PlusCircle,
  Users,
  Receipt,
  ArrowLeftRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ClientOrigin, PaymentMethod } from '../../types';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'infinitepay' | 'bundle' | 'client' | 'payable' | 'transfer' | 'quick-receive';

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose }) => {
  const {
    data,
    addClient,
    createInfinitePaySale,
    createSiteAndCarePlanBundle,
    addPayable,
    markReceivableAsPaid,
    executeTransfer,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('infinitepay');

  // Form states
  // InfinitePay
  const [infClientId, setInfClientId] = useState(data.clients[0]?.id || '');
  const [infDescription, setInfDescription] = useState('Desenvolvimento Web');
  const [infGross, setInfGross] = useState('997');
  const [infFee, setInfFee] = useState('29.91'); // ~3%
  const [infInstallments, setInfInstallments] = useState('1');
  const [infFirstDate, setInfFirstDate] = useState(new Date().toISOString().split('T')[0]);

  // Site + Plano Bundle
  const [bundleClientId, setBundleClientId] = useState(data.clients[0]?.id || '');
  const [bundleProjectName, setBundleProjectName] = useState('Site Institucional + Cuidado Digital');
  const [bundleProjectPrice, setBundleProjectPrice] = useState('697');
  const [bundleMonthlyPrice, setBundleMonthlyPrice] = useState('197');
  const [bundleDueDay, setBundleDueDay] = useState('10');
  const [bundlePaidNow, setBundlePaidNow] = useState(true);
  const [bundleAccountId, setBundleAccountId] = useState(data.financialAccounts[0]?.id || '');
  const [bundlePaymentMethod, setBundlePaymentMethod] = useState<PaymentMethod>('Pix');

  // New Client
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [newClientState, setNewClientState] = useState('SP');
  const [newClientOrigin, setNewClientOrigin] = useState<ClientOrigin>('Prospecção ativa');

  // New Payable
  const [payDesc, setPayDesc] = useState('');
  const [payCategory, setPayCategory] = useState('Hospedagem');
  const [paySupplier, setPaySupplier] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDueDate, setPayDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [payIsRecurring, setPayIsRecurring] = useState(false);
  const [payPaidNow, setPayPaidNow] = useState(false);
  const [payAccountId, setPayAccountId] = useState(data.financialAccounts[0]?.id || '');

  // Quick Receive
  const [selectedReceivableId, setSelectedReceivableId] = useState('');
  const [receiveAccountId, setReceiveAccountId] = useState(data.financialAccounts[0]?.id || '');

  // Transfer
  const [trfFrom, setTrfFrom] = useState(data.financialAccounts[1]?.id || data.financialAccounts[0]?.id || '');
  const [trfTo, setTrfTo] = useState(data.financialAccounts[0]?.id || '');
  const [trfAmount, setTrfAmount] = useState('');
  const [trfDesc, setTrfDesc] = useState('Transferência interna');

  // Feedback
  const [successMsg, setSuccessMsg] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  const handleInfinitePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!infClientId || !infGross) return;

    createInfinitePaySale({
      clientId: infClientId,
      description: infDescription,
      grossAmount: parseFloat(infGross),
      feeAmount: parseFloat(infFee) || 0,
      installmentsCount: parseInt(infInstallments) || 1,
      saleDate: new Date().toISOString().split('T')[0],
      firstDueDate: infFirstDate,
      category: 'Sites',
    });
    triggerSuccess('Venda InfinitePay registrada com parcelas calculadas!');
  };

  const handleBundleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleClientId) return;

    createSiteAndCarePlanBundle({
      client: { id: bundleClientId },
      projectName: bundleProjectName,
      projectValue: parseFloat(bundleProjectPrice) || 697,
      monthlyPlanValue: parseFloat(bundleMonthlyPrice) || 197,
      dueDay: parseInt(bundleDueDay) || 10,
      paymentMethod: bundlePaymentMethod,
      paidNow: bundlePaidNow,
      accountId: bundleAccountId,
    });
    triggerSuccess('Site (R$ 697) + Plano de Cuidado (R$ 197/mês) cadastrados com sucesso!');
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientCompany || !newClientContact) return;

    addClient({
      companyName: newClientCompany,
      contactName: newClientContact,
      document: '',
      phone: newClientPhone,
      whatsapp: newClientPhone,
      email: newClientEmail,
      city: newClientCity || 'São Paulo',
      state: newClientState || 'SP',
      origin: newClientOrigin,
      status: 'Lead',
      pipelineStage: 'Prospectado',
      isRecurring: false,
    });
    triggerSuccess('Novo cliente/lead cadastrado com sucesso!');
  };

  const handlePayableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDesc || !payAmount) return;

    addPayable({
      description: payDesc,
      category: payCategory,
      supplier: paySupplier || 'Fornecedor',
      amount: parseFloat(payAmount),
      dueDate: payDueDate,
      paymentDate: payPaidNow ? payDueDate : undefined,
      paymentMethod: 'Pix',
      accountId: payPaidNow ? payAccountId : undefined,
      isRecurring: payIsRecurring,
      status: payPaidNow ? 'Pago' : 'Pendente',
    });
    triggerSuccess('Conta a pagar registrada com sucesso!');
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivableId || !receiveAccountId) return;
    markReceivableAsPaid(selectedReceivableId, receiveAccountId);
    triggerSuccess('Recebimento liquidado e creditado na conta com sucesso!');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trfFrom || !trfTo || !trfAmount || trfFrom === trfTo) return;
    executeTransfer(trfFrom, trfTo, parseFloat(trfAmount), trfDesc);
    triggerSuccess('Transferência interna realizada! Saldos atualizados.');
  };

  const pendingReceivables = data.receivables.filter(
    (r) => r.status === 'Pendente' || r.status === 'Vencido'
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ações Rápidas" subtitle="Lançamentos ágeis no sistema">
      {successMsg ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
          <p className="text-base font-semibold text-white">{successMsg}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-medium text-neutral-400">
            <button
              onClick={() => setActiveTab('infinitepay')}
              className={`py-2 px-1 rounded-lg transition text-center truncate ${
                activeTab === 'infinitepay' ? 'bg-white text-neutral-900 font-semibold shadow' : 'hover:text-white'
              }`}
            >
              InfinitePay
            </button>
            <button
              onClick={() => setActiveTab('bundle')}
              className={`py-2 px-1 rounded-lg transition text-center truncate ${
                activeTab === 'bundle' ? 'bg-white text-neutral-900 font-semibold shadow' : 'hover:text-white'
              }`}
            >
              Site + Plano
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`py-2 px-1 rounded-lg transition text-center truncate ${
                activeTab === 'client' ? 'bg-white text-neutral-900 font-semibold shadow' : 'hover:text-white'
              }`}
            >
              Novo Cliente
            </button>
            <button
              onClick={() => setActiveTab('quick-receive')}
              className={`py-2 px-1 rounded-lg transition text-center truncate ${
                activeTab === 'quick-receive' ? 'bg-white text-neutral-900 font-semibold shadow' : 'hover:text-white'
              }`}
            >
              Receber
            </button>
            <button
              onClick={() => setActiveTab('payable')}
              className={`py-2 px-1 rounded-lg transition text-center truncate ${
                activeTab === 'payable' ? 'bg-white text-neutral-900 font-semibold shadow' : 'hover:text-white'
              }`}
            >
              Nova Despesa
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`py-2 px-1 rounded-lg transition text-center truncate ${
                activeTab === 'transfer' ? 'bg-white text-neutral-900 font-semibold shadow' : 'hover:text-white'
              }`}
            >
              Transferência
            </button>
          </div>

          {/* TAB 1: InfinitePay */}
          {activeTab === 'infinitepay' && (
            <form onSubmit={handleInfinitePaySubmit} className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                Lançamento manual de venda via InfinitePay. O sistema deduz a taxa automaticamente e divide as parcelas nos meses subsequentes.
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-neutral-400">Cliente</label>
                  {data.clients.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('client')}
                      className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                    >
                      + Cadastrar novo cliente
                    </button>
                  )}
                </div>
                <select
                  value={infClientId}
                  onChange={(e) => setInfClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                >
                  {data.clients.length === 0 ? (
                    <option value="" disabled className="bg-neutral-900 text-neutral-500">
                      Nenhum cliente cadastrado ainda
                    </option>
                  ) : (
                    <>
                      <option value="" className="bg-neutral-900 text-neutral-500">-- Selecione um cliente --</option>
                      {data.clients.map((c) => (
                        <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                          {c.companyName} ({c.contactName})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Descrição</label>
                <input
                  type="text"
                  value={infDescription}
                  onChange={(e) => setInfDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Valor Bruto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={infGross}
                    onChange={(e) => {
                      setInfGross(e.target.value);
                      const gross = parseFloat(e.target.value) || 0;
                      setInfFee((gross * 0.03).toFixed(2));
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Taxa InfinitePay (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={infFee}
                    onChange={(e) => setInfFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Valor Líquido</label>
                  <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-emerald-400 font-mono font-semibold">
                    R$ {((parseFloat(infGross) || 0) - (parseFloat(infFee) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Parcelamento</label>
                  <select
                    value={infInstallments}
                    onChange={(e) => setInfInstallments(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  >
                    {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
                      <option key={num} value={num} className="bg-neutral-900 text-white">
                        {num === 1 ? '1x à vista' : `${num}x parcelado`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Primeiro Vencimento</label>
                  <input
                    type="date"
                    value={infFirstDate}
                    onChange={(e) => setInfFirstDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
              >
                Registrar Venda InfinitePay
              </button>
            </form>
          )}

          {/* TAB 2: Site + Plano Bundle */}
          {activeTab === 'bundle' && (
            <form onSubmit={handleBundleSubmit} className="space-y-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                Regra Especial Paradiso: Registra o Projeto inicial (R$ 697) e ativa o Plano de Cuidado Digital recorrente (R$ 197/mês) de forma independente no financeiro.
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-neutral-400">Cliente</label>
                  {data.clients.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('client')}
                      className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                    >
                      + Cadastrar novo cliente
                    </button>
                  )}
                </div>
                <select
                  value={bundleClientId}
                  onChange={(e) => setBundleClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                >
                  {data.clients.length === 0 ? (
                    <option value="" disabled className="bg-neutral-900 text-neutral-500">
                      Nenhum cliente cadastrado ainda
                    </option>
                  ) : (
                    <>
                      <option value="" className="bg-neutral-900 text-neutral-500">-- Selecione um cliente --</option>
                      {data.clients.map((c) => (
                        <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                          {c.companyName}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Valor do Site (R$)</label>
                  <input
                    type="number"
                    value={bundleProjectPrice}
                    onChange={(e) => setBundleProjectPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Mensalidade Cuidado (R$/mês)</label>
                  <input
                    type="number"
                    value={bundleMonthlyPrice}
                    onChange={(e) => setBundleMonthlyPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Dia do Vencimento Mensal</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={bundleDueDay}
                    onChange={(e) => setBundleDueDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Forma de Pagamento</label>
                  <select
                    value={bundlePaymentMethod}
                    onChange={(e) => setBundlePaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  >
                    <option value="Pix" className="bg-neutral-900 text-white">Pix</option>
                    <option value="InfinitePay" className="bg-neutral-900 text-white">InfinitePay</option>
                    <option value="Cartão de crédito" className="bg-neutral-900 text-white">Cartão de Crédito</option>
                    <option value="Transferência" className="bg-neutral-900 text-white">Transferência</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-200">
                  <input
                    type="checkbox"
                    checked={bundlePaidNow}
                    onChange={(e) => setBundlePaidNow(e.target.checked)}
                    className="rounded bg-white/10 border-white/20"
                  />
                  <span>Entrada do site já foi paga agora</span>
                </label>

                {bundlePaidNow && (
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Creditar na Conta:</label>
                    <select
                      value={bundleAccountId}
                      onChange={(e) => setBundleAccountId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                    >
                      {data.financialAccounts.map((a) => (
                        <option key={a.id} value={a.id} className="bg-neutral-900 text-white">
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
              >
                Cadastrar Projeto + Assinatura
              </button>
            </form>
          )}

          {/* TAB 3: New Client */}
          {activeTab === 'client' && (
            <form onSubmit={handleClientSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Nome da Clínica / Empresa</label>
                <input
                  type="text"
                  placeholder="Ex: Instituto de Olhos Visão"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Responsável / Médico(a)</label>
                  <input
                    type="text"
                    placeholder="Ex: Dra. Ana Luiza"
                    value={newClientContact}
                    onChange={(e) => setNewClientContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={newClientCity}
                    onChange={(e) => setNewClientCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Origem do Lead</label>
                  <select
                    value={newClientOrigin}
                    onChange={(e) => setNewClientOrigin(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  >
                    <option value="Prospecção ativa" className="bg-neutral-900 text-white">Prospecção ativa</option>
                    <option value="Instagram" className="bg-neutral-900 text-white">Instagram</option>
                    <option value="Tráfego pago" className="bg-neutral-900 text-white">Tráfego pago</option>
                    <option value="Indicação" className="bg-neutral-900 text-white">Indicação</option>
                    <option value="Orgânico" className="bg-neutral-900 text-white">Orgânico</option>
                    <option value="Outros" className="bg-neutral-900 text-white">Outros</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
              >
                Salvar Cliente / Lead
              </button>
            </form>
          )}

          {/* TAB 4: Quick Receive */}
          {activeTab === 'quick-receive' && (
            <form onSubmit={handleReceiveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Selecione o Recebimento em Aberto</label>
                {pendingReceivables.length === 0 ? (
                  <p className="p-4 text-xs text-neutral-400 bg-white/[0.04] rounded-lg text-center">
                    Não há recebimentos pendentes no momento.
                  </p>
                ) : (
                  <select
                    value={selectedReceivableId}
                    onChange={(e) => setSelectedReceivableId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                    required
                  >
                    <option value="" className="bg-neutral-900 text-white">-- Escolha uma fatura --</option>
                    {pendingReceivables.map((r) => {
                      const client = data.clients.find((c) => c.id === r.clientId)?.companyName || 'Cliente';
                      return (
                        <option key={r.id} value={r.id} className="bg-neutral-900 text-white">
                          {client}: {r.description} (R$ {r.grossAmount.toFixed(2)}) - Venc: {r.dueDate}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Conta de Destino</label>
                <select
                  value={receiveAccountId}
                  onChange={(e) => setReceiveAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                >
                  {data.financialAccounts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-neutral-900 text-white">
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedReceivableId}
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition"
              >
                Confirmar Recebimento
              </button>
            </form>
          )}

          {/* TAB 5: Payable */}
          {activeTab === 'payable' && (
            <form onSubmit={handlePayableSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Descrição da Despesa</label>
                <input
                  type="text"
                  placeholder="Ex: Servidores Cloud Vercel"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Categoria</label>
                  <select
                    value={payCategory}
                    onChange={(e) => setPayCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  >
                    {data.categories
                      .filter((c) => c.type === 'payable' && c.isActive)
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
                    placeholder="Ex: Vercel Inc."
                    value={paySupplier}
                    onChange={(e) => setPaySupplier(e.target.value)}
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
                    placeholder="0,00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    value={payDueDate}
                    onChange={(e) => setPayDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payIsRecurring}
                    onChange={(e) => setPayIsRecurring(e.target.checked)}
                    className="rounded bg-white/10 border-white/20"
                  />
                  <span>Despesa recorrente (mensal)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payPaidNow}
                    onChange={(e) => setPayPaidNow(e.target.checked)}
                    className="rounded bg-white/10 border-white/20"
                  />
                  <span>Já foi paga agora</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
              >
                Salvar Despesa
              </button>
            </form>
          )}

          {/* TAB 6: Transfer */}
          {activeTab === 'transfer' && (
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300">
                Transferência Interna: Move recursos entre contas da agência (ex: InfinitePay para Conta PJ). Não afeta Faturamento, Receita ou Lucro.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Conta Origem (Saída)</label>
                  <select
                    value={trfFrom}
                    onChange={(e) => setTrfFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                    required
                  >
                    {data.financialAccounts.map((a) => (
                      <option key={a.id} value={a.id} className="bg-neutral-900 text-white">
                        {a.name} (Saldo: R$ {a.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Conta Destino (Entrada)</label>
                  <select
                    value={trfTo}
                    onChange={(e) => setTrfTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                    required
                  >
                    {data.financialAccounts.map((a) => (
                      <option key={a.id} value={a.id} className="bg-neutral-900 text-white">
                        {a.name} (Saldo: R$ {a.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Valor da Transferência (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={trfAmount}
                  onChange={(e) => setTrfAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition"
              >
                Efetuar Transferência Interna
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
};
