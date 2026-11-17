import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BATCH_TIMINGS, BatchInfo } from '../types';
import {
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MartialButton from './MartialButton';

interface BatchesProps {
  onSelectBatch: (batchName: string) => void;
}

function getCohortShortLabel(name: string): string {
  if (name.toLowerCase().includes('little')) return 'Little Tigers';
  if (name.toLowerCase().includes('young')) return 'Young Warriors';
  if (name.toLowerCase().includes('elite')) return 'Elite Dojo';
  return name;
}

export default function Batches({ onSelectBatch }: BatchesProps) {
  const [batches, setBatches] = useState<BatchInfo[]>(BATCH_TIMINGS);
  const [selectedInPersonId, setSelectedInPersonId] = useState<string>(BATCH_TIMINGS[0].id);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'batches'),
      (snap) => {
        if (!snap.empty) {
          const list: BatchInfo[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as BatchInfo);
          });
          setBatches(list);
        }
      },
      () => {}
    );
    return () => unsub();
  }, []);

  const { inPersonBatches, onlineBatch } = useMemo(() => {
    const online = batches.find(
      (b) => b.id.toLowerCase().includes('online') || b.name.toLowerCase().includes('online')
    );
    const inPerson = batches.filter((b) => b.id !== online?.id);
    return {
      inPersonBatches: inPerson.length > 0 ? inPerson : BATCH_TIMINGS.slice(0, 3),
      onlineBatch: online || BATCH_TIMINGS[3]
    };
  }, [batches]);

  const activeInPersonBatch =
    inPersonBatches.find((b) => b.id === selectedInPersonId) || inPersonBatches[0];

  const timingSlots = useMemo(() => {
    if (!activeInPersonBatch?.timing) return [];
    return activeInPersonBatch.timing
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [activeInPersonBatch]);

  return (
    <div id="batches" className="space-y-6">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-900 pb-5">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-amber-500 font-bold block mb-1">
            Training Programs · Pune Dojos &amp; Online
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            Choose Your Batch &amp; Apply
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Pick an age group or slot below — the admission form opens automatically with your selection.
          </p>
        </div>
      </div>

      {/* Two Clear Non-Confusing Cards: Left = Unified In-Person Pune Dojo, Right = Online Mentor Training */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* CARD 1: Combined Pune Dojo Batches */}
        <div className="lg:col-span-7 bg-slate-950 border border-zinc-800 rounded-2xl p-5 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-400">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>In-Person Pune Dojos · 3 Branches</span>
              </div>
              <span className="font-mono text-[11px] text-zinc-400">
                Manaji Nagar · Bhumkar Bridge · Jambulwadi
              </span>
            </div>

            {/* Combined Age Group Tabs (Zero Long Scrolling) */}
            <div
              role="tablist"
              aria-label="In-person Pune dojo age groups"
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-900/90 border border-zinc-800 rounded-xl"
            >
              {inPersonBatches.map((batch) => {
                const isSelected = batch.id === activeInPersonBatch.id;
                return (
                  <button
                    key={batch.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedInPersonId(batch.id)}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#9B1B20] text-white shadow-[0_0_20px_rgba(155,27,32,0.35)]'
                        : 'text-zinc-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="font-heading font-black text-xs uppercase tracking-wider block truncate">
                      {getCohortShortLabel(batch.name)}
                    </span>
                    <span
                      className={`font-mono text-[10px] block mt-0.5 truncate ${
                        isSelected ? 'text-red-100' : 'text-zinc-500'
                      }`}
                    >
                      {batch.ageGroup}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Cohort Details */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeInPersonBatch.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-heading text-xl sm:text-2xl font-black uppercase text-white tracking-wide">
                    {activeInPersonBatch.name}
                  </h3>
                  <span className="font-mono text-xs text-amber-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{activeInPersonBatch.ageGroup}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {activeInPersonBatch.focus}
                </p>

                {/* Tap-to-Apply Evening Slots */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tap Any Slot to Open Form</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{activeInPersonBatch.days}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {timingSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => onSelectBatch(activeInPersonBatch.name)}
                        className="min-h-[44px] px-3 py-2.5 rounded-xl bg-slate-900/80 border border-zinc-800 hover:border-amber-500/60 hover:bg-slate-900 text-xs font-mono text-zinc-200 hover:text-amber-300 transition-all cursor-pointer flex items-center justify-between gap-2 tabular-nums"
                      >
                        <span className="truncate">{slot}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Includes Free Trial Class &amp; Official Belt Grading</span>
            </div>

            <MartialButton
              id={`apply-batch-${activeInPersonBatch.id}`}
              type="primary"
              onClick={() => onSelectBatch(activeInPersonBatch.name)}
              className="!py-3 !px-5 !text-xs w-full sm:w-auto justify-center"
            >
              <span>Apply for {getCohortShortLabel(activeInPersonBatch.name)}</span>
              <ArrowRight className="w-4 h-4" />
            </MartialButton>
          </div>
        </div>

        {/* CARD 2: Separate Online Mentor Training */}
        <div className="lg:col-span-5 bg-slate-950 border border-amber-500/30 rounded-2xl p-5 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
                <Laptop className="w-4 h-4 shrink-0" />
                <span>Live Online Coaching</span>
              </div>
              <span className="font-mono text-[11px] text-zinc-400">Train From Home</span>
            </div>

            <div>
              <h3 className="font-heading text-xl sm:text-2xl font-black uppercase text-white tracking-wide">
                Online Mentor Training
              </h3>
              <p className="font-mono text-xs text-amber-400 mt-1">
                {onlineBatch.ageGroup}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {onlineBatch.focus}
            </p>

            <div className="space-y-2.5 bg-slate-900/60 border border-zinc-800/80 p-4 rounded-xl text-xs text-zinc-300">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-mono">{onlineBatch.timing}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{onlineBatch.days}</span>
              </div>
              <div className="flex items-center gap-2.5 text-emerald-400 pt-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Personal Sensei Attention &amp; Virtual Belt Exam</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              Worldwide &amp; Pune Students
            </span>

            <MartialButton
              id={`apply-batch-${onlineBatch.id}`}
              type="secondary"
              onClick={() => onSelectBatch(onlineBatch.name)}
              className="!py-3 !px-5 !text-xs w-full sm:w-auto justify-center"
            >
              <span>Join Online Training</span>
              <ArrowRight className="w-4 h-4" />
            </MartialButton>
          </div>
        </div>
      </div>
    </div>
  );
}
