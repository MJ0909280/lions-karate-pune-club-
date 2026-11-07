import { Star, Quote, MessageSquareDot } from 'lucide-react';

interface Testimonial {
  text: string;
  author: string;
  role: string;
  rating: number;
}

export default function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      text: "The discipline Aarav learned here is amazing! His focus in school has completely transformed, and he has become so much more respectful and protective of others.",
      author: "Rajesh Kulkarni",
      role: "Parent of Aarav (9, Orange Belt Student)",
      rating: 5
    },
    {
      text: "This is the best karate academy in Pune. The coaches are extremely supportive yet firm. Ananya's confidence and self-defense posture have boosted remarkably!",
      author: "Priya Sharma",
      role: "Parent of Ananya (7, Yellow Belt Student)",
      rating: 5
    },
    {
      text: "LIONS KARATE is superb. My son Kabir is energetic, athletic, and highly disciplined now. He secured a gold medal in the regional Kumite championship!",
      author: "Amit Deshmukh",
      role: "Parent of Kabir (11, Green Belt Student)",
      rating: 5
    }
  ];

  return (
    <div className="relative overflow-hidden py-4">
      {/* Decorative vertical alignment typography Kanji */}
      <div className="absolute top-10 right-10 opacity-[0.03] hidden xl:block select-none pointer-events-none text-right">
        <div className="font-kanji text-[10rem] leading-none text-yellow-500 font-extrabold tracking-widest writing-vertical">
          感謝
        </div>
      </div>

      <div className="w-full relative z-10">
        


        {/* 2-Column Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Column 1: Parents' Video Testimonial - 5 Columns */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative bg-slate-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-zinc-900 bg-slate-900/55 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">PARENT VIDEO TESTIMONIAL</span>
                </div>
                <div className="p-1 px-2.5 bg-yellow-500/10 text-yellow-500 rounded text-[9px] font-heading font-black tracking-wider uppercase">
                  LIONS KARATE
                </div>
              </div>

              {/* Vertical Mobile Video Aspect Feed Container */}
              <div className="relative aspect-[9/16] max-h-[580px] w-full mx-auto bg-black flex items-center justify-center">
                <video
                  src="https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1781347453/Check_out_the_full_video_to_see_what_parents_think_of_our_program_At_LIONS_KARATE_CLUB_PUNE_l5vhas.mp4"
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover brightness-95"
                />
              </div>

              <div className="p-5 bg-slate-900 border-t border-zinc-900">
                <h4 className="font-heading font-black text-xs text-white uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <MessageSquareDot className="w-4 h-4 text-yellow-500" />
                  How Parents Think of our Dojo
                </h4>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                  Press study play to check out raw, verified feedback directly from parents speaking on student character growth and confidence.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Written Feed - 7 Columns */}
          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {testimonials.map((t, idx) => (
                <div 
                  key={idx} 
                  className={`relative bg-slate-900/40 border border-zinc-900/80 rounded-xl p-7 hover:border-yellow-500/10 transition-colors flex flex-col justify-between ${
                    idx === 2 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <div className="absolute top-6 right-6 text-zinc-800">
                    <Quote className="w-8 h-8 rotate-180 opacity-20" />
                  </div>

                  {/* Text content details */}
                  <div className="mb-6">
                    {/* Stars Indicator */}
                    <div className="flex space-x-1 text-yellow-500 mb-4">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-500" />
                      ))}
                    </div>
                    <p className="text-zinc-350 text-sm italic leading-relaxed font-light">
                      "{t.text}"
                    </p>
                  </div>

                  {/* Author bio specs */}
                  <div className="pt-4 border-t border-zinc-850 inline-flex flex-col">
                    <span className="font-heading font-bold text-zinc-100 uppercase text-xs tracking-wider">
                      {t.author}
                    </span>
                    <span className="text-zinc-500 text-[10px] mt-0.5 font-medium">
                      {t.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
