import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BATCH_TIMINGS, BatchInfo } from '../types';
import { Clock, Calendar, Users, CheckCircle2, ArrowRight, Flame } from 'lucide-react';
import MartialButton from './MartialButton';

interface BatchesProps {
  onSelectBatch: (batchName: string) => void;
}

export default function Batches({ onSelectBatch }: BatchesProps) {
  const [batches, setBatches] = useState<BatchInfo[]>(BATCH_TIMINGS);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');

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

  const displayedBatches =
    selectedBatchFilter === 'all'
      ? batches
      : batches.filter((b) => b.id === selectedBatchFilter);

  return (
    <div id="batches" className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-500 font-bold block mb-1.5">
            🥋 TRAINING SCHEDULES • PUNE DOJOS
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            Active Karate &amp; Self-Defense Batches
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Structured cohorts across Manaji Nagar, Bhumkar Bridge &amp; Jambulwadi Lake View Branches.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedBatchFilter('all')}
            className={`px-3 py-1.5 rounded text-[10px] font-heading font-black uppercase tracking-wider border cursor-pointer transition-all ${
              selectedBatchFilter === 'all'
                ? 'bg-yellow-500 text-slate-950 border-yellow-500'
                : 'bg-slate-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            All Batches
          </button>
          {batches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBatchFilter(b.id)}
              className={`px-3 py-1.5 rounded text-[10px] font-heading font-black uppercase tracking-wider border cursor-pointer transition-all ${
                selectedBatchFilter === b.id
                  ? 'bg-yellow-500 text-slate-950 border-yellow-500'
                  : 'bg-slate-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedBatches.map((batch) => (
          <div
            key={batch.id}
            className="bg-slate-900/50 border border-zinc-800/80 hover:border-red-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded">
                    <Users className="w-3 h-3" />
                    <span>{batch.ageGroup}</span>
                  </span>
                  <h3 className="font-heading text-xl font-black uppercase tracking-wide text-white mt-2">
                    {batch.name}
                  </h3>
                </div>
                <Flame className="w-5 h-5 text-red-500 shrink-0" />
              </div>

              <div className="space-y-2 text-xs text-zinc-300 bg-slate-950/70 border border-zinc-900 p-3.5 rounded-xl">
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                  <span className="font-mono">{batch.timing}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{batch.days}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {batch.focus}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Includes Free Trial Class &amp; Official Kyu Grading Eligibility</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/70 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                Mon–Sat Sessions
              </span>
              <MartialButton
                id={`apply-batch-${batch.id}`}
                type="primary"
                onClick={() => onSelectBatch(batch.name)}
                className="!py-2.5 !px-5 !text-[10px]"
              >
                <span>APPLY NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </MartialButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
