import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BatteryCharging,
  ChevronDown,
  CircleDot,
  Crosshair,
  Gauge,
  Globe2,
  Layers3,
  Link2,
  LockKeyhole,
  Map,
  Radio,
  ScanLine,
  Satellite,
  SlidersHorizontal,
  Sun,
  TimerReset,
  TriangleAlert,
  Waves,
  Wifi,
  X
} from 'lucide-react';
import './styles.css';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatClock = (date) =>
  date.toISOString().replace('T', '  ').slice(0, 21) + 'Z';

const useMissionClock = () => {
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return formatClock(clock);
};

function SectionLabel({ children, icon: Icon = Crosshair, tone = 'gold' }) {
  return (
    <div className={`section-label section-label-${tone}`}>
      <Icon size={13} strokeWidth={1.8} />
      <span>{children}</span>
    </div>
  );
}

function TelemetryPill({ label, value, tone = 'default' }) {
  return (
    <div className={`telemetry-pill telemetry-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GlassCard({ children, className = '', glow = false }) {
  return <div className={`glass-card ${glow ? 'glass-card-glow' : ''} ${className}`}>{children}</div>;
}

function HeroRelief({ azimuth, onAzimuthChange }) {
  const canvasRef = useRef(null);
  const azimuthRef = useRef(azimuth);

  useEffect(() => {
    azimuthRef.current = azimuth;
  }, [azimuth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let frame = 0;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const craterPoint = (cx, cy, radius, angle, wobble = 0) => {
      const radial = radius * (1 + Math.sin(angle * 3.1 + wobble) * 0.045 + Math.cos(angle * 7.7) * 0.025);
      return [cx + Math.cos(angle) * radial, cy + Math.sin(angle) * radial * 0.72];
    };

    const drawRelief = () => {
      const currentAzimuth = azimuthRef.current;
      const angle = (currentAzimuth * Math.PI) / 180;
      const cx = width * 0.69;
      const cy = height * 0.57;
      const radius = Math.min(width, height) * 0.42;
      const lightX = Math.cos(angle);
      const lightY = Math.sin(angle);

      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createRadialGradient(cx - width * 0.08, cy - height * 0.14, 10, cx, cy, radius * 1.35);
      gradient.addColorStop(0, '#29313d');
      gradient.addColorStop(0.45, '#131922');
      gradient.addColorStop(1, '#080a0f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(0, height * 0.02);
      ctx.globalAlpha = 0.65;
      for (let ring = 0; ring < 14; ring += 1) {
        const ringRadius = radius * (0.11 + ring * 0.075);
        ctx.beginPath();
        for (let i = 0; i <= 72; i += 1) {
          const point = craterPoint(cx, cy, ringRadius, (i / 72) * Math.PI * 2, ring * 0.6);
          if (i === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        }
        ctx.closePath();
        ctx.strokeStyle = ring % 3 === 0 ? 'rgba(245,158,11,.36)' : 'rgba(148,163,184,.12)';
        ctx.lineWidth = ring % 3 === 0 ? 1.15 : 0.6;
        ctx.stroke();
      }
      ctx.restore();

      const ridgeCount = 26;
      for (let i = 0; i < ridgeCount; i += 1) {
        const ridgeAngle = (i / ridgeCount) * Math.PI * 2 + Math.sin(i * 2.8) * 0.08;
        const inner = craterPoint(cx, cy, radius * (0.2 + (i % 5) * 0.06), ridgeAngle, i);
        const outer = craterPoint(cx, cy, radius * (0.52 + (i % 6) * 0.06), ridgeAngle, i * 0.3);
        const spread = 0.07 + (i % 4) * 0.025;
        const left = craterPoint(cx, cy, radius * (0.38 + (i % 6) * 0.06), ridgeAngle - spread, i);
        const right = craterPoint(cx, cy, radius * (0.38 + (i % 6) * 0.06), ridgeAngle + spread, i);
        const shadowLength = radius * (0.26 + Math.abs(Math.sin(ridgeAngle * 2.7)) * 0.24);

        ctx.beginPath();
        ctx.moveTo(left[0], left[1]);
        ctx.lineTo(outer[0], outer[1]);
        ctx.lineTo(outer[0] + lightX * shadowLength, outer[1] + lightY * shadowLength);
        ctx.lineTo(right[0] + lightX * shadowLength * 0.55, right[1] + lightY * shadowLength * 0.55);
        ctx.lineTo(right[0], right[1]);
        ctx.closePath();
        ctx.fillStyle = `rgba(1, 2, 5, ${0.24 + (i % 5) * 0.055})`;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(inner[0], inner[1]);
        ctx.lineTo(outer[0], outer[1]);
        ctx.lineTo(right[0], right[1]);
        ctx.closePath();
        const rim = ctx.createLinearGradient(inner[0], inner[1], outer[0], outer[1]);
        rim.addColorStop(0, 'rgba(245,158,11,.05)');
        rim.addColorStop(0.65, 'rgba(245,158,11,.16)');
        rim.addColorStop(1, 'rgba(245,158,11,.5)');
        ctx.fillStyle = rim;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.21, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(4, 6, 9, .82)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245,158,11,.48)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      for (let i = 0; i < 52; i += 1) {
        const theta = i * 9.73;
        const dist = radius * (0.12 + ((i * 17) % 100) / 125);
        const x = cx + Math.cos(theta) * dist;
        const y = cy + Math.sin(theta) * dist * 0.72;
        ctx.fillStyle = `rgba(236,239,244,${0.025 + (i % 4) * 0.012})`;
        ctx.fillRect(x, y, 1.2, 1.2);
      }

      ctx.strokeStyle = 'rgba(56,189,248,.13)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 8]);
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.95, cy);
      ctx.lineTo(cx + radius * 0.95, cy);
      ctx.moveTo(cx, cy - radius * 0.7);
      ctx.lineTo(cx, cy + radius * 0.7);
      ctx.stroke();
      ctx.setLineDash([]);

      const sweepX = cx + Math.cos(angle) * radius * 0.88;
      const sweepY = cy + Math.sin(angle) * radius * 0.62;
      ctx.strokeStyle = 'rgba(245,158,11,.62)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(sweepX, sweepY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(5,6,8,.48)';
      ctx.fillRect(0, 0, width, height);
      const horizon = ctx.createLinearGradient(0, 0, 0, height);
      horizon.addColorStop(0, 'rgba(5,6,8,.72)');
      horizon.addColorStop(0.32, 'rgba(5,6,8,0)');
      horizon.addColorStop(0.76, 'rgba(5,6,8,0)');
      horizon.addColorStop(1, 'rgba(5,6,8,.75)');
      ctx.fillStyle = horizon;
      ctx.fillRect(0, 0, width, height);

      frame += 1;
      if (frame % 2 === 0) {
        ctx.fillStyle = 'rgba(245,158,11,.018)';
        ctx.fillRect(0, (frame * 0.33) % height, width, 1);
      }
      raf = window.requestAnimationFrame(drawRelief);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    raf = window.requestAnimationFrame(drawRelief);
    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const handlePointer = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const nextAzimuth = ((event.clientX - rect.left) / rect.width) * 360;
    onAzimuthChange(clamp(nextAzimuth, 0, 360));
  };

  return <canvas ref={canvasRef} className="hero-canvas" onPointerMove={handlePointer} aria-label="Interactive Shackleton Crater relief visualization" />;
}

function Hero({ azimuth, setAzimuth, onLaunch, onExplore }) {
  const missionClock = useMissionClock();
  const telemetry = useMemo(() => {
    const radians = (azimuth * Math.PI) / 180;
    return {
      solar: (1.42 + Math.abs(Math.sin(radians)) * 0.16).toFixed(2),
      slope: (4.4 + Math.abs(Math.cos(radians * 1.7)) * 8.8).toFixed(1),
      illumination: (74 + Math.abs(Math.cos(radians)) * 19.3).toFixed(1)
    };
  }, [azimuth]);

  return (
    <section className="hero-stage" id="top">
      <HeroRelief azimuth={azimuth} onAzimuthChange={setAzimuth} />
      <div className="hero-vignette" />
      <div className="hero-grid-lines" />
      <div className="hero-hud hero-hud-top-left">
        <div className="brand-lockup"><span className="brand-mark">A</span><span>ARTEMIS <em>//</em> VIEW</span></div>
        <div className="hud-rule" />
        <div className="hud-micro">NAIF ID: 301 <span>//</span> FRAME: MOON_ME <span>//</span> LOLA 5MPP DEM</div>
        <div className="hud-micro hud-clock"><TimerReset size={12} /> {missionClock}</div>
      </div>
      <div className="hero-hud hero-hud-top-right">
        <div className="hud-status"><span className="status-dot" /> LIVE TOPOGRAPHIC FEED</div>
        <div className="hero-telemetry-grid">
          <TelemetryPill label="CURSOR AZIMUTH" value={`${azimuth.toFixed(1)}°`} tone="gold" />
          <TelemetryPill label="SOLAR ELEV" value={`+${telemetry.solar}°`} tone="gold" />
          <TelemetryPill label="SURFACE SLOPE" value={`${telemetry.slope}°`} />
          <TelemetryPill label="ILLUMINATION" value={`${telemetry.illumination}%`} tone="cyan" />
        </div>
      </div>
      <div className="hero-copy">
        <SectionLabel icon={Satellite}>2026 NASA SPACE APPS CHALLENGE <span className="label-divider">//</span> MISSION PLANNING ENGINE</SectionLabel>
        <h1>WHERE A <span>500-METER SHIFT</span> MEANS 14 DAYS OF DARKNESS.</h1>
        <p className="hero-deck">Real-time LOLA topographic horizon raycasting, solar grazing simulation, and Direct-to-Earth libration link analysis for Lunar South Pole operations.</p>
        <div className="hero-actions">
          <button className="button button-primary" onClick={onLaunch}><span>LAUNCH MISSION CONSOLE</span><ArrowRight size={17} /></button>
          <button className="button button-ghost" onClick={onExplore}><span>INTERACTIVE PHYSICS BRIEFING</span><ArrowDownRight size={16} /></button>
        </div>
        <div className="hero-footnote"><span className="footnote-line" /> Drag across the terrain to sweep the Sun <span className="mono">1.54°</span> above the horizon.</div>
      </div>
      <div className="hero-footer">
        <div><span className="footer-label">SITE LOCK</span><strong>SHACKLETON RIM</strong><span className="mono">89.9°S / 0.0°E</span></div>
        <div className="hero-scroll-cue"><ChevronDown size={17} /><span>SCROLL TO UNDERSTAND THE RISK</span></div>
        <div className="hero-footer-right"><span className="footer-label">SOLAR VECTOR</span><strong>{String(Math.round(azimuth)).padStart(3, '0')}° / 360°</strong></div>
      </div>
    </section>
  );
}

function TiltVisual() {
  return (
    <div className="tilt-visual visual-frame">
      <div className="visual-frame-header"><span>AXIAL TILT // COMPARISON</span><span className="mono cyan-text">01 / 03</span></div>
      <div className="orbit-comparison">
        <div className="orbit-row apollo-row">
          <div className="orbit-label"><span>APOLLO 11</span><small>0.67° N // EQUATOR</small></div>
          <div className="orbit-track"><span className="orbit-sun sun-high" /><span className="orbit-arc arc-high" /><span className="orbit-moon moon-equator" /></div>
          <div className="orbit-stat"><strong>90°</strong><small>ZENITH</small></div>
        </div>
        <div className="orbit-divider"><span>14-DAY NIGHT</span><i /></div>
        <div className="orbit-row shackleton-row">
          <div className="orbit-label"><span>SHACKLETON RIM</span><small>89.9° S // SOUTH POLE</small></div>
          <div className="orbit-track"><span className="orbit-sun sun-grazing" /><span className="orbit-arc arc-grazing" /><span className="orbit-moon moon-pole" /></div>
          <div className="orbit-stat cyan-text"><strong>1.54°</strong><small>HORIZON</small></div>
        </div>
      </div>
      <div className="visual-caption"><span className="legend-dot gold-dot" /> A lighthouse beam, not a day/night cycle. <span className="mono">354h</span> thermal exposure window.</div>
    </div>
  );
}

function MastVisual({ mastHeight, setMastHeight }) {
  const sunlight = mastHeight >= 8;
  return (
    <div className="mast-visual visual-frame">
      <div className="visual-frame-header"><span>HORIZON OCCLUSION // MALAPERT MASSIF</span><span className="mono gold-text">02 / 03</span></div>
      <div className="mast-scene">
        <div className="scene-grid" />
        <div className="sun-disc"><Sun size={19} /></div>
        <svg viewBox="0 0 600 250" className="ridge-svg" preserveAspectRatio="none">
          <defs><linearGradient id="ridgeFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#202936" /><stop offset="1" stopColor="#080a0e" /></linearGradient></defs>
          <path d="M0 184 L52 155 L92 176 L138 110 L178 137 L229 94 L276 151 L321 121 L361 164 L408 92 L448 126 L491 62 L540 153 L600 122 L600 250 L0 250 Z" fill="url(#ridgeFill)" />
          <path d="M0 184 L52 155 L92 176 L138 110 L178 137 L229 94 L276 151 L321 121 L361 164 L408 92 L448 126 L491 62 L540 153 L600 122" fill="none" stroke="#F59E0B" strokeOpacity=".58" strokeWidth="1.5" />
          <path d={`M491 ${62 - Math.max(0, mastHeight - 2) * 7} L491 ${62 - Math.max(0, mastHeight - 2) * 7 + 50}`} fill="none" stroke={sunlight ? '#10B981' : '#EF4444'} strokeWidth="2" />
          <circle cx="491" cy={62 - Math.max(0, mastHeight - 2) * 7} r="5" fill={sunlight ? '#10B981' : '#EF4444'} />
        </svg>
        <div className="sun-ray" style={{ transform: `rotate(${sunlight ? 13 : 27}deg)`, opacity: sunlight ? 0.9 : 0.35 }} />
        <div className="lander-icon"><span /> <small>LANDER</small></div>
        <div className={`mast-readout ${sunlight ? 'mast-clear' : 'mast-shadow'}`}><span className="status-dot" /> {sunlight ? 'ARRAY CLEARS RIDGE' : 'ARRAY IN SHADOW'}</div>
      </div>
      <div className="mast-controls"><span className="control-label">SOLAR MAST HEIGHT</span><span className="mast-value mono">{mastHeight.toFixed(1)} m</span><input type="range" min="1" max="15" step="0.5" value={mastHeight} onChange={(event) => setMastHeight(Number(event.target.value))} aria-label="Solar mast height" /></div>
    </div>
  );
}

function LibrationVisual() {
  return (
    <div className="libration-visual visual-frame">
      <div className="visual-frame-header"><span>OPTICAL LIBRATION // DTE</span><span className="mono cyan-text">03 / 03</span></div>
      <div className="sky-map">
        <div className="sky-axis axis-x" /><div className="sky-axis axis-y" />
        <span className="axis-tag axis-tag-top">+6.7° LAT</span><span className="axis-tag axis-tag-right">+7.9° LON</span>
        <div className="figure-eight"><span className="earth-dot"><Globe2 size={17} /></span></div>
        <div className="ridge-occluder" />
        <div className="earth-label">EARTH <span className="mono">27.3 DAY</span></div>
        <div className="sky-coordinate mono">RA 18h 09m 27s<br />DEC −28° 37′ 47″</div>
        <div className="link-alert"><TriangleAlert size={13} /> DTE COMM LINK LOST — RELAY REQUIRED</div>
      </div>
      <div className="visual-caption"><span className="legend-dot cyan-dot" /> Earthset is a topographic event. The sky wobbles; the ridge does not.</div>
    </div>
  );
}

function BeatVisual({ activeBeat, mastHeight, setMastHeight }) {
  return <div className="briefing-visual-sticky">{activeBeat === 0 ? <TiltVisual /> : activeBeat === 1 ? <MastVisual mastHeight={mastHeight} setMastHeight={setMastHeight} /> : <LibrationVisual />}</div>;
}

function BeatCard({ index, eyebrow, title, children, active, onClick }) {
  return (
    <article className={`beat-card ${active ? 'beat-active' : ''}`} onClick={onClick}>
      <div className="beat-index mono">0{index + 1}</div>
      <div className="beat-content"><div className="beat-eyebrow">{eyebrow}</div><h3>{title}</h3>{children}</div>
      <ArrowRight className="beat-arrow" size={17} />
    </article>
  );
}

function PhysicsBriefing({ onLaunch }) {
  const [activeBeat, setActiveBeat] = useState(0);
  const [mastHeight, setMastHeight] = useState(4.5);
  const [slip, setSlip] = useState(0);
  const beatRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.dataset.beat);
          setActiveBeat(index);
        }
      });
    }, { rootMargin: '-35% 0px -48% 0px', threshold: 0 });
    beatRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);

  const sites = useMemo(() => [
    { name: 'SHACKLETON RIM', code: 'S-RIM / 01', value: Math.round(91 - slip * 1.6333), delta: `−${(slip * 1.63).toFixed(1)}%`, tone: 'gold', status: slip > 18 ? 'NO-GO' : 'GO', battery: Math.max(14, Math.round(82 - slip * 2.03)), link: '96%' },
    { name: 'CONNECTING RIDGE', code: 'C-RDG / 02', value: Math.round(86 - slip * 0.22), delta: `−${(slip * 0.22).toFixed(1)}%`, tone: 'emerald', status: 'GO', battery: Math.max(66, Math.round(91 - slip * 0.25)), link: '82%' },
    { name: 'MALAPERT MASSIF', code: 'M-MAS / 03', value: Math.round(63 - slip * 0.6), delta: `−${(slip * 0.6).toFixed(1)}%`, tone: 'cyan', status: slip > 12 ? 'WATCH' : 'GO', battery: Math.max(32, Math.round(70 - slip * 0.9)), link: '61%' }
  ], [slip]);

  return (
    <>
      <section className="briefing-section" id="physics">
        <div className="briefing-intro">
          <SectionLabel icon={Waves}>THE SOUTH POLE PROBLEM</SectionLabel>
          <h2>THE SUN DOESN’T RISE.<br /><span>IT GRAZES.</span></h2>
          <p>Three constraints turn a landing ellipse into an operations problem: a 1.54° axial tilt, a four-kilometer horizon wall, and an Earth that only appears to wobble into view.</p>
        </div>
        <div className="briefing-grid">
          <div className="beat-rail">
            <div className="rail-line" />
            <div className="beat-sticky-label">SCROLL-DRIVEN PHYSICS BRIEFING <span className="mono">{String(activeBeat + 1).padStart(2, '0')} / 03</span></div>
            <div className="beat-stack">
              <div data-beat="0" ref={(el) => { beatRefs.current[0] = el; }}>
                <BeatCard index={0} eyebrow="THE 1.54° AXIAL TILT" title="A lighthouse beam, not a sunrise." active={activeBeat === 0} onClick={() => setActiveBeat(0)}>
                  <p>At the equator, Apollo 11 saw the Sun climb to zenith before a 354-hour night. At Shackleton’s rim, the Sun circles the horizon like a searchlight—power and heat live on a knife edge.</p>
                  <div className="beat-data-row"><span><strong>90°</strong><small>APOLLO ZENITH</small></span><span className="data-arrow">→</span><span className="gold-text"><strong>1.54°</strong><small>RIM ELEVATION</small></span></div>
                </BeatCard>
              </div>
              <div data-beat="1" ref={(el) => { beatRefs.current[1] = el; }}>
                <BeatCard index={1} eyebrow="THE 4 KM WALL" title="Your solar array can be in sunlight. Your lander cannot." active={activeBeat === 1} onClick={() => setActiveBeat(1)}>
                  <p>Topographic horizon raycasting exposes the gap between a good coordinate and a survivable one. Raise the mast until the array clears Malapert Massif.</p>
                  <div className="inline-control"><SlidersHorizontal size={14} /><span>MAST HEIGHT</span><input type="range" min="1" max="15" step="0.5" value={mastHeight} onChange={(event) => setMastHeight(Number(event.target.value))} /><strong className="mono">{mastHeight.toFixed(1)}m</strong></div>
                </BeatCard>
              </div>
              <div data-beat="2" ref={(el) => { beatRefs.current[2] = el; }}>
                <BeatCard index={2} eyebrow="THE WOBBLING EARTH" title="The link budget has its own horizon." active={activeBeat === 2} onClick={() => setActiveBeat(2)}>
                  <p>Optical libration drags Earth through a ±6.7° latitude and ±7.9° longitude figure-eight. When the ridge clips the disc, direct-to-Earth becomes a relay decision.</p>
                  <div className="beat-data-row"><span className="cyan-text"><strong>27.3d</strong><small>LIBRATION CYCLE</small></span><span className="data-arrow">→</span><span className="danger-text"><strong>RELAY</strong><small>WHEN EARTH SETS</small></span></div>
                </BeatCard>
              </div>
            </div>
          </div>
          <div className="briefing-visual"><BeatVisual activeBeat={activeBeat} mastHeight={mastHeight} setMastHeight={setMastHeight} /></div>
        </div>
      </section>

      <section className="shock-section" id="shock-test">
        <div className="shock-topline"><SectionLabel icon={Activity} tone="cyan">LIVE SIMULATION <span className="label-divider">//</span> DELAY SHOCK-TEST</SectionLabel><div className="shock-topline-note"><span className="status-dot status-emerald" /> DATA STREAM NOMINAL</div></div>
        <div className="shock-card glass-card-glow">
          <div className="shock-copy"><div className="shock-eyebrow">MISSION CONSEQUENCE PREVIEW</div><h2>THE COST OF A <span>14-DAY LAUNCH SLIP.</span></h2><p>Drag the date offset. Watch the power curve collapse in the shadows—and see which ridge keeps the lights on.</p><div className="shock-summary"><div><span>OFFSET</span><strong className="mono">+{String(slip).padStart(2, '0')} DAYS</strong></div><div><span>WINDOW</span><strong className={slip > 18 ? 'danger-text' : 'emerald-text'}>{slip > 18 ? 'NO-GO' : 'MARGINAL GO'}</strong></div></div></div>
          <div className="shock-control"><div className="slider-header"><span>LAUNCH DATE OFFSET</span><span className="mono">DAY 0 <i /> +30 DAYS</span></div><input className="big-range" type="range" min="0" max="30" step="1" value={slip} onChange={(event) => setSlip(Number(event.target.value))} /><div className="range-ticks"><span>0</span><span>+10</span><span>+20</span><span>+30</span></div><div className="site-strip-list">{sites.map((site) => <div className="site-strip" key={site.code}><div className="site-strip-name"><span className={`strip-dot ${site.tone}`} /><strong>{site.name}</strong><small>{site.code}</small></div><div className="strip-bar"><span style={{ width: `${site.value}%` }} className={`strip-fill ${site.tone}`} /><span className="strip-marker" style={{ left: `${site.value}%` }} /></div><div className={`site-score ${site.status === 'NO-GO' ? 'danger-text' : site.status === 'WATCH' ? 'gold-text' : 'emerald-text'}`}><strong>{site.value}%</strong><small>{site.status}</small></div></div>)}</div></div>
        </div>
        <div className="shock-footer"><div className="shock-metric"><BatteryCharging size={15} /><span>BATTERY DEPLETION</span><strong className="mono">{sites[0].battery}% <small>SHACKLETON</small></strong></div><div className="shock-metric"><Radio size={15} /><span>LINK MARGIN</span><strong className="mono">{sites[0].link} <small>DTE</small></strong></div><button className="button button-primary" onClick={onLaunch}><span>ENTER FULL MISSION PLANNER</span><ArrowRight size={17} /></button></div>
      </section>
    </>
  );
}

function HorizonPath({ offset = 0 }) {
  const points = Array.from({ length: 18 }, (_, index) => {
    const x = (index / 17) * 600;
    const y = 116 + Math.sin(index * 0.78 + offset) * 18 + Math.sin(index * 1.91) * 9 + (index % 4 === 0 ? 14 : 0);
    return `${x},${y}`;
  });
  return `M0 180 L${points.join(' L')} L600 180 Z`;
}

function ConsoleMap() {
  return (
    <div className="map-panel panel-card">
      <div className="panel-head"><div><SectionLabel icon={Map}>SOUTH POLE LOLA MAP</SectionLabel><h3>SHACKLETON RIM / <span>SECTOR 04</span></h3></div><div className="panel-actions"><button className="icon-button"><Layers3 size={14} /></button><button className="icon-button"><ScanLine size={14} /></button></div></div>
      <div className="map-canvas"><div className="map-polar-grid" /><div className="map-crater crater-one" /><div className="map-crater crater-two" /><div className="map-crater crater-three" /><div className="map-track map-track-one" /><div className="map-track map-track-two" /><div className="map-site site-alpha"><span /><small>SR-04</small></div><div className="map-site site-beta"><span /><small>CR-02</small></div><div className="map-site site-gamma"><span /><small>MM-01</small></div><div className="map-axis-label map-north">N 90°</div><div className="map-axis-label map-east">E 000°</div><div className="map-legend"><span><i className="legend-sun" /> illumination</span><span><i className="legend-path" /> traverse</span><span><i className="legend-site" /> candidate</span></div></div>
      <div className="map-foot"><span><strong className="gold-text">89.9°S</strong> <small>LATITUDE</small></span><span><strong>1.54°</strong> <small>SOLAR ELEV</small></span><span><strong className="cyan-text">96.2%</strong> <small>MAP CONFIDENCE</small></span><span className="mono map-updated">UPDATED 00:00:14 AGO</span></div>
    </div>
  );
}

function ConsoleHorizon() {
  const [horizon, setHorizon] = useState(56);
  return (
    <div className="horizon-panel panel-card">
      <div className="panel-head"><div><SectionLabel icon={Waves} tone="gold">360° HORIZON PANORAMA</SectionLabel><h3>RIMLINE / <span>LIVE OCCLUSION</span></h3></div><div className="horizon-readout mono">AZ {horizon * 3.6}°</div></div>
      <div className="horizon-canvas"><svg viewBox="0 0 600 190" preserveAspectRatio="none"><defs><linearGradient id="horizonSky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#0f2733" /><stop offset=".58" stopColor="#0b1017" /><stop offset="1" stopColor="#050608" /></linearGradient></defs><rect width="600" height="190" fill="url(#horizonSky)" /><path d={HorizonPath(horizon / 7)} fill="#050608" stroke="#F59E0B" strokeOpacity=".72" strokeWidth="1.5" /><path d={HorizonPath(horizon / 14 + 1.6)} fill="none" stroke="#38BDF8" strokeOpacity=".42" strokeDasharray="4 8" /><circle cx={clamp(horizon * 5.8, 40, 560)} cy="60" r="11" fill="#F59E0B" fillOpacity=".88" /><line x1={clamp(horizon * 5.8, 40, 560)} y1="60" x2={clamp(horizon * 5.8, 40, 560)} y2="145" stroke="#F59E0B" strokeOpacity=".32" strokeDasharray="2 7" /></svg><div className="horizon-overlay"><span className="mono">ELEV +1.54°</span><span className="mono">F⊙ 0.82</span><span className="horizon-alert"><span className="status-dot status-emerald" /> POWER WINDOW OPEN</span></div></div>
      <div className="horizon-controls"><span>SCRUB AZIMUTH</span><input type="range" min="0" max="100" value={horizon} onChange={(event) => setHorizon(Number(event.target.value))} /><span className="mono">{Math.round(horizon * 3.6)}°</span></div>
    </div>
  );
}

function SiteMatrix() {
  const rows = [
    { site: 'SHACKLETON RIM', code: 'SR-04', illumination: '91%', power: 'A', link: '96%', horizon: 'CLEAR', status: 'GO', tone: 'emerald-text' },
    { site: 'CONNECTING RIDGE', code: 'CR-02', illumination: '86%', power: 'B+', link: '82%', horizon: 'CLEAR', status: 'GO', tone: 'emerald-text' },
    { site: 'MALAPERT MASSIF', code: 'MM-01', illumination: '63%', power: 'C', link: '61%', horizon: 'MASKED', status: 'WATCH', tone: 'gold-text' }
  ];
  return (
    <div className="matrix-panel panel-card"><div className="panel-head"><div><SectionLabel icon={Gauge} tone="cyan">SITE COMPARISON MATRIX</SectionLabel><h3>CANDIDATE <span>VIABILITY</span></h3></div><div className="matrix-filter mono">FILTER: ALL</div></div><div className="matrix-table"><div className="matrix-row matrix-header"><span>SITE</span><span>ILLUM.</span><span>POWER</span><span>DTE LINK</span><span>HORIZON</span><span>STATE</span></div>{rows.map((row) => <div className="matrix-row" key={row.code}><span><strong>{row.site}</strong><small>{row.code}</small></span><span className="mono gold-text">{row.illumination}</span><span className="matrix-letter">{row.power}</span><span className="mono cyan-text">{row.link}</span><span className={row.horizon === 'CLEAR' ? 'emerald-text' : 'gold-text'}>{row.horizon}</span><span className={row.tone}>{row.status}</span></div>)}</div><div className="matrix-foot"><span><span className="status-dot status-emerald" /> 2 GO WINDOWS</span><span><span className="status-dot status-gold" /> 1 WATCH WINDOW</span><span className="mono">LAST RAYCAST 00:00:02</span></div></div>
  );
}

function TimelinePanel() {
  const [time, setTime] = useState(37);
  const tasks = [
    { label: 'DESCENT / ALT HOLD', start: 0, width: 23, tone: 'gold' },
    { label: 'HORIZON CHECK', start: 19, width: 17, tone: 'cyan' },
    { label: 'SOLAR MAST DEPLOY', start: 34, width: 26, tone: 'emerald' },
    { label: 'DTE LINK HANDSHAKE', start: 63, width: 18, tone: 'cyan' },
    { label: 'ROVER TRAVERSE', start: 77, width: 22, tone: 'gold' }
  ];
  return (
    <div className="timeline-panel panel-card"><div className="panel-head"><div><SectionLabel icon={TimerReset} tone="gold">MISSION TIMELINE / T+0:00</SectionLabel><h3>SCRUB TO <span>SHADOWFALL</span></h3></div><div className="timeline-clock mono">T+{String(Math.floor(time / 6)).padStart(2, '0')}:{String((time * 10) % 60).padStart(2, '0')}</div></div><div className="timeline-canvas"><div className="timeline-grid-lines"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span></div><div className="timeline-tasks">{tasks.map((task) => <div className="timeline-task" key={task.label}><span>{task.label}</span><div className="task-track"><i className={`task-bar ${task.tone}`} style={{ left: `${task.start}%`, width: `${task.width}%` }} /></div></div>)}</div><div className="timeline-cursor" style={{ left: `${time}%` }}><span>NOW</span></div></div><div className="timeline-controls"><span>TIME SCRUB</span><input type="range" min="0" max="100" value={time} onChange={(event) => setTime(Number(event.target.value))} /><span className={`mono ${time > 75 ? 'danger-text' : 'gold-text'}`}>{time > 75 ? 'SHADOWFALL RISK' : 'POWER WINDOW OPEN'}</span></div></div>
  );
}

function MissionConsole({ onExit }) {
  const [mode, setMode] = useState('planner');
  return (
    <div className="console-shell"><div className="console-topbar"><div className="brand-lockup"><span className="brand-mark">A</span><span>ARTEMIS <em>//</em> VIEW</span></div><div className="console-context"><span className="status-dot status-emerald" /> MISSION CONSOLE <span className="context-divider">/</span> <span className="mono">OPS WINDOW 04</span></div><div className="console-actions"><div className="mode-switch"><button className={mode === 'planner' ? 'active' : ''} onClick={() => setMode('planner')}>PLANNER</button><button className={mode === 'explorer' ? 'active' : ''} onClick={() => setMode('explorer')}>EXPLORER</button></div><button className="exit-button" onClick={onExit}><X size={14} /> EXIT</button></div></div><div className="console-titlebar"><div><span className="console-eyebrow">ARTEMIS-VIEW / SOUTH POLE OPERATIONS</span><h1>{mode === 'planner' ? 'MISSION CONTROL DASHBOARD' : 'TERRAIN EXPLORER'}</h1></div><div className="console-status-cluster"><span><span className="status-dot status-emerald" /> TELEMETRY NOMINAL</span><span className="mono">UTC 2026-11-13 19:05:51</span></div></div><div className={`console-grid ${mode === 'explorer' ? 'explorer-mode' : ''}`}><ConsoleMap /><ConsoleHorizon /><SiteMatrix /><TimelinePanel /></div><div className="console-bottom"><span><LockKeyhole size={13} /> SESSION LOCKED TO NAIF ID 301</span><span className="mono">DATA SOURCE / LOLA 5MPP / ONBOARD CACHE</span><span><Wifi size={13} /> DTE LINK MARGIN <b>+12.4 dB</b></span></div></div>
  );
}

function App() {
  const [azimuth, setAzimuth] = useState(224.6);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const physicsRef = useRef(null);

  const launchConsole = () => {
    setTransitioning(true);
    window.setTimeout(() => {
      setConsoleOpen(true);
      setTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 820);
  };

  const exitConsole = () => {
    setConsoleOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
  };

  const explorePhysics = () => physicsRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="app-root">
      <div className="noise-overlay" />
      {consoleOpen ? <MissionConsole onExit={exitConsole} /> : <main><Hero azimuth={azimuth} setAzimuth={setAzimuth} onLaunch={launchConsole} onExplore={explorePhysics} /><div ref={physicsRef}><PhysicsBriefing onLaunch={launchConsole} /></div><footer className="site-footer"><div className="brand-lockup"><span className="brand-mark">A</span><span>ARTEMIS <em>//</em> VIEW</span></div><span className="mono">BUILT FOR THE DARK SIDE OF THE BRIEFING</span><span className="mono">NASA SPACE APPS 2026</span></footer></main>}
      {transitioning && <div className="lockin-overlay"><div className="lockin-frame"><div className="lockin-crosshair"><span /><i /></div><div className="lockin-label mono">HUD LOCK-IN / RECONFIGURING MISSION CONSOLE</div><div className="lockin-progress"><span /></div><div className="lockin-code mono">LOLA TERRAIN CACHE → 4-PANEL WORKSPACE</div></div></div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

