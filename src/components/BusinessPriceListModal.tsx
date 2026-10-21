import React, { useState } from 'react';
import { 
  X, Plus, ShoppingBag, Phone, MessageCircle, Search, 
  Check, Trash2, Tag, Sparkles, AlertCircle, ArrowRight,
  Utensils, Carrot, Sandwich, DollarSign, Clock, ShieldCheck, Lock, KeyRound
} from 'lucide-react';
import { Business, ServiceItem, SupportedCurrency, SupportedLang } from '../types';
import { formatServicePrice } from '../utils/currency';
import { verifySubscriberOrAdminPin } from '../utils/passwordSecurity';

interface BusinessPriceListModalProps {
  business: Business;
  onClose: () => void;
  onOpenDeliveryOrder?: (business: Business, selectedItems?: { name: string; price: string; qty: number }[]) => void;
  currentCurrency: SupportedCurrency;
  lang: SupportedLang;
  isOwner?: boolean;
  onUpdateServices?: (services: ServiceItem[]) => void;
}

export const BusinessPriceListModal: React.FC<BusinessPriceListModalProps> = ({
  business,
  onClose,
  onOpenDeliveryOrder,
  currentCurrency,
  lang,
  isOwner = false,
  onUpdateServices,
}) => {
  const isAr = lang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  
  // Owner Add Service Item State (مقفل ولا يفتح إلا بالباسورد الأخير فقط)
  const [showAddForm, setShowAddForm] = useState(false);
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [servicesList, setServicesList] = useState<ServiceItem[]>(
    business.services && business.services.length > 0 
      ? business.services 
      : [
          { n: 'وجبة مميزة أساسية', p: '120 ج.م', priceEgp: 120 },
          { n: 'طلب خاص إعلانك VIP', p: '180 ج.م', priceEgp: 180 },
          { n: 'عرض التوفير العائلي', p: '260 ج.م', priceEgp: 260 },
        ]
  );

  const filteredServices = servicesList.filter((s) => 
    s.n.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateQty = (itemName: string, delta: number) => {
    setCart((prev) => {
      const current = prev[itemName] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemName];
        return copy;
      }
      return { ...prev, [itemName]: next };
    });
  };

  const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const calculateTotalPriceEgp = () => {
    let total = 0;
    Object.entries(cart).forEach(([name, qty]) => {
      const item = servicesList.find((s) => s.n === name);
      if (item) {
        const numeric = item.priceEgp || parseInt(item.p.replace(/[^0-9]/g, '')) || 0;
        total += numeric * qty;
      }
    });
    return total;
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice.trim()) return;

    const priceNum = parseInt(newItemPrice.replace(/[^0-9]/g, '')) || 0;
    const formattedPrice = newItemPrice.includes('ج.م') || newItemPrice.includes('EGP')
      ? newItemPrice.trim()
      : `${newItemPrice.trim()} ج.م`;

    const updated = [
      ...servicesList,
      { n: newItemName.trim(), p: formattedPrice, priceEgp: priceNum },
    ];
    setServicesList(updated);
    if (onUpdateServices) onUpdateServices(updated);

    // Save to localStorage for subscriber persistence
    try {
      localStorage.setItem(`dalilk_services_${business.id}`, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    setNewItemName('');
    setNewItemPrice('');
    setShowAddForm(false);
  };

  const handleSendWhatsAppOrder = () => {
    if (cartTotalItems === 0) return;
    const cleanPhone = (business.phone || '').replace(/[^0-9]/g, '');
    const phoneToUse = cleanPhone.startsWith('01') ? `2${cleanPhone}` : cleanPhone || '201006656669';

    let orderDetails = `مرحباً (${business.name}) 🌟،\nأود طلب الأصناف التالية من قائمة أسعاركم الموثقة على إعلانك:\n\n`;
    Object.entries(cart).forEach(([name, qty]) => {
      const item = servicesList.find((s) => s.n === name);
      orderDetails += `• ${name} (عدد: ${qty}) - بسعر: ${item?.p || ''}\n`;
    });
    orderDetails += `\n💰 الإجمالي التقريبي: ${calculateTotalPriceEgp()} ج.م\n📍 العنوان للتوصيل:\n⏰ يرجى التأكيد وميعاد التوصيل.`;

    const url = `https://wa.me/${phoneToUse}?text=${encodeURIComponent(orderDetails)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleProceedToDelivery = () => {
    const selectedItems = Object.entries(cart).map(([name, qty]) => {
      const item = servicesList.find((s) => s.n === name);
      return {
        name,
        qty,
        price: item?.p || `${item?.priceEgp || 0} ج.م`,
      };
    });
    if (onOpenDeliveryOrder) {
      onOpenDeliveryOrder(business, selectedItems);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[160] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div 
        className="bg-[#12131d] border border-amber-400/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-amber-950/60 to-neutral-900 p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black text-lg shadow-md shadow-amber-400/20">
              +
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm sm:text-base text-white">
                  قائمة الأسعار والمنيو المعتمدة
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  {business.cat}
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                {business.name} • الأسعار بعملة ({currentCurrency})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 bg-black/40 border-b border-white/10 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-white/40 absolute start-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن صنف أو خدمة أو سعر..."
              className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (isOwnerUnlocked) {
                setShowAddForm(!showAddForm);
              } else {
                setShowPinPrompt(!showPinPrompt);
                setPinError('');
              }
            }}
            className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer shrink-0"
            title="إضافة أو تعديل صنف للقائمة (باسورد المشترك الأخير فقط)"
          >
            <Lock className="w-3 h-3" />
            <span>إضافة صنف 🔐</span>
          </button>
        </div>

        {/* Password Verification Gate for Adding/Editing Price List Items */}
        {showPinPrompt && !isOwnerUnlocked && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (verifySubscriberOrAdminPin(business, pinInput)) {
                setIsOwnerUnlocked(true);
                setShowPinPrompt(false);
                setShowAddForm(true);
                setPinError('');
                setPinInput('');
              } else {
                setPinError('الباسورد غير صحيح! لا يفتح التعديل إلا بالباسورد الأخير فقط.');
              }
            }}
            className="bg-neutral-950 p-3.5 border-b border-amber-400/40 space-y-2 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>🔒 تعديل قائمة الأسعار مقفل — أدخل الباسورد الأخير فقط لـ ({business.name}):</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                placeholder="اكتب الباسورد الأخير هنا..."
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono text-center focus:outline-none focus:border-amber-400"
                autoFocus
                required
              />
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
              >
                فتح التعديل 🔓
              </button>
            </div>
            {pinError && <p className="text-[10px] text-red-400 font-bold">{pinError}</p>}
          </form>
        )}

        {/* Add Form (Expandable - Only after latest PIN verification) */}
        {showAddForm && isOwnerUnlocked && (
          <form onSubmit={handleAddNewItem} className="bg-neutral-950 p-3.5 border-b border-amber-400/30 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
            <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <Plus className="w-3 h-3" />
              <span>إضافة صنف جديد لقائمة الأسعار (+):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="اسم الصنف / الوجبة / السلعة"
                className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white placeholder:text-white/40"
              />
              <input
                type="text"
                required
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="السعر (مثال: 75 ج.م)"
                className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white font-mono placeholder:text-white/40"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs px-4 py-1.5 rounded-xl shadow cursor-pointer"
              >
                حفظ الصنف الآن ✓
              </button>
            </div>
          </form>
        )}

        {/* Price List Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs divide-y divide-white/5">
          {filteredServices.length === 0 ? (
            <div className="py-10 text-center text-white/50 space-y-2">
              <Tag className="w-8 h-8 mx-auto text-white/20" />
              <p>لا توجد أصناف مطابقة للبحث</p>
            </div>
          ) : (
            filteredServices.map((item, idx) => {
              const qty = cart[item.n] || 0;
              const numericEgp = item.priceEgp || parseInt(item.p.replace(/[^0-9]/g, '')) || 0;

              return (
                <div 
                  key={idx}
                  className="pt-2 pb-1 flex items-center justify-between gap-3 group hover:bg-white/5 p-2 rounded-xl transition"
                >
                  <div className="flex-1">
                    <div className="font-bold text-white text-xs group-hover:text-amber-300 transition">
                      {item.n}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-emerald-400 font-bold text-xs">
                        {item.p}
                      </span>
                      {currentCurrency !== 'EGP' && numericEgp > 0 && (
                        <span className="text-[10px] text-white/40 font-mono">
                          (~ {formatServicePrice(String(numericEgp), currentCurrency)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Cart Controls */}
                  <div className="flex items-center gap-1.5">
                    {qty > 0 ? (
                      <div className="flex items-center bg-black/60 border border-amber-400/40 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.n, -1)}
                          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold font-mono text-amber-300 text-xs">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.n, 1)}
                          className="w-6 h-6 rounded-lg bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center font-black text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.n, 1)}
                        className="bg-white/10 hover:bg-amber-400 hover:text-black text-white px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>طلب</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Order Summary & Action Buttons */}
        <div className="p-3.5 bg-neutral-950 border-t border-white/10 space-y-2.5">
          {cartTotalItems > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-white/60 text-[10px] block">إجمالي الأصناف المحددة:</span>
                <span className="font-black text-white">
                  {cartTotalItems} صنف • الإجمالي: <b className="text-amber-300 font-mono">{calculateTotalPriceEgp()} ج.م</b>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCart({})}
                className="text-[10px] text-white/40 hover:text-red-400 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>تفريغ</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSendWhatsAppOrder}
              disabled={cartTotalItems === 0}
              className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
                cartTotalItems > 0
                  ? 'bg-[#25D366] hover:bg-[#20ba59] text-black shadow cursor-pointer'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>إرسال واتساب للمحل</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToDelivery}
              className="bg-gradient-to-r from-amber-400 to-[#FFD700] hover:brightness-110 active:scale-95 text-black py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>طلب دليفري وتوصيل 🛵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
