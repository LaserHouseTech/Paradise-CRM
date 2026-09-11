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
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const PipelineView: React.FC = () => {
  const {
    data,
    updateClientPipelineStage,
    updatePipelineStage,
    setSelectedClientId,
    addClient,
  } = useApp();

  const handleUpdateStage = (clientId: string, stage: PipelineStage) => {
    if (updateClientPipelineStage) {
      updateClientPipelineStage(clientId, stage);
    } else if (updatePipelineStage) {
      updatePipelineStage(clientId, stage);
    }
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
    nextAction: 'Enviar mensagem WhatsApp de apresentação',
    notes: '',
  });

  const handleOpenNewLeadModal = (defaultStage: PipelineStage = 'Prospectado') => {
    setLeadStageTarget(defaultStage);
    setNewLeadForm({
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      city: 'São Paulo',
      state: 'SP',
      origin: 'Prospecção ativa',
      stage: defaultStage,
      potentialValue: '697',
      nextAction: 'Enviar mensagem WhatsApp de apresentação',
      notes: '',
    });
    setIsNewLeadModalOpen(true);
  };

  const handleSaveNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.companyName.trim() || !newLeadForm.contactName.trim()) return;

    const potVal = parseFloat(newLeadForm.potentialValue.replace(',', '.')) || 697;
    const isClosed = newLeadForm.stage === 'Fechado';

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
    <div id="pipeline-view" className="space-y-5 pb-12">
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
                              onClick={() => setSelectedClientId(client.id)}
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
                          <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">
                            {formatCurrency(clientVal)}
                          </span>
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
                              onClick={() => setSelectedClientId(client.id)}
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
                Valor Estimado da Oportunidade (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="697"
                value={newLeadForm.potentialValue}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, potentialValue: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
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
    </div>
  );
};
