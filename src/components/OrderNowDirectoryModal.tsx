import React from 'react';
import { 
  X, Sparkles, Navigation, ShoppingBag, Car, Bike, Truck, Bus, 
  MapPin, Phone, MessageCircle, Globe, Smartphone, ShieldCheck, 
  Coins, Volume2, Search, Mic, ArrowRight, Bed, Utensils, Scissors,
  Stethoscope, Building2, Wrench, ShieldAlert, Music, Award
} from 'lucide-react';
import { Business, SupportedCurrency, SupportedLang } from '../types';
import { CATEGORIES } from '../utils/translations';

interface OrderNowDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  onSelectCategory: (category: string) => void;
  onDetectLocation: () => void;
  hasUserLocation: boolean;
  isLocating: boolean;
  onOpenAdd: () => void;
  onOpenSubscribersProgram: () => void;
  onOpenDelivery: () => void;
  onOpenTransportTracking?: () => void;
  onOpenNearbyDispatch?: () => void;
  onOpenOfficialDomain?: () => void;
  onOpenMusicBank?: () => void;
  onOpenAppInstall?: () => void;
  onOpenSecurityNotice?: () => void;
  onOpenCurrencyModal?: () => void;
  onOpenBookingModal?: (biz: Business) => void;
  onVoiceSearchStart?: () => void;
  lang: SupportedLang;
}

export const OrderNowDirectoryModal: React.FC<OrderNowDirectoryModalProps> = ({
  isOpen,
  onClose,
  businesses,
  onSelectCategory,
  onDetectLocation,
  hasUserLocation,
  isLocating,
  onOpenAdd,
  onOpenSubscribersProgram,
  onOpenDelivery,
  onOpenTransportTracking,
  onOpenNearbyDispatch,
  onOpenOfficialDomain,
  onOpenMusicBank,
  onOpenAppInstall,
  onOpenSecurityNotice,
  onOpenCurrencyModal,
  onOpenBookingModal,
  onVoiceSearchStart,
  lang,
}) => {
  if (!isOpen) return null;

  // فئات الأنشطة مع الأيقونات
  const ACTIVITY_CATEGORIES = [
    { name: 'الكل', icon: '🌟', color: 'from-amber-500 to-yellow-600' },
    { name: 'مطاعم', icon: '🍔', color: 'from-red-500 to-orange-600' },
    { name: 'سندوتشات ووجبات سريعة', icon: '🌯', color: 'from-orange-500 to-amber-600' },
    { name: 'كافيهات', icon: '☕', color: 'from-amber-700 to-yellow-800' },
    { name: 'تاكسي وأجرة', icon: '🚕', color: 'from-yellow-400 to-amber-500 text-black' },
    { name: 'موتوسيكل ودليفري', icon: '🛵', color: 'from-orange-500 to-amber-500' },
    { name: 'سيارات ليموزين', icon: '🚘', color: 'from-slate-700 to-zinc-900' },
    { name: 'أتوبيسات رحلات وسياحة وعمرة', icon: '🚌', color: 'from-emerald-600 to-teal-800' },
    { name: 'شحن ونقل ثقيل', icon: '🚛', color: 'from-blue-600 to-indigo-800' },
    { name: 'فنادق ومنتجعات', icon: '🏨', color: 'from-indigo-600 to-purple-700' },
    { name: 'أطباء وعيادات', icon: '🩺', color: 'from-teal-600 to-cyan-700' },
    { name: 'صيدليات ومستشفيات', icon: '💊', color: 'from-emerald-600 to-green-700' },
    { name: 'كوافير وتجميل', icon: '💇', color: 'from-pink-500 to-rose-600' },
    { name: 'عقارات التجمع والكمبوندات', icon: '🏢', color: 'from-cyan-600 to-blue-700' },
    { name: 'حرفيين وصيانة منزلية', icon: '🛠️', color: 'from-amber-600 to-orange-700' },
    { name: 'سباكة وأدوات صحية', icon: '🔧', color: 'from-sky-600 to-blue-700' },
    { name: 'عمال ونقل أثاث', icon: '📦', color: 'from-yellow-600 to-amber-700' },
    { name: 'اتوبيس وسيارات مدرسة', icon: '🎒', color: 'from-amber-500 to-yellow-500 text-black' },
    { name: 'خدمات كمبوندات والتجمع', icon: '🏡', color: 'from-emerald-600 to-teal-700' },
    { name: 'تسوق ومولات', icon: '🛍️', color: 'from-purple-600 to-indigo-700' },
    { name: 'سيارات ومراكز خدمة', icon: '🚗', color: 'from-slate-600 to-zinc-800' },
    { name: 'محامين', icon: '⚖️', color: 'from-neutral-700 to-stone-900' },
    { name: 'محاسبين قانونيين', icon: '📊', color: 'from-blue-700 to-indigo-900' },
    { name: 'سياحة ورحلات', icon: '✈️', color: 'from-sky-500 to-blue-600' },
  ];

  const firstAvailableBiz = businesses.find((b) => b.status === 'active') || businesses[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[92vh] bg-gradient-to-b from-neutral-950 via-zinc-950 to-black border border-white/20 rounded-3xl flex flex-col shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                <span>اطلب الآن - دليل الأنشطة والأوامر</span>
                <span className="text-[10px] bg-[#FF2D55] text-white px-2 py-0.5 rounded-full font-bold">
                  شامل
                </span>
              </h2>
              <p className="text-[11px] text-white/60">
                جميع الأنشطة، الأوامر الذكية، الدليفري، والحجوزات مجمعة في مكان واحد
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="غلق الصفحة (✕)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          
          {/* 1. SECTION: Unified Add Ad & Subscribe (بدون تكرار - إعلان مجاني وتحته اشترك الآن) */}
          <div className="bg-gradient-to-br from-emerald-950/60 via-black to-neutral-900 border border-emerald-500/40 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>إضافة نشاط والاشتراك في المنصة (بدون تكرار):</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                عروض حصرية
              </span>
            </div>

            {/* زر أضف إعلانك مجاناً */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdd();
              }}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 active:scale-95 text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 border border-emerald-300/40 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>أضف إعلانك للجمهور والمشتركين مجاناً 🎁 (3 شهور مجاناً)</span>
            </button>

            {/* وتحته مباشرة: اشترك الآن في الباقات */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSubscribersProgram();
              }}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-[#FF2D55] hover:brightness-110 active:scale-95 text-black font-black py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md border border-amber-300/40 transition cursor-pointer"
            >
              <Award className="w-4 h-4 fill-black" />
              <span>اشترك الآن في الباقات السنوية والشهرية وتفعيل الدفع الإلكتروني 💎</span>
            </button>
          </div>

          {/* 2. SECTION: Major Smart Commands (الأوامر السريعة التفاعلية) */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <span>⚡ الأوامر الذكية السريعة:</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* أمر: احجز الآن (علامة التنشين) */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (firstAvailableBiz && onOpenBookingModal) {
                    onOpenBookingModal(firstAvailableBiz);
                  }
                }}
                className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 p-2.5 rounded-xl flex flex-col items-center text-center gap-1 transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center text-lg group-hover:scale-110 transition">
                  🎯
                </div>
                <span className="text-[11px] font-black text-emerald-300">احجز الآن (حجز وزيارة)</span>
                <span className="text-[9px] text-white/60">من 1 إلى 300 دور يومياً</span>
              </button>

              {/* أمر: اطلب الأقرب ليك (دليفري خاص) */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDelivery();
                }}
                className="bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 p-2.5 rounded-xl flex flex-col items-center text-center gap-1 transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center text-lg group-hover:scale-110 transition">
                  🛵
                </div>
                <span className="text-[11px] font-black text-amber-300">اطلب الأقرب ليك (دليفري)</span>
                <span className="text-[9px] text-white/60">جمع طلبك مباشر</span>
              </button>

              {/* أمر: طلب وتتبع GPS (تاكسي وشحن) */}
              {onOpenTransportTracking && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTransportTracking();
                  }}
                  className="bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-500/40 p-2.5 rounded-xl flex flex-col items-center text-center gap-1 transition active:scale-95 cursor-pointer shadow-sm group"
                >
                  <div className="w-9 h-9 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-400/40 flex items-center justify-center text-lg group-hover:scale-110 transition">
                    🚕
                  </div>
                  <span className="text-[11px] font-black text-yellow-300">طلب وتتبع GPS مباشر</span>
                  <span className="text-[9px] text-white/60">تاكسي، ليموزين، نقل</span>
                </button>
              )}

              {/* أمر: تحديد موقعي بالـ GPS */}
              <button
                type="button"
                onClick={() => {
                  onDetectLocation();
                }}
                className="bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/40 p-2.5 rounded-xl flex flex-col items-center text-center gap-1 transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/40 flex items-center justify-center text-lg group-hover:scale-110 transition">
                  📍
                </div>
                <span className="text-[11px] font-black text-blue-300">حدد موقعي بالـ GPS</span>
                <span className="text-[9px] text-white/60">
                  {isLocating ? 'جاري التحديد...' : hasUserLocation ? 'تم التحديد ✓' : 'إظهار الأقرب لك'}
                </span>
              </button>

              {/* أمر: اتصال بالقرب ⚡ */}
              {onOpenNearbyDispatch && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNearbyDispatch();
                  }}
                  className="bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 p-2.5 rounded-xl flex flex-col items-center text-center gap-1 transition active:scale-95 cursor-pointer shadow-sm group"
                >
                  <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-400 border border-purple-400/40 flex items-center justify-center text-lg group-hover:scale-110 transition">
                    📡
                  </div>
                  <span className="text-[11px] font-black text-purple-300">اتصال بالقرب ⚡</span>
                  <span className="text-[9px] text-white/60">ديدي وأوبر وسيارات</span>
                </button>
              )}

              {/* أمر: بحث صوتي فويس */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onVoiceSearchStart) onVoiceSearchStart();
                }}
                className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 p-2.5 rounded-xl flex flex-col items-center text-center gap-1 transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 border border-rose-400/40 flex items-center justify-center text-lg group-hover:scale-110 transition">
                  🎙️
                </div>
                <span className="text-[11px] font-black text-rose-300">بحث بالصوت فويس</span>
                <span className="text-[9px] text-white/60">تحدث للبحث الفوري</span>
              </button>
            </div>
          </div>

          {/* 3. SECTION: All Activities & Categories Grid (جمع الأنشطة في اطلب الآن) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white/90 flex items-center gap-1.5">
                <span>📁 جمع الأنشطة التجارية والخدمات:</span>
              </h3>
              <span className="text-[10px] text-white/50 font-mono">
                {ACTIVITY_CATEGORIES.length} تصنيف نشط
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {ACTIVITY_CATEGORIES.map((act) => {
                const count = act.name === 'الكل' 
                  ? businesses.length 
                  : businesses.filter((b) => b.cat === act.name).length;

                return (
                  <button
                    key={act.name}
                    type="button"
                    onClick={() => {
                      onSelectCategory(act.name);
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 flex items-center gap-2 transition cursor-pointer text-start active:scale-95 group"
                  >
                    <span className="text-lg shrink-0 group-hover:scale-110 transition">
                      {act.icon}
                    </span>
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold text-white block truncate">
                        {act.name}
                      </span>
                      <span className="text-[9px] text-amber-400 font-mono font-bold">
                        {count} مشترك
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. SECTION: Small Utility Controls Row (إظهار جميع الزراير المخفية صغيرة) */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[10px] font-bold text-white/60 block">
              الأدوات والروابط الرسمية (صغيرة ومجمعة):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {onOpenOfficialDomain && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOfficialDomain();
                  }}
                  className="bg-black/60 hover:bg-neutral-800 text-emerald-400 border border-emerald-500/40 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Globe className="w-3 h-3" />
                  <span>alasematex.com</span>
                </button>
              )}

              {onOpenMusicBank && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMusicBank();
                  }}
                  className="bg-black/60 hover:bg-neutral-800 text-amber-300 border border-amber-400/40 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Music className="w-3 h-3" />
                  <span>بنك الموسيقى 🎵</span>
                </button>
              )}

              {onOpenAppInstall && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAppInstall();
                  }}
                  className="bg-black/60 hover:bg-neutral-800 text-sky-300 border border-sky-400/40 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>تحميل التطبيق 📲</span>
                </button>
              )}

              {onOpenSecurityNotice && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSecurityNotice();
                  }}
                  className="bg-black/60 hover:bg-neutral-800 text-rose-300 border border-rose-400/40 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>تحذير الأمان 🛡️</span>
                </button>
              )}

              {onOpenCurrencyModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCurrencyModal();
                  }}
                  className="bg-black/60 hover:bg-neutral-800 text-yellow-300 border border-yellow-400/40 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Coins className="w-3 h-3" />
                  <span>العملات والأسعار 💱</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-white/10 bg-black/60 flex items-center justify-between">
          <span className="text-[10px] text-white/50">
            اطلب الأقرب ليك • منصة إعلانك دليلك الذكي
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer"
          >
            غلق الصفحة ✕
          </button>
        </div>
      </div>
    </div>
  );
};
