import React from 'react';
import { Business } from '../types';
import { getBusinessDailyCycle } from '../utils/bookingManager';

interface TargetBookingBadgeProps {
  business: Business;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'floating' | 'bar' | 'compact' | 'header';
  className?: string;
}

/**
 * علامة تنشين / تنشيط الحجز الذكية (Target Crosshair Reticle)
 * دائرة وبداخلها إكس / صليب (علامة تنشين)
 * لونها أخضر عند توفر أدوار الحجز (من 1 إلى 300) أو أحمر عند اكتمال الحجز أو الإغلاق
 * دورة 24 ساعة من 12:00 منتصف الليل إلى 12:00 منتصف الليل
 */
export const TargetBookingBadge: React.FC<TargetBookingBadgeProps> = ({
  business,
  onClick,
  variant = 'bar',
  className = '',
}) => {
  const dailyCycle = getBusinessDailyCycle(business.id);
  const totalCapacity = dailyCycle.totalCapacity || 300;
  const bookedCount = dailyCycle.currentBookedCount || 0;
  const availableCount = Math.max(0, totalCapacity - bookedCount);
  
  // هل النشاط متاح للحجز الآن؟ (أخضر إذا كان متاحاً وأقل من 300، أحمر إذا اكتمل 300 أو منتهي)
  const isAvailable = availableCount > 0 && business.status === 'active';
  const nextSlotNumber = Math.min(300, bookedCount + 1);

  // SVG علامة التنشين (دائرة وبداخلها صليب / إكس مع نقطة مركزية)
  const ReticleIcon = ({ size = 20 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${isAvailable ? 'animate-pulse' : ''}`}
    >
      {/* الدائرة الخارجية للتنشين */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={isAvailable ? 'text-emerald-400' : 'text-red-500'}
      />
      {/* الدائرة الداخلية للتنشين */}
      <circle
        cx="12"
        cy="12"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2 2"
        className={isAvailable ? 'text-emerald-300' : 'text-red-400'}
      />
      {/* صليب / خطوط الإكس التنشين الأربعة */}
      <line
        x1="12"
        y1="1"
        x2="12"
        y2="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={isAvailable ? 'text-emerald-400' : 'text-red-500'}
      />
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={isAvailable ? 'text-emerald-400' : 'text-red-500'}
      />
      <line
        x1="1"
        y1="12"
        x2="6"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={isAvailable ? 'text-emerald-400' : 'text-red-500'}
      />
      <line
        x1="18"
        y1="12"
        x2="23"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={isAvailable ? 'text-emerald-400' : 'text-red-500'}
      />
      {/* نقطة الهدف في المركز */}
      <circle
        cx="12"
        cy="12"
        r="2"
        fill="currentColor"
        className={isAvailable ? 'text-emerald-400' : 'text-red-500'}
      />
    </svg>
  );

  // 1. النمط العائم العمودي على يمين الريلز (TikTok Floating Button)
  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-center group cursor-pointer transition transform active:scale-75 ${className}`}
        title={`احجز الآن (حجز وزيارة) - ${isAvailable ? `متاح دور #${nextSlotNumber} من 300` : 'مكتمل الحجز 300/300'}`}
      >
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl backdrop-blur-md relative ${
            isAvailable
              ? 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-400 shadow-emerald-500/40 hover:bg-emerald-900 ring-2 ring-emerald-500/30'
              : 'bg-red-950/80 border-2 border-red-500 text-red-400 shadow-red-500/40 hover:bg-red-900 ring-2 ring-red-500/30'
          }`}
        >
          <ReticleIcon size={22} />
          {/* لمبة الحالة النابضة */}
          <span
            className={`absolute -top-1 -end-1 w-3.5 h-3.5 rounded-full border-2 border-black flex items-center justify-center ${
              isAvailable ? 'bg-emerald-400 animate-ping' : 'bg-red-500'
            }`}
          />
          <span
            className={`absolute -top-1 -end-1 w-3.5 h-3.5 rounded-full border-2 border-black ${
              isAvailable ? 'bg-emerald-400' : 'bg-red-500'
            }`}
          />
        </div>
        <span
          className={`text-[9px] font-black mt-0.5 px-1.5 py-0.5 rounded-md drop-shadow bg-black/80 whitespace-nowrap ${
            isAvailable ? 'text-emerald-300 border border-emerald-500/30' : 'text-red-300 border border-red-500/30'
          }`}
        >
          احجز الآن 🎯
        </span>
        <span className="text-[8px] font-mono font-bold text-amber-300 drop-shadow">
          #{nextSlotNumber}/300
        </span>
      </button>
    );
  }

  // 2. النمط المدمج والمصغر (Compact)
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black transition cursor-pointer backdrop-blur-md border active:scale-95 ${
          isAvailable
            ? 'bg-emerald-950/80 border-emerald-400/80 text-emerald-300 hover:bg-emerald-900 shadow-md shadow-emerald-500/20'
            : 'bg-red-950/80 border-red-500/80 text-red-300 hover:bg-red-900 shadow-md shadow-red-500/20'
        } ${className}`}
        title="حجز وزيارة - دورة 24 ساعة (من 12:00 إلى 12:00)"
      >
        <ReticleIcon size={16} />
        <span>احجز الآن</span>
        <span className="bg-black/60 px-1.5 py-0.2 rounded text-[10px] font-mono text-amber-300 border border-white/10">
          #{nextSlotNumber}/300
        </span>
      </button>
    );
  }

  // 3. النمط الرئيسي كزر بار تفاعلي (Bar / CTA Button)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden px-3.5 py-1.5 rounded-full font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg active:scale-95 select-none ${
        isAvailable
          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:brightness-110 text-white border border-emerald-300/40 shadow-emerald-600/30'
          : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:brightness-110 text-white border border-red-300/40 shadow-red-600/30'
      } ${className}`}
      title="حجز وزيارة مؤكدة برقم الدور التسلسلي من 1 إلى 300 (تصفير يومي 12:00 ص)"
    >
      {/* خلفية توهج خفيف */}
      <span
        className={`absolute inset-0 opacity-20 pointer-events-none transition group-hover:opacity-30 ${
          isAvailable ? 'bg-emerald-300' : 'bg-red-300'
        }`}
      />
      
      {/* أيقونة التنشين */}
      <div className={`p-1 rounded-full ${isAvailable ? 'bg-black/30' : 'bg-black/30'}`}>
        <ReticleIcon size={18} />
      </div>

      <div className="flex flex-col text-start leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-black drop-shadow">احجز الآن (حجز وزيارة)</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isAvailable ? 'bg-emerald-300 animate-ping' : 'bg-red-300'
            }`}
          />
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/90">
          <span className="text-amber-200 font-mono font-bold">
            {isAvailable ? `دور #${nextSlotNumber} متاح من 300` : 'مكتمل الحجز (300/300)'}
          </span>
          <span className="text-white/60">·</span>
          <span className="text-[9px] text-white/80">من 12 إلى 12</span>
        </div>
      </div>
    </button>
  );
};
