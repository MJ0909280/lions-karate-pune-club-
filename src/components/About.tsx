import { Shield, Flame, Award, Target, HeartHandshake, Zap } from 'lucide-react';

export default function About() {
  const virtues = [
    {
      title: 'Character & Respect (Rei)',
      desc: 'Students learn courtesy toward parents, teachers, and peers—building genuine humility and leadership.',
      icon: HeartHandshake
    },
    {
      title: 'Unbreakable Discipline',
      desc: 'Structured Shotokan drills build punctuality, concentration, and strong everyday study and life habits.',
      icon: Target
    },
    {
      title: 'Practical Self-Defense',
      desc: 'Real-world situational awareness, stance stability, blocks, and effective strikes for kids, teens, and women.',
      icon: Shield
    },
    {
      title: 'Tournament Excellence',
      desc: 'Dedicated Kata and Kumite preparation for District, State, and National KAI / WKF championships.',
      icon: Award
    }
  ];

  return (
    <div id="about" className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Dojo Crest Card */}
        <div className="lg:col-span-5 bg-slate-950 border border-zinc-800 rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="relative mx-auto w-44 h-44 rounded-full border-2 border-dashed border-amber-500/40 flex items-center justify-center p-3">
            <img
              src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg"
              alt="Lions Karate Club Pune Emblem"
              className="w-36 h-36 rounded-full object-cover border-2 border-[#9B1B20] shadow-[0_0_30px_rgba(155,27,32,0.5)]"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="mt-6 space-y-2">
            <span className="font-kanji text-3xl text-[#C9A96E] block">精神一到</span>
            <h3 className="font-heading font-black text-lg uppercase tracking-widest text-white">
              DOJO KUN • OATH
            </h3>
            <p className="text-xs text-zinc-400 italic leading-relaxed max-w-sm mx-auto">
              “Seek perfection of character. Be faithful. Endeavor to excel. Respect others. Refrain from violent behavior.”
            </p>
          </div>
        </div>

        {/* Right Philosophy & Virtues */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-500 font-bold block">
              🔥 TRADITIONAL SHOTOKAN HERITAGE
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
              About Lions Karate Club Pune
            </h2>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
              Operating across Manaji Nagar (Narhe), Bhumkar Bridge, and Jambulwadi Lake View, Lions Karate Club Pune trains students from age 4 to adults in authentic Japanese Shotokan Karate, self-defense, and physical conditioning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {virtues.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="bg-slate-900/50 border border-zinc-800/80 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Icon className="w-4 h-4 shrink-0" />
                    <h4 className="font-heading font-black text-xs uppercase tracking-wider text-white">
                      {v.title}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            <span className="inline-flex items-center gap-1.5 text-amber-400">
              <Flame className="w-3.5 h-3.5" />
              <span>KAI &amp; WKF Aligned</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Quarterly Official Belt Exams</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
