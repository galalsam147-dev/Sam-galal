import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Heart, MapPin, Share2, MessageCircle, CheckCircle, ExternalLink, 
  Play, ChevronUp, ChevronDown, Volume2, VolumeX, Sparkles, 
  Phone, Megaphone, Navigation, Globe, Music, KeyRound, Plus, MoreVertical, BookOpen
} from 'lucide-react';
import { Business, CustomerMediaPost, SupportedCurrency, SupportedLang, BusinessSoundtrack } from '../types';
import { I18N, getCategoryLabel, getCityLabel } from '../utils/translations';
import { formatDistance } from '../utils/distance';
import { formatServicePrice } from '../utils/currency';
import { UI_TRANSLATIONS } from '../utils/uiI18n';
import { globalStereoAudioEngine } from '../utils/stereoAudioEngine';
import { getValidImageUrl, handleImageError } from '../utils/imageFallback';
import { TargetBookingBadge } from './TargetBookingBadge';
import { StarRatingWidget } from './StarRatingWidget';

interface ReelFeedProps {
  businesses: Business[];
  onOpenBiz: (business: Business) => void;
  isMuted: boolean;
  onToggleMute?: () => void;
  onToggleLike: (id: number | string) => void;
  likedIds: Set<number | string>;
  currentCurrency: SupportedCurrency;
  lang: SupportedLang;
  onOpenCustomerUpload?: (b: Business) => void;
  onOpenCustomerPost?: (post: CustomerMediaPost, b: Business) => void;
  onOpenBooking?: (b: Business) => void;
  onOpenDelivery?: (b: Business) => void;
  userFollowingIds?: (string | number)[];
  onToggleFollow?: (bizId: string | number) => void;
  onOpenDashboard?: (b: Business) => void;
  onOpenComments?: (b: Business) => void;
  onOpenShareActionSheet?: (b: Business) => void;
  onOpenOwnerLock?: (b: Business) => void;
  onOpenPriceList?: (b: Business) => void;
  onOpenMusicBank?: (soundtrack?: BusinessSoundtrack) => void;
  onOpenTransportModal?: (b: Business) => void;
  onRateBusiness?: (bizId: number | string, newRating: number, newCount: number) => void;
  onOpenAdd?: () => void;
  onOpenSettings?: () => void;
}

export const ReelFeed: React.FC<ReelFeedProps> = ({
  businesses,
  onOpenBiz,
  isMuted,
  onToggleMute,
  onToggleLike,
  likedIds,
  currentCurrency,
  lang,
  onOpenCustomerPost,
  onOpenBooking,
  userFollowingIds = [],
  onToggleFollow,
  onOpenComments,
  onOpenShareActionSheet,
  onOpenOwnerLock,
  onOpenPriceList,
  onOpenMusicBank,
  onRateBusiness,
  onOpenAdd,
  onOpenSettings,
}) => {
  const t = I18N[lang];
  const tUi = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.ar;
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [heartAnimId, setHeartAnimId] = useState<number | string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [failedVideoIds, setFailedVideoIds] = useState<Set<number | string>>(new Set());
  const [phoneSelectorBiz, setPhoneSelectorBiz] = useState<Business | null>(null);
  const [readingBizId, setReadingBizId] = useState<number | string | null>(null);
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover'>('cover');
  const [activePhotoIdxMap, setActivePhotoIdxMap] = useState<Record<string | number, number>>({});
  const [showVideoMap, setShowVideoMap] = useState<Record<string | number, boolean>>({});

  // Auto-advance photos for current active Reel if it has multiple images and is in photo mode
  useEffect(() => {
    const currentBiz = businesses[activeVideoIndex];
    if (!currentBiz || !isPlaying) return;
    const isShowingVideo = !!showVideoMap[currentBiz.id];
    const photosCount = currentBiz.images?.length || 0;
    if (isShowingVideo || photosCount <= 1) return;

    const timer = setInterval(() => {
      setActivePhotoIdxMap((prev) => ({
        ...prev,
        [currentBiz.id]: ((prev[currentBiz.id] || 0) + 1) % photosCount,
      }));
    }, 4500);

    return () => clearInterval(timer);
  }, [activeVideoIndex, businesses, isPlaying, showVideoMap]);

  const handleReadAd = (e: React.MouseEvent, b: Business) => {
    e.stopPropagation();
    if (readingBizId === b.id) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setReadingBizId(null);
      return;
    }

    setReadingBizId(b.id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const priceText = b.services?.[0] ? `، السعر يبدأ من ${b.services[0].p} جنيه` : '';
      const textToRead = `${b.name}، القسم: ${b.cat}، العنوان: ${b.city} ${b.addr}، ${b.bio}${priceText}، للحجز والتواصل: ${b.phone}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'ar-EG';
      utterance.rate = 0.95;
      utterance.onend = () => setReadingBizId(null);
      utterance.onerror = () => setReadingBizId(null);
      window.speechSynthesis.speak(utterance);
    }
  };
  // Store references to video elements
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  // Soundtrack audio element reference
  const soundtrackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Smooth scroll to an index
  const scrollToIndex = useCallback((index: number) => {
    if (index < 0 || index >= businesses.length) return;
    const container = containerRef.current;
    if (!container) return;
    const targetElement = container.children[index] as HTMLElement | undefined;
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setActiveVideoIndex(index);
      setIsPlaying(true);
    }
  }, [businesses.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToIndex(activeVideoIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(activeVideoIndex - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideoIndex, scrollToIndex]);

  // Intersection listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: any;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const children = Array.from(container.children) as HTMLElement[];
        const scrollPos = container.scrollTop;

        let closestIdx = 0;
        let minDiff = Infinity;

        children.forEach((child, idx) => {
          const childTop = child.offsetTop;
          const diff = Math.abs(childTop - scrollPos);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });

        if (closestIdx !== activeVideoIndex) {
          setActiveVideoIndex(closestIdx);
          setIsPlaying(true);
        }
      }, 50);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [activeVideoIndex]);

  // Video and soundtrack audio playback management
  useEffect(() => {
    const currentBiz = businesses[activeVideoIndex];

    // Handle Soundtrack Audio
    if (soundtrackAudioRef.current) {
      soundtrackAudioRef.current.pause();
    }

    if (currentBiz?.soundtrack && currentBiz.soundtrack.url) {
      const isSoundtrackMuted = isMuted || currentBiz.soundtrack.isMuted || currentBiz.soundtrack.mutedByAdmin;
      if (!soundtrackAudioRef.current) {
        soundtrackAudioRef.current = new Audio(currentBiz.soundtrack.url);
      } else if (soundtrackAudioRef.current.src !== currentBiz.soundtrack.url) {
        soundtrackAudioRef.current.src = currentBiz.soundtrack.url;
      }

      soundtrackAudioRef.current.loop = true;
      soundtrackAudioRef.current.volume = isSoundtrackMuted ? 0 : (currentBiz.soundtrack.volume ?? 0.7);

      // Connect to Integrated Stereo Audio Engine (Surround & Equalizer)
      try {
        globalStereoAudioEngine.setup(soundtrackAudioRef.current, {
          volume: isSoundtrackMuted ? 0 : (currentBiz.soundtrack.volume ?? 0.7),
          stereoPan: currentBiz.soundtrack.stereoPan ?? 0,
          stereoMode: currentBiz.soundtrack.stereoMode ?? 'surround_3d',
          bassBoost: currentBiz.soundtrack.bassBoost ?? 4,
          trebleBoost: currentBiz.soundtrack.trebleBoost ?? 3,
        });
      } catch (err) {
        console.warn('Stereo audio engine setup notice:', err);
      }

      if (isPlaying && !isSoundtrackMuted) {
        soundtrackAudioRef.current.play().catch(() => {});
      }
    }

    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activeVideoIndex) {
        // If there's an active soundtrack playing, we keep the video itself muted to avoid audio clashes
        const hasActiveSoundtrack = currentBiz?.soundtrack && !currentBiz.soundtrack.isMuted && !currentBiz.soundtrack.mutedByAdmin;
        video.muted = isMuted || Boolean(hasActiveSoundtrack);

        if (isPlaying) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else {
          video.pause();
        }
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });

    return () => {
      if (soundtrackAudioRef.current) {
        soundtrackAudioRef.current.pause();
      }
    };
  }, [activeVideoIndex, isPlaying, isMuted, businesses]);

  const handleDoubleTap = (b: Business) => {
    onToggleLike(b.id);
    setHeartAnimId(b.id);
    setTimeout(() => setHeartAnimId(null), 900);
  };

  const handleShare = (e: React.MouseEvent, b: Business) => {
    e.stopPropagation();
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: b.name,
        text: `${b.name} - ${b.city} | إعلانك E3lanak`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${b.name} - ${b.city}\n${window.location.origin}`);
      setShareToast(lang === 'ar' ? 'تم نسخ رابط النشاط!' : 'Listing link copied!');
      setTimeout(() => setShareToast(null), 2500);
    }
  };

  const handleVideoError = (id: number | string) => {
    setFailedVideoIds((prev) => new Set(prev).add(id));
  };

  if (businesses.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-white/60 space-y-3">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
          🔍
        </div>
        <p className="text-sm font-semibold max-w-xs">{t.noResults}</p>
        <span className="text-xs text-white/40">{t.expiredNotice}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* Scrollable Container with Snap-Y */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto snap-y-mandatory hide-scroll bg-black"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Toast alert */}
        {shareToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] bg-[#FF2D55] text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl animate-bounce">
            {shareToast}
          </div>
        )}

        {businesses.map((b, idx) => {
          const isCurrent = idx === activeVideoIndex;
          const daysLeft = Math.ceil((b.expiry - Date.now()) / 86400000);
          const isLiked = likedIds.has(b.id);
          const videoSrc = b.videos?.[0];
          const imagesList =
            b.images && b.images.length > 0
              ? b.images
              : [getValidImageUrl(undefined, b.cat)];
          const currentPhotoIdx = (activePhotoIdxMap[b.id] || 0) % imagesList.length;
          const imageSrc = getValidImageUrl(imagesList[currentPhotoIdx], b.cat);
          const isVideoFailed = failedVideoIds.has(b.id);
          const isShowingVideo = !!showVideoMap[b.id] && !!videoSrc && !isVideoFailed;
          const allPhones = b.phones && b.phones.length > 0 ? b.phones : [b.phone];

          return (
            <div
              key={b.id}
              className="h-full min-h-full w-full snap-start relative flex items-center justify-center bg-black overflow-hidden"
              onDoubleClick={() => handleDoubleTap(b)}
            >
              {/* Media Layer: 100% Mobile & 100% Computer Screen with Properly Scaled/Fitted Image */}
              <div className="absolute inset-0 w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden">
                {/* Ambient Blurred Backdrop so 100% of screen looks rich */}
                <img
                  src={imageSrc}
                  alt=""
                  aria-hidden="true"
                  onError={(e) => handleImageError(e, b.cat)}
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-45 scale-110 pointer-events-none transition-all duration-500"
                />

                {/* Main Media Stage: Full Screen Width & Height (ملء الشاشة عرضاً وارتفاعاً 100%) */}
                <div
                  className={
                    imageFitMode === 'contain'
                      ? 'relative z-10 w-full h-full flex items-center justify-center pt-10 pb-24'
                      : 'absolute inset-0 z-10 w-full h-full'
                  }
                >
                  {isShowingVideo ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[idx] = el;
                      }}
                      src={videoSrc}
                      poster={b.poster || imageSrc}
                      muted={isMuted}
                      loop
                      autoPlay
                      playsInline
                      preload={idx <= 1 ? 'auto' : 'metadata'}
                      onError={() => handleVideoError(b.id)}
                      className={
                        imageFitMode === 'contain'
                          ? 'w-full h-full object-contain bg-black/50'
                          : 'w-full h-full object-cover object-center'
                      }
                    />
                  ) : (
                    <img
                      src={imageSrc}
                      alt={b.name}
                      onError={(e) => handleImageError(e, b.cat)}
                      className={
                        imageFitMode === 'contain'
                          ? 'w-full h-full object-contain bg-black/40 transition-all duration-300'
                          : 'w-full h-full object-cover object-center transition-all duration-300'
                      }
                    />
                  )}
                </div>

                {/* Multi-Photo Thumbnail Strip on Screen (عند وجود أكثر من صورة للنشاط) */}
                {!isShowingVideo && imagesList.length > 1 && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 pointer-events-auto shadow-lg">
                    {imagesList.map((imgUrl, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdxMap((prev) => ({ ...prev, [b.id]: pIdx }));
                        }}
                        className={`relative rounded-lg overflow-hidden border transition-all cursor-pointer ${
                          pIdx === currentPhotoIdx
                            ? 'w-8 h-6 border-amber-400 ring-2 ring-amber-400/50 scale-105'
                            : 'w-6 h-5 border-white/25 opacity-65 hover:opacity-100'
                        }`}
                        title={`صورة ${pIdx + 1} من ${imagesList.length}`}
                      >
                        <img
                          src={getValidImageUrl(imgUrl, b.cat)}
                          alt=""
                          onError={(e) => handleImageError(e, b.cat)}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                    <span className="text-[9px] font-black text-amber-300 px-1 font-mono">
                      {currentPhotoIdx + 1}/{imagesList.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Gradient Dark Overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-15"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.12) 42%, rgba(0,0,0,0.4) 100%)',
                }}
              />

              {/* Center Play/Pause indicator overlay on tap */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 w-full h-full z-10 flex items-center justify-center focus:outline-none"
                aria-label="Toggle Play"
              >
                {!isPlaying && (
                  <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white scale-110 transition shadow-2xl">
                    <Play className="w-8 h-8 fill-white translate-x-0.5" />
                  </div>
                )}
              </button>

              {/* Heart Pop Animation on Double Click */}
              {heartAnimId === b.id && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                  <Heart className="w-28 h-28 fill-[#FF2D55] text-[#FF2D55] animate-ping" />
                </div>
              )}

              {/* Clear, High-Visibility Advertisement Banner (إظهار الإعلان بوضوح) */}
              {(b.isSponsored || b.isDealOfDay || b.adCampaignTitle) && (
                <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between gap-2 bg-gradient-to-r from-black/85 via-neutral-900/90 to-black/85 backdrop-blur-md border border-amber-400/60 p-2 rounded-2xl shadow-xl shadow-black/60 pointer-events-auto">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 shadow">
                      <Megaphone className="w-3 h-3 fill-black" />
                      <span>إعلان معتمد ⚡</span>
                    </span>

                    <span className="text-[11px] font-bold text-amber-300 truncate">
                      {b.adCampaignTitle || 'عرض ترويجي مميز عبر إعلانك'}
                    </span>
                  </div>

                  {b.isDealOfDay && (
                    <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 shadow animate-pulse flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 fill-yellow-300" />
                      <span>عرض اليوم 🔥</span>
                    </span>
                  )}
                </div>
              )}

              {/* Customer Post Moving Text Ticker Strip (ينشط فقط في الريل الحالي لعدم إبطاء الشريط المتحرك) */}
              {isCurrent && b.customerPosts && b.customerPosts.length > 0 && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCustomerPost?.(b.customerPosts![0], b);
                  }}
                  className="absolute top-12 inset-x-3 z-30 pointer-events-auto cursor-pointer max-w-md mx-auto"
                  title="اضغط لمشاهدة فيديو وتجربة العميل بكتابة متحركة"
                >
                  <div className="bg-black/85 hover:bg-black/95 border border-purple-500/40 hover:border-purple-400 rounded-2xl px-3 py-1.5 flex items-center gap-2 overflow-hidden shadow-lg transition active:scale-98">
                    <span className="bg-[#FF2D55] text-white text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>تجارب العملاء ({b.customerPosts.length})</span>
                    </span>
                    <div className="overflow-hidden flex-1">
                      <div className="anim-marquee speed-slow text-[11px] font-black text-amber-300">
                        {b.customerPosts[0].userName}: {b.customerPosts[0].caption}
                      </div>
                    </div>
                    <span className="text-[10px] text-white/80 font-bold bg-white/10 px-2 py-0.5 rounded-full shrink-0">
                      مشاهدة ▶
                    </span>
                  </div>
                </div>
              )}

              {/* Subscriber Promotional Animated Text Overlay on the Reel (ينشط فقط في الريل الحالي لعدم إبطاء الشريط المتحرك) */}
              {isCurrent && (b.overlayText?.caption || b.textAnimation) && (
                <div 
                  className={`absolute z-25 pointer-events-none max-w-md mx-auto inset-x-3 text-center ${
                    b.overlayText?.position === 'top'
                      ? 'top-24'
                      : b.overlayText?.position === 'center'
                      ? 'top-1/2 -translate-y-1/2'
                      : 'bottom-44'
                  }`}
                >
                  <div
                    className={`${
                      b.overlayText?.bannerStyle === 'neon_glow_box'
                        ? 'banner-neon_glow_box'
                        : b.overlayText?.bannerStyle === 'glass_red'
                        ? 'banner-glass_red'
                        : b.overlayText?.bannerStyle === 'glass_gold'
                        ? 'banner-glass_gold'
                        : b.overlayText?.bannerStyle === 'emerald_card'
                        ? 'banner-emerald_card'
                        : b.overlayText?.bannerStyle === 'sticker_gradient'
                        ? 'banner-sticker_gradient'
                        : b.overlayText?.bannerStyle === 'badge_angled'
                        ? 'banner-badge_angled'
                        : b.overlayText?.bannerStyle === 'transparent_outline'
                        ? 'banner-transparent_outline'
                        : 'banner-glass_dark'
                    } px-3 py-1.5 rounded-2xl overflow-hidden inline-block mx-auto max-w-[92%] transition-all`}
                  >
                    <div
                      className={`${
                        (b.overlayText?.animation || b.textAnimation) === 'neon'
                          ? 'anim-neon-glow'
                          : (b.overlayText?.animation || b.textAnimation) === 'vibrate'
                          ? 'anim-vibrate'
                          : (b.overlayText?.animation || b.textAnimation) === 'wave'
                          ? 'anim-wave-text'
                          : (b.overlayText?.animation || b.textAnimation) === 'bounce'
                          ? 'anim-bounce-text'
                          : (b.overlayText?.animation || b.textAnimation) === 'slide'
                          ? 'anim-slide-text'
                          : (b.overlayText?.animation || b.textAnimation) === 'pop'
                          ? 'anim-pop-text'
                          : (b.overlayText?.animation || b.textAnimation) === 'flip3d'
                          ? 'anim-flip3d'
                          : (b.overlayText?.animation || b.textAnimation) === 'typewriter'
                          ? 'anim-typewriter'
                          : (b.overlayText?.animation || b.textAnimation) === 'shimmer'
                          ? 'anim-shimmer'
                          : 'anim-marquee'
                      } ${
                        b.overlayText?.fontStyle === 'kufi'
                          ? 'font-style-kufi'
                          : b.overlayText?.fontStyle === 'ruqah'
                          ? 'font-style-ruqah'
                          : b.overlayText?.fontStyle === 'bold_poster'
                          ? 'font-style-bold_poster'
                          : b.overlayText?.fontStyle === 'neon_cyber'
                          ? 'font-style-neon_cyber'
                          : b.overlayText?.fontStyle === 'typewriter'
                          ? 'font-style-typewriter'
                          : 'font-style-naskh'
                      } ${
                        b.overlayText?.speed === 'slow'
                          ? 'speed-slow'
                          : b.overlayText?.speed === 'fast'
                          ? 'speed-fast'
                          : 'speed-normal'
                      } ${
                        b.overlayText?.fontSize === 'sm'
                          ? 'text-xs'
                          : b.overlayText?.fontSize === 'lg'
                          ? 'text-base font-black'
                          : 'text-sm font-black'
                      } font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] tracking-wide`}
                      style={{ color: b.overlayText?.textColor || '#00F0FF' }}
                    >
                      {b.overlayText?.caption || b.bio}
                    </div>
                  </div>
                </div>
              )}

              {/* Content Container (100% Mobile & 100% Computer Screen: Ad Reading + Moving Ticker + Side Bar + Bottom-Center Subscribe Now + & Book Now) */}
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-2.5 sm:p-5 pb-16 w-full max-w-none pointer-events-none">
                <div className="flex items-end justify-between gap-2.5 w-full">
                  
                  {/* Ad Reading & Moving Ticker Strip Area (قراءة الإعلان + شريط متحرك) */}
                  <div className="flex-1 max-w-xl space-y-1.5 pointer-events-auto min-w-0">
                    
                    {/* Moving Ticker Strip for the Ad & Updates (شريط متحرك سريع وسلس بدون بطء) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (b.customerPosts && b.customerPosts.length > 0 && onOpenCustomerPost) {
                          onOpenCustomerPost(b.customerPosts[0], b);
                        } else {
                          onOpenBiz(b);
                        }
                      }}
                      className="bg-black/85 hover:bg-black/95 border border-amber-400/40 rounded-xl px-2.5 py-1 flex items-center gap-2 overflow-hidden cursor-pointer shadow-md w-full"
                    >
                      <span className="bg-[#FF2D55] text-white text-[9px] font-black px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        <span>شريط متحرك</span>
                      </span>
                      <div className="overflow-hidden flex-1">
                        <div className={`${isCurrent ? 'anim-marquee speed-slow' : 'truncate'} text-[11px] font-bold text-amber-300 whitespace-nowrap`}>
                          📢 {b.name} ({b.cat}) • {b.city} - {b.addr} • للتواصل والحجز: {b.phone} ✨
                        </div>
                      </div>
                    </div>

                    {/* Action Controls: Read Ad + Toggle Image Fit + Details */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* قراءة الإعلان (صوتياً ونصياً بوضوح) */}
                      <button
                        type="button"
                        onClick={(e) => handleReadAd(e, b)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition cursor-pointer shadow border ${
                          readingBizId === b.id
                            ? 'bg-amber-400 text-black border-amber-300 animate-pulse'
                            : 'bg-black/80 hover:bg-amber-400 hover:text-black text-amber-300 border-amber-400/50'
                        }`}
                        title="قراءة الإعلان بالصوت والنص الكامل"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>{readingBizId === b.id ? '🔊 جاري القراءة...' : '🔊 قراءة الإعلان'}</span>
                      </button>

                      {/* ضبط حجم الصورة 100% على الشاشة */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/75 hover:bg-white/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1 cursor-pointer"
                        title="تصغير وضبط الصورة 100% على الشاشة"
                      >
                        <span>{imageFitMode === 'contain' ? '📐 صورة مضبوطة 100%' : '🖼️ ملء الشاشة'}</span>
                      </button>

                      {/* التبديل بين الصور والفيديو إذا توفر فيديو */}
                      {videoSrc && !isVideoFailed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowVideoMap((prev) => ({ ...prev, [b.id]: !prev[b.id] }));
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/75 hover:bg-white/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isShowingVideo ? `📸 الصور (${imagesList.length})` : '🎬 الفيديو'}</span>
                        </button>
                      )}

                      {/* فتح تفاصيل الإعلان الكاملة */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBiz(b);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 flex items-center gap-1 cursor-pointer"
                      >
                        <span>التفاصيل</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Title, Verified Badge, Category & Star Rating */}
                    <div
                      onClick={() => onOpenBiz(b)}
                      className="cursor-pointer group flex items-center gap-1.5 flex-wrap"
                    >
                      <h2 className="text-base sm:text-xl font-black text-white group-hover:text-[#FF2D55] transition drop-shadow-md truncate max-w-full">
                        {b.name}
                      </h2>
                      {b.verified === 1 && (
                        <CheckCircle className="w-4 h-4 fill-[#20D5EC] text-black shrink-0" />
                      )}
                      <StarRatingWidget
                        business={b}
                        onRate={onRateBusiness}
                        variant="card"
                        size="sm"
                      />
                    </div>

                    {/* Clear Ad Text Reading Box (قراءة الإعلان) */}
                    <div
                      onClick={() => onOpenBiz(b)}
                      className={`cursor-pointer transition rounded-xl ${
                        readingBizId === b.id
                          ? 'bg-black/90 border border-amber-400/60 p-2.5 shadow-2xl'
                          : 'bg-black/45 backdrop-blur-xs px-2.5 py-1.5 border border-white/10'
                      }`}
                    >
                      <p
                        className={`text-[11px] sm:text-xs text-white/95 leading-relaxed drop-shadow ${
                          readingBizId === b.id ? '' : 'line-clamp-2'
                        }`}
                      >
                        {b.bio}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-white/80 mt-1 flex-wrap">
                        <span className="text-amber-300 font-bold">{getCategoryLabel(b.cat, lang)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#FF2D55] shrink-0" />
                          <span>{getCityLabel(b.city, lang)} - {b.addr}</span>
                        </span>
                        {b.services?.[0] && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-300 font-black">
                              {formatServicePrice(b.services[0].p, currentCurrency)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* الشريط على الجانب (Compact, Sleek Side Action Bar) */}
                  <div className="flex flex-col items-center gap-1.5 pointer-events-auto shrink-0 pb-0.5">
                    
                    {/* 3-Dots Settings Button on the Side Bar (إعدادات 3 نقط ⋮) */}
                    {onOpenSettings && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSettings();
                        }}
                        className="flex flex-col items-center group cursor-pointer"
                        title="جميع الأزرار والإعدادات فوق بعض (3 نقط ⋮)"
                      >
                        <div className="w-9 h-9 rounded-full bg-black/80 hover:bg-[#FF2D55] border border-amber-400/50 text-white flex items-center justify-center shadow-lg transition">
                          <MoreVertical className="w-4 h-4 text-amber-300" />
                        </div>
                        <span className="text-[8px] font-black text-amber-300 mt-0.5 drop-shadow">
                          3 نقط ⋮
                        </span>
                      </button>
                    )}

                    {/* TikTok Profile Avatar with '+' Subscribe Button */}
                    <div className="relative mb-1 flex flex-col items-center">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBiz(b);
                        }}
                        className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-xl cursor-pointer bg-neutral-800 transition transform hover:scale-105"
                        title={b.name}
                      >
                        <img
                          src={getValidImageUrl(b.images?.[0], b.cat)}
                          alt={b.name}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, b.cat)}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleFollow) {
                            onToggleFollow(b.id);
                          }
                        }}
                        className={`absolute -bottom-1.5 inset-x-0 mx-auto w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border border-white cursor-pointer ${
                          userFollowingIds.includes(b.id)
                            ? 'bg-emerald-500 text-white scale-95'
                            : 'bg-[#FF2D55] text-white hover:scale-110'
                        }`}
                        title={userFollowingIds.includes(b.id) ? 'تم المتابعة ✓' : 'تابع +'}
                      >
                        {userFollowingIds.includes(b.id) ? (
                          <CheckCircle className="w-2.5 h-2.5 fill-white text-emerald-500" />
                        ) : (
                          <span className="text-[10px] font-black leading-none select-none">+</span>
                        )}
                      </button>
                    </div>

                    {/* علامة الحجز العائمة (1 إلى 300) */}
                    {onOpenBooking && (
                      <TargetBookingBadge
                        business={b}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBooking(b);
                        }}
                        variant="floating"
                      />
                    )}

                    {/* Like Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(b.id);
                      }}
                      className="flex flex-col items-center group cursor-pointer"
                      aria-label="Like"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition transform active:scale-75 shadow-lg backdrop-blur-md ${
                          isLiked
                            ? 'bg-[#FF2D55] text-white'
                            : 'bg-black/65 text-white border border-white/20 hover:bg-black/80'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${isLiked ? 'fill-white stroke-white' : 'stroke-white'}`}
                        />
                      </div>
                      <span className="text-[8px] font-bold text-white mt-0.5 drop-shadow">
                        {(b.likes || 0) + (isLiked ? 1 : 0)}
                      </span>
                    </button>

                    {/* Comments Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenComments?.(b);
                      }}
                      className="flex flex-col items-center group cursor-pointer"
                      title="تعليقات واستفسارات الزوار"
                    >
                      <div className="w-9 h-9 rounded-full bg-black/65 text-white border border-white/20 hover:bg-black/80 flex items-center justify-center transition transform active:scale-75 shadow-lg backdrop-blur-md">
                        <MessageCircle className="w-4 h-4 text-sky-400" />
                      </div>
                      <span className="text-[8px] font-bold text-white mt-0.5 drop-shadow">
                        {b.comments?.length || 2}
                      </span>
                    </button>

                    {/* Direct Call Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allPhones.length > 1) {
                          setPhoneSelectorBiz(b);
                        } else {
                          window.location.href = `tel:${b.phone}`;
                        }
                      }}
                      className="flex flex-col items-center group cursor-pointer"
                      title="اتصل بالنشاط التجاري فوراً"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition transform active:scale-75 shadow-lg">
                        <Phone className="w-4 h-4 fill-black" />
                      </div>
                      <span className="text-[8px] font-black text-emerald-300 mt-0.5 drop-shadow">
                        {tUi.callBtn}
                      </span>
                    </button>

                    {/* WhatsApp Quick Message */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allPhones.length > 1) {
                          setPhoneSelectorBiz(b);
                        } else {
                          const waUrl = `https://wa.me/${b.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `مرحباً ${b.name}، استفسار من منصة E3lanak إعلانك`
                          )}`;
                          window.open(waUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="flex flex-col items-center group cursor-pointer"
                      title={tUi.whatsappBtn}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#25D366] hover:bg-[#20ba59] flex items-center justify-center text-white transition transform active:scale-75 shadow-lg">
                        <MessageCircle className="w-4 h-4 fill-white" />
                      </div>
                      <span className="text-[8px] font-black text-[#25D366] mt-0.5 drop-shadow">
                        {tUi.whatsappBtn}
                      </span>
                    </button>

                    {/* Share Listing */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenShareActionSheet) {
                          onOpenShareActionSheet(b);
                        } else {
                          handleShare(e, b);
                        }
                      }}
                      className="flex flex-col items-center group cursor-pointer"
                      title={tUi.shareBtn}
                    >
                      <div className="w-8 h-8 rounded-full bg-black/65 hover:bg-black/80 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition transform active:scale-75 shadow-lg">
                        <Share2 className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                    </button>

                    {/* Owner Lock / Edit Page (تعديل صفحتي برقم سري) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenOwnerLock?.(b);
                      }}
                      className="flex flex-col items-center group cursor-pointer"
                      title="تعديل صفحتي برقم سري (خاص بصاحب النشاط)"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FFD700] hover:brightness-110 flex items-center justify-center text-black transition transform active:scale-75 shadow-lg">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[8px] font-black text-amber-300 mt-0.5 drop-shadow">
                        صفحتي 🔐
                      </span>
                    </button>
                  </div>
                </div>

                {/* Bottom-Center Action Dock Inside Screen: Enhanced "اشترك الآن +" & Enhanced "احجز الآن" */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-2 pointer-events-auto w-max max-w-[96vw]">
                  {/* 1. زر اشترك الآن + المحسن داخل الشاشة أسفل المنتصف */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenAdd) {
                        onOpenAdd();
                      } else if (onOpenPriceList) {
                        onOpenPriceList(b);
                      }
                    }}
                    className="bg-gradient-to-r from-[#FF2D55] via-rose-500 to-amber-500 hover:brightness-110 active:scale-95 text-white px-4 py-1.5 rounded-xl shadow-2xl shadow-[#FF2D55]/40 border border-white/40 flex items-center gap-1.5 cursor-pointer transition"
                    title="اشترك الآن + (أضف إعلانك ونشاطك مجاناً)"
                  >
                    <span className="w-5 h-5 rounded-lg bg-white text-[#FF2D55] flex items-center justify-center font-black text-sm leading-none shadow">
                      +
                    </span>
                    <span className="font-black text-xs tracking-wide drop-shadow">
                      اشترك الآن
                    </span>
                  </button>

                  {/* 2. زر احجز الآن المحسن (من 1 إلى 300 بالسعر والموعد) */}
                  {onOpenBooking && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBooking(b);
                      }}
                      className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 active:scale-95 text-black px-4 py-1.5 rounded-xl shadow-2xl shadow-emerald-500/40 border border-emerald-200/60 flex items-center gap-1.5 cursor-pointer transition"
                      title="احجز الآن موعد أو خدمة برقم دورك (1 إلى 300)"
                    >
                      <span className="w-5 h-5 rounded-lg bg-black/20 text-white flex items-center justify-center text-xs font-black">
                        📅
                      </span>
                      <span className="font-black text-xs tracking-wide">
                        {b.bookingServiceTitle || 'احجز الآن'}
                      </span>
                      {b.bookingPrice ? (
                        <span className="text-[10px] font-black bg-black/80 text-amber-300 px-1.5 py-0.5 rounded-md">
                          {b.bookingPrice} ج
                        </span>
                      ) : null}
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Chevrons for Desktop Navigation */}
      <div className="hidden md:flex flex-col gap-2 absolute end-6 bottom-16 z-30 pointer-events-auto">
        <button
          onClick={() => scrollToIndex(activeVideoIndex - 1)}
          disabled={activeVideoIndex === 0}
          className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 disabled:opacity-30 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition shadow-lg cursor-pointer"
          title="الفيديو السابق"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollToIndex(activeVideoIndex + 1)}
          disabled={activeVideoIndex === businesses.length - 1}
          className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 disabled:opacity-30 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition shadow-lg cursor-pointer"
          title="الفيديو التالي"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Multi-phone numbers quick modal */}
      {phoneSelectorBiz && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-3xl p-5 w-full max-w-sm text-white shadow-2xl relative">
            <button
              onClick={() => setPhoneSelectorBiz(null)}
              className="absolute top-4 start-4 w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center"
            >
              ✕
            </button>
            <h4 className="font-black text-sm text-center mb-1">
              {phoneSelectorBiz.name}
            </h4>
            <p className="text-[11px] text-white/60 text-center mb-4">
              {t.contactNumbers}
            </p>
            <div className="space-y-2">
              {(phoneSelectorBiz.phones || [phoneSelectorBiz.phone]).map((ph, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex items-center justify-between"
                >
                  <span className="font-bold text-xs tracking-wider dir-ltr">
                    {ph}
                  </span>
                  <div className="flex gap-1.5">
                    <a
                      href={`https://wa.me/${ph.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-[#25D366] text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3 fill-white" />
                      <span>واتساب</span>
                    </a>
                    <a
                      href={`tel:${ph}`}
                      className="px-2.5 py-1 bg-white text-black rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>اتصال</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
