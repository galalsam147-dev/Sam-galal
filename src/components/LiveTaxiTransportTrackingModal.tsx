import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, MapPin, Navigation, Phone, MessageCircle, Share2, 
  ShieldCheck, AlertTriangle, Clock, Compass, DollarSign, 
  CreditCard, CheckCircle2, ChevronRight, Copy, Check, 
  Volume2, Play, Pause, RotateCcw, AlertOctagon, Car, 
  Truck, Bus, Bike
} from 'lucide-react';
import { Business, SubscriberTrackingCell, SupportedLang, ADMIN_OFFICIAL_ACCOUNTS } from '../types';
import { TripPaymentMethodsManager } from './TripPaymentMethodsManager';

export type TransportVehicleType = 'taxi' | 'motorcycle' | 'limousine' | 'bus_travel' | 'heavy_truck';

export interface LiveTaxiTransportTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBusiness?: Business | null;
  defaultVehicleType?: TransportVehicleType;
  userCoords?: { lat: number; lng: number } | null;
  onDetectLocation?: () => void;
  lang: SupportedLang;
}

export const LiveTaxiTransportTrackingModal: React.FC<LiveTaxiTransportTrackingModalProps> = ({
  isOpen,
  onClose,
  targetBusiness,
  defaultVehicleType = 'taxi',
  userCoords,
  onDetectLocation,
  lang,
}) => {
  if (!isOpen) return null;

  const isAr = lang === 'ar';

  // Selected vehicle type
  const [vehicleType, setVehicleType] = useState<TransportVehicleType>(() => {
    if (targetBusiness?.trackingCell?.vehicleType) {
      const v = targetBusiness.trackingCell.vehicleType;
      if (['taxi', 'motorcycle', 'limousine', 'bus_travel', 'heavy_truck'].includes(v)) {
        return v as TransportVehicleType;
      }
    }
    if (targetBusiness?.cat === 'موتوسيكل ودليفري') return 'motorcycle';
    if (targetBusiness?.cat === 'سيارات ليموزين') return 'limousine';
    if (targetBusiness?.cat === 'أتوبيسات رحلات وسياحة وعمرة' || targetBusiness?.cat === 'اتوبيس وسيارات مدرسة') return 'bus_travel';
    if (targetBusiness?.cat === 'شحن ونقل ثقيل' || targetBusiness?.cat === 'عمال ونقل أثاث') return 'heavy_truck';
    return defaultVehicleType;
  });

  // Addresses
  const activeUserCoords = userCoords || { lat: 30.0444, lng: 31.2357 };
  const [pickupAddress, setPickupAddress] = useState<string>(
    userCoords ? 'موقعي الحالي المحدد بالـ GPS (التجمع الخامس)' : 'التجمع الخامس - شارع التسعين الجنوبي'
  );
  const [destinationAddress, setDestinationAddress] = useState<string>(
    targetBusiness ? `${targetBusiness.name} (${targetBusiness.addr})` : 'مطار القاهرة الدولي - صالة 3'
  );

  // Captain details based on targetBusiness or defaults
  const cell: SubscriberTrackingCell = useMemo(() => {
    if (targetBusiness?.trackingCell) {
      return targetBusiness.trackingCell;
    }
    // Default rich captain profiles per vehicle type
    switch (vehicleType) {
      case 'motorcycle':
        return {
          enabled: true,
          vehicleType: 'motorcycle',
          vehiclePlate: 'م ن ر 1932',
          vehicleModel: 'سكوتر هوندا 160cc سريع',
          captainName: 'كابتن عمر الدسوقي',
          captainPhone: targetBusiness?.phone || '01006656669',
          currentStatus: 'available',
          currentArea: 'التجمع الأول والرحاب',
          ratePerKmEgp: 4,
          minimumTripPriceEgp: 15,
          rating: 4.9,
          totalTrips: 1840,
        };
      case 'limousine':
        return {
          enabled: true,
          vehicleType: 'limousine',
          vehiclePlate: 'ر ق م 7777',
          vehicleModel: 'مرسيدس E-Class 2024 فاخرة VIP',
          captainName: 'كابتن حازم رضوان',
          captainPhone: targetBusiness?.phone || '01006656669',
          currentStatus: 'available',
          currentArea: 'مطار القاهرة الدولي والتجمع الخامس',
          ratePerKmEgp: 18,
          minimumTripPriceEgp: 200,
          rating: 5.0,
          totalTrips: 920,
        };
      case 'bus_travel':
        return {
          enabled: true,
          vehicleType: 'bus_travel',
          vehiclePlate: 'ب ا ص 9520',
          vehicleModel: 'مرسيدس ترافيلو 50 راكب مكيف VIP',
          captainName: 'كابتن كمال عبد الصمد',
          captainPhone: targetBusiness?.phone || '01006656669',
          currentStatus: 'available',
          currentArea: 'ميدان التحرير ومحطات السفر الكبرى',
          ratePerKmEgp: 35,
          minimumTripPriceEgp: 1500,
          rating: 4.9,
          totalTrips: 580,
        };
      case 'heavy_truck':
        return {
          enabled: true,
          vehicleType: 'heavy_truck',
          vehiclePlate: 'ن ق ل 3341',
          vehicleModel: 'جامبو مغلقة + ونش هيدروليكي 16 دور',
          captainName: 'كابتن إبراهيم عاشور',
          captainPhone: targetBusiness?.phone || '01006656669',
          currentStatus: 'available',
          currentArea: 'القاهرة الجديدة والمنطقة الصناعية',
          ratePerKmEgp: 22,
          minimumTripPriceEgp: 650,
          rating: 4.8,
          totalTrips: 1120,
        };
      case 'taxi':
      default:
        return {
          enabled: true,
          vehicleType: 'taxi',
          vehiclePlate: 'ط س ق 4821',
          vehicleModel: 'هيونداي إلنترا 2024 مكيفة بالعداد',
          captainName: 'كابتن محمود الشريف',
          captainPhone: targetBusiness?.phone || '01006656669',
          currentStatus: 'available',
          currentArea: 'التجمع الخامس - شارع التسعين',
          ratePerKmEgp: 6,
          minimumTripPriceEgp: 25,
          rating: 4.9,
          totalTrips: 2430,
        };
    }
  }, [targetBusiness, vehicleType]);

  // Trip tracking progression (0 to 100%)
  const [tripProgress, setTripProgress] = useState<number>(35);
  const [isLiveSimulating, setIsLiveSimulating] = useState<boolean>(true);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(42);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Status stage
  const tripStage = useMemo<'confirmed' | 'approaching' | 'on_trip' | 'completed'>(() => {
    if (tripProgress >= 100) return 'completed';
    if (tripProgress >= 30) return 'on_trip';
    if (tripProgress >= 10) return 'approaching';
    return 'confirmed';
  }, [tripProgress]);

  // Estimated fare calculation & manual fare customization
  const distanceKm = 8.4;
  const initialCalculatedFare = useMemo(() => {
    const min = cell.minimumTripPriceEgp || 25;
    const perKm = cell.ratePerKmEgp || 6;
    return Math.round(min + distanceKm * perKm);
  }, [cell, distanceKm]);

  const [customTripFare, setCustomTripFare] = useState<number | null>(null);
  const activeFare = customTripFare !== null ? customTripFare : initialCalculatedFare;

  // Auto tick live simulation
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      setTripProgress((prev) => {
        if (prev >= 100) {
          setIsLiveSimulating(false);
          return 100;
        }
        const next = prev + 1.2;
        setCurrentSpeedKmh(Math.floor(35 + Math.random() * 18));
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  const remainingDistKm = Math.max(0, (100 - tripProgress) * 0.084).toFixed(1);
  const etaMinutes = Math.max(1, Math.round((100 - tripProgress) * 0.2));

  // Waypoints for vector route map
  const waypoints = [
    { x: 60, y: 220 },
    { x: 140, y: 210 },
    { x: 210, y: 140 },
    { x: 300, y: 160 },
    { x: 380, y: 100 },
    { x: 440, y: 130 },
    { x: 530, y: 70 },
  ];

  const getVehicleCoordinates = (p: number) => {
    const totalSegments = waypoints.length - 1;
    const clamped = Math.min(100, Math.max(0, p));
    const rawIndex = (clamped / 100) * totalSegments;
    const segIndex = Math.min(Math.floor(rawIndex), totalSegments - 1);
    const segT = rawIndex - segIndex;

    const p1 = waypoints[segIndex];
    const p2 = waypoints[segIndex + 1];

    const x = p1.x + (p2.x - p1.x) * segT;
    const y = p1.y + (p2.y - p1.y) * segT;

    return { x, y };
  };

  const vehiclePos = getVehicleCoordinates(tripProgress);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(key);
    setToastMsg('تم النسخ بنجاح 📋');
    setTimeout(() => {
      setIsCopied(null);
      setToastMsg(null);
    }, 2500);
  };

  const vehicleIcon = () => {
    switch (vehicleType) {
      case 'motorcycle':
        return <Bike className="w-5 h-5 text-amber-300" />;
      case 'limousine':
        return <Car className="w-5 h-5 text-sky-300" />;
      case 'bus_travel':
        return <Bus className="w-5 h-5 text-emerald-300" />;
      case 'heavy_truck':
        return <Truck className="w-5 h-5 text-orange-300" />;
      case 'taxi':
      default:
        return <Car className="w-5 h-5 text-yellow-300" />;
    }
  };

  const vehicleLabel = () => {
    switch (vehicleType) {
      case 'motorcycle': return 'دليفري وموتوسيكل وسكوتر سريع 🛵';
      case 'limousine': return 'سيارات ليموزين ورجال أعمال VIP 🚘';
      case 'bus_travel': return 'أتوبيسات رحلات وسياحة وعمرة 🚌';
      case 'heavy_truck': return 'شحن ونقل ثقيل ونقل عفش 🚚';
      case 'taxi':
      default: return 'تاكسي وأجرة بالعداد والـ GPS 🚕';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div 
        className="bg-neutral-950 border border-emerald-500/40 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative my-auto text-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-neutral-900 p-4 sm:p-5 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md text-emerald-300 flex items-center justify-center border border-emerald-400/40 shadow-lg">
              {vehicleIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  طلب فوري وتتبع مباشر بالـ GPS 🛰️
                </h3>
                <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow">
                  تحديث حي
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 font-mono">
                {targetBusiness ? targetBusiness.name : 'خدمة المشتركين المعتمدة'} • {cell.captainName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anti-Fraud Caution Top Banner (تحذير الجمهور من النصب والاحتيال) */}
        <div className="bg-red-950/70 border-b border-red-500/40 px-4 py-2.5 flex items-start gap-2.5 text-xs text-red-200">
          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-0.5">
            <span className="font-black text-amber-300 block text-[11px]">
              ⚠️ تحذير أمني هام للجمهور من النصب والاحتيال:
            </span>
            <p className="text-[10px] text-red-100/90 leading-relaxed">
              تأكد تماماً من معاينة الخدمة أو البضاعة والتحقق من هوية السائق قبل تحويل أي مبالغ مالية. 
              <strong> ننصح بالدفع كاش عند الوصول والاستلام فقط </strong> لضمان حقك وحمايتك التامة.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">

          {/* Toast Msg */}
          {toastMsg && (
            <div className="bg-emerald-500 text-black font-black text-center py-1.5 rounded-xl text-xs animate-pulse">
              {toastMsg}
            </div>
          )}

          {/* 1. Quick Vehicle Selector Buttons (بدل ما نكتب تاكسي ميزة تاكسي أو موتوسيكل) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-white/60 block">
              اختر نوع وسيلة النقل فوراً (بنقرة واحدة بدون كتابة):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { type: 'taxi' as TransportVehicleType, label: 'تاكسي 🚕', icon: '🚕' },
                { type: 'motorcycle' as TransportVehicleType, label: 'موتوسيكل 🛵', icon: '🛵' },
                { type: 'limousine' as TransportVehicleType, label: 'ليموزين 🚘', icon: '🚘' },
                { type: 'bus_travel' as TransportVehicleType, label: 'أتوبيس 🚌', icon: '🚌' },
                { type: 'heavy_truck' as TransportVehicleType, label: 'شحن ثقيل 🚚', icon: '🚚' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setVehicleType(item.type)}
                  className={`p-2 rounded-xl text-center font-bold transition flex flex-col items-center gap-1 border cursor-pointer ${
                    vehicleType === item.type
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md font-black'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-[10px] truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Pickup & Dropoff Inputs with GPS Auto-detection button */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2.5">
            {/* Pickup */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-white/50 block">نقطة الانطلاق / الركوب (موقعك):</span>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              {onDetectLocation && (
                <button
                  type="button"
                  onClick={() => {
                    onDetectLocation();
                    setPickupAddress('موقعي الحالي المحدد بالـ GPS 📍');
                    setToastMsg('📍 تم تحديد موقعك الحالي بالـ GPS في ثوانٍ!');
                  }}
                  className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-400/30 px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                  title="تحديد مكاني بالـ GPS تلقائياً"
                >
                  <Navigation className="w-3 h-3" />
                  <span>مكاني 📍</span>
                </button>
              )}
            </div>

            {/* Destination */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-white/50 block">نقطة الوصول والتسليم:</span>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-400"
                />
              </div>
            </div>
          </div>

          {/* 3. Live Status & Metrics Bar */}
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-black text-amber-300">
                {tripStage === 'confirmed' && '1. تم تأكيد الطلب وحجز الكابتن 📋'}
                {tripStage === 'approaching' && '2. الكابتن في الطريق إلى موقع الركوب 🚕'}
                {tripStage === 'on_trip' && '3. الرحلة جارية مع التتبع المباشر بالـ GPS 🛰️'}
                {tripStage === 'completed' && '4. تم الوصول بنجاح والتسليم! رحلة سعيدة ✅'}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 text-white/80">
                ⏱️ متبقي: <b className="text-emerald-400 font-bold">{tripProgress >= 100 ? '0' : etaMinutes} د</b>
              </span>
              <span className="bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 text-white/80">
                📍 مسافة: <b className="text-amber-300 font-bold">{remainingDistKm} كم</b>
              </span>
              <span className="bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 text-white/80">
                ⚡ سرعة: <b className="text-sky-300 font-bold">{tripProgress >= 100 ? 0 : currentSpeedKmh} كم/س</b>
              </span>
            </div>
          </div>

          {/* 4. Vector SVG Route Canvas (Live Moving Vehicle) */}
          <div className="relative w-full h-64 sm:h-72 bg-[#090e13] rounded-2xl overflow-hidden border border-white/10 select-none shadow-inner">
            {/* Street Grid pattern */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
                `,
                backgroundSize: '36px 36px'
              }}
            />

            {/* SVG Roads and Active Polyline */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 300" preserveAspectRatio="none">
              <path d="M 0 100 Q 200 120 600 90" stroke="rgba(255,255,255,0.07)" strokeWidth="8" fill="none" />
              <path d="M 0 220 Q 300 240 600 190" stroke="rgba(255,255,255,0.07)" strokeWidth="10" fill="none" />
              <path d="M 180 0 L 190 300" stroke="rgba(255,255,255,0.07)" strokeWidth="8" fill="none" />
              <path d="M 400 0 L 410 300" stroke="rgba(255,255,255,0.07)" strokeWidth="8" fill="none" />

              {/* Glowing Route Trail */}
              <path
                d={`M ${waypoints.map(w => `${w.x} ${w.y}`).join(' L ')}`}
                stroke="rgba(16, 185, 129, 0.3)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d={`M ${waypoints.map(w => `${w.x} ${w.y}`).join(' L ')}`}
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray="6 6"
                className="animate-pulse"
              />
            </svg>

            {/* Point A (Pickup) */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: `${(waypoints[0].x / 600) * 100}%`, top: `${(waypoints[0].y / 300) * 100}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center text-sm shadow">
                🟢
              </div>
              <span className="bg-black/90 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded-full mt-0.5 border border-emerald-400/40">
                موقع الركوب
              </span>
            </div>

            {/* Point B (Destination) */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: `${(waypoints[waypoints.length - 1].x / 600) * 100}%`, top: `${(waypoints[waypoints.length - 1].y / 300) * 100}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-red-500/30 border border-red-400 flex items-center justify-center text-sm shadow">
                🏁
              </div>
              <span className="bg-black/90 text-red-300 text-[9px] font-black px-1.5 py-0.2 rounded-full mt-0.5 border border-red-400/40">
                نقطة الوصول
              </span>
            </div>

            {/* Moving Vehicle Marker */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 transition-all duration-700 ease-out"
              style={{ left: `${(vehiclePos.x / 600) * 100}%`, top: `${(vehiclePos.y / 300) * 100}%` }}
            >
              <div className="relative">
                <span className="w-10 h-10 rounded-2xl bg-black border-2 border-amber-400 flex items-center justify-center text-lg shadow-xl shadow-amber-500/30">
                  {vehicleType === 'motorcycle' && '🛵'}
                  {vehicleType === 'limousine' && '🚘'}
                  {vehicleType === 'bus_travel' && '🚌'}
                  {vehicleType === 'heavy_truck' && '🚚'}
                  {vehicleType === 'taxi' && '🚕'}
                </span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <div className="bg-black/90 border border-amber-400/40 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full mt-1 shadow whitespace-nowrap">
                {cell.captainName} ({currentSpeedKmh} كم/س)
              </div>
            </div>

            {/* Simulation controls overlay */}
            <div className="absolute top-2.5 start-2.5 z-20 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsLiveSimulating(!isLiveSimulating)}
                className="bg-black/70 hover:bg-black/90 border border-white/20 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {isLiveSimulating ? <Pause className="w-3 h-3 text-amber-300" /> : <Play className="w-3 h-3 text-emerald-400" />}
                <span>{isLiveSimulating ? 'إيقاف مؤقت' : 'استئناف'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTripProgress(10);
                  setIsLiveSimulating(true);
                }}
                className="bg-black/70 hover:bg-black/90 border border-white/20 text-white p-1 rounded-lg text-[10px] cursor-pointer"
                title="إعادة الرحلة من البداية"
              >
                <RotateCcw className="w-3 h-3 text-sky-300" />
              </button>
            </div>
          </div>

          {/* 5. Captain Cell & Vehicle Info (خلية التتبع لكل مشترك) */}
          <div className="bg-gradient-to-r from-neutral-900 to-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-emerald-400/40 flex items-center justify-center text-xl font-black text-amber-400">
                  {cell.captainPhoto ? (
                    <img src={cell.captainPhoto} alt={cell.captainName} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    '👨‍✈️'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-white">{cell.captainName}</h4>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0.2 rounded border border-emerald-500/40">
                      كابتن معتمد ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60">
                    {cell.vehicleModel || vehicleLabel()} • لوحة: <b className="text-white font-mono">{cell.vehiclePlate || 'ط س ق 4821'}</b>
                  </p>
                </div>
              </div>

              {/* Price / Fare Estimate */}
              <div className="text-start sm:text-end bg-black/50 border border-white/10 rounded-xl px-3 py-1.5">
                <span className="text-[10px] text-white/50 block">
                  {customTripFare !== null ? 'الأجرة اليدوية المتفق عليها:' : 'الأجرة التقديرية بالعداد:'}
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  ~ {activeFare} ج.م
                </span>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <a
                href={`tel:${cell.captainPhone}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال بالسائق</span>
              </a>

              <a
                href={`https://wa.me/${cell.captainPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً كابتن، أنا في انتظارك في: ${pickupAddress} • موقعي الدقيق على الخريطة: https://maps.google.com/?q=${activeUserCoords.lat},${activeUserCoords.lng}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20ba59] text-black font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-black" />
                <span>واتساب الكابتن</span>
              </a>

              {/* Share ride tracking with relatives (مثل أوبر وديدي للأمان) */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🚗 رحلتي المباشرة على برنامج إعلانك (أمان ومتابعة حية مثل أوبر وديدي):\nأنا راكب حالياً مع الكابتن: ${cell.captainName}\nنوع المركبة: ${cell.vehicleModel || vehicleLabel()}\nرقم اللوحة: ${cell.vehiclePlate || 'ط س ق 4821'}\nرابط الخريطة وتتبع مساري والسرعة لحظة بلحظة:\n${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-500 text-white font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow"
                title="مشاركة مسار الرحلة واللوحة وموقع الـ GPS المباشر مع الأقارب والعائلة للأمان التام مثل أوبر وديدي"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة للأقارب (أمان ديدي/أوبر) 🛡️</span>
              </a>

              {/* Send Arrival Alert / Location Pin Message */}
              <button
                type="button"
                onClick={() => {
                  const arrivalMsg = `📍 إشعار وصول من برنامج إعلانك:\nالكابتن ${cell.captainName} (${cell.vehiclePlate}) وصل الآن إلى نقطة الالتقاء المحددة: ${pickupAddress}\nيرجى التوجه للمركبة أو استلام الطلب.`;
                  window.open(`https://wa.me/${cell.captainPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(arrivalMsg)}`, '_blank');
                  setToastMsg('تم إرسال إشعار الوصول وتحديد المكان بنجاح ⚡');
                }}
                className="bg-amber-400 hover:bg-amber-300 text-black font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow col-span-2 sm:col-span-1"
                title="إرسال رسالة للعميل والكابتن بالوصول وتحديد مكانه"
              >
                <Navigation className="w-3.5 h-3.5 fill-black" />
                <span>إشعار بالوصول وتحديد المكان 📍</span>
              </button>
            </div>
          </div>

          {/* 6. Trip Payment Numbers & Fare Manager (تعديل أرقام دفع الرحلة يدوي: إضافة، تعديل، حذف) */}
          <TripPaymentMethodsManager
            storageKey={cell.captainPhone || 'default_captain'}
            initialMethods={cell.tripPaymentMethods}
            captainName={cell.captainName}
            captainPhone={cell.captainPhone}
            currentFareEgp={activeFare}
            onFareChange={(newFare) => setCustomTripFare(newFare)}
            allowFareEdit={true}
          />

        </div>

        {/* Footer */}
        <div className="bg-neutral-900 border-t border-white/10 p-3 sm:p-4 flex items-center justify-between">
          <div className="text-[11px] text-white/60">
            <span>🛡️ تتبع مباشر معتمد ومحمي بالـ GPS على كافة أجهزة الموبايل والآيباد</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
