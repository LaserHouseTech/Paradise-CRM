import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
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
    <AnimatePresence>
      {isLocked && (
        <motion.div
          id="paradiso-lock-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-[#05060a] flex flex-col items-center justify-between p-6 sm:p-8 text-white select-none overflow-hidden"
        >
          {/* Deep Space Background Glows */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-blue-600/[0.08] blur-[150px] animate-nebula" />
            <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-700/[0.06] blur-[140px]" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)`,
                backgroundSize: '36px 36px',
              }}
            />
          </div>

          {/* Top Header */}
          <div className="relative z-10 w-full flex justify-between items-center text-xs text-neutral-400">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-neutral-300">Sistema Seguro</span>
            </div>
            <span className="font-mono text-neutral-400">{data.settings.companyName}</span>
          </div>

          {/* Center Clock & Lock Card */}
          <motion.div
            initial={{ scale: 0.96, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center max-w-sm w-full -mt-6 sm:-mt-10"
          >
            <p className="text-xs sm:text-sm font-medium text-neutral-400 capitalize mb-1 tracking-wide">
              {currentDate}
            </p>
            <h1 className="text-6xl sm:text-7xl font-extralight tracking-tight text-white mb-8 font-mono drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              {currentTime}
            </h1>

            {/* Glass Box */}
            <div className="w-full bg-[#0c0f1a]/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-2xl shadow-black ring-1 ring-white/10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>

              <h2 className="text-base font-semibold tracking-tight text-white mb-1 text-center">
                {data.settings.companyName}
              </h2>
              <p className="text-[11px] text-neutral-400 mb-5 text-center leading-relaxed">
                Sessão local bloqueada. Digite sua senha ou PIN (Padrão: 1234).
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
                    placeholder="Digite o PIN"
                    className={`w-full px-4 py-3 rounded-xl bg-white/[0.06] border ${
                      error ? 'border-red-500 text-red-300' : 'border-white/15 text-white focus:border-blue-500/50'
                    } text-center tracking-[0.3em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-neutral-500`}
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
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
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        pin.length >= num
                          ? 'bg-blue-400 scale-110 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                          : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </form>
            </div>
          </motion.div>

          {/* Bottom Footer Info */}
          <div className="relative z-10 text-[11px] text-neutral-400 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dados criptografados e armazenados localmente.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
