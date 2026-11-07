import React, { useState, useEffect } from 'react';
import { Phone, Mail, Clock, ChevronDown, HelpCircle, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc } from 'firebase/firestore';
import { db, triggerWhatsAppNotification } from '../firebase';

export default function Contact() {
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  // Parent query state variables
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [queryType, setQueryType] = useState('General Query');
  const [message, setMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !phone.trim() || !message.trim()) {
      setSubmitError('Please fill in all required fields (Parent Name, Phone, and Message).');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const queryPayload = {
        parentName: parentName.trim(),
        childName: childName.trim() || '',
        phone: phone.trim(),
        email: email.trim() || '',
        queryType,
        message: message.trim(),
        status: 'new' as const,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await addDoc(collection(db, 'parent_queries'), queryPayload);

      // Trigger automatic real-time WhatsApp alert
      await triggerWhatsAppNotification('inquiry', {
        fullName: parentName.trim(),
        phone: phone.trim(),
        batch: queryType,
        branch: `Child: ${childName.trim() || 'N/A'}. Msg: ${message.trim().substring(0, 50)}`
      });

      setSubmitSuccess(true);
      setParentName('');
      setChildName('');
      setPhone('');
      setEmail('');
      setQueryType('General Query');
      setMessage('');

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('Error submitting query:', err);
      setSubmitError('Failed to send enquiry. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactDetails = [
    {
      icon: <Phone className="w-5 h-5 text-yellow-500" />,
      title: "Talk To Us",
      val: "+91 90496 88172_admissions",
      clickUrl: "tel:9049688172"
    },
    {
      icon: <Mail className="w-5 h-5 text-yellow-500" />,
      title: "Write An Email",
      val: "LIONSKARATECLUBPUNE09@gmail.com",
      clickUrl: "mailto:LIONSKARATECLUBPUNE09@gmail.com"
    }
  ];

  const operatingHours = [
    { day: "Mon, Wed, Fri", hours: "04:30 PM – 09:30 PM" },
    { day: "Tue, Thu", hours: "05:00 PM – 09:30 PM" },
    { day: "Saturday", hours: "09:00 AM – 03:00 PM" },
    { day: "Sunday", hours: "Closed" }
  ];

  const faqs = [
    {
      q: "What age can children start training at Lions Karate Club Pune?",
      a: "We accept children starting from 4 years of age. Our training curriculum is specifically tailored into age-appropriate, safe, and exciting modules to build active focus, concentration, physical stamina, and confidence."
    },
    {
      q: "Is martial arts training safe for young boys and girls?",
      a: "Absolute physical safety is our core mandate. We utilize official protective gear, safe high-density tatami training mats, and conduct all drills under the close supervision of internationally certified Black Belt Senseis."
    },
    {
      q: "Where are your offline dojo branches in Pune?",
      a: "Our main operational dojo locations are situated in Narhe (near Bhumkar Chowk, beside Silver Birch Hospital), Katraj/Duttanagar, and Jambulwadi Lake View. We serve parents and students from across Pune's prime residential hubs."
    },
    {
      q: "Do you provide WKF approved belt certifications?",
      a: "Yes, indeed. Lions Karate Club Pune is affiliated with national and international standard karate associations. All belt promotion examinations, ranks, and certificates conform strictly to World Karate Federation (WKF) and traditional Shotokan guidelines."
    },
    {
      q: "Can parents watch classes or attend trial drills?",
      a: "Yes, we encourage parents to attend and witness their children's focus, discipline, and coordination growth first-hand. We have dedicated seating spaces at all our offline dojo branches."
    }
  ];

  // Inject structured FAQPage JSON-LD dynamic markup for search crawler and LLMs
  useEffect(() => {
    const schemaId = 'json-ld-faq-page';
    let scriptElement = document.getElementById(schemaId) as HTMLScriptElement;
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = schemaId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };

    scriptElement.textContent = JSON.stringify(faqSchema);

    return () => {
      // Dynamic updates handle overwrite cleanly
    };
  }, []);

  return (
    <div className="relative py-4">
      <div className="w-full">

        {/* Info Grid: Center contact workspace */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4 mb-16">
          
          {/* Left Column (span 5): Contact Channels and Operating Hours stacked */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Contact Channels card */}
            <div className="bg-[#0f0e0f] border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="font-title text-base sm:text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-yellow-500 rounded-sm"></span>
                  Contact Channels
                </h3>
                <p className="text-zinc-500 text-xs leading-relaxed font-sans">
                  Whether you have queries regarding children's programs, fees, trial drills, or belt rank tests, our team is happy to assist.
                </p>
              </div>

              {/* Direct buttons/cards */}
              <div className="space-y-4">
                {contactDetails.map((item, id) => (
                  <a 
                    key={id}
                    href={item.clickUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-4 bg-zinc-950/50 border border-zinc-900 p-4 rounded-xl hover:border-yellow-500/30 hover:bg-zinc-900/40 transition-all cursor-pointer group"
                  >
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-zinc-800 group-hover:text-yellow-400 transition-colors shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-black text-[10px] uppercase text-zinc-500 tracking-wider">
                        {item.title}
                      </h4>
                      <span className="text-zinc-200 text-xs sm:text-sm font-semibold mt-0.5 block group-hover:text-yellow-500 transition-colors break-all">
                        {item.val === "+91 90496 88172_admissions" ? "9049688172" : item.val}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Training periods card */}
            <div className="bg-[#0f0e0f] border border-zinc-900 p-6 rounded-2xl flex flex-col justify-center">
              <div className="flex items-center space-x-2 text-yellow-500 mb-4">
                <Clock className="w-5 h-5 animate-pulse" />
                <h3 className="font-title text-base sm:text-lg font-extrabold text-white uppercase tracking-wider">TRAINING PERIODS</h3>
              </div>
              
              <p className="text-zinc-500 text-xs leading-relaxed font-sans mb-4">
                Selected program batches are available at dedicated times throughout the week.
              </p>

              <div className="space-y-2.5">
                {operatingHours.map((oh, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-2 border-b border-zinc-900/80 font-sans last:border-0 last:pb-0">
                    <span className="font-medium text-zinc-450">{oh.day}</span>
                    <span className="font-mono text-[11px] text-zinc-400 bg-zinc-950/80 border border-zinc-900/80 px-2 py-0.5 rounded">
                      {oh.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (span 7): Parents Quick Enquiry Form */}
          <div className="lg:col-span-7 bg-[#0f0e0f] border border-zinc-900 p-6 sm:p-8 rounded-2xl relative flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center text-center py-12 px-4 h-full"
                >
                  <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-full border border-emerald-500/20 mb-6">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="font-title text-lg sm:text-2xl font-black text-white uppercase tracking-wider mb-3">
                    Query Submitted Successfully!
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-sm max-w-md leading-relaxed font-sans">
                    Thank you! Your online query has been registered in our portal. Dojo Administrators and Coaches have been alerted via WhatsApp and will connect with you shortly.
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-8 font-heading font-extrabold text-xs uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-5 py-3 rounded-lg cursor-pointer transition-colors"
                  >
                    Send Another Query
                  </button>
                </motion.div>
              ) : (
                <motion.form 
                  onSubmit={handleSubmitQuery}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2 text-yellow-500 mb-1">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-title text-base sm:text-lg font-extrabold text-white uppercase tracking-wider">
                      Parents Online Query Desk
                    </h3>
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed font-sans mb-4">
                    Have questions about fees, timings, or belts? Type them in below. Submissions are processed instantly and are reviewed directly by the chief administrators.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Parent Name */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 font-bold">
                        Parent / Guardian Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full text-xs font-sans text-zinc-200 bg-zinc-950/80 border border-zinc-900 rounded-lg p-3 focus:border-yellow-500/50 focus:outline-none focus:ring-0 transition-colors"
                        required
                      />
                    </div>

                    {/* Student Name */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 font-bold">
                        Child's Name <span className="text-zinc-650 text-[9px] font-normal">(Optional)</span>
                      </label>
                      <input 
                        type="text"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="e.g. Aarav Kumar"
                        className="w-full text-xs font-sans text-zinc-200 bg-zinc-950/80 border border-zinc-900 rounded-lg p-3 focus:border-yellow-500/50 focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Number */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 font-bold">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full text-xs font-sans text-zinc-200 bg-zinc-950/80 border border-zinc-900 rounded-lg p-3 focus:border-yellow-500/50 focus:outline-none focus:ring-0 transition-colors"
                        required
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 font-bold">
                        Email Address <span className="text-zinc-650 text-[9px] font-normal">(Optional)</span>
                      </label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@domain.com"
                        className="w-full text-xs font-sans text-zinc-200 bg-zinc-950/80 border border-zinc-900 rounded-lg p-3 focus:border-yellow-500/50 focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Query Type */}
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 font-bold">
                      Query Topic / category <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={queryType}
                      onChange={(e) => setQueryType(e.target.value)}
                      className="w-full text-xs font-sans text-zinc-300 bg-zinc-950 border border-zinc-900 rounded-lg p-3 focus:border-yellow-500/50 focus:outline-none focus:ring-0 transition-colors cursor-pointer"
                    >
                      <option value="General Query">General Query & Timings</option>
                      <option value="Admission Enquiry">Admission & Trial Sessions</option>
                      <option value="Fees & Billing Query">Monthly Tuition & Fees Structure</option>
                      <option value="Belt Exam & Promotions">Belt Grading Exams & Promotion</option>
                      <option value="Complaints or Feedback">Complaints or Feedback</option>
                      <option value="Other">Other Query</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5 font-bold">
                      Detail Query / Questions <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your query or message in detail so our head instructor can prepare a helpful answer before calling you back..."
                      rows={4}
                      className="w-full text-xs font-sans text-zinc-200 bg-zinc-950/80 border border-zinc-900 rounded-lg p-3 focus:border-yellow-500/50 focus:outline-none focus:ring-0 transition-colors resize-none"
                      required
                    ></textarea>
                  </div>

                  {submitError && (
                    <p className="text-red-500 font-sans text-[11px] font-semibold bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 font-heading font-black text-xs text-slate-950 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 px-5 py-3.5 rounded-lg shadow-lg hover:shadow-yellow-500/20 active:scale-98 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting Query...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Enquiry Online</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* ============ NEW SEO & AI SEARCH ACCORDION SECTION ============ */}
        <div className="max-w-3xl mx-auto border-t border-zinc-900/80 pt-16" id="faq-section">
          <div className="text-center mb-10">
            <div className="flex justify-center items-center gap-1.5 text-yellow-500 text-xs font-bold uppercase tracking-widest font-mono mb-2">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Dojo FAQ & Answers</span>
            </div>
            <h3 className="font-heading text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
              Common Parental Concerns
            </h3>
            <p className="text-zinc-500 text-xs mt-1.5 max-w-md mx-auto">
              Snappy information parsed and ready for direct access by search crawlers and parent inquiries.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqId === index;
              return (
                <div 
                  key={index}
                  className="bg-[#0f0e0f] border border-zinc-900 rounded-xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4.5 text-left font-heading text-xs sm:text-sm font-bold text-zinc-200 hover:text-yellow-500 select-none cursor-pointer group"
                    id={`faq-btn-${index}`}
                  >
                    <span className="pr-4 leading-normal">{faq.q}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 450, damping: 18 }}
                      className="shrink-0 bg-zinc-950 p-1.5 rounded-lg border border-zinc-900 group-hover:border-yellow-500/20 text-zinc-500 group-hover:text-yellow-500"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ 
                          height: { type: "spring", stiffness: 400, damping: 22, mass: 0.8 },
                          opacity: { duration: 0.2 }
                        }}
                      >
                        <div className="p-4.5 pt-0 text-zinc-400 text-xs sm:text-[13px] leading-relaxed font-sans border-t border-zinc-900/50">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
