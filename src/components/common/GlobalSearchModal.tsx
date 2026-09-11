import React, { useState, useMemo } from 'react';
import { Search, X, Users, FolderKanban, Receipt, CreditCard, Repeat, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { data, setCurrentView, setSelectedClientId } = useApp();
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'client' | 'project' | 'receivable' | 'payable' | 'subscription';
      badge?: string;
      action: () => void;
    }> = [];

    // Search Clients
    data.clients.forEach((c) => {
      if (
        c.companyName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      ) {
        results.push({
          id: c.id,
          title: c.companyName,
          subtitle: `${c.contactName} • ${c.city}/${c.state} • ${c.status}`,
          type: 'client',
          badge: c.isRecurring ? 'Recorrente' : undefined,
          action: () => {
            setSelectedClientId(c.id);
            setCurrentView('clients');
            onClose();
          },
        });
      }
    });

    // Search Projects
    data.projects.forEach((p) => {
      const client = data.clients.find((c) => c.id === p.clientId)?.companyName || '';
      if (
        p.name.toLowerCase().includes(q) ||
        p.serviceName.toLowerCase().includes(q) ||
        client.toLowerCase().includes(q)
      ) {
        results.push({
          id: p.id,
          title: p.name,
          subtitle: `${client} • ${formatCurrency(p.contractValue)} • ${p.status}`,
          type: 'project',
          badge: p.status,
          action: () => {
            setCurrentView('projects');
            onClose();
          },
        });
      }
    });

    // Search Receivables
    data.receivables.forEach((r) => {
      const client = data.clients.find((c) => c.id === r.clientId)?.companyName || '';
      if (
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        client.toLowerCase().includes(q)
      ) {
        results.push({
          id: r.id,
          title: r.description,
          subtitle: `${client} • ${formatCurrency(r.grossAmount)} • Venc: ${r.dueDate} • ${r.status}`,
          type: 'receivable',
          badge: r.status,
          action: () => {
            setCurrentView('receivables');
            onClose();
          },
        });
      }
    });

    // Search Payables
    data.payables.forEach((p) => {
      if (
        p.description.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: p.id,
          title: p.description,
          subtitle: `${p.supplier} • ${formatCurrency(p.amount)} • ${p.category} • ${p.status}`,
          type: 'payable',
          badge: p.status,
          action: () => {
            setCurrentView('payables');
            onClose();
          },
        });
      }
    });

    // Search Subscriptions
    data.subscriptions.forEach((s) => {
      const client = data.clients.find((c) => c.id === s.clientId)?.companyName || '';
      if (client.toLowerCase().includes(q) || s.planName.toLowerCase().includes(q)) {
        results.push({
          id: s.id,
          title: `${s.planName} - ${client}`,
          subtitle: `${formatCurrency(s.monthlyValue)}/mês • Dia ${s.dueDay} • ${s.status}`,
          type: 'subscription',
          badge: s.status,
          action: () => {
            setCurrentView('subscriptions');
            onClose();
          },
        });
      }
    });

    return results.slice(0, 15);
  }, [query, data, setCurrentView, setSelectedClientId, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#14151b] border border-white/15 rounded-2xl shadow-2xl shadow-black overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#181a22]">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            type="text"
            autoFocus
            placeholder="Buscar por cliente, faturamento, projeto, despesa, fornecedor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-neutral-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] bg-white/10 text-neutral-400 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/[0.04]">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              Digite para buscar clientes, projetos, cobranças, despesas ou assinaturas ativas.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              Nenhum resultado encontrado para &ldquo;{query}&rdquo;.
            </div>
          ) : (
            searchResults.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={item.action}
                className="p-3 rounded-xl hover:bg-white/[0.06] cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-neutral-300">
                    {item.type === 'client' && <Users className="w-4 h-4 text-blue-400" />}
                    {item.type === 'project' && <FolderKanban className="w-4 h-4 text-purple-400" />}
                    {item.type === 'receivable' && <Receipt className="w-4 h-4 text-emerald-400" />}
                    {item.type === 'payable' && <CreditCard className="w-4 h-4 text-amber-400" />}
                    {item.type === 'subscription' && <Repeat className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className="text-xs text-neutral-400 truncate">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {item.badge && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                      {item.badge}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
