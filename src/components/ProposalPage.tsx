import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MailOpen, AlertCircle, Sparkles } from 'lucide-react';
import loveLetterHeaderImg from '../assets/images/love_letter_header_1782742689770.jpg';

interface ProposalPageProps {
  onYes: (noClicksCount: number) => void;
  triggerConfetti: (x?: number, y?: number) => void;
}

const PRANK_MESSAGES = [
  "Nice try! 😜",
  "Nope! 🔒",
  "Access Denied! 🚫",
  "Try again! 😂",
  "Can't touch this! 💃",
  "Error: Wrong answer! 🤖",
  "Love is inevitable! 💞",
  "Say YES instead! ✨",
];

export default function ProposalPage({ onYes, triggerConfetti }: ProposalPageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [noCount, setNoCount] = useState(0);
  const [noBtnPos, setNoBtnPos] = useState({ x: 0, y: 0 });
  const [noBtnStyle, setNoBtnStyle] = useState<React.CSSProperties>({});
  const [prankMsg, setPrankMsg] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const letterRef = useRef<HTMLDivElement | null>(null);

  // Sound effect or voice text synthesis helper (very sweet!)
  const playHeartBeat = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (freq: number, duration: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };
      // Classic romantic heart beat sound (double pulse)
      playBeep(80, 0.15, 0);
      playBeep(75, 0.15, 0.12);
    } catch (e) {
      // AudioContext might be blocked until user gesture, ignore error
    }
  };

  const handleOpenEnvelope = () => {
    setIsOpen(true);
    playHeartBeat();
  };

  const moveNoButton = () => {
    const nextCount = noCount + 1;
    setNoCount(nextCount);
    playHeartBeat();

    // Log the stat to server
    fetch("/api/stats/no-click", { method: "POST" })
      .catch((e) => console.error("Could not record click", e));

    // Calculate a random location
    // We want to keep it within the parent card or screen safe area
    const rangeX = Math.min(window.innerWidth - 120, 400);
    const rangeY = Math.min(window.innerHeight - 80, 300);

    const randomX = (Math.random() - 0.5) * rangeX;
    const randomY = (Math.random() - 0.5) * rangeY;

    setNoBtnStyle({
      position: 'absolute',
      transform: `translate(${randomX}px, ${randomY}px)`,
      transition: 'all 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
    });

    // Display a cheeky romantic warning message
    const msg = PRANK_MESSAGES[Math.floor(Math.random() * PRANK_MESSAGES.length)];
    setPrankMsg(msg);
    setShowMsg(true);
    setTimeout(() => setShowMsg(false), 2000);
  };

  const handleYes = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerConfetti(e.clientX, e.clientY);
    onYes(noCount);
  };

  return (
    <div id="proposal-container" className="relative flex flex-col items-center justify-center min-h-[85vh] w-full px-4 select-none">
      
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* UNOPENED ENVELOPE STAGE */
          <motion.div
            key="envelope"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-full max-w-md bg-white/90 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(255,182,193,0.6)] p-10 border-4 border-white flex flex-col items-center text-center cursor-pointer relative overflow-hidden backdrop-blur-md"
            onClick={handleOpenEnvelope}
            whileHover={{ scale: 1.02 }}
            id="envelope-card"
          >
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-peach rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-700" />

            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100 shadow-[0_8px_16px_rgba(255,182,193,0.3)]">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-4xl"
              >
                💌
              </motion.div>
            </div>

            <h1 className="font-serif text-3xl font-extrabold text-brand-maroon tracking-tight leading-tight">
              আমার ভালোবাসার মানুষটির জন্য...
            </h1>
            <p className="font-sans text-sm text-brand-pink/80 mt-3 max-w-xs font-semibold uppercase tracking-wider">
              Hey Beautiful,
            </p>
            <p className="font-sans text-xs text-slate-500 mt-1 max-w-xs leading-relaxed italic">
              তোমাকে কিছু বলতে চাই। চিঠিটি খুলে দেখবে প্লিজ?
            </p>

            <motion.button
              id="open-envelope-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-8 px-8 py-4 bg-brand-cherry text-white rounded-full font-bold shadow-[0_10px_20px_rgba(255,77,109,0.3)] hover:bg-rose-600 border-b-4 border-rose-700 transition-all flex items-center gap-2 text-sm uppercase tracking-wider"
            >
              <MailOpen className="w-4 h-4" /> চিঠিটি খোলো
            </motion.button>
          </motion.div>
        ) : (
          /* LOVE LETTER & PROPOSAL STAGE */
          <motion.div
            key="letter"
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 80 }}
            className="w-full max-w-lg bg-white/95 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(255,182,193,0.6)] overflow-hidden border-4 border-white flex flex-col backdrop-blur-md"
            ref={letterRef}
            id="proposal-letter-card"
          >
            {/* Header Image */}
            <div className="relative h-56 bg-brand-peach overflow-hidden flex items-center justify-center">
              <img
                src={loveLetterHeaderImg}
                alt="Lovely Hands Holding a Heart"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-90" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-[10px] font-bold text-brand-pink uppercase tracking-widest flex items-center gap-1 border border-brand-peach">
                <Sparkles className="w-3 h-3 animate-spin text-brand-rose" /> For My Sweetheart
              </div>
            </div>

            {/* Letter Body */}
            <div className="p-8 pt-4 flex flex-col text-slate-700 font-sans leading-relaxed relative">
              {/* Cheeky alert label for No-click jokes */}
              <AnimatePresence>
                {showMsg && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: -10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -10 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 bg-brand-maroon text-white text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 z-30 font-semibold"
                  >
                    <AlertCircle className="w-3 h-3 text-brand-rose" />
                    <span>{prankMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-l-4 border-brand-rose pl-4 py-1 mb-6">
                <p className="font-serif italic text-brand-pink text-lg font-bold">
                  প্রিয়তম,
                </p>
                <p className="font-sans text-sm text-brand-maroon/90 mt-2 leading-relaxed">
                  জীবন সুন্দর, কিন্তু তোমার চোখের হাসিতে তা স্বর্গের চেয়েও বেশি মোহনীয় হয়ে ওঠে। তোমার সাথে কাটানো প্রতিটি মুহূর্ত আমার হৃদয়ে এক একটি লাল গোলাপের পাপড়ির মতো জমা হয়ে থাকে।
                </p>
              </div>

              <div className="font-serif text-center mb-8">
                <h2 className="text-3xl font-extrabold text-brand-maroon leading-tight italic">
                  তুমি কি আমার সাথে একটি বিশেষ ডেটে যাবে? 🥰
                </h2>
                <p className="text-xs text-brand-pink font-sans mt-2 tracking-widest font-bold uppercase">
                  Will you go out with me on a special date?
                </p>
              </div>

              {/* Interaction Buttons Container */}
              <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 min-h-[120px] w-full mt-4">
                {/* YES BUTTON (Glowing, pulsates) */}
                <motion.button
                  id="yes-btn"
                  onClick={handleYes}
                  whileHover={{ scale: 1.08, boxShadow: "0 15px 30px rgba(255, 77, 109, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ scale: { repeat: Infinity, duration: 1.8, ease: "easeInOut" } }}
                  className="px-12 py-5 bg-brand-cherry text-white rounded-full font-black text-xl shadow-[0_10px_20px_rgba(255,77,109,0.4)] border-b-4 border-[#C9184A] flex items-center gap-2 z-20 cursor-pointer min-w-[180px] justify-center"
                >
                  <Heart className="w-5 h-5 fill-white animate-pulse" /> YES! 💖
                </motion.button>

                {/* NO BUTTON (Evades) */}
                <button
                  id="no-btn"
                  onMouseEnter={moveNoButton}
                  onClick={moveNoButton}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    moveNoButton();
                  }}
                  style={noBtnStyle}
                  className="px-8 py-4 bg-white text-brand-cherry text-lg font-semibold rounded-full border-2 border-brand-cherry opacity-60 z-10 select-none cursor-default transition-all flex items-center gap-1"
                >
                  No 😢
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
