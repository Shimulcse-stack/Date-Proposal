import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play, Heart, Camera, Plus, Trash2, Upload, X, Loader2, Sparkles } from 'lucide-react';

interface Memory {
  id: number;
  imageUrl: string;
  title: string;
  englishTitle: string;
  caption: string;
  dateStr?: string;
  isCustom?: boolean;
}

const DEFAULT_MEMORIES: Memory[] = [
  {
    id: 1,
    imageUrl: "/src/assets/images/couple_stroll_dreamy_1782743565363.jpg",
    title: "হাতে হাত রেখে পথ চলা...",
    englishTitle: "Walking Hand in Hand",
    caption: "বসন্তের বিকেলে চেরি ব্লসমের নিচে তোমার মিষ্টি হাসি ছিল আমার সেরা উপহার।",
    dateStr: "Our First Walk"
  },
  {
    id: 2,
    imageUrl: "/src/assets/images/sunset_lovers_watercolor_1782743584276.jpg",
    title: "সেই সোনালী বিকেল...",
    englishTitle: "Our Golden Sunsets",
    caption: "দিগন্তে যখন সূর্য ডুবে যায়, তোমার কাঁধে মাথা রেখে শান্ত লেকের ধারে বসে থাকা...",
    dateStr: "Warm Serenity"
  },
  {
    id: 3,
    imageUrl: "/src/assets/images/cozy_cafe_date_1782743599943.jpg",
    title: "কফি ও তোমার গল্প...",
    englishTitle: "Cozy Cafe Moments",
    caption: "এক কাপ কফি, হালকা আলো আর তোমার মায়াবী চোখের দিকে তাকিয়ে অনন্তকাল কাটিয়ে দেয়া যায়।",
    dateStr: "Sweet Coffee Dates"
  }
];

export default function PhotoCarousel() {
  const [memories, setMemories] = useState<Memory[]>(DEFAULT_MEMORIES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEnglishTitle, setNewEnglishTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newDateStr, setNewDateStr] = useState('');
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom memories from server
  const loadMemories = async () => {
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        const data = await res.json();
        const custom: Memory[] = (data.memories || []).map((m: any) => ({ ...m, isCustom: true }));
        if (custom.length > 0) {
          setMemories([...custom, ...DEFAULT_MEMORIES]);
        } else {
          setMemories(DEFAULT_MEMORIES);
        }
      }
    } catch (e) {
      console.error("Could not load memories from server, using defaults:", e);
      setMemories(DEFAULT_MEMORIES);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  // Autoplay control
  useEffect(() => {
    if (!isAutoplay || memories.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoplay, memories]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? memories.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === memories.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Base64 file reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) { // 25MB limit
      setUploadError("Image is too large. Please choose an image smaller than 25MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageBase64(reader.result as string);
      setUploadError('');
    };
    reader.onerror = () => {
      setUploadError("Error reading file. Please try another image.");
    };
    reader.readAsDataURL(file);
  };

  // Upload memory submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageBase64) {
      setUploadError("দয়া করে গ্যালারি থেকে একটি ছবি সিলেক্ট করো! (Please select an image)");
      return;
    }
    if (!newTitle.trim()) {
      setUploadError("টাইটেল দেওয়া আবশ্যক! (Title is required)");
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedImageBase64,
          title: newTitle.trim(),
          englishTitle: newEnglishTitle.trim() || 'Sweet Moment',
          caption: newCaption.trim(),
          dateStr: newDateStr.trim() || 'Special Memory'
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save memory on server");
      }

      const data = await res.json();
      if (data.success) {
        // Reset states
        setNewTitle('');
        setNewEnglishTitle('');
        setNewCaption('');
        setNewDateStr('');
        setSelectedImageBase64(null);
        setShowUploadModal(false);
        
        // Reload list and jump to the newly added memory (it will be custom, prepended)
        await loadMemories();
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error(err);
      setUploadError("আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করো প্রিয়।");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete memory
  const handleDeleteMemory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent carousel navigation
    if (!confirm("Are you sure you want to delete this memory? 😢")) {
      return;
    }

    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadMemories();
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 }
      }
    })
  };

  return (
    <div 
      id="photo-carousel-root" 
      className="w-full max-w-xl bg-white/95 rounded-[36px] shadow-[0_24px_48px_-12px_rgba(255,182,193,0.4)] border-4 border-white overflow-hidden p-5 flex flex-col gap-4 backdrop-blur-md relative"
    >
      {/* Small top accent header */}
      <div className="flex justify-between items-center px-2 select-none">
        <div className="flex items-center gap-1.5 text-brand-pink font-sans font-bold text-xs uppercase tracking-widest">
          <Camera className="w-4 h-4 text-brand-cherry animate-pulse" />
          <span>Our Romantic Gallery</span>
        </div>
        
        {/* Actions panel */}
        <div className="flex items-center gap-2">
          {/* Add custom image button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-peach hover:bg-rose-100 text-brand-cherry font-sans font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 border border-pink-100"
            id="open-upload-btn"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>ছবি যোগ করো (Add Photo)</span>
          </button>

          {/* Toggle autoplay button */}
          <button
            onClick={() => setIsAutoplay(!isAutoplay)}
            className="p-1.5 rounded-full bg-brand-peach hover:bg-rose-100 text-brand-cherry transition-all cursor-pointer"
            title={isAutoplay ? "Pause Autoplay" : "Resume Autoplay"}
            id="toggle-autoplay-btn"
          >
            {isAutoplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Image Slider Wrapper */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-[24px] bg-brand-peach/10 shadow-inner">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            {/* Image */}
            <img 
              src={memories[currentIndex]?.imageUrl} 
              alt={memories[currentIndex]?.englishTitle} 
              className="w-full h-full object-cover select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
            
            {/* Delete button for custom images */}
            {memories[currentIndex]?.isCustom && (
              <button
                onClick={(e) => handleDeleteMemory(memories[currentIndex].id, e)}
                className="absolute top-4 left-4 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 p-2 rounded-full transition-all duration-200 z-10 cursor-pointer shadow-md active:scale-90 border border-red-100"
                title="Delete this Memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Heart watermark */}
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-bold text-brand-pink uppercase tracking-wider flex items-center gap-1 border border-pink-50">
              <Heart className="w-3 h-3 fill-brand-cherry text-brand-cherry animate-pulse" />
              {memories[currentIndex]?.dateStr || "Memory"}
            </div>

            {/* Gradient Overlay for Text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

            {/* Slide Details */}
            <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 text-white flex flex-col gap-1.5 text-left">
              <span className="font-sans text-[10px] text-brand-rose font-extrabold uppercase tracking-widest flex items-center gap-1">
                {memories[currentIndex]?.isCustom && <Sparkles className="w-3 h-3 text-brand-rose" />}
                {memories[currentIndex]?.englishTitle}
              </span>
              <h4 className="font-serif text-lg sm:text-xl font-extrabold text-white leading-tight">
                {memories[currentIndex]?.title}
              </h4>
              <p className="font-sans text-xs sm:text-sm text-pink-100/90 leading-relaxed font-medium">
                {memories[currentIndex]?.caption}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Buttons (only if we have memories) */}
        {memories.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-2 flex items-center z-10">
              <button
                onClick={handlePrev}
                className="p-2 rounded-full bg-white/80 hover:bg-white text-brand-maroon shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-sm hover:text-brand-cherry hover:shadow-brand-rose/20"
                id="carousel-prev-btn"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="absolute inset-y-0 right-2 flex items-center z-10">
              <button
                onClick={handleNext}
                className="p-2 rounded-full bg-white/80 hover:bg-white text-brand-maroon shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-sm hover:text-brand-cherry hover:shadow-brand-rose/20"
                id="carousel-next-btn"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Pagination Dots */}
      {memories.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-1 select-none">
          {memories.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive ? 'w-6 bg-brand-cherry' : 'w-2 bg-brand-pink/30 hover:bg-brand-pink/50'
                }`}
                id={`carousel-dot-${index}`}
                title={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      )}

      {/* Dynamic Photo Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-brand-maroon/50 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white/95 rounded-[40px] shadow-2xl border-4 border-white w-full max-w-md p-6 sm:p-8 flex flex-col gap-5 relative overflow-hidden backdrop-blur-md"
              id="upload-modal-container"
            >
              {/* Top Accent Pink Blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-peach rounded-full mix-blend-multiply filter blur-xl opacity-60" />

              {/* Close Modal Button */}
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadError('');
                  setSelectedImageBase64(null);
                }}
                className="absolute top-4 right-4 bg-brand-peach hover:bg-rose-100 text-brand-cherry p-1.5 rounded-full transition-colors cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="w-12 h-12 bg-brand-peach rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Camera className="w-6 h-6 text-brand-cherry" />
                </div>
                <h3 className="font-serif text-2xl font-extrabold text-brand-maroon italic">ছবি যোগ করো প্রিয় 💖</h3>
                <p className="font-sans text-xs text-brand-pink/80 font-bold uppercase tracking-wider mt-1">Upload memories from your gallery</p>
              </div>

              <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
                {/* Image Selection Area */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-brand-maroon uppercase tracking-widest">Select Image (ছবি সিলেক্ট করো)</span>
                  
                  {selectedImageBase64 ? (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-brand-cherry/30 group">
                      <img src={selectedImageBase64} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSelectedImageBase64(null)}
                        className="absolute top-2 right-2 bg-red-500/90 text-white hover:bg-red-600 p-1.5 rounded-full transition-colors shadow-md"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 rounded-2xl border-2 border-dashed border-pink-200 hover:border-brand-rose bg-brand-peach/10 hover:bg-brand-peach/20 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4 text-center group"
                    >
                      <div className="p-3 bg-white rounded-full shadow-md group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-brand-cherry" />
                      </div>
                      <span className="text-xs font-bold text-brand-maroon">গ্যালারি থেকে ছবি বেছে নাও</span>
                      <span className="text-[10px] text-slate-400">Click to pick a photo (Max 25MB)</span>
                    </div>
                  )}

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                {/* Bangla Title */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-brand-maroon uppercase tracking-widest">Bengali Title (বাংলা টাইটেল)</span>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="যেমন: আমাদের প্রথম ফুচকা খাওয়ার দিন 😋"
                    className="w-full bg-brand-peach/20 border-2 border-pink-100 focus:border-brand-cherry focus:ring-1 focus:ring-brand-rose outline-none rounded-2xl p-3 text-xs text-brand-maroon font-bold"
                  />
                </div>

                {/* English Title */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-brand-maroon uppercase tracking-widest">English Title (ফরমেট টাইটেল)</span>
                  <input
                    type="text"
                    value={newEnglishTitle}
                    onChange={(e) => setNewEnglishTitle(e.target.value)}
                    placeholder="e.g. Fuchka Date Night 🍢"
                    className="w-full bg-brand-peach/20 border-2 border-pink-100 focus:border-brand-cherry focus:ring-1 focus:ring-brand-rose outline-none rounded-2xl p-3 text-xs text-brand-maroon font-bold"
                  />
                </div>

                {/* Caption / Description */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-brand-maroon uppercase tracking-widest">Caption (কিছু মিষ্টি কথা)</span>
                  <textarea
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="যেমন: ঐদিন অনেক ঝাল লেগেছিল ফুচকাতে, কিন্তু তোমার সাথে ছিল অমৃত..."
                    maxLength={150}
                    className="w-full bg-brand-peach/20 border-2 border-pink-100 focus:border-brand-cherry focus:ring-1 focus:ring-brand-rose outline-none rounded-2xl p-3 text-xs text-brand-maroon font-bold min-h-[60px] resize-none"
                  />
                </div>

                {/* Date or Label Tag */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-brand-maroon uppercase tracking-widest">Date / Place Tag (তারিখ বা স্থান)</span>
                  <input
                    type="text"
                    value={newDateStr}
                    onChange={(e) => setNewDateStr(e.target.value)}
                    placeholder="যেমন: 21 June 2026 বা ফুচকার দোকান"
                    className="w-full bg-brand-peach/20 border-2 border-pink-100 focus:border-brand-cherry focus:ring-1 focus:ring-brand-rose outline-none rounded-2xl p-3 text-xs text-brand-maroon font-bold"
                  />
                </div>

                {/* Error messages */}
                {uploadError && (
                  <p className="text-[11px] font-bold text-brand-cherry text-center animate-bounce mt-1">
                    {uploadError}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadError('');
                      setSelectedImageBase64(null);
                    }}
                    className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-2/3 py-3.5 bg-gradient-to-r from-brand-rose to-brand-cherry text-white font-black rounded-2xl text-xs shadow-md shadow-brand-rose/20 hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 fill-white animate-pulse" />
                        <span>আপলোড করো (Upload) 💖</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
