import React, { useRef, useEffect } from 'react';
import { Mountain, Sun, Radio, AlertTriangle } from 'lucide-react';
import type { LandingSite, HorizonMask } from '../../types';
import { computeEphemeris, getHorizonMask, getHorizonAtAzimuth } from '../../engine';

interface HorizonPanoramaProps {
  site: LandingSite;
  mastHeight: number;
  currentTime: Date;
}

export const HorizonPanorama: React.FC<HorizonPanoramaProps> = ({
  site,
  mastHeight,
  currentTime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute ephemeris & horizon mask
  const ephem = computeEphemeris(site.coord.lat, site.coord.lon, currentTime);
  const mask: HorizonMask = getHorizonMask(site.id, mastHeight);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 360;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Coordinate mapping
    // Azimuth: 0° to 360° across width
    // Elevation: -5° at bottom to +20° at top (25° total range)
    const elMin = -5;
    const elMax = 20;
    const elRange = elMax - elMin;

    const azToX = (az: number) => (az / 360) * width;
    const elToY = (el: number) => height - ((el - elMin) / elRange) * height;

    // 1. Background Void (Lunar airless sky)
    ctx.fillStyle = '#07080A';
    ctx.fillRect(0, 0, width, height);

    // 2. Grid lines & Elevation guides
    ctx.lineWidth = 1;
    for (let el = 0; el <= 20; el += 5) {
      const y = elToY(el);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.strokeStyle = el === 0 ? 'rgba(212, 218, 226, 0.35)' : 'rgba(138, 148, 166, 0.12)';
      ctx.stroke();

      // Elevation text
      ctx.fillStyle = el === 0 ? 'rgba(212, 218, 226, 0.8)' : 'rgba(138, 148, 166, 0.5)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${el > 0 ? '+' : ''}${el}°`, 6, y - 3);
    }

    // Azimuth cardinal directions
    const cardinals = [
      { deg: 0, label: '0° N (Prime Meridian)' },
      { deg: 90, label: '90° E' },
      { deg: 180, label: '180° S' },
      { deg: 270, label: '270° W' },
      { deg: 360, label: '360° N' },
    ];

    cardinals.forEach((c) => {
      const x = azToX(c.deg);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.strokeStyle = 'rgba(138, 148, 166, 0.18)';
      ctx.stroke();

      ctx.fillStyle = 'rgba(138, 148, 166, 0.7)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = c.deg === 0 ? 'left' : c.deg === 360 ? 'right' : 'center';
      ctx.fillText(c.label, x + (c.deg === 0 ? 4 : c.deg === 360 ? -4 : 0), height - 8);
    });

    // 3. Draw Red Occlusion Hazard Fill Zone (where terrain is taller than 0°)
    ctx.beginPath();
    ctx.moveTo(0, elToY(0));
    for (let az = 0; az <= 360; az++) {
      const hEl = getHorizonAtAzimuth(mask, az % 360);
      const clampedEl = Math.max(0, hEl);
      ctx.lineTo(azToX(az), elToY(clampedEl));
    }
    ctx.lineTo(width, elToY(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fill();

    // 4. Draw Mountain Silhouette (Charcoal Basalt Regolith)
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, elToY(getHorizonAtAzimuth(mask, 0)));
    for (let az = 1; az <= 360; az++) {
      const hEl = getHorizonAtAzimuth(mask, az % 360);
      ctx.lineTo(azToX(az), elToY(hEl));
    }
    ctx.lineTo(width, height);
    ctx.closePath();

    const mountainGrad = ctx.createLinearGradient(0, elToY(10), 0, height);
    mountainGrad.addColorStop(0, '#1E232B');
    mountainGrad.addColorStop(1, '#0D0F14');
    ctx.fillStyle = mountainGrad;
    ctx.fill();

    // Mountain Ridge Crest Line
    ctx.strokeStyle = 'rgba(212, 218, 226, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Draw Earth's Libration Wobble Box (Lissajous bounding zone)
    // From south pole, nominal Earth is at az ~ 0° / 360°, el ~ 0° with ±6.7° lat, ±7.9° lon wobble
    const earthNominalAz = 0;
    const earthNominalEl = (site.coord.lat + 90) * 0.7; // elevation scales with distance from pole
    const elBoxMin = Math.max(-4, earthNominalEl - 6.7);
    const elBoxMax = earthNominalEl + 6.7;

    // Draw Earth Libration Box (Cyan dashed)
    const boxX1 = azToX(360 - 7.9);
    const boxX2 = azToX(7.9);
    const boxY1 = elToY(elBoxMax);
    const boxY2 = elToY(elBoxMin);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    // Draw left segment (352° to 360°) and right segment (0° to 8°)
    ctx.strokeRect(boxX1, boxY1, width - boxX1, boxY2 - boxY1);
    ctx.strokeRect(0, boxY1, boxX2, boxY2 - boxY1);
    ctx.setLineDash([]);

    // 6. Draw Sun Orbit Grazing Trajectory Line (Gold dotted sweep across 360°)
    ctx.beginPath();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 1.2;
    for (let az = 0; az <= 360; az += 2) {
      // Ephemeris elevation for this az approximation across month
      const y = elToY(ephem.sun.el);
      if (az === 0) ctx.moveTo(azToX(az), y);
      else ctx.lineTo(azToX(az), y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 7. Draw Earth Position (Cyan Circle with glow)
    const earthX = azToX(ephem.earth.az);
    const earthY = elToY(ephem.earth.el);
    const earthHorizonAtAz = getHorizonAtAzimuth(mask, ephem.earth.az);
    const isEarthBlocked = ephem.earth.el < earthHorizonAtAz + 1.0;

    // Earth Halo
    ctx.beginPath();
    ctx.arc(earthX, earthY, 14, 0, Math.PI * 2);
    ctx.fillStyle = isEarthBlocked ? 'rgba(239, 68, 68, 0.18)' : 'rgba(56, 189, 248, 0.2)';
    ctx.fill();

    // Earth Disk (Radius ~0.95 deg scaled)
    const earthRadiusPx = Math.max(5, (0.95 / elRange) * height);
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthRadiusPx, 0, Math.PI * 2);
    ctx.fillStyle = isEarthBlocked ? '#EF4444' : '#38BDF8';
    ctx.fill();
    ctx.strokeStyle = '#ECEFF4';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Earth Label
    ctx.fillStyle = isEarthBlocked ? '#EF4444' : '#38BDF8';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`EARTH (${isEarthBlocked ? 'BLOCKED' : 'DTE LINK'})`, earthX, earthY - 14);

    // 8. Draw Sun Position (Gold Circle with radiant glow)
    const sunX = azToX(ephem.sun.az);
    const sunY = elToY(ephem.sun.el);
    const sunHorizonAtAz = getHorizonAtAzimuth(mask, ephem.sun.az);
    const deltaEl = ephem.sun.el - sunHorizonAtAz;
    const isSunOccluded = deltaEl <= -0.266;
    const isSunPartial = deltaEl > -0.266 && deltaEl < 0.266;

    // Solar Corona
    const coronaGrad = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 28);
    coronaGrad.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
    coronaGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
    coronaGrad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
    ctx.fillStyle = coronaGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();

    // Solar Disk (0.266° scaled)
    const sunRadiusPx = Math.max(4, (0.266 / elRange) * height);
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadiusPx, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Sun Status Label
    ctx.fillStyle = isSunOccluded ? '#EF4444' : isSunPartial ? '#F59E0B' : '#10B981';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const statusText = isSunOccluded
      ? 'SUN (SHADOW)'
      : isSunPartial
      ? 'SUN (GRAZING/PARTIAL)'
      : 'SUN (FULL DISK)';
    ctx.fillText(statusText, sunX, sunY - 14);
  }, [site, mastHeight, currentTime, ephem, mask]);

  return (
    <div className="relative w-full h-full flex flex-col justify-center p-2 select-none">
      {/* Top Telemetry Overlay */}
      <div className="absolute top-3 left-4 flex items-center gap-4 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-anorthosite)]">
          <Mountain className="w-3.5 h-3.5 text-[var(--text-regolith)]" />
          <span>360° TOPOGRAPHIC HORIZON SILHOUETTE</span>
        </div>
        <div className="text-[11px] font-mono text-[var(--text-regolith)]">
          MAST: <span className="text-[var(--solar-gold)]">{mastHeight}m</span> (Curvature Offset: -{(mastHeight * 0.033).toFixed(2)}°)
        </div>
      </div>

      <div className="absolute top-3 right-4 flex items-center gap-3 text-[10px] font-mono pointer-events-none z-10 bg-[var(--surface-solid)]/80 px-2.5 py-1 rounded border border-[var(--border-glass)]">
        <div className="flex items-center gap-1 text-[var(--solar-gold)]">
          <Sun className="w-3 h-3" />
          <span>SUN PATH</span>
        </div>
        <div className="flex items-center gap-1 text-[var(--terra-cyan)]">
          <Radio className="w-3 h-3" />
          <span>LIBRATION BOX</span>
        </div>
        <div className="flex items-center gap-1 text-[var(--cryo-crimson)]">
          <AlertTriangle className="w-3 h-3" />
          <span>OCCLUSION</span>
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-full max-h-[360px] rounded-lg" />
    </div>
  );
};

