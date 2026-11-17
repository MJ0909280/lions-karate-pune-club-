import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Play } from 'lucide-react';

export default function KataShowcase() {
  const [kataVideoUrl, setKataVideoUrl] = useState<string>(
    'https://res.cloudinary.com/dlzdagymx/video/upload/v1784001539/WhatsApp_Video_2026-07-14_at_9.23.13_AM_sve0ia.mp4'
  );
  const [kataVideoUrl2, setKataVideoUrl2] = useState<string>(
    'https://res.cloudinary.com/dlzdagymx/video/upload/v1783699434/Kata_hcvwxf.mp4'
  );

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'video'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.kataVideoUrl) setKataVideoUrl(data.kataVideoUrl);
          if (data.kataVideoUrl2) setKataVideoUrl2(data.kataVideoUrl2);
        }
      },
      () => {}
    );
    return () => unsub();
  }, []);


  return (
    <div id="kata" className="space-y-8">
      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-500 font-bold block mb-1.5">
          🥋 OFFICIAL SHOTOKAN SYLLABUS
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
          Kata Showcase &amp; Belt Forms
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1">
          Watch authentic individual and synchronized team Kata demonstrations practiced at our Pune dojos.
        </p>
      </div>

      {/* Video Demos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
            <span className="font-heading font-black text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-red-500" />
              <span>Individual Kata Demonstration</span>
            </span>
            <span className="font-mono text-[10px] text-amber-500">SOLO FORM</span>
          </div>
          <div className="aspect-video bg-black">
            <video
              src={kataVideoUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="bg-slate-950 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
            <span className="font-heading font-black text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-amber-500" />
              <span>Synchronized Team Kata</span>
            </span>
            <span className="font-mono text-[10px] text-red-400">GROUP KATA</span>
          </div>
          <div className="aspect-video bg-black">
            <video
              src={kataVideoUrl2}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
