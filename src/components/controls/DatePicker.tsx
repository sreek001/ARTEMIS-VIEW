import { Calendar } from 'lucide-react';

interface DatePickerProps {
  missionDate: Date;
  launchDelay: number;
  onDateChange: (d: Date) => void;
  onDelayChange: (d: number) => void;
}

export default function DatePicker({ missionDate, launchDelay, onDateChange, onDelayChange }: DatePickerProps) {
  const effectiveDate = new Date(missionDate.getTime() + launchDelay * 86400000);

  const formatDate = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

  const handleDateInput = (val: string) => {
    const d = new Date(val + 'T00:00:00Z');
    if (!isNaN(d.getTime())) onDateChange(d);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Date Input */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[var(--solar-gold)]" />
        <label
          className="text-[10px] text-[var(--text-anorthosite)] font-semibold"
          style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          Mission Start
        </label>
      </div>
      <input
        type="date"
        min="2026-01-01"
        max="2035-12-31"
        value={formatDate(missionDate)}
        onChange={e => handleDateInput(e.target.value)}
        className="font-mono text-sm px-3 py-1.5 rounded-lg bg-[var(--surface-solid)] text-[var(--text-regolith)] border border-[var(--border-glass)] focus:border-[var(--solar-gold)] outline-none"
      />

      {/* Launch Delay */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[10px] text-[var(--text-anorthosite)] font-semibold"
            style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Launch Delay
          </span>
          <span className="font-mono text-xs text-[var(--solar-gold)]">
            {launchDelay >= 0 ? '+' : ''}{launchDelay}d
          </span>
        </div>
        <input
          type="range"
          min={-30}
          max={365}
          step={1}
          value={launchDelay}
          onChange={e => onDelayChange(parseInt(e.target.value))}
          className="w-full accent-[var(--solar-gold)]"
        />
      </div>

      {/* Effective Date */}
      <div className="flex items-center justify-between px-2 py-1 rounded-md bg-[var(--surface-solid)]">
        <span
          className="text-[10px] text-[var(--text-anorthosite)]"
          style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          Effective
        </span>
        <span className="font-mono text-sm text-[var(--terra-cyan)]">
          {formatDate(effectiveDate)}
        </span>
      </div>
    </div>
  );
}
