import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Lock, Calendar, Trash2, ShieldAlert, Award, ExternalLink, RefreshCw, X } from 'lucide-react';

interface BoyfriendDashboardProps {
  onClose: () => void;
}

interface DateResponse {
  id: string;
  timestamp: string;
  selectedDate: string;
  selectedTime: string;
  dateType: string;
  customNotes?: string;
  status: string;
}

export default function BoyfriendDashboard({ onClose }: BoyfriendDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [responses, setResponses] = useState<DateResponse[]>([]);
  const [noClicksCount, setNoClicksCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [syncMsg, setSyncMsg] = useState({ text: '', type: '' });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    // 1. Load from local storage fallback (for durability on Vercel)
    let localResps: DateResponse[] = [];
    let localNoClicks = 0;
    try {
      const rawResps = localStorage.getItem('local_responses');
      if (rawResps) {
        localResps = JSON.parse(rawResps);
      }
      const rawNoClicks = localStorage.getItem('local_no_clicks_count');
      if (rawNoClicks) {
        localNoClicks = parseInt(rawNoClicks, 10) || 0;
      }
    } catch (err) {
      console.error('Error reading offline localStorage data:', err);
    }

    // 2. Load from server
    let serverResps: DateResponse[] = [];
    let serverNoClicks = 0;
    try {
      const res = await fetch('/api/responses');
      if (res.ok) {
        const data = await res.json();
        serverResps = data.responses || [];
        serverNoClicks = data.stats?.noClicksCount || 0;
      }
    } catch (err) {
      console.warn('Network error loading responses (Vercel offline-first active):', err);
    }

    // 3. Merge data
    const mergedNoClicks = Math.max(localNoClicks, serverNoClicks);
    setNoClicksCount(mergedNoClicks);

    // Deduplicate responses by comparing key details
    const seen = new Set<string>();
    const mergedResponses: DateResponse[] = [];

    // Add local ones first
    localResps.forEach(r => {
      const key = `${r.selectedDate}|${r.selectedTime}|${r.dateType}`;
      if (!seen.has(key)) {
        seen.add(key);
        mergedResponses.push(r);
      }
    });

    // Add server ones
    serverResps.forEach(r => {
      const key = `${r.selectedDate}|${r.selectedTime}|${r.dateType}`;
      if (!seen.has(key)) {
        seen.add(key);
        mergedResponses.push(r);
      }
    });

    // Sort newest bookings first
    mergedResponses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setResponses(mergedResponses);
    setIsLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Sweet PINs: "143" (I Love You) or "love"
    if (pin === '143' || pin.toLowerCase() === 'love' || pin === '2026') {
      setIsAuthenticated(true);
      setErrorMsg('');
      fetchDashboardData();
    } else {
      setErrorMsg('ভুল কোড! একটু চিন্তা করে দেখো (Hint: "I Love You" এর কোড বা "love")');
      setPin('');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('সব রেসপন্স ডিলিট করে নতুন করে শুরু করতে চাও?')) return;

    try {
      // Clear localStorage
      localStorage.removeItem('local_responses');
      localStorage.removeItem('local_no_clicks_count');

      // Clear server
      await fetch('/api/responses', { method: 'DELETE' });
    } catch (e) {
      console.warn("Could not clear server responses:", e);
    }

    setResponses([]);
    setNoClicksCount(0);
    alert('সফলভাবে সব ডিলিট করা হয়েছে! 💖');
  };

  const handleManualSync = () => {
    if (!syncCodeInput.trim()) {
      setSyncMsg({ text: 'দয়া করে একটি কোড পেস্ট করো!', type: 'error' });
      return;
    }

    try {
      // Decode base64 sync token
      const decodedRaw = decodeURIComponent(atob(syncCodeInput.trim()));
      const parsed = JSON.parse(decodedRaw);

      if (!parsed || (!parsed.responses && typeof parsed.noClicksCount !== 'number')) {
        throw new Error("Invalid sync code format");
      }

      // 1. Update noClicksCount locally
      if (typeof parsed.noClicksCount === 'number') {
        const localNoClicks = localStorage.getItem('local_no_clicks_count');
        const currentNoClicks = localNoClicks ? parseInt(localNoClicks, 10) || 0 : 0;
        const finalNoClicks = Math.max(currentNoClicks, parsed.noClicksCount);
        localStorage.setItem('local_no_clicks_count', finalNoClicks.toString());
      }

      // 2. Update responses locally
      if (Array.isArray(parsed.responses)) {
        const localRaw = localStorage.getItem('local_responses');
        const currentLocal = localRaw ? JSON.parse(localRaw) : [];

        parsed.responses.forEach((newResp: any) => {
          const alreadyExists = currentLocal.some((existing: any) => 
            existing.selectedDate === newResp.selectedDate && 
            existing.selectedTime === newResp.selectedTime && 
            existing.dateType === newResp.dateType
          );
          if (!alreadyExists) {
            currentLocal.unshift(newResp);
          }
        });

        localStorage.setItem('local_responses', JSON.stringify(currentLocal));
      }

      setSyncMsg({ text: 'সফলভাবে সিঙ্ক সম্পন্ন হয়েছে! 💖', type: 'success' });
      setSyncCodeInput('');
      
      // Reload everything immediately!
      fetchDashboardData();

      setTimeout(() => {
        setSyncMsg({ text: '', type: '' });
      }, 4000);

    } catch (err) {
      console.error(err);
      setSyncMsg({ text: 'ভুল কোড! দয়া করে সঠিক কোডটি কপি করে এখানে পেস্ট করো।', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-[36px] shadow-[0_32px_64px_-16px_rgba(255,182,193,0.5)] w-full max-w-xl overflow-hidden relative border-4 border-white my-8"
        id="dashboard-container"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-brand-peach hover:bg-rose-100 text-brand-cherry p-2 rounded-full transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header banner */}
        <div className="bg-gradient-to-r from-brand-rose to-brand-cherry p-6 text-white text-center relative">
          <Heart className="w-8 h-8 mx-auto mb-2 text-white fill-brand-peach animate-pulse" />
          <h2 className="font-serif text-2xl font-black italic text-white">Love Admin Dashboard 💖</h2>
          <p className="font-sans text-xs opacity-90 tracking-widest uppercase mt-1 font-bold text-white">প্রপোজাল ট্র্যাকিং এবং ডেট প্ল্যানার</p>
        </div>

        {!isAuthenticated ? (
          /* LOGIN FLOW */
          <form onSubmit={handleLogin} className="p-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-peach rounded-full flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-brand-cherry" />
            </div>
            <h3 className="font-serif text-xl font-bold text-brand-maroon mb-2">সিক্রেট ড্যাশবোর্ড লক 🔒</h3>
            <p className="text-center text-xs text-brand-maroon/75 max-w-sm mb-6 leading-relaxed">
              শুধুমাত্র তোমার জন্য এই ড্যাশবোর্ডটি। অ্যাক্সেস পেতে তোমার সিক্রেট লাভ কোডটি প্রবেশ করো।
            </p>

            <div className="w-full max-w-xs space-y-4">
              <input
                id="pin-input"
                type="password"
                placeholder="লাভ কোড (যেমন: 143 বা love)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center tracking-widest font-black bg-brand-peach/30 border-2 border-pink-100 focus:border-brand-cherry focus:ring-1 focus:ring-brand-rose rounded-2xl py-3.5 outline-none transition-all text-lg text-brand-maroon"
                required
              />

              {errorMsg && (
                <p className="text-xs text-brand-cherry text-center font-bold animate-shake">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-brand-maroon hover:bg-brand-cherry text-white font-black rounded-2xl text-sm transition-colors cursor-pointer shadow-[0_4px_12px_rgba(74,14,14,0.15)]"
              >
                ড্যাশবোর্ড আনলক করো 🔑
              </button>
            </div>
            
            <p className="text-[10px] text-brand-pink/80 mt-8 italic text-center font-semibold">
              *Girlfriend will never see this panel. Enter Code to view her replies!
            </p>
          </form>
        ) : (
          /* REVEALED ADMIN PANEL */
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* Quick stats cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
                <span className="text-xs font-semibold text-rose-600 block mb-1">মোট কনফার্মড ডেট</span>
                <span className="text-3xl font-black text-rose-700">{responses.length}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center relative group">
                <span className="text-xs font-semibold text-slate-500 block mb-1">"No" এড়ানোর চেষ্টা</span>
                <span className="text-3xl font-black text-slate-700">{noClicksCount}</span>
                <span className="text-[10px] text-slate-400 block mt-1 italic">বার সে "No" চাপতে চেয়েছে!</span>
              </div>
            </div>

            {/* Funny verdict section based on No counts */}
            <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-4 flex items-start gap-3">
              <Award className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">রোমান্টিক রায় (Verdict)</h4>
                <p className="text-xs text-slate-600 mt-1">
                  {noClicksCount === 0
                    ? "চমৎকার! সে কোনো রকম দ্বিধা ছাড়াই প্রথমবারেই YES বলেছে! সে তোমাকে পাগলের মতো ভালোবাসে! 💘"
                    : noClicksCount < 5
                    ? `সে ${noClicksCount} বার দুষ্টুমি করে "No" চাপতে চেয়েছে, কিন্তু শেষমেশ ভালোবাসারই জয় হয়েছে! 😜`
                    : `সে ${noClicksCount} বার অসম্ভব চেষ্টা করেছে এড়ানোর কিন্তু আমাদের রোমান্টিক ফাঁদ থেকে বাঁচতে পারেনি! শেষমেষ রাজি হতেই হলো! 😂`}
                </p>
              </div>
            </div>

            {/* Manual Sync Code Entry for Vercel/stateless persistence */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <span>লাভ কোড দিয়ে অফলাইন সিঙ্ক 🔑</span>
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                যদি তোমরা আলাদা ডিভাইস ব্যবহার করো, এবং Vercel রিস্টার্টের কারণে বুকিং হিস্ট্রি দেখতে না পাও, তবে গার্লফ্রেন্ডের কপি করা স্পেশাল কোডটি নিচে পেস্ট করে সিঙ্ক করো:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="গার্লফ্রেন্ডের দেওয়া স্পেশাল কোডটি এখানে পেস্ট করো..."
                  value={syncCodeInput}
                  onChange={(e) => setSyncCodeInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 focus:border-brand-rose focus:ring-1 focus:ring-brand-rose rounded-xl px-3 py-2 text-xs outline-none transition-all font-mono"
                />
                <button
                  onClick={handleManualSync}
                  className="bg-brand-maroon hover:bg-brand-cherry text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  সিঙ্ক করো ⚡
                </button>
              </div>
              {syncMsg.text && (
                <p className={`text-[10px] font-bold ${syncMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'} animate-fade-in`}>
                  {syncMsg.text}
                </p>
              )}
            </div>

            {/* Responses List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="font-serif font-bold text-slate-800 text-sm">ডেটের বুকিং বুক (Booking Ledger)</h4>
                <div className="flex gap-2">
                  <button
                    onClick={fetchDashboardData}
                    disabled={isLoading}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
                    title="Refresh responses"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 cursor-pointer"
                    title="Clear all responses"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {responses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  এখনো কোনো ডেট বুক করা হয়নি। প্রপোজাল পেজে "YES" ক্লিক হওয়ার জন্য অপেক্ষা করো! 🌹
                </div>
              ) : (
                <div className="space-y-4">
                  {responses.map((resp, i) => (
                    <div
                      key={resp.id || i}
                      className="border border-slate-100 hover:border-pink-200 rounded-2xl p-4 bg-slate-50/30 space-y-2.5 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          #{i + 1} বুকিং
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(resp.timestamp).toLocaleString('bn-BD')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-slate-400 block font-medium">তারিখ (Date):</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-rose-500" />
                            {resp.selectedDate}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 block font-medium">সময় (Time):</span>
                          <span className="font-bold text-slate-800">
                            {resp.selectedTime}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-slate-100 pt-2.5">
                        <span className="text-xs text-slate-400 block font-medium">পছন্দের ডেট অ্যাক্টিভিটি:</span>
                        <span className="text-xs font-bold text-rose-600 block mt-0.5">
                          {resp.dateType}
                        </span>
                      </div>

                      {resp.customNotes && (
                        <div className="bg-white border border-slate-100 rounded-xl p-3 text-xs mt-1">
                          <span className="text-[10px] text-slate-400 block font-medium italic mb-1">তার স্পেশাল মেসেজ / আবদার:</span>
                          <p className="text-slate-700 italic font-sans leading-relaxed">
                            " {resp.customNotes} "
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
