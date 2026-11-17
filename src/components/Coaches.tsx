import { useState } from 'react';
import { CoachInfo } from '../types';
import { Award, ShieldCheck } from 'lucide-react';

export default function Coaches() {
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const coaches: CoachInfo[] = [
    {
      name: 'Sensei Maruti Jadhav',
      rank: '2nd Dan Black Belt',
      role: 'Co-Founder & Chief Instructor',
      experience: 'National Medalist • Manaji Nagar Head Coach',
      bio: 'Dedicated to building discipline, technical perfection, and competitive confidence through traditional Shotokan Karate and youth self-defense training.',
      image:
        'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1775902315/lions-karate-students/kkp6f9ft8ji6ytxqpm6d.jpg'
    },
    {
      name: 'Sensei Shivraj Jejure',
      rank: '2nd Dan Black Belt',
      role: 'Founder & Senior Instructor',
      experience: 'National Medalist • Bhumkar Bridge Lead',
      bio: 'Passionate about guiding young athletes toward physical vitality, mental composure, and championship-level Kumite & Kata performance.',
      image:
        'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781354493/1000406954.jpg_gak7yh.jpg'
    },
    {
      name: 'Sensei Shital Samindar',
      rank: '1st Dan Black Belt',
      role: 'Assistant Coach & Self-Defense Lead',
      experience: 'Jambulwadi Lake View Branch Lead',
      bio: 'Specializes in empowering kids, girls, and women with strong foundational Karate techniques, safety awareness, and confident discipline.',
      image:
        'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1783011427/WhatsApp_Image_2026-07-02_at_9.57.01_PM_euubfo.jpg'
    }
  ];

  return (
    <div id="coaches" className="space-y-8">
      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-500 font-bold block mb-1.5">
          🥋 CERTIFIED BLACK BELT FACULTY
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
          Meet Our Dojo Senseis
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1">
          Experienced National Medalists and certified Shotokan instructors leading every Pune branch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coaches.map((coach, idx) => (
          <div
            key={coach.name}
            className="bg-slate-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col hover:border-amber-500/40 transition-all"
          >
            <div className="h-72 bg-slate-950 relative overflow-hidden">
              {!failedImages[idx] ? (
                <img
                  src={coach.image}
                  alt={coach.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedImages((prev) => ({ ...prev, [idx]: true }))}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-950 text-zinc-500 text-xs font-mono">
                  {coach.name}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 bg-black/80 border border-amber-500/40 text-amber-400 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                  <Award className="w-3 h-3" />
                  <span>{coach.rank}</span>
                </span>
              </div>
            </div>

            <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold block">
                  {coach.role}
                </span>
                <h3 className="font-heading text-lg font-black uppercase text-white">
                  {coach.name}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{coach.bio}</p>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] font-mono text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{coach.experience}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
