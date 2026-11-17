import { Star, Quote, Play } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      text: 'The discipline Aarav learned here is remarkable. His focus at school improved noticeably, and he carries himself with genuine respect.',
      author: 'Rajesh Kulkarni',
      role: 'Parent of Aarav (Age 9, Orange Belt)'
    },
    {
      text: 'Coaches are supportive yet structured. Within months, Ananya built real self-defense awareness, stronger fitness, and lasting confidence.',
      author: 'Priya Sharma',
      role: 'Parent of Ananya (Age 7, Yellow Belt)'
    },
    {
      text: 'My son Kabir channels his energy productively now and won a gold medal in regional Kumite. Truly the best karate dojo in Narhe Pune.',
      author: 'Amit Deshmukh',
      role: 'Parent of Kabir (Age 11, Green Belt)'
    }
  ];

  return (
    <div id="testimonials" className="space-y-8">
      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-500 font-bold block mb-1.5">
          ⭐ PUNE PARENT FEEDBACK
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
          Trusted by Pune Families
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1">
          Real reviews and video reflections from parents of Lions Karate Club Pune students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 grid grid-cols-1 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="bg-slate-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <Quote className="w-4 h-4 text-zinc-700" />
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic">“{t.text}”</p>
              <div className="pt-2 border-t border-zinc-800/70">
                <span className="font-heading font-bold text-xs text-white block">{t.author}</span>
                <span className="font-mono text-[10px] text-zinc-400">{t.role}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-slate-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
            <span className="font-heading font-black text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-red-500" />
              <span>Parent Video Testimonial</span>
            </span>
            <span className="font-mono text-[10px] text-amber-500">LIONS KARATE</span>
          </div>
          <div className="flex-grow bg-black flex items-center justify-center">
            <video
              src="https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1781347453/Check_out_the_full_video_to_see_what_parents_think_of_our_program_At_LIONS_KARATE_CLUB_PUNE_l5vhas.mp4"
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[420px] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
