import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface DashboardCardProps {
  title: string;
  price?: string; // e.g. "$0.02"
  badge?: string; // e.g. "Perps", "Wager"
  description: string;
  whyYellow: string;
  buttonText: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'highlight';
}

export function DashboardCard({
  title,
  price,
  badge,
  description,
  whyYellow,
  buttonText,
  icon,
  onClick,
  disabled,
  className,
  variant = 'default',
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col p-6 rounded-xl border transition-all duration-300 group",
        "bg-card border-white/5 hover:border-primary/50",
        variant === 'highlight' && "border-primary/20 bg-primary/5",
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/50 text-primary group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <div className="flex gap-2">
            {price && (
                <span className="text-xs font-mono font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                {price}
                </span>
            )}
            {badge && (
                <span className={cn(
                    "text-xs font-mono font-bold px-2 py-1 rounded",
                    badge === 'Wager' ? "text-orange-400 bg-orange-400/10" :
                    badge === 'Perps' ? "text-purple-400 bg-purple-400/10" :
                    "text-muted-foreground bg-secondary"
                )}>
                {badge}
                </span>
            )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-400 mb-6 min-h-[60px]">
        {description}
      </p>

      {/* Why Yellow Box */}
      <div className="bg-secondary/30 rounded-lg p-3 mb-6 border border-white/5">
        <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">
          ¿Por qué Yellow?
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          {whyYellow}
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "mt-auto w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
          disabled 
            ? "bg-secondary text-gray-500 cursor-not-allowed"
            : "bg-secondary hover:bg-primary hover:text-black text-white group-hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]"
        )}
      >
        {buttonText}
      </button>
    </div>
  );
}
