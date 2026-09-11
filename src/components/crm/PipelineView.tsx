import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PipelineStage, Client } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import {
  ChevronRight,
  ChevronLeft,
  Phone,
  MessageSquare,
  DollarSign,
  Plus,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const PipelineView: React.FC = () => {
  const { data, updateClientPipelineStage, setSelectedClientId } = useApp();

  const stages: PipelineStage[] = [
    'Prospectado',
    'Primeiro contato',
    'Respondeu',
    'Qualificado',
    'Demo apresentada',
    'Proposta enviada',
    'Negociação',
    'Fechado',
    'Perdido',
  ];

  const getStageIndex = (stage: PipelineStage) => stages.indexOf(stage);

  const moveStage = (clientId: string, currentStage: PipelineStage, direction: 'next' | 'prev') => {
    const currentIndex = getStageIndex(currentStage);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < stages.length) {
      updateClientPipelineStage(clientId, stages[newIndex]);
    }
  };

  return (
    <div id="pipeline-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div>
          <h2 className="text-sm font-semibold text-white">Funil Comercial de Clínicas</h2>
          <p className="text-xs text-neutral-400">
            Acompanhe o ciclo de qualificação e fechamento em 9 etapas estratégicas.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
          <span className="px-2 py-1 bg-white/5 rounded-lg border border-white/10">
            Total no Funil: {data.clients.length} leads/clientes
          </span>
        </div>
      </div>

      {/* 9 Stages Kanban Horizontal Scroller */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
        {stages.map((stage) => {
          const clientsInStage = data.clients.filter((c) => c.pipelineStage === stage);
          const stageTotalValue = clientsInStage.reduce(
            (sum, c) => sum + (c.totalSpent > 0 ? c.totalSpent : 697),
            0
          );

          const isClosed = stage === 'Fechado';
          const isLost = stage === 'Perdido';

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
              <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">{stage}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-neutral-300">
                      {clientsInStage.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    {formatCurrency(stageTotalValue)}
                  </p>
                </div>
              </div>

              {/* Cards List */}
              <div className="p-2 space-y-2.5 flex-1 min-h-[360px] overflow-y-auto">
                {clientsInStage.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-6 text-center text-[11px] text-neutral-600">
                    Nenhum lead nesta etapa
                  </div>
                ) : (
                  clientsInStage.map((client) => (
                    <div
                      key={client.id}
                      className="p-3.5 rounded-xl bg-[#181921] border border-white/[0.08] hover:border-white/20 transition shadow-sm space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4
                            onClick={() => setSelectedClientId(client.id)}
                            className="text-xs font-bold text-white hover:text-blue-400 cursor-pointer transition leading-tight"
                          >
                            {client.companyName}
                          </h4>
                          <p className="text-[11px] text-neutral-400 mt-0.5">{client.contactName}</p>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-emerald-400 shrink-0">
                          {formatCurrency(client.totalSpent > 0 ? client.totalSpent : 697)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/[0.04]">
                        <span className="px-1.5 py-0.2 rounded bg-white/5 text-[10px]">
                          {client.origin}
                        </span>
                        <span>{client.city}/{client.state}</span>
                      </div>

                      {/* Contact & Stage Movement controls */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          {client.phone && (
                            <a
                              href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-white/5 hover:bg-emerald-500/20 text-neutral-400 hover:text-emerald-300 transition"
                              title="Abrir WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedClientId(client.id)}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] font-medium"
                          >
                            Dossiê
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {stage !== 'Prospectado' && (
                            <button
                              onClick={() => moveStage(client.id, stage, 'prev')}
                              className="p-1 rounded bg-white/5 hover:bg-white/15 text-neutral-300 transition"
                              title="Recuar etapa"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {stage !== 'Fechado' && stage !== 'Perdido' && (
                            <button
                              onClick={() => moveStage(client.id, stage, 'next')}
                              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition flex items-center"
                              title="Avançar etapa"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {stage !== 'Fechado' && stage !== 'Perdido' && (
                            <button
                              onClick={() => updateClientPipelineStage(client.id, 'Fechado')}
                              className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                              title="Marcar como Fechado!"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
