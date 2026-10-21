import { Business } from '../types';

export const ADMIN_PIN_STORAGE_KEY = 'dalilk_admin_pin';
export const ADMIN_PASS_V1_KEY = 'dalilk_admin_password_v1';

/**
 * إرجاع الباسورد الأخير فقط للإدارة العامة (الأدمن)
 * عند تغيير الباسورد يتم إلغاء أي باسورد قديم فوراً
 */
export function getLatestAdminPin(): string {
  try {
    const pin = localStorage.getItem(ADMIN_PIN_STORAGE_KEY) || localStorage.getItem(ADMIN_PASS_V1_KEY);
    if (pin && pin.trim().length > 0) {
      return pin.trim();
    }
  } catch (e) {
    console.error('Error reading admin PIN:', e);
  }
  return '1234';
}

/**
 * حفظ الباسورد الجديد للإدارة وإلغاء أي باسورد سابق
 */
export function setLatestAdminPin(newPin: string): void {
  const clean = newPin.trim();
  if (!clean) return;
  try {
    localStorage.setItem(ADMIN_PIN_STORAGE_KEY, clean);
    localStorage.setItem(ADMIN_PASS_V1_KEY, clean);
  } catch (e) {
    console.error('Error saving admin PIN:', e);
  }
}

/**
 * إرجاع الباسورد الأخير فقط لصفحة المشترك
 * الأولوية للباسورد المحفوظ أخيراً في localStorage ثم ownerPin في بيانات النشاط
 */
export function getLatestSubscriberPin(business: Business): string {
  try {
    const savedPin = localStorage.getItem(`dalilk_pin_${business.id}`);
    if (savedPin && savedPin.trim().length > 0) {
      return savedPin.trim();
    }
  } catch (e) {
    console.error('Error reading subscriber PIN:', e);
  }
  if (business.ownerPin && String(business.ownerPin).trim().length > 0) {
    return String(business.ownerPin).trim();
  }
  if (business.ownerAccessCode && String(business.ownerAccessCode).trim().length > 0) {
    return String(business.ownerAccessCode).trim();
  }
  return '1234';
}

/**
 * حفظ الباسورد الأخير لصفحة المشترك وإلغاء أي جلسات مفتوحة أو باسورد قديم فوراً
 */
export function setLatestSubscriberPin(businessId: string | number, newPin: string): void {
  const clean = newPin.trim();
  if (!clean) return;
  try {
    localStorage.setItem(`dalilk_pin_${businessId}`, clean);
    // إلغاء أي فتح تلقائي سابق حتى لا تفتح الصفحة إلا بالباسورد الأخير فقط
    localStorage.removeItem(`dalilk_owner_verified_${businessId}`);
    sessionStorage.removeItem(`dalilk_dashboard_unlocked_${businessId}`);
  } catch (e) {
    console.error('Error saving subscriber PIN:', e);
  }
}

/**
 * التحقق الصارم: لا تفتح أي صفحة مشترك أو صفحة تعديل إلا بالباسورد الأخير فقط
 * (أو الباسورد الأخير للأدمن الرئيسي)
 */
export function verifySubscriberOrAdminPin(business: Business, enteredPin: string): boolean {
  const cleanEntered = enteredPin.trim();
  if (!cleanEntered) return false;

  const latestSubPin = getLatestSubscriberPin(business);
  const latestAdminPin = getLatestAdminPin();

  return cleanEntered === latestSubPin || cleanEntered === latestAdminPin;
}

export interface IsolatedCustomerAccount {
  id: string;
  username: string;
  displayName: string;
  phone: string;
  city: string;
  pin: string;
  createdAt: number;
}

const CUSTOMERS_REGISTRY_KEY = 'dalilk_isolated_customers_v1';

const DEFAULT_CUSTOMERS: IsolatedCustomerAccount[] = [
  {
    id: 'usr_guest_e3lanak',
    username: '@ahmed_e3lanak',
    displayName: 'أحمد المصري',
    phone: '01006656669',
    city: 'القاهرة',
    pin: '1122',
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'usr_cust_2',
    username: '@sara_mahmoud',
    displayName: 'سارة محمود النجار',
    phone: '01098765432',
    city: 'الجيزة',
    pin: '2233',
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'usr_cust_3',
    username: '@mohamed_elsherif',
    displayName: 'محمد الشريف',
    phone: '01122334455',
    city: 'الإسكندرية',
    pin: '3344',
    createdAt: Date.now() - 86400000 * 3,
  },
];

export function getLatestUserPin(userIdOrPhone: string): string {
  const key = `dalilk_user_pin_${userIdOrPhone}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
    const list = getIsolatedCustomers();
    const found = list.find(
      (c) => c.id === userIdOrPhone || c.phone === userIdOrPhone || c.username === userIdOrPhone
    );
    if (found && found.pin) return found.pin;
  } catch (e) {
    console.error('Error reading user PIN:', e);
  }
  return '1122';
}

export function setLatestUserPin(userIdOrPhone: string, newPin: string): void {
  const clean = newPin.trim();
  if (!clean) return;
  try {
    localStorage.setItem(`dalilk_user_pin_${userIdOrPhone}`, clean);
    const list = getIsolatedCustomers();
    const updated = list.map((c) =>
      c.id === userIdOrPhone || c.phone === userIdOrPhone || c.username === userIdOrPhone
        ? { ...c, pin: clean }
        : c
    );
    localStorage.setItem(CUSTOMERS_REGISTRY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving user PIN:', e);
  }
}

export function verifyUserOrAdminPin(userIdOrPhone: string, enteredPin: string): boolean {
  const cleanEntered = enteredPin.trim();
  if (!cleanEntered) return false;
  const userPin = getLatestUserPin(userIdOrPhone);
  const adminPin = getLatestAdminPin();
  return cleanEntered === userPin || cleanEntered === adminPin;
}

export function getIsolatedCustomers(): IsolatedCustomerAccount[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: IsolatedCustomerAccount) => ({
          ...c,
          pin: localStorage.getItem(`dalilk_user_pin_${c.id}`) || c.pin || '1122',
        }));
      }
    }
    localStorage.setItem(CUSTOMERS_REGISTRY_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
  } catch (e) {
    console.error('Error reading isolated customers:', e);
  }
  return DEFAULT_CUSTOMERS;
}

export function saveIsolatedCustomer(customer: IsolatedCustomerAccount): IsolatedCustomerAccount[] {
  const list = getIsolatedCustomers();
  const exists = list.some((c) => c.id === customer.id || c.phone === customer.phone);
  const next = exists
    ? list.map((c) => (c.id === customer.id || c.phone === customer.phone ? customer : c))
    : [customer, ...list];
  try {
    localStorage.setItem(CUSTOMERS_REGISTRY_KEY, JSON.stringify(next));
    localStorage.setItem(`dalilk_user_pin_${customer.id}`, customer.pin);
  } catch (e) {
    console.error('Error saving isolated customer:', e);
  }
  return next;
}

