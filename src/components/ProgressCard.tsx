import { useRef, useState, useEffect } from 'react';
import { Admission } from '../types';
import { Download, Share2, Sparkles, X, Award, Check, RefreshCw, Trophy, Star, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_STUDENT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23111'><rect width='100' height='100' fill='%231a1a1a'/><circle cx='50' cy='35' r='14' fill='%23c9a96e'/><path d='M50 50 L35 75 L30 73 L42 53 L38 50 L30 55 L28 50 L40 42 Z' fill='%23fff'/><path d='M50 50 L65 80 L72 82 L58 55 L65 48 L75 52 L78 47 L60 40 Z' fill='%23fff'/><path d='M42 45 H58 V49 H42 Z' fill='%239B1B20'/></svg>";

interface ProgressCardProps {
  admission: Admission;
  onClose: () => void;
}

type CardStyle = 'imperial-gold' | 'crimson-tiger' | 'zen-white' | 'midnight-jade';

interface StylePreset {
  id: CardStyle;
  name: string;
  bgClass: string;
  borderClass: string;
  textColor: string;
  subtitleColor: string;
  accentColor: string;
  quoteBoxBg: string;
  canvasBg: string;
  canvasBorder: string;
  canvasAccent: string;
  canvasQuoteBg: string;
  canvasText: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'imperial-gold',
    name: 'Imperial Gold',
    bgClass: 'bg-zinc-950 border border-yellow-500/20 text-white',
    borderClass: 'border-yellow-500',
    textColor: 'text-yellow-500',
    subtitleColor: 'text-zinc-400',
    accentColor: '#EAB308', // yellow-500
    quoteBoxBg: 'bg-yellow-500/5 border border-yellow-500/10',
    canvasBg: '#09090b', // zinc-950
    canvasBorder: '#EAB308',
    canvasAccent: '#EAB308',
    canvasQuoteBg: 'rgba(234, 179, 8, 0.05)',
    canvasText: '#ffffff'
  },
  {
    id: 'crimson-tiger',
    name: 'Crimson Tiger',
    bgClass: 'bg-slate-950 border border-rose-500/20 text-white',
    borderClass: 'border-rose-600',
    textColor: 'text-rose-500',
    subtitleColor: 'text-slate-400',
    accentColor: '#E11D48', // rose-600
    quoteBoxBg: 'bg-rose-500/5 border border-rose-500/10',
    canvasBg: '#020617', // slate-950
    canvasBorder: '#E11D48',
    canvasAccent: '#E11D48',
    canvasQuoteBg: 'rgba(225, 29, 72, 0.05)',
    canvasText: '#ffffff'
  },
  {
    id: 'zen-white',
    name: 'Zen White',
    bgClass: 'bg-white border border-zinc-200 text-zinc-900',
    borderClass: 'border-zinc-900',
    textColor: 'text-zinc-900',
    subtitleColor: 'text-zinc-650',
    accentColor: '#18181b', // zinc-900
    quoteBoxBg: 'bg-zinc-50 border border-zinc-200/80',
    canvasBg: '#ffffff',
    canvasBorder: '#18181b',
    canvasAccent: '#18181b',
    canvasQuoteBg: '#f4f4f5', // zinc-100
    canvasText: '#18181b'
  },
  {
    id: 'midnight-jade',
    name: 'Midnight Jade',
    bgClass: 'bg-zinc-950 border border-emerald-500/20 text-white',
    borderClass: 'border-emerald-500',
    textColor: 'text-emerald-400',
    subtitleColor: 'text-zinc-400',
    accentColor: '#10B981', // emerald-500
    quoteBoxBg: 'bg-emerald-500/5 border border-emerald-500/10',
    canvasBg: '#09090b', // zinc-950
    canvasBorder: '#10B981',
    canvasAccent: '#10B981',
    canvasQuoteBg: 'rgba(16, 185, 129, 0.05)',
    canvasText: '#ffffff'
  }
];

const COMPLIMENT_SUGGESTIONS = [
  "Outstanding focus, grit, and dedication in Shotokan Kata forms this week!",
  "Excellent sparring spirit, high discipline, and remarkable technique on the mat!",
  "Showing pure martial arts virtue: incredible patience, respect, and rapid progress!",
  "Great accuracy in speed trials and flawless technical stance control today!",
  "Always leading by example with tireless energy, effort, and respectful kiai!",
  "A masterful performance in basic drills and outstanding grading confidence!"
];

const ACHIEVEMENT_TYPES = [
  "Kata Excellence",
  "Kumite Champion",
  "Discipline & Focus",
  "Weekly Star Performer",
  "Outstanding Effort",
  "Tenacity & Spirit"
];

const SENSEI_SIGNATURES = [
  "Sensei Maruti Jadhav",
  "Sensei Shivraj Jejure",
  "Sensei Shital Samindar"
];

export default function ProgressCard({ admission, onClose }: ProgressCardProps) {
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('imperial-gold');
  const [achievementType, setAchievementType] = useState<string>('Weekly Star Performer');
  const [compliment, setCompliment] = useState<string>(COMPLIMENT_SUGGESTIONS[0]);
  const [signature, setSignature] = useState<string>(SENSEI_SIGNATURES[0]);
  const [customCompliment, setCustomCompliment] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  const activePreset = STYLE_PRESETS.find(p => p.id === selectedStyle) || STYLE_PRESETS[0];

  const handleDownload = () => {
    setDownloading(true);
    const canvas = document.createElement('canvas');
    const scaleFactor = 4; // High resolution rendering
    canvas.width = 420 * scaleFactor;
    canvas.height = 580 * scaleFactor;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setDownloading(false);
      return;
    }

    ctx.scale(scaleFactor, scaleFactor);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw background
    ctx.fillStyle = activePreset.canvasBg;
    ctx.fillRect(0, 0, 420, 580);

    // Thick custom styled border
    ctx.strokeStyle = activePreset.canvasBorder;
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 420, 580);

    // Inside decorative thin border
    ctx.strokeStyle = selectedStyle === 'zen-white' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 14, 392, 552);

    // Load LIONS LOGO
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';

    const drawAllContent = () => {
      // 1. Header Area
      try {
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          ctx.drawImage(logoImg, 30, 26, 44, 44);
        } else {
          // Fallback solid badge if image fails
          ctx.fillStyle = activePreset.canvasBorder;
          ctx.beginPath();
          ctx.arc(52, 48, 20, 0, Math.PI * 2);
          ctx.fill();
        }
      } catch (e) {
        // Fallback
        ctx.fillStyle = activePreset.canvasBorder;
        ctx.beginPath();
        ctx.arc(52, 48, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = activePreset.canvasText;
      ctx.font = '900 12px "Space Grotesk", "Outfit", sans-serif';
      ctx.fillText("LIONS KARATE CLUB PUNE", 86, 40);

      ctx.fillStyle = selectedStyle === 'zen-white' ? '#52525b' : '#a1a1aa'; // zinc text
      ctx.font = '700 7.5px "JetBrains Mono", monospace';
      ctx.fillText("AFFILIATED TO KAI NATIONAL & WKF", 86, 54);

      // 2. Main Title/Badge (Weekly Star, etc.)
      ctx.textAlign = 'center';
      ctx.fillStyle = activePreset.canvasBorder;
      ctx.font = '900 18px "Space Grotesk", sans-serif';
      ctx.fillText(achievementType.toUpperCase(), 210, 105);

      // Subtitle
      ctx.fillStyle = selectedStyle === 'zen-white' ? '#27272a' : '#e4e4e7';
      ctx.font = '500 9px "Outfit", sans-serif';
      ctx.fillText("WEEKLY RECOGNITION OF HONOR & DISCIPLINE", 210, 122);

      // 3. Student Photo and Bio Section
      const studentImg = new Image();
      studentImg.crossOrigin = 'anonymous';
      studentImg.onload = () => {
        // Draw elegant circular frame or rounded rectangle for Student Photo
        const photoX = 160;
        const photoY = 145;
        const photoSize = 100;

        ctx.save();
        // Create circle clip path
        ctx.beginPath();
        ctx.arc(210, photoY + (photoSize / 2), photoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw image
        ctx.drawImage(studentImg, photoX, photoY, photoSize, photoSize);
        ctx.restore();

        // Portrait Outer Stroke Ring
        ctx.strokeStyle = activePreset.canvasBorder;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(210, photoY + (photoSize / 2), (photoSize / 2) + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Student bio text details
        ctx.textAlign = 'center';
        ctx.fillStyle = activePreset.canvasText;
        ctx.font = '900 16px "Space Grotesk", sans-serif';
        ctx.fillText(admission.fullName.toUpperCase(), 210, 275);

        // Belt level & Branch Info
        ctx.fillStyle = activePreset.canvasBorder;
        ctx.font = 'bold 10px "Outfit", sans-serif';
        ctx.fillText(admission.beltLevel.toUpperCase(), 210, 292);

        ctx.fillStyle = selectedStyle === 'zen-white' ? '#71717a' : '#a1a1aa';
        ctx.font = '500 8.5px "Outfit", sans-serif';
        ctx.fillText(`${admission.batch} • ${admission.branch || 'Manaji Nagar Branch'}`, 210, 306);

        // 4. Compliment Quote block
        const quoteBoxY = 325;
        const quoteBoxHeight = 115;
        const quoteBoxWidth = 360;
        const quoteBoxX = 30;

        // Draw Quote Box background
        ctx.fillStyle = activePreset.canvasQuoteBg;
        ctx.fillRect(quoteBoxX, quoteBoxY, quoteBoxWidth, quoteBoxHeight);
        
        ctx.strokeStyle = selectedStyle === 'zen-white' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(quoteBoxX, quoteBoxY, quoteBoxWidth, quoteBoxHeight);

        // Quote Marks
        ctx.fillStyle = activePreset.canvasBorder;
        ctx.font = 'bold italic 28px Georgia, serif';
        ctx.fillText("“", quoteBoxX + 22, quoteBoxY + 32);

        // Wrap Text Function
        ctx.fillStyle = selectedStyle === 'zen-white' ? '#18181b' : '#ffffff';
        ctx.font = 'italic 500 10.5px Georgia, "Times New Roman", serif';
        
        const textX = 210;
        let textY = quoteBoxY + 44;
        const maxWidth = 300;
        const lineHeight = 16;
        
        const words = compliment.split(' ');
        let line = '';
        const lines = [];

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        // Align center for custom quotes
        ctx.textAlign = 'center';
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i].trim(), textX, textY);
          textY += lineHeight;
        }

        ctx.fillStyle = activePreset.canvasBorder;
        ctx.font = 'bold italic 28px Georgia, serif';
        ctx.fillText("”", quoteBoxX + quoteBoxWidth - 22, textY - 6);

        // 5. Footer & Signature
        // Signature Line left
        ctx.strokeStyle = selectedStyle === 'zen-white' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, 480);
        ctx.lineTo(390, 480);
        ctx.stroke();

        // Signature on right
        ctx.textAlign = 'right';
        ctx.fillStyle = activePreset.canvasText;
        ctx.font = 'italic bold 11px Georgia, "Times New Roman", serif';
        ctx.fillText(signature, 380, 514);

        ctx.fillStyle = selectedStyle === 'zen-white' ? '#71717a' : '#a1a1aa';
        ctx.font = '900 6px "JetBrains Mono", monospace';
        ctx.fillText("CHIEF INSTRUCTOR • LIONS CLUB", 380, 526);

        // Digital badge on left
        ctx.textAlign = 'left';
        ctx.fillStyle = activePreset.canvasBorder;
        ctx.font = 'bold 8px "Outfit", sans-serif';
        ctx.fillText("🥋 HONORED ACHIEVER", 40, 514);

        ctx.fillStyle = selectedStyle === 'zen-white' ? '#71717a' : '#a1a1aa';
        ctx.font = '500 7px "Outfit", sans-serif';
        ctx.fillText(`DATE: ${new Date().toLocaleDateString('en-GB')}`, 40, 526);

        // QR verification text
        ctx.textAlign = 'center';
        ctx.fillStyle = selectedStyle === 'zen-white' ? '#a1a1aa' : '#52525b';
        ctx.font = 'bold 6.5px "JetBrains Mono", monospace';
        ctx.fillText(`VERIFIED DOJO PROGRESS CAMPAIGN PORTAL • STUDENT ID: ${admission.studentId}`, 210, 554);

        // Save as PNG
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${admission.fullName.split(' ')[0]}-Progress-Card.png`;
        link.href = dataUrl;
        link.click();
        
        setDownloading(false);
      };

      studentImg.onerror = () => {
        if (studentImg.src !== DEFAULT_STUDENT_AVATAR) {
          studentImg.src = DEFAULT_STUDENT_AVATAR;
        }
      };
      studentImg.src = admission.photoUrl || DEFAULT_STUDENT_AVATAR;
    };

    logoImg.onload = drawAllContent;
    logoImg.onerror = drawAllContent;
    // Lions Karate Club custom brand logo
    logoImg.src = "https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg";
  };

  const handleShareWhatsApp = () => {
    const text = `Hi Parent! Proudly sharing the weekly achievement card for our karate star *${admission.fullName}*! 🥋⭐\n\n_${achievementType}_: "${compliment}"\n\nLog in to our student portal to check daily attendance and class notifications! https://lionskarate.co`;
    
    let rawPhone = admission.phone || admission.whatsApp || '';
    let cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
    if (cleanPhone.startsWith('910') && cleanPhone.length === 13) {
      cleanPhone = '91' + cleanPhone.substring(3);
    } else if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    
    const link = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    window.open(link, '_blank');
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-1 max-w-5xl mx-auto text-left">
      
      {/* Controls panel: 1/2 size (placed 2nd on mobile, 1st on desktop) */}
      <div className="flex-1 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-zinc-850/80 space-y-4 sm:space-y-5 order-2 lg:order-1">
        <div>
          <span className="text-[9px] font-mono font-bold text-yellow-500 uppercase tracking-widest block mb-1">CREATIVE BUILDER</span>
          <h3 className="font-heading font-black text-white text-base sm:text-lg uppercase tracking-wider">Customize Progress Card</h3>
          <p className="text-zinc-450 text-xs mt-0.5">Edit credentials, select preset templates, and download or directly dispatch to WhatsApp.</p>
        </div>

        {/* 1. Theme style Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Card Theme Style</label>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedStyle(preset.id)}
                className={`p-2.5 sm:p-3 rounded-xl border text-xs font-heading font-black uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                  selectedStyle === preset.id 
                    ? 'bg-slate-950 border-yellow-500 text-yellow-500 shadow-md shadow-yellow-500/5' 
                    : 'bg-slate-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <span>{preset.name}</span>
                <div 
                  className="w-3 h-3 rounded-full border border-black/35"
                  style={{ backgroundColor: preset.id === 'zen-white' ? '#18181b' : preset.accentColor }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* 2. Achievement Badge Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Achievement Title</label>
          <div className="grid grid-cols-2 gap-1.5">
            {ACHIEVEMENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAchievementType(type)}
                className={`py-2 px-2.5 rounded-lg border text-[10px] text-center font-heading font-black uppercase tracking-wide transition-all cursor-pointer ${
                  achievementType === type
                    ? 'bg-yellow-500 border-yellow-500 text-slate-950 font-black'
                    : 'bg-slate-950/30 border-zinc-850 text-zinc-500 hover:text-white hover:border-zinc-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Compliment Text and Suggestions */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Weekly Compliment Statement</label>
            <button
              type="button"
              onClick={() => setCustomCompliment(!customCompliment)}
              className="text-[9px] font-heading font-black uppercase tracking-wider text-yellow-500 hover:text-yellow-400 cursor-pointer"
            >
              {customCompliment ? "Select Preset" : "Write Custom"}
            </button>
          </div>

          {!customCompliment ? (
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {COMPLIMENT_SUGGESTIONS.map((presetQuote, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCompliment(presetQuote)}
                  className={`w-full p-2.5 rounded-lg border text-left text-[11px] leading-relaxed transition-all block cursor-pointer ${
                    compliment === presetQuote
                      ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400 font-medium'
                      : 'bg-slate-950/30 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-800'
                  }`}
                >
                  "{presetQuote}"
                </button>
              ))}
            </div>
          ) : (
            <textarea
              rows={3}
              value={compliment}
              onChange={(e) => setCompliment(e.target.value)}
              placeholder="Type your warm personal compliment statement here..."
              maxLength={150}
              className="w-full bg-slate-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-yellow-500 tracking-wide font-sans leading-relaxed"
            />
          )}
        </div>

        {/* 4. Instructor Signature */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Sensei Digital Signature</label>
          <div className="grid grid-cols-2 gap-2">
            {SENSEI_SIGNATURES.map((sig) => (
              <button
                key={sig}
                type="button"
                onClick={() => setSignature(sig)}
                className={`py-2 px-3 rounded-lg border text-[10px] font-heading font-bold uppercase tracking-wide transition-all cursor-pointer ${
                  signature === sig
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                    : 'bg-slate-950/30 border-zinc-850 text-zinc-500 hover:text-white'
                }`}
              >
                {sig}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-zinc-850/60 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-slate-950 font-heading font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-yellow-500/5 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>GENERATING...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-950" />
                <span>DOWNLOAD (PNG)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{shareSuccess ? "DISPATCHED!" : "SHARE WHATSAPP"}</span>
          </button>
        </div>
      </div>

      {/* Card Preview Area (placed 1st on mobile, 2nd on desktop) */}
      <div className="w-full lg:w-[420px] shrink-0 flex flex-col items-center order-1 lg:order-2 mb-2 lg:mb-0">
        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-2">WYSIWYG REALTIME PREVIEW</span>
        
        {/* The Card container */}
        <div 
          className={`w-full max-w-[400px] aspect-[420/580] rounded-2xl p-4 flex flex-col justify-between shadow-2xl overflow-hidden transition-all duration-300 ${activePreset.bgClass}`}
          style={{ borderSize: '12px' }}
        >
          {/* Header area */}
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-850/10">
            <div className="flex items-center space-x-3 text-left">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedStyle === 'zen-white' ? 'bg-zinc-100 border border-zinc-200' : 'bg-slate-950 border border-zinc-800'}`}>
                <img 
                  src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg" 
                  alt="Lions Logo" 
                  className="w-8 h-8 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-[11px] font-heading font-black uppercase tracking-wider leading-none">Lions Karate Club</h4>
                <span className="text-[8px] font-mono font-bold text-zinc-500 block uppercase tracking-widest mt-0.5">PUNE • ESTD. 2023</span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Award className={`w-5 h-5 ${selectedStyle === 'zen-white' ? 'text-zinc-900' : 'text-yellow-500'}`} />
            </div>
          </div>

          {/* Achievement Title Block */}
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-1 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/15">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              <span className="text-[8.5px] font-heading font-black text-yellow-500 uppercase tracking-widest">HONOR SCHOLAR</span>
            </div>
            <h2 className={`font-heading font-black text-lg uppercase tracking-wider mt-1 leading-tight ${activePreset.textColor}`}>
              {achievementType}
            </h2>
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 block font-bold">
              DOJO ACHIEVEMENT STANDARD
            </span>
          </div>

          {/* Student details block */}
          <div className="flex flex-col items-center py-1">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-950/40 border-2 border-yellow-500/50 shadow-inner">
                <img 
                  src={admission.photoUrl || DEFAULT_STUDENT_AVATAR} 
                  alt="Student portrait" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-slate-950 p-1 rounded-full shadow-lg">
                <Trophy className="w-3 h-3" />
              </div>
            </div>

            <div className="text-center mt-2">
              <h3 className="font-heading font-black text-sm uppercase tracking-wider">{admission.fullName}</h3>
              <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest block font-sans mt-0.5">
                {admission.beltLevel}
              </span>
              <span className="text-[8.5px] font-mono text-zinc-500 block mt-0.5">
                {admission.batch} • {admission.branch || 'Manaji Nagar Branch'}
              </span>
            </div>
          </div>

          {/* Quotation text block */}
          <div className={`p-3.5 rounded-xl ${activePreset.quoteBoxBg} relative text-center`}>
            <span className={`absolute -top-2 left-4 text-3xl font-serif italic ${selectedStyle === 'zen-white' ? 'text-zinc-200' : 'text-zinc-800'}`}>“</span>
            <p className="text-[10px] italic leading-relaxed text-zinc-300 font-sans tracking-wide px-2 py-0.5 font-medium">
              {compliment}
            </p>
            <span className="text-[9px] font-mono font-bold text-yellow-500 block text-right uppercase tracking-widest mt-1.5">
              - {signature}
            </span>
          </div>

          {/* Footer branding details */}
          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-850/10 text-[7px] font-mono text-zinc-500">
            <span>VERIFIED DOJO PROGRESS CARD</span>
            <span className="font-bold">STUDENT ID: {admission.studentId}</span>
          </div>

        </div>
      </div>

    </div>
  );
}
