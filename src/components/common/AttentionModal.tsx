import React from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { generateAttentionAlerts } from '../../lib/calculations';
import { AlertTriangle, AlertCircle, ArrowRight, CheckCircle, Clock } from 'lucide-react';

interface AttentionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttentionModal: React.FC<AttentionModalProps> = ({ isOpen, onClose }) => {
  const { data, setCurrentView } = useApp();

  const alerts = generateAttentionAlerts(
    data.receivables,
    data.payables,
    data.subscriptions,
    data.projects
  );

  const handleAction = (route?: string) => {
    if (route) {
      setCurrentView(route);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Central de Atenção & Alertas"
      subtitle="Pendências críticas e vencimentos que exigem acompanhamento"
    >
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="py-10 text-center text-neutral-400">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Tudo em dia!</p>
            <p className="text-xs text-neutral-400 mt-1">
              Não há contas vencidas ou mensalidades atrasadas no momento.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                alert.type === 'danger'
                  ? 'bg-red-500/10 border-red-500/20 text-red-300'
                  : alert.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {alert.type === 'danger' ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : alert.type === 'warning' ? (
                    <Clock className="w-5 h-5 text-amber-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">{alert.title}</h3>
                  <p className="text-xs text-neutral-300 mt-0.5">{alert.description}</p>
                </div>
              </div>

              {alert.actionRoute && (
                <button
                  onClick={() => handleAction(alert.actionRoute)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 flex items-center gap-1.5 transition"
                >
                  <span>Ver</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};
