import { MapPin, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { LandingSite } from '../../types';
import { LANDING_SITES } from '../../data/landingSites';
import GlassPanel from '../layout/GlassPanel';

interface SiteSelectorProps {
  selectedSite: LandingSite;
  onSelect: (site: LandingSite) => void;
  label?: string;
}

export default function SiteSelector({ selectedSite, onSelect, label }: SiteSelectorProps) {
  const [open, setOpen] = useState(false);

  const artemis = LANDING_SITES.filter(s => s.category === 'artemis');
  const benchmark = LANDING_SITES.filter(s => s.category === 'benchmark');

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        className="glass-panel flex items-center justify-between w-full px-3 py-2 text-left hover:border-[var(--solar-gold)] transition-colors"
        style={{ borderColor: open ? 'var(--solar-gold)' : undefined }}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[var(--solar-gold)]" />
          <div>
            {label && (
              <span
                className="text-[10px] text-[var(--text-anorthosite)] block"
                style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                {label}
              </span>
            )}
            <span className="text-sm font-medium text-[var(--text-regolith)]">{selectedSite.name}</span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-anorthosite)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto glass-panel p-2"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          <SiteGroup title="Artemis III Candidates" sites={artemis} selected={selectedSite} onSelect={(s) => { onSelect(s); setOpen(false); }} />
          <div className="my-2 border-t border-[var(--border-glass)]" />
          <SiteGroup title="Benchmark Sites" sites={benchmark} selected={selectedSite} onSelect={(s) => { onSelect(s); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}

function SiteGroup({
  title,
  sites,
  selected,
  onSelect,
}: {
  title: string;
  sites: LandingSite[];
  selected: LandingSite;
  onSelect: (s: LandingSite) => void;
}) {
  return (
    <div>
      <div
        className="text-[10px] text-[var(--text-anorthosite)] px-2 py-1 font-semibold"
        style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        {title}
      </div>
      {sites.map(site => {
        const isActive = site.id === selected.id;
        return (
          <button
            key={site.id}
            className={`w-full text-left px-2 py-2 rounded-lg mb-0.5 transition-all ${
              isActive
                ? 'glow-gold border border-[var(--solar-gold)]'
                : 'hover:bg-[var(--surface-solid)] border border-transparent'
            }`}
            onClick={() => onSelect(site)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-regolith)]">{site.shortName}</span>
              <span className="text-xs text-[var(--text-anorthosite)]">{site.name}</span>
            </div>
            <div className="flex gap-3 mt-0.5 font-mono text-[10px] text-[var(--text-anorthosite)]">
              <span>{site.coord.lat.toFixed(2)}°, {site.coord.lon.toFixed(1)}°</span>
              <span>{site.elevation}m</span>
              <span>{site.slope}° slope</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
