import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientStatus, ClientOrigin, PaymentMethod, PipelineStage } from '../../types';
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
    pipelineStage: 'Fechado' as PipelineStage,
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
    pipelineStage: 'Fechado' as PipelineStage,
    potentialValue: 697,
    selectedServiceIds: [] as string[],
    proposedServices: [] as string[],
    isRecurring: false,
  });

  const newClientFileInputRef = useRef<HTMLInputElement>(null);
  const editClientFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEditClient = (client: Client) => {
    setEditingClient(client);

    const potVal =
      client.potentialValue !== undefined && client.potentialValue !== null
        ? client.potentialValue
        : (client.totalSpent && client.totalSpent > 0 ? client.totalSpent : 697);

    let initialServiceIds: string[] = [];
    if (client.selectedServiceIds && client.selectedServiceIds.length > 0) {
      initialServiceIds = client.selectedServiceIds;
    } else if (client.proposedServices && client.proposedServices.length > 0) {
      initialServiceIds = data.services
        .filter((s) => client.proposedServices?.includes(s.name))
        .map((s) => s.id);
    } else {
      const match = data.services.find((s) => s.defaultPrice === potVal);
      if (match) initialServiceIds = [match.id];
      else if (potVal === 697) initialServiceIds = ['srv-2'];
    }

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
      pipelineStage: client.pipelineStage || (client.status === 'Cliente ativo' || client.status === 'Cliente recorrente' ? 'Fechado' : 'Prospectado'),
      potentialValue: potVal,
      selectedServiceIds: initialServiceIds,
      proposedServices: client.proposedServices || [],
      isRecurring: client.isRecurring || false,
    });
    setIsEditClientModalOpen(true);
  };

  const handleToggleEditService = (serviceId: string) => {
    const isSelected = editFormData.selectedServiceIds.includes(serviceId);
    const nextSelected = isSelected
      ? editFormData.selectedServiceIds.filter((id) => id !== serviceId)
      : [...editFormData.selectedServiceIds, serviceId];

    const sum = nextSelected.reduce((total, id) => {
      const s = data.services.find((srv) => srv.id === id);
      return total + (s?.defaultPrice || 0);
    }, 0);

    const proposedNames = nextSelected
      .map((id) => data.services.find((s) => s.id === id)?.name)
      .filter(Boolean) as string[];

    setEditFormData({
      ...editFormData,
      selectedServiceIds: nextSelected,
      proposedServices: proposedNames,
      potentialValue: sum > 0 ? sum : editFormData.potentialValue,
    });
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
      pipelineStage: 'Fechado',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
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
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Clients Table / Cards */}
      <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
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
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 font-semibold text-xs shrink-0">
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
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                          client.status === 'Cliente recorrente'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : client.status === 'Cliente ativo'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : client.status === 'Em negociação' || client.status === 'Proposta enviada'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : client.status === 'Lead'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {client.status}
                      </span>
                      {client.pipelineStage && (
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Funil: {client.pipelineStage}
                        </span>
                      )}
                    </div>
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
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Client Profile Header with Avatar & Edit Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3.5 min-w-0">
                {selectedClient.avatarUrl ? (
                  <img
                    src={selectedClient.avatarUrl}
                    alt={selectedClient.companyName}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-white/10 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0 shadow-md">
                    {selectedClient.companyName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">{selectedClient.companyName}</h3>
                    <span className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 shrink-0">
                      {selectedClient.city}/{selectedClient.state}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 truncate">
                    Responsável: <strong className="text-neutral-200">{selectedClient.contactName}</strong> • {selectedClient.status} • Funil: <strong className="text-blue-400 font-medium">{selectedClient.pipelineStage || 'Prospectado'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => handleOpenEditClient(selectedClient)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition text-xs font-semibold shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Cadastro & Proposta</span>
                </button>
                <button
                  onClick={() => handleOpenDeleteClient(selectedClient)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition text-xs font-semibold shadow-sm"
                  title="Apagar cliente e tudo relacionado"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Apagar Cliente</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Header for Client */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block truncate">Total Já Pago</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400 block truncate">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block truncate">Valores em Aberto</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-blue-400 block truncate">
                  {formatCurrency(totalOpen)}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block truncate">MRR Gerado</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-purple-400 block truncate">
                  {formatCurrency(activeMrr)}/mês
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block truncate">Plano de Cuidado</span>
                <span className={`text-xs font-medium block truncate ${selectedClient.isRecurring ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {selectedClient.isRecurring ? 'Ativo (Recorrente)' : 'Sem plano'}
                </span>
              </div>
            </div>

            {/* Proposta Comercial & Serviços Negociados */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-blue-500/[0.04] border border-blue-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Proposta Comercial & Serviços Inclusos
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                  <span className="text-xs text-neutral-400">Valor da Proposta:</span>
                  <span className="font-mono text-base font-bold text-emerald-400">
                    {formatCurrency(
                      selectedClient.potentialValue !== undefined && selectedClient.potentialValue !== null
                        ? selectedClient.potentialValue
                        : (selectedClient.totalSpent && selectedClient.totalSpent > 0 ? selectedClient.totalSpent : 697)
                    )}
                  </span>
                  <button
                    onClick={() => handleOpenEditClient(selectedClient)}
                    className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition shrink-0"
                    title="Editar serviços e valor da proposta"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(selectedClient.proposedServices && selectedClient.proposedServices.length > 0) ? (
                  selectedClient.proposedServices.map((srv, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px] font-medium"
                    >
                      {srv}
                    </span>
                  ))
                ) : (selectedClient.selectedServiceIds && selectedClient.selectedServiceIds.length > 0) ? (
                  selectedClient.selectedServiceIds.map((id) => {
                    const s = data.services.find((item) => item.id === id);
                    return (
                      <span
                        key={id}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px] font-medium"
                      >
                        {s?.name || id}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-neutral-400 italic">
                    Nenhum serviço personalizado vinculado ainda. Clique em "Editar Cadastro & Proposta" para selecionar os serviços.
                  </span>
                )}
              </div>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>Dados Cadastrais</span>
                </h4>
                <p className="break-words"><span className="text-neutral-500">Documento (CNPJ/CPF):</span> {selectedClient.document || 'Não informado'}</p>
                <p className="break-words"><span className="text-neutral-500">Telefone / WhatsApp:</span> {selectedClient.phone || '-'}</p>
                <p className="break-all"><span className="text-neutral-500">E-mail:</span> {selectedClient.email || '-'}</p>
                <p className="break-words"><span className="text-neutral-500">Endereço:</span> {selectedClient.address || '-'}</p>
                <p className="break-words"><span className="text-neutral-500">Localização:</span> {selectedClient.city}/{selectedClient.state}</p>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>Presença Digital & Origem</span>
                </h4>
                <p className="break-words"><span className="text-neutral-500">Origem do Cliente:</span> {selectedClient.origin}</p>
                <p className="break-words"><span className="text-neutral-500">Data de Cadastro:</span> {formatDate(selectedClient.createdAt)}</p>
                <p className="break-all"><span className="text-neutral-500">Instagram:</span> {selectedClient.instagram || '-'}</p>
                <p className="break-all"><span className="text-neutral-500">Site Atual:</span> {selectedClient.currentWebsite || '-'}</p>
                {selectedClient.notes && (
                  <p className="break-words"><span className="text-neutral-500">Observações:</span> {selectedClient.notes}</p>
                )}
              </div>
            </div>

            {/* SECTION 24: SERVIÇOS EXTRAS BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
              <div>
                <p className="text-xs font-semibold text-white">Vendas Adicionais & Serviços Extras</p>
                <p className="text-[11px] text-neutral-400">
                  Adicione novas páginas, landing pages, ou integrações adicionais a este cliente.
                </p>
              </div>
              <button
                onClick={() => setIsExtraServiceModalOpen(true)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition shrink-0"
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
                    <div key={sub.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{sub.planName}</p>
                        <p className="text-neutral-400 text-[11px] truncate">
                          Início: {formatDate(sub.startDate)} • Vencimento: todo dia {sub.dueDay} • Próx: {formatDate(sub.nextDueDate)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:text-right gap-3 shrink-0">
                        <span className="font-mono font-bold text-purple-400">{formatCurrency(sub.monthlyValue)}/mês</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sub.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
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
                    <div key={p.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{p.name}</p>
                        <p className="text-neutral-400 text-[11px] truncate">
                          {p.serviceName} • Entrega: {formatDate(p.deliveryDate)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:text-right gap-3 shrink-0">
                        <span className="font-mono font-bold text-white">{formatCurrency(p.contractValue)}</span>
                        <span className="text-[10px] text-neutral-400">
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
                  <div key={r.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{r.description}</p>
                      <p className="text-neutral-500 text-[11px] truncate">
                        Vencimento: {formatDate(r.dueDate)} • {r.paymentMethod}
                        {r.paymentDate && ` • Pago em ${formatDate(r.paymentDate)}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:text-right gap-3 shrink-0">
                      <span className="font-mono font-semibold text-white">{formatCurrency(r.grossAmount)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${r.status === 'Pago' ? 'text-emerald-400 bg-emerald-500/10' : r.status === 'Vencido' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
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
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveNewClient} className="space-y-4">
          {/* Avatar / Foto de Perfil */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
            <label className="block text-xs font-semibold text-white">
              Foto de Perfil / Logotipo do Cliente
            </label>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative shrink-0">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/50 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-neutral-400 gap-1">
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

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
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
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[10px] text-neutral-400 block mb-1.5 font-medium">Ou escolha um avatar sugerido:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
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
            <label className="block text-xs font-medium text-neutral-400 mb-1">Nome da Clínica / Empresa *</label>
            <input
              type="text"
              placeholder="Ex: Instituto Odontológico Sorrir"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Nome do Responsável / Médico *</label>
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
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Status do Cliente</label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const newStatus = e.target.value as ClientStatus;
                  let autoStage: PipelineStage = formData.pipelineStage;
                  if (newStatus === 'Cliente ativo' || newStatus === 'Cliente recorrente') autoStage = 'Fechado';
                  else if (newStatus === 'Lead' && formData.pipelineStage === 'Fechado') autoStage = 'Prospectado';
                  else if (newStatus === 'Em negociação' || newStatus === 'Proposta enviada') autoStage = 'Negociação';
                  setFormData({ ...formData, status: newStatus, pipelineStage: autoStage });
                }}
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
              <label className="block text-xs font-medium text-neutral-400 mb-1">Etapa no Funil de Vendas (CRM)</label>
              <select
                value={formData.pipelineStage}
                onChange={(e) => setFormData({ ...formData, pipelineStage: e.target.value as PipelineStage })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="Prospectado" className="bg-neutral-900 text-white">1. Prospectado</option>
                <option value="Demo pronta" className="bg-neutral-900 text-white">2. Demo pronta</option>
                <option value="Demo apresentada" className="bg-neutral-900 text-white">3. Demo apresentada</option>
                <option value="Negociação" className="bg-neutral-900 text-white">4. Negociação</option>
                <option value="Fechado" className="bg-neutral-900 text-white">5. Fechado (Ganho)</option>
                <option value="Perdido" className="bg-neutral-900 text-white">6. Perdido</option>
              </select>
            </div>
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
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition active:scale-[0.99] cursor-pointer"
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
          maxWidth="3xl"
        >
          <form onSubmit={handleSaveEditClient} className="space-y-4">
            {/* Avatar / Foto de Perfil */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <label className="block text-xs font-semibold text-white">
                Foto de Perfil / Logotipo do Cliente
              </label>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative shrink-0">
                  {editFormData.avatarUrl ? (
                    <img
                      src={editFormData.avatarUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/50 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-neutral-400 gap-1">
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

                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
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
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1.5 font-medium">Ou escolha um avatar sugerido:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
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
                <label className="block text-xs font-medium text-neutral-400 mb-1">Nome da Clínica / Empresa *</label>
                <input
                  type="text"
                  value={editFormData.companyName}
                  onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Nome do Responsável / Médico *</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-xs font-medium text-neutral-400 mb-1">Cidade</label>
                <input
                  type="text"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-neutral-400 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="sm:col-span-4">
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
                  onChange={(e) => {
                    const newStatus = e.target.value as ClientStatus;
                    let autoStage: PipelineStage = editFormData.pipelineStage;
                    if (newStatus === 'Cliente ativo' || newStatus === 'Cliente recorrente') autoStage = 'Fechado';
                    else if (newStatus === 'Lead' && editFormData.pipelineStage === 'Fechado') autoStage = 'Prospectado';
                    else if (newStatus === 'Em negociação' || newStatus === 'Proposta enviada') autoStage = 'Negociação';
                    else if (newStatus === 'Cancelado') autoStage = 'Perdido';
                    setEditFormData({ ...editFormData, status: newStatus, pipelineStage: autoStage });
                  }}
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
                <label className="block text-xs font-medium text-neutral-400 mb-1">Etapa no Funil (CRM)</label>
                <select
                  value={editFormData.pipelineStage}
                  onChange={(e) => setEditFormData({ ...editFormData, pipelineStage: e.target.value as PipelineStage })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                >
                  <option value="Prospectado" className="bg-neutral-900 text-white">1. Prospectado</option>
                  <option value="Demo pronta" className="bg-neutral-900 text-white">2. Demo pronta</option>
                  <option value="Demo apresentada" className="bg-neutral-900 text-white">3. Demo apresentada</option>
                  <option value="Negociação" className="bg-neutral-900 text-white">4. Negociação</option>
                  <option value="Fechado" className="bg-neutral-900 text-white">5. Fechado (Ganho)</option>
                  <option value="Perdido" className="bg-neutral-900 text-white">6. Perdido</option>
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
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-200 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition">
                <input
                  type="checkbox"
                  checked={editFormData.isRecurring}
                  onChange={(e) => setEditFormData({ ...editFormData, isRecurring: e.target.checked })}
                  className="rounded bg-white/10 border-white/20 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-white block">Plano de Cuidado Digital Ativo</span>
                  <span className="text-[11px] text-neutral-400 block">Marca o cliente como assinante recorrente da agência</span>
                </div>
              </label>
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

            {/* SELEÇÃO DE SERVIÇOS & VALOR DA PROPOSTA */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#181920] border border-blue-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Serviços Inclusos na Proposta Comercial</span>
                  </label>
                  <p className="text-[11px] text-neutral-400">
                    Selecione os serviços para compor o valor base da proposta deste cliente
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                  <span className="text-xs text-neutral-400 whitespace-nowrap">Valor Final:</span>
                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-2 text-xs font-mono text-neutral-400">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={editFormData.potentialValue || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, potentialValue: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-neutral-900 border border-blue-500/30 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {data.services.map((srv) => {
                  const isChecked = editFormData.selectedServiceIds.includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => handleToggleEditService(srv.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                        isChecked
                          ? 'bg-blue-500/10 border-blue-500/40 text-white'
                          : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${
                            isChecked
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-neutral-600 bg-neutral-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-tight text-neutral-200 truncate">{srv.name}</p>
                          <p className="text-[10px] text-neutral-500 truncate">{srv.category}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono text-xs">
                        <span className="font-semibold text-neutral-200">
                          {formatCurrency(srv.defaultPrice)}
                        </span>
                        {srv.monthlyPrice && srv.monthlyPrice > 0 && (
                          <span className="block text-[9px] text-purple-400">
                            +{formatCurrency(srv.monthlyPrice)}/mês
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {editFormData.selectedServiceIds.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-neutral-400 pt-1.5 border-t border-white/5">
                  <span>{editFormData.selectedServiceIds.length} serviço(s) selecionado(s)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sum = editFormData.selectedServiceIds.reduce((total, id) => {
                        const s = data.services.find((srv) => srv.id === id);
                        return total + (s?.defaultPrice || 0);
                      }, 0);
                      setEditFormData({ ...editFormData, potentialValue: sum });
                    }}
                    className="text-blue-400 hover:text-blue-300 transition text-[11px] underline text-left sm:text-right"
                  >
                    Recalcular valor exato pela soma do catálogo
                  </button>
                </div>
              )}
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

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditClientModalOpen(false);
                  setEditingClient(null);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-200 transition shadow active:scale-[0.99] cursor-pointer"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setClientToDelete(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition text-center"
              >
                Cancelar
              </button>
              <button
                id="confirm-delete-client-btn"
                type="button"
                onClick={handleConfirmDelete}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-lg shadow-red-600/20 cursor-pointer text-center"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Sim, Apagar Cliente e Tudo Vinculado</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
