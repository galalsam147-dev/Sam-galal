import React, { useState, useEffect } from 'react';
import { 
  X, Shield, Lock, User, KeyRound, CheckCircle2, Clock, AlertTriangle, 
  FileCheck, PlusCircle, Search, Edit3, Eye, EyeOff, LogOut, Send, 
  Phone, MapPin, Check, Ban, Trash2, Image as ImageIcon, Video, Plus
} from 'lucide-react';
import { Business, StaffMember, SupportedLang } from '../types';
import { 
  getStaffMembers, 
  authenticateStaff, 
  submitForAdminApproval, 
  getPendingAdSubmissions,
  approveAdSubmission,
  rejectAdSubmission,
  PendingAdSubmission 
} from '../utils/staffManager';
import { AdminEditSubscriberModal } from './AdminEditSubscriberModal';
import { getLatestAdminPin, getLatestSubscriberPin } from '../utils/passwordSecurity';

interface AssistantStaffPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  onUpdateBusinesses: (updated: Business[]) => void;
  onShowToast?: (msg: string) => void;
  lang?: SupportedLang;
}

export const AssistantStaffPortalModal: React.FC<AssistantStaffPortalModalProps> = ({
  isOpen,
  onClose,
  businesses,
  onUpdateBusinesses,
  lang = 'ar',
}) => {
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [isManagerMode, setIsManagerMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoggedInPass, setShowLoggedInPass] = useState(true);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'moderation' | 'media_control' | 'add_ad' | 'edit_ad' | 'my_submissions'>('moderation');

  // Search & filter in moderation
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'flagged'>('all');
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Media manual add state
  const [mediaUrlInput, setMediaUrlInput] = useState<{ [bizId: string]: string }>({});
  const [mediaTypeInput, setMediaTypeInput] = useState<{ [bizId: string]: 'image' | 'video' }>({});

  // New ad form states
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('مطاعم');
  const [newCity, setNewCity] = useState('القاهرة');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newHotline, setNewHotline] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newHours, setNewHours] = useState('09:00 ص - 11:00 م');
  const [newOwnerPin, setNewOwnerPin] = useState('1234');
  const [newBookingEnabled, setNewBookingEnabled] = useState(true);
  const [newBookingPrice, setNewBookingPrice] = useState('150');
  const [newBookingTitle, setNewBookingTitle] = useState('كشف / حجز موعد');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80');
  const [newVideo, setNewVideo] = useState('');
  const [publishDirectly, setPublishDirectly] = useState(true);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Edit modal
  const [editingBiz, setEditingBiz] = useState<Business | null>(null);

  // Pending submissions
  const [submissions, setSubmissions] = useState<PendingAdSubmission[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSubmissions(getPendingAdSubmissions());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const u = usernameInput.trim().toLowerCase();
    const p = passwordInput.trim();
    const savedAdminPass = getLatestAdminPin();

    // Allow General Manager (Admin) login directly ONLY with the latest Admin password
    if ((u === 'admin' || u === 'المدير' || u === 'مدير' || u === 'ادمن') && p === savedAdminPass) {
      setIsManagerMode(true);
      setCurrentStaff({
        id: 'manager_master',
        staffNumber: 1,
        name: 'المدير العام (الأدمن الرئيسي)',
        username: 'admin',
        password: savedAdminPass,
        pin: savedAdminPass,
        shiftHours: '24 ساعة - تحكم كامل',
        isActive: true,
        isHidden: false,
        workOrderActive: true,
        assignedTask: 'تحكم كامل في النشر، المساعدين، والمشتركين',
        permissions: {
          canReviewAds: true,
          canInputData: true,
          canEdit: true,
          canAdd: true,
          canDelete: true,
          canHide: true,
          canApproveReject: true,
          canBlockDisableSubscribers: true,
          canReviewMedia: true,
        },
        createdAt: Date.now(),
      });
      return;
    }

    const res = authenticateStaff(usernameInput, passwordInput);
    if (!res.success || !res.staff) {
      setAuthError(res.error || 'فشل تسجيل الدخول');
      return;
    }

    setIsManagerMode(false);
    setCurrentStaff(res.staff);
    setAuthError('');
  };

  const handleQuickSelectStaff = (staffNumber: number) => {
    const list = getStaffMembers();
    const st = list.find((s) => s.staffNumber === staffNumber);
    if (st) {
      setUsernameInput(st.username);
      setPasswordInput('');
      setAuthError('');
    }
  };

  const handleLogout = () => {
    setCurrentStaff(null);
    setIsManagerMode(false);
    setUsernameInput('');
    setPasswordInput('');
    setAuthError('');
  };

  // Manual Status Control: Approve (موافق/إظهار), Reject/Disable (غير موافق/تعطيل), Hide (إخفاء), Block (حجب), Delete (حذف)
  const handleSetBusinessStatus = (biz: Business, newStatus: 'active' | 'hidden' | 'flagged' | 'expired', label: string) => {
    const updated = businesses.map((b) =>
      b.id === biz.id
        ? {
            ...b,
            status: newStatus,
            pendingAdminApproval: newStatus === 'active' ? false : b.pendingAdminApproval,
            approvedByAdminAt: newStatus === 'active' ? Date.now() : b.approvedByAdminAt,
          }
        : b
    );
    onUpdateBusinesses(updated);
    showToast(`✅ تم تحديث حالة "${biz.name}" إلى: ${label}`);
  };

  const handleDeleteBusinessManual = (biz: Business) => {
    if (!currentStaff?.permissions.canDelete && !isManagerMode) {
      showToast('⚠️ ليس لديك صلاحية الحذف النهائي - راجع المدير العام');
      return;
    }
    const updated = businesses.filter((b) => b.id !== biz.id);
    onUpdateBusinesses(updated);
    showToast(`🗑️ تم حذف "${biz.name}" يدوياً بنجاح`);
  };

  // Media Moderation: Delete image or video manually
  const handleDeleteMediaItem = (biz: Business, type: 'image' | 'video', index: number) => {
    const updated = businesses.map((b) => {
      if (b.id !== biz.id) return b;
      if (type === 'image') {
        const nextImages = (b.images || []).filter((_, i) => i !== index);
        return { ...b, images: nextImages.length > 0 ? nextImages : ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'] };
      } else {
        const nextVideos = (b.videos || []).filter((_, i) => i !== index);
        return { ...b, videos: nextVideos };
      }
    });
    onUpdateBusinesses(updated);
    showToast(`🗑️ تم حذف ${type === 'image' ? 'الصورة' : 'الفيديو'} من إعلان "${biz.name}" بنجاح`);
  };

  // Media Moderation: Add image or video URL manually
  const handleAddMediaItem = (biz: Business) => {
    const url = (mediaUrlInput[String(biz.id)] || '').trim();
    if (!url) return;
    const type = mediaTypeInput[String(biz.id)] || 'image';

    const updated = businesses.map((b) => {
      if (b.id !== biz.id) return b;
      if (type === 'image') {
        return { ...b, images: [url, ...(b.images || [])] };
      } else {
        return { ...b, videos: [url, ...(b.videos || [])] };
      }
    });
    onUpdateBusinesses(updated);
    setMediaUrlInput({ ...mediaUrlInput, [String(biz.id)]: '' });
    showToast(`✅ تم إضافة ${type === 'image' ? 'صورة جديدة' : 'فيديو جديد'} لإعلان "${biz.name}" يدوياً`);
  };

  // Approve or Reject pending submission directly if assistant has canApproveReject or isManagerMode
  const handleDecisionOnSubmission = (subId: string, approve: boolean) => {
    if (!currentStaff?.permissions.canApproveReject && !isManagerMode) {
      showToast('⚠️ صلاحية الموافقة النهائية للمدير أو المساعد المختص فقط');
      return;
    }
    if (approve) {
      const res = approveAdSubmission(subId);
      const sub = res.submission;
      if (res.success && sub) {
        const newBiz: Business = {
          id: sub.businessData.id || `biz_${Date.now()}`,
          name: sub.businessData.name || 'مشترك جديد',
          cat: sub.businessData.cat || 'مطاعم',
          city: sub.businessData.city || 'القاهرة',
          addr: sub.businessData.addr || '',
          phone: sub.businessData.phone || '01000000000',
          hotline: sub.businessData.hotline,
          phones: sub.businessData.phones || [sub.businessData.phone || '01000000000'],
          bio: sub.businessData.bio || '',
          hours: sub.businessData.hours || '09:00 ص - 11:00 م',
          images: sub.businessData.images || ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'],
          videos: sub.businessData.videos || [],
          status: 'active',
          pendingAdminApproval: false,
          bookingEnabled: sub.businessData.bookingEnabled ?? true,
          bookingPrice: sub.businessData.bookingPrice ?? 150,
          bookingServiceTitle: sub.businessData.bookingServiceTitle || 'حجز موعد',
          bookingSlotDurationMinutes: 30,
          verified: 1,
          pkg: 0,
          expiry: Date.now() + 90 * 86400000,
          services: sub.businessData.services || [{ n: sub.businessData.bookingServiceTitle || 'خدمة أساسية', p: String(sub.businessData.bookingPrice || 150) }],
          ownerPin: sub.businessData.ownerPin || '1234',
          likes: 15,
        };
        onUpdateBusinesses([newBiz, ...businesses]);
        showToast(`✅ موافق: تم اعتماد ونشر "${newBiz.name}" للجمهور!`);
      }
    } else {
      rejectAdSubmission(subId, 'غير موافق - تم الرفض من الرقابة');
      showToast('🚫 غير موافق: تم رفض الطلب وإيقاف نشره');
    }
    setSubmissions(getPendingAdSubmissions());
  };

  // Submit or directly publish new subscriber
  const handleAddNewAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) return;

    if (!currentStaff.permissions.canAdd && !currentStaff.permissions.canInputData && !isManagerMode) {
      showToast('⚠️ ليس لديك صلاحية إضافة مشتركين. راجع المدير العام.');
      return;
    }

    const priceNum = parseFloat(newBookingPrice) || 0;
    const newBizId = `biz_${Date.now()}`;

    const newBizObj: Business = {
      id: newBizId,
      name: newName.trim(),
      cat: newCat,
      city: newCity,
      addr: newAddress.trim(),
      phone: newPhone.trim(),
      hotline: newHotline.trim() || undefined,
      phones: [newPhone.trim(), newHotline.trim()].filter(Boolean),
      bio: newBio.trim() || `أهلاً بكم في ${newName.trim()} - نسعد بخدمتكم وتقديم أفضل العروض والخدمات.`,
      hours: newHours.trim(),
      images: [newImage.trim() || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'],
      videos: newVideo.trim() ? [newVideo.trim()] : [],
      status: publishDirectly && (currentStaff.permissions.canApproveReject || isManagerMode) ? 'active' : 'pending',
      pendingAdminApproval: !(publishDirectly && (currentStaff.permissions.canApproveReject || isManagerMode)),
      bookingEnabled: newBookingEnabled,
      bookingPrice: priceNum,
      bookingServiceTitle: newBookingTitle,
      bookingSlotDurationMinutes: 30,
      verified: 1,
      pkg: 0,
      expiry: Date.now() + 90 * 86400000,
      services: [{ n: newBookingTitle || 'السعر الأساسي', p: String(priceNum || 150) }],
      ownerPin: newOwnerPin.trim() || '1234',
      submittedByStaffId: currentStaff.id,
      submittedAt: Date.now(),
      likes: 12,
    };

    if (publishDirectly && (currentStaff.permissions.canApproveReject || isManagerMode)) {
      onUpdateBusinesses([newBizObj, ...businesses]);
      setSubmitFeedback(`✅ تم إضافة المشترك "${newBizObj.name}" ونشره يدوياً فوراً بالمنصة (باسورد المشترك: ${newBizObj.ownerPin})!`);
    } else {
      submitForAdminApproval({
        businessId: newBizId,
        type: 'new_ad',
        submittedByStaffId: currentStaff.id,
        submittedByStaffName: currentStaff.name,
        staffNumber: currentStaff.staffNumber,
        businessData: newBizObj,
        changesSummary: `إضافة مشترك جديد يدوياً بواسطة ${currentStaff.name}`,
      });
      setSubmissions(getPendingAdSubmissions());
      setSubmitFeedback('✅ تم رفع المشترك الجديد لطابور موافقة الإدارة والرقابة بنجاح!');
    }

    setNewName('');
    setNewAddress('');
    setNewPhone('');
    setNewHotline('');
    setNewBio('');

    setTimeout(() => {
      setSubmitFeedback(null);
    }, 3500);
  };

  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery) ||
      (b.hotline && b.hotline.includes(searchQuery));
    const matchesCat = categoryFilter === 'الكل' || b.cat === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && b.status === 'active') ||
      (statusFilter === 'hidden' && b.status === 'hidden') ||
      (statusFilter === 'flagged' && (b.status === 'flagged' || b.status === 'expired' || b.status === 'pending'));
    return matchesSearch && matchesCat && matchesStatus;
  });

  const staffMembersList = getStaffMembers();
  const primaryFourAssistants = staffMembersList.slice(0, 4);

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-[#121218] border border-white/15 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto text-white">
        
        {/* Toast inside modal */}
        {actionToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000] bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs font-black shadow-2xl border border-white/30 animate-bounce">
            {actionToast}
          </div>
        )}

        {/* Top Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-white">
                  بوابة المدير والـ 4 مساعدين للرقابة على النشر والاشتراك
                </h2>
                <span className="text-[10px] bg-amber-400 text-black px-2.5 py-0.5 rounded-full font-black">
                  موافق / غير موافق • حجب • تعطيل • إظهار • تعديل يدوي شامل
                </span>
              </div>
              <p className="text-[11px] text-white/65 mt-0.5">
                إضافة مشتركين يدوياً • الرقابة على الإعلانات والصور والفيديوهات • تعديل وحذف وإضافة أي شيء يدوياً بباسورد خاص لكل مساعد والمدير
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!currentStaff ? (
          /* LOGIN SCREEN WITH MANAGER + 4 PRIMARY ASSISTANTS */
          <div className="p-5 sm:p-8 overflow-y-auto max-w-3xl mx-auto w-full flex flex-col items-center">
            <div className="w-14 h-14 rounded-3xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-blue-400" />
            </div>

            <h3 className="text-lg sm:text-xl font-black mb-1 text-center">
              تسجيل دخول المدير العام أو أحد المساعدين الـ 4 للرقابة
            </h3>
            <p className="text-xs text-white/60 text-center mb-5 max-w-lg">
              أدخل الباسورد الخاص بالمدير العام أو اختر أحد المساعدين الـ 4 بالأسفل للدخول إلى لوحة الرقابة والموافقة على النشر والاشتراك والتعديل اليدوي.
            </p>

            {authError && (
              <div className="w-full mb-4 p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="font-semibold leading-relaxed">{authError}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="w-full max-w-md space-y-3.5 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1">اسم المستخدم (المدير أو المساعد 1 - 4):</label>
                <div className="relative">
                  <User className="w-4 h-4 text-white/40 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="admin أو staff1 أو staff2 أو staff3 أو staff4"
                    className="w-full bg-black/50 border border-white/15 rounded-xl py-2.5 ps-10 pe-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">الباسورد / الرقم السري (Password / PIN):</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="أدخل الباسورد السري"
                    className="w-full bg-black/50 border border-amber-500/40 rounded-xl py-2.5 ps-10 pe-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition text-center tracking-widest font-mono font-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>دخول لوحة الرقابة والتحكم الفوري</span>
              </button>
            </form>

            {/* Quick Selection Cards for Manager + 4 Primary Assistants */}
            <div className="w-full mt-6 pt-5 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs font-black text-amber-300">
                  🔑 اختيار سريع (المدير العام + الـ 4 مساعدين للرقابة على النشر والاشتراك):
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setUsernameInput('admin');
                    setPasswordInput('');
                    setAuthError('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-xs shadow cursor-pointer"
                >
                  👑 اختيار المدير العام (أدخل الباسورد الأخير)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {primaryFourAssistants.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleQuickSelectStaff(st.staffNumber)}
                    className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                      st.isActive && st.workOrderActive
                        ? 'bg-white/5 border-blue-500/30 text-white hover:bg-blue-600/20 hover:border-blue-400'
                        : 'bg-red-950/20 border-red-500/20 text-red-300/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-black text-xs text-cyan-300">
                        مساعد {st.staffNumber}: {st.name}
                      </span>
                      <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                        يوزر: {st.username} | 🔒 بالباسورد الأخير فقط
                      </span>
                    </div>
                    <p className="text-[11px] text-white/75 font-bold">
                      📋 المهمة: {st.assignedTask || 'الرقابة على النشر والاشتراك والتعديل اليدوي'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* LOGGED IN WORKSPACE */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Staff Info Banner */}
            <div className="p-3 sm:p-4 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center font-black text-sm text-white shadow">
                  {isManagerMode ? '👑' : currentStaff.staffNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm sm:text-base text-white">{currentStaff.name}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      {isManagerMode ? 'صلاحية المدير العام الشاملة ✓' : 'أمر تشغيل وصلاحيات مفعلة ✓ (معزول عن باقي المستخدمين)'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-300 font-bold mt-0.5">
                    أوامرك الخاصة بك فقط: {currentStaff.assignedTaskTitle || currentStaff.assignedTask || 'الرقابة على النشر والاشتراك والتعديل اليدوي'}
                  </p>
                </div>
              </div>

              {/* إظهار باسورد المستخدم في صفحة المستخدمين والأدمن */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-black/60 border border-amber-400/50 rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <span className="text-[11px] font-black text-amber-300">
                    🔑 باسورد المستخدم ({currentStaff.username}):
                  </span>
                  <span className="font-mono font-black text-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-lg tracking-widest">
                    {showLoggedInPass ? currentStaff.password : '••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLoggedInPass(!showLoggedInPass)}
                    className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded-md font-bold cursor-pointer"
                  >
                    {showLoggedInPass ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 border border-red-500/30 text-red-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل خروج</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="p-2.5 bg-black/50 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <button
                onClick={() => setActiveTab('moderation')}
                className={`py-2 px-3.5 rounded-xl font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'moderation'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white bg-white/5'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>الرقابة على النشر والاشتراك (موافق / حجب / تعطيل / إظهار) ({businesses.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('media_control')}
                className={`py-2 px-3.5 rounded-xl font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'media_control'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white bg-white/5'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>الرقابة على الصور والفيديوهات (حذف وإضافة يدوي)</span>
              </button>

              <button
                onClick={() => setActiveTab('add_ad')}
                className={`py-2 px-3.5 rounded-xl font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'add_ad'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white bg-white/5'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة مشتركين وإعلانات يدوياً</span>
              </button>

              <button
                onClick={() => setActiveTab('edit_ad')}
                className={`py-2 px-3.5 rounded-xl font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'edit_ad'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white bg-white/5'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل وحذف أي شيء يدوياً</span>
              </button>

              <button
                onClick={() => setActiveTab('my_submissions')}
                className={`py-2 px-3.5 rounded-xl font-black transition flex items-center gap-1.5 shrink-0 relative cursor-pointer ${
                  activeTab === 'my_submissions'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-white/70 hover:text-white bg-white/5'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>طلبات الاشتراك والنشر ({submissions.filter((s) => s.status === 'pending').length})</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
              
              {/* TAB 1: MODERATION & SUBSCRIPTION CONTROL (موافق / غير موافق / حجب / تعطيل / إظهار / تعديل / حذف) */}
              {activeTab === 'moderation' && (
                <div className="space-y-4">
                  {/* Search & Status Filters */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-white/40 absolute start-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بالاسم، المدينة، أو رقم التليفون..."
                        className="w-full bg-white/5 border border-white/15 rounded-xl py-2 ps-9 pe-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/70'}`}
                      >
                        الكل ({businesses.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-emerald-300'}`}
                      >
                        موافق وظاهر ({businesses.filter((b) => b.status === 'active').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('hidden')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${statusFilter === 'hidden' ? 'bg-amber-500 text-black' : 'bg-white/5 text-amber-300'}`}
                      >
                        مخفي ({businesses.filter((b) => b.status === 'hidden').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('flagged')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${statusFilter === 'flagged' ? 'bg-red-600 text-white' : 'bg-white/5 text-red-300'}`}
                      >
                        محجوب / غير موافق ({businesses.filter((b) => b.status === 'flagged' || b.status === 'expired').length})
                      </button>
                    </div>
                  </div>

                  {/* Business Control Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredBusinesses.map((b) => (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                          b.status === 'active'
                            ? 'bg-white/5 border-white/10'
                            : b.status === 'hidden'
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : 'bg-red-950/25 border-red-500/40'
                        }`}
                      >
                        <div className="flex gap-3">
                          <img
                            src={b.images?.[0] || b.poster || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200'}
                            alt={b.name}
                            className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h4 className="font-black text-sm truncate text-white">{b.name}</h4>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                                  b.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : b.status === 'hidden'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}
                              >
                                {b.status === 'active'
                                  ? '✓ موافق وظاهر'
                                  : b.status === 'hidden'
                                  ? '👁️ مخفي مؤقتاً'
                                  : '🚫 محجوب / غير موافق'}
                              </span>
                            </div>

                            <div className="text-[11px] text-white/65 space-y-0.5">
                              <p className="truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-400" /> {b.city} - {b.addr} ({b.cat})
                              </p>
                              <p className="flex items-center gap-2 text-emerald-400 font-mono flex-wrap">
                                <span>📞 {b.phone}</span>
                                {isManagerMode || b.submittedByStaffId === currentStaff.id ? (
                                  <span className="text-amber-300">🔑 باسورد الصفحة: {getLatestSubscriberPin(b)}</span>
                                ) : (
                                  <span className="text-white/40 text-[10px]">🔒 باسورد المشترك معزول</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Direct Control Buttons: موافق/إظهار | غير موافق/تعطيل | حجب | إخفاء | تعديل يدوي | حذف */}
                        <div className="pt-2.5 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleSetBusinessStatus(b, 'active', 'موافق وظاهر للجمهور')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition flex items-center gap-1 cursor-pointer shadow"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>موافق / إظهار</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetBusinessStatus(b, 'flagged', 'غير موافق / محجوب')}
                            className="px-2.5 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600 border border-red-500/40 text-red-200 hover:text-white text-[11px] font-black transition flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>غير موافق / حجب</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetBusinessStatus(b, 'expired', 'معطل / موقوف الاشتراك')}
                            className="px-2.5 py-1.5 rounded-xl bg-orange-600/30 hover:bg-orange-600 border border-orange-500/40 text-orange-200 hover:text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            <span>⏸️ تعطيل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleSetBusinessStatus(
                                b,
                                b.status === 'hidden' ? 'active' : 'hidden',
                                b.status === 'hidden' ? 'ظاهر للجمهور' : 'مخفي عن الجمهور'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 text-amber-300 hover:text-black text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            {b.status === 'hidden' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{b.status === 'hidden' ? 'إظهار' : 'إخفاء'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingBiz(b)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black transition flex items-center gap-1 cursor-pointer ms-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل يدوي</span>
                          </button>

                          {(currentStaff.permissions.canDelete || isManagerMode) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBusinessManual(b)}
                              className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white transition cursor-pointer"
                              title="حذف المشترك والإعلان يدوياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: MEDIA MODERATION (الرقابة على الصور والفيديوهات حذف وإضافة وتعديل يدوي) */}
              {activeTab === 'media_control' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-bold flex items-center justify-between flex-wrap gap-2">
                    <span>🎬 الرقابة اليدوية على الصور والفيديوهات: يمكنك حذف أي صورة أو فيديو مخالف أو إضافة رابط صورة/فيديو جديد لأي مشترك يدوياً.</span>
                  </div>

                  <div className="space-y-3">
                    {filteredBusinesses.map((b) => (
                      <div key={b.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <h4 className="font-black text-sm text-white">{b.name}</h4>
                            <span className="text-[11px] text-white/50">{b.cat} • {b.city}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingBiz(b)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل كامل للإعلان والوسائط</span>
                          </button>
                        </div>

                        {/* Images Grid */}
                        <div>
                          <p className="text-[11px] font-bold text-amber-300 mb-1.5">الصور الحالية ({b.images?.length || 0}):</p>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {(b.images || []).map((img, idx) => (
                              <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-white/15 shrink-0">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMediaItem(b, 'image', idx)}
                                  className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-red-400 text-[10px] font-black transition cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mb-0.5" />
                                  <span>حذف الصورة</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Videos List */}
                        {(b.videos || []).length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-cyan-300 mb-1.5">الفيديوهات الحالية ({b.videos?.length || 0}):</p>
                            <div className="flex flex-wrap gap-2">
                              {(b.videos || []).map((vid, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-black/50 border border-white/15 px-3 py-1.5 rounded-xl text-xs">
                                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                                  <span className="truncate max-w-[180px] font-mono text-[10px]">{vid}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMediaItem(b, 'video', idx)}
                                    className="text-red-400 hover:text-red-300 font-bold flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick Manual Add Image or Video */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
                          <select
                            value={mediaTypeInput[String(b.id)] || 'image'}
                            onChange={(e) => setMediaTypeInput({ ...mediaTypeInput, [String(b.id)]: e.target.value as 'image' | 'video' })}
                            className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                          >
                            <option value="image">🖼️ إضافة صورة</option>
                            <option value="video">🎬 إضافة فيديو</option>
                          </select>
                          <input
                            type="url"
                            value={mediaUrlInput[String(b.id)] || ''}
                            onChange={(e) => setMediaUrlInput({ ...mediaUrlInput, [String(b.id)]: e.target.value })}
                            placeholder="ألصق رابط الصورة أو الفيديو لإضافته يدوياً..."
                            className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddMediaItem(b)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة يدوياً</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MANUAL ADD SUBSCRIBER */}
              {activeTab === 'add_ad' && (
                <div className="max-w-2xl mx-auto space-y-4">
                  {submitFeedback && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold leading-relaxed">
                      {submitFeedback}
                    </div>
                  )}

                  <form onSubmit={handleAddNewAd} className="space-y-4 bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h4 className="font-black text-sm text-white">إضافة مشترك / إعلان جديد يدوياً:</h4>
                      <label className="flex items-center gap-2 text-xs font-bold text-emerald-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={publishDirectly}
                          onChange={(e) => setPublishDirectly(e.target.checked)}
                          className="rounded accent-emerald-500"
                        />
                        <span>موافق ونشر مباشر بالمنصة ✓</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white/70 font-bold mb-1">اسم المشترك أو النشاط *</label>
                        <input
                          type="text"
                          required
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="مثال: مطعم السرايا الملكي"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-white/70 font-bold mb-1">التصنيف *</label>
                        <select
                          value={newCat}
                          onChange={(e) => setNewCat(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="مطاعم">مطاعم</option>
                          <option value="كافيهات">كافيهات</option>
                          <option value="أطباء وعيادات">أطباء وعيادات</option>
                          <option value="فنادق ومنتجعات">فنادق ومنتجعات</option>
                          <option value="للبيع">عقارات ومعروض للبيع</option>
                          <option value="تاكسي وأجرة">تاكسي وأجرة</option>
                          <option value="موتوسيكل ودليفري">موتوسيكل ودليفري</option>
                          <option value="حرفيين وصيانة منزلية">حرفيين وصيانة منزلية</option>
                          <option value="خبراء">خبراء ومستشارون</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-white/70 font-bold mb-1">المدينة / المحافظة *</label>
                        <input
                          type="text"
                          required
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          placeholder="القاهرة"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-white/70 font-bold mb-1">العنوان التفصيلي *</label>
                        <input
                          type="text"
                          required
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          placeholder="الحي والشارع"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-white/70 font-bold mb-1">رقم التليفون والواتساب *</label>
                        <input
                          type="tel"
                          required
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="010XXXXXXXX"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-amber-300 font-bold mb-1">باسورد صفحة المشترك (PIN) *</label>
                        <input
                          type="text"
                          required
                          value={newOwnerPin}
                          onChange={(e) => setNewOwnerPin(e.target.value)}
                          placeholder="1234"
                          className="w-full bg-black/40 border border-amber-500/40 rounded-xl p-2.5 text-xs text-amber-300 font-mono font-black text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-white/70 font-bold mb-1">رابط الصورة الرئيسية</label>
                        <input
                          type="url"
                          value={newImage}
                          onChange={(e) => setNewImage(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-white/70 font-bold mb-1">رابط الفيديو الإعلاني (اختياري)</label>
                        <input
                          type="url"
                          value={newVideo}
                          onChange={(e) => setNewVideo(e.target.value)}
                          placeholder="https://...mp4"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-white/70 font-bold mb-1">تفاصيل ونص الإعلان</label>
                      <textarea
                        rows={2}
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        placeholder="وصف النشاط والعروض والأسعار..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>إضافة المشترك وحفظ البيانات الآن</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: FULL MANUAL EDIT & DELETE OF ANY SUBSCRIBER */}
              {activeTab === 'edit_ad' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {businesses.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">{b.name}</h4>
                          <p className="text-xs text-white/50">{b.city} • {b.cat}</p>
                          <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                            هاتف: {b.phone} | باسورد الصفحة: {b.ownerPin || '1234'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setEditingBiz(b)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل شامل</span>
                          </button>
                          {(currentStaff.permissions.canDelete || isManagerMode) && (
                            <button
                              onClick={() => handleDeleteBusinessManual(b)}
                              className="p-1.5 rounded-xl bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white transition cursor-pointer"
                              title="حذف يدوي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SUBMISSIONS QUEUE WITH APPROVE / REJECT (موافق / غير موافق) */}
              {activeTab === 'my_submissions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-white">طلبات النشر والاشتراك (موافق أو غير موافق):</h4>
                    <span className="text-xs text-white/60">إجمالي الطلبات: {submissions.length}</span>
                  </div>

                  {submissions.filter((sub) => isManagerMode || sub.submittedByStaffId === currentStaff.id).length === 0 ? (
                    <div className="p-8 text-center text-white/40 text-xs">
                      لا توجد طلبات خاصة بك حالياً (أوامر وطلبات باقي المستخدمين معزولة).
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissions
                        .filter((sub) => isManagerMode || sub.submittedByStaffId === currentStaff.id)
                        .map((sub) => (
                        <div
                          key={sub.id}
                          className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-bold text-sm text-white">
                                {sub.businessData.name || 'إعلان'}
                              </h5>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  sub.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : sub.status === 'rejected'
                                    ? 'bg-red-500/20 text-red-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {sub.status === 'approved'
                                  ? '✓ موافق (تم النشر)'
                                  : sub.status === 'rejected'
                                  ? '✕ غير موافق (مرفوض)'
                                  : '⏳ بانتظار القرار'}
                              </span>
                            </div>
                            <p className="text-xs text-white/60">{sub.changesSummary}</p>
                          </div>

                          {sub.status === 'pending' && (currentStaff.permissions.canApproveReject || isManagerMode) && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDecisionOnSubmission(sub.id, true)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>موافق ونشر ✓</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDecisionOnSubmission(sub.id, false)}
                                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>غير موافق ✕</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Modal footer */}
        <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-between text-xs text-white/50 shrink-0">
          <span>منظومة الرقابة الإدارية والموافقة على النشر والاشتراك • إعلانك</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>

      {/* AdminEditSubscriberModal for full manual editing */}
      {editingBiz && (
        <AdminEditSubscriberModal
          business={editingBiz}
          onClose={() => setEditingBiz(null)}
          onSave={(updatedBiz) => {
            const updatedList = businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b));
            onUpdateBusinesses(updatedList);
            setEditingBiz(null);
            showToast(`✅ تم حفظ التعديلات اليدوية لـ "${updatedBiz.name}" بنجاح!`);
          }}
          lang={lang}
        />
      )}
    </div>
  );
};
