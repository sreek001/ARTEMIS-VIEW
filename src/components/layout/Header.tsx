import { Sun, GitCompare, Telescope, Map } from 'lucide-react';
import type { AudienceMode } from '../../types';

interface HeaderProps {
  mode: AudienceMode;
  mastHeight: number;
  compareMode: boolean;
  onModeChange: (mode: AudienceMode) => void;
  onMastChange: (h: number) => void;
  onToggleCompare: () => void;
}

export default function Header({
  mode,
  mastHeight,
  compareMode,
  onModeChange,
  onMastChange,
  onToggleCompare,
}: HeaderProps) {
  return (
    <header className="glass-panel flex items-center justify-between px-6 py-3 mx-3 mt-3 mb-2">
      {/* Branding */}
      <div className="flex items-center gap-3">
        <Sun className="w-5 h-5 text-[var(--solar-gold)]" />
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-display text-base font-bold text-[var(--text-regolith)]"
            style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            ARTEMIS
          </span>
          <span className="text-[var(--text-anorthosite)] text-sm">//</span>
          <span
            className="font-display text-sm font-medium text-[var(--text-anorthosite)]"
            style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            SELENE-NAV
          </span>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--surface-solid)' }}>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'planner'
              ? 'bg-[var(--solar-gold)] text-[var(--bg-void)]'
              : 'text-[var(--text-anorthosite)] hover:text-[var(--text-regolith)]'
          }`}
          style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
          onClick={() => onModeChange('planner')}
        >
          <Telescope className="w-3.5 h-3.5" />
          Planner
        </button>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'explorer'
              ? 'bg-[var(--terra-cyan)] text-[var(--bg-void)]'
              : 'text-[var(--text-anorthosite)] hover:text-[var(--text-regolith)]'
          }`}
          style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
          onClick={() => onModeChange('explorer')}
        >
          <Map className="w-3.5 h-3.5" />
          Explorer
        </button>
      </div>

      {/* Mast Height Slider */}
      <div className="flex items-center gap-3">
        <label
          className="text-xs text-[var(--text-anorthosite)] font-medium"
          style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          Mast
        </label>
        <input
          type="range"
          min={0}
          max={20}
          step={0.5}
          value={mastHeight}
          onChange={e => onMastChange(parseFloat(e.target.value))}
          className="w-28 accent-[var(--solar-gold)]"
        />
        <span className="font-mono text-sm text-[var(--solar-gold)] w-10 text-right">
          {mastHeight.toFixed(1)}m
        </span>
      </div>

      {/* Compare Button */}
      <button
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          compareMode
            ? 'glow-cyan text-[var(--terra-cyan)]'
            : 'text-[var(--text-anorthosite)] hover:text-[var(--text-regolith)]'
        }`}
        style={{
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          border: compareMode ? '1px solid var(--terra-cyan)' : '1px solid var(--border-glass)',
        }}
        onClick={onToggleCompare}
      >
        <GitCompare className="w-3.5 h-3.5" />
        Compare
      </button>
    </header>
  );
}
