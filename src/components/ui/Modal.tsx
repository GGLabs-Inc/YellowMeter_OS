import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badge?: string; // Like "SETUP" in the chess modal
  children: React.ReactNode;
  className?: string; // For overriding max-width etc
}

export function Modal({ isOpen, onClose, title, badge, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={cn(
          "relative w-full max-w-lg transform overflow-hidden rounded-xl border border-white/10 bg-[#0f1115] p-6 text-left shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {title && <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>}
              {badge && (
                <span className="bg-red-900/40 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/20 tracking-wider">
                  {badge}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
