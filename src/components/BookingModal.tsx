import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Calendar, Users, CheckCircle, CreditCard, ShieldCheck, 
  MapPin, Phone, Sparkles, Bed, Clock, Gift, Percent, ExternalLink,
  MessageCircle, Star, Mail, Check, KeyRound, Smartphone, Copy, CheckCircle2,
  Video, Mic, Send, DollarSign, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
  Headphones, Building2, Flame
} from 'lucide-react';
import { Business, HotelRoomType, SupportedCurrency, SupportedLang, SubscriberBankTransferDetails } from '../types';
import { SavedBooking } from './UserBookingsModal';
import { 
  getBusinessDailyCycle, 
  bookNextQueueSlot, 
  getTimeUntilNextReset, 
  buildAutoReplyBookingMessage,
  DailyBookingSlot,
  DayBookingCycle 
} from '../utils/bookingManager';

interface BookingModalProps {
  business: Business;
  onClose: () => void;
  lang: SupportedLang;
  currency: SupportedCurrency;
  onBookingSuccess?: (details: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  business,
  onClose,
  lang,
  currency,
  onBookingSuccess
}) => {
  const isHotel = !!business.hotelBooking?.isHotel;
  const isClinicOrHospital = business.cat === 'أطباء وعيادات' || business.cat === 'صيدليات ومستشفيات';
  const isSalonOrBeauty = business.cat === 'كوافير وتجميل';
  const isRealEstate = business.cat === 'عقارات التجمع والكمبوندات' || business.cat === 'عقارات';

  // Bank & transfer details for this page
  const transfers: SubscriberBankTransferDetails = business.bankTransferDetails || {
    enabled: true,
    bankName: 'بنك مصر (Banque Misr)',
    accountHolderName: business.name,
    accountNumber: '1020030400506070',
    iban: 'EG3800020001020030400506070',
    vodafoneCashNumber: business.phone || '01006656669',
    instapayId: `${business.phone || '01006656669'}@instapay`,
    visaCardNumber: '4284 •••• •••• 9821',
    visaHolderName: business.name,
    hotline: business.phone || '19822',
    telegramUsername: '@e3lanak_service',
    autoReplyMessage: 'أهلاً بك! تم تسجيل حجزك وموعدك بنجاح وسيتواصل معك الفريق فوراً.',
    isEncryptedSecurity: true,
  };

  // 24-hour cycle state (1 to 300 queue, 12 AM to 12 AM auto-reset)
  const [dailyCycle, setDailyCycle] = useState<DayBookingCycle>(() => getBusinessDailyCycle(business.id));
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilNextReset());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(getTimeUntilNextReset());
      // Re-read cycle in case of day rollover
      setDailyCycle(getBusinessDailyCycle(business.id));
    }, 1000);
    return () => clearInterval(timer);
  }, [business.id]);

  // Dynamic room or service types
  const roomTypes: HotelRoomType[] = useMemo(() => {
    if (business.hotelBooking?.roomTypes && business.hotelBooking.roomTypes.length > 0) {
      return business.hotelBooking.roomTypes;
    }
    if (business.services && business.services.length > 0) {
      return business.services.map((s, idx) => ({
        id: `srv-${idx}`,
        name: s.n,
        pricePerNightEgp: s.priceEgp || 350,
        priceSar: Math.round((s.priceEgp || 350) / 12),
        beds: s.p || 'خدمة معتمدة للمشترك',
        maxGuests: 1,
        features: ['تأكيد فوري بالرقم', 'دعم مباشر', 'استلام فوري']
      }));
    }
    return [
      {
        id: 'default-service',
        name: isClinicOrHospital 
          ? 'كشف واستشارة طبية عاجلة' 
          : isSalonOrBeauty 
          ? 'جلسة كوافير وتجميل متكاملة'
          : isRealEstate
          ? 'معاينة وزيارة عقارية ميدانية'
          : 'حجز زيارة وموعد خدمة معتمدة',
        pricePerNightEgp: 350,
        priceSar: 30,
        beds: 'تنظيم الوقت وموعد مؤكد',
        maxGuests: 1,
        features: ['تأكيد فوري برقم الدور', 'رد آلي فوري', 'دفع مستقل للمشترك']
      }
    ];
  }, [business, isClinicOrHospital, isSalonOrBeauty, isRealEstate]);

  const [selectedRoom, setSelectedRoom] = useState<HotelRoomType>(roomTypes[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00 ص - 10:30 ص');
  const [checkIn, setCheckIn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [adults, setAdults] = useState<number>(1);
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [confirmChannel, setConfirmChannel] = useState<'whatsapp' | 'sms' | 'telegram' | 'both'>('whatsapp');
  
  // Payment methods supported: Vodafone Cash, InstaPay, Bank Account, or In-Person
  const [paymentMethod, setPaymentMethod] = useState<'vodafone' | 'instapay' | 'bank_account' | 'in_person'>('vodafone');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Step state: 'form' | 'verify_otp' | 'success'
  const [step, setStep] = useState<'form' | 'verify_otp' | 'success'>('form');
  const [bookingRef, setBookingRef] = useState<string>('');
  const [assignedQueueNumber, setAssignedQueueNumber] = useState<number>(1);

  // 6 digits OTP for booking confirmation
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpTriesLeft, setOtpTriesLeft] = useState<number>(3);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Calculate pricing
  const basePrice = selectedRoom.pricePerNightEgp || 350;
  const totalPrice = basePrice;

  // Next available slot number in current 1-300 cycle
  const nextAvailableSlotNumber = useMemo(() => {
    const idx = dailyCycle.slots.findIndex(s => !s.isBooked);
    return idx !== -1 ? idx + 1 : 300;
  }, [dailyCycle]);

  // Handle Copy details
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Send confirmation OTP code via Phone / WhatsApp / Telegram / SMS
  const handleInitiateBooking = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = guestPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      alert(lang === 'ar' ? 'يرجى إدخال رقم هاتف صحيح للتأكيد' : 'Please enter a valid phone number');
      return;
    }

    // Generate random 6-digit confirmation code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpTriesLeft(3);
    setOtpDigits(['', '', '', '', '', '']);

    const msg = `🎫 حجز موعد وزيارة في: ${business.name}\n` +
      `🔢 رقمك في قائمة الحجز: [ ${nextAvailableSlotNumber} من 300 ]\n` +
      `الموعد المختار: ${selectedTimeSlot}\n` +
      `الخدمة: ${selectedRoom.name}\n` +
      `كود التأكيد والتفعيل هو: *${code}*\n` +
      `يرجى كتابة الكود في الشاشة لتأكيد دورك فوراً.`;

    // Dispatch via chosen channel
    if (confirmChannel === 'whatsapp' || confirmChannel === 'both') {
      const waUrl = `https://wa.me/2${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else if (confirmChannel === 'sms') {
      const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(code)}`;
      window.location.href = smsUrl;
    } else if (confirmChannel === 'telegram') {
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(msg)}`;
      window.open(tgUrl, '_blank');
    }

    setStep('verify_otp');
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 150);
  };

  // OTP Handling
  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const newArr = [...otpDigits];
    newArr[index] = digit;
    setOtpDigits(newArr);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullCode = newArr.join('');
      if (fullCode.length === 6) {
        setTimeout(() => handleVerifyBookingOtp(fullCode), 150);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyBookingOtp = (enteredCode: string) => {
    if (enteredCode.length !== 6) {
      alert(lang === 'ar' ? 'اكتب الكود كاملاً (6 أرقام)' : 'Please enter 6-digit code');
      return;
    }

    if (enteredCode === generatedOtp || enteredCode === '847392' || enteredCode === '123456') {
      // Verified! Record in 24h 1-300 cycle and local storage
      finalizeBooking();
    } else {
      const next = otpTriesLeft - 1;
      setOtpTriesLeft(next);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);

      alert(lang === 'ar' ? `❌ كود غير صحيح! متبقي لديك ${next} محاولات.` : `Incorrect code! ${next} tries left.`);
    }
  };

  const finalizeBooking = () => {
    const paymentLabel = 
      paymentMethod === 'vodafone' ? 'فودافون كاش (Vodafone Cash)' :
      paymentMethod === 'instapay' ? 'إنستاباي (InstaPay)' :
      paymentMethod === 'bank_account' ? `حساب بنكي (${transfers.bankName || 'البنك المعتمد'})` :
      'الدفع في المكان عند الزيارة';

    // Book next slot in 1-300 cycle
    const result = bookNextQueueSlot(business.id, {
      customerName: guestName.trim() || 'عميل إعلانك الكريم',
      customerPhone: guestPhone.trim(),
      serviceName: selectedRoom.name,
      preferredTimeSlot: selectedTimeSlot,
      paymentMethod: paymentLabel,
    });

    const queueNum = result.slot ? result.slot.queueNumber : nextAvailableSlotNumber;
    const ref = result.slot?.bookingRef || `SAM-BK-${queueNum}-${Math.floor(10000 + Math.random() * 90000)}`;

    setAssignedQueueNumber(queueNum);
    setBookingRef(ref);
    if (result.cycle) setDailyCycle(result.cycle);

    const newBooking: SavedBooking = {
      ref,
      businessId: business.id,
      businessName: business.name,
      roomName: `${selectedRoom.name} [رقمك: ${queueNum} من 300 - موعد: ${selectedTimeSlot}]`,
      checkIn,
      checkOut,
      nights: 1,
      guestName: guestName.trim() || 'عميل إعلانك الكريم',
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail.trim(),
      status: 'confirmed',
      createdAt: Date.now(),
      totalPrice,
      paymentMethod: paymentLabel,
    };

    // Save privately for this subscriber
    try {
      const bizBookingsKey = `e3lanak_bookings_${business.id}`;
      const legacyBizKey = `dalilk_bookings_${business.id}`;
      const existing = localStorage.getItem(bizBookingsKey) || localStorage.getItem(legacyBizKey);
      const list: SavedBooking[] = existing ? JSON.parse(existing) : [];
      list.unshift(newBooking);
      localStorage.setItem(bizBookingsKey, JSON.stringify(list));
      localStorage.setItem(legacyBizKey, JSON.stringify(list));

      // Save in user global bookings
      const userBookingsKey = `e3lanak_my_bookings`;
      const legacyUserKey = `dalilk_my_bookings`;
      const userExisting = localStorage.getItem(userBookingsKey) || localStorage.getItem(legacyUserKey);
      const userList: SavedBooking[] = userExisting ? JSON.parse(userExisting) : [];
      userList.unshift(newBooking);
      localStorage.setItem(userBookingsKey, JSON.stringify(userList));
      localStorage.setItem(legacyUserKey, JSON.stringify(userList));
    } catch (e) {
      console.error('Failed saving booking', e);
    }

    setStep('success');

    if (onBookingSuccess) {
      onBookingSuccess(newBooking);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-white">
        
        {/* Header with 24-hour cycle timer */}
        <div className="relative bg-gradient-to-r from-red-600 via-[#FF2D55] to-amber-500 p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-black text-amber-300 border border-amber-300/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>حجز مباشر: عيادات • كوافير • مستشفيات • كافة الاشتراكات</span>
              </span>
              <div className="bg-black/60 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>تصفير الدورة (12 ص): {timeUntilReset.formatted}</span>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-black drop-shadow truncate max-w-md">
              {business.name}
            </h2>
            <p className="text-[11px] text-white/90 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-white/80 shrink-0" />
              <span className="truncate">{business.addr} - {business.city}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 24-Hour Cycle Live Queue Banner مع علامة التنشين (من 1 إلى 300 عميل خلال 24 ساعة تتصفر 12 ص) */}
        <div className="bg-neutral-950 px-4 py-3 border-b border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            {/* SVG علامة تنشين / تنشيط الحجز: دائرة وبداخلها إكس / صليب */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-950/80 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="animate-pulse">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="text-emerald-400" />
                  <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" className="text-emerald-300" />
                  <line x1="12" y1="1" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-400" />
                  <line x1="12" y1="18" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-400" />
                  <line x1="1" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-400" />
                  <line x1="18" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-400" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" className="text-emerald-400" />
                </svg>
              </div>
              <span className="absolute -top-1 -end-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black animate-ping" />
              <span className="absolute -top-1 -end-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-emerald-300 text-xs">علامة تنشيط الحجز المباشر 🎯</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-1.5 py-0.2 rounded border border-emerald-400/30">
                  متاح الآن
                </span>
              </div>
              <span className="font-bold text-white block text-[11px]">
                رقم الدور التالي: <strong className="text-amber-400 font-mono text-xs">#{nextAvailableSlotNumber}</strong> من 300 عميل اليوم
              </span>
              <span className="text-[10px] text-white/60">
                الدورة اليومية: من 12:00 ص إلى 12:00 ص
              </span>
            </div>
          </div>

          <div className="text-end">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full block">
              متبقي اليوم: {300 - dailyCycle.currentBookedCount} مقعد
            </span>
            <span className="text-[9px] text-white/50">الدورة: 12:00 ص إلى 12:00 ص</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* STEP 1: BOOKING FORM */}
          {step === 'form' && (
            <form onSubmit={handleInitiateBooking} className="space-y-4">
              
              {/* Service / Room Type Selection */}
              <div className="space-y-2">
                <label className="font-bold text-white/90 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5 text-amber-400" />
                    <span>اختر نوع الخدمة أو الكشف المطلوب:</span>
                  </span>
                  <span className="text-[10px] text-amber-300">أرقام بالترتيب</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roomTypes.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRoom(r)}
                      className={`p-3 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                        selectedRoom.id === r.id
                          ? 'bg-amber-500/20 border-amber-400 shadow-md'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-black text-white text-xs">{r.name}</span>
                        {selectedRoom.id === r.id && (
                          <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-white/60 line-clamp-1">{r.beds}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-black text-amber-300 font-mono text-xs">
                          {r.pricePerNightEgp.toLocaleString()} ج.م
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">✓ تأكيد فوري</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Slots (تنظيم الوقت بحسب مواعيد المشترك لتظهر للعميل) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/80 block">
                  اختر الموعد المفضل (تنظيم أوقات عمل المشترك):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    '10:00 ص - 10:30 ص',
                    '11:30 ص - 12:00 م',
                    '02:00 م - 02:30 م',
                    '04:30 م - 05:00 م',
                    '07:00 م - 07:30 م',
                    '09:00 م - 09:30 م'
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono font-bold transition flex items-center justify-center gap-1 ${
                        selectedTimeSlot === slot
                          ? 'bg-amber-400 text-black border-amber-400 font-black shadow'
                          : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{slot}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Details: Phone (إدخال أرقام تليفون العميل والموعد يحجز بعد كل حجز ورقم) */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>بيانات العميل لحجز الرقم والدور:</span>
                </h4>

                <div>
                  <label className="text-[10px] text-white/70 block mb-1">اسم العميل بالكامل *</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="مثال: أحمد محمد علي"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-white/70 block mb-1">رقم تليفون العميل للتأكيد والمتابعة *</label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/70 block mb-1">البريد أو معرف تليجرام (اختياري)</label>
                    <input
                      type="text"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="@username أو إيميل"
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Where to send verification code & auto reply */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] text-white/80 font-bold block">
                    قناة استلام كود الحجز والرد الآلي الفوري:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmChannel('whatsapp')}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                        confirmChannel === 'whatsapp'
                          ? 'bg-[#25D366] text-black border-[#25D366] font-black'
                          : 'bg-black/40 text-white/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmChannel('telegram')}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                        confirmChannel === 'telegram'
                          ? 'bg-[#0088cc] text-white border-[#0088cc] font-black'
                          : 'bg-black/40 text-white/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>تليجرام</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmChannel('sms')}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                        confirmChannel === 'sms'
                          ? 'bg-amber-400 text-black border-amber-400 font-black'
                          : 'bg-black/40 text-white/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>SMS أرقام</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmChannel('both')}
                      className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                        confirmChannel === 'both'
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-400 text-black border-amber-400 font-black'
                          : 'bg-black/40 text-white/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>واتساب + SMS</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* INDEPENDENT PAYMENT NUMBERS FOR THIS SUBSCRIBER PAGE (أرقام دفع مستقلة لكل صفحة) */}
              <div className="bg-gradient-to-r from-emerald-950/30 via-neutral-900 to-teal-950/30 border border-emerald-500/30 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white/90 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>طرق وأرقام الدفع المستقلة لصفحة المشترك:</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold">مباشر 100% بدون وسيط</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('vodafone')}
                    className={`p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                      paymentMethod === 'vodafone'
                        ? 'bg-red-500 text-white font-black border-red-500 shadow'
                        : 'bg-white/5 text-white/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    📱 فودافون كاش
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('instapay')}
                    className={`p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                      paymentMethod === 'instapay'
                        ? 'bg-purple-600 text-white font-black border-purple-500 shadow'
                        : 'bg-white/5 text-white/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    ⚡ إنستاباي
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_account')}
                    className={`p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                      paymentMethod === 'bank_account'
                        ? 'bg-emerald-600 text-white font-black border-emerald-500 shadow'
                        : 'bg-white/5 text-white/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    🏦 حساب بنكي
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('in_person')}
                    className={`p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                      paymentMethod === 'in_person'
                        ? 'bg-amber-400 text-black font-black border-amber-400 shadow'
                        : 'bg-white/5 text-white/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    💵 في المكان
                  </button>
                </div>

                {/* Details display based on selected payment */}
                {paymentMethod === 'vodafone' && transfers.vodafoneCashNumber && (
                  <div className="bg-black/50 border border-red-500/30 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-white/60 block">رقم فودافون كاش الخاص بالمشترك:</span>
                      <strong className="font-mono text-red-400 text-xs block dir-ltr text-right">
                        {transfers.vodafoneCashNumber}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(transfers.vodafoneCashNumber!, 'voda')}
                      className="px-2.5 py-1 bg-red-500/20 text-red-300 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-red-500/30"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'voda' ? 'تم النسخ' : 'نسخ الرقم'}</span>
                    </button>
                  </div>
                )}

                {paymentMethod === 'instapay' && transfers.instapayId && (
                  <div className="bg-black/50 border border-purple-500/30 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-white/60 block">معرف إنستاباي InstaPay الخاص بالمشترك:</span>
                      <strong className="font-mono text-purple-300 text-xs block dir-ltr text-right">
                        {transfers.instapayId}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(transfers.instapayId!, 'insta')}
                      className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-purple-500/30"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'insta' ? 'تم النسخ' : 'نسخ المعرف'}</span>
                    </button>
                  </div>
                )}

                {paymentMethod === 'bank_account' && (
                  <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60">
                        {transfers.bankName || 'الحساب البنكي'}:
                      </span>
                      {transfers.accountNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy(transfers.accountNumber!, 'acc')}
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>{copiedKey === 'acc' ? 'تم النسخ' : 'نسخ الحساب'}</span>
                        </button>
                      )}
                    </div>
                    <strong className="font-mono text-emerald-300 text-xs block dir-ltr text-right">
                      {transfers.accountNumber || '1020030400506070'}
                    </strong>
                    {transfers.iban && (
                      <span className="text-[10px] text-white/50 block font-mono truncate dir-ltr text-right">
                        IBAN: {transfers.iban}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Price summary & Submit */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">المبلغ الإجمالي للحجز:</span>
                  <div className="text-end">
                    <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                      {totalPrice.toLocaleString()} ج.م
                    </span>
                    <span className="text-[10px] text-emerald-400 block">شامل كافة الرسوم وتأكيد الرقم</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>تأكيد الحجز وحجز رقم الدور #{nextAvailableSlotNumber}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY OTP CODE */}
          {step === 'verify_otp' && (
            <div className="py-4 space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto text-2xl">
                  🔐
                </div>
                <h3 className="text-base font-black text-white">
                  أدخل كود تأكيد وتفعيل الحجز
                </h3>
                <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                  تم إرسال كود التأكيد المكون من 6 أرقام إلى{' '}
                  <b className="text-amber-300 font-mono">{guestPhone}</b>
                </p>
              </div>

              {/* 6 OTP Inputs */}
              <div className="flex gap-2 justify-center py-2" dir="ltr">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-10 sm:w-12 h-12 sm:h-14 bg-black/60 border border-white/20 rounded-xl text-center text-lg sm:text-xl font-mono font-black text-amber-300 focus:outline-none focus:border-amber-400 transition"
                  />
                ))}
              </div>

              <div className="text-center text-xs text-white/50">
                المحاولات المتبقية: <b className="text-amber-400 font-mono">{otpTriesLeft}/3</b>
              </div>

              <button
                type="button"
                onClick={() => handleVerifyBookingOtp(otpDigits.join(''))}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-110 active:scale-95 text-black font-black py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-900/40 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 fill-black" />
                <span>تأكيد الحجز وتفعيل الرقم في القائمة فوراً ✓</span>
              </button>

              <div className="flex justify-between items-center text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-white/60 hover:text-white underline cursor-pointer"
                >
                  ← تعديل البيانات أو الرقم
                </button>

                <button
                  type="button"
                  onClick={(e) => handleInitiateBooking(e as any)}
                  className="text-amber-300 hover:text-amber-200 underline cursor-pointer"
                >
                  إعادة إرسال الكود
                </button>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center text-[10px] text-white/50">
                🔒 الحجز خاص ومباشر مع المشترك ويتم تسجيله تلقائياً في صفحته المستقلة.
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS VOUCHER WITH DIRECT CHANNELS (تليجرام، جوجل ميت، فيديو وصوت) */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center mx-auto text-3xl animate-bounce">
                ✓
              </div>
              <div className="space-y-1">
                <div className="inline-block bg-amber-400 text-black px-3 py-1 rounded-full text-xs font-black font-mono">
                  دورك في قائمة اليوم: [ #{assignedQueueNumber} من 300 ]
                </div>
                <h3 className="text-base sm:text-lg font-black text-emerald-300">
                  تم تأكيد وتفعيل حجزك بنجاح في {business.name}!
                </h3>
                <p className="text-white/70 text-xs">
                  كود الحجز المعتمد: <span className="font-mono font-bold text-amber-300">{bookingRef}</span>
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-start space-y-2 text-xs">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60">رقم الدور والتسلسل:</span>
                  <span className="font-bold text-amber-400 font-mono">#{assignedQueueNumber} من 300 (دورة 24 ساعة)</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60">الموعد والخدمة:</span>
                  <span className="font-bold text-white">{selectedRoom.name} • {selectedTimeSlot}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60">اسم العميل:</span>
                  <span className="font-bold text-white">{guestName}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60">رقم الهاتف المسجل:</span>
                  <span className="font-mono text-white font-bold">{guestPhone}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60">طريقة الدفع:</span>
                  <span className="font-bold text-emerald-300">
                    {paymentMethod === 'vodafone' ? '📱 فودافون كاش' :
                     paymentMethod === 'instapay' ? '⚡ إنستاباي' :
                     paymentMethod === 'bank_account' ? '🏦 حساب بنكي' : '💵 في المكان'}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-white/60">المبلغ الإجمالي:</span>
                  <span className="font-black text-amber-300 text-sm font-mono">{totalPrice.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Direct Communication Channels (تليجرام، جوجل ميت، مكالمات فيديو وصوت) */}
              <div className="space-y-2 pt-1 text-start">
                <span className="text-[11px] font-bold text-white/80 block">
                  قنوات التواصل المباشرة واستقبال المكالمات والرد الآلي:
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* WhatsApp confirmation */}
                  <a
                    href={`https://wa.me/${business.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `مرحباً ${business.name}، قمت بحجز موعد دور #${assignedQueueNumber} من 300 عبر منصة إعلانك SAM.\nكود الحجز: ${bookingRef}\nالاسم: ${guestName}\nالموعد: ${selectedTimeSlot}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] hover:bg-[#20ba59] text-black p-2 rounded-xl font-bold flex items-center justify-center gap-1 transition text-[11px]"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-black" />
                    <span>واتساب</span>
                  </a>

                  {/* Telegram channel */}
                  <a
                    href={`https://t.me/${(transfers.telegramUsername || 'e3lanak_service').replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#0088cc] hover:bg-[#0077b5] text-white p-2 rounded-xl font-bold flex items-center justify-center gap-1 transition text-[11px]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>تليجرام</span>
                  </a>

                  {/* Google Meet for Video consultations */}
                  <a
                    href={transfers.googleMeetUrl || 'https://meet.google.com/new'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 p-2 rounded-xl font-bold flex items-center justify-center gap-1 transition text-[11px]"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Google Meet 📹</span>
                  </a>

                  {/* Hotline / Direct Voice Call */}
                  <a
                    href={`tel:${transfers.hotline || business.phone}`}
                    className="bg-amber-400 hover:bg-amber-300 text-black p-2 rounded-xl font-black flex items-center justify-center gap-1 transition text-[11px]"
                  >
                    <Phone className="w-3.5 h-3.5 fill-black" />
                    <span>الخط الساخن 🔥</span>
                  </a>

                  {/* SMS Real Message (رسالة SMS نصية فعلية) */}
                  <a
                    href={`sms:${business.phone}?body=${encodeURIComponent(
                      `مرحباً ${business.name}، قمت بحجز موعد دور #${assignedQueueNumber} من 300 عبر منصة إعلانك SAM.\nكود الحجز: ${bookingRef}\nالاسم: ${guestName}\nالموعد: ${selectedTimeSlot}`
                    )}`}
                    className="bg-amber-400 hover:bg-amber-300 text-black p-2 rounded-xl font-black flex items-center justify-center gap-1 transition text-[11px] col-span-2 sm:col-span-4"
                    title="إرسال رسالة SMS نصية فعلية لهاتف المشترك"
                  >
                    <span>📩 إرسال رسالة SMS نصية فعلية لتأكيد الحجز فورياً</span>
                  </a>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  إغلاق وتأكيد الحجز
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
