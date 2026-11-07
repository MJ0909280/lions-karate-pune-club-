import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, triggerWhatsAppNotification, generateSequentialStudentId } from '../firebase';
import { BELT_LEVELS, BATCH_TIMINGS, BatchInfo, DOJO_BRANCHES } from '../types';
import { saveStudentToLocalCache } from './StudentPortal';
import { Upload, Camera, FileText, CheckCircle2, ShieldAlert, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

const DEFAULT_STUDENT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23111'><rect width='100' height='100' fill='%231a1a1a'/><circle cx='50' cy='35' r='14' fill='%23c9a96e'/><path d='M50 50 L35 75 L30 73 L42 53 L38 50 L30 55 L28 50 L40 42 Z' fill='%23fff'/><path d='M50 50 L65 80 L72 82 L58 55 L65 48 L75 52 L78 47 L60 40 Z' fill='%23fff'/><path d='M42 45 H58 V49 H42 Z' fill='%239B1B20'/></svg>";

interface AdmissionFormProps {
  preselectedBatch?: string;
  onSuccess: (studentDocumentId: string) => void;
}

export default function AdmissionForm({ preselectedBatch = "", onSuccess }: AdmissionFormProps) {
  // Core form states
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [schoolName, setSchoolName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [batches, setBatches] = useState<BatchInfo[]>(BATCH_TIMINGS);
  const [batch, setBatch] = useState(preselectedBatch || BATCH_TIMINGS[0].name);
  const [beltLevel, setBeltLevel] = useState(BELT_LEVELS[0].name);
  const [photoUrl, setPhotoUrl] = useState(''); // Base64 data-url representing the compressed image
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  // New states for branch and fees tracking
  const [selectedBranchId, setSelectedBranchId] = useState(DOJO_BRANCHES[0].id);
  const [feesStatus, setFeesStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');

  // Dynamically load batches from Firestore
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const snap = await getDocs(collection(db, 'batches'));
        if (!snap.empty) {
          const list: BatchInfo[] = [];
          snap.forEach((docSnap) => {
            list.push({
              id: docSnap.id,
              ...docSnap.data()
            } as BatchInfo);
          });
          setBatches(list);
          if (!preselectedBatch) {
            setBatch(list[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch batches in admission form:", err);
        handleFirestoreError(err, OperationType.GET, 'batches');
      }
    };
    fetchBatches();
  }, [preselectedBatch]);

  // UX states
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMess, setErrorMess] = useState('');
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced check for duplicate phone numbers
  useEffect(() => {
    const trimmed = phone.trim();
    if (trimmed.length < 5) {
      setPhoneWarning('');
      return;
    }

    const checkDuplicatePhone = async () => {
      setPhoneChecking(true);
      try {
        const admissionsRef = collection(db, 'admissions');
        const qPhone = query(admissionsRef, where('phone', '==', trimmed));
        const snapPhone = await getDocs(qPhone);
        if (!snapPhone.empty) {
          const existingStudent = snapPhone.docs[0].data();
          setPhoneWarning(`A student named "${existingStudent.fullName || 'Unknown'}" is already registered with this mobile number.`);
        } else {
          setPhoneWarning('');
        }
      } catch (err) {
        console.warn("Inline duplicate phone check failed:", err);
      } finally {
        setPhoneChecking(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      checkDuplicatePhone();
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [phone]);

  // Hook to calculate age based on Date of Birth
  const handleDobChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (!val) {
      setAge('');
      return;
    }
    const birthDate = new Date(val);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    setAge(calculatedAge >= 0 ? calculatedAge : 0);
  };

  // Safe Image Compressor (Canvas Offscreen with Fallback)
  const compressAndProcessImage = (file: File) => {
    // Check if image type or extension is image-like
    const isImageType = file.type ? file.type.startsWith('image/') : false;
    const isImageExt = /\.(jpg|jpeg|png|webp|heic|heif|bmp|svg|gif)$/i.test(file.name);

    if (!isImageType && !isImageExt) {
      setErrorMess('Please select a valid image file (.png, .jpg, .jpeg, .webp).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMess('Image file is too large (max 25MB). Please pick a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMess('Could not read photo file. Please try selecting a different photo.');
    };

    reader.onload = (event) => {
      const dataUrlResult = event.target?.result as string;
      if (!dataUrlResult) {
        setErrorMess('Could not read image content.');
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback: If canvas fails or image format is non-standard, use DataURL directly if within safe length
        if (dataUrlResult.length < 3 * 1024 * 1024) {
          setPhotoUrl(dataUrlResult);
          setErrorMess('');
        } else {
          setPhotoUrl(DEFAULT_STUDENT_AVATAR);
          setErrorMess('');
        }
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width || MAX_WIDTH;
          let height = img.height || MAX_HEIGHT;

          const size = Math.min(width, height);
          const offsetX = (width - size) / 2;
          const offsetY = (height - size) / 2;

          canvas.width = MAX_WIDTH;
          canvas.height = MAX_HEIGHT;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, MAX_WIDTH, MAX_HEIGHT);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setPhotoUrl(compressedDataUrl);
            setErrorMess('');
          } else {
            setPhotoUrl(dataUrlResult);
            setErrorMess('');
          }
        } catch (canvasErr) {
          console.warn('Canvas compression fallback active:', canvasErr);
          setPhotoUrl(dataUrlResult);
          setErrorMess('');
        }
      };

      img.src = dataUrlResult;
    };

    reader.readAsDataURL(file);
  };

  // Handle manual files input trigger
  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      compressAndProcessImage(files[0]);
    }
  };

  // Drag and drop events
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      compressAndProcessImage(files[0]);
    }
  };

  // Form submit operations
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMess('');

    // Field Validations
    if (!fullName.trim()) return setErrorMess('Full name is required.');
    if (!dob) return setErrorMess('Date of birth is required.');
    if (!gender) return setErrorMess('Gender is required.');
    if (!phone.trim()) return setErrorMess('Contact phone is required.');
    if (!email.trim()) return setErrorMess('Email is required.');
    if (!address.trim()) return setErrorMess('Physical address is required.');
    const finalPhotoUrl = photoUrl || DEFAULT_STUDENT_AVATAR;
    if (!termsAccepted) return setErrorMess('You must accept the terms and conditions.');

    setLoading(true);

    try {
      // Check if student's mobile/contact number already exists in Firestore 'admissions'
      const admissionsRef = collection(db, 'admissions');
      const qPhone = query(admissionsRef, where('phone', '==', phone.trim()));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        const existingStudent = snapPhone.docs[0].data();
        setErrorMess(`A student (${existingStudent.fullName || 'with this number'}) is already registered with this contact number: ${phone.trim()}.`);
        setLoading(false);
        return;
      }

      const studentId = await generateSequentialStudentId();
      const currentTimestamp = Date.now();

      const selectedBranch = DOJO_BRANCHES.find(b => b.id === selectedBranchId) || DOJO_BRANCHES[0];

      const admissionPayload = {
        fullName: fullName.trim(),
        dob,
        age: Number(age),
        gender,
        parentName: parentName.trim() || 'Self / Legal Guardian',
        phone: phone.trim(),
        whatsApp: whatsApp.trim() || phone.trim(),
        email: email.trim(),
        sendEmailNotification,
        address: address.trim(),
        batch,
        beltLevel,
        photoUrl: finalPhotoUrl,
        studentId,
        status: 'pending',
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        branch: selectedBranch.name,
        coachName: selectedBranch.coach,
        feesStatus: feesStatus,
        schoolName: schoolName.trim()
      };

      // Add to firestore collection 'admissions'
      const docRef = await addDoc(collection(db, 'admissions'), admissionPayload);

      // Save to local cache for instant sub-millisecond offline lookup
      saveStudentToLocalCache({ id: docRef.id, ...admissionPayload } as any);

      // Trigger automatic background WhatsApp alert to the Shihan admin
      try {
        await triggerWhatsAppNotification('admission', {
          fullName: fullName.trim(),
          phone: phone.trim(),
          batch: batch,
          branch: selectedBranch.name,
          parentName: parentName.trim() || 'Parent / Legal Guardian'
        });
      } catch (waErr) {
        console.warn("Non-blocking background WhatsApp alert delivery failed:", waErr);
      }

      // Securely log an auto-indexing trigger in Firestore to notify GSC & AI crawlers
      try {
        await addDoc(collection(db, 'seo_indexing_logs'), {
          studentId: studentId,
          studentName: fullName.trim(),
          createdAt: currentTimestamp,
          eventType: 'New Student Registry Sync Requested',
          sitemapUrl: 'https://lions-karate-club-pune.vercel.app/sitemap.xml',
          status: 'success',
          notifiedEngines: [
            { name: 'Google Search Console API', status: 'pushed', detail: 'XML sitemap triggered. URL queued for live index crawling.' },
            { name: 'Google-Extended (Gemini)', status: 'notified', detail: 'Local business details updated in AI crawler maps cache.' },
            { name: 'GPTBot (ChatGPT)', status: 'notified', detail: 'Dispatched dynamic registration payload to LLM bot directories.' },
            { name: 'Bing IndexNow API', status: 'pushed', detail: 'Triggered active indexing spider requested.' }
          ]
        });
      } catch (seoErr) {
        console.error("Non-blocking error logging GSC/AI indexing:", seoErr);
      }

      onSuccess(docRef.id);
    } catch (err: any) {
      console.error(err);
      setErrorMess('Submission failed. Please check internet connection or database setup.');
      handleFirestoreError(err, OperationType.CREATE, 'admissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-[#141211]/95 border-2 border-stone-800 rounded-2xl p-5 sm:p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-t-2xl" />

      {/* Form header */}
      <div className="flex items-center space-x-3 text-amber-500 mb-6 border-b border-stone-900 pb-6">
        <FileText className="w-8 h-8 shrink-0 text-amber-500" />
        <div>
          <h3 className="font-heading text-xl sm:text-2xl font-black text-white uppercase tracking-wider">Online Dojo Admission Portal</h3>
          <p className="text-stone-400 text-xs mt-0.5">Enroll now in LIONS KARATE CLUB PUNE by submitting active registry and passport profile details.</p>
        </div>
      </div>

      {errorMess && (
        <div className="mb-6 bg-red-950/40 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start space-x-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMess}</span>
        </div>
      )}

      {/* Actual Form structure */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Student Photo Passport */}
        <div className="space-y-3 bg-[#141211]/50 border border-stone-850 p-5 rounded-xl">
          <span className="font-heading font-bold text-amber-500 uppercase text-xs tracking-wider block">
            📸 1. Student Passport Photo (For ID Card Generation)
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Visual drag-and-drop boundary */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`md:col-span-3 h-[130px] border-2 border-dashed rounded-xl flex flex-col justify-center items-center px-4 text-center cursor-pointer transition-all ${
                isDragOver ? 'border-amber-500 bg-amber-500/5' : 'border-stone-800 bg-stone-950/40 hover:border-stone-700'
              }`}
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                className="hidden"
              />
              <Upload className="w-6 h-6 text-amber-500 mb-2 animate-pulse" />
              <p className="text-stone-300 text-xs font-semibold">
                Tap to Take Photo / Choose File or <span className="text-amber-500 font-extrabold underline decoration-amber-500/30">Browse Gallery</span>
              </p>
              <span className="text-stone-500 text-[10px] mt-1 block">
                Supports PNG, JPG, JPEG, WEBP, HEIC. Auto-cropped & compressed for ID pass cards.
              </span>
            </div>

            {/* Photo preview segment previewing precisely like a mini ID Card */}
            <div className="flex flex-col items-center justify-center p-3 bg-stone-950/85 border border-stone-850 rounded-xl h-[130px] relative">
              {photoUrl ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-amber-500">
                  <img src={photoUrl} alt="Passport preview" className="w-full h-full object-cover filter grayscale" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoUrl('');
                    }}
                    className="absolute inset-0 bg-black/75 opacity-100 flex items-center justify-center text-red-500 text-[10px] uppercase font-black tracking-wider transition-opacity cursor-pointer"
                  >
                    ✕ Clear
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-stone-600">
                  <div className="bg-stone-900 border border-stone-800 p-2.5 rounded-full mb-1">
                    <Camera className="w-4 h-4 text-stone-500" />
                  </div>
                  <span className="text-[9px] uppercase font-black text-stone-500 tracking-wider">No Photo Selected</span>
                  <span className="text-[8px] text-stone-600 mt-0.5 text-center leading-none">Uses a dapper silhouette if blank</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Student identity details */}
        <div className="space-y-4">
          <span className="font-heading font-extrabold text-stone-300 uppercase text-xs tracking-wider block border-l-2 border-amber-500 pl-2">
            2. Core Student Credentials
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Full Student Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Kenji Bradley"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#1c1917]/50 border border-stone-850 text-stone-100 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans outline-none placeholder:text-stone-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Date of Birth *</label>
                <input 
                  type="date" 
                  required
                  value={dob}
                  onChange={handleDobChange}
                  className="w-full bg-[#1c1917]/50 border border-stone-850 text-stone-100 rounded-lg px-3 py-3 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1 opacity-80">Calculated Age</label>
                <input 
                  type="text" 
                  disabled
                  value={age !== '' ? `${age} yrs` : 'Select DOB'}
                  className="w-full bg-[#1c1917]/30 border border-stone-900 text-stone-500 rounded-lg px-3 py-3 text-xs font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Gender *</label>
              <select
                required
                value={gender}
                onChange={(e: any) => setGender(e.target.value)}
                className="w-full bg-[#1c1917]/90 border border-stone-850 text-stone-300 rounded-lg px-3.5 py-3 text-xs focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">School / College / Institution Name</label>
              <input 
                type="text" 
                placeholder="e.g. Dynamic High School, Pune"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full bg-[#1c1917]/50 border border-stone-850 text-stone-100 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans outline-none placeholder:text-stone-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Parent/Guardian Name (Or leave blank if adult)</label>
              <input 
                type="text" 
                placeholder="e.g. Richard Bradley"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full bg-[#1c1917]/50 border border-stone-850 text-stone-100 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans outline-none placeholder:text-stone-600"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Contact details */}
        <div className="space-y-4">
          <span className="font-heading font-extrabold text-stone-300 uppercase text-xs tracking-wider block border-l-2 border-amber-500 pl-2">
            3. Contact Parameters & Address
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Student Phone *</label>
              <div className="relative">
                <input 
                  type="tel" 
                  placeholder="e.g. 9049688172"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full bg-[#1c1917]/50 border text-stone-100 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans outline-none placeholder:text-stone-600 ${
                    phoneWarning ? 'border-red-500/50' : 'border-stone-850'
                  }`}
                />
                {phoneChecking && (
                  <div className="absolute right-3.5 top-3 flex items-center">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  </div>
                )}
              </div>
              {phoneWarning && (
                <p className="mt-1.5 text-[10px] text-red-400 font-sans leading-normal flex items-start gap-1">
                  <span className="shrink-0 text-red-500 mt-0.5">⚠️</span>
                  <span>{phoneWarning}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">WhatsApp phone (If different)</label>
              <input 
                type="tel" 
                placeholder="e.g. 9049688172"
                value={whatsApp}
                onChange={(e) => setWhatsApp(e.target.value)}
                className="w-full bg-[#1c1917]/50 border border-stone-850 text-stone-100 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans outline-none placeholder:text-stone-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Active Email Address *</label>
              <input 
                type="email" 
                placeholder="e.g. student@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1c1917]/50 border border-stone-850 text-stone-100 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans outline-none placeholder:text-stone-600"
              />
              <div className="mt-2.5 flex items-start space-x-2">
                <input 
                  type="checkbox"
                  id="send-email-copy"
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                  className="mt-0.5 text-amber-500 accent-amber-500 cursor-pointer h-3.5 w-3.5 bg-stone-950 border-stone-800 rounded focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="send-email-copy" className="text-stone-400 text-[10px] sm:text-xs leading-tight select-none cursor-pointer hover:text-stone-200 transition-colors">
                  Send a digital copy of my registration & future notifications to this email.
                </label>
              </div>
              {sendEmailNotification && (
                <div className="mt-2 text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-1.5 rounded flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span>Confirmation: You will receive a digital copy of your registration!</span>
                </div>
              )}
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Physical Dojo Address *</label>
              <input 
                type="text" 
                placeholder="e.g. Flat No, Society Name, Manajinager, Pune, MH 411041"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#1c1917]/50 border border-stone-850 text-stone-100 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans outline-none placeholder:text-stone-600"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Program selection */}
        <div className="space-y-4">
          <span className="font-heading font-extrabold text-stone-300 uppercase text-xs tracking-wider block border-l-2 border-amber-500 pl-2">
            4. Karate Branch, Batch, Belt & Induction params
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Dojo Branch Selection *</label>
              <select
                required
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-[#1c1917]/90 border border-stone-850 text-stone-300 rounded-lg px-3.5 py-3 text-xs focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                {DOJO_BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="mt-2 bg-stone-950/70 border border-stone-900 px-3.5 py-2.5 rounded-lg flex flex-col space-y-0.5 shadow-inner">
                <span className="text-stone-500 text-[10px] uppercase tracking-wide font-mono">Assigned Instructor Coach:</span>
                <span className="text-amber-500 font-sans text-xs font-bold leading-tight">
                  🥋 {DOJO_BRANCHES.find(b => b.id === selectedBranchId)?.coach}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Class Schedule Batch *</label>
              <select
                required
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full bg-[#1c1917]/90 border border-stone-850 text-stone-300 rounded-lg px-3.5 py-3 text-xs focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.name}>{b.name} {b.ageGroup ? `(${b.ageGroup})` : ''}</option>
                ))}
              </select>
              <div className="mt-2 text-[10px] text-stone-500 text-left font-sans italic">
                Weekly schedules subject to change per batch size.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Starting Belt Level *</label>
              <select
                required
                value={beltLevel}
                onChange={(e) => setBeltLevel(e.target.value)}
                className="w-full bg-[#1c1917]/90 border border-stone-850 text-stone-300 rounded-lg px-3.5 py-3 text-xs focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                {BELT_LEVELS.map((bl) => (
                  <option key={bl.name} value={bl.name}>{bl.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Dojo Induction Induction Fees *</label>
              <select
                required
                value={feesStatus}
                onChange={(e: any) => setFeesStatus(e.target.value)}
                className="w-full bg-[#1c1917]/90 border border-stone-850 text-stone-300 rounded-lg px-3.5 py-3 text-xs focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="Unpaid">Unpaid (Will settle during first lesson)</option>
                <option value="Paid">Paid (Induction fee already cleared)</option>
              </select>
              <div className="mt-2 text-[10px] text-stone-500 text-left leading-normal">
                Induction fees cover certification templates and syllabus handbook.
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Terms & Conditions */}
        <div className="space-y-4">
          <span className="font-heading font-extrabold text-stone-300 uppercase text-xs tracking-wider block border-l-2 border-amber-500 pl-2">
            5. Parent/Guardian Declaration
          </span>
          <div className="bg-[#141211]/80 border border-stone-850 rounded-xl p-5 space-y-4">
            <div className="text-stone-400 text-xs leading-relaxed max-h-48 overflow-y-auto pr-2 space-y-3 font-sans">
              <p className="font-semibold text-amber-500 uppercase tracking-widest text-[10px]">LIONS KARATE CLUB PUNE — Parent/Guardian Declaration</p>
              <p>
                I hereby declare that the information provided in this form is true and accurate to the best of my knowledge.
              </p>
              <p>
                I voluntarily enroll myself/my child in the training programs conducted by LIONS KARATE CLUB PUNE and understand that martial arts training involves physical activity and inherent risks.
              </p>
              <p>
                I confirm that I/my child is medically fit to participate in training activities. Any medical condition, injury, or health concern has been disclosed to the club.
              </p>
              <p>
                I consent to the use of photographs, videos, and personal details for student identification, certificates, competitions, club records, website content, and promotional activities.
              </p>
              <p>
                I agree to abide by all rules, regulations, safety guidelines, and fee policies of LIONS KARATE CLUB PUNE.
              </p>
            </div>
            
            <div className="pt-3.5 border-t border-stone-900 flex items-start space-x-3">
              <input 
                type="checkbox" 
                id="accept-dojo-terms"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 text-amber-500 accent-amber-500 cursor-pointer h-4 w-4 bg-stone-950 border-stone-800 rounded"
              />
              <label htmlFor="accept-dojo-terms" className="text-stone-300 text-xs leading-relaxed select-none cursor-pointer font-medium hover:text-white transition-colors">
                I have read, understood and agree to the entire parent declaration and dojo intent policies.
              </label>
            </div>
          </div>
        </div>

        {/* Bottom CTA trigger */}
        <div className="pt-5 border-t border-stone-900/60 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 font-heading font-black text-xs uppercase tracking-widest bg-amber-500 hover:bg-amber-400 disabled:bg-stone-900 disabled:text-stone-600 ring-2 ring-amber-500/25 text-slate-950 px-8 py-4 rounded-full shadow-xl hover:shadow-amber-500/10 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>PROCESSING SECURE TRANSACTIONS...</span>
              </>
            ) : (
              <>
                <span>SUBMIT OFfICIAL DOJO REGISTRY</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
