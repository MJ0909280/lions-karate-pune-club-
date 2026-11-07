import React, { useState } from 'react';
import { Play, X, ChevronLeft, ChevronRight, Newspaper, ExternalLink } from 'lucide-react';

interface GalleryItem {
  src: string;
  alt: string;
  category: 'dojo' | 'tournaments' | 'grading' | 'news';
  title: string;
  type?: 'image' | 'video';
  description?: string;
  objectPosition?: string;
}

export default function Gallery() {
  const [filter, setFilter] = useState<'all' | 'dojo' | 'tournaments' | 'grading' | 'news'>('all');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const galleryItems: GalleryItem[] = [
    {
      src: "https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1781346883/Untitled_-_June_11_2026_at_22.20.41_qrs7vz.mp4",
      alt: "Lions Karate Club Training highlights and dynamic techniques loop",
      category: "dojo",
      title: "Dojo Technique Showcase",
      type: "video"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781348302/shoury_image_unjx3u.jpg",
      alt: "Shourya Sudhakar Jadhav won Gold Medal in KAI National Level",
      category: "tournaments",
      title: "Shourya Sudhakar Jadhav",
      description: "Won Gold Medal in KAI National Level organized by Haryana Olympic Sports Association",
      objectPosition: "object-top"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350157/WhatsApp_Image_2026-06-13_at_4.57.58_PM_mvcjyf.jpg",
      alt: "Lions Karate Club competitive performance celebration and trophy presentation",
      category: "tournaments",
      title: "Championship Celebration",
      description: "Our dedicated students showcasing their hard-earned trophies and gold medals at the tournament podium.",
      objectPosition: "object-center"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350158/WhatsApp_Image_2026-06-13_at_4.58.00_PM_xp52ff.jpg",
      alt: "Lions Karate Club athletes standing proud with certificates and medals",
      category: "tournaments",
      title: "Victorious Tournament Squad",
      description: "Young champions displaying elite focus, sportsmanship, and outstanding competitive results under high-pressure matches.",
      objectPosition: "object-center"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350156/WhatsApp_Image_2026-06-13_at_4.57.59_PM_cwcle3.jpg",
      alt: "Lions Karate student showcasing the gold medal on the podium",
      category: "tournaments",
      title: "Elite Podium Achievement",
      description: "Recognizing outstanding martial arts excellence, determination, and supreme podium achievements at the state level championship.",
      objectPosition: "object-center"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1781350639/Next_belt._Next_level._Proud_of_our_fighters_at_Lions_Karate_Club_Pune_karatepune_lionskar_ubmmqb.mp4",
      alt: "Lions Karate Club next belt, next level promotion ceremony",
      category: "grading",
      title: "Next Belt Promotion Ceremony",
      type: "video",
      description: "Proud moments of our fighters stepping up to their next belt and elevating to the next level at Lions Karate Club Pune.",
      objectPosition: "object-center"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/image/upload/v1783050165/WhatsApp_Image_2026-07-03_at_9.10.18_AM_1_pnowsc.jpg",
      alt: "Lions Karate Club tournament victory press coverage highlighting student achievements",
      category: "news",
      title: "Championship Victory Spotlight",
      description: "Local news publication celebrates the grand triumph and multiple medals secured by the Lions Karate team.",
      objectPosition: "object-center"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/image/upload/v1783050165/WhatsApp_Image_2026-07-03_at_9.10.18_AM_fip5yi.jpg",
      alt: "Lions Karate Club women and girls self-defence training publication feature",
      category: "news",
      title: "Community Self-Defence Drive",
      description: "Press highlight covering our dedicated, life-saving self-defence workshops conducted for local women and girls.",
      objectPosition: "object-center"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/image/upload/v1783050165/WhatsApp_Image_2026-07-03_at_9.10.17_AM_yiatxc.jpg",
      alt: "Shotokan Karate traditional training excellence news report",
      category: "news",
      title: "Martial Arts Legacy & Growth",
      description: "In-depth news feature on traditional Shotokan standards, discipline, and outstanding coaching at Lions Dojo.",
      objectPosition: "object-center"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/image/upload/v1783050164/WhatsApp_Image_2026-07-03_at_9.10.14_AM_ypbelu.jpg",
      alt: "Lions Karate Club junior champions selection press coverage",
      category: "news",
      title: "Youth Talents & National Selection",
      description: "Media focus on our young fighters selected for representing the district in upcoming national-level tournaments.",
      objectPosition: "object-center"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/image/upload/v1783050163/WhatsApp_Image_2026-07-03_at_9.10.08_AM_kkcefp.jpg",
      alt: "Lions Karate Club grand belt promotion and grading report in local newspaper",
      category: "news",
      title: "Official Belt Grading & Ceremony",
      description: "Press editorial celebrating our students' advancement to higher ranks and recognition of their stellar grit.",
      objectPosition: "object-center"
    },
    {
      src: "https://res.cloudinary.com/dlzdagymx/image/upload/v1783050162/WhatsApp_Image_2026-07-03_at_9.10.00_AM_vem7a0.jpg",
      alt: "Lions Karate Club character building and fitness campaign news clipping",
      category: "news",
      title: "Building Character and Focus",
      description: "Newspaper highlight praising our dojo's unique focus on mental resilience, focus, and character building in students.",
      objectPosition: "object-center"
    }
  ];

  const filteredItems = filter === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === filter);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prevIndex) => {
      if (prevIndex === null) return null;
      return prevIndex === 0 ? filteredItems.length - 1 : prevIndex - 1;
    });
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prevIndex) => {
      if (prevIndex === null) return null;
      return prevIndex === filteredItems.length - 1 ? 0 : prevIndex + 1;
    });
  };

  const selectedItem = selectedIndex !== null ? filteredItems[selectedIndex] : null;

  return (
    <div className="relative py-4">
      <div className="w-full">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-6">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2">
              <div className="h-[1px] w-8 bg-red-500"></div>
              <span className="text-red-500 uppercase tracking-[0.3em] text-[10px] font-extrabold font-mono">GALLERY FEED</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              LIFE AT <span className="text-transparent font-kanji" style={{ WebkitTextStroke: '1.5px #FF2A35', color: 'transparent' }}>THE DOJO</span>
            </h2>
          </div>

          {/* Filtering buttons */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'dojo', 'tournaments', 'grading', 'news'] as const).map((cat) => {
              const labelMap = {
                all: 'All Media',
                dojo: 'Training',
                tournaments: 'Tournaments',
                grading: 'Grading & Events',
                news: 'News'
              };
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setFilter(cat);
                    // Reset selected lightbox index since the list changes
                    setSelectedIndex(null);
                  }}
                  className={`text-[10px] font-heading font-black uppercase tracking-widest px-4 py-2 rounded-md transition-all cursor-pointer border ${
                    filter === cat
                      ? 'bg-yellow-500 border-yellow-500 text-slate-950 shadow-md shadow-yellow-500/10 scale-[1.03]'
                      : 'bg-zinc-900/65 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-850'
                  }`}
                >
                  {labelMap[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Gallery Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className="group relative h-[260px] cursor-pointer bg-slate-900 rounded-lg overflow-hidden border border-zinc-900 shadow-md flex-1 animate-fade-in"
            >
              {item.type === 'video' ? (
                <video
                  src={item.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover filter contrast-110 brightness-95 group-hover:scale-105 transition-all duration-500"
                />
              ) : (
                <img 
                  src={item.src} 
                  alt={item.alt}
                  className={`w-full h-full object-cover filter grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ${item.objectPosition || 'object-center'}`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              )}
              {/* Play symbol badge overlay for video content */}
              {item.type === 'video' && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-slate-950 p-2 rounded-full border border-yellow-450 shadow-md backdrop-blur-sm z-10 animate-fade-in group-hover:scale-110 transition-transform">
                  <Play className="w-3 h-3 fill-current" />
                </div>
              )}
              {/* Newspaper symbol badge overlay for news clippings */}
              {item.category === 'news' && (
                <div className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full border border-red-500 shadow-md backdrop-blur-sm z-10 animate-fade-in group-hover:scale-110 transition-transform flex items-center justify-center">
                  <Newspaper className="w-3.5 h-3.5" />
                </div>
              )}
              {/* Hover Text Banner Element */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <span className="text-[9px] font-mono text-yellow-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  {item.category === 'news' && <Newspaper className="w-3 h-3 text-red-500" />}
                  {item.category === 'dojo' ? 'Dojo Training' : item.category === 'tournaments' ? 'Tournaments' : item.category === 'grading' ? 'Belt Grading' : 'News'}
                </span>
                {item.category !== 'news' && (
                  <>
                    <span className="font-heading font-black text-sm text-white block uppercase tracking-wide">
                      {item.title}
                    </span>
                    {item.description && (
                      <p className="text-[10px] text-zinc-300 font-medium leading-normal mt-1 block line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Full-Screen Interactive Lightbox Overlay */}
      {selectedItem && selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Close button */}
          <button 
            type="button"
            className="fixed top-4 right-4 sm:top-6 sm:right-6 text-zinc-400 hover:text-white transition-colors bg-zinc-900/85 hover:bg-zinc-850 p-3 rounded-full border border-zinc-800 focus:outline-none z-50 cursor-pointer"
            onClick={() => setSelectedIndex(null)}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Navigation Controls (Desktop) */}
          {filteredItems.length > 1 && (
            <>
              <button
                type="button"
                className="fixed left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 hover:bg-zinc-800 p-3 rounded-full border border-zinc-800 focus:outline-none z-50 cursor-pointer hidden sm:block"
                onClick={handlePrev}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                className="fixed right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 hover:bg-zinc-800 p-3 rounded-full border border-zinc-800 focus:outline-none z-50 cursor-pointer hidden sm:block"
                onClick={handleNext}
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Scrollable Content Wrapper */}
          <div className="flex min-h-full flex-col items-center justify-center p-4 py-16 sm:p-8">
            <div 
              className="relative max-w-4xl w-full flex flex-col items-center justify-center gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media Container with responsive max height limits */}
              <div className="relative rounded-lg overflow-hidden border border-zinc-800 shadow-2xl flex justify-center items-center bg-zinc-900/40 w-full">
                {selectedItem.type === 'video' ? (
                  <video
                    src={selectedItem.src}
                    controls
                    autoPlay
                    className="max-h-[50vh] sm:max-h-[68vh] max-w-full rounded-md object-contain"
                  />
                ) : (
                  <img
                    src={selectedItem.src}
                    alt={selectedItem.alt}
                    className="max-h-[50vh] sm:max-h-[68vh] max-w-full rounded-md object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Navigation Controls (Mobile/Touch Friendly Placement) */}
              {filteredItems.length > 1 && (
                <div className="flex sm:hidden items-center justify-center gap-6 text-zinc-350 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/80">
                  <button
                    type="button"
                    className="flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-[10px] font-mono leading-none tracking-widest uppercase">
                    {selectedIndex + 1} of {filteredItems.length}
                  </span>
                  <button
                    type="button"
                    className="flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Title & Description Info Bar */}
              <div className="text-center max-w-2xl px-2">
                <span className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1">
                  {selectedItem.category === 'news' && <Newspaper className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
                  {selectedItem.category === 'dojo' ? 'Dojo Training' : selectedItem.category === 'tournaments' ? 'Tournaments' : selectedItem.category === 'grading' ? 'Belt Grading' : 'News'}
                </span>
                {selectedItem.category !== 'news' && (
                  <>
                    <h3 className="font-heading font-black text-lg sm:text-2xl text-white uppercase tracking-wider mb-2 leading-tight">
                      {selectedItem.title}
                    </h3>
                    {selectedItem.description ? (
                      <p className="text-zinc-300 text-xs sm:text-sm font-normal leading-relaxed">
                        {selectedItem.description}
                      </p>
                    ) : (
                      <p className="text-zinc-400 text-xs sm:text-sm font-light italic leading-relaxed">
                        {selectedItem.alt}
                      </p>
                    )}
                  </>
                )}

                {/* Enhanced UX for reading small newspaper text */}
                {selectedItem.category === 'news' && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a 
                      href={selectedItem.src} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 text-xs font-heading font-black text-slate-950 bg-yellow-500 hover:bg-yellow-400 border border-yellow-500 px-4 py-2.5 rounded-lg shadow-lg hover:shadow-yellow-500/20 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View High-Res Clipping ↗
                    </a>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      (Opens full scan in a new tab for easy reading & zooming)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
