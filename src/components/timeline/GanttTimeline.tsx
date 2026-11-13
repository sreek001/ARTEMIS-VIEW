import React, { useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Clock } from 'lucide-react';
import type { TimeStepResult } from '../../types';

interface GanttTimelineProps {
  steps: TimeStepResult[];
  currentTime: Date;
  isPlaying: boolean;
  playbackSpeed: number;
  onScrub: (time: Date) => void;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onReset: () => void;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  steps,
  currentTime,
  isPlaying,
  playbackSpeed,
  onScrub,
  onTogglePlay,
  onSetSpeed,
  onReset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);

  const startTime = steps[0]?.timestamp?.getTime() || 0;
  const endTime = steps[steps.length - 1]?.timestamp?.getTime() || 1;
  const totalDuration = endTime - startTime;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || steps.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 160;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Layout configuration
    const trackLabelWidth = 140;
    const trackWidth = width - trackLabelWidth - 20;
    const trackHeight = 24;
    const trackGap = 10;
    const startY = 24;

    ctx.fillStyle = '#07080A';
    ctx.fillRect(0, 0, width, height);

    // Track definitions
    const tracks = [
      { id: 'sun', label: '1. SOLAR ILLUM', color: '#F59E0B' },
      { id: 'dte', label: '2. DTE COMM LINK', color: '#38BDF8' },
      { id: 'ops', label: '3. OPTIMAL OPS', color: '#10B981' },
    ];

    const stepWidth = trackWidth / Math.max(1, steps.length);

    // Draw tracks
    tracks.forEach((track, tIdx) => {
      const y = startY + tIdx * (trackHeight + trackGap);

      // Track Label
      ctx.fillStyle = 'rgba(212, 218, 226, 0.75)';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(track.label, 12, y + trackHeight / 2);

      // Track Background Bar
      ctx.fillStyle = 'rgba(18, 21, 26, 0.9)';
      ctx.fillRect(trackLabelWidth, y, trackWidth, trackHeight);
      ctx.strokeStyle = 'rgba(212, 218, 226, 0.08)';
      ctx.strokeRect(trackLabelWidth, y, trackWidth, trackHeight);

      // Draw active block segments
      steps.forEach((step, sIdx) => {
        const x = trackLabelWidth + sIdx * stepWidth;
        let isActive = false;
        let opacity = 1;

        if (track.id === 'sun') {
          isActive = step.solarFraction > 0;
          opacity = Math.max(0.2, step.solarFraction);
        } else if (track.id === 'dte') {
          isActive = step.dteLink;
        } else if (track.id === 'ops') {
          isActive = step.optimalOps;
        }

        if (isActive) {
          ctx.fillStyle = track.color;
          ctx.globalAlpha = opacity;
          ctx.fillRect(x, y + 1, Math.max(1, stepWidth), trackHeight - 2);
          ctx.globalAlpha = 1.0;
        } else {
          // Inactive dark background with slight crimson indicator for ops no-go
          if (track.id === 'ops') {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.fillRect(x, y + 1, Math.max(1, stepWidth), trackHeight - 2);
          }
        }
      });
    });

    // Draw Time scale axis along bottom
    const axisY = startY + 3 * (trackHeight + trackGap) + 4;
    ctx.strokeStyle = 'rgba(138, 148, 166, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(trackLabelWidth, axisY);
    ctx.lineTo(trackLabelWidth + trackWidth, axisY);
    ctx.stroke();

    // Time ticks every 5 days
    const tickIntervalDays = 5;
    const totalDays = Math.ceil(totalDuration / 86400000);
    for (let day = 0; day <= totalDays; day += tickIntervalDays) {
      const frac = day / totalDays;
      const tx = trackLabelWidth + frac * trackWidth;
      ctx.beginPath();
      ctx.moveTo(tx, axisY);
      ctx.lineTo(tx, axisY + 4);
      ctx.stroke();

      const d = new Date(startTime + day * 86400000);
      const label = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
      ctx.fillStyle = 'rgba(138, 148, 166, 0.6)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`+${day}d (${label})`, tx, axisY + 14);
    }

    // Scrubber Needle (White glowing vertical line at currentTime)
    const currentProgress = (currentTime.getTime() - startTime) / totalDuration;
    const scrubberX = trackLabelWidth + Math.max(0, Math.min(1, currentProgress)) * trackWidth;

    ctx.beginPath();
    ctx.moveTo(scrubberX, startY - 4);
    ctx.lineTo(scrubberX, axisY + 16);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Scrubber handle pill on top
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(scrubberX, startY - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [steps, currentTime, startTime, endTime, totalDuration]);

  // Scrub handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const trackLabelWidth = 140;
    const trackWidth = rect.width - trackLabelWidth - 20;

    const clickX = e.clientX - rect.left - trackLabelWidth;
    const frac = Math.max(0, Math.min(1, clickX / trackWidth));
    const newTimeMs = startTime + frac * totalDuration;
    onScrub(new Date(newTimeMs));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 p-3">
      {/* Top Playback Transport Toolbar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--solar-gold)] text-[var(--bg-void)] font-bold text-xs hover:opacity-90 transition-all"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY SIM'}</span>
          </button>

          <button
            onClick={onReset}
            className="p-1.5 rounded text-[var(--text-anorthosite)] hover:text-[var(--text-regolith)] hover:bg-[var(--surface-solid)] transition-all"
            title="Reset to Mission Start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed selectors */}
          <div className="flex items-center gap-1 bg-[var(--surface-solid)] p-0.5 rounded border border-[var(--border-glass)]">
            {[1, 6, 24, 72].map((spd) => (
              <button
                key={spd}
                onClick={() => onSetSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                  playbackSpeed === spd
                    ? 'bg-[var(--terra-cyan)] text-[var(--bg-void)] font-bold'
                    : 'text-[var(--text-anorthosite)] hover:text-[var(--text-regolith)]'
                }`}
              >
                {spd}h/s
              </button>
            ))}
          </div>
        </div>

        {/* Current Time Readout */}
        <div className="flex items-center gap-2 text-xs font-mono bg-[var(--surface-solid)] px-3 py-1 rounded border border-[var(--border-glass)]">
          <Clock className="w-3.5 h-3.5 text-[var(--terra-cyan)]" />
          <span className="text-[var(--text-anorthosite)]">SIM TIME:</span>
          <span className="text-[var(--text-regolith)] font-bold">
            {currentTime.toISOString().replace('T', ' ').slice(0, 19)} UTC
          </span>
        </div>
      </div>

      {/* Scrubbable Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-[150px] cursor-ew-resize rounded-lg"
      />
    </div>
  );
};

