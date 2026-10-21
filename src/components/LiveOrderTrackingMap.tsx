import React, { useState, useEffect } from 'react';
import { 
  Navigation, Motorbike, MapPin, Phone, MessageCircle, 
  Clock, ShieldCheck, CheckCircle2, AlertTriangle, 
  RotateCw, Play, Pause, Compass, Wallet, DollarSign,
  ChevronRight, Building2, Home, Share2
} from 'lucide-react';
import { DeliveryOrder, DeliveryStatus, SupportedLang } from '../types';

interface LiveOrderTrackingMapProps {
  order: DeliveryOrder;
  onClose?: () => void;
  lang: SupportedLang;
  onUpdateStatus?: (newStatus: DeliveryStatus) => void;
}

export const LiveOrderTrackingMap: React.FC<LiveOrderTrackingMapProps> = ({
  order,
  onClose,
  lang,
  onUpdateStatus,
}) => {
  const isAr = lang === 'ar';

  // Live journey simulation percentage (0 to 100)
  const [progress, setProgress] = useState<number>(() => {
    if (order.status === 'delivered') return 100;
    if (order.status === 'on_the_way') return 55;
    if (order.status === 'preparing') return 25;
    return 10;
  });

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(38);
  const [currentStatus, setCurrentStatus] = useState<DeliveryStatus>(order.status || 'on_the_way');
  const [showTransferDetails, setShowTransferDetails] = useState<boolean>(false);
  const [copiedTransfer, setCopiedTransfer] = useState<boolean>(false);

  // Captain details
  const captainName = order.captainName || 'كابتن محمود الشريف';
  const captainPhone = order.captainPhone || '01006656669';
  const captainTransferPhone = captainPhone; // كل دليفري رقم تحويل له على رقمه الخاص
  const restaurantName = order.businessName || 'مطعم المشويات والوجبات';
  const customerAddress = order.deliveryAddress || 'التجمع الخامس - شارع التسعين الشمالي';

  // Automatic live tracking simulation tick
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentStatus('delivered');
          onUpdateStatus?.('delivered');
          setIsSimulating(false);
          return 100;
        }

        const next = prev + 1.5;
        // Fluctuating speed for realistic sensation
        setCurrentSpeedKmh(Math.floor(32 + Math.random() * 14));

        if (next > 85 && currentStatus !== 'delivered') {
          setCurrentStatus('on_the_way');
        } else if (next > 35 && currentStatus === 'received') {
          setCurrentStatus('on_the_way');
          onUpdateStatus?.('on_the_way');
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, currentStatus, onUpdateStatus]);

  // Derived metrics based on progress
  const distanceRemainingKm = Math.max(0, (100 - progress) * 0.045).toFixed(1);
  const etaMinutes = Math.max(1, Math.round((100 - progress) * 0.25));

  // Route points on a 600x320 SVG viewport
  // Start: (80, 240) [Restaurant] -> Waypoints -> End: (520, 80) [Customer]
  const startX = 80;
  const startY = 240;
  const endX = 520;
  const endY = 80;

  // Polyline waypoints
  const waypoints = [
    { x: 80, y: 240 },
    { x: 160, y: 220 },
    { x: 220, y: 150 },
    { x: 310, y: 170 },
    { x: 390, y: 110 },
    { x: 450, y: 130 },
    { x: 520, y: 80 },
  ];

  // Calculate captain current position along waypoints
  const getCaptainCoordinates = (p: number) => {
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

  const captainPos = getCaptainCoordinates(progress);

  const handleCopyTransferPhone = () => {
    navigator.clipboard.writeText(captainTransferPhone);
    setCopiedTransfer(true);
    setTimeout(() => setCopiedTransfer(false), 2500);
  };

  const handleJumpToStatus = (status: DeliveryStatus, targetProgress: number) => {
    setCurrentStatus(status);
    setProgress(targetProgress);
    onUpdateStatus?.(status);
  };

  return (
    <div 
      className="bg-neutral-950 border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white animate-in fade-in duration-200"
      dir="rtl"
    >
      {/* Top Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-emerald-400/30 text-emerald-300">
            <Motorbike className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-white">
                تتبع مسار الطلب المباشر (Live Tracking) 🛵
              </h3>
              <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow">
                تحديث لحظي GPS 📡
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/90 font-mono">
              رقم الأوردر: #{order.orderNumber} • مسار الكابتن من المطعم للعميل
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Live Status Ticker */}
      <div className="bg-neutral-900 border-b border-white/10 px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="font-black text-amber-300">
            {currentStatus === 'received' && '1. تم استلام الأوردر وتأكيده بالمطعم'}
            {currentStatus === 'preparing' && '2. المطعم يقوم بتجهيز وتغليف وجبتك الآن 🍳'}
            {currentStatus === 'on_the_way' && '3. الكابتن استلم الطلب وهو في الطريق إليك 🚀'}
            {currentStatus === 'delivered' && '4. تم تسليم الأوردر بنجاح! بالهناء والشفاء ✅'}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="bg-black/50 px-2.5 py-1 rounded-xl border border-white/10 text-white/80">
            ⏱️ متبقي: <b className="text-emerald-400 font-bold">{progress >= 100 ? '0' : etaMinutes} دقيقة</b>
          </span>
          <span className="bg-black/50 px-2.5 py-1 rounded-xl border border-white/10 text-white/80">
            📍 مسافة: <b className="text-amber-300 font-bold">{distanceRemainingKm} كم</b>
          </span>
          <span className="bg-black/50 px-2.5 py-1 rounded-xl border border-white/10 text-white/80 hidden sm:inline-block">
            ⚡ سرعة: <b className="text-sky-300 font-bold">{progress >= 100 ? 0 : currentSpeedKmh} كم/س</b>
          </span>
        </div>
      </div>

      {/* Interactive Vector Route Map Canvas */}
      <div className="relative w-full h-72 sm:h-80 bg-[#0c1218] overflow-hidden select-none border-b border-white/10">
        {/* Background Grid Pattern (Simulating GPS Streets) */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Street Lines / Secondary roads */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 320" preserveAspectRatio="none">
          {/* Secondary street grid lines */}
          <path d="M 0 100 Q 200 120 600 90" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
          <path d="M 0 220 Q 300 240 600 190" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
          <path d="M 180 0 L 190 320" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
          <path d="M 400 0 L 410 320" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />

          {/* Active Navigation Polyline Trail */}
          <path
            d={`M ${waypoints.map(w => `${w.x} ${w.y}`).join(' L ')}`}
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="6 6"
            className="animate-pulse"
          />

          {/* Glowing under-polyline */}
          <path
            d={`M ${waypoints.map(w => `${w.x} ${w.y}`).join(' L ')}`}
            stroke="rgba(16, 185, 129, 0.25)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        {/* Point A: Restaurant Pin */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
          style={{ left: `${(startX / 600) * 100}%`, top: `${(startY / 320) * 100}%` }}
        >
          <div className="relative">
            <span className="w-10 h-10 rounded-full bg-amber-500/30 border border-amber-400 flex items-center justify-center text-lg shadow-lg">
              🏬
            </span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
          </div>
          <div className="bg-black/85 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full mt-1 shadow whitespace-nowrap">
            {restaurantName}
          </div>
        </div>

        {/* Point B: Customer Home Pin */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
          style={{ left: `${(endX / 600) * 100}%`, top: `${(endY / 320) * 100}%` }}
        >
          <div className="relative">
            <span className="w-10 h-10 rounded-full bg-red-500/30 border border-red-400 flex items-center justify-center text-lg shadow-lg">
              🏠
            </span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full" />
          </div>
          <div className="bg-black/85 backdrop-blur-md border border-red-400/40 text-red-200 text-[10px] font-black px-2 py-0.5 rounded-full mt-1 shadow whitespace-nowrap">
            مكان التسليم (العميل)
          </div>
        </div>

        {/* Dynamic Moving Captain Marker */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 transition-all duration-700 ease-out"
          style={{ 
            left: `${(captainPos.x / 600) * 100}%`, 
            top: `${(captainPos.y / 320) * 100}%` 
          }}
        >
          <div className="relative">
            {/* Pulsing beacon radar */}
            <span className="absolute -inset-3 rounded-full bg-emerald-400/30 animate-ping" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black border-2 border-white flex items-center justify-center shadow-2xl relative">
              <Motorbike className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
          <div className="bg-emerald-950/95 border border-emerald-400 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full mt-1.5 shadow-xl whitespace-nowrap flex items-center gap-1">
            <span>{captainName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>

        {/* Floating Simulation Controls */}
        <div className="absolute bottom-3 end-3 z-30 flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 text-xs">
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 cursor-pointer font-bold text-[11px]"
            title={isSimulating ? 'إيقاف المحاكاة مؤقتاً' : 'استئناف المحاكاة الحية'}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isSimulating ? 'إيقاف' : 'تشغيل'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProgress(0);
              setCurrentStatus('received');
              setIsSimulating(true);
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 cursor-pointer font-bold text-[11px]"
            title="إعادة تشغيل المحاكاة من البداية"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>إعادة</span>
          </button>
        </div>
      </div>

      {/* Progress Track Stages Bar */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Progress Slider Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold text-white/80">
            <span>مسار إنجاز الطلب:</span>
            <span className="text-emerald-400 font-mono font-black">{Math.round(progress)}% مكتمل</span>
          </div>
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 4 Interactive State Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleJumpToStatus('received', 15)}
            className={`p-2 rounded-xl border text-center transition cursor-pointer font-bold ${
              currentStatus === 'received'
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 font-black'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            📋 1. استلام الأوردر
          </button>

          <button
            type="button"
            onClick={() => handleJumpToStatus('preparing', 40)}
            className={`p-2 rounded-xl border text-center transition cursor-pointer font-bold ${
              currentStatus === 'preparing'
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-black'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            🍳 2. تجهيز بالمطعم
          </button>

          <button
            type="button"
            onClick={() => handleJumpToStatus('on_the_way', 75)}
            className={`p-2 rounded-xl border text-center transition cursor-pointer font-bold ${
              currentStatus === 'on_the_way'
                ? 'bg-sky-500/25 border-sky-400 text-sky-300 font-black'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            🛵 3. الكابتن في الطريق
          </button>

          <button
            type="button"
            onClick={() => handleJumpToStatus('delivered', 100)}
            className={`p-2 rounded-xl border text-center transition cursor-pointer font-bold ${
              currentStatus === 'delivered'
                ? 'bg-emerald-600/35 border-emerald-400 text-emerald-200 font-black'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            ✅ 4. تم التسليم
          </button>
        </div>

        {/* Captain & Private Payment Transfer Box */}
        {/* Requirement #4: كل دليفري رقم تحويل له علي رقمه الخاص او كاش والاشتراك علي البرنامج اعلانك */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-2xl font-black">
                🛵
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-white">{captainName}</h4>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                    كابتن معتمد على إعلانك 🛡️
                  </span>
                </div>
                <p className="text-[11px] text-white/60">
                  سكوتر دليفري إكسبريس • مشترك ومفعل على برنامج إعلانك (3 شهور مجاناً 🎁)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${captainPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `مرحباً كابتن ${captainName}، أتابع معك الأوردر رقم (#${order.orderNumber}) عبر منصة إعلانك.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20ba59] text-black font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>واتساب الكابتن</span>
              </a>

              <a
                href={`tel:${captainPhone}`}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs p-2 rounded-xl transition"
                title="اتصال هاتفي مباشر"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Captain Direct Transfer Notice (رقم تحويل خاص به أو كاش) */}
          <div className="bg-black/60 border border-amber-400/30 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>طرق دفع الحساب للكابتن (تحويل خاص على رقمه أو كاش):</span>
              </div>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                تحويل مباشر 100%
              </span>
            </div>

            <p className="text-[11px] text-white/70 leading-relaxed">
              يمكنك دفع ثمن الطلب والتوصيل نقداً <strong>كاش عند الاستلام</strong>، أو بالتحويل المباشر للكابتن عبر <strong>فودافون كاش أو إنستاباي</strong> على رقمه الخاص:
            </p>

            <div className="flex items-center justify-between bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 flex-wrap gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-white/60">رقم التحويل المباشر للكابتن:</span>
                <strong className="text-emerald-400 font-black text-sm">{captainTransferPhone}</strong>
                <span className="text-[10px] text-purple-300 font-sans">(إنستاباي / فودافون كاش)</span>
              </div>

              <button
                type="button"
                onClick={handleCopyTransferPhone}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition cursor-pointer"
              >
                {copiedTransfer ? '✓ تم النسخ' : 'نسخ الرقم'}
              </button>
            </div>
          </div>
        </div>

        {/* Order Details Summary */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center text-white/70">
            <span>وجهة التسليم (عنوان العميل):</span>
            <span className="text-white font-bold">{customerAddress}</span>
          </div>
          <div className="flex justify-between items-center text-white/70">
            <span>المحل / المطعم المرسل:</span>
            <span className="text-amber-300 font-bold">{restaurantName}</span>
          </div>
          <div className="flex justify-between items-center text-white/70 pt-1 border-t border-white/5">
            <span>إجمالي الفاتورة المستحق عند الوصول:</span>
            <span className="text-emerald-400 font-black text-sm">{order.totalEgp || 185} ج.م</span>
          </div>
        </div>
      </div>
    </div>
  );
};
