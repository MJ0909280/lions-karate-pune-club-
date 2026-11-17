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
      src: 'https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1781346883/Untitled_-_June_11_2026_at_22.20.41_qrs7vz.mp4',
      alt: 'Lions Karate Club Pune training highlights and dynamic techniques',
      category: 'dojo',
      title: 'Dojo Technique Showcase',
      type: 'video',
      description: 'Focused movement drills, stance transitions, and speed work on the mat.'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781348302/shoury_image_unjx3u.jpg',
      alt: 'Shourya Sudhakar Jadhav won Gold Medal in KAI National Level',
      category: 'tournaments',
      title: 'Shourya Sudhakar Jadhav',
      description: 'Gold Medal winner at the KAI National Level Championship.',
      objectPosition: 'object-top'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350157/WhatsApp_Image_2026-06-13_at_4.57.58_PM_mvcjyf.jpg',
      alt: 'Lions Karate Club competitive performance celebration and trophy presentation',
      category: 'tournaments',
      title: 'Championship Celebration',
      description: 'Students celebrating trophies and medals earned through steady training.',
      objectPosition: 'object-center'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350158/WhatsApp_Image_2026-06-13_at_4.58.00_PM_xp52ff.jpg',
      alt: 'Lions Karate Club athletes standing with certificates and medals',
      category: 'tournaments',
      title: 'Tournament Squad',
      description: 'Athletes displaying sportsmanship and podium results at state competition.',
      objectPosition: 'object-center'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350156/WhatsApp_Image_2026-06-13_at_4.57.59_PM_cwcle3.jpg',
      alt: 'Lions Karate student showcasing gold medal on the podium',
      category: 'tournaments',
      title: 'State Podium Achievement',
      description: 'Recognizing composure, preparation, and tournament excellence.',
      objectPosition: 'object-center'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1781350639/Next_belt._Next_level._Proud_of_our_fighters_at_Lions_Karate_Club_Pune_karatepune_lionskar_ubmmqb.mp4',
      alt: 'Lions Karate Club belt promotion ceremony',
      category: 'grading',
      title: 'Belt Promotion Ceremony',
      type: 'video',
      description: 'Students stepping up to their next belt rank at Lions Karate Club.',
      objectPosition: 'object-center'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1783050165/WhatsApp_Image_2026-07-03_at_9.10.18_AM_1_pnowsc.jpg',
      alt: 'Lions Karate Club tournament victory press coverage',
      category: 'news',
      title: 'Championship Victory Spotlight',
      description: 'Local newspaper coverage celebrating medal winners from Lions Karate Club.',
      objectPosition: 'object-center'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1783050165/WhatsApp_Image_2026-07-03_at_9.10.18_AM_fip5yi.jpg',
      alt: 'Lions Karate Club women and girls self-defense workshop feature',
      category: 'news',
      title: 'Community Self-Defense Drive',
      description: 'Press feature highlighting self-defense workshops for women and girls.',
      objectPosition: 'object-center'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1783050165/WhatsApp_Image_2026-07-03_at_9.10.17_AM_yiatxc.jpg',
      alt: 'Shotokan Karate traditional training news report',
      category: 'news',
      title: 'Martial Arts Legacy & Growth',
      description: 'Press coverage on traditional Shotokan standards and discipline.',
      objectPosition: 'object-center'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1783050164/WhatsApp_Image_2026-07-03_at_9.10.14_AM_ypbelu.jpg',
      alt: 'Lions Karate Club junior champions national selection coverage',
      category: 'news',
      title: 'National Selection Feature',
      description: 'Young athletes selected to represent the district at national tournaments.',
      objectPosition: 'object-center'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1783050163/WhatsApp_Image_2026-07-03_at_9.10.08_AM_kkcefp.jpg',
      alt: 'Lions Karate Club belt grading ceremony news report',
      category: 'news',
      title: 'Official Belt Grading Report',
      description: 'Editorial coverage celebrating students advancing to higher belt ranks.',
      objectPosition: 'object-center'
    },
    {
      src: 'https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1783050162/WhatsApp_Image_2026-07-03_at_9.10.00_AM_vem7a0.jpg',
      alt: 'Lions Karate Club character building news clipping',
      category: 'news',
      title: 'Character & Focus Recognition',
      description: 'Newspaper article highlighting mental resilience and character development.',
      objectPosition: 'object-center'
    }
  ];

  const filteredItems =
    filter === 'all' ? galleryItems : galleryItems.filter((item) => item.category === filter);

  const selectedItem = selectedIndex !== null ? filteredItems[selectedIndex] : null;

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev === null ? null : prev === 0 ? filteredItems.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev === null ? null : prev === filteredItems.length - 1 ? 0 : prev + 1));
  };

  return (
    <div id="gallery" className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-500 font-bold block mb-1.5">
            📸 DOJO ACTION &amp; PRESS
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            Gallery, Tournaments &amp; News
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'dojo', 'tournaments', 'grading', 'news'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setFilter(cat);
                setSelectedIndex(null);
              }}
              className={`px-3 py-1.5 rounded text-[10px] font-heading font-black uppercase tracking-wider border cursor-pointer transition-all ${
                filter === cat
                  ? 'bg-yellow-500 text-slate-950 border-yellow-500'
                  : 'bg-slate-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item, idx) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setSelectedIndex(idx)}
            className="group relative h-60 rounded-2xl overflow-hidden border border-zinc-800 bg-slate-950 text-left cursor-pointer"
          >
            {item.type === 'video' ? (
              <video
                src={item.src}
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            ) : (
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${item.objectPosition || 'object-center'}`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {item.type === 'video' && (
              <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </span>
            )}
            {item.category === 'news' && (
              <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center">
                <Newspaper className="w-3.5 h-3.5" />
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400 block">
                {item.category}
              </span>
              <h3 className="font-heading font-bold text-sm text-white uppercase mt-0.5 truncate">
                {item.title}
              </h3>
            </div>
          </button>
        ))}
      </div>

      {selectedItem && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            aria-label="Close lightbox"
            className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-slate-900 border border-zinc-700 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {filteredItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous"
                className="fixed left-4 top-1/2 -translate-y-1/2 z-50 p-2.5 rounded-full bg-slate-900 border border-zinc-700 text-white cursor-pointer hidden sm:flex"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next"
                className="fixed right-4 top-1/2 -translate-y-1/2 z-50 p-2.5 rounded-full bg-slate-900 border border-zinc-700 text-white cursor-pointer hidden sm:flex"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div
            className="max-w-4xl w-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full rounded-xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center">
              {selectedItem.type === 'video' ? (
                <video
                  src={selectedItem.src}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <img
                  src={selectedItem.src}
                  alt={selectedItem.alt}
                  referrerPolicy="no-referrer"
                  className="max-h-[70vh] w-auto object-contain"
                />
              )}
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-heading font-black text-lg text-white uppercase">
                {selectedItem.title}
              </h3>
              {selectedItem.description && (
                <p className="text-xs text-zinc-400">{selectedItem.description}</p>
              )}
              {selectedItem.category === 'news' && (
                <a
                  href={selectedItem.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 text-xs font-heading font-bold uppercase bg-yellow-500 text-slate-950 rounded"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open High-Res Clipping</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
