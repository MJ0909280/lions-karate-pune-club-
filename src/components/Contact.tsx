import React, { useState, useEffect } from 'react';
import { Phone, Mail, Clock, ChevronDown, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Contact() {
  const [openFaqId, setOpenFaqId] = useState<number | null>(0);
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [queryType, setQueryType] = useState('Admissions & Free Trial');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = parentName.trim();
    const cleanPhone = phone.trim();
    const cleanMessage = message.trim() || `Enquiry regarding ${queryType}`;

    if (cleanName.length < 2) {
      setSubmitError('Please enter parent/student name.');
      return;
    }
    if (cleanPhone.length < 5 || cleanPhone.length > 24) {
      setSubmitError('Please enter a valid mobile / WhatsApp number.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const now = Date.now();
      await addDoc(collection(db, 'parent_queries'), {
        parentName: cleanName.slice(0, 120),
        childName: childName.trim().slice(0, 120),
        phone: cleanPhone.slice(0, 24),
        email: email.trim().slice(0, 160),
        queryType: queryType.slice(0, 80),
        message: cleanMessage.slice(0, 2000),
        status: 'new',
        createdAt: now,
        updatedAt: now
      });
      setSubmitSuccess(true);
      setParentName('');
      setChildName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error('Error submitting query:', err);
      setSubmitError('Could not submit query. Please contact us directly on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'What age can children start training?',
      a: 'Students can join from Age 4 onwards in our Little Tigers batch, with separate youth and adult sessions up to black belt level.'
    },
    {
      q: 'Where are the Pune Dojo branches located?',
      a: 'We operate at Manaji Nagar (Vasundhara Pre-Primary School, Narhe), Bhumkar Bridge Road, and Jambulwadi Lake View.'
    },
    {
      q: 'How do parents check Belt Exam results and Roll IDs?',
      a: 'Visit the Student Portal and enter your Roll ID (e.g., LKCP-2026-001) to view belt progress, register for exams, or check results.'
    }
  ];

  useEffect(() => {
    const schemaId = 'json-ld-faq-page';
    let scriptElement = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = schemaId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }
    scriptElement.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a }
      }))
    });
  }, []);

  return (
    <div id="contact" className="space-y-10">
      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-500 font-bold block mb-1.5">
          📞 DOJO DESK &amp; PARENT ENQUIRY
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
          Contact Lions Karate Club Pune
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <a
              href="tel:+919049688172"
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-zinc-800 hover:border-amber-500/40 transition-colors"
            >
              <Phone className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Sensei Direct Phone</span>
                <span className="text-sm font-mono font-bold text-white">+91 90496 88172</span>
              </div>
            </a>

            <a
              href="mailto:LIONSKARATECLUBPUNE09@gmail.com"
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-zinc-800 hover:border-amber-500/40 transition-colors"
            >
              <Mail className="w-4 h-4 text-amber-500" />
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Official Email</span>
                <span className="text-xs font-mono text-white break-all">LIONSKARATECLUBPUNE09@gmail.com</span>
              </div>
            </a>

            <div className="p-3 rounded-xl bg-slate-950 border border-zinc-800 flex items-center gap-3">
              <Clock className="w-4 h-4 text-red-500 shrink-0" />
              <div className="text-xs text-zinc-300">
                <span className="font-bold block text-white">Mon – Sat · 5:00 PM – 9:30 PM</span>
                <span className="text-[11px] text-zinc-400">Evening batches across all Pune branches</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqId === idx;
              return (
                <div key={faq.q} className="bg-slate-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left text-xs font-heading font-bold uppercase text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-zinc-400 border-t border-zinc-800/70 pt-2.5 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-900/50 border border-zinc-800 rounded-2xl p-6">
          {submitSuccess ? (
            <div className="py-10 text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-heading font-black text-lg uppercase text-white">Enquiry Submitted</h3>
              <p className="text-xs text-zinc-400">
                Our Sensei will contact you shortly regarding your Pune dojo enquiry.
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href="https://wa.me/919049688172"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="px-4 py-2.5 rounded-lg bg-slate-950 border border-zinc-800 text-zinc-300 text-xs font-bold cursor-pointer"
                >
                  New Enquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitQuery} className="space-y-4">
              <h3 className="font-heading font-black text-base uppercase tracking-wider text-white">
                Send Parent Enquiry / Book Trial
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Parent / Student Name *"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Mobile / WhatsApp Number *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Child Name & Age (Optional)"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <select
                  value={queryType}
                  onChange={(e) => setQueryType(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="Admissions & Free Trial">Admissions &amp; Free Trial</option>
                  <option value="Fees & Branch Timings">Fees &amp; Branch Timings</option>
                  <option value="Belt Exam Query">Belt Exam Query</option>
                  <option value="General Query">General Query</option>
                </select>
              </div>

              <input
                type="email"
                placeholder="Email Address (Optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />

              <textarea
                rows={3}
                required
                placeholder="Write your question or preferred Pune branch (Manaji Nagar / Bhumkar Bridge / Jambulwadi)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
              />

              {submitError && (
                <p className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg p-2.5">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#9B1B20] hover:bg-red-500 text-white font-heading font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'SUBMITTING...' : 'SUBMIT ENQUIRY'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
