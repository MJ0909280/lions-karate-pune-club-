import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Phone, ShieldCheck, Clock, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface DojoLocation {
  id: string;
  name: string;
  tagline: string;
  address: string;
  landmark: string;
  pincode: string;
  phone: string;
  timing: string;
  embedUrl: string;
  directGoogleMapsUrl: string;
}

export default function DojoMapEmbed() {
  const locations: DojoLocation[] = [
    {
      id: 'manaji-nagar',
      name: 'Narhe - Manaji Nagar Dojo',
      tagline: 'Headquarters & Primary Belt Examination Center',
      address: 'Manaji Nagar, Narhe, Pune, Maharashtra 411041',
      landmark: 'Near Ganpati Mandir, Vasundhara Pre-primary School',
      pincode: '411041',
      phone: '+91 90496 88172',
      timing: 'Mon to Sat: 05:00 PM – 09:30 PM',
      embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224.83810571494917!2d73.82428734320607!3d18.453190649275967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc29527eaea0de1%3A0x92eaea4e93465da7!2sLIONS%20KARATE%20CLUB%20PUNE!5e1!3m2!1sen!2sin!4v1786120515986!5m2!1sen!2sin',
      directGoogleMapsUrl: 'https://maps.app.goo.gl/3XTDzC6wYw5RB6Uk8'
    }
  ];

  const [activeLocation, setActiveLocation] = useState<DojoLocation>(locations[0]);

  return (
    <section className="w-full bg-[#08080a] border-t border-zinc-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" id="dojo-locations-map">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-yellow-500 font-mono text-xs font-bold uppercase tracking-widest mb-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <span>Offline Dojo Locations & Google Maps</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
              Find Our Dojo in Narhe, Pune
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl font-sans">
              Visit Lions Karate Club Pune at our Manaji Nagar (Narhe) dojo. Free trial sessions available for kids & adults!
            </p>
          </div>

          {/* Active Location Badge */}
          <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-900 shrink-0 self-start md:self-auto">
            <MapPin className="w-4 h-4 text-red-500 animate-bounce" />
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-white">
              Narhe - Manaji Nagar Branch
            </span>
          </div>
        </div>

        {/* Map Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column (5 cols): Dojo Details Card */}
          <motion.div
            key={activeLocation.id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-5 bg-[#0e0e10] border border-[#1e1e22] rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
                  Active Training Dojo
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admissions Open</span>
                </span>
              </div>

              <div>
                <h3 className="font-heading text-xl font-black text-white uppercase tracking-wider">
                  {activeLocation.name}
                </h3>
                <p className="text-yellow-500 text-xs font-semibold mt-0.5">
                  {activeLocation.tagline}
                </p>
              </div>

              {/* Address detail list */}
              <div className="space-y-3 pt-2 text-xs font-sans">
                <div className="flex items-start gap-3 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-900">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-zinc-500 font-mono text-[10px] uppercase block font-bold">Street Address</span>
                    <p className="text-zinc-200 font-medium leading-relaxed mt-0.5">
                      {activeLocation.address}
                    </p>
                    <p className="text-zinc-400 text-[11px] mt-1 font-sans">
                      <strong className="text-zinc-300">Landmark:</strong> {activeLocation.landmark}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-900">
                  <Clock className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-zinc-500 font-mono text-[10px] uppercase block font-bold">Training Hours</span>
                    <p className="text-zinc-200 font-medium mt-0.5">
                      {activeLocation.timing}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-900">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-zinc-500 font-mono text-[10px] uppercase block font-bold">Helpline & Admissions</span>
                    <a href={`tel:${activeLocation.phone.replace(/[^0-9]/g, '')}`} className="text-zinc-200 hover:text-yellow-400 font-mono font-semibold block mt-0.5">
                      {activeLocation.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-900">
              <a
                href={activeLocation.directGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-heading text-xs font-black uppercase tracking-wider text-slate-950 bg-yellow-500 hover:bg-yellow-400 px-4 py-3 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/20 active:scale-98 text-center cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>

              <a
                href={activeLocation.directGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-heading text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 px-4 py-3 rounded-xl transition-all text-center cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span>Open Google Maps</span>
              </a>
            </div>

          </motion.div>

          {/* Right Column (7 cols): Responsive Google Maps iframe Container */}
          <div className="lg:col-span-7 bg-[#0e0e10] border border-[#1e1e22] rounded-2xl overflow-hidden min-h-[380px] lg:min-h-[460px] relative shadow-2xl flex flex-col">
            {/* Top Bar inside Map iframe frame */}
            <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold text-zinc-200 uppercase text-[11px] tracking-wider">
                  Live Satellite & Street View Map
                </span>
              </div>
              <a
                href={activeLocation.directGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-yellow-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Google Maps Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Embedded iFrame with Fallback & Interactive Quick Link */}
            <div className="w-full h-full flex-grow relative bg-zinc-950 group">
              <iframe
                key={activeLocation.id}
                title={`Google Map - ${activeLocation.name}`}
                src={activeLocation.embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '380px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full min-h-[380px] grayscale-[15%] contrast-[105%] rounded-b-2xl"
              />

              {/* Bottom Floating Quick Link Badge for seamless mobile navigation */}
              <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-white text-xs font-bold font-heading uppercase block">
                      {activeLocation.name}
                    </span>
                    <span className="text-zinc-400 text-[10px] font-sans block">
                      {activeLocation.landmark}
                    </span>
                  </div>
                </div>

                <a
                  href={activeLocation.directGoogleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 hover:bg-red-500 text-white font-heading font-black text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Open Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
