interface MastSliderProps {
  value: number;
  onChange: (v: number) => void;
}

const TICKS = [0, 1, 2, 5, 10, 15, 20];

export default function MastSlider({ value, onChange }: MastSliderProps) {
  return (
    <div className="flex flex-col items-center gap-2 h-full py-2">
      <span
        className="text-[10px] text-[var(--text-anorthosite)] font-semibold"
        style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        Mast
      </span>

      <div className="relative flex-1 flex items-center justify-center min-h-[120px]">
        {/* Tick marks */}
        <div className="absolute left-0 h-full flex flex-col justify-between py-1">
          {[...TICKS].reverse().map(t => (
            <div key={t} className="flex items-center gap-1">
              <span className="font-mono text-[9px] text-[var(--text-anorthosite)] w-6 text-right">
                {t}m
              </span>
              <div className="w-2 h-px bg-[var(--text-anorthosite)] opacity-40" />
            </div>
          ))}
        </div>

        {/* Vertical range slider */}
        <input
          type="range"
          min={0}
          max={20}
          step={0.5}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="accent-[var(--solar-gold)]"
          style={{
            writingMode: 'vertical-lr',
            direction: 'rtl',
            height: '100%',
            marginLeft: '2.5rem',
          }}
        />
      </div>

      <span className="font-mono text-sm font-semibold text-[var(--solar-gold)]">
        {value.toFixed(1)}m
      </span>
    </div>
  );
}
