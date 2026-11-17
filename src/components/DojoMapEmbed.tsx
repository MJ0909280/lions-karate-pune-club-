import { MapPin, Navigation, Phone, Clock } from 'lucide-react';

export default function DojoMapEmbed() {
  const branches = [
    {
      name: 'Manaji Nagar Branch (HQ)',
      address: 'Vasundhara Pre-Primary School, Near Ganpati Mandir, Manaji Nagar, Narhe, Pune 411041',
      coach: 'Sensei Maruti Jadhav (2nd Dan)',
      timing: 'Mon – Sat · 5:00 PM – 9:30 PM'
    },
    {
      name: 'Bhumkar Bridge Branch',
      address: 'Bhumkar Bridge Road, Narhe, Pune 411041',
      coach: 'Sensei Shivraj Jejure (2nd Dan)',
      timing: 'Evening Batches · Mon – Sat'
    },
    {
      name: 'Jambulwadi Lake View Branch',
      address: 'Ambegaon-Narhe Bypass, Jambulwadi Lake View, Pune 411041',
      coach: 'Sensei Shital Samindar (1st Dan)',
      timing: 'Evening Batches · Mon – Sat'
    }
  ];

  const embedUrl =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224.83810571494917!2d73.82428734320607!3d18.453190649275967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc29527eaea0de1%3A0x92eaea4e93465da7!2sLIONS%20KARATE%20CLUB%20PUNE!5e1!3m2!1sen!2sin!4v1786120515986!5m2!1sen!2sin';
  const directMapsUrl = 'https://maps.app.goo.gl/3XTDzC6wYw5RB6Uk8';

  return (
    <section
      id="dojo-locations-map"
      className="py-16 bg-slate-950 border-t border-zinc-900 no-print"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-500 font-bold block mb-1.5">
              📍 PUNE DOJO LOCATIONS
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
              Visit Our Narhe &amp; South Pune Centers
            </h2>
          </div>

          <a
            href={directMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-heading font-bold uppercase bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded transition-colors self-start"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Google Maps</span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 flex flex-col gap-4">
            {branches.map((branch) => (
              <div
                key={branch.name}
                className="bg-slate-900/50 border border-zinc-800 rounded-xl p-4 space-y-1.5"
              >
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-heading text-sm font-black uppercase text-white">
                      {branch.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{branch.address}</p>
                    <p className="text-[11px] font-mono text-amber-400 mt-1">
                      {branch.coach} • {branch.timing}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-slate-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-2 text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Free Trial Classes Daily</span>
              </span>
              <a
                href="tel:+919049688172"
                className="inline-flex items-center gap-1.5 font-mono font-bold text-white hover:text-amber-400"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>+91 90496 88172</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900/50 border border-zinc-800 rounded-2xl overflow-hidden min-h-[340px]">
            <iframe
              title="Lions Karate Club Pune Headquarters Map"
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '340px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full min-h-[340px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
