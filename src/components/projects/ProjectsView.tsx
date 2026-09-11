import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus, ServiceCatalogItem } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  FolderKanban,
  Plus,
  Search,
  ExternalLink,
  Calendar,
  DollarSign,
  Tag,
  CheckCircle2,
  Clock,
  Briefcase,
  Sparkles,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { data, addProject, updateProject, setSelectedClientId } = useApp();

  const [activeTab, setActiveTab] = useState<'projects' | 'services'>('projects');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // New Project modal state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projClientId, setProjClientId] = useState(data.clients[0]?.id || '');
  const [projService, setProjService] = useState('Site Institucional');
  const [projValue, setProjValue] = useState('697');
  const [projStartDate, setProjStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [projDeliveryDate, setProjDeliveryDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [projPreviewUrl, setProjPreviewUrl] = useState('');
  const [projLiveUrl, setProjLiveUrl] = useState('');
  const [projNotes, setProjNotes] = useState('');

  // New Service modal state
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [srvName, setSrvName] = useState('');
  const [srvDescription, setSrvDescription] = useState('');
  const [srvPrice, setSrvPrice] = useState('');
  const [srvCategory, setSrvCategory] = useState<'Avulso' | 'Recorrente'>('Avulso');

  const filteredProjects = data.projects.filter((p) => {
    const client = data.clients.find((c) => c.id === p.clientId)?.companyName || '';
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      client.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !projClientId || !projValue) return;

    addProject({
      name: projName,
      clientId: projClientId,
      serviceName: projService,
      contractValue: parseFloat(projValue) || 697,
      paidAmount: 0,
      remainingAmount: parseFloat(projValue) || 697,
      status: 'Briefing',
      startDate: projStartDate,
      deliveryDate: projDeliveryDate,
      previewUrl: projPreviewUrl || undefined,
      liveUrl: projLiveUrl || undefined,
      notes: projNotes || undefined,
    });

    setIsNewProjectModalOpen(false);
    setProjName('');
    setProjValue('697');
  };

  const handleUpdateProjectStatus = (projectId: string, newStatus: ProjectStatus) => {
    updateProject(projectId, {
      status: newStatus,
      realDeliveryDate: newStatus === 'Finalizado' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const projectStatuses: ProjectStatus[] = [
    'Briefing',
    'Conteúdo',
    'Design/Estrutura',
    'Desenvolvimento',
    'Revisão do cliente',
    'Finalizado',
    'Cancelado',
  ];

  return (
    <div id="projects-module" className="space-y-6 pb-12">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'projects'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white bg-white/5'
            }`}
          >
            Projetos Ativos ({data.projects.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'services'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white bg-white/5'
            }`}
          >
            Catálogo de Serviços ({data.services.length})
          </button>
        </div>

        {activeTab === 'projects' ? (
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Novo Projeto</span>
          </button>
        ) : (
          <button
            onClick={() => setIsNewServiceModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Novo Serviço Padrão</span>
          </button>
        )}
      </div>

      {activeTab === 'projects' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar projeto por nome, tipo ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#13141a] border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#13141a] border border-white/10 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="todos" className="bg-neutral-900 text-white">Todos os Status</option>
              {projectStatuses.map((s) => (
                <option key={s} value={s} className="bg-neutral-900 text-white">{s}</option>
              ))}
            </select>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const client = data.clients.find((c) => c.id === project.clientId);
              return (
                <div
                  key={project.id}
                  className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] hover:border-white/20 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold tracking-wider text-blue-400 uppercase">
                          {project.serviceName}
                        </span>
                        <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
                          {project.name}
                        </h3>
                      </div>
                      <span className="font-mono text-xs font-bold text-white bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                        {formatCurrency(project.contractValue)}
                      </span>
                    </div>

                    <p
                      onClick={() => client && setSelectedClientId(client.id)}
                      className="text-xs text-neutral-400 hover:text-white cursor-pointer transition flex items-center gap-1"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{client?.companyName || 'Cliente não identificado'}</span>
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-neutral-400 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span>Entrega estimada:</span>
                      <span className="font-medium text-neutral-200">{formatDate(project.deliveryDate)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Status atual:</span>
                      <select
                        value={project.status}
                        onChange={(e) => handleUpdateProjectStatus(project.id, e.target.value as ProjectStatus)}
                        className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-xs font-medium text-white focus:outline-none"
                      >
                        {projectStatuses.map((s) => (
                          <option key={s} value={s} className="bg-neutral-900 text-white">{s}</option>
                        ))}
                      </select>
                    </div>

                    {project.liveUrl && (
                      <div className="flex items-center justify-between pt-1">
                        <span>Site no ar:</span>
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span>Acessar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Catálogo de Serviços */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.services.map((srv) => (
            <div
              key={srv.id}
              className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      srv.category === 'Recorrente'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {srv.category}
                  </span>
                  <span className="font-mono text-sm font-bold text-white">
                    {formatCurrency(srv.defaultPrice)}
                    {srv.category === 'Recorrente' && <span className="text-xs font-normal text-neutral-400">/mês</span>}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">{srv.name}</h3>
                <p className="text-xs text-neutral-400 mt-1">{srv.description}</p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-500">
                <span>Padrão Paradiso</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ativo</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Novo Projeto Digital"
        subtitle="Vincule um projeto a uma clínica e defina o escopo"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Nome do Projeto</label>
            <input
              type="text"
              placeholder="Ex: Site Institucional Novo"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Cliente Vinculado</label>
              <select
                value={projClientId}
                onChange={(e) => setProjClientId(e.target.value)}
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
              <label className="block text-xs font-medium text-neutral-400 mb-1">Tipo de Serviço</label>
              <select
                value={projService}
                onChange={(e) => {
                  setProjService(e.target.value);
                  const found = data.services.find((s) => s.name === e.target.value);
                  if (found) setProjValue(found.defaultPrice.toString());
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                {data.services.map((s) => (
                  <option key={s.id} value={s.name} className="bg-neutral-900 text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Valor do Contrato (R$)</label>
              <input
                type="number"
                step="0.01"
                value={projValue}
                onChange={(e) => setProjValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Previsão de Entrega</label>
              <input
                type="date"
                value={projDeliveryDate}
                onChange={(e) => setProjDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Link de Prévia / Staging (Opcional)</label>
            <input
              type="text"
              placeholder="https://staging.paradiso.digital/preview-cliente"
              value={projPreviewUrl}
              onChange={(e) => setProjPreviewUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Cadastrar Projeto
          </button>
        </form>
      </Modal>

      {/* NEW SERVICE MODAL */}
      <Modal
        isOpen={isNewServiceModalOpen}
        onClose={() => setIsNewServiceModalOpen(false)}
        title="Novo Serviço no Catálogo"
        subtitle="Cadastre pacotes com tabela de preço recomendada"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!srvName || !srvPrice) return;
            const newSrv: ServiceCatalogItem = {
              id: `srv-${Date.now()}`,
              name: srvName,
              description: srvDescription,
              defaultPrice: parseFloat(srvPrice),
              category: srvCategory,
              isActive: true,
            };
            data.services.push(newSrv);
            setIsNewServiceModalOpen(false);
            setSrvName('');
            setSrvPrice('');
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Nome do Serviço</label>
            <input
              type="text"
              placeholder="Ex: Landing Page de Alta Conversão"
              value={srvName}
              onChange={(e) => setSrvName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Preço Sugerido (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="350.00"
                value={srvPrice}
                onChange={(e) => setSrvPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Tipo de Cobrança</label>
              <select
                value={srvCategory}
                onChange={(e) => setSrvCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="Avulso" className="bg-neutral-900 text-white">Avulso</option>
                <option value="Recorrente" className="bg-neutral-900 text-white">Recorrente (Mensal)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Descrição do Escopo</label>
            <textarea
              rows={2}
              value={srvDescription}
              onChange={(e) => setSrvDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Adicionar ao Catálogo
          </button>
        </form>
      </Modal>
    </div>
  );
};
