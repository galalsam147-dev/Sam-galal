/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, Heart, Plus } from 'lucide-react';
import { Business, CustomerMediaPost, PackageTier, SortOption, SupportedCurrency, SupportedLang, UserProfile, DeliveryOrder } from './types';
import { INITIAL_BUSINESSES } from './data/initialBusinesses';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { ReelFeed } from './components/ReelFeed';
import { GridFeed } from './components/GridFeed';
import { BusinessModal } from './components/BusinessModal';
import { AddBusinessModal } from './components/AddBusinessModal';
import { RenewModal } from './components/RenewModal';
import { AdminModal } from './components/AdminModal';
import { CurrencyModal } from './components/CurrencyModal';
import { SubscribersProgramModal } from './components/SubscribersProgramModal';
import { AddCustomerMediaModal } from './components/AddCustomerMediaModal';
import { CustomerPostPlayerModal } from './components/CustomerPostPlayerModal';
import { BookingModal } from './components/BookingModal';
import { SubscriberDashboardModal } from './components/SubscriberDashboardModal';
import { CommentsModal } from './components/CommentsModal';
import { ShareActionSheet } from './components/ShareActionSheet';
import { BottomNav, BottomNavTab } from './components/BottomNav';
import { ChatsModal } from './components/ChatsModal';
import { UserBookingsModal, SavedBooking } from './components/UserBookingsModal';
import { UserProfileModal } from './components/UserProfileModal';
import { BusinessDirectDeliveryModal } from './components/BusinessDirectDeliveryModal';
import { FeaturedAdBanner } from './components/FeaturedAdBanner';
import { QuickRegisterUnlistedModal } from './components/QuickRegisterUnlistedModal';
import { TikTokHeader } from './components/TikTokHeader';
import { SettingsFolderModal } from './components/SettingsFolderModal';
import { OwnerLockModal } from './components/OwnerLockModal';
import { AdminEditSubscriberModal } from './components/AdminEditSubscriberModal';
import { BusinessPriceListModal } from './components/BusinessPriceListModal';
import { DeliveryCaptainRegisterModal } from './components/DeliveryCaptainRegisterModal';
import { SecurityWarningNoticeModal } from './components/SecurityWarningNoticeModal';
import { LiveTaxiTransportTrackingModal } from './components/LiveTaxiTransportTrackingModal';
import { AppInstallModal } from './components/AppInstallModal';
import { MusicBankModal } from './components/MusicBankModal';
import { NearbyQuickDispatchModal } from './components/NearbyQuickDispatchModal';
import { OfficialDomainModal } from './components/OfficialDomainModal';
import { OrderNowDirectoryModal } from './components/OrderNowDirectoryModal';
import { AssistantStaffPortalModal } from './components/AssistantStaffPortalModal';
import { ThreeConnectedPagesModal } from './components/ThreeConnectedPagesModal';
import { BusinessSoundtrack } from './types';
import { calculateDistanceKm, getCurrentCoordinates } from './utils/distance';
import { I18N } from './utils/translations';
import { auditBusinessContent } from './utils/contentModeration';

import { getFallbackImageForCategory } from './utils/imageFallback';

const STORAGE_KEY = 'dalilk_v3';
const LIKES_KEY = 'dalilk_likes';
const LANG_KEY = 'dalilk_lang';
const CURRENCY_KEY = 'dalilk_currency';
const USER_KEY = 'dalilk_user_account';
const ORDERS_KEY = 'dalilk_delivery_orders';

function sanitizeBusinessesList(list: Business[]): Business[] {
  const seenIds = new Set<string | number>();
  return list.map((b, idx) => {
    let uniqueId = b.id;
    if (seenIds.has(uniqueId)) {
      uniqueId = `${b.id}_${idx + 200}`;
    }
    seenIds.add(uniqueId);

    const validImages = Array.isArray(b.images) && b.images.filter(Boolean).length > 0
      ? b.images.filter(Boolean)
      : [getFallbackImageForCategory(b.cat)];

    let savedPin = '';
    try {
      savedPin = localStorage.getItem(`dalilk_pin_${uniqueId}`) || '';
      localStorage.removeItem(`dalilk_owner_verified_${uniqueId}`);
      sessionStorage.removeItem(`dalilk_dashboard_unlocked_${uniqueId}`);
    } catch {}

    const activePin = (savedPin || b.ownerPin || b.ownerAccessCode || '1234').trim();

    return {
      ...b,
      id: uniqueId,
      images: validImages,
      ownerPageLocked: true,
      ownerPin: activePin,
      ownerAccessCode: activePin,
    };
  });
}

export default function App() {
  // Load businesses from localStorage or fallback
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasActive = parsed.some(
            (b: Business) => b.status === 'active' && b.expiry > Date.now()
          );
          if (hasActive) {
            return sanitizeBusinessesList(parsed);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
    return sanitizeBusinessesList(INITIAL_BUSINESSES);
  });

  // Liked businesses IDs
  const [likedIds, setLikedIds] = useState<Set<number | string>>(() => {
    try {
      const stored = localStorage.getItem(LIKES_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
    return new Set();
  });

  // Language state (7 Languages: ar, en, zh, it, fr, ru, uk)
  const [lang, setLang] = useState<SupportedLang>(() => {
    try {
      const savedLang = localStorage.getItem(LANG_KEY) as SupportedLang;
      if (['ar', 'en', 'zh', 'it', 'fr', 'ru', 'uk'].includes(savedLang)) {
        return savedLang;
      }
    } catch {}
    return 'ar';
  });

  // Currency state (EGP, USD, EUR, SAR, AED, CNY, RUB, UAH, GBP)
  const [currentCurrency, setCurrentCurrency] = useState<SupportedCurrency>(() => {
    try {
      const savedCurr = localStorage.getItem(CURRENCY_KEY) as SupportedCurrency;
      if (['EGP', 'USD', 'EUR', 'SAR', 'AED', 'CNY', 'RUB', 'UAH', 'GBP'].includes(savedCurr)) {
        return savedCurr;
      }
    } catch {}
    return 'EGP';
  });

  // GPS User Location state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Filter & Sorting states
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<'reels' | 'grid'>('reels');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [showExpiredOnly, setShowExpiredOnly] = useState<boolean>(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [showForSaleOnly, setShowForSaleOnly] = useState<boolean>(false);

  // Modals
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [selectedBookingBiz, setSelectedBookingBiz] = useState<Business | null>(null);
  const [selectedDashboardBiz, setSelectedDashboardBiz] = useState<Business | null>(null);
  const [selectedCommentsBiz, setSelectedCommentsBiz] = useState<Business | null>(null);
  const [selectedShareBiz, setSelectedShareBiz] = useState<Business | null>(null);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isRenewOpen, setIsRenewOpen] = useState<boolean>(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState<boolean>(false);
  const [isSubscribersProgramOpen, setIsSubscribersProgramOpen] = useState<boolean>(false);
  const [isOfficialDomainOpen, setIsOfficialDomainOpen] = useState<boolean>(false);
  const [isCustomerUploadOpen, setIsCustomerUploadOpen] = useState<boolean>(false);
  const [customerUploadTargetBiz, setCustomerUploadTargetBiz] = useState<Business | null>(null);
  const [activeCustomerPostPlayer, setActiveCustomerPostPlayer] = useState<{
    post: CustomerMediaPost;
    business?: Business | null;
  } | null>(null);
  const [renewTarget, setRenewTarget] = useState<Business | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [ownerLockTargetBiz, setOwnerLockTargetBiz] = useState<Business | null>(null);
  const [ownerEditBiz, setOwnerEditBiz] = useState<Business | null>(null);
  const [priceListTargetBiz, setPriceListTargetBiz] = useState<Business | null>(null);
  const [isCaptainRegisterOpen, setIsCaptainRegisterOpen] = useState<boolean>(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState<boolean>(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState<boolean>(false);
  const [transportTargetBiz, setTransportTargetBiz] = useState<Business | null>(null);
  const [isAppInstallModalOpen, setIsAppInstallModalOpen] = useState<boolean>(false);

  // Free User Profile (TikTok style account) state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return {
      id: 'usr_guest_e3lanak',
      username: '@ahmed_e3lanak',
      displayName: 'أحمد المصري (متابع إعلانك)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'عاشق لمصر واستكشاف أرقى الأماكن السياحية، المطاعم، والخدمات المميزة 🇪🇬✨',
      phone: '01006656669',
      city: 'القاهرة',
      followersCount: 185,
      followingIds: [100, 101, 1], // Following Tanoak, Accountant, Hadramawt
      points: 340,
      walletBalance: 200,
      createdAt: Date.now() - 86400000 * 30,
      isVerified: true,
    };
  });

  // Delivery Orders (Talabat-style in-app delivery) state
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(() => {
    try {
      const stored = localStorage.getItem(ORDERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'ord-sample-1',
        orderNumber: 'DLK-7821',
        businessId: 1,
        businessName: 'مطعم حضرموت شيخ المندي الملكي',
        category: 'restaurant',
        items: [
          { name: 'وجبة مندي لحم تيس بلدي فاخر', quantity: 2, estimatedPriceEgp: 380 }
        ],
        pickupAddress: 'شارع الطيران، مدينة نصر، القاهرة',
        deliveryAddress: 'مدينة نصر - الحي السابع - عمارة 14',
        customerName: 'أحمد المصري',
        customerPhone: '01006656669',
        captainName: 'كابتن وليد المصري',
        captainPhone: '01006656669',
        deliveryFeeEgp: 25,
        itemsSubtotalEgp: 760,
        totalEgp: 785,
        paymentMethod: 'cash',
        status: 'delivered',
        statusUpdates: [
          { status: 'received', time: Date.now() - 3600000 * 5, note: 'تم استلام الطلب' },
          { status: 'preparing', time: Date.now() - 3600000 * 4.5, note: 'تم التجهيز' },
          { status: 'delivered', time: Date.now() - 3600000 * 4, note: 'تم التسليم بنجاح' },
        ],
        createdAt: Date.now() - 3600000 * 5,
      }
    ];
  });

  // User Profile & Delivery modals states
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [deliveryTargetBiz, setDeliveryTargetBiz] = useState<Business | null>(null);
  const [activeTrackedOrder, setActiveTrackedOrder] = useState<DeliveryOrder | null>(null);
  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [isChatsModalOpen, setIsChatsModalOpen] = useState(false);
  const [isSettingsFolderOpen, setIsSettingsFolderOpen] = useState(false);
  const [isAssistantPortalOpen, setIsAssistantPortalOpen] = useState(false);
  const [isThreePagesHubOpen, setIsThreePagesHubOpen] = useState(false);
  const [threePagesHubTab, setThreePagesHubTab] = useState<'page1_users_admin' | 'page2_customers' | 'page3_subscribers' | 'public_ads_tracking'>('page1_users_admin');
  const [isMusicBankOpen, setIsMusicBankOpen] = useState(false);
  const [isNearbyDispatchOpen, setIsNearbyDispatchOpen] = useState(false);
  const [isOrderNowDirectoryOpen, setIsOrderNowDirectoryOpen] = useState(false);
  const [activeBankSoundtrack, setActiveBankSoundtrack] = useState<BusinessSoundtrack | undefined>(undefined);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomNavTab>('home');

  // User Bookings state (حجوزاتي الفندقية والسياحية المرتبطة بكل مشترك)
  const [userBookings, setUserBookings] = useState<SavedBooking[]>(() => {
    try {
      const saved = localStorage.getItem('e3lanak_my_bookings') || localStorage.getItem('dalilk_my_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        ref: 'E3L-BK-849120',
        businessId: 100,
        businessName: 'تانوك ريزورت (Tanoak Hotel) - أزها العين السخنة',
        roomName: 'جناح سوبيريور عائلي (إطلالة بحر)',
        checkIn: '2026-10-07',
        checkOut: '2026-10-09',
        nights: 2,
        guestName: 'أحمد محمود النجار',
        guestPhone: '01006656669',
        totalPrice: 12558,
        paymentMethod: 'الدفع في الفندق عند الوصول (Cash upon arrival)',
        status: 'confirmed',
        createdAt: Date.now() - 3600000 * 24,
      },
      {
        ref: 'E3L-BK-918234',
        businessId: 2,
        businessName: 'Nile Royal Palace Hotel - فندق قصر النيل الدولي',
        roomName: 'غرفة ديلوكس مطلة على النيل لشخصين',
        checkIn: '2026-10-12',
        checkOut: '2026-10-14',
        nights: 2,
        guestName: 'أحمد محمود النجار',
        guestPhone: '01006656669',
        totalPrice: 5200,
        paymentMethod: 'الدفع في الفندق عند الوصول (Cash upon arrival)',
        status: 'confirmed',
        createdAt: Date.now() - 3600000 * 48,
      }
    ];
  });

  const handleDeleteBooking = (ref: string) => {
    setUserBookings((prev) => {
      const updated = prev.filter((b) => b.ref !== ref);
      try {
        localStorage.setItem('e3lanak_my_bookings', JSON.stringify(updated));
        localStorage.setItem('dalilk_my_bookings', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    showToast('🗑️ تم إلغاء وحذف الحجز بنجاح.');
  };

  const handleBookingSuccess = (newBooking: SavedBooking) => {
    setUserBookings((prev) => {
      const updated = [newBooking, ...prev.filter((b) => b.ref !== newBooking.ref)];
      try {
        localStorage.setItem('e3lanak_my_bookings', JSON.stringify(updated));
        localStorage.setItem('dalilk_my_bookings', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setUserProfile(updated);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    } catch {}
    showToast('✨ تم حفظ وتحديث بيانات حسابك المجاني بنجاح!');
  };

  const toggleFollowBusiness = (bizId: string | number) => {
    setUserProfile((prev) => {
      const isFollowing = prev.followingIds.includes(bizId);
      const nextIds = isFollowing
        ? prev.followingIds.filter((id) => id !== bizId)
        : [...prev.followingIds, bizId];
      const updated = {
        ...prev,
        followingIds: nextIds,
        points: isFollowing ? prev.points : prev.points + 10,
      };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      } catch {}
      showToast(isFollowing ? 'تم إلغاء المتابعة' : '🎉 تم متابعة النشاط بنجاح وكسبت 10 نقاط ولاء!');
      return updated;
    });
  };

  const handlePlaceDeliveryOrder = (order: DeliveryOrder) => {
    const updated = [order, ...deliveryOrders];
    setDeliveryOrders(updated);
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    } catch {}
    // Award 50 points on every delivery order!
    setUserProfile((prev) => {
      const next = { ...prev, points: prev.points + 50 };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast(`🛵 تم إرسال طلبك ${order.orderNumber} بنجاح وجاري المتابعة الفورية!`);
  };

  const handleUpdateDeliveryOrders = (updatedOrders: DeliveryOrder[]) => {
    setDeliveryOrders(updatedOrders);
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    } catch {}
  };

  const handleOpenDelivery = (targetBiz?: Business | null) => {
    const effectiveBiz =
      targetBiz ||
      businesses.find((b) => b.hasDelivery || b.deliveryInfo?.available) ||
      businesses[0];
    setDeliveryTargetBiz(effectiveBiz);
    setActiveTrackedOrder(null);
    setIsDeliveryOpen(true);
  };

  const handleOpenOrderTracker = (order: DeliveryOrder) => {
    setActiveTrackedOrder(order);
    setIsDeliveryOpen(true);
  };

  const handleOpenTransportTracking = (targetBiz?: Business | null) => {
    setTransportTargetBiz(targetBiz || null);
    setIsTransportModalOpen(true);
  };

  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);

  const handleRegisterUnlistedBusiness = (biz: Business, message: string) => {
    const updated = [biz, ...businesses];
    saveBusinesses(updated);
    // Award 100 loyalty points to the customer for adding a new local place!
    setUserProfile((prev) => {
      const next = { ...prev, points: prev.points + 100 };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast('🎉 يسعدنا استضافتك لزياده مبيعاتك وشهرتك ونتمني ان تسجل معنا علي طول ونتمني نكون في خدمتك لتحقيق النجاح');
  };

  const t = I18N[lang];

  // Sync businesses to localStorage
  const saveBusinesses = (list: Business[]) => {
    setBusinesses(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  const handleAddCustomerPost = (post: CustomerMediaPost, targetBusinessId?: string | number) => {
    const bizId = targetBusinessId || post.businessId;
    const updated = businesses.map((b) => {
      if (b.id === bizId) {
        const existing = b.customerPosts || [];
        return {
          ...b,
          customerPosts: [post, ...existing],
        };
      }
      return b;
    });
    saveBusinesses(updated);
    if (selectedBiz && selectedBiz.id === bizId) {
      setSelectedBiz({
        ...selectedBiz,
        customerPosts: [post, ...(selectedBiz.customerPosts || [])],
      });
    }
    showToast(lang === 'ar' ? 'تم نشر فيديو وتجربة العميل مع الكتابة المتحركة بنجاح! 🚀🎬' : 'Media with animated text published successfully! 🚀🎬');
  };

  const handleSelectLang = (newLang: SupportedLang) => {
    setLang(newLang);
    try {
      localStorage.setItem(LANG_KEY, newLang);
    } catch {}
  };

  const handleSelectCurrency = (newCurr: SupportedCurrency) => {
    setCurrentCurrency(newCurr);
    try {
      localStorage.setItem(CURRENCY_KEY, newCurr);
    } catch {}
    setIsCurrencyModalOpen(false);
    showToast(lang === 'ar' ? `تم تغيير عملة العرض إلى ${newCurr}` : `Display currency changed to ${newCurr}`);
  };

  // Sync likes to localStorage
  const toggleLike = (id: number | string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(LIKES_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Interactive 1-5 Star Rating update handler for public business cards
  const handleRateBusiness = (bizId: number | string, newRating: number, newCount: number) => {
    const updated = businesses.map((b) => {
      if (b.id === bizId) {
        return {
          ...b,
          rating: newRating,
          ratingCount: newCount,
        };
      }
      return b;
    });
    saveBusinesses(updated);
    if (selectedBiz && selectedBiz.id === bizId) {
      setSelectedBiz({
        ...selectedBiz,
        rating: newRating,
        ratingCount: newCount,
      });
    }
    showToast(lang === 'ar' ? `⭐ شكراً لتقييمك! تم تحديث تقييم النشاط إلى ${newRating.toFixed(1)} / 5` : `⭐ Thank you! Business rating updated to ${newRating.toFixed(1)} / 5`);
  };

  // Detect GPS User Geolocation in seconds
  const handleDetectLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      setUserCoords(coords);
      setSortBy('nearest');
      showToast(lang === 'ar' ? '📍 تم تحديد موقعك في ثوانٍ وعرض الأقرب لك فوراً!' : 'Location detected in seconds! Nearest listings displayed.');
    } catch (err) {
      console.warn('GPS detection failed, fallback to Cairo center:', err);
      // Fallback Cairo center coordinates for simulation
      setUserCoords({ lat: 30.0444, lng: 31.2357 });
      setSortBy('nearest');
      showToast(lang === 'ar' ? '📍 تم تحديد موقعك (القاهرة) وعرض الأقرب لك فوراً!' : 'Location set to Cairo! Showing nearest places.');
    } finally {
      setIsLocating(false);
    }
  }, [lang]);

  // Auto-detect GPS location on app launch / open for iPads, mobiles, tablets, and computers
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDetectLocation();
    }, 600);
    return () => clearTimeout(timer);
  }, [handleDetectLocation]);

  // Check for expired businesses every 15s (90-day countdown expiration engine)
  useEffect(() => {
    const timer = setInterval(() => {
      let changed = false;
      const now = Date.now();
      const updated = businesses.map((b) => {
        if (b.status === 'active' && b.expiry < now) {
          changed = true;
          return { ...b, status: 'expired' as const };
        }
        return b;
      });

      if (changed) {
        saveBusinesses(updated);
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [businesses]);

  // Language direction updater
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Filter & Sort pipeline for public feeds
  const expiredCount = useMemo(() => {
    const now = Date.now();
    return businesses.filter((b) => b.status === 'expired' || b.expiry < now).length;
  }, [businesses]);

  const visibleBusinesses = useMemo(() => {
    const now = Date.now();
    const query = searchQuery.trim().toLowerCase();

    // 1. Filter
    const filtered = businesses.filter((b) => {
      // Automatic Content Moderation halt: stop display of inappropriate, abusive, or political ads
      if (b.status === 'hidden' || b.status === 'flagged') return false;
      const moderationCheck = auditBusinessContent(b);
      if (!moderationCheck.isValid) return false;

      const isExpired = b.status === 'expired' || b.expiry < now;

      // When showExpiredOnly is true, only show expired listings
      if (showExpiredOnly) {
        if (!isExpired) return false;
      } else {
        // By default, hide expired listings
        if (isExpired) return false;
      }

      // Favorites tab filter
      if (showFavoritesOnly) {
        if (!likedIds.has(b.id)) return false;
      }

      // For Sale tab filter (معروض للبيع دون مستندات)
      if (showForSaleOnly) {
        if (!b.forSaleItem?.isForSale) return false;
      }

      // Category filter
      if (selectedCategory !== 'الكل' && b.cat !== selectedCategory) {
        return false;
      }

      // Subcategory filter (تضييق البحث بالتصنيفات الفرعية)
      if (selectedSubCategory) {
        const matchesSub = (b.subCat && b.subCat.includes(selectedSubCategory)) ||
          b.bio.includes(selectedSubCategory) ||
          b.name.includes(selectedSubCategory) ||
          b.services?.some((s) => s.n.includes(selectedSubCategory));
        if (!matchesSub) return false;
      }

      // City filter
      if (selectedCity && b.city !== selectedCity) {
        return false;
      }

      // Deep search: name, cat, city, addr, bio, services, phones, and promotional keyword triggers
      if (query) {
        // Special keyword matching: free ads and 3 months free
        const isFreeKeywordSearch = query.includes('مجانا') || query.includes('مجاني') || query.includes('free');
        const isThreeMonthsSearch = query.includes('3 شهور') || query.includes('٣ شهور');
        const isTaxiKeywordSearch = query.includes('تاكسي') || query.includes('اجرة') || query.includes('أجرة') || query.includes('موتوسيكل') || query.includes('دليفري');
        const isClinicKeywordSearch = query.includes('عياد') || query.includes('مستشف') || query.includes('طبيب') || query.includes('دكتور');
        const isRealEstateSearch = query.includes('شقق') || query.includes('محلات') || query.includes('مولات') || query.includes('فلل') || query.includes('شاليهات') || query.includes('عقار');

        if (isFreeKeywordSearch && (b.pkg === 0 || b.expiry > now || b.bio?.includes('مجانا') || b.name?.includes('مجانا'))) {
          return true;
        }

        if (isThreeMonthsSearch && (b.expiry > now || b.bio?.includes('شهور') || b.name?.includes('شهور'))) {
          return true;
        }

        if (isTaxiKeywordSearch && (b.cat?.includes('تاكسي') || b.cat?.includes('أجرة') || b.cat?.includes('موتوسيكل') || b.trackingCell?.enabled)) {
          return true;
        }

        if (isClinicKeywordSearch && (b.cat?.includes('عيادات') || b.cat?.includes('أطباء') || b.bio?.includes('عياد') || b.bio?.includes('طبيب'))) {
          return true;
        }

        if (isRealEstateSearch && (b.cat?.includes('للبيع') || b.cat?.includes('عقارات') || b.forSaleItem?.isForSale || b.bio?.includes('شقق') || b.bio?.includes('محلات') || b.bio?.includes('فلل'))) {
          return true;
        }

        const servicesText = b.services?.map((s) => s.n).join(' ') || '';
        const phonesText = (b.phones || [b.phone]).join(' ');
        const fullText = `${b.name} ${b.cat} ${b.subCat || ''} ${b.city} ${b.addr} ${b.bio} ${servicesText} ${phonesText}`.toLowerCase();
        if (!fullText.includes(query)) return false;
      }

      return true;
    });

    // 2. Attach distance if user coords are present
    const withDistance = filtered.map((b) => {
      if (userCoords && b.lat && b.lng) {
        const d = calculateDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng);
        return { ...b, distanceKm: d };
      }
      return b;
    });

    // 3. Sort
    withDistance.sort((a, b) => {
      // Nearest to user location
      if (sortBy === 'nearest') {
        const distA = a.distanceKm !== undefined ? a.distanceKm : 99999;
        const distB = b.distanceKm !== undefined ? b.distanceKm : 99999;
        return distA - distB;
      }

      // Most Trusted (Verified & high tier packages first)
      if (sortBy === 'trusted') {
        if (b.verified !== a.verified) {
          return b.verified - a.verified;
        }
        return (b.pkg || 0) - (a.pkg || 0);
      }

      // Most Popular (Likes & engagement)
      if (sortBy === 'popular') {
        return (b.likes || 0) - (a.likes || 0);
      }

      // Default: Sponsored / Google Ads & VIP first, then newest
      if (a.isSponsored && !b.isSponsored) return -1;
      if (!a.isSponsored && b.isSponsored) return 1;
      if ((b.pkg || 0) !== (a.pkg || 0)) {
        return (b.pkg || 0) - (a.pkg || 0);
      }
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    return withDistance;
  }, [
    businesses,
    selectedCategory,
    selectedSubCategory,
    selectedCity,
    searchQuery,
    showExpiredOnly,
    showFavoritesOnly,
    showForSaleOnly,
    likedIds,
    userCoords,
    sortBy,
  ]);

  const forSaleCount = useMemo(() => {
    return businesses.filter((b) => b.forSaleItem?.isForSale).length;
  }, [businesses]);

  // Handlers
  const handleAddBusiness = (newBiz: Business) => {
    const updated = [newBiz, ...businesses];
    saveBusinesses(updated);
    showToast(
      lang === 'ar'
        ? '🎉 تم نشر نشاطك التجاري بنجاح لمدة 90 يوم مجاناً!'
        : '🎉 Business listing published with 90 days free!'
    );
  };

  const handleRenew = (bizId: number | string, pkg: PackageTier) => {
    const updated = businesses.map((b) => {
      if (b.id === bizId) {
        return {
          ...b,
          expiry: Date.now() + 90 * 86400000,
          status: 'active' as const,
          pkg: pkg,
          verified: pkg >= 399 ? 1 : b.verified,
          isSponsored: pkg === 799 ? true : b.isSponsored,
        };
      }
      return b;
    });

    saveBusinesses(updated);
    setIsRenewOpen(false);
    if (selectedBiz && selectedBiz.id === bizId) {
      setSelectedBiz(updated.find((x) => x.id === bizId) || null);
    }
    showToast(
      lang === 'ar'
        ? `✅ تم تجديد الاشتراك بنجاح لمدة 90 يوم إضافية!`
        : `✅ Subscription renewed successfully for 90 days!`
    );
  };

  const handleResetData = () => {
    if (
      window.confirm(
        lang === 'ar'
          ? 'هل تريد استعادة البيانات الافتراضية؟'
          : 'Restore default sample listings?'
      )
    ) {
      saveBusinesses(INITIAL_BUSINESSES);
      showToast(lang === 'ar' ? 'تمت استعادة البيانات' : 'Data reset to defaults');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-black text-white overflow-hidden relative select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[80] bg-neutral-900 border border-[#FF2D55] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-2xl shadow-[#FF2D55]/30 animate-bounce flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar: Floating Translucent TikTokHeader when in reels mode, or classic header when in grid mode */}
      {viewMode === 'reels' ? (
        <TikTokHeader
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setSelectedSubCategory('');
          }}
          selectedCity={selectedCity}
          onSelectCity={setSelectedCity}
          selectedSubCategory={selectedSubCategory}
          onSelectSubCategory={setSelectedSubCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSelectSortBy={setSortBy}
          viewMode={viewMode}
          onToggleView={() => setViewMode('grid')}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={() => setShowFavoritesOnly((prev) => !prev)}
          favoritesCount={likedIds.size}
          showForSaleOnly={showForSaleOnly}
          onToggleForSale={() => {
            setShowForSaleOnly((prev) => !prev);
            if (!showForSaleOnly) setShowFavoritesOnly(false);
          }}
          onDetectLocation={handleDetectLocation}
          hasUserLocation={userCoords !== null}
          isLocating={isLocating}
          currentCurrency={currentCurrency}
          onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
          lang={lang}
          onSelectLang={handleSelectLang}
          userPoints={userProfile.points}
          onOpenSettings={() => setIsSettingsFolderOpen(true)}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          onOpenCaptainRegister={() => setIsCaptainRegisterOpen(true)}
          onOpenMusicBank={() => {
            setActiveBankSoundtrack(undefined);
            setIsMusicBankOpen(true);
          }}
          onOpenNearbyDispatch={() => setIsNearbyDispatchOpen(true)}
          onOpenTransportTracking={() => handleOpenTransportTracking()}
          onOpenAppInstall={() => setIsAppInstallModalOpen(true)}
          onOpenSecurityNotice={() => setIsWarningModalOpen(true)}
          onOpenAdd={() => setIsAddOpen(true)}
          onOpenOfficialDomain={() => setIsOfficialDomainOpen(true)}
          onOpenDelivery={() => handleOpenDelivery()}
          onOpenOrderNowDirectory={() => setIsOrderNowDirectoryOpen(true)}
        />
      ) : (
        <>
          <Header
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            lang={lang}
            onSelectLang={handleSelectLang}
            currentCurrency={currentCurrency}
            onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
            onDetectLocation={handleDetectLocation}
            isLocating={isLocating}
            hasUserLocation={userCoords !== null}
            onOpenAdd={() => setIsAddOpen(true)}
            onOpenOfficialDomain={() => setIsOfficialDomainOpen(true)}
            onOpenDelivery={() => handleOpenDelivery()}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenSubscribersProgram={() => setIsSubscribersProgramOpen(true)}
            onOpenCaptainRegister={() => setIsCaptainRegisterOpen(true)}
            onOpenCustomerUpload={() => {
              setCustomerUploadTargetBiz(null);
              setIsCustomerUploadOpen(true);
            }}
            onOpenTransportTracking={() => handleOpenTransportTracking()}
            onOpenAppInstall={() => setIsAppInstallModalOpen(true)}
            onOpenSecurityNotice={() => setIsWarningModalOpen(true)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            viewMode={viewMode}
          />

          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedCity={selectedCity}
            sortBy={sortBy}
            onSelectSortBy={setSortBy}
            viewMode={viewMode}
            onToggleView={() => setViewMode('reels')}
            showExpiredOnly={showExpiredOnly}
            onToggleShowExpired={() => setShowExpiredOnly((prev) => !prev)}
            expiredCount={expiredCount}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavorites={() => setShowFavoritesOnly((prev) => !prev)}
            favoritesCount={likedIds.size}
            selectedSubCategory={selectedSubCategory}
            onSelectSubCategory={(sub) => setSelectedSubCategory(sub)}
            showForSaleOnly={showForSaleOnly}
            onToggleForSale={() => {
              setShowForSaleOnly((prev) => !prev);
              if (!showForSaleOnly) setShowFavoritesOnly(false);
            }}
            forSaleCount={forSaleCount}
            onOpenSubscribersProgram={() => setIsSubscribersProgramOpen(true)}
            onOpenCustomerUpload={() => {
              setCustomerUploadTargetBiz(null);
              setIsCustomerUploadOpen(true);
            }}
            onOpenTransportModal={() => handleOpenTransportTracking()}
            onDetectLocation={handleDetectLocation}
            lang={lang}
          />
        </>
      )}

      {/* Main Visual Display (100% Mobile & 100% Computer Full Screen) */}
      <main className="flex-1 relative overflow-hidden bg-black h-full w-full">
        {showFavoritesOnly && visibleBusinesses.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white space-y-4 max-w-md mx-auto" dir="rtl">
            <div className="w-16 h-16 rounded-full bg-[#FF2D55]/20 border border-[#FF2D55]/40 flex items-center justify-center text-[#FF2D55] animate-pulse">
              <Heart className="w-8 h-8 fill-[#FF2D55]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-lg text-white">قائمة الأماكن المفضلة فارغة حالياً</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                لم تقم بإضافة أي مكان إلى المفضلة بعد. اضغط على زر القلب ❤️ في أي ريل أو إعلان لحفظ أماكنك المختارة والوصول إليها هنا بنقرة واحدة!
              </p>
            </div>
            <button
              onClick={() => setShowFavoritesOnly(false)}
              className="bg-gradient-to-r from-[#FF2D55] to-rose-600 text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-lg shadow-[#FF2D55]/30 transition active:scale-95 cursor-pointer"
            >
              استكشف الأماكن والريلز الآن 🌟
            </button>
          </div>
        ) : viewMode === 'reels' ? (
          <ReelFeed
            businesses={visibleBusinesses}
            onOpenBiz={(b) => setSelectedBiz(b)}
            onOpenAdd={() => setIsAddOpen(true)}
            onOpenSettings={() => setIsSettingsFolderOpen(true)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            onToggleLike={toggleLike}
            likedIds={likedIds}
            currentCurrency={currentCurrency}
            lang={lang}
            onOpenCustomerUpload={(b) => {
              setCustomerUploadTargetBiz(b);
              setIsCustomerUploadOpen(true);
            }}
            onOpenCustomerPost={(post, b) => {
              setActiveCustomerPostPlayer({ post, business: b });
            }}
            onOpenBooking={(b) => setSelectedBookingBiz(b)}
            onOpenDelivery={(b) => handleOpenDelivery(b)}
            userFollowingIds={userProfile.followingIds}
            onToggleFollow={toggleFollowBusiness}
            onOpenDashboard={(b) => setSelectedDashboardBiz(b)}
            onOpenComments={(b) => setSelectedCommentsBiz(b)}
            onOpenShareActionSheet={(b) => setSelectedShareBiz(b)}
            onOpenOwnerLock={(b) => setOwnerLockTargetBiz(b)}
            onOpenPriceList={(b) => setPriceListTargetBiz(b)}
            onOpenMusicBank={(st) => {
              setActiveBankSoundtrack(st);
              setIsMusicBankOpen(true);
            }}
            onOpenTransportModal={(b) => handleOpenTransportTracking(b)}
            onRateBusiness={handleRateBusiness}
          />
        ) : (
          <GridFeed
            businesses={visibleBusinesses}
            onOpenBiz={(b) => setSelectedBiz(b)}
            currentCurrency={currentCurrency}
            lang={lang}
            onOpenOwnerLock={(b) => setOwnerLockTargetBiz(b)}
            onOpenPriceList={(b) => setPriceListTargetBiz(b)}
            onOpenTransportModal={(b) => handleOpenTransportTracking(b)}
          />
        )}
      </main>

      {/* Detailed Business Profile Sheet/Modal */}
      {selectedBiz && (
        <BusinessModal
          business={selectedBiz}
          onClose={() => setSelectedBiz(null)}
          onOpenRenew={() => {
            setRenewTarget(selectedBiz);
            setIsRenewOpen(true);
          }}
          onUpdateBusiness={(updatedBiz) => {
            const updated = businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b));
            saveBusinesses(updated);
            setSelectedBiz(updatedBiz);
          }}
          onOpenBooking={(b) => setSelectedBookingBiz(b)}
          onOpenDelivery={(b) => handleOpenDelivery(b)}
          onOpenOwnerLock={(b) => setOwnerLockTargetBiz(b)}
          onOpenOwnerEdit={(b) => setOwnerLockTargetBiz(b)}
          onOpenTransportTracking={(b) => handleOpenTransportTracking(b)}
          onOpenSecurityNotice={() => setIsWarningModalOpen(true)}
          isFollowed={userProfile.followingIds.includes(selectedBiz.id)}
          onToggleFollow={toggleFollowBusiness}
          currentCurrency={currentCurrency}
          lang={lang}
          onRateBusiness={handleRateBusiness}
        />
      )}

      {/* Instant Travel-style Booking Modal ("احجز الآن * اطلب الآن") */}
      {selectedBookingBiz && (
        <BookingModal
          business={selectedBookingBiz}
          onClose={() => setSelectedBookingBiz(null)}
          lang={lang}
          currency={currentCurrency}
          onBookingSuccess={(details) => {
            handleBookingSuccess(details);
            showToast(`🎉 تم تأكيد حجزك بنجاح بكود: ${details.ref}`);
          }}
        />
      )}

      {/* Subscriber Analytics & BI Dashboard Modal */}
      {selectedDashboardBiz && (
        <SubscriberDashboardModal
          business={selectedDashboardBiz}
          onClose={() => setSelectedDashboardBiz(null)}
          lang={lang}
          onUpdateBusiness={(updated) => {
            const newBizList = businesses.map((b) => (b.id === updated.id ? updated : b));
            saveBusinesses(newBizList);
            setSelectedDashboardBiz(updated);
          }}
          onOpenMusicBank={(st) => {
            setActiveBankSoundtrack(st);
            setIsMusicBankOpen(true);
          }}
          onOpenDelivery={(b) => handleOpenDelivery(b)}
        />
      )}

      {/* Interactive Comments Modal */}
      {selectedCommentsBiz && (
        <CommentsModal
          business={selectedCommentsBiz}
          onClose={() => setSelectedCommentsBiz(null)}
          onAddComment={(commentText, authorName) => {
            const newComment = {
              id: `cm-${Date.now()}`,
              userName: authorName,
              comment: commentText,
              createdAt: Date.now(),
              status: 'approved' as const,
            };
            const updated = businesses.map((b) => {
              if (b.id === selectedCommentsBiz.id) {
                const existing = b.comments || [];
                return { ...b, comments: [newComment, ...existing] };
              }
              return b;
            });
            saveBusinesses(updated);
            showToast('✨ تم إرسال تعليقك واستفسارك بنجاح ويظهر فوراً');
          }}
        />
      )}

      {/* Share Action Sheet */}
      {selectedShareBiz && (
        <ShareActionSheet
          business={selectedShareBiz}
          onClose={() => setSelectedShareBiz(null)}
          onShareCompleted={() => {
            const updated = businesses.map((b) => {
              if (b.id === selectedShareBiz.id) {
                return { ...b, sharesCount: (b.sharesCount || 0) + 1 };
              }
              return b;
            });
            saveBusinesses(updated);
            showToast('🚀 شكراً لمشاركة الفيديو مع أصدقائك!');
          }}
        />
      )}

      {/* Currency & Exchange Rate Calculator Modal */}
      {isCurrencyModalOpen && (
        <CurrencyModal
          currentCurrency={currentCurrency}
          onSelectCurrency={handleSelectCurrency}
          onClose={() => setIsCurrencyModalOpen(false)}
          lang={lang}
        />
      )}

      {/* Add New Business Modal (Voice 🎤 + Map 📍 + Multiple Phones + CSV) */}
      {isAddOpen && (
        <AddBusinessModal
          onClose={() => setIsAddOpen(false)}
          onAddBusiness={handleAddBusiness}
          existingBusinesses={businesses}
          lang={lang}
        />
      )}

      {/* Official Domain & Platform Link Modal (الرابط النهائي بالدومين الرسمي) */}
      {isOfficialDomainOpen && (
        <OfficialDomainModal
          onClose={() => setIsOfficialDomainOpen(false)}
          lang={lang}
          businessId={selectedBiz?.id}
          businessName={selectedBiz?.name}
        />
      )}

      {/* Subscribers Program & Pricing Guide Modal (3 Months Free) */}
      {isSubscribersProgramOpen && (
        <SubscribersProgramModal
          onClose={() => setIsSubscribersProgramOpen(false)}
          onOpenAdd={() => {
            setIsSubscribersProgramOpen(false);
            setIsAddOpen(true);
          }}
          onOpenSubscribe={() => {
            setIsSubscribersProgramOpen(false);
            setRenewTarget(selectedBiz || businesses[0] || null);
            setIsRenewOpen(true);
          }}
          onOpenCaptainRegister={() => {
            setIsSubscribersProgramOpen(false);
            setIsCaptainRegisterOpen(true);
          }}
          lang={lang}
        />
      )}

      {/* Renewal Tier Modal (Vodafone Cash / InstaPay 01006656669) */}
      {isRenewOpen && (
        <RenewModal
          business={renewTarget || selectedBiz}
          onClose={() => setIsRenewOpen(false)}
          onRenew={handleRenew}
          lang={lang}
        />
      )}

      {/* Admin Dashboard Modal (Protected by Secret PIN - Remains in Arabic) */}
      {isAdminOpen && (
        <AdminModal
          businesses={businesses}
          onClose={() => setIsAdminOpen(false)}
          onUpdateBusiness={saveBusinesses}
          onResetData={handleResetData}
          lang="ar"
          onOpenAssistantPortal={() => {
            setIsAdminOpen(false);
            setIsAssistantPortalOpen(true);
          }}
          onOpenThreePagesHub={() => {
            setIsAdminOpen(false);
            setThreePagesHubTab('page1_users_admin');
            setIsThreePagesHubOpen(true);
          }}
        />
      )}

      {/* 3 Connected Yet Strictly Isolated Pages Modal (1. Users & Admin, 2. Customers, 3. Subscribers + Public Ads & Tracking) */}
      <ThreeConnectedPagesModal
        isOpen={isThreePagesHubOpen}
        onClose={() => setIsThreePagesHubOpen(false)}
        initialTab={threePagesHubTab}
        businesses={businesses}
        onUpdateBusinesses={saveBusinesses}
        userProfile={userProfile}
        onUpdateUserProfile={handleUpdateUser}
        orders={deliveryOrders}
        onPlaceOrder={handlePlaceDeliveryOrder}
        onUpdateOrders={handleUpdateDeliveryOrders}
        bookings={userBookings}
        onAddBooking={(bk) => {
          handleBookingSuccess(bk);
          showToast(`🎉 تم تأكيد الحجز وإرساله لصفحة المشترك فوراً (${bk.ref})`);
        }}
        onOpenBusiness={(b) => {
          setIsThreePagesHubOpen(false);
          setSelectedBiz(b);
        }}
        onOpenLiveTracking={(b) => {
          setIsThreePagesHubOpen(false);
          handleOpenTransportTracking(b);
        }}
        onOpenSubscriberEditor={(b) => {
          setIsThreePagesHubOpen(false);
          setOwnerEditBiz(b);
        }}
        onOpenAdminDashboard={() => {
          setIsThreePagesHubOpen(false);
          setIsAdminOpen(true);
        }}
        onOpenAssistantPortal={() => {
          setIsThreePagesHubOpen(false);
          setIsAssistantPortalOpen(true);
        }}
        onShowToast={showToast}
      />

      {/* Assistant & Staff Portal Modal (4 Assistants + Manager) */}
      <AssistantStaffPortalModal
        isOpen={isAssistantPortalOpen}
        onClose={() => setIsAssistantPortalOpen(false)}
        businesses={businesses}
        onUpdateBusinesses={saveBusinesses}
        onShowToast={showToast}
      />

      {/* Customer Upload Modal (Photos & Videos with Moving Animated Text) */}
      {isCustomerUploadOpen && (
        <AddCustomerMediaModal
          business={customerUploadTargetBiz}
          businesses={businesses}
          onClose={() => {
            setIsCustomerUploadOpen(false);
            setCustomerUploadTargetBiz(null);
          }}
          onAddPost={handleAddCustomerPost}
          lang={lang}
        />
      )}

      {/* Customer Post Player Modal (Full screen with moving animated text) */}
      {activeCustomerPostPlayer && (
        <CustomerPostPlayerModal
          post={activeCustomerPostPlayer.post}
          business={activeCustomerPostPlayer.business}
          onClose={() => setActiveCustomerPostPlayer(null)}
          onLike={(id) => {
            const updated = businesses.map((b) => {
              if (!b.customerPosts) return b;
              return {
                ...b,
                customerPosts: b.customerPosts.map((p) =>
                  p.id === id ? { ...p, likes: (p.likes || 1) + 1 } : p
                ),
              };
            });
            saveBusinesses(updated);
          }}
          lang={lang}
        />
      )}

      {/* Free Follower & Visitor TikTok Profile Modal */}
      {isUserProfileOpen && (
        <UserProfileModal
          user={userProfile}
          onUpdateUser={handleUpdateUser}
          businesses={businesses}
          orders={deliveryOrders}
          likedBizIds={likedIds}
          userBookings={userBookings}
          onOpenBookingsModal={() => setIsBookingsModalOpen(true)}
          onClose={() => setIsUserProfileOpen(false)}
          onOpenBiz={(b) => setSelectedBiz(b)}
          onOpenDeliveryForBiz={(b) => handleOpenDelivery(b)}
          onOpenOrderTracker={(ord) => handleOpenOrderTracker(ord)}
          onToggleFollow={toggleFollowBusiness}
          lang={lang}
        />
      )}

      {/* Business Direct Delivery Modal (برنامج: اطلب الأقرب ليك - جمع طلبك دليفري خاص) */}
      {isDeliveryOpen && (
        <BusinessDirectDeliveryModal
          business={
            deliveryTargetBiz ||
            businesses.find((b) => b.hasDelivery || b.deliveryInfo?.available) ||
            businesses[0]
          }
          businesses={businesses}
          onSelectBusiness={(b) => setDeliveryTargetBiz(b)}
          onClose={() => {
            setIsDeliveryOpen(false);
            setDeliveryTargetBiz(null);
          }}
          onUpdateBusiness={(updated) => {
            const next = businesses.map((b) => (b.id === updated.id ? updated : b));
            saveBusinesses(next);
            setDeliveryTargetBiz(updated);
          }}
          userCoords={userCoords}
          lang={lang}
        />
      )}

      {/* Quick 3-Month Free Onboarding for Any Unlisted Business + WhatsApp Welcome Message */}
      {isQuickRegisterOpen && (
        <QuickRegisterUnlistedModal
          userCoords={userCoords}
          onClose={() => setIsQuickRegisterOpen(false)}
          onRegisterBusiness={handleRegisterUnlistedBusiness}
          lang={lang}
        />
      )}

      {/* Owner Security PIN & OTP Verification Modal */}
      {ownerLockTargetBiz && (
        <OwnerLockModal
          business={ownerLockTargetBiz}
          onClose={() => setOwnerLockTargetBiz(null)}
          onOpenEditor={(biz) => {
            setOwnerLockTargetBiz(null);
            setOwnerEditBiz(biz);
          }}
          onUpdateBusiness={(updated) => {
            const newBizList = businesses.map((b) => (b.id === updated.id ? updated : b));
            saveBusinesses(newBizList);
            if (selectedBiz?.id === updated.id) setSelectedBiz(updated);
          }}
          lang={lang}
        />
      )}

      {/* Subscriber Dedicated Page Editor (Owner Mode - His page ONLY) */}
      {ownerEditBiz && (
        <AdminEditSubscriberModal
          business={ownerEditBiz}
          onClose={() => setOwnerEditBiz(null)}
          onSave={(updated) => {
            const newBizList = businesses.map((b) => (b.id === updated.id ? updated : b));
            saveBusinesses(newBizList);
            if (selectedBiz?.id === updated.id) setSelectedBiz(updated);
            setOwnerEditBiz(null);
          }}
          lang={lang}
          mode="owner"
        />
      )}

      {/* User Bookings Modal (حجوزاتي الفندقية والسياحية المرتبطة بكل مشترك) */}
      {isBookingsModalOpen && (
        <UserBookingsModal
          bookings={userBookings}
          businesses={businesses}
          onOpenBusiness={(bizId) => {
            const found = businesses.find((b) => String(b.id) === String(bizId));
            if (found) {
              setIsBookingsModalOpen(false);
              setSelectedBiz(found);
            }
          }}
          onDeleteBooking={handleDeleteBooking}
          onClose={() => setIsBookingsModalOpen(false)}
        />
      )}

      {/* Business Price List & Quick Menu Modal (علامة زائد في منتصف أسفل صورة الإعلان) */}
      {priceListTargetBiz && (
        <BusinessPriceListModal
          business={priceListTargetBiz}
          onClose={() => setPriceListTargetBiz(null)}
          onOpenDeliveryOrder={(biz) => {
            handleOpenDelivery(biz);
          }}
          currentCurrency={currentCurrency}
          lang={lang}
          onUpdateServices={(updatedServices) => {
            const updatedBiz = { ...priceListTargetBiz, services: updatedServices };
            const newBizList = businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b));
            saveBusinesses(newBizList);
            setPriceListTargetBiz(updatedBiz);
          }}
        />
      )}

      {/* Driver & Transport Captain Subscription Modal (تاكسي ودليفري مشترك رسمي 100%) */}
      {isCaptainRegisterOpen && (
        <DeliveryCaptainRegisterModal
          onClose={() => setIsCaptainRegisterOpen(false)}
          onSuccess={(createdBiz) => {
            const updated = [createdBiz, ...businesses];
            saveBusinesses(updated);
            setSelectedBiz(createdBiz);
            setUserProfile((prev) => {
              const next = { ...prev, points: prev.points + 200 };
              try {
                localStorage.setItem(USER_KEY, JSON.stringify(next));
              } catch {}
              return next;
            });
            showToast(`🎉 مرحباً ${createdBiz.name}! تم تفعيل اشتراكك كـ مشترك رسمي (تتبع GPS، صفحة خاصة، أرباحك 100%) بنجاح 🚀`);
          }}
          lang={lang}
        />
      )}

      {/* Official Security Warning & Legal Notice Modal */}
      <SecurityWarningNoticeModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        lang={lang}
      />

      {/* Live Direct WhatsApp & Messaging Modal */}
      {isChatsModalOpen && (
        <ChatsModal
          onClose={() => setIsChatsModalOpen(false)}
          businesses={businesses}
          onOpenBiz={(b) => setSelectedBiz(b)}
        />
      )}

      {/* Unified Settings Folder Modal (حافظة الإعدادات 3 نقط الشاملة لكل الأزرار) */}
      <SettingsFolderModal
        isOpen={isSettingsFolderOpen}
        onClose={() => setIsSettingsFolderOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedSubCategory('');
        }}
        selectedSubCategory={selectedSubCategory}
        onSelectSubCategory={setSelectedSubCategory}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        sortBy={sortBy}
        onSelectSortBy={setSortBy}
        viewMode={viewMode}
        onToggleView={() => setViewMode(viewMode === 'reels' ? 'grid' : 'reels')}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly((prev) => !prev)}
        favoritesCount={likedIds.size}
        showForSaleOnly={showForSaleOnly}
        onToggleForSale={() => {
          setShowForSaleOnly((prev) => !prev);
          if (!showForSaleOnly) setShowFavoritesOnly(false);
        }}
        forSaleCount={forSaleCount}
        onDetectLocation={handleDetectLocation}
        hasUserLocation={userCoords !== null}
        isLocating={isLocating}
        onOpenAdd={() => setIsAddOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAssistantPortal={() => setIsAssistantPortalOpen(true)}
        onOpenThreePagesHub={(tab) => {
          setThreePagesHubTab(tab || 'page1_users_admin');
          setIsThreePagesHubOpen(true);
        }}
        onOpenOrderNowDirectory={() => setIsOrderNowDirectoryOpen(true)}
        onOpenNearbyDispatch={() => setIsNearbyDispatchOpen(true)}
        onOpenOfficialDomain={() => setIsOfficialDomainOpen(true)}
        onOpenCustomerUpload={() => {
          setCustomerUploadTargetBiz(null);
          setIsCustomerUploadOpen(true);
        }}
        onOpenChats={() => setIsChatsModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onOpenSubscribersProgram={() => setIsSubscribersProgramOpen(true)}
        onOpenDelivery={() => handleOpenDelivery()}
        onOpenCaptainRegister={() => setIsCaptainRegisterOpen(true)}
        onOpenTransportModal={() => handleOpenTransportTracking()}
        onOpenAppInstall={() => setIsAppInstallModalOpen(true)}
        onOpenSecurityNotice={() => setIsWarningModalOpen(true)}
        onOpenQuickRegister={() => setIsQuickRegisterOpen(true)}
        onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
        onOpenBookings={() => setIsBookingsModalOpen(true)}
        bookingsCount={userBookings.length}
        onOpenMusicBank={() => {
          setActiveBankSoundtrack(undefined);
          setIsMusicBankOpen(true);
        }}
        currentCurrency={currentCurrency}
        lang={lang}
        onSelectLang={handleSelectLang}
        onResetData={handleResetData}
      />

      {/* Live Taxi, Motorcycle, Limousine & Heavy Transport GPS Tracking Modal (خلية التتبع وتحديد المكان) */}
      {isTransportModalOpen && (
        <LiveTaxiTransportTrackingModal
          isOpen={isTransportModalOpen}
          onClose={() => {
            setIsTransportModalOpen(false);
            setTransportTargetBiz(null);
          }}
          targetBusiness={transportTargetBiz}
          userCoords={userCoords}
          onDetectLocation={handleDetectLocation}
          lang={lang}
        />
      )}

      {/* Proximity Calling & Dispatch Modal (الاتصال بالقرب على المشاركين من موقعهم - قبول أو رفض) */}
      {isNearbyDispatchOpen && (
        <NearbyQuickDispatchModal
          isOpen={isNearbyDispatchOpen}
          onClose={() => setIsNearbyDispatchOpen(false)}
          businesses={businesses}
          userCoords={userCoords}
          onDetectLocation={handleDetectLocation}
          onOpenLiveTracking={(biz) => {
            setIsNearbyDispatchOpen(false);
            if (biz) setTransportTargetBiz(biz);
            setIsTransportModalOpen(true);
          }}
          lang={lang}
        />
      )}

      {/* Mobile, iPad, Google Play & PWA App Installation Modal (البرنامج يعمل على كل الأجهزة والآيباد وجاهز للتحميل) */}
      <AppInstallModal
        isOpen={isAppInstallModalOpen}
        onClose={() => setIsAppInstallModalOpen(false)}
        lang={lang}
      />

      {/* Music & Audio Bank Modal (بنك الأغاني والموسيقى وتحميل الصوتيات MP3) */}
      {isMusicBankOpen && (
        <MusicBankModal
          currentSoundtrack={activeBankSoundtrack}
          onSelectSoundtrack={(st) => {
            setActiveBankSoundtrack(st);
            if (selectedBiz) {
              const updatedBiz = { ...selectedBiz, soundtrack: st };
              const newBizList = businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b));
              saveBusinesses(newBizList);
              setSelectedBiz(updatedBiz);
            }
          }}
          onRemoveSoundtrack={() => {
            setActiveBankSoundtrack(undefined);
            if (selectedBiz) {
              const updatedBiz = { ...selectedBiz, soundtrack: undefined };
              const newBizList = businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b));
              saveBusinesses(newBizList);
              setSelectedBiz(updatedBiz);
            }
          }}
          onClose={() => setIsMusicBankOpen(false)}
          lang={lang}
          isAdmin={isAdminOpen}
        />
      )}

      {/* Order Now Directory Modal - دليل الأنشطة والأوامر الشامل بدون تكرار أزرار أضف إعلانك */}
      <OrderNowDirectoryModal
        isOpen={isOrderNowDirectoryOpen}
        onClose={() => setIsOrderNowDirectoryOpen(false)}
        businesses={businesses}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedSubCategory('');
          setIsOrderNowDirectoryOpen(false);
        }}
        onDetectLocation={handleDetectLocation}
        hasUserLocation={userCoords !== null}
        isLocating={isLocating}
        onOpenAdd={() => {
          setIsOrderNowDirectoryOpen(false);
          setIsAddOpen(true);
        }}
        onOpenSubscribersProgram={() => {
          setIsOrderNowDirectoryOpen(false);
          setIsSubscribersProgramOpen(true);
        }}
        onOpenDelivery={() => {
          setIsOrderNowDirectoryOpen(false);
          handleOpenDelivery();
        }}
        onOpenTransportTracking={() => {
          setIsOrderNowDirectoryOpen(false);
          handleOpenTransportTracking();
        }}
        onOpenNearbyDispatch={() => {
          setIsOrderNowDirectoryOpen(false);
          setIsNearbyDispatchOpen(true);
        }}
        onOpenOfficialDomain={() => {
          setIsOrderNowDirectoryOpen(false);
          setIsOfficialDomainOpen(true);
        }}
        onOpenMusicBank={() => {
          setIsOrderNowDirectoryOpen(false);
          setActiveBankSoundtrack(undefined);
          setIsMusicBankOpen(true);
        }}
        onOpenAppInstall={() => {
          setIsOrderNowDirectoryOpen(false);
          setIsAppInstallModalOpen(true);
        }}
        onOpenSecurityNotice={() => {
          setIsOrderNowDirectoryOpen(false);
          setIsWarningModalOpen(true);
        }}
        onOpenCurrencyModal={() => {
          setIsOrderNowDirectoryOpen(false);
          setIsCurrencyModalOpen(true);
        }}
        onOpenBookingModal={(biz) => {
          setIsOrderNowDirectoryOpen(false);
          setSelectedBookingBiz(biz);
        }}
        lang={lang}
      />

      {/* Pinned Bottom Navigation Bar (Only in Grid Mode so Reels Mode is 100% Full Screen with bottom-center Subscribe Now + button) */}
      {viewMode === 'grid' && (
        <BottomNav
          activeTab={activeBottomTab}
          onSelectTab={(tab) => {
            setActiveBottomTab(tab);
            if (tab === 'home') {
              setViewMode('reels');
              setSelectedCategory('الكل');
              setSelectedCity('');
              setShowFavoritesOnly(false);
              setShowExpiredOnly(false);
            } else if (tab === 'nearest') {
              handleDetectLocation();
              setSortBy('nearest');
            } else if (tab === 'favorites') {
              setShowFavoritesOnly(true);
              setShowForSaleOnly(false);
            } else if (tab === 'chats') {
              setIsChatsModalOpen(true);
            } else if (tab === 'settings') {
              setIsSettingsFolderOpen(true);
            } else if (tab === 'profile') {
              if (businesses.length > 0) setSelectedDashboardBiz(businesses[0]);
            }
          }}
          onOpenSettings={() => setIsSettingsFolderOpen(true)}
          lang={lang}
          favoritesCount={likedIds.size}
        />
      )}
    </div>
  );
}
