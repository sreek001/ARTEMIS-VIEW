import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { AppState, AudienceMode, LandingSite, MissionConfig, PanelOrientation } from '../types';
import { LANDING_SITES, DEFAULT_SITE } from '../data/landingSites';

const DEFAULT_STATE: AppState = {
  mode: 'planner' as AudienceMode,
  selectedSiteA: DEFAULT_SITE,
  selectedSiteB: null,
  missionDate: new Date('2027-09-15T00:00:00Z'),
  launchDelay: 0,
  mastHeight: 2,
  panelOrientation: 'vertical' as PanelOrientation,
  durationDays: 30,
  isPlaying: false,
  playbackSpeed: 1,
  currentTime: new Date('2027-09-15T00:00:00Z'),
  compareMode: false,
};

export function useMissionState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const animRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const setSite = useCallback((site: LandingSite) => {
    setState(s => ({
      ...s,
      selectedSiteA: site,
      currentTime: new Date(s.missionDate.getTime() + s.launchDelay * 86400000),
    }));
  }, []);

  const setSiteB = useCallback((site: LandingSite | null) => {
    setState(s => ({ ...s, selectedSiteB: site }));
  }, []);

  const setDate = useCallback((date: Date) => {
    setState(s => ({
      ...s,
      missionDate: date,
      currentTime: new Date(date.getTime() + s.launchDelay * 86400000),
    }));
  }, []);

  const setMastHeight = useCallback((h: number) => {
    setState(s => ({ ...s, mastHeight: Math.max(0, Math.min(20, h)) }));
  }, []);

  const setDuration = useCallback((d: number) => {
    setState(s => ({ ...s, durationDays: d }));
  }, []);

  const setLaunchDelay = useCallback((d: number) => {
    setState(s => ({
      ...s,
      launchDelay: d,
      currentTime: new Date(s.missionDate.getTime() + d * 86400000),
    }));
  }, []);

  const toggleCompare = useCallback(() => {
    setState(s => {
      const nextCompare = !s.compareMode;
      return {
        ...s,
        compareMode: nextCompare,
        selectedSiteB: nextCompare
          ? LANDING_SITES.find(site => site.id !== s.selectedSiteA.id) ?? null
          : null,
      };
    });
  }, []);

  const setMode = useCallback((mode: AudienceMode) => {
    setState(s => ({ ...s, mode }));
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setState(s => ({ ...s, playbackSpeed: speed }));
  }, []);

  const setCurrentTime = useCallback((t: Date) => {
    setState(s => {
      const effectiveStart = new Date(s.missionDate.getTime() + s.launchDelay * 86400000);
      const endMs = effectiveStart.getTime() + s.durationDays * 86400000;
      const clamped = new Date(Math.max(effectiveStart.getTime(), Math.min(endMs, t.getTime())));
      return { ...s, currentTime: clamped };
    });
  }, []);

  const setPanelOrientation = useCallback((o: PanelOrientation) => {
    setState(s => ({ ...s, panelOrientation: o }));
  }, []);

  const setPlaying = useCallback((playing: boolean) => {
    setState(s => ({ ...s, isPlaying: playing }));
  }, []);

  const stepForward = useCallback(() => {
    setState(s => {
      const effectiveStart = new Date(s.missionDate.getTime() + s.launchDelay * 86400000);
      const endMs = effectiveStart.getTime() + s.durationDays * 86400000;
      const next = new Date(s.currentTime.getTime() + 2 * 3600000);
      return { ...s, currentTime: new Date(Math.min(next.getTime(), endMs)) };
    });
  }, []);

  const stepBackward = useCallback(() => {
    setState(s => {
      const effectiveStart = new Date(s.missionDate.getTime() + s.launchDelay * 86400000);
      const prev = new Date(s.currentTime.getTime() - 2 * 3600000);
      return { ...s, currentTime: new Date(Math.max(prev.getTime(), effectiveStart.getTime())) };
    });
  }, []);

  const jumpToStart = useCallback(() => {
    setState(s => ({
      ...s,
      currentTime: new Date(s.missionDate.getTime() + s.launchDelay * 86400000),
    }));
  }, []);

  const jumpToEnd = useCallback(() => {
    setState(s => {
      const effectiveStart = new Date(s.missionDate.getTime() + s.launchDelay * 86400000);
      return { ...s, currentTime: new Date(effectiveStart.getTime() + s.durationDays * 86400000) };
    });
  }, []);

  // Animation loop for playback
  useEffect(() => {
    if (!state.isPlaying) {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000; // seconds elapsed
      lastTickRef.current = now;

      setState(s => {
        if (!s.isPlaying) return s;
        const effectiveStart = new Date(s.missionDate.getTime() + s.launchDelay * 86400000);
        const endMs = effectiveStart.getTime() + s.durationDays * 86400000;
        const advanceMs = dt * s.playbackSpeed * 3600000; // speed is hours/sec
        const nextMs = s.currentTime.getTime() + advanceMs;
        if (nextMs >= endMs) {
          return { ...s, currentTime: new Date(endMs), isPlaying: false };
        }
        return { ...s, currentTime: new Date(nextMs) };
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [state.isPlaying, state.playbackSpeed]);

  const effectiveStartDate = useMemo(
    () => new Date(state.missionDate.getTime() + state.launchDelay * 86400000),
    [state.missionDate, state.launchDelay]
  );

  const missionConfigA = useMemo<MissionConfig>(() => ({
    site: state.selectedSiteA,
    startDate: effectiveStartDate,
    durationDays: state.durationDays,
    mastHeight: state.mastHeight,
    panelArea: 10,
    panelEfficiency: 0.30,
    panelOrientation: state.panelOrientation,
    batteryCapacityHours: 120,
    multipathMargin: 1.0,
    timeStepHours: 2,
  }), [state.selectedSiteA, effectiveStartDate, state.durationDays, state.mastHeight, state.panelOrientation]);

  const missionConfigB = useMemo<MissionConfig | null>(() => {
    if (!state.selectedSiteB) return null;
    return {
      site: state.selectedSiteB,
      startDate: effectiveStartDate,
      durationDays: state.durationDays,
      mastHeight: state.mastHeight,
      panelArea: 10,
      panelEfficiency: 0.30,
      panelOrientation: state.panelOrientation,
      batteryCapacityHours: 120,
      multipathMargin: 1.0,
      timeStepHours: 2,
    };
  }, [state.selectedSiteB, effectiveStartDate, state.durationDays, state.mastHeight, state.panelOrientation]);

  return {
    state,
    effectiveStartDate,
    missionConfigA,
    missionConfigB,
    setSite,
    setSiteB,
    setDate,
    setMastHeight,
    setDuration,
    setLaunchDelay,
    toggleCompare,
    setMode,
    setPlaybackSpeed,
    setCurrentTime,
    setPanelOrientation,
    setPlaying,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
  };
}
