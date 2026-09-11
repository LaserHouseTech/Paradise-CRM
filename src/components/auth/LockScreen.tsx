import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LockScreen: React.FC = () => {
  const { isLocked, verifyLockPin, data } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isLocked) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyLockPin(pin)) {
      setPin('');
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div
      id="paradiso-lock-screen"
      className="fixed inset-0 z-50 bg-[#090a0d] flex flex-col items-center justify-between p-8 text-white select-none backdrop-blur-3xl animate-in fade-in duration-300"
    >
      {/* Top Header */}
      <div className="w-full flex justify-between items-center text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistema Local Ativo</span>
        </div>
        <span className="font-mono">{data.settings.companyName}</span>
      </div>

      {/* Center Clock & Lock Form */}
      <div className="flex flex-col items-center max-w-sm w-full -mt-12">
        <p className="text-sm font-medium text-neutral-400 capitalize mb-1">{currentDate}</p>
        <h1 className="text-7xl font-extralight tracking-tighter text-white mb-8 font-mono">
          {currentTime}
        </h1>

        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-6 shadow-xl shadow-black/60">
          <Lock className="w-7 h-7 text-neutral-300" />
        </div>

        <h2 className="text-lg font-semibold tracking-tight text-white mb-1">
          {data.settings.companyName}
        </h2>
        <p className="text-xs text-neutral-400 mb-6 text-center">
          Sessão local bloqueada para privacidade. Digite sua senha ou PIN (Padrão: 1234).
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <div className="relative">
            <input
              type="password"
              autoFocus
              maxLength={12}
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value);
              }}
              placeholder="Digite o PIN de desbloqueio"
              className={`w-full px-4 py-3 rounded-xl bg-white/[0.08] border ${
                error ? 'border-red-500 text-red-300' : 'border-white/15 text-white'
              } text-center tracking-[0.3em] font-mono text-lg focus:outline-none focus:border-white/40 transition placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-neutral-500`}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center animate-shake">
              PIN incorreto. Tente novamente (ou redefina nas configurações).
            </p>
          )}

          <div className="flex justify-center gap-2 pt-2">
            {[1, 2, 3, 4].map((num) => (
              <span
                key={num}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  pin.length >= num ? 'bg-white scale-110' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </form>
      </div>

      {/* Bottom Footer Info */}
      <div className="text-[11px] text-neutral-400 flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
        <span>Todos os dados são criptografados e armazenados localmente neste dispositivo.</span>
      </div>
    </div>
  );
};
