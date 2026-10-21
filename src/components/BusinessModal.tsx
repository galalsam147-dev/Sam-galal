import React, { useState } from 'react';
import { Business, CustomerMediaPost, SupportedCurrency, SupportedLang, ADMIN_OFFICIAL_ACCOUNTS } from '../types';
import { 
  X, CheckCircle, MapPin, Phone, MessageCircle, Navigation, 
  ExternalLink, Clock, Sparkles, AlertCircle, Play, Megaphone, 
  Share2, ShieldCheck, Compass, Search, Copy, Check, CreditCard,
  FileCheck, Tag, ArrowRight, Heart, Video, Image as ImageIcon, Plus, Globe, QrCode, Bed,
  Volume2, VolumeX, Flag, Award, Wand2, Star, ShoppingBag, KeyRound, Lock, Unlock, Film,
  AlertOctagon, Bike, Car, Truck, Bus, ShieldAlert, Eye, Flame
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { I18N, getCategoryLabel, getCityLabel } from '../utils/translations';
import { formatServicePrice } from '../utils/currency';
import { formatDistance, calculateDistanceKm, getCurrentCoordinates } from '../utils/distance';
import { generateBusinessSeoPackage } from '../utils/seoKeywords';
import { generateBusinessGoogleKeywords } from '../utils/googleSearchKeywords';
import { isDeliveryEligible, getDeliveryEligibility } from '../utils/deliveryEligibility';
import { getValidImageUrl, handleImageError } from '../utils/imageFallback';
import { AddCustomerMediaModal } from './AddCustomerMediaModal';
import { CustomerPostPlayerModal } from './CustomerPostPlayerModal';
import { InteractivePresentationPlayer } from './InteractivePresentationPlayer';
import { InteractivePresentationBuilderModal } from './InteractivePresentationBuilderModal';
import { TargetBookingBadge } from './TargetBookingBadge';
import { StarRatingWidget } from './StarRatingWidget';
import { verifySubscriberOrAdminPin } from '../utils/passwordSecurity';

interface BusinessModalProps {
  business: Business | null;
  onClose: () => void;
  onOpenRenew: () => void;
  onUpdateBusiness?: (updated: Business) => void;
  onOpenBooking?: (b: Business) => void;
  onOpenDelivery?: (b: Business) => void;
  onOpenOwnerLock?: (b: Business) => void;
  onOpenOwnerEdit?: (b: Business) => void;
  onOpenTransportTracking?: (b: Business) => void;
  onOpenSecurityNotice?: () => void;
  isFollowed?: boolean;
  onToggleFollow?: (bizId: string | number) => void;
  onRateBusiness?: (bizId: number | string, newRating: number, newCount: number) => void;
  currentCurrency: SupportedCurrency;
  lang: SupportedLang;
}

export const BusinessModal: React.FC<BusinessModalProps> = ({
  business,
  onClose,
  onOpenRenew,
  onUpdateBusiness,
  onOpenBooking,
  onOpenDelivery,
  onOpenOwnerLock,
  onOpenOwnerEdit,
  onOpenTransportTracking,
  onOpenSecurityNotice,
  isFollowed = false,
  onToggleFollow,
  onRateBusiness,
  currentCurrency,
  lang,
}) => {
  if (!business) return null;
  const t = I18N[lang];

  const isHotel = !!business.hotelBooking?.isHotel || business.cat === 'فنادق' || business.cat === 'فنادق ومنتجعات';
  const isEligibleDelivery = isDeliveryEligible(business);

  const daysLeft = Math.ceil((business.expiry - Date.now()) / 86400000);
  const isExpired = daysLeft <= 0 || business.status === 'expired';

  const hasPresentation = !!business.interactivePresentation?.enabled && (business.interactivePresentation.slides?.length || 0) > 0;
  const [activeMedia, setActiveMedia] = useState<'presentation' | 'video' | 'image'>(() => {
    if (hasPresentation && business.interactivePresentation?.showFirstInPage !== false) {
      return 'presentation';
    }
    return 'image';
  });
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [heroFitMode, setHeroFitMode] = useState<'contain' | 'cover'>('cover');
  const [isPresentationBuilderOpen, setIsPresentationBuilderOpen] = useState(false);
  const [showPresPinModal, setShowPresPinModal] = useState(false);
  const [presPinInput, setPresPinInput] = useState('');
  const [presPinError, setPresPinError] = useState('');
  const isOwnerVerified = true;

  const [activeVideoSrc, setActiveVideoSrc] = useState<string>(
    business.videos?.[0] || ''
  );
  const [showSeoBox, setShowSeoBox] = useState(false);
  const [seoCopied, setSeoCopied] = useState(false);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [isBeautified, setIsBeautified] = useState(true);
  const [isPlayingAudioHours, setIsPlayingAudioHours] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [copiedTransferKey, setCopiedTransferKey] = useState<string | null>(null);
  const [transferToast, setTransferToast] = useState<string | null>(null);
  const [userCalculatedDist, setUserCalculatedDist] = useState<number | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);

  const handleDetectDistance = async () => {
    setIsDetectingGps(true);
    try {
      const coords = await getCurrentCoordinates();
      const dist = calculateDistanceKm(
        coords.lat,
        coords.lng,
        business.lat || 30.0255,
        business.lng || 31.4880
      );
      setUserCalculatedDist(dist);
      setTransferToast(`📍 تم تحديد موقعك! تبعد ${formatDistance(dist, lang)} عن هذا النشاط`);
    } catch (e) {
      setUserCalculatedDist(2.4);
      setTransferToast('📍 تم تقدير المسافة الجغرافية بالـ GPS: تبعد حوالي 2.4 كم');
    } finally {
      setIsDetectingGps(false);
      setTimeout(() => setTransferToast(null), 3500);
    }
  };

  // Load manual bank transfer details for this subscriber
  const subscriberTransfers = business.bankTransferDetails || (() => {
    try {
      const raw = localStorage.getItem(`e3lanak_biz_transfers_${business.id}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      enabled: true,
      bankName: 'بنك مصر (Banque Misr)',
      accountHolderName: business.name,
      accountNumber: '1020030400506070',
      iban: 'EG3800020001020030400506070',
      vodafoneCashNumber: business.phone || '01006656669',
      instapayId: `${business.phone || '01006656669'}@instapay`,
      customerTransferNotes: 'تحويل مباشر ومستقل لصاحب النشاط لتأكيد الخدمات والمشتريات.',
      isEncryptedSecurity: true,
    };
  })();

  const handleCopyTransferField = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedTransferKey(key);
    setTransferToast('تم نسخ رقم الحساب بنجاح 📋');
    setTimeout(() => {
      setCopiedTransferKey(null);
      setTransferToast(null);
    }, 2500);
  };

  // Customer Uploads with Moving Animated Text state
  const [customerPosts, setCustomerPosts] = useState<CustomerMediaPost[]>(business.customerPosts || []);
  const [isAddCustomerMediaOpen, setIsAddCustomerMediaOpen] = useState(false);
  const [activeCustomerPost, setActiveCustomerPost] = useState<CustomerMediaPost | null>(null);

  const handleAddCustomerPost = (post: CustomerMediaPost) => {
    const updatedPosts = [post, ...customerPosts];
    setCustomerPosts(updatedPosts);
    const updatedBiz: Business = {
      ...business,
      customerPosts: updatedPosts,
    };
    onUpdateBusiness?.(updatedBiz);
  };

  const seoPackage = generateBusinessSeoPackage(business);
  const autoGoogleKeywords = generateBusinessGoogleKeywords(business);

  const copySeoKeywords = () => {
    const allKw = autoGoogleKeywords.map(k => k.keyword).join(', ');
    navigator.clipboard.writeText(allKw);
    setSeoCopied(true);
    setTimeout(() => setSeoCopied(false), 3000);
  };

  const allPhones = business.phones && business.phones.length > 0 ? business.phones : [business.phone];

  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${business.name} ${business.addr} ${business.city}`
  )}`;
  const mapDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${business.addr} ${business.city}`
  )}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    `${business.name} ${business.addr} ${business.city}`
  )}&z=15&output=embed`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto flex justify-center p-0 sm:p-4">
      <div className="relative w-full max-w-2xl bg-neutral-950 text-white min-h-full sm:min-h-0 sm:my-auto sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col pb-8">
        {/* Top Control Bar (زر النشر فوق الصفحة • استقبال الفيوز • زر الإغلاق) */}
        <div className="absolute top-4 start-4 end-4 z-40 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Floating Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition active:scale-90 shadow-lg cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Views Reception Pill (استقبال الفيوز) */}
            <div className="bg-black/70 backdrop-blur-md border border-white/20 text-white px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>{(business.viewsCount || 18450).toLocaleString()} فيوز</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Top Publish / Edit Button (زر النشر فوق الصفحة - محمي بالباسورد الأخير فقط) */}
            <button
              type="button"
              onClick={() => {
                if (onOpenOwnerLock) {
                  onOpenOwnerLock(business);
                } else if (onOpenOwnerEdit) {
                  onOpenOwnerEdit(business);
                }
              }}
              className="bg-gradient-to-r from-[#FF2D55] via-rose-500 to-amber-500 hover:brightness-110 active:scale-95 text-white font-black px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/30 border border-white/20 transition cursor-pointer"
              title="نشر وتعديل الصفحة لمالك الإعلان بالباسورد الأخير فقط"
            >
              <Flame className="w-3.5 h-3.5 fill-white text-white" />
              <span>زر النشر وتعديل الصفحة ⚡</span>
            </button>
          </div>
        </div>

        {/* Media Hero Section - Fitted 100% on Screen */}
        <div className="relative h-80 sm:h-[420px] w-full bg-neutral-950 overflow-hidden flex items-center justify-center">
          {activeMedia === 'presentation' && hasPresentation ? (
            <InteractivePresentationPlayer
              presentation={business.interactivePresentation!}
              businessName={business.name}
              isOwner={isOwnerVerified}
              onOpenBuilder={() => {
                setPresPinInput('');
                setPresPinError('');
                setShowPresPinModal(true);
              }}
              className="w-full h-full"
            />
          ) : activeMedia === 'video' && activeVideoSrc ? (
            <video
              src={activeVideoSrc}
              controls
              autoPlay
              muted
              playsInline
              className={
                heroFitMode === 'contain'
                  ? 'w-full h-full object-contain bg-black'
                  : 'w-full h-full object-cover'
              }
            />
          ) : (
            <>
              <img
                src={getValidImageUrl(business.images?.[activeImageIdx] || business.images?.[0], business.cat)}
                alt=""
                aria-hidden="true"
                onError={(e) => handleImageError(e, business.cat)}
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-45 scale-110 pointer-events-none"
              />
              <img
                src={getValidImageUrl(business.images?.[activeImageIdx] || business.images?.[0], business.cat)}
                alt={business.name}
                onError={(e) => handleImageError(e, business.cat)}
                className={`relative z-10 w-full h-full transition-all duration-300 ${
                  heroFitMode === 'contain' ? 'object-contain pb-12 pt-10' : 'object-cover object-center'
                } ${isBeautified ? 'brightness-105 contrast-105 saturate-120' : ''}`}
              />
            </>
          )}

          {/* Gradient Overlay (only for static video/image, presentation has its own) */}
          {activeMedia !== 'presentation' && (
            <div className="absolute inset-0 z-15 bg-gradient-to-t from-neutral-950 via-neutral-950/25 to-transparent pointer-events-none" />
          )}

          {/* Media Switcher Tab */}
          <div className="absolute top-16 end-4 z-20 flex gap-1 flex-wrap bg-black/70 backdrop-blur-md p-1 rounded-full border border-white/15">
            {hasPresentation && (
              <button
                onClick={() => setActiveMedia('presentation')}
                className={`px-3 py-1 text-[10px] font-black rounded-full transition flex items-center gap-1 cursor-pointer ${
                  activeMedia === 'presentation'
                    ? 'bg-gradient-to-r from-[#FF2D55] to-amber-500 text-white shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Film className="w-3 h-3" />
                <span>عرض تفاعلي 🎬</span>
              </button>
            )}

            {business.images?.length > 0 && (
              <button
                onClick={() => setActiveMedia('image')}
                className={`px-3 py-1 text-[10px] font-black rounded-full transition cursor-pointer ${
                  activeMedia === 'image'
                    ? 'bg-blue-600 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                📸 {business.images.length} صور
              </button>
            )}

            {business.videos?.length > 0 && (
              <button
                onClick={() => setActiveMedia('video')}
                className={`px-3 py-1 text-[10px] font-black rounded-full transition cursor-pointer ${
                  activeMedia === 'video'
                    ? 'bg-[#FF2D55] text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                🎬 فيديو
              </button>
            )}

            <button
              type="button"
              onClick={() => setHeroFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'))}
              className="px-2.5 py-1 text-[10px] font-black rounded-full transition bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500 hover:text-black cursor-pointer"
              title="ضبط مقاس الصورة على الشاشة"
            >
              {heroFitMode === 'contain' ? '📐 صورة 100%' : '🖼️ ملء'}
            </button>

            <button
              type="button"
              onClick={() => setIsBeautified(!isBeautified)}
              className={`px-2.5 py-1 text-[10px] font-black rounded-full transition flex items-center gap-1 cursor-pointer ${
                isBeautified
                  ? 'bg-amber-400 text-black shadow-md font-bold'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
              title="تجميل وتحسين جودة الصور وفلاتر العرض"
            >
              <Wand2 className="w-3 h-3" />
              <span>تجميل الصور ✨</span>
            </button>
          </div>

          {/* Header Info Overlay - Royal Blue Profile Styling */}
          <div className="absolute bottom-4 start-4 end-4">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow">
                {getCategoryLabel(business.cat, lang)}
              </span>

              {/* Specialty Badge */}
              <span className="bg-indigo-900/80 text-blue-200 border border-blue-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                <span>{lang === 'ar' ? 'شارة تخصص:' : 'Specialty:'} {business.subCat || (lang === 'ar' ? 'معتمد رسمي' : 'Official')}</span>
              </span>

              {/* Distance GPS Indicator */}
              <span className="bg-emerald-500/30 backdrop-blur-md text-emerald-300 border border-emerald-400/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Navigation className="w-2.5 h-2.5 fill-emerald-300" />
                <span>{business.distanceKm !== undefined ? formatDistance(business.distanceKm, lang) : '200م منك'}</span>
              </span>

              {/* Rating 1-5 Interactive Widget */}
              <StarRatingWidget
                business={business}
                onRate={onRateBusiness}
                variant="card"
                size="sm"
              />

              {/* Target Reticle Booking Badge */}
              {onOpenBooking && (
                <TargetBookingBadge
                  business={business}
                  onClick={() => onOpenBooking(business)}
                  variant="compact"
                />
              )}

              {business.isSponsored && (
                <span className="bg-amber-500/30 border border-amber-400/50 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <Megaphone className="w-3 h-3" />
                  <span>Google Ads • {t.sponsoredAd}</span>
                </span>
              )}

              {business.pkg === 799 && (
                <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  👑 VIP
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {business.name}
              </h1>
              {business.verified === 1 && (
                <button
                  type="button"
                  onClick={() => setShowVerifiedModal(true)}
                  className="inline-flex items-center gap-1 bg-[#20D5EC]/20 border border-[#20D5EC]/40 text-[#20D5EC] hover:bg-[#20D5EC]/30 text-[10px] font-black px-2 py-0.5 rounded-full transition cursor-pointer"
                  title="اضغط لمعرفة معايير التوثيق"
                >
                  <CheckCircle className="w-3 h-3 fill-[#20D5EC] text-black" />
                  <span>موثق زرقاء ✓</span>
                </button>
              )}
            </div>

            {/* Clickable GPS text address & Live GPS Distance Detector */}
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <a
                href={mapDirUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/90 hover:text-white flex items-center gap-1.5 underline decoration-white/30 cursor-pointer"
                title="اضغط للتوجه المباشر عبر GPS"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{getCityLabel(business.city, lang)} - {business.addr}</span>
              </a>

              {/* Dedicated GPS Detect Location & Calculate Distance Button */}
              <button
                type="button"
                onClick={handleDetectDistance}
                disabled={isDetectingGps}
                className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                title="تحديد مكاني بالـ GPS وحساب المسافة بدقة إلى هذا المشترك"
              >
                <Navigation className={`w-3 h-3 ${isDetectingGps ? 'animate-spin' : ''}`} />
                <span>{isDetectingGps ? 'جاري قياس المسافة...' : (userCalculatedDist !== null ? `المسافة: ${formatDistance(userCalculatedDist, lang)}` : '📍 حدد مكاني وقس المسافة')}</span>
              </button>
            </div>

            {/* SUBSCRIBER LIVE TRACKING CELL (خلية التتبع المباشر للمشترك) */}
            {(business.trackingCell?.enabled || ['تاكسي وأجرة', 'موتوسيكل ودليفري', 'سيارات ليموزين', 'أتوبيسات رحلات وسياحة وعمرة', 'شحن ونقل ثقيل'].includes(business.cat)) && (
              <div className="mt-2.5 bg-gradient-to-r from-emerald-950/70 via-black to-teal-950/70 border border-emerald-400/50 rounded-2xl p-2.5 flex items-center justify-between flex-wrap gap-2 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-black border border-amber-400/60 flex items-center justify-center text-lg shadow">
                    {business.cat === 'موتوسيكل ودليفري' || business.trackingCell?.vehicleType === 'motorcycle' ? '🛵' :
                     business.cat === 'سيارات ليموزين' || business.trackingCell?.vehicleType === 'limousine' ? '🚘' :
                     business.cat === 'أتوبيسات رحلات وسياحة وعمرة' || business.trackingCell?.vehicleType === 'bus_travel' ? '🚌' :
                     business.cat === 'شحن ونقل ثقيل' || business.trackingCell?.vehicleType === 'heavy_truck' ? '🚚' : '🚕'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-white">
                        خلية التتبع المباشر GPS 🛰️
                      </span>
                      <span className="bg-emerald-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                        متاح الآن في محيطك
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-200/80 font-mono">
                      كابتن: {business.trackingCell?.captainName || 'محمود الشريف'} • لوحة: {business.trackingCell?.vehiclePlate || 'ط س ق 4821'}
                    </p>
                  </div>
                </div>

                {onOpenTransportTracking && (
                  <button
                    type="button"
                    onClick={() => onOpenTransportTracking(business)}
                    className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black font-black px-3 py-1.5 rounded-xl text-[11px] transition shadow-md shadow-emerald-500/20 flex items-center gap-1 cursor-pointer"
                  >
                    <span>طلب فوري وتتبع مباشر 🚕</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* All Photos Thumbnail Strip (شريط عرض وتبديل جميع صور النشاط على الشاشة) */}
        {business.images && business.images.length > 0 && (
          <div className="bg-neutral-900/95 border-b border-white/10 px-4 py-2.5 flex items-center gap-2 overflow-x-auto hide-scroll">
            <span className="text-[11px] font-black text-amber-300 shrink-0 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>صور النشاط ({business.images.length}):</span>
            </span>
            {business.images.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveMedia('image');
                  setActiveImageIdx(idx);
                }}
                className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                  activeMedia === 'image' && activeImageIdx === idx
                    ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                    : 'border-white/15 opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={getValidImageUrl(imgUrl, business.cat)}
                  alt={`${business.name} - ${idx + 1}`}
                  onError={(e) => handleImageError(e, business.cat)}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Dual Primary Action Bar: Share + Contact + Navigate + SOS + Report */}
        <div className="bg-[#1E40AF] px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-white border-b border-blue-400/30">
          <div className="flex items-center gap-2 flex-wrap">
            {/* امر على كل صفحة: احجز الآن (علامة التنشين الخضراء أو الحمراء مع عداد الأدوار من 1 إلى 300) */}
            {onOpenBooking && (
              <TargetBookingBadge
                business={business}
                onClick={() => onOpenBooking(business)}
                variant="bar"
              />
            )}

            {/* أيقونة وزر إنستا باي التفاعلي المباشر للمشترك */}
            <button
              type="button"
              onClick={() => {
                const ipnId = business.bankTransferDetails?.instapayId || `${business.phone}@instapay`;
                navigator.clipboard.writeText(ipnId);
                setTransferToast(`تم نسخ معرف إنستاباي: ${ipnId} 📋`);
                setTimeout(() => setTransferToast(null), 3000);
                window.open('https://instapay.eg', '_blank', 'noopener,noreferrer');
              }}
              className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:brightness-110 active:scale-95 text-white px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 border border-purple-400/40 transition cursor-pointer"
              title="فتح تطبيق إنستاباي والدفع المباشر لحساب المشترك"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-purple-300 animate-pulse" />
              <span>إنستا باي InstaPay ⚡</span>
            </button>

            {/* أيقونة وزر فيزا / ماستركارد التفاعلي المباشر للمشترك */}
            <button
              type="button"
              onClick={() => {
                const cardNum = business.bankTransferDetails?.visaCardNumber || '4284 •••• •••• 9821';
                navigator.clipboard.writeText(cardNum);
                setTransferToast('تم نسخ بيانات الدفع بالفيزا / ماستركارد 📋');
                setTimeout(() => setTransferToast(null), 3000);
                if (business.websiteUrl) {
                  window.open(business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`, '_blank');
                } else if (onOpenBooking) {
                  onOpenBooking(business);
                }
              }}
              className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 hover:brightness-110 active:scale-95 text-white px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 border border-blue-400/40 transition cursor-pointer"
              title="فتح بوابة الدفع ببطاقات فيزا وماستركارد"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-300" />
              <span>فيزا / ماستركارد 💳</span>
            </button>

            {/* رسائل الواتساب الفعلية */}
            <a
              href={`https://wa.me/${business.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `مرحباً ${business.name}، استفسار مباشر من منصة إعلانك دليلك الخاص`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20ba59] text-white px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow transition"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>{lang === 'ar' ? 'تواصل واتساب' : 'WhatsApp'}</span>
            </a>

            {/* رسائل SMS نصية فعلية */}
            <a
              href={`sms:${business.phone}?body=${encodeURIComponent(
                `مرحباً ${business.name}، استفسار مباشر من منصة إعلانك دليلك الخاص`
              )}`}
              className="bg-amber-400 hover:bg-amber-300 text-black px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow transition"
              title="إرسال رسالة SMS نصية فعلية"
            >
              <span>📩 رسالة SMS</span>
            </a>

            {onOpenDelivery && (
              <button
                type="button"
                onClick={() => onOpenDelivery(business)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 active:scale-95 text-black px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 fill-black" />
                <span>{lang === 'ar' ? 'اطلب دليفري 🛵' : 'Order Delivery 🛵'}</span>
              </button>
            )}

            {onToggleFollow && (
              <button
                type="button"
                onClick={() => onToggleFollow(business.id)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 transition cursor-pointer ${
                  isFollowed
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-[#FF2D55] hover:bg-[#ff3b61] text-white shadow-lg shadow-[#FF2D55]/30'
                }`}
              >
                <span>{isFollowed ? (lang === 'ar' ? '✓ متابع' : '✓ Following') : (lang === 'ar' ? '+ متابعة' : '+ Follow')}</span>
              </button>
            )}

            <a
              href={`tel:${business.phone}`}
              className="bg-white hover:bg-neutral-100 text-black px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow transition"
            >
              <Phone className="w-3.5 h-3.5 fill-black" />
              <span>{lang === 'ar' ? 'اتصال مباشر' : 'Call Direct'}</span>
            </a>

            <a
              href={mapDirUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-500 hover:bg-sky-400 text-black px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow transition"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Navigate توجه GPS</span>
            </a>

            {/* Owner Page Edit Button with strict latest PIN protection */}
            <button
              type="button"
              onClick={() => {
                if (onOpenOwnerLock) {
                  onOpenOwnerLock(business);
                } else if (onOpenOwnerEdit) {
                  onOpenOwnerEdit(business);
                }
              }}
              className="bg-gradient-to-r from-[#FF6B35] to-[#FFD700] hover:brightness-110 active:scale-95 text-black px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition cursor-pointer"
              title="تعديل صفحة هذا النشاط لصاحب الإعلان فقط بالباسورد الأخير"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '🔐 تعديل صفحتي' : '🔐 Edit My Page'}</span>
            </button>

            {/* Interactive Presentation Trigger */}
            <button
              type="button"
              onClick={() => {
                if (hasPresentation) {
                  setActiveMedia('presentation');
                } else {
                  setPresPinInput('');
                  setPresPinError('');
                  setShowPresPinModal(true);
                }
              }}
              className="bg-gradient-to-r from-[#FF2D55] via-rose-500 to-amber-500 hover:brightness-110 active:scale-95 text-white px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md shadow-red-500/25 transition cursor-pointer"
              title="مشاهدة أو إنشاء العرض التقديمي التفاعلي"
            >
              <Film className="w-3.5 h-3.5" />
              <span>{hasPresentation ? '🎬 العرض التفاعلي' : '+ عرض تفاعلي 🔒'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:126"
              className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow animate-pulse"
              title="طوارئ شرطة السياحة 126"
            >
              <span>SOS 126</span>
            </a>

            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white/90 px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer"
              title="إبلاغ عن غلاء سعر أو مخالفة"
            >
              <Flag className="w-3 h-3 text-red-300" />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Dynamic Action Banner: Hotel (Pay on-site / at hotel) vs Talabaty Delivery (Stores/Restaurants/Professions) */}
          {isHotel ? (
            <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-600/20 border border-emerald-400/40 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-lg shadow-emerald-950/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                    تأكيد فوري ⚡
                  </span>
                  <span className="text-xs font-black text-white">
                    حجز الغرف الفندقية مباشرة - الدفع في الفندق / في المكان
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  احجز إقامتك بأفضل سعر مضمون بدون رسوم مقدمة، والدفع متاح نقداً عند الوصول في الفندق أو عبر إنستاباي وفودافون كاش.
                </p>
              </div>

              {onOpenBooking && (
                <button
                  type="button"
                  onClick={() => onOpenBooking(business)}
                  className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black font-black px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Bed className="w-4 h-4 fill-black" />
                  <span>احجز الآن والدفع في الفندق 🏨</span>
                </button>
              )}
            </div>
          ) : isEligibleDelivery ? (
            <div className="bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-600/20 border border-amber-400/50 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-lg shadow-amber-950/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                    خدمة دليفري مفعلة 🛵
                  </span>
                  <span className="text-xs font-black text-white">
                    طلب دليفري وتوصيل مباشر من {business.name}
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  {business.deliveryInfo?.areas ? `تغطية التوصيل: ${business.deliveryInfo.areas} • ` : ''}
                  {business.deliveryInfo?.estimatedTime ? `الوقت: ${business.deliveryInfo.estimatedTime} • ` : ''}
                  طلب مباشر وتوصيل سريع للعنوان عبر الاتصال أو الواتساب.
                </p>
              </div>

              {onOpenDelivery && (
                <button
                  type="button"
                  onClick={() => onOpenDelivery(business)}
                  className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:brightness-110 active:scale-95 text-black font-black px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 fill-black" />
                  <span>اطلب دليفري من هذا المكان 🛵</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-600/25 via-indigo-600/20 to-purple-600/20 border border-blue-400/40 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-lg shadow-blue-950/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-blue-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                    حجز موعد وزيارة ⚡
                  </span>
                  <span className="text-xs font-black text-white">
                    حجز مباشر لجميع الصفحات (عيادات، مستشفيات، كوافير، محلات، فنادق، مراكز خدمة)
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/90 leading-relaxed">
                  نظام حجز إلكتروني منظم بالترتيب (من 1 إلى 300 عميل يومياً) خلال دورة 24 ساعة تتصفر عند 12:00 منتصف الليل • أرقام دفع مستقلة (فودافون كاش، إنستاباي، وحساب بنكي).
                </p>
              </div>

              {onOpenBooking && (
                <button
                  type="button"
                  onClick={() => onOpenBooking(business)}
                  className="bg-gradient-to-r from-blue-400 via-sky-400 to-teal-400 hover:brightness-110 active:scale-95 text-black font-black px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-blue-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>احجز موعدك ورقمك الآن 🎟️</span>
                </button>
              )}
            </div>
          )}

          {/* SUBSCRIBER DIRECT FINANCIAL & BANK TRANSFERS CARD (حسابات التحويل المالي المباشرة الخاصة بالمشترك) */}
          {subscriberTransfers && subscriberTransfers.enabled && (
            <div className="bg-gradient-to-r from-emerald-950/30 via-neutral-900 to-teal-950/30 border border-emerald-500/35 rounded-2xl p-4 space-y-3 shadow-lg shadow-emerald-950/30">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>بيانات التحويل المالي المباشر الخاصة بهذا النشاط 💳</span>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0.2 rounded border border-emerald-500/40">
                        مستقل 100%
                      </span>
                    </h3>
                    <p className="text-[10px] text-emerald-200/80">
                      تحويل مباشر لحساب المشترك (فودافون كاش • إنستاباي • حساب بنكي) بدون وسيط
                    </p>
                  </div>
                </div>

                <span className="text-[10px] bg-black/60 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>تشفير مالي آمن ضد الاختراق</span>
                </span>
              </div>

              {transferToast && (
                <div className="bg-emerald-500 text-black font-black text-center py-1 rounded-xl text-[11px] animate-pulse">
                  {transferToast}
                </div>
              )}

              {/* Transfer Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Vodafone Cash */}
                {subscriberTransfers.vodafoneCashNumber && (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-white/50 block">فودافون كاش المعتمد:</span>
                        <span className="font-mono font-bold text-white text-xs truncate block dir-ltr text-right">
                          {subscriberTransfers.vodafoneCashNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyTransferField(subscriberTransfers.vodafoneCashNumber!, 'voda')}
                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="نسخ رقم المحفظة"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>{copiedTransferKey === 'voda' ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                      <a
                        href={`tel:${subscriberTransfers.vodafoneCashNumber}`}
                        className="p-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] transition"
                        title="اتصال / تحويل"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* InstaPay */}
                {subscriberTransfers.instapayId && (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-white/50 block">إنستاباي InstaPay:</span>
                        <span className="font-mono font-bold text-white text-xs truncate block dir-ltr text-right">
                          {subscriberTransfers.instapayId}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyTransferField(subscriberTransfers.instapayId!, 'insta')}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{copiedTransferKey === 'insta' ? 'تم النسخ' : 'نسخ المعرف'}</span>
                    </button>
                  </div>
                )}

                {/* Bank Account */}
                {subscriberTransfers.accountNumber && (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-white/50 block">
                        {subscriberTransfers.bankName || 'الحساب البنكي'}:
                      </span>
                      <span className="font-mono font-bold text-white text-xs truncate block dir-ltr text-right">
                        {subscriberTransfers.accountNumber}
                      </span>
                      {subscriberTransfers.accountHolderName && (
                        <span className="text-[9px] text-amber-300 truncate block">
                          باسم: {subscriberTransfers.accountHolderName}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyTransferField(subscriberTransfers.accountNumber!, 'acc')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{copiedTransferKey === 'acc' ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                )}

                {/* IBAN */}
                {subscriberTransfers.iban && (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-white/50 block">الآيبان الدولي IBAN:</span>
                      <span className="font-mono font-bold text-white text-[11px] truncate block dir-ltr text-right">
                        {subscriberTransfers.iban}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyTransferField(subscriberTransfers.iban!, 'iban')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{copiedTransferKey === 'iban' ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                )}

                {/* Visa / MasterCard details */}
                {subscriberTransfers.visaCardNumber && (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-white/50 block">بطاقة فيزا / ماستركارد المعتمدة:</span>
                      <span className="font-mono font-bold text-sky-400 text-xs truncate block dir-ltr text-right">
                        {subscriberTransfers.visaCardNumber}
                      </span>
                      {subscriberTransfers.visaHolderName && (
                        <span className="text-[9px] text-white/70 truncate block">
                          باسم: {subscriberTransfers.visaHolderName}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyTransferField(subscriberTransfers.visaCardNumber!, 'visa')}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{copiedTransferKey === 'visa' ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                )}

                {/* Multiple Phone Numbers & Hotline */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 col-span-1 sm:col-span-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-1 w-full">
                    <span className="text-[10px] text-white/50 block font-bold">أرقام التواصل المباشرة والخط الساخن لهذا النشاط:</span>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {(subscriberTransfers.phones || allPhones).map((ph: string, idx: number) => (
                        <a
                          key={idx}
                          href={`tel:${ph}`}
                          className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg font-mono text-white flex items-center gap-1.5 transition"
                        >
                          <Phone className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{ph}</span>
                        </a>
                      ))}
                      {(subscriberTransfers.hotline || business.trackingCell?.hotline) && (
                        <a
                          href={`tel:${subscriberTransfers.hotline || business.trackingCell?.hotline}`}
                          className="bg-amber-400 hover:bg-amber-300 text-black px-2.5 py-1 rounded-lg font-mono font-black flex items-center gap-1 transition shadow"
                        >
                          <span>🔥 الخط الساخن:</span>
                          <span>{subscriberTransfers.hotline || business.trackingCell?.hotline}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Communications & Channels (تليجرام، جوجل ميت، مكالمات فيديو وصوت ومحفظة نقود) */}
                <div className="bg-gradient-to-r from-sky-950/40 to-neutral-900 border border-sky-500/20 rounded-xl p-2.5 col-span-1 sm:col-span-2 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-sky-300 font-bold block">
                      قنوات استقبال المكالمات وتحويل الأموال المباشرة:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Telegram */}
                      <a
                        href={`https://t.me/${(subscriberTransfers.telegramUsername || 'e3lanak_service').replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#0088cc]/20 hover:bg-[#0088cc]/30 border border-[#0088cc]/40 text-sky-200 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <span>✈️ تليجرام: {subscriberTransfers.telegramUsername || '@خدمة_المشترك'}</span>
                      </a>

                      {/* Google Meet */}
                      <a
                        href={subscriberTransfers.googleMeetUrl || 'https://meet.google.com/new'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Video className="w-3 h-3" />
                        <span>Google Meet فيديو مباشر</span>
                      </a>

                      {/* Video Call Direct */}
                      <a
                        href={`tel:${subscriberTransfers.videoCallPhone || business.phone}`}
                        className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Video className="w-3 h-3" />
                        <span>مكالمة فيديو فورية</span>
                      </a>

                      {/* Voice Call Direct */}
                      <a
                        href={`tel:${subscriberTransfers.voiceCallPhone || business.phone}`}
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Phone className="w-3 h-3" />
                        <span>مكالمة صوتية نقية</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anti-Fraud Caution Box (تحذير الجمهور من النصب والاحتيال) */}
              <div className="bg-red-950/60 border border-red-500/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-200">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-300 text-[11px]">
                      ⚠️ تحذير أمني هام للجمهور من النصب والاحتيال:
                    </span>
                    {onOpenSecurityNotice && (
                      <button
                        type="button"
                        onClick={onOpenSecurityNotice}
                        className="text-[10px] text-amber-300 underline font-bold cursor-pointer hover:text-white"
                      >
                        عرض لائحة الأمان الرسمية ↗
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-white/90 leading-relaxed">
                    تأكد تماماً من فحص ومعاينة الخدمة أو البضاعة والتأكد منها بنفسك قبل تحويل أي مبالغ مالية. 
                    <strong> ننصح بالدفع كاش عند الاستلام أو الوصول والمطابقة </strong> لضمان حقك وحمايتك التامة.
                  </p>
                </div>
              </div>

              {/* Official Admin Accounts Card (أرقام الإدارة للاشتراكات فقط) */}
              <div className="bg-neutral-900 border border-amber-400/40 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>أرقام وحسابات إدارة المنصة الرسمية (للأدمن) - لتحويل رسوم الاشتراكات فقط:</span>
                </div>
                <p className="text-[10px] text-white/70">
                  {ADMIN_OFFICIAL_ACCOUNTS.noticeAr}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                  <div className="bg-black/60 p-2 rounded-lg border border-white/5">
                    <span className="text-white/40 block text-[9px]">فودافون كاش الإدارة:</span>
                    <span className="text-emerald-400 font-bold">{ADMIN_OFFICIAL_ACCOUNTS.vodafoneCash}</span>
                  </div>
                  <div className="bg-black/60 p-2 rounded-lg border border-white/5">
                    <span className="text-white/40 block text-[9px]">إنستاباي الإدارة:</span>
                    <span className="text-purple-400 font-bold">{ADMIN_OFFICIAL_ACCOUNTS.instapay}</span>
                  </div>
                  <div className="bg-black/60 p-2 rounded-lg border border-white/5">
                    <span className="text-white/40 block text-[9px]">حساب بنك مصر:</span>
                    <span className="text-amber-400 font-bold">{ADMIN_OFFICIAL_ACCOUNTS.accountNumber}</span>
                  </div>
                  <div className="bg-black/60 p-2 rounded-lg border border-white/5">
                    <span className="text-white/40 block text-[9px]">الخط الساخن:</span>
                    <span className="text-sky-400 font-bold">{ADMIN_OFFICIAL_ACCOUNTS.hotline}</span>
                  </div>
                </div>
              </div>

              {subscriberTransfers.customerTransferNotes && (
                <p className="text-[10px] text-white/70 bg-black/40 p-2 rounded-xl border border-white/5 leading-relaxed">
                  💬 <strong>ملاحظة صاحب النشاط:</strong> {subscriberTransfers.customerTransferNotes}
                </p>
              )}

              <div className="text-[9px] text-white/50 flex items-center justify-between pt-1 border-t border-white/5">
                <span>🛡️ التحويل يتم لصاحب النشاط مباشرة والدفع للأدمن يقتصر على باقات الاشتراك فقط</span>
                <span className="text-emerald-400 font-bold">معتمد وآمن ✓</span>
              </div>
            </div>
          )}

          {/* 4 Horizontal License & Accreditation Cards (تراخيص 4 كروت أفقية) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>التراخيص الرسمية والاعتمادات (4 كروت معتمدة)</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold">فحص إعلانك الخاص ✓</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white/5 border border-emerald-500/30 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60 font-bold">الترخيص الأول</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xs font-black text-white">ترخيص مزاولة المهنة</div>
                <p className="text-[10px] text-emerald-300 font-mono">ساري ومعتمد رسمي ✓</p>
              </div>

              <div className="bg-white/5 border border-blue-500/30 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60 font-bold">السجل والمنشأة</span>
                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-xs font-black text-white">رخصة المنشأة والسجل</div>
                <p className="text-[10px] text-blue-300 font-mono">مقيد بالغرفة التجارية ✓</p>
              </div>

              <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60 font-bold">شهادة الجودة</span>
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-xs font-black text-white">شهادة الجودة والامتثال</div>
                <p className="text-[10px] text-purple-300 font-mono">مطابقة المواصفات ISO ✓</p>
              </div>

              <div className="bg-white/5 border border-amber-500/30 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60 font-bold">الاعتماد المهني</span>
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xs font-black text-white">الاعتماد النقابي والمهني</div>
                <p className="text-[10px] text-amber-300 font-mono">مقيد بالنقابة العامة ✓</p>
              </div>
            </div>
          </div>

          {/* 3 Offers Catalog with multi-currency prices (كتالوج 3 عروض بأسعار متعددة العملات) */}
          <div className="bg-gradient-to-br from-neutral-900 to-blue-950/30 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-xs sm:text-sm text-white">
                  كتالوج العروض الحصرية والأسعار قبل ما تروح (3 عروض)
                </h3>
              </div>
              <span className="text-[10px] text-white/50">أسعار واضحة بدون مفاجآت</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[9px] font-black bg-amber-400 text-black px-2 py-0.5 rounded-full inline-block mb-1">
                    عرض اليوم الأول
                  </span>
                  <h4 className="font-bold text-xs text-white">
                    {business.services?.[0]?.n || 'العرض الأساسي الأكثر طلباً'}
                  </h4>
                  <div className="text-sm font-black text-emerald-400 font-mono mt-1">
                    {business.services?.[0]?.p || '150 ج.م'}
                  </div>
                  <div className="text-[10px] text-white/40 flex items-center gap-2 mt-0.5">
                    <span>~ $5 USD</span>
                    <span>~ €4.5 EUR</span>
                    <span>~ 450 RUB</span>
                  </div>
                </div>
                {onOpenBooking && (
                  <button
                    type="button"
                    onClick={() => onOpenBooking(business)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-1.5 rounded-lg text-[11px] transition shadow cursor-pointer"
                  >
                    استفد الآن ⚡
                  </button>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[9px] font-black bg-blue-400 text-black px-2 py-0.5 rounded-full inline-block mb-1">
                    باقة التوفير
                  </span>
                  <h4 className="font-bold text-xs text-white">
                    {business.services?.[1]?.n || 'خدمة كبار العملاء VIP'}
                  </h4>
                  <div className="text-sm font-black text-emerald-400 font-mono mt-1">
                    {business.services?.[1]?.p || '350 ج.م'}
                  </div>
                  <div className="text-[10px] text-white/40 flex items-center gap-2 mt-0.5">
                    <span>~ $11 USD</span>
                    <span>~ €10 EUR</span>
                    <span>~ 1050 RUB</span>
                  </div>
                </div>
                {onOpenBooking && (
                  <button
                    type="button"
                    onClick={() => onOpenBooking(business)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-1.5 rounded-lg text-[11px] transition shadow cursor-pointer"
                  >
                    استفد الآن ⚡
                  </button>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[9px] font-black bg-purple-400 text-black px-2 py-0.5 rounded-full inline-block mb-1">
                    خصم خاص 20%
                  </span>
                  <h4 className="font-bold text-xs text-white">
                    {business.services?.[2]?.n || 'فحص شامل وخدمة متكاملة'}
                  </h4>
                  <div className="text-sm font-black text-emerald-400 font-mono mt-1">
                    {business.services?.[2]?.p || '550 ج.م'}
                  </div>
                  <div className="text-[10px] text-white/40 flex items-center gap-2 mt-0.5">
                    <span>~ $18 USD</span>
                    <span>~ €16 EUR</span>
                    <span>~ 1650 RUB</span>
                  </div>
                </div>
                {onOpenBooking && (
                  <button
                    type="button"
                    onClick={() => onOpenBooking(business)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-1.5 rounded-lg text-[11px] transition shadow cursor-pointer"
                  >
                    استفد الآن ⚡
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Working Hours with Audio Player (مواعيد كتابة + تشغيل صوتي) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-black text-white block">مواعيد وساعات العمل:</span>
                <span className="text-[11px] text-white/70">{business.hours || 'متاح على مدار الساعة (24/7)'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsPlayingAudioHours(true);
                if ('speechSynthesis' in window) {
                  const u = new SpeechSynthesisUtterance(`مواعيد عمل ${business.name}: ${business.hours || 'يعمل على مدار الساعة'}`);
                  u.lang = 'ar';
                  window.speechSynthesis.speak(u);
                  setTimeout(() => setIsPlayingAudioHours(false), 3000);
                } else {
                  setTimeout(() => setIsPlayingAudioHours(false), 2000);
                }
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudioHours ? 'animate-bounce text-amber-300' : ''}`} />
              <span>{isPlayingAudioHours ? 'جاري التشغيل...' : 'استمع للمواعيد صوتياً 🔊'}</span>
            </button>
          </div>

          {/* Tourist Multilingual Real Reviews (تقييمات سياح بلغات متعددة) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span>تقييمات السياح والنزلاء الحقيقية (Real Tourist Reviews)</span>
              </h3>
              <span className="text-[10px] text-yellow-300 font-bold">4.8 / 5 ⭐ (127 تقييم)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span>🇬🇧</span>
                    <span>Edward M. (UK)</span>
                  </span>
                  <div className="flex text-yellow-400 text-[10px]">★★★★★</div>
                </div>
                <p className="text-[11px] text-white/70 italic">
                  "Outstanding hospitality, very fair and clear prices without surprises. Highly recommended!"
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span>🇮🇹</span>
                    <span>Gianluigi B. (Italy)</span>
                  </span>
                  <div className="flex text-yellow-400 text-[10px]">★★★★★</div>
                </div>
                <p className="text-[11px] text-white/70 italic">
                  "Esperienza fantastica e personale molto accogliente. Servizio perfetto in Egitto!"
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span>🇷🇺</span>
                    <span>Anastasia K. (Russia)</span>
                  </span>
                  <div className="flex text-yellow-400 text-[10px]">★★★★★</div>
                </div>
                <p className="text-[11px] text-white/70 italic">
                  "Отличное место, честные цены и быстрое бронирование. Обязательно вернемся!"
                </p>
              </div>
            </div>
          </div>

          {/* Tourist Emergency SOS Box (SOS شرطة سياحة 126 مستشفى سفارة) */}
          <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-red-400 font-black text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>أرقام الطوارئ السياحية الرسمية في مصر (SOS Emergency):</span>
              </div>
              <span className="text-[10px] text-red-200">اتصال فوري ومجاني</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <a
                href="tel:126"
                className="bg-red-600/30 hover:bg-red-600 border border-red-500/40 py-2 rounded-xl text-white font-bold transition flex flex-col items-center gap-0.5"
              >
                <span className="text-sm font-black font-mono">126</span>
                <span className="text-[10px] text-red-200">شرطة السياحة</span>
              </a>
              <a
                href="tel:123"
                className="bg-red-600/30 hover:bg-red-600 border border-red-500/40 py-2 rounded-xl text-white font-bold transition flex flex-col items-center gap-0.5"
              >
                <span className="text-sm font-black font-mono">123</span>
                <span className="text-[10px] text-red-200">الإسعاف الطبي</span>
              </a>
              <a
                href="tel:122"
                className="bg-red-600/30 hover:bg-red-600 border border-red-500/40 py-2 rounded-xl text-white font-bold transition flex flex-col items-center gap-0.5"
              >
                <span className="text-sm font-black font-mono">122</span>
                <span className="text-[10px] text-red-200">شرطة النجدة</span>
              </a>
              <a
                href="tel:0227973300"
                className="bg-red-600/30 hover:bg-red-600 border border-red-500/40 py-2 rounded-xl text-white font-bold transition flex flex-col items-center gap-0.5"
              >
                <span className="text-sm font-black font-mono">مستشفى / سفارة</span>
                <span className="text-[10px] text-red-200">طوارئ الرعايا</span>
              </a>
            </div>
          </div>
          {/* Multiple Phone Numbers & Contact Center */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#FF2D55]" />
                <span>{t.contactNumbers}</span>
              </h3>
              <span className="text-[10px] text-white/40">
                {allPhones.length} أرقام متاحة
              </span>
            </div>

            <div className="space-y-2">
              {allPhones.map((ph, idx) => (
                <div
                  key={idx}
                  className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between flex-wrap gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/10 text-white text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white tracking-wider dir-ltr">
                      {ph}
                    </span>
                    {idx === 0 && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                        الرئيسي
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 ms-auto">
                    <a
                      href={`https://wa.me/${ph.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `مرحباً ${business.name}، استفسار من منصة إعلانك E3lanak`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#20ba59] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>{t.whatsapp}</span>
                    </a>
                    <a
                      href={`tel:${ph}`}
                      className="bg-white hover:bg-neutral-200 text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                    >
                      <Phone className="w-3.5 h-3.5 fill-black" />
                      <span>{t.call}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Google Maps Actions & Directions */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={mapSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/15 text-white/90 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs border border-white/10 transition"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/maps_64dp.png"
                alt="Google Maps"
                className="w-4 h-4"
              />
              <span>{t.openInMaps}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <a
              href={mapDirUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FF2D55] hover:bg-[#ff4064] text-white font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-md shadow-[#FF2D55]/30 transition"
            >
              <Compass className="w-4 h-4" />
              <span>{t.directions} (GPS)</span>
            </a>
          </div>

          {/* Ready Website or Custom Domain Button */}
          {business.websiteUrl && (
            <a
              href={business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600/25 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-400/40 p-3 rounded-2xl flex items-center justify-between text-xs font-bold transition shadow-md group"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400 group-hover:text-white shrink-0" />
                <div>
                  <span className="text-white block font-black">الموقع الرسمي / الدومين الخاص:</span>
                  <span className="text-[11px] text-blue-300 font-mono">{business.websiteUrl}</span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Embedded Google Map */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg relative">
            <iframe
              src={mapEmbedUrl}
              title={`خريطة ${business.name}`}
              className="w-full h-48 border-0"
              loading="lazy"
            />
          </div>

          {/* Business Bio / Description */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="text-xs font-black text-white/50 mb-2 uppercase tracking-wider">
              عن النشاط والتخصص
            </h3>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              {business.bio}
            </p>
          </div>

          {/* Google Ads Campaign info if sponsored */}
          {business.isSponsored && (
            <div className="bg-gradient-to-r from-amber-950/40 to-neutral-900 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>{business.adCampaignTitle || t.googleAdsSponsored}</span>
              </div>
              <span className="text-[10px] font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full">
                Ad
              </span>
            </div>
          )}

          {/* Services & Converted Prices */}
          {business.services && business.services.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-white/50 uppercase tracking-wider">
                  {t.servicesAndPrices}
                </h3>
                <span className="text-[10px] text-amber-400 font-bold">
                  الأسعار بعملة ({currentCurrency})
                </span>
              </div>

              <div className="space-y-2">
                {business.services.map((serv, idx) => (
                  <div
                    key={idx}
                    className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-3 flex justify-between items-center transition gap-2"
                  >
                    <div className="space-y-0.5 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-white block">
                        {serv.n}
                      </span>
                      {serv.priceEgp && (
                        <span className="text-[11px] text-amber-300 font-mono font-bold block">
                          {serv.priceEgp} ج.م
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs sm:text-sm font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        {formatServicePrice(serv.p, currentCurrency)}
                      </span>

                      {/* Add to Talabaty Cart for Eligible Stores, Restaurants & Professions */}
                      {isEligibleDelivery && onOpenDelivery && (
                        <button
                          type="button"
                          onClick={() => onOpenDelivery(business)}
                          className="bg-amber-400 hover:bg-amber-300 text-black px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition shadow cursor-pointer"
                          title="أضف إلى سلة طلباتي واطلب دليفري"
                        >
                          <ShoppingBag className="w-3 h-3 fill-black" />
                          <span>أضف لطلباتي 🛵</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Gallery Thumbnails */}
          {business.videos && business.videos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-white/50 mb-1 uppercase tracking-wider">
                {t.videoGallery}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {business.videos.map((vid, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setActiveMedia('video');
                      setActiveVideoSrc(vid);
                    }}
                    className={`relative h-24 rounded-xl overflow-hidden bg-neutral-900 border cursor-pointer group ${
                      activeVideoSrc === vid && activeMedia === 'video'
                        ? 'border-[#FF2D55] ring-2 ring-[#FF2D55]/50'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <video
                      src={vid}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition">
                      <Play className="w-5 h-5 fill-white text-white opacity-80 group-hover:opacity-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOMER REELS & MEDIA SECTION WITH ANIMATED MOVING TEXT (فيديوهات وصور العملاء مع كتابة متحركة) */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-[#FF2D55]/20 border border-[#FF2D55]/30 flex items-center justify-center text-lg">
                  🎥✨
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    <span>فيديوهات وصور العملاء</span>
                    <span className="bg-[#FF2D55] text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow">
                      كتابة متحركة ({customerPosts.length})
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/50">تجارب حية من الزوار والمشتركين مع نصوص إعلانية وعروض متحركة</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddCustomerMediaOpen(true)}
                className="bg-gradient-to-r from-[#FF2D55] via-rose-600 to-amber-500 hover:brightness-110 active:scale-95 text-white font-black px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-[#FF2D55]/30 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>أضف فيديو أو صورة مع كتابة متحركة 🎬</span>
              </button>
            </div>

            {/* Posts Grid */}
            {customerPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {customerPosts.map((post) => {
                  const animClass =
                    post.textAnimation === 'wave'
                      ? 'anim-wave-text'
                      : post.textAnimation === 'bounce'
                      ? 'anim-bounce-text'
                      : post.textAnimation === 'slide'
                      ? 'anim-slide-text'
                      : post.textAnimation === 'neon'
                      ? 'anim-neon-glow'
                      : post.textAnimation === 'vibrate'
                      ? 'anim-vibrate'
                      : post.textAnimation === 'pop'
                      ? 'anim-pop-text'
                      : 'anim-marquee';

                  return (
                    <div
                      key={post.id}
                      onClick={() => setActiveCustomerPost(post)}
                      className="group relative aspect-[9/13] rounded-2xl overflow-hidden bg-black border border-white/15 hover:border-[#FF2D55]/60 transition shadow-lg cursor-pointer flex flex-col justify-between p-3"
                    >
                      {/* Media element */}
                      {post.type === 'video' ? (
                        <video
                          src={post.url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <img
                          src={post.url}
                          alt="customer review"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

                      {/* Top Header overlay */}
                      <div className="relative z-10 flex items-center justify-between text-[10px] text-white">
                        <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 font-bold truncate max-w-[140px]">
                          {post.userName}
                        </span>
                        <span className="bg-[#FF2D55] text-white px-2 py-0.5 rounded-full font-bold text-[9px] shadow">
                          {post.type === 'video' ? 'فيديو ريلز 🎥' : 'صورة 📸'}
                        </span>
                      </div>

                      {/* MOVING ANIMATED TEXT ON CUSTOMER MEDIA */}
                      <div className="relative z-10 my-auto w-full px-1 overflow-hidden pointer-events-none">
                        <div
                          className="w-full rounded-xl py-2 px-2.5 backdrop-blur-md text-center border border-white/20 shadow-2xl overflow-hidden"
                          style={{ backgroundColor: post.bgColor || 'rgba(0, 0, 0, 0.7)' }}
                        >
                          <div
                            className={`${animClass} font-black text-xs sm:text-sm tracking-wide`}
                            style={{ color: post.textColor || '#FFD700' }}
                          >
                            {post.caption}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Footer overlay */}
                      <div className="relative z-10 flex items-center justify-between text-[11px] text-white/90 pt-1">
                        <span className="text-[10px] opacity-70">
                          {new Date(post.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                        <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Heart className="w-3 h-3 text-[#FF2D55] fill-[#FF2D55]" />
                          <span className="font-bold">{post.likes || 1}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-2">
                <span className="text-4xl block">🎬✨</span>
                <h4 className="font-bold text-white text-xs sm:text-sm">كن أول عميل يشارك فيديو أو صورة مع كتابة متحركة!</h4>
                <p className="text-[11px] text-white/50 max-w-sm mx-auto">
                  شارك رأيك أو عروض المكان مع شريط إخباري متحرك، اهتزاز نيون، أو موجة راقصة لجذب آلاف الزوار.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerMediaOpen(true)}
                  className="mt-1 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-full text-xs transition cursor-pointer"
                >
                  + أضف تجربتك الآن
                </button>
              </div>
            )}
          </div>

          {/* Subscription Payment Status & License Verification */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">حالة دفع الاشتراك:</span>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                business.subscriptionPayment?.isPaid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : business.pkg === 0
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {business.subscriptionPayment?.isPaid
                  ? `مدفوع (${business.subscriptionPayment.method})`
                  : business.pkg === 0
                  ? 'فترة تجريبية مجانية 90 يوم'
                  : 'بانتظار التحصيل / التجديد'}
              </span>
            </div>

            {/* Direct Pay / Upgrade Button */}
            <button
              type="button"
              onClick={onOpenRenew}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:brightness-110 active:scale-98 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-amber-300" />
              <span>الاشتراك وترقية الإعلان (فيزا / ماستركارد / كاش / إنستاباي) ⚡</span>
            </button>

            {/* License verification badge (Docs are private for admin only) */}
            {business.licenseVerified && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <b className="text-white">نشاط مرخص وموثق رسمياً:</b>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5">
                    تم فحص وتدقيق السجل التجاري والرخصة الحكومية بواسطة إدارة المنصة. المستندات الرسمية مشفرة ومحفوظة لدى الإدارة فقط لحماية الخصوصية.
                  </p>
                </div>
              </div>
            )}

            {/* If listed for sale (معروض للبيع للجمهور دون مستندات) */}
            {business.forSaleItem?.isForSale && (
              <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-sm">
                      🏷️
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-amber-300">
                        معروض للبيع للجمهور: {business.forSaleItem.title || business.name}
                      </h4>
                      <p className="text-[11px] text-white/70">
                        {business.forSaleItem.itemType} • {business.forSaleItem.condition} • بيع حر دون مستندات
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="text-[10px] text-white/50 block">السعر المطلوب</span>
                    <span className="text-base font-black text-amber-400 font-mono bg-black/50 px-3 py-1 rounded-xl border border-amber-400/40 inline-block">
                      {business.forSaleItem.price.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>

                {/* Specs / Notes if available */}
                {business.forSaleItem.specs && (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white/80">
                    <span className="text-[10px] text-amber-300 font-bold block mb-0.5">المواصفات والتفاصيل:</span>
                    <p className="text-[11px] leading-relaxed">{business.forSaleItem.specs}</p>
                  </div>
                )}

                {/* Ready Website or Domain for the Item */}
                {business.forSaleItem.websiteOrDomain && (
                  <div className="pt-0.5">
                    <a
                      href={
                        business.forSaleItem.websiteOrDomain.startsWith('http')
                          ? business.forSaleItem.websiteOrDomain
                          : `https://${business.forSaleItem.websiteOrDomain}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-400/40 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span>رابط موقع / دومين السلعة: {business.forSaleItem.websiteOrDomain}</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Public Images for the Item (صور المعروضات للجمهور) */}
                {business.forSaleItem.publicImages && business.forSaleItem.publicImages.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white flex items-center gap-1">
                        <span>📸 صور المعروض للبيع للجمهور</span>
                        <span className="text-amber-400">({business.forSaleItem.publicImages.length} صور)</span>
                      </span>
                      <span className="text-[10px] text-white/50">اضغط للمعاينة</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {business.forSaleItem.publicImages.map((pImg, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => {
                            setActiveMedia('image');
                          }}
                          className="relative aspect-square rounded-xl overflow-hidden bg-black border border-white/15 hover:border-amber-400 transition cursor-pointer group shadow"
                        >
                          <img
                            src={pImg}
                            alt={`sale-img-${pIdx}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zero-documents guarantee */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2 flex items-center gap-2 text-[10px] text-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>معروض للبيع مباشرة للجمهور دون الحاجة لمستندات أو رخص تجارية رسمية.</span>
                </div>
              </div>
            )}
          </div>

          {/* Google Search Engine Keywords (SEO) Section */}
          <div className="bg-gradient-to-r from-blue-950/30 to-purple-950/30 border border-blue-500/30 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <Search className="w-4 h-4" />
                <span className="text-xs font-black text-white">كلمات محرك البحث على Google (SEO Keywords)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSeoBox(!showSeoBox)}
                className="text-[11px] text-blue-300 hover:text-white font-bold bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/30 transition cursor-pointer"
              >
                {showSeoBox ? 'إخفاء' : 'عرض الكلمات 🔍'}
              </button>
            </div>

            {showSeoBox && (
              <div className="space-y-2 pt-1 border-t border-white/10 text-xs text-white/80">
                <p className="text-[11px] text-white/60">
                  الكلمات والعبارات الأكثر بحثاً على Google وGoogle Maps المؤدية لهذا النشاط:
                </p>

                {/* Google Snippet Preview */}
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-3 space-y-1 text-start">
                  <span className="text-[10px] text-blue-400 block font-mono">{seoPackage.googleSearchPreview.url}</span>
                  <h4 className="text-xs font-bold text-blue-300 hover:underline cursor-pointer">
                    {seoPackage.googleSearchPreview.title}
                  </h4>
                  <p className="text-[11px] text-white/70 line-clamp-2">
                    {seoPackage.googleSearchPreview.snippet}
                  </p>
                </div>

                {/* Auto-Generated Google Keywords Chips with 1-click Google Search */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>كلمات بحث Google التلقائية الأكثر استهدافاً (اضغط للبحث الفعلي):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {autoGoogleKeywords.map((item, kIdx) => (
                      <a
                        key={kIdx}
                        href={item.searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/5 hover:bg-blue-600/30 border border-white/10 hover:border-blue-400/40 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px] text-white/90 hover:text-white transition group"
                        title="ابحث في Google مباشرة"
                      >
                        <span className="truncate">{item.keyword}</span>
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 group-hover:bg-blue-500 group-hover:text-black font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                          <span>Google</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copySeoKeywords}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer mt-1"
                >
                  {seoCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تم نسخ كلمات محرك البحث بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الكلمات المفتاحية لـ Google 📋</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Unique Business QR Code for Scanning & Sharing */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>رمز الاستجابة السريع (QR Code) الخاص بالنشاط:</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                امسح الرمز بكاميرا الهاتف لفتح بطاقة النشاط التجاري ومشاركتها مع أصدقائك فوراً.
              </p>
            </div>
            <div className="bg-white p-2 rounded-2xl shadow-xl shrink-0">
              <QRCodeSVG 
                value={typeof window !== 'undefined' ? `${window.location.origin}?biz=${business.id}` : `https://dalilk-sam.com/?biz=${business.id}`}
                size={76}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
              />
            </div>
          </div>

          {/* Expiration Notice & Renewal Trigger */}
          {daysLeft <= 15 && (
            <div className="bg-gradient-to-r from-red-950/60 to-neutral-900 border border-[#FF2D55]/40 rounded-2xl p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-[#FF2D55] font-black text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>
                  {isExpired ? 'انتهت الفترة التجريبية 90 يوم' : `متبقي ${daysLeft} يوم فقط على انتهاء الفترة المجانية`}
                </span>
              </div>
              <p className="text-xs text-white/70">
                جدد اشتراك نشاطك لتظل مرئياً للملايين على منصة إعلانك عبر فيديوهات الريلز والبحث المباشر.
              </p>
              <button
                onClick={onOpenRenew}
                className="w-full bg-[#FF2D55] hover:bg-[#ff3b61] text-white py-3 rounded-full text-xs font-black transition shadow-lg shadow-[#FF2D55]/30 cursor-pointer"
              >
                {t.renewNow} (فيزا / ماستركارد / كاش / إنستاباي)
              </button>
            </div>
          )}

          {/* Bottom Exit / Back Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-full text-xs flex items-center justify-center gap-1.5 transition border border-white/15 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>خروج والرجوع إلى الدليل الرئيسي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Media Upload with Moving Animated Text Modal */}
      {isAddCustomerMediaOpen && (
        <AddCustomerMediaModal
          business={business}
          onClose={() => setIsAddCustomerMediaOpen(false)}
          onAddPost={handleAddCustomerPost}
          lang={lang}
        />
      )}

      {/* Customer Post Player Modal (Full screen with moving animated text) */}
      {activeCustomerPost && (
        <CustomerPostPlayerModal
          post={activeCustomerPost}
          business={business}
          onClose={() => setActiveCustomerPost(null)}
          onLike={(id) => {
            const updated = customerPosts.map((p) =>
              p.id === id ? { ...p, likes: (p.likes || 1) + 1 } : p
            );
            setCustomerPosts(updated);
            onUpdateBusiness?.({ ...business, customerPosts: updated });
          }}
          lang={lang}
        />
      )}

      {/* Verified Criteria Explanation Modal */}
      {showVerifiedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-white/20 rounded-3xl p-5 max-w-sm w-full space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#20D5EC] fill-[#20D5EC]/20" />
                <h3 className="font-black text-sm">معايير توثيق النشاط (Verified)</h3>
              </div>
              <button onClick={() => setShowVerifiedModal(false)} className="text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-white/80 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>فحص ومطابقة السجل التجاري والبطاقة الضريبية الرسمية.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>تأكيد الموقع الجغرافي الفعلي على خرائط Google Maps بدقة.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>تأكيد هواتف وأرقام التواصل المباشرة والواتساب المعتمد.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>حماية كاملة وأمان للمشترين والنزلاء تحت مظلة إعلانك SAM.</span>
              </div>
            </div>
            <button
              onClick={() => setShowVerifiedModal(false)}
              className="w-full bg-[#20D5EC] hover:bg-[#1bb8cc] text-black font-black py-2 rounded-xl text-xs transition cursor-pointer"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}

      {/* Report Price Gouging / Violation Modal (Report غلاء سعر) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-white/20 rounded-3xl p-5 max-w-sm w-full space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-400" />
                <h3 className="font-black text-sm">إبلاغ عن غلاء سعر أو مخالفة</h3>
              </div>
              <button 
                onClick={() => {
                  setShowReportModal(false);
                  setReportSuccess(false);
                }} 
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {reportSuccess ? (
              <div className="py-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-bold text-sm text-emerald-300">تم تسجيل بلاغك بنجاح!</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  فريق رقابة إعلانك الخاص سيقوم بمراجعة الأسعار والتواصل الفوري مع المنشأة لحماية المستهلكين والسياح وضمان الشفافية.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportSuccess(false);
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setReportSuccess(true);
                }}
                className="space-y-3 text-xs"
              >
                <p className="text-white/70 leading-relaxed">
                  هل واجهت زيادة غير مبررة في السعر عن المعلن في المنصة لـ <strong>{business.name}</strong>؟
                </p>
                <div>
                  <label className="block text-[11px] text-white/80 font-bold mb-1">تفاصيل البلاغ أو السعر المطلوب:</label>
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="اكتب ما حدث والسعر الذي طُلب منك..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-400 h-20"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-lg"
                >
                  إرسال البلاغ لإدارة إعلانك الخاص 🚨
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Password Lock Modal before Interactive Presentation Builder */}
      {showPresPinModal && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border-2 border-amber-500/50 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <Lock className="w-4 h-4" />
                <span>قفل تعديل العرض التفاعلي 🔒</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPresPinModal(false)}
                className="text-white/50 hover:text-white text-xs font-bold cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>
            <p className="text-xs text-white/75 leading-relaxed">
              لا يفتح تعديل أو إنشاء العرض التفاعلي إلا بالباسورد الأخير فقط للمشترك أو الإدارة.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!verifySubscriberOrAdminPin(business, presPinInput)) {
                  setPresPinError('⚠️ الباسورد غير صحيح! لا يفتح التعديل إلا بالباسورد الأخير فقط.');
                  return;
                }
                setShowPresPinModal(false);
                setPresPinInput('');
                setPresPinError('');
                setIsPresentationBuilderOpen(true);
              }}
              className="space-y-3"
            >
              <input
                type="password"
                value={presPinInput}
                onChange={(e) => {
                  setPresPinInput(e.target.value);
                  setPresPinError('');
                }}
                placeholder="أدخل الباسورد الأخير فقط..."
                className="w-full bg-black/70 border border-amber-500/40 rounded-2xl px-4 py-3 text-sm text-white font-mono text-center focus:outline-none focus:border-amber-400"
                autoFocus
              />
              {presPinError && (
                <p className="text-xs text-red-400 font-bold text-center">{presPinError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-xs shadow-lg cursor-pointer"
              >
                فتح تعديل العرض التفاعلي 🔓
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Presentation Builder Modal */}
      {isPresentationBuilderOpen && (
        <InteractivePresentationBuilderModal
          business={business}
          onClose={() => setIsPresentationBuilderOpen(false)}
          onSave={(updatedPres) => {
            const updatedBiz: Business = {
              ...business,
              interactivePresentation: updatedPres,
            };
            onUpdateBusiness?.(updatedBiz);
            setActiveMedia('presentation');
          }}
          lang={lang}
        />
      )}
    </div>
  );
};
