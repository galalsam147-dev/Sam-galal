import React, { useState } from 'react';
import { 
  X, Search, SlidersHorizontal, MapPin, Navigation, Sparkles, 
  ShoppingBag, Plus, Shield, CreditCard, LayoutGrid, Smartphone, 
  Globe, DollarSign, Mic, Tag, RotateCcw, Heart, Flame, CheckCircle, 
  Store, Phone, ChevronRight, Folder, FolderOpen, ArrowRight,
  Calendar, Building2, BedDouble
} from 'lucide-react';
import { Business, PackageTier, SortOption, SupportedCurrency, SupportedLang } from '../types';
import { CATEGORIES, SUBCATEGORIES, CITIES, LANG_LIST, I18N, getCategoryLabel, getCityLabel } from '../utils/translations';
import { CURRENCIES, formatServicePrice } from '../utils/currency';
import { OFFICIAL_PAYMENT_CONFIG } from '../utils/bankPaymentConfig';
import { UI_TRANSLATIONS } from '../utils/uiI18n';

interface SettingsFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Search & Filter
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedSubCategory: string;
  onSelectSubCategory: (sub: string) => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  sortBy: SortOption;
  onSelectSortBy: (sort: SortOption) => void;
  // Display & Location
  viewMode: 'reels' | 'grid';
  onToggleView: () => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  favoritesCount: number;
  showForSaleOnly: boolean;
  onToggleForSale: () => void;
  forSaleCount: number;
  onDetectLocation: () => void;
  hasUserLocation: boolean;
  isLocating: boolean;
  // Bookings (حجوزاتي الفندقية والسياحية داخل الإعدادات)
  onOpenBookings?: () => void;
  bookingsCount?: number;
  onOpenMusicBank?: () => void;
  // Actions
  onOpenAdd: () => void;
  onOpenAdmin: () => void;
  onOpenAssistantPortal?: () => void;
  onOpenThreePagesHub?: (initialTab?: 'page1_users_admin' | 'page2_customers' | 'page3_subscribers' | 'public_ads_tracking') => void;
  onOpenOrderNowDirectory?: () => void;
  onOpenNearbyDispatch?: () => void;
  onOpenOfficialDomain?: () => void;
  onOpenCustomerUpload?: () => void;
  onOpenChats?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onOpenSubscribersProgram: () => void;
  onOpenDelivery?: () => void;
  onOpenCaptainRegister?: () => void;
  onOpenTransportModal?: () => void;
  onOpenAppInstall?: () => void;
  onOpenSecurityNotice?: () => void;
  onOpenQuickRegister: () => void;
  onOpenCurrencyModal: () => void;
  currentCurrency: SupportedCurrency;
  lang: SupportedLang;
  onSelectLang: (lang: SupportedLang) => void;
  onResetData: () => void;
}

export const SettingsFolderModal: React.FC<SettingsFolderModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
  selectedCity,
  onSelectCity,
  sortBy,
  onSelectSortBy,
  viewMode,
  onToggleView,
  showFavoritesOnly,
  onToggleFavorites,
  favoritesCount,
  showForSaleOnly,
  onToggleForSale,
  forSaleCount,
  onDetectLocation,
  hasUserLocation,
  isLocating,
  onOpenBookings,
  bookingsCount = 0,
  onOpenMusicBank,
  onOpenAdd,
  onOpenAdmin,
  onOpenAssistantPortal,
  onOpenThreePagesHub,
  onOpenOrderNowDirectory,
  onOpenNearbyDispatch,
  onOpenOfficialDomain,
  onOpenCustomerUpload,
  onOpenChats,
  isMuted = true,
  onToggleMute,
  onOpenSubscribersProgram,
  onOpenDelivery,
  onOpenCaptainRegister,
  onOpenTransportModal,
  onOpenAppInstall,
  onOpenSecurityNotice,
  onOpenQuickRegister,
  onOpenCurrencyModal,
  currentCurrency,
  lang,
  onSelectLang,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bookings' | 'music' | 'filter' | 'business' | 'payment' | 'system'>('all');
  const [isListening, setIsListening] = useState(false);

  if (!isOpen) return null;

  const tUi = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.ar;
  const currInfo = CURRENCIES[currentCurrency];
  const currentLangObj = LANG_LIST.find((l) => l.code === lang) || LANG_LIST[0];

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(lang === 'ar' ? 'المتصفح لا يدعم البحث الصوتي المباشر' : 'Browser does not support voice search');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSearchChange(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-neutral-950 border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header Folder Bar */}
        <div className="bg-neutral-900 border-b border-white/10 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#FF2D55] flex items-center justify-center shadow-lg shadow-[#FF2D55]/30">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>{tUi.settingsModalTitle}</span>
              </h3>
              <p className="text-[11px] text-white/60">
                {tUi.settingsModalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title={lang === 'ar' ? 'إغلاق الحافظة' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Folder Sub-Tabs */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-white/10 overflow-x-auto hide-scroll shrink-0 bg-neutral-900/50">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#FF2D55] text-white shadow-md shadow-[#FF2D55]/30'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            {tUi.tabAll}
          </button>

          {/* New Bookings Tab in Settings (حجوزاتي الفندقية والسياحية) */}
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bookings'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30'
                : 'bg-white/5 hover:bg-white/10 text-amber-300/80 border border-amber-400/20'
            }`}
          >
            <span>🏨</span>
            <span>{lang === 'ar' ? 'حجوزاتي الفندقية والسياحية' : 'My Bookings'}</span>
            {bookingsCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'bookings' ? 'bg-black text-amber-300' : 'bg-amber-400/20 text-amber-300'
              }`}>
                {bookingsCount}
              </span>
            )}
          </button>

          {/* Nearby Proximity Dispatch Tab in Settings */}
          <button
            onClick={() => setActiveTab('music')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'music'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30'
                : 'bg-white/5 hover:bg-white/10 text-amber-300/80 border border-amber-400/20'
            }`}
          >
            <span>📡</span>
            <span>{lang === 'ar' ? 'الاتصال بالقرب (ديدي/أوبر)' : 'Proximity Calling'}</span>
          </button>

          <button
            onClick={() => setActiveTab('filter')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer ${
              activeTab === 'filter'
                ? 'bg-[#FF2D55] text-white shadow-md shadow-[#FF2D55]/30'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            {tUi.tabSearch}
          </button>

          <button
            onClick={() => setActiveTab('business')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer ${
              activeTab === 'business'
                ? 'bg-[#FF2D55] text-white shadow-md shadow-[#FF2D55]/30'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            {tUi.tabBusiness}
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer ${
              activeTab === 'payment'
                ? 'bg-[#FF2D55] text-white shadow-md shadow-[#FF2D55]/30'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            {tUi.tabPayment}
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer ${
              activeTab === 'system'
                ? 'bg-[#FF2D55] text-white shadow-md shadow-[#FF2D55]/30'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            {tUi.tabSystem}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">

          {/* UNIFIED 3-DOTS ALL BUTTONS VERTICAL STACK (جمع كل الزراير في إعدادات 3 نقط فوق بعض) */}
          {activeTab === 'all' && (
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-[#FF2D55]/40 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-[#FF2D55] text-white flex items-center justify-center font-black">⋮</span>
                  <span>قائمة الأزرار المجمعة (فوق بعض)</span>
                </span>
                <span className="text-[10px] text-emerald-300 font-bold">
                  100% موبايل وكمبيوتر
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {/* 0. منظومة الـ 3 صفحات المرتبطة (1: المستخدمين والأدمن + إظهار الباسورد، 2: العملاء، 3: المشتركين + الجمهور يرى الإعلانات والتتبع) */}
                {onOpenThreePagesHub && (
                  <div className="bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-emerald-500/20 border-2 border-amber-400/60 rounded-2xl p-2.5 space-y-2 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenThreePagesHub('page1_users_admin');
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 via-rose-600 to-purple-700 hover:from-amber-400 hover:to-purple-600 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-between transition active:scale-95 cursor-pointer border border-white/30"
                    >
                      <span className="flex items-center gap-2 text-start">
                        <Shield className="w-4 h-4 text-amber-200 shrink-0" />
                        <span>منظومة الـ 3 صفحات المرتبطة (إظهار باسورد المستخدم + عزل تام + التتبع)</span>
                      </span>
                      <span className="bg-black/40 text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-black shrink-0">
                        3 صفحات 🔗
                      </span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenThreePagesHub('page1_users_admin');
                        }}
                        className="bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/50 text-amber-200 font-black text-[10px] py-2 px-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <span>1️⃣ صفحة المستخدمين والأدمن (🔑 الباسورد)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenThreePagesHub('page2_customers');
                        }}
                        className="bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-200 font-black text-[10px] py-2 px-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <span>2️⃣ الصفحة الثانية: العملاء (معزولة)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenThreePagesHub('page3_subscribers');
                        }}
                        className="bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/50 text-emerald-200 font-black text-[10px] py-2 px-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <span>3️⃣ الصفحة الثالثة: المشتركين (معزولة)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenThreePagesHub('public_ads_tracking');
                        }}
                        className="bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/50 text-rose-200 font-black text-[10px] py-2 px-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <span>🌍 الجمهور: الإعلانات والتتبع</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 1. اشترك الآن + */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdd();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2D55] to-rose-600 hover:brightness-110 text-white font-black text-xs flex items-center justify-between shadow cursor-pointer transition"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4 shrink-0 stroke-[3]" />
                    <span>اشترك الآن + (أضف إعلانك مجاناً 3 شهور)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                </button>

                {/* 2. احجز الآن / حجوزاتي المؤكدة (1 إلى 300) */}
                {onOpenBookings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBookings();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-black font-black text-xs flex items-center justify-between shadow cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0 stroke-[2.5]" />
                      <span>احجز الآن وسجل الحجوزات اليومية (1 إلى 300) ({bookingsCount})</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 3. اطلب الآن - دليل الأنشطة والأوامر */}
                {onOpenOrderNowDirectory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOrderNowDirectory();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-black font-black text-xs flex items-center justify-between shadow cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>⚡</span>
                      <span>اطلب الآن (دليل الأنشطة والأوامر الشامل)</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 4. باسورد المدير العام (الأدمن) */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-black text-xs flex items-center justify-between cursor-pointer transition"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>👑 لوحة المدير العام وباسورد الأدمن والمستخدمين</span>
                  </span>
                  <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                </button>

                {/* 5. بوابة الـ 4 مساعدين للرقابة */}
                {onOpenAssistantPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAssistantPortal();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/45 border border-blue-400/50 text-cyan-200 font-black text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 shrink-0 text-cyan-400" />
                      <span>🛡️ بوابة الـ 4 مساعدين والرقابة (موافق / غير موافق / تعديل يدوي)</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 6. تحديد موقعي GPS */}
                <button
                  type="button"
                  onClick={() => {
                    onDetectLocation();
                    onClose();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-black text-xs flex items-center justify-between cursor-pointer transition"
                >
                  <span className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 shrink-0" />
                    <span>{hasUserLocation ? '📍 موقعي الجغرافي مفعل (عرض الأقرب)' : '📍 تحديد موقعي الجغرافي GPS'}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                </button>

                {/* 7. اطلب الأقرب ليك دليفري */}
                {onOpenDelivery && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDelivery();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 text-orange-300 font-black text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>🛵</span>
                      <span>اطلب الأقرب ليك (توصيل ودليفري مباشر)</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 8. اتصال بالقرب ديدي/أوبر */}
                {onOpenNearbyDispatch && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNearbyDispatch();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-black text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>📡</span>
                      <span>الاتصال بالقرب على المشتركين (تاكسي ودليفري)</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 9. رادار تاكسي وموتوسيكل */}
                {onOpenTransportModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTransportModal();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/40 text-yellow-200 font-black text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>🚕</span>
                      <span>رادار التتبع المباشر (تاكسي / موتوسيكل / شحن)</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 10. كابتن تاكسي ودليفري */}
                {onOpenCaptainRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCaptainRegister();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>🚕🛵</span>
                      <span>تسجيل كابتن توصيل أو تاكسي (3 شهور مجاناً)</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 11. تغيير طريقة العرض (ريلز / شبكة) */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleView();
                    onClose();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-sky-300 font-bold text-xs flex items-center justify-between cursor-pointer transition"
                >
                  <span className="flex items-center gap-2">
                    {viewMode === 'reels' ? <LayoutGrid className="w-4 h-4 shrink-0" /> : <Smartphone className="w-4 h-4 shrink-0" />}
                    <span>{viewMode === 'reels' ? 'تبديل إلى عرض الشبكة والبطاقات' : 'تبديل إلى عرض شاشة الموبايل 100% (ريلز)'}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                </button>

                {/* 12. المفضلة */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleFavorites();
                    onClose();
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-between cursor-pointer transition ${
                    showFavoritesOnly
                      ? 'bg-rose-600 text-white border-rose-400'
                      : 'bg-white/10 hover:bg-white/20 border-white/15 text-rose-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 shrink-0 fill-current" />
                    <span>الأماكن المفضلة ({favoritesCount})</span>
                  </span>
                  <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                </button>

                {/* 13. معروض للبيع */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleForSale();
                    onClose();
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-between cursor-pointer transition ${
                    showForSaleOnly
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-white/10 hover:bg-white/20 border-white/15 text-purple-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4 shrink-0" />
                    <span>العروض والمنتجات المعروضة للبيع ({forSaleCount})</span>
                  </span>
                  <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                </button>

                {/* 14. إضافة تجربة عميل بكتابة متحركة */}
                {onOpenCustomerUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCustomerUpload();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-pink-300 font-bold text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>🎬</span>
                      <span>نشر فيديو أو صورة تجربة عميل بشريط متحرك</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 15. المحادثات المباشرة */}
                {onOpenChats && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenChats();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-emerald-300 font-bold text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>💬</span>
                      <span>المحادثات المباشرة وتواصل واتساب</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 16. الدومين الرسمي */}
                {onOpenOfficialDomain && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOfficialDomain();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-emerald-400 font-bold text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>الرابط الرسمي والدومين المعتمد 🌐</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 17. تثبيت البرنامج */}
                {onOpenAppInstall && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAppInstall();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 font-bold text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>📲</span>
                      <span>تثبيت البرنامج على الموبايل والكمبيوتر 100%</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 18. كتم / تشغيل الصوت */}
                {onToggleMute && (
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>{isMuted ? '🔇' : '🔊'}</span>
                      <span>{isMuted ? 'تشغيل الصوت العام للإعلانات' : 'كتم الصوت العام للإعلانات'}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}

                {/* 19. التحذير الأمني والقانوني */}
                {onOpenSecurityNotice && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSecurityNotice();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-200 font-bold text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>التحذير الأمني والقانوني الرسمي</span>
                    </span>
                    <ChevronRight className="w-4 h-4 rotate-180 opacity-80" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 0. HOTEL & TOURISM BOOKINGS LINKED TO EACH SUBSCRIBER (حجوزاتي الفندقية والسياحية داخل الإعدادات) */}
          {(activeTab === 'all' || activeTab === 'bookings') && (
            <div className="bg-gradient-to-r from-amber-950/50 via-neutral-900 to-yellow-950/40 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between font-bold text-amber-300">
                <span className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow">
                    <Calendar className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-white block">
                      {lang === 'ar' ? 'حجوزاتي الفندقية والسياحية' : 'My Hotel & Tourism Bookings'}
                    </span>
                    <span className="text-[10px] text-amber-300/80 block font-medium">
                      {lang === 'ar' ? 'مرتبطة بحسابك ومسجلة لكل مشترك 🏨' : 'Linked to your account & each subscriber 🏨'}
                    </span>
                  </div>
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  {bookingsCount} {lang === 'ar' ? 'حجز مؤكد ✓' : 'Bookings'}
                </span>
              </div>

              <p className="text-[11px] text-white/75 leading-relaxed">
                {lang === 'ar'
                  ? 'سجل إقاماتك الفندقية، حجز الشاليهات، والرحلات السياحية المؤكدة مع كود التحقق. يمكنك تصفية حجوزاتك حسب كل مشترك، مراسلة المشترك على واتساب مباشرة، أو طباعة ومشاركة قسيمة الحجز.'
                  : 'Your confirmed hotel stays, chalets and tourism trips with instant vouchers. Filter your bookings by subscriber, WhatsApp them directly, or print booking vouchers.'}
              </p>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenBookings) onOpenBookings();
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 active:scale-98 text-black font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <Calendar className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {lang === 'ar'
                    ? `عرض وإدارة حجوزاتي الفندقية والسياحية (${bookingsCount})`
                    : `View & Manage My Bookings (${bookingsCount})`}
                </span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}

          {/* NEARBY PROXIMITY DISPATCH (الاتصال بالقرب على المشتركين والتاكسي والدليفري) */}
          {(activeTab === 'all' || activeTab === 'music' || activeTab === 'business') && (
            <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-orange-950/40 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg shadow-amber-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-black flex items-center justify-center font-black shadow text-lg">
                    📡
                  </div>
                  <div>
                    <h4 className="font-black text-white text-xs">
                      {lang === 'ar' ? 'الاتصال بالقرب على المشتركين (ديدي وأوبر للتاكسي والدليفري) ⚡' : 'Nearby Proximity Dispatch (Taxi & Delivery)'}
                    </h4>
                    <span className="text-[10px] text-white/60">
                      {lang === 'ar' ? 'اتصال مباشر على الكباتن والمشتركين الأقرب جغرافياً مع قبول أو رفض الطلب فوراً' : 'Proximity dispatch with instant driver accept / decline flow'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-400 text-black font-black px-2 py-0.5 rounded-full shadow">
                  GPS مباشر 🟢
                </span>
              </div>

              {onOpenTransportModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTransportModal();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-[#FF2D55] hover:brightness-110 active:scale-95 text-black font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>{lang === 'ar' ? 'فتح شاشة الاتصال والطلب بالقرب من موقعي 🚕🛵' : 'Open Nearby Dispatch & Calling'}</span>
                  <ChevronRight className="w-4 h-4 rotate-180 text-black" />
                </button>
              )}
            </div>
          )}
          
          {/* 1. SEARCH & CATEGORIES */}
          {(activeTab === 'all' || activeTab === 'filter') && (
            <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>{tUi.searchFilterTitle}</span>
                </span>
                {selectedCategory !== 'الكل' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    {getCategoryLabel(selectedCategory, lang)}
                  </span>
                )}
              </div>

              {/* Search Box */}
              <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={tUi.searchPlaceholder}
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-white/40"
                />
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`p-1 rounded-lg transition ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'text-white/60 hover:text-white'
                  }`}
                  title="بحث صوتي"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* City Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-white/70">{tUi.cityFilterLabel}</label>
                <select
                  value={selectedCity}
                  onChange={(e) => onSelectCity(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="" className="bg-neutral-900 text-white">{tUi.allCitiesOption}</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c} className="bg-neutral-900 text-white">
                      {getCityLabel(c, lang)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categories Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/70">{tUi.categoryLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat);
                        onSelectSubCategory('');
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer truncate ${
                        selectedCategory === cat
                          ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-md shadow-[#FF2D55]/30'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {getCategoryLabel(cat, lang)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              {selectedCategory && SUBCATEGORIES[selectedCategory] && (
                <div className="space-y-1 pt-1 border-t border-white/10">
                  <label className="text-[10px] font-bold text-amber-300">
                    {lang === 'ar' ? `تخصصات دقيقة في ${selectedCategory}:` : `Specialties in ${getCategoryLabel(selectedCategory, lang)}:`}
                  </label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => onSelectSubCategory('')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        selectedSubCategory === '' ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {tUi.tabAll}
                    </button>
                    {SUBCATEGORIES[selectedCategory].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => onSelectSubCategory(sub)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          selectedSubCategory === sub ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sorting Filter */}
              <div className="space-y-1 pt-1 border-t border-white/10">
                <label className="text-[11px] font-bold text-white/70">{tUi.sortLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-bold text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      onDetectLocation();
                      onSelectSortBy('nearest');
                    }}
                    className={`p-1.5 rounded-xl border transition flex items-center justify-center gap-1 ${
                      sortBy === 'nearest' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' : 'bg-white/5 border-white/10 text-white/70'
                    }`}
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{tUi.sortNearest}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectSortBy('trusted')}
                    className={`p-1.5 rounded-xl border transition flex items-center justify-center gap-1 ${
                      sortBy === 'trusted' ? 'bg-amber-500/20 text-amber-300 border-amber-400' : 'bg-white/5 border-white/10 text-white/70'
                    }`}
                  >
                    <span>{tUi.sortTrusted}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectSortBy('popular')}
                    className={`p-1.5 rounded-xl border transition flex items-center justify-center gap-1 ${
                      sortBy === 'popular' ? 'bg-rose-500/20 text-rose-300 border-rose-400' : 'bg-white/5 border-white/10 text-white/70'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-rose-400" />
                    <span>{tUi.sortPopular}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectSortBy('newest')}
                    className={`p-1.5 rounded-xl border transition flex items-center justify-center gap-1 ${
                      sortBy === 'newest' ? 'bg-blue-500/20 text-blue-300 border-blue-400' : 'bg-white/5 border-white/10 text-white/70'
                    }`}
                  >
                    <span>{tUi.sortNewest}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. BUSINESS & PUBLISHING OPTIONS */}
          {(activeTab === 'all' || activeTab === 'business') && (
            <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between font-bold text-rose-400">
                <span className="flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[#FF2D55]" />
                  <span>{tUi.bizManageTitle}</span>
                </span>
                <span className="text-[10px] bg-[#FF2D55]/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                  {tUi.free90DaysBadge}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Add Business Button */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdd();
                  }}
                  className="bg-gradient-to-r from-[#FF2D55] to-rose-600 hover:brightness-110 active:scale-95 text-white p-3 rounded-2xl flex items-center justify-between transition shadow-lg shadow-[#FF2D55]/25 cursor-pointer text-start font-bold"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 bg-white/20 rounded-full p-1 stroke-[3]" />
                    <div>
                      <div className="text-xs font-black">{tUi.addBizBtnTitle}</div>
                      <div className="text-[10px] text-white/80">{tUi.addBizBtnSub}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60 rotate-180" />
                </button>

                {/* Quick Register Unlisted */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenQuickRegister();
                  }}
                  className="bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-start font-bold"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-black">{tUi.registerUnlistedTitle}</div>
                      <div className="text-[10px] text-emerald-200/70">{tUi.registerUnlistedSub}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400/60 rotate-180" />
                </button>

                {/* Captain Delivery Registration */}
                {onOpenCaptainRegister && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCaptainRegister();
                    }}
                    className="bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-200 p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-start font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚕🛵</span>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>انضمام واشتراك كابتن تاكسي ودليفري (مشترك رسمي 100%)</span>
                          <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.2 rounded-full font-black">مجاناً 3 شهور 🎁</span>
                        </div>
                        <div className="text-[10px] text-amber-300/80">تفعيل فوري لصفحتك الخاصة وتتبع GPS وأرباح 100% لك بكافة خصائص المشترك</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400/60 rotate-180" />
                  </button>
                )}

                {/* Security & Anti-Fraud Legal Notice */}
                {onOpenSecurityNotice && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSecurityNotice();
                    }}
                    className="bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-200 p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-start font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <div className="text-xs font-black text-red-300">تحذير أمني وقانوني رسمي</div>
                        <div className="text-[10px] text-white/60">إخلاء مسؤولية من رسائل النصب والدعاية وشروط النشر</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-400/60 rotate-180" />
                  </button>
                )}

                {/* Live Taxi, Motorcycle, Limousine & Cargo GPS Tracking */}
                {onOpenTransportModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTransportModal();
                    }}
                    className="bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-200 p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-start font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚕</span>
                      <div>
                        <div className="text-xs font-black text-amber-300">رادار وطلب التاكسي والموتوسيكل والشحن (GPS)</div>
                        <div className="text-[10px] text-white/60">تتبع مباشر في محيطك للتاكسي، الليموزين، الأتوبيسات والشحن الثقيل</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400/60 rotate-180" />
                  </button>
                )}

                {/* App Download / Google Play / iPad */}
                {onOpenAppInstall && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAppInstall();
                    }}
                    className="bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/40 text-sky-200 p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-start font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📲</span>
                      <div>
                        <div className="text-xs font-black text-sky-300">تحميل البرنامج (Google Play / الآيباد / الموبايل)</div>
                        <div className="text-[10px] text-white/60">يعمل كتطبيق كامل على كل الأجهزة والآيباد بدون متجر أو عبر Google Play</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-sky-400/60 rotate-180" />
                  </button>
                )}

                {/* Admin Panel */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="bg-white/5 hover:bg-white/15 border border-white/15 text-white/90 p-3 rounded-2xl flex items-center justify-between transition cursor-pointer text-start font-bold"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-xs font-black">{tUi.adminPanelBtnTitle}</div>
                      <div className="text-[10px] text-white/50">{tUi.adminPanelBtnSub}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* 3. SUBSCRIPTIONS & OFFICIAL BANK PAYMENT */}
          {(activeTab === 'all' || activeTab === 'payment') && (
            <div className="bg-gradient-to-r from-blue-950/50 via-neutral-900 to-emerald-950/50 border border-blue-400/30 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>{tUi.subscriptionsTitle}</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  {tUi.officialBankBadge}
                </span>
              </div>

              <div className="text-xs text-white/85 leading-relaxed">
                {lang === 'ar' ? (
                  <>الاشتراك في المنصة يبدأ دائماً بـ <strong>90 يوماً مجاناً (0 ج.م)</strong> لجميع الأنشطة والمحلات. كما تتوفر باقات تميز ورعاية ذهبية VIP معتمدة:</>
                ) : (
                  <>Subscription begins with <strong>90 Days Free (0 EGP)</strong> for all businesses and shops. Premium verified plans are also available:</>
                )}
              </div>

              {/* Bank Details Card (أمان مصرفي مشدد - عدم ظهور أرقام الحسابات أو الهواتف علناً) */}
              <div className="bg-neutral-950/70 border border-emerald-500/30 p-3 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>بوابة سداد إلكترونية موثقة ومشفرة 🔒</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    حماية مالية 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-black/60 p-2.5 rounded-xl border border-white/10">
                    <span className="text-white/60 block text-[9px] mb-0.5">البنك الشريك المعتمد:</span>
                    <strong className="text-white text-xs block font-bold">{OFFICIAL_PAYMENT_CONFIG.bankName}</strong>
                    <span className="text-[10px] text-emerald-400 block mt-1 font-mono">
                      رقم الحساب: {OFFICIAL_PAYMENT_CONFIG.maskedAccountNumber} 🔒
                    </span>
                  </div>
                  <div className="bg-black/60 p-2.5 rounded-xl border border-white/10">
                    <span className="text-white/60 block text-[9px] mb-0.5">الآيبان والتحويل الدولي:</span>
                    <strong className="text-amber-300 text-[10px] block font-mono">{OFFICIAL_PAYMENT_CONFIG.maskedIban} 🔒</strong>
                    <span className="text-[9px] text-white/50 block mt-1">مشفر ومحمي بأعلى بروتوكول أمان مالي</span>
                  </div>
                </div>

                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1 text-[10px] text-white/80">
                  <div className="flex items-center justify-between text-white/90">
                    <span className="font-bold flex items-center gap-1">
                      <span>📱 فودافون كاش وإنستاباي:</span>
                    </span>
                    <span className="text-amber-300 font-bold">سداد إلكتروني مشفر وآمن ✓</span>
                  </div>
                  <p className="text-white/60 text-[9px] leading-relaxed">
                    حفاظاً على الأمان والخصوصية ومنع الرسائل العشوائية والاحتيال، أرقام الهواتف والحسابات مشفرة ولا تظهر علناً في الواجهة العامة. يتم التحويل والتوثيق التلقائي فوراً برقم المعاملة.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenSubscribersProgram();
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <span>{tUi.viewSubsProgramBtn}</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}

          {/* 4. SYSTEM & PREFERENCES */}
          {(activeTab === 'all' || activeTab === 'system') && (
            <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between font-bold text-sky-400">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                  <span>{tUi.displayLangTitle}</span>
                </span>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10">
                <div>
                  <div className="font-bold text-white text-xs">{tUi.viewModeLabel}</div>
                  <div className="text-[10px] text-white/60">
                    {viewMode === 'reels' ? tUi.viewModeReelsSub : tUi.viewModeGridSub}
                  </div>
                </div>
                <button
                  onClick={onToggleView}
                  className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
                >
                  {viewMode === 'reels' ? <LayoutGrid className="w-4 h-4 text-amber-400" /> : <Smartphone className="w-4 h-4 text-[#FF2D55]" />}
                  <span>{viewMode === 'reels' ? tUi.switchToGrid : tUi.switchToReels}</span>
                </button>
              </div>

              {/* Currency and Language */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenCurrencyModal();
                  }}
                  className="bg-black/40 hover:bg-black/60 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-start cursor-pointer transition"
                >
                  <div>
                    <span className="text-[10px] text-white/60 block">{tUi.currentCurrencyLabel}</span>
                    <strong className="text-xs text-amber-300 flex items-center gap-1">
                      <span>{currInfo.flag}</span>
                      <span>{currInfo.code}</span>
                    </strong>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 rotate-180" />
                </button>

                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-white/60 block mb-1">{tUi.languageLabel}</span>
                  <select
                    value={lang}
                    onChange={(e) => onSelectLang(e.target.value as SupportedLang)}
                    className="w-full bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                  >
                    {LANG_LIST.map((l) => (
                      <option key={l.code} value={l.code} className="bg-neutral-900 text-white">
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset to defaults */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onResetData}
                  className="text-[11px] text-white/50 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{tUi.restoreDefaultsBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gradient-to-r from-[#FF2D55] to-rose-600 hover:brightness-110 active:scale-95 text-white font-black text-xs px-5 py-2 rounded-xl shadow-lg shadow-[#FF2D55]/30 cursor-pointer"
                >
                  {tUi.applyAndCloseBtn}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-3 bg-neutral-950 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
          <span>{tUi.footerBrandText}</span>
          <button
            onClick={onClose}
            className="text-[#FF2D55] font-black hover:underline cursor-pointer"
          >
            {tUi.watchAdsNowBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
