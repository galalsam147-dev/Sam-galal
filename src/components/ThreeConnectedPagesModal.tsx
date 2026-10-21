import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Shield, Lock, Unlock, Users, UserCheck, Store, Eye, EyeOff,
  KeyRound, CheckCircle2, Copy, Check, Navigation, ShoppingBag,
  Calendar, Phone, MapPin, Edit3, PlusCircle, Send, LogOut,
  Sparkles, Radio, ArrowLeftRight
} from 'lucide-react';
import { Business, DeliveryOrder, StaffMember, SupportedLang, UserProfile } from '../types';
import { SavedBooking } from './UserBookingsModal';
import {
  getLatestAdminPin,
  setLatestAdminPin,
  getLatestSubscriberPin,
  setLatestSubscriberPin,
  verifySubscriberOrAdminPin,
  getIsolatedCustomers,
  saveIsolatedCustomer,
  setLatestUserPin,
  verifyUserOrAdminPin,
  IsolatedCustomerAccount,
} from '../utils/passwordSecurity';
import {
  getStaffMembers,
  authenticateStaff,
  updateStaffMember,
} from '../utils/staffManager';

export type ThreePagesTabType = 'page1_users_admin' | 'page2_customers' | 'page3_subscribers' | 'public_ads_tracking';

interface ThreeConnectedPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: 1 | 2 | 3 | 'public';
  initialTab?: ThreePagesTabType;
  businesses: Business[];
  onUpdateBusinesses: (updated: Business[]) => void;
  orders: DeliveryOrder[];
  onPlaceOrder?: (order: DeliveryOrder) => void;
  onUpdateOrders: (updated: DeliveryOrder[]) => void;
  bookings: SavedBooking[];
  onAddBooking?: (booking: SavedBooking) => void;
  onUpdateBookings?: (updated: SavedBooking[]) => void;
  currentUser?: UserProfile;
  userProfile?: UserProfile;
  onUpdateUser?: (updated: UserProfile) => void;
  onUpdateUserProfile?: (updated: UserProfile) => void;
  onOpenBizModal?: (b: Business) => void;
  onOpenBusiness?: (b: Business) => void;
  onOpenOwnerEditor?: (b: Business) => void;
  onOpenSubscriberEditor?: (b: Business) => void;
  onOpenSubscriberDashboard?: (b: Business) => void;
  onOpenLiveTracking: (b?: Business) => void;
  onOpenAdminFullModal?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenAssistantPortal?: () => void;
  onShowToast?: (msg: string) => void;
  lang?: SupportedLang;
}

function resolveTabToPage(tab?: ThreePagesTabType, fallbackPage: 1 | 2 | 3 | 'public' = 1): 1 | 2 | 3 | 'public' {
  if (tab === 'page1_users_admin') return 1;
  if (tab === 'page2_customers') return 2;
  if (tab === 'page3_subscribers') return 3;
  if (tab === 'public_ads_tracking') return 'public';
  return fallbackPage;
}

export const ThreeConnectedPagesModal: React.FC<ThreeConnectedPagesModalProps> = ({
  isOpen,
  onClose,
  initialPage = 1,
  initialTab,
  businesses,
  onUpdateBusinesses,
  orders,
  onUpdateOrders,
  bookings,
  currentUser: currentUserProp,
  userProfile,
  onUpdateUser: onUpdateUserProp,
  onUpdateUserProfile,
  onOpenBizModal: onOpenBizModalProp,
  onOpenBusiness,
  onOpenOwnerEditor: onOpenOwnerEditorProp,
  onOpenSubscriberEditor,
  onOpenSubscriberDashboard: onOpenSubscriberDashboardProp,
  onOpenLiveTracking,
  onOpenAdminFullModal: onOpenAdminFullModalProp,
  onOpenAdminDashboard,
}) => {
  const currentUser = (currentUserProp || userProfile)!;
  const onUpdateUser = onUpdateUserProp || onUpdateUserProfile || (() => {});
  const onOpenBizModal = onOpenBizModalProp || onOpenBusiness || (() => {});
  const onOpenOwnerEditor = onOpenOwnerEditorProp || onOpenSubscriberEditor || (() => {});
  const onOpenSubscriberDashboard = onOpenSubscriberDashboardProp || onOpenOwnerEditor || (() => {});
  const onOpenAdminFullModal = onOpenAdminFullModalProp || onOpenAdminDashboard || (() => {});

  const [activePage, setActivePage] = useState<1 | 2 | 3 | 'public'>(() =>
    resolveTabToPage(initialTab, initialPage)
  );
  const [toast, setToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActivePage(resolveTabToPage(initialTab, initialPage));
    }
  }, [isOpen, initialTab, initialPage]);

  // ============================================================================
  // PAGE 1 STATE: صفحة المستخدمين والأدمن (1)
  // ============================================================================
  const [p1Mode, setP1Mode] = useState<'login' | 'admin_unlocked' | 'staff_unlocked'>('login');
  const [p1Username, setP1Username] = useState('admin');
  const [p1PassInput, setP1PassInput] = useState('');
  const [p1ShowLoginPass, setP1ShowLoginPass] = useState(false);
  const [p1Error, setP1Error] = useState('');
  const [loggedInStaff, setLoggedInStaff] = useState<StaffMember | null>(null);
  const [showOwnPassP1, setShowOwnPassP1] = useState(true); // إظهار باسورد المستخدم في صفحة المستخدمين والأدمن
  const [newPassP1, setNewPassP1] = useState('');
  const [staffList, setStaffList] = useState<StaffMember[]>(() => getStaffMembers());
  const [showAllPinsInAdmin, setShowAllPinsInAdmin] = useState<Record<string, boolean>>({});

  // ============================================================================
  // PAGE 2 STATE: الصفحة الثانية العملاء (2)
  // ============================================================================
  const [customersList, setCustomersList] = useState<IsolatedCustomerAccount[]>(() => getIsolatedCustomers());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => customersList[0]?.id || 'usr_guest_e3lanak');
  const [p2PassInput, setP2PassInput] = useState('');
  const [p2ShowLoginPass, setP2ShowLoginPass] = useState(false);
  const [p2UnlockedCustomer, setP2UnlockedCustomer] = useState<IsolatedCustomerAccount | null>(null);
  const [p2Error, setP2Error] = useState('');
  const [showCustomerOwnPass, setShowCustomerOwnPass] = useState(true); // إظهار باسورد العميل في صفحته
  const [newCustomerPass, setNewCustomerPass] = useState('');
  // Quick register new isolated customer
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
  const [regCustName, setRegCustName] = useState('');
  const [regCustPhone, setRegCustPhone] = useState('');
  const [regCustCity, setRegCustCity] = useState('القاهرة');
  const [regCustPin, setRegCustPin] = useState('');
  // Quick send order from Customer (Page 2) to Subscriber (Page 3)
  const [quickOrderBizId, setQuickOrderBizId] = useState<string | number>(businesses[0]?.id || 1);
  const [quickOrderItem, setQuickOrderItem] = useState('');
  const [quickOrderPrice, setQuickOrderPrice] = useState('250');
  const [quickOrderAddr, setQuickOrderAddr] = useState('');

  // ============================================================================
  // PAGE 3 STATE: الصفحة الثالثة المشتركين (3)
  // ============================================================================
  const [selectedSubBizId, setSelectedSubBizId] = useState<string | number>(businesses[0]?.id || 1);
  const [p3PassInput, setP3PassInput] = useState('');
  const [p3ShowLoginPass, setP3ShowLoginPass] = useState(false);
  const [p3UnlockedBizId, setP3UnlockedBizId] = useState<string | number | null>(null);
  const [p3Error, setP3Error] = useState('');
  const [showSubOwnPass, setShowSubOwnPass] = useState(true); // إظهار باسورد المشترك داخل صفحته
  const [newSubPass, setNewSubPass] = useState('');
  const [subSearchQuery, setSubSearchQuery] = useState('');

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToastMsg('تم نسخ الباسورد / الكود بنجاح 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- PAGE 1 HANDLERS ---
  const handleP1Login = (e: React.FormEvent) => {
    e.preventDefault();
    setP1Error('');
    const u = p1Username.trim().toLowerCase();
    const p = p1PassInput.trim();
    const latestAdminPin = getLatestAdminPin();

    if ((u === 'admin' || u === 'المدير' || u === 'مدير' || u === 'ادمن') && p === latestAdminPin) {
      setP1Mode('admin_unlocked');
      setLoggedInStaff(null);
      setP1PassInput('');
      showToastMsg('✅ تم فتح صفحة الأدمن والمستخدمين بالباسورد الأخير بنجاح!');
      return;
    }

    const res = authenticateStaff(p1Username, p1PassInput);
    if (res.success && res.staff) {
      setLoggedInStaff(res.staff);
      setP1Mode('staff_unlocked');
      setP1PassInput('');
      showToastMsg(`✅ مرحباً ${res.staff.name} — تم فتح صفحتك وأوامرك المعزولة بباسوردك الخاص!`);
      return;
    }

    setP1Error('❌ الباسورد أو اسم المستخدم غير صحيح! لا تفتح الصفحة إلا بالباسورد الأخير الخاص بك فقط.');
  };

  const handleSaveOwnPassP1 = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPassP1.trim();
    if (clean.length < 3) {
      showToastMsg('⚠️ يرجى إدخال باسورد لا يقل عن 3 حروف أو أرقام');
      return;
    }
    if (p1Mode === 'admin_unlocked') {
      setLatestAdminPin(clean);
      setNewPassP1('');
      showToastMsg('🔒 تم تحديث باسورد الأدمن الأخير وإلغاء أي باسورد سابق فوراً!');
    } else if (p1Mode === 'staff_unlocked' && loggedInStaff) {
      const updatedStaff: StaffMember = { ...loggedInStaff, password: clean, pin: clean };
      updateStaffMember(updatedStaff);
      setLoggedInStaff(updatedStaff);
      setStaffList(getStaffMembers());
      setNewPassP1('');
      showToastMsg('🔒 تم تحديث باسورد المستخدم الخاص بك بنجاح!');
    }
  };

  // --- PAGE 2 HANDLERS (العملاء) ---
  const selectedCustomerObj = customersList.find((c) => c.id === selectedCustomerId) || customersList[0];

  const handleP2Login = (e: React.FormEvent) => {
    e.preventDefault();
    setP2Error('');
    if (!selectedCustomerObj) return;

    if (verifyUserOrAdminPin(selectedCustomerObj.id, p2PassInput)) {
      const freshList = getIsolatedCustomers();
      const freshCust = freshList.find((c) => c.id === selectedCustomerObj.id) || selectedCustomerObj;
      setP2UnlockedCustomer(freshCust);
      setP2PassInput('');
      // Sync currentUser in App so the active customer session is connected
      onUpdateUser({
        ...currentUser,
        id: freshCust.id,
        username: freshCust.username,
        displayName: freshCust.displayName,
        phone: freshCust.phone,
        city: freshCust.city,
      });
      showToastMsg(`✅ مرحباً ${freshCust.displayName}! تم فتح صفحة العميل الخاصة بك (معزولة عن باقي العملاء)`);
    } else {
      setP2Error('❌ باسورد العميل غير صحيح! لا يرى أي عميل صفحة أو أوامر عميل آخر.');
    }
  };

  const handleRegisterNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCustName.trim() || !regCustPhone.trim() || regCustPin.trim().length < 3) {
      showToastMsg('⚠️ يرجى إدخال اسم العميل ورقم الهاتف وباسورد من 3 أرقام أو أكثر');
      return;
    }
    const newCust: IsolatedCustomerAccount = {
      id: `cust_${Date.now()}`,
      username: `@${regCustName.trim().replace(/\s+/g, '_')}`,
      displayName: regCustName.trim(),
      phone: regCustPhone.trim(),
      city: regCustCity.trim() || 'القاهرة',
      pin: regCustPin.trim(),
      createdAt: Date.now(),
    };
    const updated = saveIsolatedCustomer(newCust);
    setCustomersList(updated);
    setSelectedCustomerId(newCust.id);
    setP2UnlockedCustomer(newCust);
    setIsRegisteringCustomer(false);
    setRegCustName('');
    setRegCustPhone('');
    setRegCustPin('');
    onUpdateUser({
      ...currentUser,
      id: newCust.id,
      username: newCust.username,
      displayName: newCust.displayName,
      phone: newCust.phone,
      city: newCust.city,
    });
    showToastMsg(`🎉 تم إنشاء صفحة العميل (${newCust.displayName}) بباسورد خاص ومعزول!`);
  };

  const handleSaveCustomerNewPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p2UnlockedCustomer || newCustomerPass.trim().length < 3) return;
    const clean = newCustomerPass.trim();
    setLatestUserPin(p2UnlockedCustomer.id, clean);
    const updatedCust = { ...p2UnlockedCustomer, pin: clean };
    setP2UnlockedCustomer(updatedCust);
    setCustomersList(getIsolatedCustomers());
    setNewCustomerPass('');
    showToastMsg('🔒 تم تحديث باسورد العميل الأخير بنجاح!');
  };

  const handleSendOrderFromCustomerToSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p2UnlockedCustomer || !quickOrderItem.trim()) return;
    const targetBiz = businesses.find((b) => String(b.id) === String(quickOrderBizId)) || businesses[0];
    if (!targetBiz) return;

    const priceVal = parseFloat(quickOrderPrice) || 200;
    const newOrder: DeliveryOrder = {
      id: `ord_${Date.now()}`,
      orderNumber: `DLK-${Math.floor(1000 + Math.random() * 9000)}`,
      businessId: targetBiz.id,
      businessName: targetBiz.name,
      businessPhone: targetBiz.phone,
      category: 'custom',
      items: [{ name: quickOrderItem.trim(), quantity: 1, estimatedPriceEgp: priceVal }],
      pickupAddress: `${targetBiz.city} - ${targetBiz.addr}`,
      deliveryAddress: quickOrderAddr.trim() || `${p2UnlockedCustomer.city} - عنوان العميل`,
      customerName: p2UnlockedCustomer.displayName,
      customerPhone: p2UnlockedCustomer.phone,
      deliveryFeeEgp: 25,
      itemsSubtotalEgp: priceVal,
      totalEgp: priceVal + 25,
      paymentMethod: 'cash',
      status: 'received',
      statusUpdates: [
        {
          status: 'received',
          time: Date.now(),
          note: `تم إرسال الأمر من صفحة العميل (${p2UnlockedCustomer.displayName}) إلى صفحة المشترك (${targetBiz.name})`,
        },
      ],
      createdAt: Date.now(),
    };

    onUpdateOrders([newOrder, ...orders]);
    setQuickOrderItem('');
    showToastMsg(`🚀 تم إرسال أمر الطلب (${newOrder.orderNumber}) فوراً لصفحة المشترك "${targetBiz.name}" والتتبع المباشر!`);
  };

  // --- PAGE 3 HANDLERS (المشتركين) ---
  const selectedSubBiz = useMemo(
    () => businesses.find((b) => String(b.id) === String(selectedSubBizId)) || businesses[0],
    [businesses, selectedSubBizId]
  );

  const unlockedSubBiz = useMemo(
    () => (p3UnlockedBizId !== null ? businesses.find((b) => String(b.id) === String(p3UnlockedBizId)) || null : null),
    [businesses, p3UnlockedBizId]
  );

  const handleP3Login = (e: React.FormEvent) => {
    e.preventDefault();
    setP3Error('');
    if (!selectedSubBiz) return;

    if (verifySubscriberOrAdminPin(selectedSubBiz, p3PassInput)) {
      setP3UnlockedBizId(selectedSubBiz.id);
      setP3PassInput('');
      showToastMsg(`✅ تم فتح صفحة المشترك (${selectedSubBiz.name}) بالباسورد الأخير فقط! (معزولة عن باقي المشتركين)`);
    } else {
      setP3Error('❌ الباسورد غير صحيح! لا يرى أي مشترك أوامر أو باسورد أو صفحة مشترك آخر.');
    }
  };

  const handleSaveSubNewPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockedSubBiz || newSubPass.trim().length < 4) {
      showToastMsg('⚠️ الباسورد الجديد للمشترك يجب أن يتكون من 4 أرقام أو حروف على الأقل');
      return;
    }
    const clean = newSubPass.trim();
    setLatestSubscriberPin(unlockedSubBiz.id, clean);
    const updatedList = businesses.map((b) =>
      b.id === unlockedSubBiz.id ? { ...b, ownerPin: clean, ownerAccessCode: clean, ownerPageLocked: true } : b
    );
    onUpdateBusinesses(updatedList);
    setNewSubPass('');
    showToastMsg('🔒 تم حفظ الباسورد الأخير لصفحة المشترك وإلغاء أي باسورد قديم فوراً!');
  };

  const handleUpdateOrderStatusBySubscriber = (orderId: string, nextStatus: DeliveryOrder['status'], noteAr: string) => {
    const updated = orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status: nextStatus,
        statusUpdates: [
          ...(o.statusUpdates || []),
          { status: nextStatus, time: Date.now(), note: noteAr },
        ],
      };
    });
    onUpdateOrders(updated);
    showToastMsg(`✅ تم تحديث حالة الأمر إلى "${noteAr}" وسمّع فوراً في صفحة العميل والتتبع!`);
  };

  // Filtered orders & bookings for isolated Customer (Page 2)
  const isolatedCustomerOrders = useMemo(() => {
    if (!p2UnlockedCustomer) return [];
    return orders.filter(
      (o) =>
        o.customerPhone === p2UnlockedCustomer.phone ||
        o.customerName.trim() === p2UnlockedCustomer.displayName.trim()
    );
  }, [orders, p2UnlockedCustomer]);

  const isolatedCustomerBookings = useMemo(() => {
    if (!p2UnlockedCustomer) return [];
    return bookings.filter(
      (bk) =>
        bk.guestPhone === p2UnlockedCustomer.phone ||
        bk.guestName.trim() === p2UnlockedCustomer.displayName.trim()
    );
  }, [bookings, p2UnlockedCustomer]);

  // Filtered orders & bookings for isolated Subscriber (Page 3)
  const isolatedSubscriberOrders = useMemo(() => {
    if (!unlockedSubBiz) return [];
    return orders.filter(
      (o) =>
        String(o.businessId) === String(unlockedSubBiz.id) ||
        o.businessName.trim() === unlockedSubBiz.name.trim()
    );
  }, [orders, unlockedSubBiz]);

  const isolatedSubscriberBookings = useMemo(() => {
    if (!unlockedSubBiz) return [];
    return bookings.filter(
      (bk) =>
        String(bk.businessId) === String(unlockedSubBiz.id) ||
        bk.businessName.trim() === unlockedSubBiz.name.trim()
    );
  }, [bookings, unlockedSubBiz]);

  const filteredSubList = useMemo(() => {
    const q = subSearchQuery.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.cat.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.phone.includes(q)
    );
  }, [businesses, subSearchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-[#101016] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[150] bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs font-black shadow-2xl border border-white/30 animate-bounce">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/60 via-neutral-900 to-blue-950/60 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-[#FF2D55] to-blue-600 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-black text-white">
                  منظومة الـ 3 صفحات المرتبطة + شاشة الجمهور (الإعلانات والتتبع)
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  الكل مرتبطين 🔗 • عزل سري تام 🔒
                </span>
              </div>
              <p className="text-[11px] text-white/70 mt-0.5">
                1. صفحة المستخدمين والأدمن (إظهار باسورد المستخدم والأدمن) • 2. صفحة العملاء • 3. صفحة المشتركين — لا يرى أحد الآخر أوامره وباسورده وصفحته، والجمهور يرى الإعلانات والتتبع المباشر
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Connected Pages + Public Selector Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-neutral-950 border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActivePage(1)}
            className={`p-2.5 rounded-2xl border text-right transition flex flex-col justify-between gap-1 cursor-pointer ${
              activePage === 1
                ? 'bg-gradient-to-br from-amber-500/25 to-blue-600/25 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black bg-amber-400 text-black px-2 py-0.5 rounded-full">
                الصفحة الأولى (1)
              </span>
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs font-black block mt-0.5">صفحة المستخدمين والأدمن</span>
            <span className="text-[10px] text-amber-300 font-bold">
              🔑 إظهار باسورد المستخدم والأدمن
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage(2)}
            className={`p-2.5 rounded-2xl border text-right transition flex flex-col justify-between gap-1 cursor-pointer ${
              activePage === 2
                ? 'bg-gradient-to-br from-sky-500/25 to-emerald-600/25 border-sky-400 text-white shadow-lg shadow-sky-500/10'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black bg-sky-400 text-black px-2 py-0.5 rounded-full">
                الصفحة الثانية (2)
              </span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-xs font-black block mt-0.5">الصفحة الثانية: العملاء</span>
            <span className="text-[10px] text-sky-300 font-bold">
              🔒 كل عميل يرى أوامره وباسورده وصفحته فقط
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage(3)}
            className={`p-2.5 rounded-2xl border text-right transition flex flex-col justify-between gap-1 cursor-pointer ${
              activePage === 3
                ? 'bg-gradient-to-br from-[#FF2D55]/25 to-purple-600/25 border-[#FF2D55] text-white shadow-lg shadow-[#FF2D55]/10'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black bg-[#FF2D55] text-white px-2 py-0.5 rounded-full">
                الصفحة الثالثة (3)
              </span>
              <Store className="w-4 h-4 text-[#FF2D55]" />
            </div>
            <span className="text-xs font-black block mt-0.5">الصفحة الثالثة: المشتركين</span>
            <span className="text-[10px] text-rose-300 font-bold">
              🔒 كل مشترك يرى أوامره وباسورده وصفحته فقط
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('public')}
            className={`p-2.5 rounded-2xl border text-right transition flex flex-col justify-between gap-1 cursor-pointer ${
              activePage === 'public'
                ? 'bg-gradient-to-br from-emerald-500/25 to-teal-600/25 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black bg-emerald-400 text-black px-2 py-0.5 rounded-full">
                الجمهور العام 🌐
              </span>
              <Navigation className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-black block mt-0.5">الجمهور: الإعلانات والتتبع</span>
            <span className="text-[10px] text-emerald-300 font-bold">
              🛰️ يرى الإعلانات والتتبع المباشر فقط
            </span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* =====================================================================
              PAGE 1: صفحة المستخدمين والأدمن (إظهار باسورد المستخدم في صفحة المستخدمين والأدمن)
             ===================================================================== */}
          {activePage === 1 && (
            <div className="space-y-4">
              {p1Mode === 'login' ? (
                <div className="max-w-md mx-auto bg-white/5 border border-amber-500/30 rounded-3xl p-5 space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400">
                    <KeyRound className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      الصفحة الأولى (1): دخول صفحة المستخدمين والأدمن
                    </h3>
                    <p className="text-[11px] text-white/65 mt-1">
                      أدخل اسم المستخدم والباسورد الأخير لإظهار باسورد المستخدم وأوامره الخاصة (أو دخول الأدمن العام لإدارة كافة الباسوردات والربط).
                    </p>
                  </div>

                  {/* Quick Selector for Admin or Staff Users 1-4 */}
                  <div className="flex flex-wrap justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setP1Username('admin');
                        setP1PassInput('');
                        setP1Error('');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition cursor-pointer ${
                        p1Username === 'admin'
                          ? 'bg-amber-400 text-black border-amber-300'
                          : 'bg-white/10 text-amber-300 border-white/15'
                      }`}
                    >
                      👑 الأدمن العام (admin)
                    </button>
                    {staffList.slice(0, 4).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setP1Username(st.username);
                          setP1PassInput('');
                          setP1Error('');
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                          p1Username === st.username
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-white/10 text-cyan-300 border-white/15'
                        }`}
                      >
                        👤 مستخدم {st.staffNumber} ({st.username})
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleP1Login} className="space-y-3 text-right">
                    <div>
                      <label className="block text-[11px] font-bold text-white/80 mb-1">
                        اسم المستخدم (admin أو staff1 - staff8):
                      </label>
                      <input
                        type="text"
                        value={p1Username}
                        onChange={(e) => setP1Username(e.target.value)}
                        className="w-full bg-black/50 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-300 mb-1">
                        الباسورد الأخير للمستخدم أو الأدمن:
                      </label>
                      <div className="relative">
                        <input
                          type={p1ShowLoginPass ? 'text' : 'password'}
                          value={p1PassInput}
                          onChange={(e) => setP1PassInput(e.target.value)}
                          placeholder="أدخل الباسورد السري..."
                          className="w-full bg-black/50 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-center font-mono font-black tracking-widest text-sm text-white"
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setP1ShowLoginPass(!p1ShowLoginPass)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                        >
                          {p1ShowLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {p1Error && (
                      <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-center">
                        {p1Error}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-black font-black py-3 rounded-xl text-xs shadow-lg cursor-pointer transition"
                    >
                      فتح صفحة المستخدمين والأدمن وإظهار الباسورد 🔓
                    </button>
                  </form>
                </div>
              ) : p1Mode === 'staff_unlocked' && loggedInStaff ? (
                /* ISOLATED STAFF USER VIEW: يرى باسورده وأوامره وصفحته فقط ولا يرى أي مستخدم آخر */
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-950/60 via-neutral-900 to-indigo-950/60 border-2 border-blue-400/50 rounded-3xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow">
                          {loggedInStaff.staffNumber}
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-white">
                            صفحة المستخدم الخاصة: {loggedInStaff.name}
                          </h3>
                          <p className="text-[11px] text-emerald-300 font-bold">
                            🔒 عزل أمني تام: أنت ترى أوامرك وباسوردك وصفحتك فقط (لا يرى أحد الآخر)
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setP1Mode('login');
                          setLoggedInStaff(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>قفل وخروج</span>
                      </button>
                    </div>

                    {/* PROMINENT USER PASSWORD DISPLAY BOX (إظهار باسورد المستخدم في صفحة المستخدمين) */}
                    <div className="bg-black/60 border-2 border-amber-400/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] text-amber-300 font-black flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <span>باسورد المستخدم الخاص بك (في صفحة المستخدمين والأدمن):</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-white/70 font-mono">
                            اسم المستخدم: <b className="text-white">{loggedInStaff.username}</b>
                          </span>
                          <span className="text-base sm:text-lg font-mono font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-xl tracking-widest">
                            {showOwnPassP1 ? loggedInStaff.password : '••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowOwnPassP1(!showOwnPassP1)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
                          >
                            {showOwnPassP1 ? 'إخفاء' : 'إظهار الباسورد'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyText(loggedInStaff.password, 'staff_own_pass')}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 cursor-pointer"
                            title="نسخ باسوردي"
                          >
                            {copiedId === 'staff_own_pass' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Change Own Password */}
                      <form onSubmit={handleSaveOwnPassP1} className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={newPassP1}
                          onChange={(e) => setNewPassP1(e.target.value)}
                          placeholder="تعيين باسورد جديد..."
                          className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono flex-1 sm:w-40"
                        />
                        <button
                          type="submit"
                          className="bg-amber-400 hover:bg-amber-300 text-black font-black px-3 py-2 rounded-xl text-xs shrink-0 cursor-pointer"
                        >
                          حفظ الباسورد 🔒
                        </button>
                      </form>
                    </div>

                    {/* Isolated Staff Commands & Work Orders */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                      <h4 className="font-black text-cyan-300 text-xs sm:text-sm">
                        📋 أوامرك ومهامك الصادرة لك فقط (معزولة عن باقي المستخدمين):
                      </h4>
                      <p className="text-xs text-white font-bold">
                        {loggedInStaff.assignedTaskTitle || loggedInStaff.assignedTask || 'الرقابة على النشر والاشتراك'}
                      </p>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        {loggedInStaff.assignedTaskDetails || loggedInStaff.notes}
                      </p>
                      <div className="flex items-center gap-2 pt-2 flex-wrap">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          ساعات عملك: {loggedInStaff.shiftHours}
                        </span>
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          حالة أمر التشغيل: {loggedInStaff.workOrderActive ? 'ساري ومفعل 🚀' : 'موقوف مؤقتاً ⏸️'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* GENERAL ADMIN VIEW IN PAGE 1: إظهار باسورد الأدمن + باسوردات المستخدمين + العملاء + المشتركين */
                <div className="space-y-4">
                  {/* Admin Master Password Card */}
                  <div className="bg-gradient-to-r from-amber-950/60 via-neutral-900 to-amber-950/40 border-2 border-amber-400/60 rounded-3xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">👑</span>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-white">
                            صفحة الأدمن والمستخدمين (إظهار باسورد المستخدم والأدمن)
                          </h3>
                          <p className="text-[11px] text-amber-300 font-bold">
                            الأدمن يرى ويتحكم في باسوردات المستخدمين والعملاء والمشتركين، بينما كل طرف معزول في صفحته لا يرى الآخر
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAdminFullModal();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs cursor-pointer shadow"
                        >
                          فتح لوحة تحكم الأدمن الشاملة ⚙️
                        </button>
                        <button
                          type="button"
                          onClick={() => setP1Mode('login')}
                          className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white font-bold text-xs cursor-pointer"
                        >
                          قفل 🔒
                        </button>
                      </div>
                    </div>

                    {/* Admin Own Password Display */}
                    <div className="bg-black/60 border border-amber-400/50 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-black text-amber-300">
                          🔑 باسورد الأدمن العام الأخير (admin):
                        </span>
                        <span className="text-base font-mono font-black bg-amber-400 text-black px-3 py-1 rounded-xl tracking-widest">
                          {showOwnPassP1 ? getLatestAdminPin() : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowOwnPassP1(!showOwnPassP1)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
                        >
                          {showOwnPassP1 ? 'إخفاء' : 'إظهار'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(getLatestAdminPin(), 'admin_master_pin')}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 cursor-pointer"
                        >
                          {copiedId === 'admin_master_pin' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <form onSubmit={handleSaveOwnPassP1} className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={newPassP1}
                          onChange={(e) => setNewPassP1(e.target.value)}
                          placeholder="تغيير باسورد الأدمن..."
                          className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-mono flex-1 sm:w-40"
                        />
                        <button
                          type="submit"
                          className="bg-amber-400 hover:bg-amber-300 text-black font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                        >
                          تحديث 🔒
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Staff Users (1-8) Passwords & Isolated Commands Table */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm text-cyan-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>باسوردات المستخدمين المساعدين (1 إلى 8) وأوامرهم المعزولة:</span>
                      </h4>
                      <span className="text-[10px] text-white/60">
                        كل مستخدم يدخل بباسورده ويرى أوامره فقط
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {staffList.map((st) => (
                        <div
                          key={st.id}
                          className="bg-black/50 border border-white/10 rounded-2xl p-3 space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-black text-white text-xs">مستخدم {st.staffNumber}</span>
                              <span className="font-mono text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                                {st.username}
                              </span>
                            </div>
                            <p className="text-[10px] text-white/70 mt-1 line-clamp-1">
                              {st.assignedTaskTitle || st.name}
                            </p>
                          </div>

                          <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-2 flex items-center justify-between">
                            <span className="text-[10px] text-amber-200 font-bold">🔑 الباسورد:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-amber-300 text-xs">
                                {st.password}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(st.password, `st_${st.id}`)}
                                className="text-white/60 hover:text-white cursor-pointer"
                              >
                                {copiedId === `st_${st.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary of Connected Pages 2 (Customers) & 3 (Subscribers) Passwords for Admin */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Customers Passwords in Admin */}
                    <div className="bg-white/5 border border-sky-500/30 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-xs text-sky-300">
                          👥 باسوردات العملاء (الصفحة الثانية - {customersList.length} عملاء):
                        </h4>
                        <button
                          type="button"
                          onClick={() => setActivePage(2)}
                          className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-lg font-bold cursor-pointer"
                        >
                          الانتقال للصفحة 2 ⬅
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {customersList.map((c) => (
                          <div
                            key={c.id}
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-white block">{c.displayName}</span>
                              <span className="text-[10px] text-white/50 font-mono">{c.phone} • {c.username}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-lg font-mono font-black text-xs">
                                🔑 {c.pin}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subscribers Passwords in Admin */}
                    <div className="bg-white/5 border border-rose-500/30 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-xs text-rose-300">
                          🏪 باسوردات المشتركين الأخيرة (الصفحة الثالثة - {businesses.length} مشترك):
                        </h4>
                        <button
                          type="button"
                          onClick={() => setActivePage(3)}
                          className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-lg font-bold cursor-pointer"
                        >
                          الانتقال للصفحة 3 ⬅
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {businesses.slice(0, 15).map((b) => {
                          const subPin = getLatestSubscriberPin(b);
                          const isShown = showAllPinsInAdmin[String(b.id)] ?? true;
                          return (
                            <div
                              key={b.id}
                              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                            >
                              <div className="truncate">
                                <span className="font-bold text-white block truncate">{b.name}</span>
                                <span className="text-[10px] text-white/50 font-mono">{b.phone} • {b.cat}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg font-mono font-black text-xs">
                                  🔑 {isShown ? subPin : '••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowAllPinsInAdmin((prev) => ({
                                      ...prev,
                                      [String(b.id)]: !isShown,
                                    }))
                                  }
                                  className="text-white/50 hover:text-white cursor-pointer"
                                >
                                  {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              PAGE 2: الصفحة الثانية العملاء (كل عميل يرى أوامره وباسورده وصفحته فقط)
             ===================================================================== */}
          {activePage === 2 && (
            <div className="space-y-4">
              {!p2UnlockedCustomer ? (
                <div className="max-w-lg mx-auto bg-white/5 border border-sky-500/30 rounded-3xl p-5 space-y-4">
                  <div className="text-center space-y-1.5">
                    <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center mx-auto text-sky-400">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-white">
                      الصفحة الثانية (2): بوابة وصفحة العملاء المعزولة
                    </h3>
                    <p className="text-[11px] text-white/65">
                      كل عميل له باسورد خاص به وصفحة مستقلة وأوامر وطلبات وحجوزات معزولة تماماً — لا يرى أي عميل آخر أوامره أو باسورده أو صفحته.
                    </p>
                  </div>

                  {!isRegisteringCustomer ? (
                    <form onSubmit={handleP2Login} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-white/80 mb-1">
                          اختر حساب العميل للدخول إلى صفحته الخاصة:
                        </label>
                        <select
                          value={selectedCustomerId}
                          onChange={(e) => {
                            setSelectedCustomerId(e.target.value);
                            setP2Error('');
                          }}
                          className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                        >
                          {customersList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.displayName} ({c.username} - {c.city})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-sky-300 mb-1">
                          باسورد العميل السري (لفتح صفحتك وأوامرك الخاصة فقط):
                        </label>
                        <div className="relative">
                          <input
                            type={p2ShowLoginPass ? 'text' : 'password'}
                            value={p2PassInput}
                            onChange={(e) => setP2PassInput(e.target.value)}
                            placeholder="أدخل باسورد العميل..."
                            className="w-full bg-black/60 border border-sky-500/40 rounded-xl px-3.5 py-2.5 text-center font-mono font-black tracking-widest text-sm text-white"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setP2ShowLoginPass(!p2ShowLoginPass)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                          >
                            {p2ShowLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {p2Error && (
                        <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-center">
                          {p2Error}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-sky-400 to-emerald-500 hover:brightness-110 text-black font-black py-3 rounded-xl text-xs shadow-lg cursor-pointer transition"
                      >
                        فتح صفحة العميل الخاصة بي وأوامري 🔓
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsRegisteringCustomer(true)}
                        className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition"
                      >
                        ➕ تسجيل عميل جديد بباسورد خاص وصفحة مستقلة
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegisterNewCustomer} className="space-y-3">
                      <h4 className="font-black text-sky-300 text-xs">
                        تسجيل حساب عميل جديد (بباسورد خاص ومعزول):
                      </h4>
                      <input
                        type="text"
                        value={regCustName}
                        onChange={(e) => setRegCustName(e.target.value)}
                        placeholder="الاسم الكامل للعميل..."
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          value={regCustPhone}
                          onChange={(e) => setRegCustPhone(e.target.value)}
                          placeholder="رقم الموبايل (010...)"
                          className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono"
                          required
                        />
                        <input
                          type="text"
                          value={regCustCity}
                          onChange={(e) => setRegCustCity(e.target.value)}
                          placeholder="المدينة"
                          className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <input
                        type="text"
                        value={regCustPin}
                        onChange={(e) => setRegCustPin(e.target.value)}
                        placeholder="اختر الباسورد السري الخاص بك (مثال: 4455)"
                        className="w-full bg-black/60 border border-sky-400/50 rounded-xl px-3 py-2 text-xs text-white font-mono text-center font-black"
                        required
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-sky-400 hover:bg-sky-300 text-black font-black py-2.5 rounded-xl text-xs cursor-pointer"
                        >
                          إنشاء وفتح صفحتي 🔒
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRegisteringCustomer(false)}
                          className="px-4 bg-white/10 text-white rounded-xl text-xs cursor-pointer"
                        >
                          رجوع
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* UNLOCKED ISOLATED CUSTOMER PAGE */
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-sky-950/60 via-neutral-900 to-emerald-950/50 border-2 border-sky-400/50 rounded-3xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-sky-500 text-black font-black text-base flex items-center justify-center shadow">
                          👤
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-white">
                            صفحة العميل الخاصة: {p2UnlockedCustomer.displayName} ({p2UnlockedCustomer.username})
                          </h3>
                          <p className="text-[11px] text-emerald-300 font-bold">
                            🔒 لا يرى أي عميل آخر أوامرك أو باسوردك أو صفحتك • ومرتبط مباشرة بالمشتركين والتتبع المباشر
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setP2UnlockedCustomer(null)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>قفل صفحتي وتبديل العميل</span>
                      </button>
                    </div>

                    {/* Customer Own Password Display & Update */}
                    <div className="bg-black/60 border border-sky-400/50 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-black text-sky-300">
                          🔑 باسورد المستخدم (العميل) الخاص بك:
                        </span>
                        <span className="text-base font-mono font-black bg-sky-400/20 text-sky-300 border border-sky-400/40 px-3 py-1 rounded-xl tracking-widest">
                          {showCustomerOwnPass ? p2UnlockedCustomer.pin : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCustomerOwnPass(!showCustomerOwnPass)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
                        >
                          {showCustomerOwnPass ? 'إخفاء' : 'إظهار الباسورد'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(p2UnlockedCustomer.pin, 'cust_own_pin')}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sky-300 cursor-pointer"
                        >
                          {copiedId === 'cust_own_pin' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <form onSubmit={handleSaveCustomerNewPass} className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={newCustomerPass}
                          onChange={(e) => setNewCustomerPass(e.target.value)}
                          placeholder="تغيير باسوردي..."
                          className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-mono flex-1 sm:w-36"
                        />
                        <button
                          type="submit"
                          className="bg-sky-400 hover:bg-sky-300 text-black font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                        >
                          حفظ 🔒
                        </button>
                      </form>
                    </div>

                    {/* Send Instant Connected Order to Any Subscriber (Page 3) */}
                    <form
                      onSubmit={handleSendOrderFromCustomerToSubscriber}
                      className="bg-white/5 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-black text-emerald-300 text-xs flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال أمر طلب فوري من صفحتك (العميل) إلى صفحة المشترك (الصفحة 3):</span>
                        </h4>
                        <span className="text-[10px] text-white/60">
                          يسمّع فوراً عند المشترك المختار وعند الأدمن وفي التتبع
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={quickOrderBizId}
                          onChange={(e) => setQuickOrderBizId(e.target.value)}
                          className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-bold"
                        >
                          {businesses.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.cat})
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={quickOrderItem}
                          onChange={(e) => setQuickOrderItem(e.target.value)}
                          placeholder="اكتب أمرك أو طلبك (مثال: وجبة، كشف، توصيل)..."
                          className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={quickOrderAddr}
                            onChange={(e) => setQuickOrderAddr(e.target.value)}
                            placeholder="عنوان التوصيل..."
                            className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white flex-1"
                          />
                          <button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-3.5 py-2 rounded-xl text-xs shrink-0 cursor-pointer shadow"
                          >
                            إرسال للمشترك ⚡
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Customer's Isolated Orders & Bookings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-amber-300 text-xs flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>أوامري وطلباتي الخاصة بي فقط ({isolatedCustomerOrders.length}):</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenLiveTracking();
                            }}
                            className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-bold cursor-pointer"
                          >
                            🛰️ فتح رادار التتبع
                          </button>
                        </div>

                        {isolatedCustomerOrders.length === 0 ? (
                          <p className="text-[11px] text-white/40 py-4 text-center">
                            لا توجد أوامر مسجلة باسمك حتى الآن — أرسل أمراً من الأعلى ليظهر هنا وعند المشترك فوراً.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {isolatedCustomerOrders.map((ord) => (
                              <div
                                key={ord.id}
                                className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-white">{ord.businessName}</span>
                                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                                    {ord.status === 'delivered'
                                      ? '✓ تم التسليم'
                                      : ord.status === 'on_the_way'
                                      ? '🛵 في الطريق بالتتبع'
                                      : '⏳ قيد التنفيذ عند المشترك'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-white/75">
                                  {ord.items.map((i) => i.name).join('، ')} — الإجمالي: <b className="text-emerald-400">{ord.totalEgp} ج.م</b>
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2">
                        <h4 className="font-black text-purple-300 text-xs flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>حجوزاتي الخاصة بي فقط ({isolatedCustomerBookings.length}):</span>
                        </h4>
                        {isolatedCustomerBookings.length === 0 ? (
                          <p className="text-[11px] text-white/40 py-4 text-center">
                            لا توجد حجوزات مسجلة لهذا العميل حالياً (معزولة عن باقي العملاء).
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {isolatedCustomerBookings.map((bk) => (
                              <div
                                key={bk.ref}
                                className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-white">{bk.businessName}</span>
                                  <span className="font-mono text-[10px] text-amber-300">#{bk.ref}</span>
                                </div>
                                <p className="text-[11px] text-white/70">
                                  {bk.roomName} • {bk.totalPrice} ج.م
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              PAGE 3: الصفحة الثالثة المشتركين (كل مشترك يرى أوامره وباسورده وصفحته فقط)
             ===================================================================== */}
          {activePage === 3 && (
            <div className="space-y-4">
              {!unlockedSubBiz ? (
                <div className="max-w-lg mx-auto bg-white/5 border border-[#FF2D55]/40 rounded-3xl p-5 space-y-4">
                  <div className="text-center space-y-1.5">
                    <div className="w-14 h-14 rounded-2xl bg-[#FF2D55]/20 border border-[#FF2D55]/40 flex items-center justify-center mx-auto text-[#FF2D55]">
                      <Store className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-white">
                      الصفحة الثالثة (3): بوابة المشتركين المحمية بالباسورد الأخير
                    </h3>
                    <p className="text-[11px] text-white/65">
                      لا يرى أي مشترك أوامر أو باسورد أو صفحة مشترك آخر! اختر نشاطك وأدخل الباسورد الأخير لفتح صفحتك وأوامرك الواردة من العملاء.
                    </p>
                  </div>

                  <form onSubmit={handleP3Login} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-white/80 mb-1">
                        ابحث أو اختر صفحة المشترك الخاصة بك:
                      </label>
                      <input
                        type="text"
                        value={subSearchQuery}
                        onChange={(e) => setSubSearchQuery(e.target.value)}
                        placeholder="ابحث باسم النشاط أو رقم الهاتف..."
                        className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white mb-2"
                      />
                      <select
                        value={selectedSubBizId}
                        onChange={(e) => {
                          setSelectedSubBizId(e.target.value);
                          setP3Error('');
                        }}
                        className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                      >
                        {filteredSubList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.cat} - {b.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-rose-300 mb-1">
                        الباسورد الأخير للمشترك (لا تفتح الصفحة إلا بالباسورد الأخير فقط):
                      </label>
                      <div className="relative">
                        <input
                          type={p3ShowLoginPass ? 'text' : 'password'}
                          value={p3PassInput}
                          onChange={(e) => setP3PassInput(e.target.value)}
                          placeholder="أدخل الباسورد الأخير لصفحتك..."
                          className="w-full bg-black/60 border border-[#FF2D55]/50 rounded-xl px-3.5 py-2.5 text-center font-mono font-black tracking-widest text-sm text-white"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setP3ShowLoginPass(!p3ShowLoginPass)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                        >
                          {p3ShowLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {p3Error && (
                      <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-center">
                        {p3Error}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#FF2D55] to-amber-500 hover:brightness-110 text-white font-black py-3 rounded-xl text-xs shadow-lg cursor-pointer transition"
                    >
                      فتح صفحة المشترك الخاصة بي وأوامري 🔓
                    </button>
                  </form>
                </div>
              ) : (
                /* UNLOCKED ISOLATED SUBSCRIBER PAGE */
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-rose-950/60 via-neutral-900 to-purple-950/50 border-2 border-[#FF2D55]/50 rounded-3xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={unlockedSubBiz.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200'}
                          alt={unlockedSubBiz.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-white/20"
                        />
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-white">
                            صفحة المشترك الخاصة: {unlockedSubBiz.name}
                          </h3>
                          <p className="text-[11px] text-emerald-300 font-bold">
                            🔒 عزل تام: لا يرى أي مشترك آخر أوامرك أو باسوردك أو صفحتك • مرتبط بالعملاء والجمهور
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenOwnerEditor(unlockedSubBiz);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs cursor-pointer shadow"
                        >
                          ✏️ تعديل بيانات وصور صفحتي
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenSubscriberDashboard(unlockedSubBiz);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer shadow"
                        >
                          📊 لوحة الإحصاءات والتتبع GPS
                        </button>
                        <button
                          type="button"
                          onClick={() => setP3UnlockedBizId(null)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white font-bold text-xs cursor-pointer"
                        >
                          قفل صفحتي 🔒
                        </button>
                      </div>
                    </div>

                    {/* Subscriber Own Password Display & Update */}
                    <div className="bg-black/60 border border-[#FF2D55]/50 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-black text-rose-300">
                          🔑 باسورد صفحتك الأخير (لا تفتح إلا به):
                        </span>
                        <span className="text-base font-mono font-black bg-[#FF2D55]/20 text-rose-300 border border-[#FF2D55]/40 px-3 py-1 rounded-xl tracking-widest">
                          {showSubOwnPass ? getLatestSubscriberPin(unlockedSubBiz) : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSubOwnPass(!showSubOwnPass)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
                        >
                          {showSubOwnPass ? 'إخفاء' : 'إظهار الباسورد'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(getLatestSubscriberPin(unlockedSubBiz), 'sub_own_pin')}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-rose-300 cursor-pointer"
                        >
                          {copiedId === 'sub_own_pin' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <form onSubmit={handleSaveSubNewPass} className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={newSubPass}
                          onChange={(e) => setNewSubPass(e.target.value)}
                          placeholder="تعيين باسورد أخير جديد..."
                          className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-mono flex-1 sm:w-44"
                        />
                        <button
                          type="submit"
                          className="bg-[#FF2D55] hover:brightness-110 text-white font-black px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                        >
                          حفظ الباسورد الأخير 🔒
                        </button>
                      </form>
                    </div>

                    {/* Subscriber's Isolated Incoming Orders & Bookings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                        <h4 className="font-black text-amber-300 text-xs flex items-center justify-between">
                          <span>📦 أوامر وطلبات العملاء الواردة لصفحتك فقط ({isolatedSubscriberOrders.length}):</span>
                          <span className="text-[10px] text-emerald-400">مرتبط بصفحة العميل والتتبع</span>
                        </h4>

                        {isolatedSubscriberOrders.length === 0 ? (
                          <p className="text-[11px] text-white/40 py-5 text-center">
                            لا توجد أوامر طلبات واردة لنشاطك حالياً (طلبات باقي المشتركين معزولة تماماً).
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {isolatedSubscriberOrders.map((ord) => (
                              <div
                                key={ord.id}
                                className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-white">
                                    العميل: {ord.customerName} ({ord.customerPhone})
                                  </span>
                                  <span className="font-mono text-[10px] text-amber-300">{ord.orderNumber}</span>
                                </div>
                                <p className="text-[11px] text-white/80">
                                  الأمر: {ord.items.map((i) => `${i.name} (x${i.quantity})`).join('، ')} • <b className="text-emerald-400">{ord.totalEgp} ج.م</b>
                                </p>
                                <p className="text-[10px] text-white/50">📍 العنوان: {ord.deliveryAddress}</p>
                                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatusBySubscriber(ord.id, 'preparing', 'جاري التجهيز لدى المشترك')}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                                      ord.status === 'preparing' ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/80'
                                    }`}
                                  >
                                    ⏳ جاري التجهيز
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatusBySubscriber(ord.id, 'on_the_way', 'في الطريق إليك بالتتبع المباشر GPS')}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                                      ord.status === 'on_the_way' ? 'bg-blue-500 text-white' : 'bg-white/10 text-sky-300'
                                    }`}
                                  >
                                    🛵 في الطريق (تفعيل التتبع)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatusBySubscriber(ord.id, 'delivered', 'تم التسليم بنجاح')}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                                      ord.status === 'delivered' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-emerald-300'
                                    }`}
                                  >
                                    ✓ تم التسليم
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                        <h4 className="font-black text-purple-300 text-xs">
                          📅 حجوزات العملاء الخاصة بنشاطك فقط ({isolatedSubscriberBookings.length}):
                        </h4>
                        {isolatedSubscriberBookings.length === 0 ? (
                          <p className="text-[11px] text-white/40 py-5 text-center">
                            لا توجد حجوزات مسجلة لنشاطك حالياً (حجوزات باقي المشتركين معزولة عنك).
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {isolatedSubscriberBookings.map((bk) => (
                              <div
                                key={bk.ref}
                                className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-white">{bk.guestName}</span>
                                  <span className="font-mono text-[10px] text-amber-300">#{bk.ref}</span>
                                </div>
                                <p className="text-[11px] text-white/75">
                                  {bk.roomName} • الهاتف: <span className="font-mono">{bk.guestPhone}</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              PUBLIC VIEW: الجمهور يرى الإعلانات والتتبع فقط (والكل مرتبطين)
             ===================================================================== */}
          {activePage === 'public' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-teal-950/60 border-2 border-emerald-400/50 rounded-3xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        شاشة الجمهور العام: الإعلانات المعتمدة + التتبع المباشر GPS 🛰️
                      </h3>
                      <p className="text-[11px] text-emerald-300 font-bold">
                        الجمهور يرى الإعلانات النشطة ({businesses.filter((b) => b.status === 'active').length} إعلان) والتتبع المباشر فقط — بينما الباسوردات والأوامر والصفحات الخاصة معزولة 100%
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLiveTracking();
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 text-black font-black text-xs shadow-lg cursor-pointer flex items-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>فتح رادار التتبع المباشر للجمهور 🛰️</span>
                  </button>
                </div>

                {/* Live Connected Ads & Tracking Grid for Public */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[52vh] overflow-y-auto pr-1">
                  {businesses
                    .filter((b) => b.status === 'active')
                    .slice(0, 18)
                    .map((b) => (
                      <div
                        key={b.id}
                        className="bg-black/50 border border-white/10 hover:border-emerald-400/40 rounded-2xl p-3 flex flex-col justify-between gap-2.5 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={b.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200'}
                            alt={b.name}
                            className="w-14 h-14 rounded-xl object-cover border border-white/15 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-white text-xs truncate">{b.name}</h4>
                            <span className="text-[10px] text-white/60 block">
                              {b.cat} • {b.city}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                              🛰️ التتبع والإعلان متاح للجمهور
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenBizModal(b);
                            }}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 rounded-xl text-[11px] cursor-pointer"
                          >
                            مشاهدة الإعلان 👁️
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenLiveTracking(b);
                            }}
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/40 font-black py-1.5 rounded-xl text-[11px] cursor-pointer"
                          >
                            التتبع المباشر 🛰️
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
