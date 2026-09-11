import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PipelineStage, Client, ClientOrigin } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import {
  ChevronRight,
  ChevronLeft,
  Phone,
  MessageSquare,
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Sparkles,
  User,
  ArrowRight,
  Pencil,
  Briefcase,
  Layers,
  Calculator,
  Tag,
  Check,
  Percent,
  FileText,
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const PipelineView: React.FC = () => {
  const {
    data,
    updateClient,
    updateClientPipelineStage,
    updatePipelineStage,
    setSelectedClientId,
    addClient,
    setCurrentView,
  } = useApp();

  const handleUpdateStage = (clientId: string, stage: PipelineStage) => {
    if (updateClientPipelineStage) {
      updateClientPipelineStage(clientId, stage);
    } else if (updatePipelineStage) {
      updatePipelineStage(clientId, stage);
    }
  };

  const handleOpenDossier = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentView('clients');
  };

  const stages: PipelineStage[] = [
    'Prospectado',
    'Demo pronta',
    'Demo apresentada',
    'Negociação',
    'Fechado',
    'Perdido',
  ];

  // Stage badges / colors configuration
  const stageStyles: Record<PipelineStage, { border: string; bg: string; dot: string; text: string }> = {
    'Prospectado': {
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/10',
      dot: 'bg-blue-400',
      text: 'text-blue-400',
    },
    'Demo pronta': {
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10',
      dot: 'bg-amber-400',
      text: 'text-amber-400',
    },
    'Demo apresentada': {
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/10',
      dot: 'bg-purple-400',
      text: 'text-purple-400',
    },
    'Negociação': {
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/10',
      dot: 'bg-orange-400',
      text: 'text-orange-400',
    },
    'Fechado': {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      dot: 'bg-emerald-400',
      text: 'text-emerald-400',
    },
    'Perdido': {
      border: 'border-red-500/20',
      bg: 'bg-red-500/10',
      dot: 'bg-red-400',
      text: 'text-red-400',
    },
  };

  // Helper to reliably resolve a client's pipeline stage
  const resolveClientPipelineStage = (c: Client): PipelineStage => {
    if (c.pipelineStage && stages.includes(c.pipelineStage)) {
      return c.pipelineStage;
    }
    // Backward compatibility for legacy stages if encountered
    const legacy = c.pipelineStage as string;
    if (legacy === 'Primeiro contato' || legacy === 'Respondeu' || legacy === 'Qualificado') return 'Prospectado';
    if (legacy === 'Proposta enviada') return 'Negociação';

    if (c.status === 'Lead') return 'Prospectado';
    if (c.status === 'Em negociação' || c.status === 'Proposta enviada') return 'Negociação';
    if (c.status === 'Perdido' || c.status === 'Cancelado') return 'Perdido';
    if (c.status === 'Cliente ativo' || c.status === 'Cliente recorrente') return 'Fechado';
    return 'Prospectado';
  };

  // Filtering states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'abertos' | 'fechados' | 'perdidos'>('todos');

  // Proposal & Services Edit Modal State
  const [proposalClient, setProposalClient] = useState<Client | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [customServicePrices, setCustomServicePrices] = useState<Record<string, number>>({});
  const [manualProposalValue, setManualProposalValue] = useState<string>('697');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [proposalNotes, setProposalNotes] = useState<string>('');
  const [proposalToast, setProposalToast] = useState<string | null>(null);

  // Proposal calculations
  const calculateServicesSubtotal = (serviceIds: string[], priceOverrides: Record<string, number>): number => {
    return serviceIds.reduce((sum, id) => {
      const price = priceOverrides[id] !== undefined
        ? priceOverrides[id]
        : (data.services.find((s) => s.id === id)?.defaultPrice || 0);
      return sum + price;
    }, 0);
  };

  const calculateServicesMonthlyTotal = (serviceIds: string[]): number => {
    return serviceIds.reduce((sum, id) => {
      const service = data.services.find((s) => s.id === id);
      return sum + (service?.monthlyPrice || 0);
    }, 0);
  };

  const handleOpenProposalModal = (client: Client) => {
    setProposalClient(client);

    const currentVal =
      client.potentialValue !== undefined && client.potentialValue !== null
        ? client.potentialValue
        : (client.totalSpent && client.totalSpent > 0 ? client.totalSpent : 697);

    let initialServices: string[] = [];
    if (client.selectedServiceIds && client.selectedServiceIds.length > 0) {
      initialServices = client.selectedServiceIds;
    } else if (client.proposedServices && client.proposedServices.length > 0) {
      initialServices = data.services
        .filter((s) => client.proposedServices?.includes(s.name))
        .map((s) => s.id);
    } else {
      // Auto-match service by price or combo
      const match = data.services.find((s) => s.defaultPrice === currentVal);
      if (match) {
        initialServices = [match.id];
      } else if (currentVal === 697) {
        const combo = data.services.find((s) => s.id === 'srv-2');
        if (combo) initialServices = [combo.id];
      }
    }

    setSelectedServiceIds(initialServices);
    setCustomServicePrices({});
    setDiscountAmount('0');
    setManualProposalValue(currentVal.toString());
    setProposalNotes(client.notes || '');
  };

  const handleToggleService = (serviceId: string) => {
    const isSelected = selectedServiceIds.includes(serviceId);
    const nextSelected = isSelected
      ? selectedServiceIds.filter((id) => id !== serviceId)
      : [...selectedServiceIds, serviceId];

    setSelectedServiceIds(nextSelected);

    // Auto calculate new proposal value
    const subtotal = calculateServicesSubtotal(nextSelected, customServicePrices);
    const discount = parseFloat(discountAmount.replace(',', '.')) || 0;
    const finalVal = Math.max(0, subtotal - discount);
    setManualProposalValue(finalVal.toString());
  };

  const handleServicePriceChange = (serviceId: string, newPriceStr: string) => {
    const newPrice = parseFloat(newPriceStr.replace(',', '.')) || 0;
    const updated = { ...customServicePrices, [serviceId]: newPrice };
    setCustomServicePrices(updated);

    const subtotal = calculateServicesSubtotal(selectedServiceIds, updated);
    const discount = parseFloat(discountAmount.replace(',', '.')) || 0;
    const finalVal = Math.max(0, subtotal - discount);
    setManualProposalValue(finalVal.toString());
  };

  const handleDiscountChange = (newDiscountStr: string) => {
    setDiscountAmount(newDiscountStr);
    const discount = parseFloat(newDiscountStr.replace(',', '.')) || 0;
    const subtotal = calculateServicesSubtotal(selectedServiceIds, customServicePrices);
    const finalVal = Math.max(0, subtotal - discount);
    setManualProposalValue(finalVal.toString());
  };

  const handleApplyPreset = (serviceIds: string[], presetVal?: number) => {
    setSelectedServiceIds(serviceIds);
    setCustomServicePrices({});
    setDiscountAmount('0');
    if (presetVal !== undefined) {
      setManualProposalValue(presetVal.toString());
    } else {
      const subtotal = calculateServicesSubtotal(serviceIds, {});
      setManualProposalValue(subtotal.toString());
    }
  };

  const handleSaveProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalClient) return;

    const finalVal = parseFloat(manualProposalValue.replace(',', '.')) || 0;
    const proposedServiceNames = selectedServiceIds
      .map((id) => data.services.find((s) => s.id === id)?.name)
      .filter(Boolean) as string[];

    updateClient(proposalClient.id, {
      potentialValue: finalVal,
      selectedServiceIds,
      proposedServices: proposedServiceNames,
      notes: proposalNotes,
    });

    setProposalToast(`Valor da proposta de "${proposalClient.companyName}" atualizado para ${formatCurrency(finalVal)}!`);
    setTimeout(() => setProposalToast(null), 3500);
    setProposalClient(null);
  };

  // New Lead Modal state
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [leadStageTarget, setLeadStageTarget] = useState<PipelineStage>('Prospectado');
  const [newLeadForm, setNewLeadForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    city: 'São Paulo',
    state: 'SP',
    origin: 'Prospecção ativa' as ClientOrigin,
    stage: 'Prospectado' as PipelineStage,
    potentialValue: '697',
    selectedServiceIds: ['srv-2'] as string[],
    nextAction: 'Enviar mensagem WhatsApp de apresentação',
    notes: '',
  });

  const handleOpenNewLeadModal = (defaultStage: PipelineStage = 'Prospectado') => {
    setLeadStageTarget(defaultStage);
    const combo = data.services.find((s) => s.id === 'srv-2');
    const defaultVal = combo ? combo.defaultPrice.toString() : '697';
    setNewLeadForm({
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      city: 'São Paulo',
      state: 'SP',
      origin: 'Prospecção ativa',
      stage: defaultStage,
      potentialValue: defaultVal,
      selectedServiceIds: combo ? [combo.id] : [],
      nextAction: 'Enviar mensagem WhatsApp de apresentação',
      notes: '',
    });
    setIsNewLeadModalOpen(true);
  };

  const handleToggleNewLeadService = (serviceId: string) => {
    const isSelected = newLeadForm.selectedServiceIds.includes(serviceId);
    const nextSelected = isSelected
      ? newLeadForm.selectedServiceIds.filter((id) => id !== serviceId)
      : [...newLeadForm.selectedServiceIds, serviceId];

    const sum = nextSelected.reduce((total, id) => {
      const s = data.services.find((srv) => srv.id === id);
      return total + (s?.defaultPrice || 0);
    }, 0);

    setNewLeadForm({
      ...newLeadForm,
      selectedServiceIds: nextSelected,
      potentialValue: sum > 0 ? sum.toString() : newLeadForm.potentialValue,
    });
  };

  const handleSaveNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.companyName.trim() || !newLeadForm.contactName.trim()) return;

    const potVal = parseFloat(newLeadForm.potentialValue.replace(',', '.')) || 0;
    const isClosed = newLeadForm.stage === 'Fechado';
    const proposedServiceNames = newLeadForm.selectedServiceIds
      .map((id) => data.services.find((s) => s.id === id)?.name)
      .filter(Boolean) as string[];

    addClient({
      companyName: newLeadForm.companyName.trim(),
      contactName: newLeadForm.contactName.trim(),
      document: '',
      phone: newLeadForm.phone.trim(),
      whatsapp: newLeadForm.phone.trim(),
      email: newLeadForm.email.trim(),
      city: newLeadForm.city.trim() || 'São Paulo',
      state: newLeadForm.state.trim() || 'SP',
      origin: newLeadForm.origin,
      status: isClosed ? 'Cliente ativo' : 'Lead',
      pipelineStage: newLeadForm.stage,
      potentialValue: potVal,
      selectedServiceIds: newLeadForm.selectedServiceIds,
      proposedServices: proposedServiceNames,
      nextAction: newLeadForm.nextAction,
      notes: newLeadForm.notes,
      isRecurring: false,
    });

    setIsNewLeadModalOpen(false);
  };

  const getStageIndex = (stage: PipelineStage) => stages.indexOf(stage);

  const moveStage = (clientId: string, currentStage: PipelineStage, direction: 'next' | 'prev') => {
    const currentIndex = getStageIndex(currentStage);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < stages.length) {
      handleUpdateStage(clientId, stages[newIndex]);
    }
  };

  // Filter clients
  const filteredClients = data.clients.filter((client) => {
    const stage = resolveClientPipelineStage(client);

    // Search filter
    const matchesSearch =
      client.companyName.toLowerCase().includes(search.toLowerCase()) ||
      client.contactName.toLowerCase().includes(search.toLowerCase()) ||
      client.city.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search);

    if (!matchesSearch) return false;

    // Type filter
    if (filterType === 'abertos') {
      return stage !== 'Fechado' && stage !== 'Perdido';
    }
    if (filterType === 'fechados') {
      return stage === 'Fechado';
    }
    if (filterType === 'perdidos') {
      return stage === 'Perdido';
    }
    return true;
  });

  // Calculate Pipeline Metrics
  const totalInFunnel = data.clients.length;
  const openLeads = data.clients.filter((c) => {
    const s = resolveClientPipelineStage(c);
    return s !== 'Fechado' && s !== 'Perdido';
  });
  const closedLeads = data.clients.filter((c) => resolveClientPipelineStage(c) === 'Fechado');
  const totalPipelinePotential = data.clients.reduce((sum, c) => {
    const val = c.potentialValue || (c.totalSpent && c.totalSpent > 0 ? c.totalSpent : 697);
    return sum + val;
  }, 0);

  return (
    <div id="pipeline-view" className="space-y-5 pb-12 relative">
      {/* Toast Notification for Proposal Update */}
      {proposalToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{proposalToast}</span>
        </div>
      )}

      {/* Top Header with Overview & Actions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Funil Comercial de Vendas (CRM)</h2>
                <p className="text-xs text-neutral-400">
                  Acompanhe e mova leads nas 6 etapas estratégicas de prospecção e fechamento
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenNewLeadModal('Prospectado')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lead / Oportunidade</span>
            </button>
          </div>
        </div>

        {/* Quick KPI indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/[0.06]">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[11px] text-neutral-400 block font-medium">Total no Funil</span>
            <span className="text-base font-bold font-mono text-white mt-0.5 block">
              {totalInFunnel} leads
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/[0.04] border border-blue-500/10">
            <span className="text-[11px] text-blue-300 block font-medium">Oportunidades em Aberto</span>
            <span className="text-base font-bold font-mono text-blue-400 mt-0.5 block">
              {openLeads.length} leads
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10">
            <span className="text-[11px] text-emerald-300 block font-medium">Fechados com Sucesso</span>
            <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
              {closedLeads.length} clientes
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/[0.04] border border-purple-500/10">
            <span className="text-[11px] text-purple-300 block font-medium">Pipeline Estimado</span>
            <span className="text-base font-bold font-mono text-purple-300 mt-0.5 block">
              {formatCurrency(totalPipelinePotential)}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar lead por clínica, responsável, cidade ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterType === 'todos'
                  ? 'bg-white text-neutral-950 font-semibold'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Todos ({data.clients.length})
            </button>
            <button
              onClick={() => setFilterType('abertos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterType === 'abertos'
                  ? 'bg-blue-500 text-white font-semibold'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Em Aberto ({openLeads.length})
            </button>
            <button
              onClick={() => setFilterType('fechados')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterType === 'fechados'
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Fechados ({closedLeads.length})
            </button>
            <button
              onClick={() => setFilterType('perdidos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterType === 'perdidos'
                  ? 'bg-red-500 text-white font-semibold'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Perdidos
            </button>
          </div>
        </div>
      </div>

      {/* 9 Stages Kanban Horizontal Scroller */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x scrollbar-thin scrollbar-thumb-white/10">
        {stages.map((stage) => {
          const clientsInStage = filteredClients.filter(
            (c) => resolveClientPipelineStage(c) === stage
          );
          const stageTotalValue = clientsInStage.reduce((sum, c) => {
            const val = c.potentialValue || (c.totalSpent && c.totalSpent > 0 ? c.totalSpent : 697);
            return sum + val;
          }, 0);

          const isClosed = stage === 'Fechado';
          const isLost = stage === 'Perdido';
          const style = stageStyles[stage] || stageStyles['Prospectado'];

          return (
            <div
              key={stage}
              className={`w-72 shrink-0 flex flex-col rounded-2xl border bg-[#121319] ${
                isClosed
                  ? 'border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                  : isLost
                  ? 'border-red-500/20'
                  : 'border-white/[0.08]'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                    <span className="text-xs font-bold text-white tracking-tight truncate" title={stage}>
                      {stage}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-semibold">
                      {clientsInStage.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    {formatCurrency(stageTotalValue)}
                  </p>
                </div>

                {/* Quick Add Button to this stage */}
                <button
                  onClick={() => handleOpenNewLeadModal(stage)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition shrink-0"
                  title={`Adicionar lead diretamente na etapa "${stage}"`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards List */}
              <div className="p-2 space-y-2.5 flex-1 min-h-[420px] max-h-[640px] overflow-y-auto">
                {clientsInStage.length === 0 ? (
                  <div className="h-full min-h-[140px] flex flex-col items-center justify-center p-6 text-center text-[11px] text-neutral-500 space-y-2">
                    <span>Nenhum lead nesta etapa</span>
                    <button
                      onClick={() => handleOpenNewLeadModal(stage)}
                      className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar lead aqui</span>
                    </button>
                  </div>
                ) : (
                  clientsInStage.map((client) => {
                    const clientVal =
                      client.potentialValue ||
                      (client.totalSpent && client.totalSpent > 0 ? client.totalSpent : 697);

                    return (
                      <div
                        key={client.id}
                        className="p-3.5 rounded-xl bg-[#181921] border border-white/[0.08] hover:border-white/20 transition shadow-sm space-y-2.5"
                      >
                        {/* Header: Name and Potential Value */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4
                              onClick={() => handleOpenDossier(client.id)}
                              className="text-xs font-bold text-white hover:text-blue-400 cursor-pointer transition leading-tight truncate"
                              title={client.companyName}
                            >
                              {client.companyName}
                            </h4>
                            <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1 truncate">
                              <User className="w-3 h-3 text-neutral-500 shrink-0" />
                              <span className="truncate">{client.contactName}</span>
                            </p>
                          </div>

                          {/* Interactive Proposal Price Tag */}
                          <button
                            type="button"
                            onClick={() => handleOpenProposalModal(client)}
                            className="group/val flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 transition text-right shrink-0 active:scale-95 shadow-sm"
                            title="Clique para alterar serviços e valor da proposta"
                          >
                            <span className="text-[11px] font-mono font-bold">
                              {formatCurrency(clientVal)}
                            </span>
                            <Pencil className="w-2.5 h-2.5 opacity-60 group-hover/val:opacity-100 transition text-emerald-400" />
                          </button>
                        </div>

                        {/* Origin & Location */}
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/[0.04]">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-medium text-neutral-300">
                            {client.origin}
                          </span>
                          <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                            {client.city}/{client.state}
                          </span>
                        </div>

                        {/* Proposed Services Indicator & Quick Edit */}
                        <div
                          onClick={() => handleOpenProposalModal(client)}
                          className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-blue-500/30 transition cursor-pointer flex items-center justify-between gap-1.5 group/srv"
                          title="Clique para alterar serviços e valor da proposta"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Briefcase className="w-3 h-3 text-blue-400 shrink-0 group-hover/srv:scale-110 transition" />
                            <span className="text-[10px] text-neutral-300 truncate font-medium">
                              {client.proposedServices && client.proposedServices.length > 0
                                ? client.proposedServices.join(' + ')
                                : 'Serviços: Definir proposta'}
                            </span>
                          </div>
                          <span className="text-[9px] text-blue-400 font-semibold shrink-0 flex items-center gap-0.5">
                            Alterar
                            <ChevronRight className="w-2.5 h-2.5" />
                          </span>
                        </div>

                        {/* Planned next action if present */}
                        {client.nextAction && (
                          <div className="text-[10px] text-neutral-400 bg-white/[0.02] p-1.5 rounded-lg border border-white/5 line-clamp-2">
                            <span className="text-neutral-500 font-semibold mr-1">Próx. passo:</span>
                            {client.nextAction}
                          </div>
                        )}

                        {/* Quick Jump Stage Dropdown */}
                        <div className="pt-0.5">
                          <select
                            value={stage}
                            onChange={(e) => handleUpdateStage(client.id, e.target.value as PipelineStage)}
                            className="w-full px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-neutral-300 focus:outline-none cursor-pointer"
                          >
                            {stages.map((s) => (
                              <option key={s} value={s} className="bg-neutral-900 text-white">
                                Mover para: {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Contact & Stage Movement controls */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                          <div className="flex items-center gap-1">
                            {client.phone && (
                              <a
                                href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition"
                                title="Conversar no WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenDossier(client.id)}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] font-medium"
                              title="Ver ficha completa do cliente"
                            >
                              Dossiê
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {stage !== 'Prospectado' && (
                              <button
                                onClick={() => moveStage(client.id, stage, 'prev')}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 transition"
                                title="Voltar etapa anterior"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {stage !== 'Fechado' && stage !== 'Perdido' && (
                              <button
                                onClick={() => moveStage(client.id, stage, 'next')}
                                className="p-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 transition flex items-center"
                                title="Avançar para próxima etapa"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {stage !== 'Fechado' && (
                              <button
                                onClick={() => handleUpdateStage(client.id, 'Fechado')}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 transition"
                                title="Marcar como Fechado (Venda Ganha)!"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {stage !== 'Perdido' && stage !== 'Fechado' && (
                              <button
                                onClick={() => handleUpdateStage(client.id, 'Perdido')}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition"
                                title="Marcar como Oportunidade Perdida"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: NOVO LEAD / OPORTUNIDADE */}
      <Modal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        title="Novo Lead / Oportunidade no Funil"
        subtitle="Cadastre o lead comercial diretamente na etapa desejada do pipeline"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveNewLead} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Nome da Clínica / Empresa *
            </label>
            <input
              type="text"
              placeholder="Ex: Clínica Odontológica Dr. Silva"
              value={newLeadForm.companyName}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, companyName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Nome do Responsável / Médico *
              </label>
              <input
                type="text"
                placeholder="Ex: Dr. Roberto Silva"
                value={newLeadForm.contactName}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, contactName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                WhatsApp / Telefone
              </label>
              <input
                type="text"
                placeholder="(11) 99999-8888"
                value={newLeadForm.phone}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="contato@clinica.com.br"
                value={newLeadForm.email}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Origem do Lead</label>
              <select
                value={newLeadForm.origin}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, origin: e.target.value as ClientOrigin })}
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
              <label className="block text-xs font-medium text-neutral-400 mb-1">Cidade</label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={newLeadForm.city}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Estado (UF)</label>
              <input
                type="text"
                placeholder="SP"
                value={newLeadForm.state}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, state: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Serviços inclusos na proposta do novo lead */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>Serviços Inclusos na Proposta (clique para somar):</span>
              </span>
              <span className="text-[10px] text-neutral-400">
                {newLeadForm.selectedServiceIds.length} selecionado(s)
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {data.services
                .filter((s) => s.isActive)
                .map((srv) => {
                  const isChecked = newLeadForm.selectedServiceIds.includes(srv.id);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleToggleNewLeadService(srv.id)}
                      className={`p-2 rounded-lg text-left border transition text-[11px] flex items-center justify-between gap-1.5 ${
                        isChecked
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-semibold block truncate">{srv.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {formatCurrency(srv.defaultPrice)}
                        </span>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 text-[10px] ${
                          isChecked ? 'bg-blue-500 text-white' : 'border border-white/20'
                        }`}
                      >
                        {isChecked && '✓'}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Etapa no Funil de Vendas
              </label>
              <select
                value={newLeadForm.stage}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, stage: e.target.value as PipelineStage })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                {stages.map((s) => (
                  <option key={s} value={s} className="bg-neutral-900 text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Valor da Proposta Comercial (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="697"
                value={newLeadForm.potentialValue}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, potentialValue: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-mono font-bold text-emerald-400 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Próxima Ação Planejada</label>
            <input
              type="text"
              placeholder="Ex: Ligar amanhã às 14h para apresentar proposta de site"
              value={newLeadForm.nextAction}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, nextAction: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Observações do Lead</label>
            <textarea
              rows={2}
              placeholder="Notas sobre o perfil da clínica, procedimentos, necessidades..."
              value={newLeadForm.notes}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewLeadModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 transition active:scale-95"
            >
              Cadastrar Lead no Funil
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DEFINIR SERVIÇOS & VALOR DA PROPOSTA */}
      <Modal
        isOpen={!!proposalClient}
        onClose={() => setProposalClient(null)}
        title={proposalClient ? `Proposta Comercial • ${proposalClient.companyName}` : 'Proposta Comercial'}
        subtitle="Selecione os serviços desejados para calcular o valor da proposta ou personalize livremente"
        maxWidth="2xl"
      >
        {proposalClient && (
          <form onSubmit={handleSaveProposal} className="space-y-5">
            {/* Quick Summary Pill for the lead */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <span className="text-xs text-neutral-400">Cliente / Lead:</span>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>{proposalClient.contactName}</span>
                  <span className="text-neutral-500 font-normal">({proposalClient.companyName})</span>
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Etapa atual:</span>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                  {proposalClient.pipelineStage || 'Prospectado'}
                </span>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pacotes & Atalhos Rápidos:</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleApplyPreset([])}
                  className="text-[11px] text-neutral-400 hover:text-red-400 transition underline"
                >
                  Limpar seleção
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(['srv-2'], 697)}
                  className={`p-2 rounded-xl text-left border transition text-xs ${
                    selectedServiceIds.length === 1 && selectedServiceIds[0] === 'srv-2'
                      ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <span className="font-semibold block truncate">Combo Paradiso</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-0.5">
                    R$ 697 + R$ 197/mês
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(['srv-1'], 997)}
                  className={`p-2 rounded-xl text-left border transition text-xs ${
                    selectedServiceIds.length === 1 && selectedServiceIds[0] === 'srv-1'
                      ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <span className="font-semibold block truncate">Site Avulso</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-0.5">
                    R$ 997 (único)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(['srv-4'], 350)}
                  className={`p-2 rounded-xl text-left border transition text-xs ${
                    selectedServiceIds.length === 1 && selectedServiceIds[0] === 'srv-4'
                      ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <span className="font-semibold block truncate">Landing Page</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-0.5">
                    R$ 350 (único)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(['srv-2', 'srv-6', 'srv-7'], 1237)}
                  className={`p-2 rounded-xl text-left border transition text-xs ${
                    selectedServiceIds.includes('srv-2') && selectedServiceIds.includes('srv-6') && selectedServiceIds.includes('srv-7')
                      ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <span className="font-semibold block truncate">Combo Completo</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-0.5">
                    Site + SEO + Agenda
                  </span>
                </button>
              </div>
            </div>

            {/* Catalog Services Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  <span>Catálogo de Serviços Disponíveis:</span>
                </span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  {selectedServiceIds.length} selecionado(s)
                </span>
              </label>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {data.services
                  .filter((s) => s.isActive)
                  .map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    const currentPrice =
                      customServicePrices[service.id] !== undefined
                        ? customServicePrices[service.id]
                        : service.defaultPrice;

                    return (
                      <div
                        key={service.id}
                        className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500/40 text-white'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-neutral-300'
                        }`}
                      >
                        <div
                          onClick={() => handleToggleService(service.id)}
                          className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                              isSelected
                                ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                                : 'border-white/20 bg-white/5'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold leading-tight truncate">
                                {service.name}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                                {service.category}
                              </span>
                            </div>
                            {service.description && (
                              <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price Display & Custom Price Box */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {isSelected ? (
                            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                              <span className="text-[10px] text-neutral-400">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={currentPrice}
                                onChange={(e) => handleServicePriceChange(service.id, e.target.value)}
                                className="w-20 bg-transparent text-right text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                                title="Editar valor negociado para este serviço"
                              />
                            </div>
                          ) : (
                            <span className="text-xs font-mono font-semibold text-neutral-400">
                              {formatCurrency(service.defaultPrice)}
                            </span>
                          )}

                          {service.monthlyPrice && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                              +{formatCurrency(service.monthlyPrice)}/mês
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Proposal Calculation Box */}
            <div className="p-4 rounded-xl bg-[#161822] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span>Subtotal dos serviços selecionados:</span>
                <span className="font-mono font-semibold text-white">
                  {formatCurrency(calculateServicesSubtotal(selectedServiceIds, customServicePrices))}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span className="flex items-center gap-1">
                  <span>Desconto / Ajuste comercial (R$):</span>
                </span>
                <div className="flex items-center gap-1 w-28">
                  <span className="text-neutral-500 font-mono text-xs">-</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={discountAmount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-right font-mono text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              {/* Monthly Recurrence Preview if any service is recurring */}
              {calculateServicesMonthlyTotal(selectedServiceIds) > 0 && (
                <div className="flex items-center justify-between text-xs text-purple-300 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recorrência Mensal Inclusa (Plano de Cuidado):</span>
                  </span>
                  <span className="font-mono font-bold text-purple-400">
                    +{formatCurrency(calculateServicesMonthlyTotal(selectedServiceIds))}/mês
                  </span>
                </div>
              )}

              {/* Final Proposal Value */}
              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-white block">
                    Valor Final da Proposta (R$) *
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    Calculado pelos serviços, mas você pode digitar qualquer valor livremente
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <span className="text-xs font-bold text-emerald-400 font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={manualProposalValue}
                    onChange={(e) => setManualProposalValue(e.target.value)}
                    className="w-28 bg-transparent text-right text-base font-mono font-bold text-emerald-400 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Condições & Observações Comerciais da Proposta
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Proposta com desconto à vista via Pix ou 2x no cartão. Cliente tem interesse no Plano de Cuidado..."
                value={proposalNotes}
                onChange={(e) => setProposalNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setProposalClient(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Proposta Comercial ({formatCurrency(parseFloat(manualProposalValue.replace(',', '.')) || 0)})</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
