import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  CheckCircle2,
  Flame,
  MessageCircle,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import mokusoImg from '../assets/images/mokuso_seiza_posture_1794941031347.jpg';
import kihonImg from '../assets/images/kihon_front_punch_1794941030958.jpg';
import kataImg from '../assets/images/kata_gedan_barai_1794941032322.jpg';

interface PracticePhase {
  id: 'mokuso' | 'kihon' | 'kata';
  stepNumber: string;
  title: string;
  japaneseTitle: string;
  durationSeconds: number;
  durationLabel: string;
  imageUrl: string;
  imageAlt: string;
  postureTitle: string;
  cueBreakpoints: [number, number]; // elapsed seconds where cue 0 -> 1 and 1 -> 2 activate
  cues: string[];
}

const PRACTICE_PHASES: PracticePhase[] = [
  {
    id: 'mokuso',
    stepNumber: '01',
    title: 'Mindful Breathing',
    japaneseTitle: 'Mokuso · Seiza Posture',
    durationSeconds: 60,
    durationLabel: '1 Min',
    imageUrl: mokusoImg,
    imageAlt: 'Student kneeling upright in calm Seiza meditation posture for Mokuso',
    postureTitle: 'Kneel Upright in Seiza',
    cueBreakpoints: [12, 48],
    cues: [
      'Sit gently on heels with back straight and hands resting calmly on thighs.',
      'Close eyes softly. Inhale slowly for 4 seconds, hold gently for 4 seconds, exhale calmly for 4 seconds.',
      'Quiet the mind and prepare focus before standing up.'
    ]
  },
  {
    id: 'kihon',
    stepNumber: '02',
    title: 'Stances & Punches',
    japaneseTitle: 'Kihon · Zenkutsu-dachi & Tsuki',
    durationSeconds: 120,
    durationLabel: '2 Min',
    imageUrl: kihonImg,
    imageAlt: 'Karate student demonstrating front stance Zenkutsu-dachi with straight Chudan Tsuki punch',
    postureTitle: 'Front Stance + Middle Punch',
    cueBreakpoints: [35, 85],
    cues: [
      'Bend the front knee deep over the toes while keeping the back leg locked straight.',
      'Punch straight forward from the hip at chest level with crisp, steady control.',
      'Hold good posture first — clean form is better than rushing.'
    ]
  },
  {
    id: 'kata',
    stepNumber: '03',
    title: 'Kata Focus & Bow',
    japaneseTitle: 'Kata · Gedan Barai & Rei',
    durationSeconds: 120,
    durationLabel: '2 Min',
    imageUrl: kataImg,
    imageAlt: 'Karate student demonstrating Gedan Barai downward block stance for Kata practice',
    postureTitle: 'Sharp Eyes & Controlled Kata',
    cueBreakpoints: [35, 95],
    cues: [
      'Begin cleanly with Gedan Barai (downward block) and look toward each turn first.',
      'Perform your current belt Kata once slowly, then once with confident dojo spirit.',
      'Finish standing tall and end with a respectful Bow (Rei) at the final bell.'
    ]
  }
];

interface StreakData {
  streak: number;
  lastCompletedDate: string;
  totalSessions: number;
}

const STORAGE_KEY = 'lkcp_home_practice_v1';

function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterdayDateKey(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readLocalStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { streak: 0, lastCompletedDate: '', totalSessions: 0 };
    const parsed = JSON.parse(raw) as Partial<StreakData>;
    return {
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
      lastCompletedDate: typeof parsed.lastCompletedDate === 'string' ? parsed.lastCompletedDate : '',
      totalSessions: typeof parsed.totalSessions === 'number' ? parsed.totalSessions : 0
    };
  } catch {
    return { streak: 0, lastCompletedDate: '', totalSessions: 0 };
  }
}

export default function MindfulPractice() {
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(PRACTICE_PHASES[0].durationSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [streakData, setStreakData] = useState<StreakData>(() => readLocalStreak());
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastCueRef = useRef<number>(0);
  const lastBreathBucketRef = useRef<number>(-1);

  const currentPhase = PRACTICE_PHASES[phaseIndex];

  const getAudioCtx = useCallback((): AudioContext | null => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const playTone = useCallback(
    (freq: number, startOffset: number, duration: number, peakGain: number, endFreq?: number) => {
      if (!soundEnabled) return;
      const ctx = getAudioCtx();
      if (!ctx) return;

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = ctx.currentTime + startOffset;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        if (endFreq) {
          osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration * 0.7);
        }
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.05);
      } catch {
        // Ignore audio restrictions silently
      }
    },
    [soundEnabled, getAudioCtx]
  );

  const playDojoBell = useCallback(
    (kind: 'transition' | 'finish' | 'cue' | 'inhale' | 'hold' | 'exhale') => {
      if (!soundEnabled) return;
      if (kind === 'transition') {
        playTone(528, 0, 1.5, 0.16);
        playTone(1056, 0, 0.9, 0.05);
      } else if (kind === 'finish') {
        playTone(528, 0, 1.6, 0.18);
        playTone(660, 0.32, 1.6, 0.15);
        playTone(792, 0.64, 2.1, 0.14);
      } else if (kind === 'cue') {
        playTone(660, 0, 0.55, 0.07);
      } else if (kind === 'inhale') {
        playTone(396, 0, 0.9, 0.055, 528);
      } else if (kind === 'hold') {
        playTone(528, 0, 0.75, 0.045);
      } else if (kind === 'exhale') {
        playTone(432, 0, 1.0, 0.055, 330);
      }
    },
    [soundEnabled, playTone]
  );

  const recordCompletion = useCallback(() => {
    const today = getTodayDateKey();
    const yesterday = getYesterdayDateKey();

    setStreakData((prev) => {
      let nextStreak = prev.streak;
      if (prev.lastCompletedDate === today) {
        nextStreak = Math.max(1, prev.streak);
      } else if (prev.lastCompletedDate === yesterday) {
        nextStreak = prev.streak + 1;
      } else {
        nextStreak = 1;
      }

      const updated: StreakData = {
        streak: nextStreak,
        lastCompletedDate: today,
        totalSessions: prev.totalSessions + 1
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore private browsing storage error
      }
      return updated;
    });
  }, []);

  const handleAdvancePhase = useCallback(() => {
    lastCueRef.current = 0;
    lastBreathBucketRef.current = -1;
    if (phaseIndex < PRACTICE_PHASES.length - 1) {
      const nextIdx = phaseIndex + 1;
      setPhaseIndex(nextIdx);
      setSecondsLeft(PRACTICE_PHASES[nextIdx].durationSeconds);
      playDojoBell('transition');
    } else {
      setIsRunning(false);
      setIsCompleted(true);
      setSecondsLeft(0);
      playDojoBell('finish');
      recordCompletion();
    }
  }, [phaseIndex, playDojoBell, recordCompletion]);

  useEffect(() => {
    if (!isRunning || isCompleted) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          handleAdvancePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, isCompleted, handleAdvancePhase]);

  const elapsedInPhase = Math.max(0, currentPhase.durationSeconds - secondsLeft);
  const [bp1, bp2] = currentPhase.cueBreakpoints;
  const activeCueIndex = elapsedInPhase < bp1 ? 0 : elapsedInPhase < bp2 ? 1 : 2;

  // Breathing cadence math (4s Inhale -> 4s Hold -> 4s Exhale)
  const breathCycleSec = elapsedInPhase % 12;
  const breathStage: 'inhale' | 'hold' | 'exhale' =
    breathCycleSec < 4 ? 'inhale' : breathCycleSec < 8 ? 'hold' : 'exhale';
  const breathLabel =
    breathStage === 'inhale'
      ? 'Inhale Slowly'
      : breathStage === 'hold'
      ? 'Hold Gently'
      : 'Exhale Calmly';
  const breathCount = 4 - (breathCycleSec % 4); // 4, 3, 2, 1

  // Sync audio chimes with cue shifts and 4-second Mokuso breath turns while running
  useEffect(() => {
    if (!isRunning || isCompleted) return;

    if (activeCueIndex !== lastCueRef.current) {
      lastCueRef.current = activeCueIndex;
      playDojoBell('cue');
    }

    if (currentPhase.id === 'mokuso') {
      const breathBucket = Math.floor(elapsedInPhase / 4);
      if (breathBucket !== lastBreathBucketRef.current) {
        lastBreathBucketRef.current = breathBucket;
        // Skip overlap right on 0s when transition bell rings
        if (elapsedInPhase > 0) {
          const stepMod = breathBucket % 3;
          playDojoBell(stepMod === 0 ? 'inhale' : stepMod === 1 ? 'hold' : 'exhale');
        }
      }
    }
  }, [isRunning, isCompleted, activeCueIndex, currentPhase.id, elapsedInPhase, playDojoBell]);

  const handleSelectPhase = (idx: number) => {
    lastCueRef.current = 0;
    lastBreathBucketRef.current = -1;
    setIsCompleted(false);
    setPhaseIndex(idx);
    setSecondsLeft(PRACTICE_PHASES[idx].durationSeconds);
  };

  const handleTogglePlay = () => {
    if (isCompleted) {
      lastCueRef.current = 0;
      lastBreathBucketRef.current = -1;
      setIsCompleted(false);
      setPhaseIndex(0);
      setSecondsLeft(PRACTICE_PHASES[0].durationSeconds);
      setIsRunning(true);
      playDojoBell('transition');
      return;
    }
    if (!isRunning && phaseIndex === 0 && secondsLeft === PRACTICE_PHASES[0].durationSeconds) {
      playDojoBell('transition');
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    lastCueRef.current = 0;
    lastBreathBucketRef.current = -1;
    setIsRunning(false);
    setIsCompleted(false);
    setPhaseIndex(0);
    setSecondsLeft(PRACTICE_PHASES[0].durationSeconds);
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        // Immediate gentle audio feedback when turning sound ON
        window.setTimeout(() => {
          const ctx = getAudioCtx();
          if (!ctx) return;
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(528, ctx.currentTime);
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.65);
          } catch {
            // Ignore
          }
        }, 10);
      }
      return next;
    });
  };

  const formatClock = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalRoutineSeconds = PRACTICE_PHASES.reduce((acc, p) => acc + p.durationSeconds, 0);
  const completedPreviousSeconds = PRACTICE_PHASES.slice(0, phaseIndex).reduce(
    (acc, p) => acc + p.durationSeconds,
    0
  );
  const currentElapsed = isCompleted
    ? totalRoutineSeconds
    : completedPreviousSeconds + elapsedInPhase;
  const overallProgressPct = Math.min(100, Math.round((currentElapsed / totalRoutineSeconds) * 100));

  // Circular arc geometry for countdown ring
  const ringRadius = 74;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const phaseFraction = secondsLeft / currentPhase.durationSeconds;
  const ringDashOffset = ringCircumference * (1 - phaseFraction);

  const breathStatusText =
    currentPhase.id === 'mokuso' && isRunning
      ? `${breathLabel} · ${breathCount}`
      : isRunning
      ? `Active Step · Cue 0${activeCueIndex + 1}`
      : 'Tap Start When Ready';

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Osu! I completed my 5-Minute Mindful Karate Practice at home today with Lions Karate Club Pune! Daily Streak: ${streakData.streak} Day${streakData.streak === 1 ? '' : 's'}.`
  )}`;

  return (
    <div id="practice" className="space-y-8">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-amber-500 font-bold block mb-1.5">
            Daily Home Discipline · 5 Minutes · Zero Login
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            Mindful Home Practice
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Place the phone in front of your mat and follow the animated countdown, breath bell, and posture photos.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-zinc-800 text-xs font-mono text-zinc-200 tabular-nums">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {streakData.streak} Day{streakData.streak === 1 ? '' : 's'} Streak
            </span>
            <span className="text-zinc-600" aria-hidden="true">
              ·
            </span>
            <span className="text-zinc-400">{streakData.totalSessions} Total</span>
          </div>

          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={soundEnabled ? 'Mute dojo bell' : 'Unmute dojo bell'}
            className="min-h-[44px] px-3.5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer text-xs font-mono"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Bell On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-500">Muted</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3-Step Interactive Phase Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950 border border-zinc-800 p-2 rounded-2xl">
        {PRACTICE_PHASES.map((phase, idx) => {
          const isCurrent = !isCompleted && idx === phaseIndex;
          const isDone = isCompleted || idx < phaseIndex;
          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => handleSelectPhase(idx)}
              className={`min-h-[48px] px-4 py-3 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                isCurrent
                  ? 'bg-[#9B1B20] text-white shadow-[0_0_20px_rgba(155,27,32,0.3)]'
                  : isDone
                  ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/50'
                  : 'bg-slate-900/50 text-zinc-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-80 block">
                  {phase.stepNumber}. {phase.durationLabel}
                </span>
                <span className="font-heading font-bold text-xs sm:text-sm uppercase tracking-wide truncate block">
                  {phase.title}
                </span>
              </div>
              {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Main Guided Practice Stage */}
      {isCompleted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-10 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400 font-bold block">
              Osu! Session Complete · Bow (Rei)
            </span>
            <h3 className="font-heading text-2xl sm:text-3xl font-black uppercase text-white">
              Great Focus Today
            </h3>
            <p className="text-zinc-400 text-sm">
              You completed all 5 minutes of Mokuso breathing, Kihon stance work, and Kata focus. Consistency builds Black Belt character.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 py-3 border-y border-zinc-900 max-w-md mx-auto text-sm font-mono tabular-nums">
            <div>
              <span className="text-zinc-500 text-xs block uppercase">Daily Streak</span>
              <span className="text-amber-400 font-bold text-lg">
                {streakData.streak} Day{streakData.streak === 1 ? '' : 's'}
              </span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div>
              <span className="text-zinc-500 text-xs block uppercase">Sessions Done</span>
              <span className="text-white font-bold text-lg">{streakData.totalSessions}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share Completion on WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Visual Posture Reference Photo + Live Animated Cues */}
          <div className="lg:col-span-7 bg-slate-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="relative aspect-[4/3] w-full bg-zinc-950 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhase.id}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full"
                >
                  {!imgErrorMap[currentPhase.id] ? (
                    <img
                      src={currentPhase.imageUrl}
                      alt={currentPhase.imageAlt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImgErrorMap((prev) => ({
                          ...prev,
                          [currentPhase.id]: true
                        }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-zinc-950 p-6 text-center">
                      <ShieldCheck className="w-10 h-10 text-amber-500 mb-3" />
                      <span className="font-heading font-bold uppercase text-white text-sm">
                        {currentPhase.postureTitle}
                      </span>
                      <span className="text-xs text-zinc-400 mt-1">{currentPhase.japaneseTitle}</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <span className="font-mono text-[11px] uppercase tracking-widest text-amber-400 font-bold block">
                  {currentPhase.japaneseTitle}
                </span>
                <h3 className="font-heading text-xl sm:text-2xl font-black uppercase text-white mt-0.5">
                  {currentPhase.postureTitle}
                </h3>
              </div>
            </div>

            {/* Live Synced Posture Instructions */}
            <div className="p-5 sm:p-6 space-y-3 border-t border-zinc-900 bg-slate-950">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <span>Posture Instructions</span>
                {isRunning && (
                  <span className="text-amber-400 tabular-nums">
                    Active Step · 0{activeCueIndex + 1} / 03
                  </span>
                )}
              </div>

              <ul className="space-y-2">
                {currentPhase.cues.map((cue, idx) => {
                  const isActiveCue = isRunning ? activeCueIndex === idx : idx === 0;
                  const isPassedCue = isRunning && idx < activeCueIndex;

                  return (
                    <motion.li
                      key={`${currentPhase.id}-cue-${idx}`}
                      animate={{
                        opacity: isActiveCue ? 1 : isPassedCue ? 0.55 : 0.7,
                        scale: isActiveCue ? 1 : 0.99
                      }}
                      transition={{ duration: 0.25 }}
                      className={`rounded-xl px-3.5 py-2.5 border transition-colors flex items-start gap-3 text-xs sm:text-sm ${
                        isActiveCue
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : 'bg-transparent border-zinc-900 text-zinc-400'
                      }`}
                    >
                      <span
                        className={`font-mono font-bold shrink-0 tabular-nums ${
                          isActiveCue
                            ? 'text-amber-400'
                            : isPassedCue
                            ? 'text-emerald-400'
                            : 'text-zinc-500'
                        }`}
                      >
                        0{idx + 1}.
                      </span>
                      <div className="flex-grow space-y-1">
                        <span>{cue}</span>

                        {/* Live 4-Second Breath Countdown inside Cue 02 during Mokuso */}
                        {currentPhase.id === 'mokuso' && idx === 1 && isRunning && isActiveCue && (
                          <div className="flex items-center gap-2 pt-1 font-mono text-xs text-amber-400 tabular-nums">
                            <span className="font-bold">{breathLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span>{breathCount}s</span>
                          </div>
                        )}
                      </div>

                      {isPassedCue && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right: Animated Breathing Halo + Circular Countdown & Touch Controls */}
          <div className="lg:col-span-5 bg-slate-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Step {currentPhase.stepNumber} of 03</span>
                <span className="tabular-nums">{overallProgressPct}% Complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#9B1B20] to-amber-500 transition-all duration-500"
                  style={{ width: `${overallProgressPct}%` }}
                />
              </div>
            </div>

            {/* Animated Circular Countdown + Breathing Pulse */}
            <div className="py-4 flex flex-col items-center justify-center border-y border-zinc-900 space-y-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Expanding / Steady Hold / Contracting Breathing Halo during Mokuso */}
                <motion.div
                  animate={
                    currentPhase.id === 'mokuso' && isRunning
                      ? {
                          scale: breathStage === 'exhale' ? 0.92 : 1.14,
                          opacity:
                            breathStage === 'inhale'
                              ? 0.36
                              : breathStage === 'hold'
                              ? 0.28
                              : 0.14
                        }
                      : { scale: 1, opacity: 0.12 }
                  }
                  transition={{ duration: 3.8, ease: 'easeInOut' }}
                  className="absolute inset-4 rounded-full bg-amber-500/20 blur-md pointer-events-none"
                />

                {/* SVG Progress Ring */}
                <svg className="w-48 h-48 -rotate-90" viewBox="0 0 180 180" aria-hidden="true">
                  <circle
                    cx="90"
                    cy="90"
                    r={ringRadius}
                    fill="none"
                    stroke="rgba(39, 39, 42, 0.9)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r={ringRadius}
                    fill="none"
                    stroke={currentPhase.id === 'mokuso' ? '#f59e0b' : '#dc2626'}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringDashOffset}
                    className="transition-[stroke-dashoffset] duration-700 ease-linear"
                  />
                </svg>

                {/* Center Clock */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white tabular-nums">
                    {formatClock(secondsLeft)}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 mt-1">
                    {currentPhase.title}
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.span
                  key={breathStatusText}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="font-mono text-xs uppercase tracking-[0.18em] text-amber-400 font-bold tabular-nums text-center"
                >
                  {breathStatusText}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Touch-Friendly Controls */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-full min-h-[52px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#9B1B20] hover:bg-red-600 text-white font-heading font-black text-sm uppercase tracking-wider shadow-[0_0_24px_rgba(155,27,32,0.35)] transition-all cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>Pause Practice</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>
                      {secondsLeft < currentPhase.durationSeconds || phaseIndex > 0
                        ? 'Resume Practice'
                        : 'Start 5-Min Practice'}
                    </span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAdvancePhase}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-zinc-800 hover:border-zinc-600 text-zinc-200 font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <SkipForward className="w-4 h-4 text-amber-400" />
                  <span>{phaseIndex < PRACTICE_PHASES.length - 1 ? 'Next Step' : 'Finish'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
