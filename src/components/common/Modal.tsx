import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
          {/* Backdrop with cosmic blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(2px)' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[#0c0f18]/90 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] ring-1 ring-white/10 z-10`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div className="pr-2">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">{title}</h2>
                {subtitle && <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition active:scale-95 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
