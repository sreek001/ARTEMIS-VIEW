import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Compass, Eye, ShieldAlert, Crosshair } from 'lucide-react';
import type { LandingSite, SelenographicCoord } from '../../types';
import { LANDING_SITES } from '../../data/landingSites';
import { computeEphemeris } from '../../engine';

interface PolarMapProps {
  selectedSite: LandingSite;
  currentTime: Date;
  onSelectSite: (site: LandingSite) => void;
  onSelectCustomCoord?: (coord: SelenographicCoord) => void;
}

export const PolarMap: React.FC<PolarMapProps> = ({
  selectedSite,
  currentTime,
  onSelectSite,
  onSelectCustomCoord,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredSite, setHoveredSite] = useState<LandingSite | null>(null);

  // Compute ephemeris for the selected site at the current playback time
  const ephem = useMemo(() => {
    return computeEphemeris(selectedSite.coord.lat, selectedSite.coord.lon, currentTime);
  }, [selectedSite, currentTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 400;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    // Map radius maps from latitude 80°S down to 90°S (10 degrees span)
    const maxRadius = Math.min(cx, cy) - 28;

    // Helper: convert (lat, lon) to canvas (x, y)
    // LOLA South Pole stereographic style: 90°S at center. 0°E (toward Earth) points UP (-Y).
    const coordToCanvas = (lat: number, lon: number): { x: number; y: number } => {
      // Distance from pole (lat = -90 is 0, lat = -80 is 10)
      const clampedLat = Math.min(-65, Math.max(-90, lat));
      const r = ((clampedLat - (-90)) / 10) * maxRadius;
      const lonRad = ((lon - 90) * Math.PI) / 180; // 0 deg E points up
      return {
        x: cx + r * Math.cos(lonRad),
        y: cy + r * Math.sin(lonRad),
      };
    };

    // 1. Clear background
    ctx.fillStyle = '#07080A';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw radar background texture / concentric rings
    ctx.lineWidth = 1;
    const latitudes = [-88, -86, -84, -82, -80];
    latitudes.forEach((lat) => {
      const r = ((lat - (-90)) / 10) * maxRadius;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(138, 148, 166, 0.12)';
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(138, 148, 166, 0.45)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`${Math.abs(lat)}°S`, cx + 4, cy - r + 10);
    });

    // 3. Radial meridian lines every 45 degrees
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = ((deg - 90) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxRadius * Math.cos(rad), cy + maxRadius * Math.sin(rad));
      ctx.strokeStyle = deg % 90 === 0 ? 'rgba(138, 148, 166, 0.22)' : 'rgba(138, 148, 166, 0.08)';
      ctx.stroke();

      // Degree label on outer rim
      const lx = cx + (maxRadius + 14) * Math.cos(rad);
      const ly = cy + (maxRadius + 14) * Math.sin(rad);
      ctx.fillStyle = 'rgba(138, 148, 166, 0.6)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${deg}°`, lx, ly);
    }

    // 4. Draw Permanently Shadowed Regions (PSR) simulated visual markers
    // Realistic representation: craters near pole like Shackleton, Faustini, Shoemaker
    const psrLocations = [
      { lat: -89.9, lon: 0, r: 8, name: 'Shackleton Floor' },
      { lat: -88.1, lon: 40, r: 12, name: 'Shoemaker PSR' },
      { lat: -87.3, lon: 85, r: 15, name: 'Faustini PSR' },
      { lat: -88.7, lon: 160, r: 10, name: 'Haworth PSR' },
      { lat: -88.5, lon: 290, r: 9, name: 'de Gerlache PSR' },
    ];

    psrLocations.forEach((psr) => {
      const pt = coordToCanvas(psr.lat, psr.lon);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, psr.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.setLineDash([2, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 5. Selected site origin coordinates
    const selectedPt = coordToCanvas(selectedSite.coord.lat, selectedSite.coord.lon);

    // 6. Draw Sun illumination fan and shadow cone vector
    if (ephem) {
      const sunAz = ephem.sun.az;
      // Convert azimuth (0° N/Up, clockwise) to polar canvas angle
      const sunAngleRad = ((sunAz - 90) * Math.PI) / 180;
      const rayLen = maxRadius * 0.75;

      // Real-time Solar Ray vector (Gold)
      const sunTargetX = selectedPt.x + rayLen * Math.cos(sunAngleRad);
      const sunTargetY = selectedPt.y + rayLen * Math.sin(sunAngleRad);

      const sunGrad = ctx.createLinearGradient(selectedPt.x, selectedPt.y, sunTargetX, sunTargetY);
      sunGrad.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
      sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

      ctx.beginPath();
      ctx.moveTo(selectedPt.x, selectedPt.y);
      ctx.lineTo(sunTargetX, sunTargetY);
      ctx.strokeStyle = sunGrad;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Shadow cone (Opposite direction of sun)
      const shadowAngleRad = sunAngleRad + Math.PI;
      const coneWidth = 0.35; // radians
      ctx.beginPath();
      ctx.moveTo(selectedPt.x, selectedPt.y);
      ctx.arc(selectedPt.x, selectedPt.y, rayLen * 0.85, shadowAngleRad - coneWidth / 2, shadowAngleRad + coneWidth / 2);
      ctx.closePath();
      const shadowGrad = ctx.createRadialGradient(
        selectedPt.x, selectedPt.y, 2,
        selectedPt.x, selectedPt.y, rayLen * 0.85
      );
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.fill();

      // Real-time Earth DTE Link vector (Cyan)
      const earthAz = ephem.earth.az;
      const earthAngleRad = ((earthAz - 90) * Math.PI) / 180;
      const earthTargetX = selectedPt.x + rayLen * 0.65 * Math.cos(earthAngleRad);
      const earthTargetY = selectedPt.y + rayLen * 0.65 * Math.sin(earthAngleRad);

      ctx.beginPath();
      ctx.moveTo(selectedPt.x, selectedPt.y);
      ctx.lineTo(earthTargetX, earthTargetY);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 7. Draw all site markers
    LANDING_SITES.forEach((site) => {
      const pt = coordToCanvas(site.coord.lat, site.coord.lon);
      const isSelected = site.id === selectedSite.id;
      const isHovered = hoveredSite?.id === site.id;

      // Glow ring for selected or hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isSelected ? 12 : 9, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)';
        ctx.fill();
      }

      // Marker center dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? '#F59E0B'
        : site.category === 'artemis'
        ? '#38BDF8'
        : '#8A94A6';
      ctx.fill();
      ctx.strokeStyle = '#07080A';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label text
      ctx.fillStyle = isSelected ? '#ECEFF4' : 'rgba(212, 218, 226, 0.75)';
      ctx.font = isSelected
        ? 'bold 10px "Space Grotesk", sans-serif'
        : '9px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(site.shortName, pt.x + 8, pt.y + 3);
    });

    // 8. Center pole reticle (90°S)
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
  }, [selectedSite, currentTime, hoveredSite, ephem]);

  // Click handler to select site or custom coordinate
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const maxRadius = Math.min(cx, cy) - 28;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check hit test against known landing sites
    for (const site of LANDING_SITES) {
      const clampedLat = Math.min(-65, Math.max(-90, site.coord.lat));
      const r = ((clampedLat - (-90)) / 10) * maxRadius;
      const lonRad = ((site.coord.lon - 90) * Math.PI) / 180;
      const sx = cx + r * Math.cos(lonRad);
      const sy = cy + r * Math.sin(lonRad);
      const dist = Math.hypot(clickX - sx, clickY - sy);
      if (dist < 14) {
        onSelectSite(site);
        return;
      }
    }

    // Otherwise compute clicked selenographic coordinate
    const dx = clickX - cx;
    const dy = clickY - cy;
    const distFromCenter = Math.hypot(dx, dy);
    if (distFromCenter <= maxRadius) {
      const clickedLat = -90 + (distFromCenter / maxRadius) * 10;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;
      if (onSelectCustomCoord) {
        onSelectCustomCoord({ lat: Number(clickedLat.toFixed(2)), lon: Number(angle.toFixed(1)) });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const maxRadius = Math.min(cx, cy) - 28;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found: LandingSite | null = null;
    for (const site of LANDING_SITES) {
      const clampedLat = Math.min(-65, Math.max(-90, site.coord.lat));
      const r = ((clampedLat - (-90)) / 10) * maxRadius;
      const lonRad = ((site.coord.lon - 90) * Math.PI) / 180;
      const sx = cx + r * Math.cos(lonRad);
      const sy = cy + r * Math.sin(lonRad);
      if (Math.hypot(mouseX - sx, mouseY - sy) < 14) {
        found = site;
        break;
      }
    }
    setHoveredSite(found);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col items-center justify-center p-2 select-none">
      {/* HUD Telemetry Overlay */}
      <div className="absolute top-3 left-4 flex flex-col gap-1 pointer-events-none z-10">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-anorthosite)]">
          <Compass className="w-3.5 h-3.5 text-[var(--solar-gold)]" />
          <span>RADAR: 80°S → 90°S LOLA GRID</span>
        </div>
        <div className="text-[11px] font-mono text-[var(--text-regolith)]">
          SUN AZ: <span className="text-[var(--solar-gold)]">{ephem.sun.az.toFixed(1)}°</span> | EL: {ephem.sun.el.toFixed(2)}°
        </div>
        <div className="text-[11px] font-mono text-[var(--terra-cyan)]">
          EARTH AZ: {ephem.earth.az.toFixed(1)}° | EL: {ephem.earth.el.toFixed(2)}°
        </div>
      </div>

      <div className="absolute bottom-3 right-4 flex items-center gap-2 text-[10px] font-mono text-[var(--text-anorthosite)] pointer-events-none z-10 bg-[var(--surface-solid)]/80 px-2 py-1 rounded border border-[var(--border-glass)]">
        <ShieldAlert className="w-3 h-3 text-[var(--cryo-crimson)]" />
        <span>RED: PSR CRATER INTERIORS</span>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredSite(null)}
        className="w-full h-full max-h-[360px] cursor-crosshair rounded-lg"
      />
    </div>
  );
};

