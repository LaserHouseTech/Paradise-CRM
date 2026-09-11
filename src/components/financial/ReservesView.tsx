import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialReserve } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import {
  PiggyBank,
  Plus,
  ShieldCheck,
  Percent,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const ReservesView: React.FC = () => {
  const { data, updateReserve, addReserve } = useApp();

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedReserve, setSelectedReserve] = useState<FinancialReserve | null>(null);
  const [movementAmount, setMovementAmount] = useState('');
  const [movementType, setMovementType] = useState<'deposit' | 'withdraw'>('deposit');

  const [isNewReserveModalOpen, setIsNewReserveModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTarget, setNewTarget] = useState('');

  const totalCurrentReserves = data.reserves.reduce((sum, r) => sum + r.currentAmount, 0);
  const totalTargetReserves = data.reserves.reduce((sum, r) => sum + r.targetAmount, 0);

  const handleOpenMovementModal = (res: FinancialReserve, type: 'deposit' | 'withdraw') => {
    setSelectedReserve(res);
    setMovementType(type);
    setIsDepositModalOpen(true);
  };

  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReserve || !movementAmount) return;

    const val = parseFloat(movementAmount);
    const updatedAmount =
      movementType === 'deposit'
        ? selectedReserve.currentAmount + val
        : Math.max(0, selectedReserve.currentAmount - val);

    updateReserve(selectedReserve.id, { currentAmount: updatedAmount });
    setIsDepositModalOpen(false);
    setMovementAmount('');
    setSelectedReserve(null);
  };

  const handleCreateReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTarget) return;

    addReserve({
      name: newName,
      objective: newDesc,
      targetAmount: parseFloat(newTarget),
      currentAmount: 0,
    });

    setIsNewReserveModalOpen(false);
    setNewName('');
    setNewDesc('');
    setNewTarget('');
  };

  return (
    <div id="reserves-module" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#13141a] border border-white/[0.08]">
        <div>
          <h2 className="text-sm font-semibold text-white">Reservas Estratégicas da Paradiso</h2>
          <p className="text-xs text-neutral-400">
            Separação inteligente do capital para emergência, impostos e equipamentos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
              Total Acumulado em Reservas
            </span>
            <span className="text-base font-bold font-mono text-white">
              {formatCurrency(totalCurrentReserves)}
            </span>
          </div>

          <button
            onClick={() => setIsNewReserveModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nova Reserva</span>
          </button>
        </div>
      </div>

      {/* Reserves Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.reserves.map((res) => {
          const progress = Math.min(100, Math.round((res.currentAmount / res.targetAmount) * 100));

          return (
            <div
              key={res.id}
              className="p-5 rounded-2xl bg-[#13141a] border border-white/[0.08] flex flex-col justify-between space-y-4 hover:border-white/20 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                      <PiggyBank className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{res.name}</h3>
                      <p className="text-[11px] text-neutral-400">{res.description}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {progress}%
                  </span>
                </div>

                <div className="mt-5 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono text-white">
                      {formatCurrency(res.currentAmount)}
                    </span>
                    <span className="text-xs font-mono text-neutral-400">
                      Meta: {formatCurrency(res.targetAmount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  onClick={() => handleOpenMovementModal(res, 'deposit')}
                  className="py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition flex items-center justify-center gap-1"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Aportar</span>
                </button>

                <button
                  onClick={() => handleOpenMovementModal(res, 'withdraw')}
                  className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium border border-white/10 transition flex items-center justify-center gap-1"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Retirar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MOVEMENT MODAL */}
      {selectedReserve && (
        <Modal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          title={movementType === 'deposit' ? 'Aportar na Reserva' : 'Retirar da Reserva'}
          subtitle={`Reserva: ${selectedReserve.name} (Saldo atual: ${formatCurrency(selectedReserve.currentAmount)})`}
        >
          <form onSubmit={handleConfirmMovement} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Valor do {movementType === 'deposit' ? 'Aporte' : 'Resgate'} (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                movementType === 'deposit'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white hover:bg-neutral-200 text-neutral-950'
              }`}
            >
              Confirmar {movementType === 'deposit' ? 'Aporte' : 'Retirada'}
            </button>
          </form>
        </Modal>
      )}

      {/* NEW RESERVE MODAL */}
      <Modal
        isOpen={isNewReserveModalOpen}
        onClose={() => setIsNewReserveModalOpen(false)}
        title="Criar Nova Reserva Estratégica"
        subtitle="Separe caixinhas para objetivos específicos da empresa"
      >
        <form onSubmit={handleCreateReserve} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Nome da Reserva</label>
            <input
              type="text"
              placeholder="Ex: Fundo para Equipamentos Mac"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Meta de Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Ex: 8000.00"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Finalidade desta reserva..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition"
          >
            Criar Reserva
          </button>
        </form>
      </Modal>
    </div>
  );
};
