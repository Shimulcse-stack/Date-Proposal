import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Calendar, Clock, Smile, MapPin, MessageCircleHeart, Info, Copy, Check } from 'lucide-react';
import FloatingHearts from './components/FloatingHearts';
import { ConfettiEffect, ConfettiRef } from './components/ConfettiEffect';
import ProposalPage from './components/ProposalPage';
import DateSelectorPage from './components/DateSelectorPage';
import BoyfriendDashboard from './components/BoyfriendDashboard';
import PhotoCarousel from './components/PhotoCarousel';

interface DateDetails {
  selectedDate: string;
  selectedTime: string;
  dateType: string;
  customNotes: string;
}

export default function App() {
  const [stage, setStage] = useState<'proposal' | 'date-selector' | 'confirmed'>('proposal');
  const [noClicksCount, setNoClicksCount] = useState(0);
  const [confirmedDetails, setConfirmedDetails] = useState<DateDetails | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const confettiRef = useRef<ConfettiRef | null>(null);

  const triggerConfetti = (x?: number, y?: number) => {
    confettiRef.current?.burst(x, y);
  };

  const handleYes = (noClicks: number) => {
    setNoClicksCount(noClicks);
    try {
      localStorage.setItem('local_no_clicks_count', noClicks.toString());
    } catch (err) {
      console.error("Failed to save no clicks locally", err);
    }
    // Move to Date Selection phase
    setStage('date-selector');
  };

  const handleConfirm = (details: DateDetails) => {
    setConfirmedDetails(details);
    setStage('confirmed');

    // Save to local storage for offline durability
    try {
      const localRaw = localStorage.getItem('local_responses');
      const list = localRaw ? JSON.parse(localRaw) : [];
      const alreadyExists = list.some((item: any) => 
        item.selectedDate === details.selectedDate && 
        item.selectedTime === details.selectedTime && 
        item.dateType === details.dateType
      );
      if (!alreadyExists) {
        list.unshift({
          id: "resp_" + Date.now().toString(36),
          timestamp: new Date().toISOString(),
          selectedDate: details.selectedDate,
          selectedTime: details.selectedTime,
          dateType: details.dateType,
          customNotes: details.customNotes,
          status: "accepted"
        });
        localStorage.setItem('local_responses', JSON.stringify(list));
      }
    } catch (err) {
      console.error("Failed to save local response", err);
    }

    // Double burst of confetti on confirmation!
    setTimeout(() => {
      triggerConfetti(window.innerWidth / 3, window.innerHeight / 2);
    }, 100);
    setTimeout(() => {
      triggerConfetti((window.innerWidth * 2) / 3, window.innerHeight / 2);
    }, 500);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#FFF5F6] via-[#FFF0F3] to-[#F3E8FF] flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Background heart system */}
      <FloatingHearts />
      
      {/* Confetti canvas overlay */}
      <ConfettiEffect ref={confettiRef} />

      {/* Header Bar */}
      <header className="relative w-full py-6 px-8 flex justify-between items-center z-10 select-none">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => triggerConfetti()}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Heart className="w-8 h-8 text-rose-500 fill-rose-400" />
          </motion.div>
          <span className="font-serif font-black text-xl bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent tracking-wide">
            Be Mine 🌹
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Subtle instructions toggle */}
          <span className="text-[10px] sm:text-xs text-rose-400 bg-rose-50 border border-rose-100/50 rounded-full px-3 py-1 font-medium backdrop-blur-sm">
            Made with love 💖
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-6 px-4 z-10 w-full max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {stage === 'proposal' && (
            <motion.div
              key="proposal-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center justify-center gap-8 md:gap-10"
            >
              <PhotoCarousel />
              <ProposalPage onYes={handleYes} triggerConfetti={triggerConfetti} />
            </motion.div>
          )}

          {stage === 'date-selector' && (
            <motion.div
              key="selector-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full flex justify-center"
            >
              <DateSelectorPage onConfirm={handleConfirm} />
            </motion.div>
          )}

          {stage === 'confirmed' && confirmedDetails && (
            <motion.div
              key="confirmed-stage"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, type: "spring", damping: 18 }}
              className="w-full max-w-xl"
            >
              <ConfirmedView details={confirmedDetails} noClicksCount={noClicksCount} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 z-10 select-none">
        <span>© {new Date().getFullYear()} Our Love Story. All rights reserved.</span>
        
        {/* Secret trigger to enter Boyfriend/Admin Dashboard */}
        <button
          onClick={() => setShowAdmin(true)}
          className="text-slate-300 hover:text-rose-400 hover:bg-rose-50/50 border border-transparent hover:border-pink-100/50 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer font-medium bg-white/40 backdrop-blur-sm shadow-sm"
        >
          <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-200" />
          <span>ড্যাশবোর্ড (Boyfriend Entrance)</span>
        </button>
      </footer>

      {/* Admin Dashboard Modal */}
      <AnimatePresence>
        {showAdmin && (
          <BoyfriendDashboard onClose={() => setShowAdmin(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Separate component for the Success/Confirmed View
function ConfirmedView({ details, noClicksCount }: { details: DateDetails; noClicksCount: number }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });
  const [copied, setCopied] = useState(false);

  const generateSyncCode = () => {
    try {
      const syncObj = {
        noClicksCount,
        responses: [
          {
            id: "resp_" + Date.now().toString(36),
            timestamp: new Date().toISOString(),
            selectedDate: details.selectedDate,
            selectedTime: details.selectedTime,
            dateType: details.dateType,
            customNotes: details.customNotes,
            status: "accepted"
          }
        ]
      };
      // Encode beautifully as a base64 string
      return btoa(encodeURIComponent(JSON.stringify(syncObj)));
    } catch (err) {
      return "";
    }
  };

  const handleCopy = () => {
    const code = generateSyncCode();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Extrapolate the exact target date
  useEffect(() => {
    // Guess slot hour based on time range string
    let hour = 17; // Sunset default
    if (details.selectedTime.includes('8:00 AM')) hour = 8;
    else if (details.selectedTime.includes('1:00 PM')) hour = 13;
    else if (details.selectedTime.includes('5:00 PM')) hour = 17;
    else if (details.selectedTime.includes('8:00 PM')) hour = 20;
    else if (details.selectedTime.includes('10:30 PM')) hour = 22.5;

    const targetDate = new Date(details.selectedDate);
    targetDate.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);

    const updateTimer = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [details.selectedDate, details.selectedTime]);

  return (
    <div id="confirmed-view-card" className="bg-white/95 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(255,182,193,0.6)] p-6 sm:p-10 border-4 border-white flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md">
      {/* Decorative Top Success Border */}
      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-rose to-brand-cherry" />
      
      {/* Floating Sparkles and Heart */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, delay: 0.1 }}
        className="w-20 h-20 bg-brand-peach rounded-full flex items-center justify-center mb-6 border-2 border-brand-rose/20 shadow-[0_8px_16px_rgba(255,77,109,0.15)] text-4xl"
      >
        🥰
      </motion.div>

      <h2 className="font-serif text-3xl font-extrabold text-brand-maroon tracking-tight leading-tight italic">
        আমাদের ডেট বুকড্ হয়েছে! 🎉❤️
      </h2>
      <p className="font-sans text-[10px] text-brand-pink font-bold tracking-widest mt-2 uppercase">
        Date Reservation Confirmed Successfully
      </p>

      {/* Countdown Timer */}
      <div className="w-full bg-brand-peach/40 border-2 border-pink-100 rounded-[32px] p-5 sm:p-6 my-8 space-y-4 shadow-inner">
        <h3 className="font-serif font-black text-brand-maroon text-sm flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-brand-cherry animate-spin" />
          আমাদের বিশেষ মুহূর্ত শুরু হতে বাকি:
        </h3>
        
        {timeLeft.isPast ? (
          <motion.p
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="font-serif text-xl sm:text-2xl font-black text-brand-cherry"
          >
            আজই আমাদের সেই কাঙ্ক্ষিত দিন! 💖🌹
          </motion.p>
        ) : (
          <div className="flex justify-center gap-2.5 sm:gap-4 select-none">
            {[
              { val: timeLeft.days, label: 'দিন', sub: 'Days' },
              { val: timeLeft.hours, label: 'ঘণ্টা', sub: 'Hours' },
              { val: timeLeft.minutes, label: 'মিনিট', sub: 'Mins' },
              { val: timeLeft.seconds, label: 'সেকেন্ড', sub: 'Secs' },
            ].map((unit, idx) => (
              <div key={idx} className="flex flex-col items-center bg-white rounded-2xl p-2.5 sm:p-3 shadow-[0_8px_16px_rgba(255,182,193,0.25)] border-2 border-brand-peach w-16 sm:w-20">
                <span className="text-xl sm:text-2xl font-black text-brand-cherry font-mono">
                  {unit.val.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-extrabold text-brand-maroon mt-1">{unit.label}</span>
                <span className="text-[7px] text-brand-pink/70 uppercase tracking-widest font-black leading-none mt-0.5">{unit.sub}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Recaps */}
      <div className="w-full space-y-3.5 text-left text-sm text-brand-maroon font-sans border-t border-brand-peach pt-6">
        <h4 className="font-extrabold text-brand-maroon text-center mb-3 uppercase tracking-wider text-xs">ডেটের চূড়ান্ত বিবরণী (Date Itinerary)</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex items-center gap-3 bg-brand-peach/10 p-3.5 rounded-2xl border-2 border-brand-peach">
            <Calendar className="w-5 h-5 text-brand-cherry shrink-0" />
            <div>
              <span className="text-[9px] text-brand-pink/80 block font-bold leading-none mb-1 uppercase tracking-widest">তারিখ (Date)</span>
              <span className="font-extrabold text-brand-maroon text-sm">{details.selectedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-brand-peach/10 p-3.5 rounded-2xl border-2 border-brand-peach">
            <Clock className="w-5 h-5 text-brand-cherry shrink-0" />
            <div>
              <span className="text-[9px] text-brand-pink/80 block font-bold leading-none mb-1 uppercase tracking-widest">সময় (Time)</span>
              <span className="font-extrabold text-brand-maroon text-sm">{details.selectedTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-brand-peach/10 p-3.5 rounded-2xl border-2 border-brand-peach">
          <MessageCircleHeart className="w-5 h-5 text-brand-cherry shrink-0" />
          <div>
            <span className="text-[9px] text-brand-pink/80 block font-bold leading-none mb-1 uppercase tracking-widest">আমরা কী করব (Date Activity)</span>
            <span className="font-extrabold text-brand-maroon text-sm">{details.dateType}</span>
          </div>
        </div>

        {details.customNotes && (
          <div className="bg-brand-peach/30 border-2 border-dashed border-brand-rose/30 rounded-2xl p-4 mt-3">
            <span className="text-[9px] text-brand-cherry font-black block mb-1 uppercase tracking-widest">তোমার আবদার (Special Request)</span>
            <p className="italic text-brand-maroon text-xs leading-relaxed font-medium">
              " {details.customNotes} "
            </p>
          </div>
        )}
      </div>

      {/* Offline sync block for Vercel/stateless support */}
      <div className="w-full bg-rose-50/50 border border-pink-100 rounded-[28px] p-4 sm:p-5 mt-6 text-left space-y-3">
        <h5 className="font-serif font-bold text-xs text-brand-maroon flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-cherry animate-pulse" />
          বয়ফ্রেন্ড ড্যাশবোর্ড সিঙ্ক কোড 🔑
        </h5>
        <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
          তোমরা যদি আলাদা ডিভাইসে লিংকটি ব্যবহার করে থাকো, তবে সার্ভার রিস্টার্টের কারণে ড্যাশবোর্ডের বুকিং মুছে যেতে পারে। নিচের এই স্পেশাল কোডটি কপি করে তোমার বয়ফ্রেন্ডকে পাঠিয়ে দাও! সে তার ড্যাশবোর্ডে এটি পেস্ট করলেই মুহূর্তে সব হিস্ট্রি দেখতে পাবে।
        </p>
        <div className="flex gap-2 items-center bg-white border border-pink-100 rounded-xl p-2.5">
          <input
            readOnly
            value={generateSyncCode()}
            className="flex-1 bg-transparent text-[10px] font-mono text-slate-500 truncate outline-none select-all"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-brand-maroon hover:bg-brand-cherry text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-300" />
                <span>কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>কপি করো</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-8 border-t border-brand-peach pt-6 text-center w-full">
        <p className="font-serif italic text-brand-cherry font-black text-sm">
          "আই লাভ ইউ সো মাচ! আমাদের दिनটির জন্য ব্যাকুল হয়ে অপেক্ষা করছি..." 🌹❤️
        </p>
      </div>
    </div>
  );
}
