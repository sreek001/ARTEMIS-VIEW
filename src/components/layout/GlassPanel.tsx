import React from 'react';

interface GlassPanelProps {
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export default function GlassPanel({ title, icon, className = '', children }: GlassPanelProps) {
  return (
    <div className={`glass-panel p-4 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-glass)' }}>
          {icon && <span className="text-[var(--solar-gold)]">{icon}</span>}
          <h3
            className="font-display text-xs font-semibold text-[var(--text-anorthosite)]"
            style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
}
