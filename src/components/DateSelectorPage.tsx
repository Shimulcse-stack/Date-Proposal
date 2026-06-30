import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Sparkles, MapPin, Check, Heart, ArrowRight } from 'lucide-react';

interface DateSelectorPageProps {
  onConfirm: (dateDetails: {
    selectedDate: string;
    selectedTime: string;
    dateType: string;
    customNotes: string;
  }) => void;
}

const ACTIVITIES = [
  {
    id: 'coffee',
    title: 'Sunset Coffee ☕',
    bangla: 'সানসেট কফি ডেট',
    desc: 'একটি নিরিবিলি আরামদায়ক ক্যাফেতে কফির আড্ডা ও মিষ্টি গল্প।',
    color: 'from-amber-100 to-orange-100 border-amber-300 text-amber-900',
    iconColor: 'text-amber-600',
  },
  {
    id: 'dinner',
    title: 'Candlelight Dinner 🕯️',
    bangla: 'ক্যান্ডেললাইট ডিনার',
    desc: 'রোমান্টিক মৃদু আলো, পছন্দের গান আর চমৎকার স্বাদের ডিনার।',
    color: 'from-rose-100 to-pink-100 border-rose-300 text-rose-900',
    iconColor: 'text-rose-600',
  },
  {
    id: 'drive',
    title: 'Long Drive & Music 🚗',
    bangla: 'লং ড্রাইভ ও মিউজিক',
    desc: 'হালকা বাতাসে পছন্দের গান শুনতে শুনতে নিরুদ্দেশের পথ চলা।',
    color: 'from-blue-100 to-indigo-100 border-blue-300 text-blue-900',
    iconColor: 'text-blue-600',
  },
  {
    id: 'icecream',
    title: 'Ice Cream & Walk 🍦',
    bangla: 'আইসক্রিম ও রাতের হাঁটা',
    desc: 'রাতের শহর দেখতে দেখতে আইসক্রিম খাওয়া আর গল্প করে হাঁটা।',
    color: 'from-purple-100 to-fuchsia-100 border-purple-300 text-purple-900',
    iconColor: 'text-purple-600',
  }
];

const TIME_SLOTS = [
  { id: 'morning', label: '8:00 AM - 10:00 AM 🌅', name: 'সকালবেলার নাশতা' },
  { id: 'lunch', label: '1:00 PM - 3:00 PM 🍕', name: 'দুপুরের খাবার' },
  { id: 'sunset', label: '5:00 PM - 6:30 PM ☕', name: 'বিকেলের কফি' },
  { id: 'dinner_time', label: '8:00 PM - 10:00 PM 🕯️', name: 'রাতের ক্যান্ডেললাইট ডিনার' },
  { id: 'late_night', label: '10:30 PM - Midnight 🍦', name: 'লেট নাইট ডেজার্ট' },
];

export default function DateSelectorPage({ onConfirm }: DateSelectorPageProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('5:00 PM - 6:30 PM ☕');
  const [dateType, setDateType] = useState<string>('coffee');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);

  // Generate the next 7 days lovingly for a custom visual list
  const [upcomingDays, setUpcomingDays] = useState<Array<{ dateStr: string; label: string; weekday: string }>>([]);

  useEffect(() => {
    const list = [];
    const daysOfWeekBangla = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
    const monthsBangla = [
      "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", 
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];

    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);

      const dayVal = d.getDate();
      const monthName = monthsBangla[d.getMonth()];
      const weekday = daysOfWeekBangla[d.getDay()];
      
      const pad = (n: number) => n.toString().padStart(2, '0');
      const isoStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(dayVal)}`;

      list.push({
        dateStr: isoStr,
        label: `${dayVal} ${monthName}`,
        weekday: weekday
      });
    }
    setUpcomingDays(list);
    // Auto-select first day
    if (list.length > 0) {
      setSelectedDate(list[0].dateStr);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !dateType) {
      setShowError(true);
      return;
    }

    setIsSubmitting(true);
    setShowError(false);

    try {
      const selectedActivity = ACTIVITIES.find(a => a.id === dateType)?.title || dateType;
      
      // Save data locally and trigger the parent callback
      const details = {
        selectedDate,
        selectedTime,
        dateType: selectedActivity,
        customNotes
      };

      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(details),
      });

      if (response.ok) {
        onConfirm(details);
      } else {
        console.error('Server response was not ok, using frontend fallback state');
        onConfirm(details);
      }
    } catch (err) {
      console.warn('Network error, saving in local state directly', err);
      // Even if network fails, we want the client app to function beautifully
      const selectedActivity = ACTIVITIES.find(a => a.id === dateType)?.title || dateType;
      onConfirm({
        selectedDate,
        selectedTime,
        dateType: selectedActivity,
        customNotes
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl bg-white/95 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(255,182,193,0.6)] p-6 sm:p-10 border-4 border-white flex flex-col backdrop-blur-md"
      id="date-selector-card"
    >
      {/* Title */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="inline-block bg-brand-peach p-4 rounded-3xl mb-4 border border-rose-100 shadow-[0_8px_16px_rgba(255,182,193,0.2)]"
        >
          <Heart className="w-10 h-10 text-brand-cherry fill-brand-rose animate-pulse" />
        </motion.div>
        <h2 className="font-serif text-3xl font-extrabold text-brand-maroon tracking-tight leading-tight italic">
          আমাদের স্বপ্নের দিনটি সাজাও ✨
        </h2>
        <p className="font-sans text-xs text-brand-pink font-bold tracking-widest mt-2 uppercase">
          Customize Our Perfect Romantic Date
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Select Date */}
        <div>
          <h3 className="text-xs font-bold text-brand-pink uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="bg-brand-peach text-brand-cherry rounded-full w-5 h-5 inline-flex items-center justify-center text-[10px] font-black">1</span>
            কোন দিন যাবে আমার সাথে? (Step 1: Pick a Day)
          </h3>

          {/* Sweet Calendar Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {upcomingDays.map((day) => {
              const isSelected = selectedDate === day.dateStr;
              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col justify-center items-center gap-1 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-brand-cherry border-brand-cherry text-white shadow-md shadow-brand-rose/40 font-bold'
                      : 'bg-brand-peach/20 border-pink-100 hover:border-brand-rose text-brand-maroon'
                  }`}
                >
                  <span className="text-[10px] opacity-85 font-medium uppercase tracking-wider">{day.weekday}</span>
                  <span className="text-sm font-extrabold">{day.label}</span>
                </button>
              );
            })}

            {/* Custom Date Picker Button */}
            <div className="relative col-span-2 sm:col-span-4 mt-1">
              <span className="text-[11px] text-brand-maroon/70 block mb-2 font-semibold italic">অথবা অন্য কোনো দিন বেছে নাও (Or select custom):</span>
              <div className="flex items-center gap-2 bg-brand-peach/30 border-2 border-pink-100 rounded-2xl p-3 px-4">
                <Calendar className="w-4 h-4 text-brand-pink" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm text-brand-maroon outline-none w-full cursor-pointer font-semibold"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Select Time */}
        <div>
          <h3 className="text-xs font-bold text-brand-pink uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="bg-brand-peach text-brand-cherry rounded-full w-5 h-5 inline-flex items-center justify-center text-[10px] font-black">2</span>
            কোন সময়ে যেতে চাও? (Step 2: Preferred Time)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedTime === slot.label;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedTime(slot.label)}
                  className={`p-3.5 rounded-2xl border-2 text-left px-4 flex justify-between items-center transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-brand-maroon border-brand-maroon text-white font-bold shadow-lg shadow-brand-maroon/20'
                      : 'bg-brand-peach/10 border-pink-100 hover:border-brand-rose text-brand-maroon text-sm'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-brand-rose' : 'text-brand-pink/70'}`}>{slot.name}</span>
                    <span className="font-extrabold">{slot.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-rose" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Select Date Activity */}
        <div>
          <h3 className="text-xs font-bold text-brand-pink uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="bg-brand-peach text-brand-cherry rounded-full w-5 h-5 inline-flex items-center justify-center text-[10px] font-black">3</span>
            আমরা কী করব? (Step 3: Choose the Vibe)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACTIVITIES.map((activity) => {
              const isSelected = dateType === activity.id;
              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => setDateType(activity.id)}
                  className={`p-5 rounded-[24px] border-2 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col gap-1.5 ${
                    isSelected
                      ? `bg-pink-50 border-brand-cherry shadow-lg scale-[1.01] font-bold`
                      : 'bg-white border-pink-100 hover:border-brand-rose/60 text-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-brand-maroon">{activity.title}</span>
                    {isSelected && (
                      <span className="bg-brand-cherry text-white rounded-full p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-brand-pink font-bold tracking-wide">{activity.bangla}</span>
                  <p className="text-[11px] leading-relaxed text-slate-500 font-normal">
                    {activity.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Secret Wish / Custom Note */}
        <div>
          <h3 className="text-xs font-bold text-brand-pink uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="bg-brand-peach text-brand-cherry rounded-full w-5 h-5 inline-flex items-center justify-center text-[10px] font-black">4</span>
            কোনো বিশেষ আবদার বা সিক্রেট মেসেজ? (Step 4: Special Wishes)
          </h3>
          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            className="w-full bg-brand-peach/20 border-2 border-pink-100 focus:border-brand-cherry focus:ring-1 focus:ring-brand-rose outline-none rounded-2xl p-4 text-sm text-brand-maroon min-h-[90px] transition-all resize-none font-semibold"
            placeholder="যেমন: ড্রেস কোড কী হবে? নাকি আমার জন্য একটা লাল গোলাপ নিয়ে আসবে? 🌹"
            maxLength={300}
          />
        </div>

        {showError && (
          <p className="text-xs font-semibold text-brand-cherry text-center animate-bounce">
            দয়া করে সব অপশন সিলেক্ট করে নাও প্রিয়! ❤️
          </p>
        )}

        {/* Confirm Button */}
        <div className="pt-2">
          <motion.button
            id="confirm-date-btn"
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 bg-gradient-to-r from-brand-rose to-brand-cherry text-white font-black rounded-2xl text-lg shadow-[0_10px_25px_rgba(255,77,109,0.3)] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isSubmitting ? 'opacity-80 cursor-wait' : ''
            }`}
          >
            {isSubmitting ? (
              <span>কনফার্ম করা হচ্ছে... 💌</span>
            ) : (
              <>
                <span>Confirm Our Date 🗓️</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
