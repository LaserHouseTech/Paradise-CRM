import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientStatus, ClientOrigin, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  Users,
  Search,
  Filter,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Instagram,
  Repeat,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  FolderKanban,
  Receipt,
  Edit3,
  Camera,
  Upload,
  Trash2,
  Sparkles,
  Check,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';

const PRESET_AVATARS = [
  { name: 'Dr. Odonto', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Dra. Dermatologista', url: 'https://images.unsplash.com/photo-1594824813583-b71a06a20c3a?w=150&auto=format&fit=crop&q=80' },
  { name: 'Estética Médica', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { name: 'Ortopedia & Cirurgia', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80' },
  { name: 'Psiquiatria & Saúde Mental', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80' },
  { name: 'Oftalmologia Clínica', url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80' },
  { name: 'Pediatria Integrada', url: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Clínica & Bem-estar', url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=150&auto=format&fit=crop&q=80' },
];

export const ClientsView: React.FC = () => {
  const {
    data,
    addClient,
    updateClient,
    deleteClient,
    selectedClientId,
    setSelectedClientId,
    addReceivable,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [originFilter, setOriginFilter] = useState<string>('todos');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // Delete client modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);

  // Extra service modal state
  const [isExtraServiceModalOpen, setIsExtraServiceModalOpen] = useState(false);
  const [extraServiceName, setExtraServiceName] = useState('');
  const [extraServicePrice, setExtraServicePrice] = useState('');
  const [extraServiceCategory, setExtraServiceCategory] = useState('Serviços extras');
  const [extraServicePaidNow, setExtraServicePaidNow] = useState(true);
  const [extraServiceAccountId, setExtraServiceAccountId] = useState(data.financialAccounts[0]?.id || '');
  const [extraServicePaymentMethod, setExtraServicePaymentMethod] = useState<PaymentMethod>('Pix');

  // New Client Form state
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    avatarUrl: '',
    document: '',
    phone: '',
    whatsapp: '',
    email: '',
    city: 'São Paulo',
    state: 'SP',
    instagram: '',
    currentWebsite: '',
    address: '',
    notes: '',
    origin: 'Prospecção ativa' as ClientOrigin,
    status: 'Cliente ativo' as ClientStatus,
    isRecurring: false,
  });

  // Edit Client Modal state
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    contactName: '',
    avatarUrl: '',
    document: '',
    phone: '',
    whatsapp: '',
    email: '',
    city: 'São Paulo',
    state: 'SP',
    instagram: '',
    currentWebsite: '',
    address: '',
    notes: '',
    origin: 'Prospecção ativa' as ClientOrigin,
    status: 'Cliente ativo' as ClientStatus,
    isRecurring: false,
  });

  const newClientFileInputRef = useRef<HTMLInputElement>(null);
  const editClientFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEditClient = (client: Client) => {
    setEditingClient(client);
    setEditFormData({
      companyName: client.companyName || '',
      contactName: client.contactName || '',
      avatarUrl: client.avatarUrl || '',
      document: client.document || '',
      phone: client.phone || '',
      whatsapp: client.whatsapp || '',
      email: client.email || '',
      city: client.city || 'São Paulo',
      state: client.state || 'SP',
      instagram: client.instagram || '',
      currentWebsite: client.currentWebsite || '',
      address: client.address || '',
      notes: client.notes || '',
      origin: client.origin || 'Prospecção ativa',
      status: client.status || 'Cliente ativo',
      isRecurring: client.isRecurring || false,
    });
    setIsEditClientModalOpen(true);
  };

  const handleSaveEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editFormData.companyName || !editFormData.contactName) return;

    updateClient(editingClient.id, {
      ...editFormData,
    });

    setIsEditClientModalOpen(false);
    setEditingClient(null);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('A foto selecionada ultrapassa 5MB. Por favor, escolha uma imagem menor.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        if (isEdit) {
          setEditFormData((prev) => ({ ...prev, avatarUrl: base64 }));
        } else {
          setFormData((prev) => ({ ...prev, avatarUrl: base64 }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!clientToDelete) return;
    const clientName = clientToDelete.companyName;
    const clientId = clientToDelete.id;

    deleteClient(clientId);
    setIsDeleteModalOpen(false);
    setClientToDelete(null);

    if (selectedClientId === clientId) {
      setSelectedClientId(null);
    }

    setDeleteSuccessToast(`Cliente "${clientName}" e todos os registros associados foram excluídos com sucesso.`);
    setTimeout(() => {
      setDeleteSuccessToast(null);
    }, 6000);
  };

  // Calculations for client to delete
  const toDeleteProjectsCount = clientToDelete
    ? data.projects.filter((p) => p.clientId === clientToDelete.id).length
    : 0;
  const toDeleteSubsCount = clientToDelete
    ? data.subscriptions.filter((s) => s.clientId === clientToDelete.id).length
    : 0;
  const toDeleteRecs = clientToDelete
    ? data.receivables.filter((r) => r.clientId === clientToDelete.id)
    : [];
  const toDeleteRecsCount = toDeleteRecs.length;
  const toDeleteRecsSum = toDeleteRecs.reduce((sum, r) => sum + r.grossAmount, 0);
  const toDeleteRefsCount = clientToDelete
    ? data.referrals.filter((ref) => ref.referredClientId === clientToDelete.id).length
    : 0;

  const filteredClients = data.clients.filter((client) => {
    const matchesSearch =
      client.companyName.toLowerCase().includes(search.toLowerCase()) ||
      client.contactName.toLowerCase().includes(search.toLowerCase()) ||
      client.city.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || client.status === statusFilter;
    const matchesOrigin = originFilter === 'todos' || client.origin === originFilter;

    return matchesSearch && matchesStatus && matchesOrigin;
  });

  const selectedClient = data.clients.find((c) => c.id === selectedClientId);

  // Client related data
  const clientProjects = data.projects.filter((p) => p.clientId === selectedClientId);
  const clientSubscriptions = data.subscriptions.filter((s) => s.clientId === selectedClientId);
  const clientReceivables = data.receivables.filter((r) => r.clientId === selectedClientId);
  const clientAuditLogs = data.auditLogs.filter((l) => l.entityId === selectedClientId || l.details.includes(selectedClient?.companyName || ''));

  const totalPaid = clientReceivables
    .filter((r) => r.status === 'Pago')
    .reduce((sum, r) => sum + r.grossAmount, 0);

  const totalOpen = clientReceivables
    .filter((r) => r.status === 'Pendente' || r.status === 'Vencido')
    .reduce((sum, r) => sum + r.grossAmount, 0);

  const activeMrr = clientSubscriptions
    .filter((s) => s.status === 'Ativo')
    .reduce((sum, s) => sum + s.monthlyValue, 0);

  const handleSaveNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactName) return;

    addClient({
      ...formData,
      totalSpent: 0,
    });

    setIsNewClientModalOpen(false);
    setFormData({
      companyName: '',
      contactName: '',
      avatarUrl: '',
      document: '',
      phone: '',
      whatsapp: '',
      email: '',
      city: 'São Paulo',
      state: 'SP',
      instagram: '',
      currentWebsite: '',
      address: '',
      notes: '',
      origin: 'Prospecção ativa',
      status: 'Cliente ativo',
      isRecurring: false,
    });
  };

  const handleAddExtraService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !extraServiceName || !extraServicePrice) return;

    const price = parseFloat(extraServicePrice);
    addReceivable({
      clientId: selectedClient.id,
      description: `Serviço Extra: ${extraServiceName}`,
      category: extraServiceCategory,
      grossAmount: price,
      feeAmount: 0,
      netAmount: price,
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: extraServicePaidNow ? new Date().toISOString().split('T')[0] : undefined,
      paymentMethod: extraServicePaymentMethod,
      accountId: extraServicePaidNow ? extraServiceAccountId : undefined,
      status: extraServicePaidNow ? 'Pago' : 'Pendente',
      notes: `Venda adicional registrada para ${selectedClient.companyName}.`,
    });

    // Update total spent on client
    updateClient(selectedClient.id, {
      totalSpent: (selectedClient.totalSpent || 0) + price,
    });

    setIsExtraServiceModalOpen(false);
    setExtraServiceName('');
    setExtraServicePrice('');
  };

  return (
    <div id="clients-module" className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {deleteSuccessToast && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">{deleteSuccessToast}</span>
          </div>
          <button
            onClick={() => setDeleteSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200 transition text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-emerald-500/20"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por clínica, médico ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="todos" className="bg-neutral-900 text-white">Todos os Status</option>
            <option value="Cliente ativo" className="bg-neutral-900 text-white">Cliente Ativo</option>
            <option value="Cliente recorrente" className="bg-neutral-900 text-white">Cliente Recorrente</option>
            <option value="Lead" className="bg-neutral-900 text-white">Lead</option>
            <option value="Em negociação" className="bg-neutral-900 text-white">Em Negociação</option>
            <option value="Proposta enviada" className="bg-neutral-900 text-white">Proposta Enviada</option>
            <option value="Cliente inativo" className="bg-neutral-900 text-white">Inativo</option>
            <option value="Cancelado" className="bg-neutral-900 text-white">Cancelado</option>
          </select>

          {/* Origin Filter */}
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-neutral-300 focus:outline-none hidden md:block"
          >
            <option value="todos" className="bg-neutral-900 text-white">Todas as Origens</option>
            <option value="Prospecção ativa" className="bg-neutral-900 text-white">Prospecção Ativa</option>
            <option value="Instagram" className="bg-neutral-900 text-white">Instagram</option>
            <option value="Tráfego pago" className="bg-neutral-900 text-white">Tráfego Pago</option>
            <option value="Indicação" className="bg-neutral-900 text-white">Indicação</option>
            <option value="Orgânico" className="bg-neutral-900 text-white">Orgânico</option>
          </select>
        </div>

        <button
          onClick={() => setIsNewClientModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Clients Table / Cards */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 font-medium">
                <th className="p-4">Clínica / Empresa</th>
                <th className="p-4">Responsável</th>
                <th className="p-4">Cidade/UF</th>
                <th className="p-4">Origem</th>
                <th className="p-4">Status</th>
                <th className="p-4">Recorrência</th>
                <th className="p-4 text-right">Total Investido</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className="hover:bg-white/[0.03] transition cursor-pointer group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      {client.avatarUrl ? (
                        <img
                          src={client.avatarUrl}
                          alt={client.companyName}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10 shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 font-semibold text-xs shrink-0">
                          {client.companyName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white tracking-tight group-hover:text-blue-400 transition">
                          {client.companyName}
                        </p>
                        <p className="text-[11px] text-neutral-400">{client.email || client.phone || '-'}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-neutral-300 font-medium">
                    {client.contactName}
                  </td>

                  <td className="p-4 text-neutral-400">
                    {client.city}/{client.state}
                  </td>

                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 text-[11px]">
                      {client.origin}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                        client.status === 'Cliente recorrente'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : client.status === 'Cliente ativo'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : client.status === 'Em negociação' || client.status === 'Proposta enviada'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>

                  <td className="p-4">
                    {client.isRecurring ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Plano Ativo</span>
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-[11px]">Avulso</span>
                    )}
                  </td>

                  <td className="p-4 text-right font-mono font-semibold text-white">
                    {formatCurrency(client.totalSpent || 0)}
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedClientId(client.id)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition text-xs font-medium"
                      >
                        Ver Dossiê
                      </button>
                      <button
                        onClick={() => handleOpenEditClient(client)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-blue-500/20 text-neutral-300 hover:text-blue-300 border border-white/5 hover:border-blue-500/30 transition text-xs font-medium"
                        title="Editar cliente e foto de perfil"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleOpenDeleteClient(client)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition text-xs font-medium"
                        title="Apagar cliente e tudo relacionado"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Apagar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-neutral-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">Nenhum cliente cadastrado ainda</p>
                        <p className="text-xs text-neutral-400">Sua base de clientes está 100% zerada e pronta para o início das operações reais.</p>
                      </div>
                      <button
                        onClick={() => setIsNewClientModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Cadastrar Primeiro Cliente</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLIENT DOSSIER MODAL / DRAWER (Section 25: Histórico Financeiro Completo) */}
      {selectedClient && (
        <Modal
          isOpen={!!selectedClientId}
          onClose={() => setSelectedClientId(null)}
          title={selectedClient.companyName}
          subtitle={`Dossiê Financeiro & Operacional • Responsável: ${selectedClient.contactName}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Client Profile Header with Avatar & Edit Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3.5">
                {selectedClient.avatarUrl ? (
                  <img
                    src={selectedClient.avatarUrl}
                    alt={selectedClient.companyName}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md">
                    {selectedClient.companyName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white">{selectedClient.companyName}</h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                      {selectedClient.city}/{selectedClient.state}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Responsável: <strong className="text-neutral-200">{selectedClient.contactName}</strong> • {selectedClient.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                <button
                  onClick={() => handleOpenEditClient(selectedClient)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition text-xs font-semibold shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Cadastro & Foto</span>
                </button>
                <button
                  onClick={() => handleOpenDeleteClient(selectedClient)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition text-xs font-semibold shadow-sm"
                  title="Apagar cliente e tudo relacionado"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Apagar Cliente</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Header for Client */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Total Já Pago</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Valores em Aberto</span>
                <span className="text-sm font-bold font-mono text-blue-400">
                  {formatCurrency(totalOpen)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">MRR Gerado</span>
                <span className="text-sm font-bold font-mono text-purple-400">
                  {formatCurrency(activeMrr)}/mês
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Plano de Cuidado</span>
                <span className={`text-xs font-medium ${selectedClient.isRecurring ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {selectedClient.isRecurring ? 'Ativo (Recorrente)' : 'Sem plano'}
                </span>
              </div>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Dados Cadastrais</span>
                </h4>
                <p><span className="text-neutral-500">Documento (CNPJ/CPF):</span> {selectedClient.document || 'Não informado'}</p>
                <p><span className="text-neutral-500">Telefone / WhatsApp:</span> {selectedClient.phone || '-'}</p>
                <p><span className="text-neutral-500">E-mail:</span> {selectedClient.email || '-'}</p>
                <p><span className="text-neutral-500">Endereço:</span> {selectedClient.address || '-'}</p>
                <p><span className="text-neutral-500">Localização:</span> {selectedClient.city}/{selectedClient.state}</p>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Presença Digital & Origem</span>
                </h4>
                <p><span className="text-neutral-500">Origem do Cliente:</span> {selectedClient.origin}</p>
                <p><span className="text-neutral-500">Data de Cadastro:</span> {formatDate(selectedClient.createdAt)}</p>
                <p><span className="text-neutral-500">Instagram:</span> {selectedClient.instagram || '-'}</p>
                <p><span className="text-neutral-500">Site Atual:</span> {selectedClient.currentWebsite || '-'}</p>
                {selectedClient.notes && (
                  <p><span className="text-neutral-500">Observações:</span> {selectedClient.notes}</p>
                )}
              </div>
            </div>

            {/* SECTION 24: SERVIÇOS EXTRAS BUTTON */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
              <div>
                <p className="text-xs font-semibold text-white">Vendas Adicionais & Serviços Extras</p>
                <p className="text-[11px] text-neutral-400">
                  Adicione novas páginas, landing pages, ou integrações adicionais a este cliente.
                </p>
              </div>
              <button
                onClick={() => setIsExtraServiceModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium flex items-center gap-1.5 transition shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Adicionar Serviço Extra</span>
              </button>
            </div>

            {/* Subscriptions section */}
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-purple-400" />
                <span>Assinaturas do Plano de Cuidado Digital</span>
              </h4>
              {clientSubscriptions.length === 0 ? (
                <p className="text-xs text-neutral-500 p-3 bg-white/[0.02] rounded-lg">
                  Cliente não possui assinatura ativa do Plano de Cuidado Digital.
                </p>
              ) : (
                <div className="space-y-2">
                  {clientSubscriptions.map((sub) => (
                    <div key={sub.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{sub.planName}</p>
                        <p className="text-neutral-400 text-[11px]">
                          Início: {formatDate(sub.startDate)} • Vencimento: todo dia {sub.dueDay} • Próx: {formatDate(sub.nextDueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-purple-400">{formatCurrency(sub.monthlyValue)}/mês</span>
                        <span className={`block text-[10px] font-medium ${sub.status === 'Ativo' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projects section */}
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
                <span>Projetos Contratados</span>
              </h4>
              {clientProjects.length === 0 ? (
                <p className="text-xs text-neutral-500 p-3 bg-white/[0.02] rounded-lg">
                  Nenhum projeto registrado para este cliente.
                </p>
              ) : (
                <div className="space-y-2">
                  {clientProjects.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{p.name}</p>
                        <p className="text-neutral-400 text-[11px]">
                          {p.serviceName} • Entrega: {formatDate(p.deliveryDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white">{formatCurrency(p.contractValue)}</span>
                        <span className="block text-[10px] text-neutral-400">
                          Pago: {formatCurrency(p.paidAmount || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Receivables & Payments History */}
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Histórico de Faturas & Pagamentos</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {clientReceivables.map((r) => (
                  <div key={r.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-white">{r.description}</p>
                      <p className="text-neutral-500 text-[11px]">
                        Vencimento: {formatDate(r.dueDate)} • {r.paymentMethod}
                        {r.paymentDate && ` • Pago em ${formatDate(r.paymentDate)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-white">{formatCurrency(r.grossAmount)}</span>
                      <span className={`block text-[10px] ${r.status === 'Pago' ? 'text-emerald-400' : r.status === 'Vencido' ? 'text-red-400' : 'text-amber-400'}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* NEW CLIENT MODAL */}
      <Modal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        title="Cadastrar Novo Cliente"
        subtitle="Adicione uma nova clínica ou empresa ao CRM Paradiso"
      >
        <form onSubmit={handleSaveNewClient} className="space-y-4">
          {/* Avatar / Foto de Perfil */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
            <label className="block text-xs font-semibold text-white">
              Foto de Perfil / Logotipo do Cliente
            </label>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/50 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-neutral-400 gap-1">
                    <Camera className="w-5 h-5 text-neutral-400" />
                    <span className="text-[9px]">Sem foto</span>
                  </div>
                )}
                {formData.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                    className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow"
                    title="Remover foto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={newClientFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleAvatarFileUpload(e, false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newClientFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    <span>Upload de Foto</span>
                  </button>
                  <span className="text-[11px] text-neutral-400">JPG, PNG ou WEBP</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Ou cole a URL da foto..."
                    value={formData.avatarUrl.startsWith('data:') ? '' : formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[10px] text-neutral-400 block mb-1.5 font-medium">Ou escolha um avatar sugerido:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatarUrl: preset.url })}
                    className={`relative shrink-0 rounded-xl overflow-hidden border transition ${
                      formData.avatarUrl === preset.url
                        ? 'ring-2 ring-blue-400 border-blue-400 scale-105'
                        : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                    }`}
                    title={preset.name}
                  >
                    <img src={preset.url} alt={preset.name} className="w-9 h-9 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Nome da Clínica / Empresa</label>
            <input
              type="text"
              placeholder="Ex: Instituto Odontológico Sorrir"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Nome do Responsável / Médico</label>
              <input
                type="text"
                placeholder="Ex: Dr. Marcelo Ramos"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">CPF / CNPJ</label>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                placeholder="(11) 98888-7777"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="contato@clinica.com.br"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Cidade</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Origem</label>
              <select
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value as any })}
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

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Status Inicial</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="Cliente ativo" className="bg-neutral-900 text-white">Cliente Ativo</option>
              <option value="Cliente recorrente" className="bg-neutral-900 text-white">Cliente Recorrente</option>
              <option value="Lead" className="bg-neutral-900 text-white">Lead</option>
              <option value="Em negociação" className="bg-neutral-900 text-white">Em Negociação</option>
              <option value="Proposta enviada" className="bg-neutral-900 text-white">Proposta Enviada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Observações</label>
            <textarea
              rows={2}
              placeholder="Detalhes sobre a clínica, público-alvo, procedimentos de alto ticket..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Cadastrar Cliente
          </button>
        </form>
      </Modal>

      {/* EDIT CLIENT MODAL */}
      {editingClient && (
        <Modal
          isOpen={isEditClientModalOpen}
          onClose={() => {
            setIsEditClientModalOpen(false);
            setEditingClient(null);
          }}
          title={`Editar Cliente: ${editingClient.companyName}`}
          subtitle="Atualize os dados cadastrais, contato, endereço e foto de perfil"
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveEditClient} className="space-y-4">
            {/* Avatar / Foto de Perfil */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <label className="block text-xs font-semibold text-white">
                Foto de Perfil / Logotipo do Cliente
              </label>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {editFormData.avatarUrl ? (
                    <img
                      src={editFormData.avatarUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/50 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-neutral-400 gap-1">
                      <Camera className="w-5 h-5 text-neutral-400" />
                      <span className="text-[9px]">Sem foto</span>
                    </div>
                  )}
                  {editFormData.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, avatarUrl: '' })}
                      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow"
                      title="Remover foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={editClientFileInputRef}
                      accept="image/*"
                      onChange={(e) => handleAvatarFileUpload(e, true)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editClientFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>Upload de Foto</span>
                    </button>
                    <span className="text-[11px] text-neutral-400">JPG, PNG ou WEBP</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Ou cole a URL da foto..."
                      value={editFormData.avatarUrl.startsWith('data:') ? '' : editFormData.avatarUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, avatarUrl: e.target.value })}
                      className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1.5 font-medium">Ou escolha um avatar sugerido:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, avatarUrl: preset.url })}
                      className={`relative shrink-0 rounded-xl overflow-hidden border transition ${
                        editFormData.avatarUrl === preset.url
                          ? 'ring-2 ring-blue-400 border-blue-400 scale-105'
                          : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-9 h-9 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Nome da Clínica / Empresa</label>
                <input
                  type="text"
                  value={editFormData.companyName}
                  onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Nome do Responsável / Médico</label>
                <input
                  type="text"
                  value={editFormData.contactName}
                  onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  value={editFormData.document}
                  onChange={(e) => setEditFormData({ ...editFormData, document: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Cidade</label>
                <input
                  type="text"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Av. Paulista, 1000 - Cj 52"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                >
                  <option value="Cliente ativo" className="bg-neutral-900 text-white">Cliente Ativo</option>
                  <option value="Cliente recorrente" className="bg-neutral-900 text-white">Cliente Recorrente</option>
                  <option value="Lead" className="bg-neutral-900 text-white">Lead</option>
                  <option value="Em negociação" className="bg-neutral-900 text-white">Em Negociação</option>
                  <option value="Proposta enviada" className="bg-neutral-900 text-white">Proposta Enviada</option>
                  <option value="Cliente inativo" className="bg-neutral-900 text-white">Cliente Inativo</option>
                  <option value="Cancelado" className="bg-neutral-900 text-white">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Origem</label>
                <select
                  value={editFormData.origin}
                  onChange={(e) => setEditFormData({ ...editFormData, origin: e.target.value as any })}
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

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-200">
                  <input
                    type="checkbox"
                    checked={editFormData.isRecurring}
                    onChange={(e) => setEditFormData({ ...editFormData, isRecurring: e.target.checked })}
                    className="rounded bg-white/10 border-white/20 text-blue-600 focus:ring-0 w-4 h-4"
                  />
                  <span>Plano de Cuidado Ativo</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Instagram (@usuario)</label>
                <input
                  type="text"
                  placeholder="@clinicasorrir"
                  value={editFormData.instagram}
                  onChange={(e) => setEditFormData({ ...editFormData, instagram: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Website Atual</label>
                <input
                  type="text"
                  placeholder="https://clinicasorrir.com.br"
                  value={editFormData.currentWebsite}
                  onChange={(e) => setEditFormData({ ...editFormData, currentWebsite: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Observações Operacionais</label>
              <textarea
                rows={2}
                placeholder="Detalhes sobre a clínica, público-alvo, procedimentos..."
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditClientModalOpen(false);
                  setEditingClient(null);
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-200 transition shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EXTRA SERVICE MODAL (Section 24) */}
      <Modal
        isOpen={isExtraServiceModalOpen}
        onClose={() => setIsExtraServiceModalOpen(false)}
        title="Adicionar Serviço Extra"
        subtitle={`Venda adicional para ${selectedClient?.companyName}`}
      >
        <form onSubmit={handleAddExtraService} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Serviço Adicional</label>
            <input
              type="text"
              placeholder="Ex: Landing Page Criolipólise, Nova Página Especialidade..."
              value={extraServiceName}
              onChange={(e) => setExtraServiceName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Valor do Serviço (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 350.00"
                value={extraServicePrice}
                onChange={(e) => setExtraServicePrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Forma de Pagamento</label>
              <select
                value={extraServicePaymentMethod}
                onChange={(e) => setExtraServicePaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="Pix" className="bg-neutral-900 text-white">Pix</option>
                <option value="InfinitePay" className="bg-neutral-900 text-white">InfinitePay</option>
                <option value="Cartão de crédito" className="bg-neutral-900 text-white">Cartão de crédito</option>
                <option value="Transferência" className="bg-neutral-900 text-white">Transferência</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-200">
              <input
                type="checkbox"
                checked={extraServicePaidNow}
                onChange={(e) => setExtraServicePaidNow(e.target.checked)}
                className="rounded bg-white/10 border-white/20"
              />
              <span>Pagamento já foi recebido agora</span>
            </label>

            {extraServicePaidNow && (
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">Conta de Destino:</label>
                <select
                  value={extraServiceAccountId}
                  onChange={(e) => setExtraServiceAccountId(e.target.value)}
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
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Lançar Serviço Extra
          </button>
        </form>
      </Modal>

      {/* CONFIRM DELETE CLIENT MODAL */}
      {clientToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
          }}
          title="Excluir Cliente e Registros Vinculados"
          subtitle="Confirmação de segurança com exclusão permanente"
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* Warning Banner */}
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-300">
                  Tem certeza que deseja apagar este cliente?
                </p>
                <p className="text-[11px] text-red-200/80 leading-relaxed">
                  Esta ação é irreversível. Ao confirmar, o cliente será removido definitivamente do sistema e do banco de dados Supabase, juntamente com todos os seus projetos, contratos, assinaturas do plano de cuidado e cobranças financeiras.
                </p>
              </div>
            </div>

            {/* Client summary pill */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              {clientToDelete.avatarUrl ? (
                <img
                  src={clientToDelete.avatarUrl}
                  alt={clientToDelete.companyName}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {clientToDelete.companyName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-white truncate">{clientToDelete.companyName}</h4>
                <p className="text-xs text-neutral-400 truncate">
                  Responsável: <span className="text-neutral-200">{clientToDelete.contactName}</span>
                </p>
                <p className="text-[11px] text-neutral-500">
                  {clientToDelete.city}/{clientToDelete.state} • {clientToDelete.document || 'Sem documento'}
                </p>
              </div>
            </div>

            {/* Cascade delete inventory */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Itens e registros que serão excluídos em cascata:
              </span>
              <div className="divide-y divide-white/[0.04] rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-neutral-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-neutral-400" />
                    <span>Cadastro da Clínica / Empresa</span>
                  </span>
                  <span className="font-semibold text-red-400">1 cadastro</span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-neutral-300 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-blue-400" />
                    <span>Projetos Contratados</span>
                  </span>
                  <span className={`font-semibold ${toDeleteProjectsCount > 0 ? 'text-red-400 font-mono' : 'text-neutral-500'}`}>
                    {toDeleteProjectsCount} projeto(s)
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-neutral-300 flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-purple-400" />
                    <span>Assinaturas do Plano de Cuidado</span>
                  </span>
                  <span className={`font-semibold ${toDeleteSubsCount > 0 ? 'text-red-400 font-mono' : 'text-neutral-500'}`}>
                    {toDeleteSubsCount} assinatura(s)
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-neutral-300 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Cobranças & Contas a Receber</span>
                  </span>
                  <span className={`font-semibold ${toDeleteRecsCount > 0 ? 'text-red-400 font-mono' : 'text-neutral-500'}`}>
                    {toDeleteRecsCount} cobrança(s) ({formatCurrency(toDeleteRecsSum)})
                  </span>
                </div>

                {toDeleteRefsCount > 0 && (
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-neutral-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Indicações Vinculadas</span>
                    </span>
                    <span className="font-semibold text-red-400 font-mono">
                      {toDeleteRefsCount} indicação(ões)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                id="confirm-delete-client-btn"
                type="button"
                onClick={handleConfirmDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-lg shadow-red-600/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Apagar Cliente e Tudo Vinculado</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
