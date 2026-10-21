import { StaffMember, StaffPermissions, Business } from '../types';

const STAFF_STORAGE_KEY = 'dalilk_staff_members_v1';
const PENDING_CHANGES_KEY = 'dalilk_pending_ad_changes_v1';

export interface PendingAdSubmission {
  id: string;
  businessId: string | number;
  type: 'new_ad' | 'edit_ad' | 'delete_request' | 'hide_request';
  submittedByStaffId: string;
  submittedByStaffName: string;
  staffNumber: number;
  submittedAt: number;
  businessData: Partial<Business>;
  previousData?: Partial<Business>;
  changesSummary: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedAt?: number;
}

export interface TaskPreset {
  id: string;
  title: string;
  details: string;
  permissions: StaffPermissions;
}

export const STAFF_TASK_PRESETS: TaskPreset[] = [
  {
    id: 'approval_moderation',
    title: 'الرقابة على النشر والاشتراك (موافق / غير موافق)',
    details: 'فحص ومراجعة طلبات الإعلانات والاشتراكات ومنح الموافقة أو الرفض الفوري (موافق / غير موافق) لمنع أي محتوى مخالف.',
    permissions: {
      canReviewAds: true,
      canInputData: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canHide: true,
      canApproveReject: true,
      canReviewMedia: true,
      canBlockSubscribers: true,
    },
  },
  {
    id: 'add_subscribers_media',
    title: 'إضافة مشتركين يدوياً والرقابة على الصور والفيديوهات',
    details: 'إدخال المشتركين الجدد والبيانات، وتدقيق الصور والفيديوهات والريلز والتأكد من مطابقتها لمعايير الجودة والأسعار.',
    permissions: {
      canReviewAds: true,
      canInputData: true,
      canEdit: true,
      canAdd: true,
      canDelete: false,
      canHide: true,
      canApproveReject: true,
      canReviewMedia: true,
      canBlockSubscribers: false,
    },
  },
  {
    id: 'manual_edit_delete',
    title: 'التعديل والحذف اليدوي لأي شيء بالمنصة',
    details: 'تعديل وحذف أي شيء يدوي (بيانات، أرقام الهواتف، الأسعار، الحجوزات 1-300، الصور، الفيديوهات) وحذف الإعلانات المخالفة.',
    permissions: {
      canReviewAds: true,
      canInputData: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canHide: true,
      canApproveReject: false,
      canReviewMedia: true,
      canBlockSubscribers: true,
    },
  },
  {
    id: 'block_disable_show',
    title: 'التحكم في المشتركين (حجب / تعطيل / إظهار)',
    details: 'حجب أو تعطيل أو إظهار الأنشطة والمشتركين، وإيقاف الحسابات المخالفة أو استعادتها وتفعيلها بقرار إداري مباشر.',
    permissions: {
      canReviewAds: true,
      canInputData: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canHide: true,
      canApproveReject: true,
      canReviewMedia: true,
      canBlockSubscribers: true,
    },
  },
];

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: 'staff_1',
    staffNumber: 1,
    name: 'مساعد 1 - الرقابة على النشر والاشتراك (موافق / غير موافق)',
    username: 'staff1',
    password: '111',
    pin: '1001',
    shiftHours: '09:00 ص - 05:00 م',
    isActive: true,
    isHidden: false,
    workOrderActive: true,
    assignedTaskTitle: 'الرقابة على النشر والاشتراك (موافق / غير موافق)',
    assignedTaskDetails: 'مراجعة طلبات الإعلانات والاشتراكات، ومنح الموافقة أو الرفض الفوري (موافق / غير موافق)، مع فحص مطابقة الشروط.',
    permissions: {
      canReviewAds: true,
      canInputData: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canHide: true,
      canApproveReject: true,
      canReviewMedia: true,
      canBlockSubscribers: true,
    },
    phone: '01011112221',
    notes: 'المساعد الأول: صلاحية اتخاذ قرار (موافق / غير موافق) على الإعلانات والاشتراكات',
    approvedAdsCount: 42,
    reviewedAdsCount: 68,
  },
  {
    id: 'staff_2',
    staffNumber: 2,
    name: 'مساعد 2 - إضافة مشتركين والرقابة على الصور والفيديوهات',
    username: 'staff2',
    password: '222',
    pin: '1002',
    shiftHours: '09:00 ص - 05:00 م',
    isActive: true,
    isHidden: false,
    workOrderActive: true,
    assignedTaskTitle: 'إضافة مشتركين يدوياً والرقابة على الصور والفيديوهات',
    assignedTaskDetails: 'إدخال المشتركين الجدد بجميع البيانات والأسعار، وفحص دقة وجودة الصور وفيديوهات الريلز.',
    permissions: {
      canReviewAds: true,
      canInputData: true,
      canEdit: true,
      canAdd: true,
      canDelete: false,
      canHide: true,
      canApproveReject: true,
      canReviewMedia: true,
      canBlockSubscribers: false,
    },
    phone: '01022223332',
    notes: 'المساعد الثاني: متخصص بإدخال المشتركين وتدقيق وسائط الميديا المرئية',
    approvedAdsCount: 31,
    reviewedAdsCount: 54,
  },
  {
    id: 'staff_3',
    staffNumber: 3,
    name: 'مساعد 3 - التعديل والحذف اليدوي لأي شيء',
    username: 'staff3',
    password: '333',
    pin: '1003',
    shiftHours: '10:00 ص - 06:00 م',
    isActive: true,
    isHidden: false,
    workOrderActive: true,
    assignedTaskTitle: 'التعديل والحذف اليدوي لأي شيء بالمنصة',
    assignedTaskDetails: 'التعديل اليدوي الفوري لأي رقم هاتف، خط ساخن، كشف، حجز، عنوان، أو صورة، وحذف المحتوى المخالف.',
    permissions: {
      canReviewAds: true,
      canInputData: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canHide: true,
      canApproveReject: false,
      canReviewMedia: true,
      canBlockSubscribers: true,
    },
    phone: '01033334443',
    notes: 'المساعد الثالث: صلاحيات التعديل اليدوي الشامل والحذف لأي عنصر أو اشتراك مخالف',
    approvedAdsCount: 19,
    reviewedAdsCount: 37,
  },
  {
    id: 'staff_4',
    staffNumber: 4,
    name: 'مساعد 4 - التحكم في المشتركين (حجب / تعطيل / إظهار)',
    username: 'staff4',
    password: '444',
    pin: '1004',
    shiftHours: '12:00 م - 08:00 م',
    isActive: true,
    isHidden: false,
    workOrderActive: true,
    assignedTaskTitle: 'التحكم في المشتركين (حجب / تعطيل / إظهار)',
    assignedTaskDetails: 'حجب وتعطيل المشتركين المخالفين أو المتأخرين، وإعادة إظهار وتفعيل الأنشطة بقرار إداري مباشر.',
    permissions: {
      canReviewAds: true,
      canInputData: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canHide: true,
      canApproveReject: true,
      canReviewMedia: true,
      canBlockSubscribers: true,
    },
    phone: '01044445554',
    notes: 'المساعد الرابع: صلاحيات الحجب، التعطيل، والإظهار الفوري لصفحات المشتركين',
    approvedAdsCount: 12,
    reviewedAdsCount: 29,
  },
  {
    id: 'staff_5',
    staffNumber: 5,
    name: 'موظف 5 - مساعد إضافي لإدخال البيانات',
    username: 'staff5',
    password: '555',
    pin: '1005',
    shiftHours: '02:00 م - 10:00 م',
    isActive: false,
    isHidden: false,
    workOrderActive: false,
    assignedTaskTitle: 'إدخال البيانات والتنسيق',
    assignedTaskDetails: 'إدخال بيانات المشتركين وتجهيز بطاقات الأنشطة بانتظار تفعيل المدير.',
    permissions: {
      canReviewAds: false,
      canInputData: true,
      canEdit: true,
      canAdd: true,
      canDelete: false,
      canHide: false,
      canApproveReject: false,
      canReviewMedia: false,
      canBlockSubscribers: false,
    },
    phone: '01055556665',
    notes: 'احتياطي - يتم تفعيله بأمر تشغيل من المدير العام عند ضغط العمل',
    approvedAdsCount: 8,
    reviewedAdsCount: 14,
  },
  {
    id: 'staff_6',
    staffNumber: 6,
    name: 'موظف 6 - مساعد إضافي لدعم الحجوزات 1-300',
    username: 'staff6',
    password: '666',
    pin: '1006',
    shiftHours: '04:00 م - 12:00 ص',
    isActive: false,
    isHidden: false,
    workOrderActive: false,
    assignedTaskTitle: 'متابعة دورة الحجز اليومية 1-300',
    assignedTaskDetails: 'متابعة وتفعيل دورة الحجز وتصفير العداد عند منتصف الليل.',
    permissions: {
      canReviewAds: true,
      canInputData: true,
      canEdit: true,
      canAdd: false,
      canDelete: false,
      canHide: false,
      canApproveReject: false,
      canReviewMedia: false,
      canBlockSubscribers: false,
    },
    phone: '01066667776',
    notes: 'احتياطي - دعم الحجوزات وتنسيق المواعيد',
    approvedAdsCount: 5,
    reviewedAdsCount: 11,
  },
  {
    id: 'staff_7',
    staffNumber: 7,
    name: 'موظف 7 - مساعد شفت ليلي للرقابة',
    username: 'staff7',
    password: '777',
    pin: '1007',
    shiftHours: '08:00 م - 04:00 ص',
    isActive: false,
    isHidden: false,
    workOrderActive: false,
    assignedTaskTitle: 'مراقبة الشفت الليلي وحظر السبام',
    assignedTaskDetails: 'الرقابة على الإعلانات الليلية وحجب أي إعلان أو فيديو مخالف.',
    permissions: {
      canReviewAds: true,
      canInputData: true,
      canEdit: false,
      canAdd: false,
      canDelete: false,
      canHide: true,
      canApproveReject: false,
      canReviewMedia: true,
      canBlockSubscribers: true,
    },
    phone: '01077778887',
    notes: 'احتياطي - شفت حراسة المنصة الليلي',
    approvedAdsCount: 0,
    reviewedAdsCount: 4,
  },
  {
    id: 'staff_8',
    staffNumber: 8,
    name: 'موظف 8 - مراقبة الطوارئ والنشر',
    username: 'staff8',
    password: '888',
    pin: '1008',
    shiftHours: '12:00 ص - 08:00 ص',
    isActive: false,
    isHidden: true,
    workOrderActive: false,
    assignedTaskTitle: 'مراقبة الطوارئ والنشر الفوري',
    assignedTaskDetails: 'شفت الفجر لحماية المنصة وتأمين الحسابات.',
    permissions: {
      canReviewAds: true,
      canInputData: false,
      canEdit: false,
      canAdd: false,
      canDelete: false,
      canHide: true,
      canApproveReject: false,
      canReviewMedia: true,
      canBlockSubscribers: true,
    },
    phone: '01088889998',
    notes: 'احتياطي - مخفي افتراضياً ويظهر عند تفعيل المدير',
    approvedAdsCount: 0,
    reviewedAdsCount: 1,
  },
];

/**
 * الحصول على قائمة الموظفين والمساعدين (1 إلى 8)
 */
export function getStaffMembers(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // ضمان وجود 8 موظفين دائماً مع دمج الصلاحيات الجديدة والمهام
        const staffMap = new Map(parsed.map((s: StaffMember) => [s.staffNumber, s]));
        return DEFAULT_STAFF.map((def) => {
          const existing = staffMap.get(def.staffNumber);
          if (!existing) return def;
          return {
            ...def,
            ...existing,
            assignedTaskTitle: existing.assignedTaskTitle || def.assignedTaskTitle,
            assignedTaskDetails: existing.assignedTaskDetails || def.assignedTaskDetails,
            permissions: {
              ...def.permissions,
              ...(existing.permissions || {}),
            },
          };
        });
      }
    }
  } catch (e) {
    console.error('Error reading staff members', e);
  }
  return DEFAULT_STAFF;
}

/**
 * استعادة الإعدادات الافتراضية للمساعدين والمهام الأربعة
 */
export function resetStaffToDefaults(): StaffMember[] {
  try {
    localStorage.removeItem(STAFF_STORAGE_KEY);
  } catch (e) {
    console.error('Error resetting staff members', e);
  }
  return DEFAULT_STAFF;
}

/**
 * حفظ قائمة الموظفين كاملة
 */
export function saveStaffMembers(list: StaffMember[]): void {
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving staff members', e);
  }
}

/**
 * تحديث موظف فردي (كلمة المرور، الاسم، ساعات العمل، الصلاحيات)
 */
export function updateStaffMember(updated: StaffMember): void {
  const current = getStaffMembers();
  const synced: StaffMember = {
    ...updated,
    password: updated.password.trim(),
    pin: updated.password.trim(),
  };
  const next = current.map((s) => (s.id === synced.id ? synced : s));
  saveStaffMembers(next);
}

/**
 * تبديل حالة تفعيل الموظف (فتح / غلق التفعيل من المدير)
 */
export function toggleStaffActive(staffId: string, isActive: boolean): void {
  const current = getStaffMembers();
  const next = current.map((s) => (s.id === staffId ? { ...s, isActive } : s));
  saveStaffMembers(next);
}

/**
 * إصدار أو سحب أمر التشغيل والتفعيل للموظف من المدير
 */
export function toggleStaffWorkOrder(staffId: string, workOrderActive: boolean): void {
  const current = getStaffMembers();
  const next = current.map((s) => (s.id === staffId ? { ...s, workOrderActive } : s));
  saveStaffMembers(next);
}

/**
 * إظهار أو إخفاء الموظف من القائمة
 */
export function toggleStaffHidden(staffId: string, isHidden: boolean): void {
  const current = getStaffMembers();
  const next = current.map((s) => (s.id === staffId ? { ...s, isHidden } : s));
  saveStaffMembers(next);
}

/**
 * تسجيل دخول الموظف والتحقق من كلمة المرور وحالة التفعيل وأمر التشغيل
 */
export function authenticateStaff(
  usernameOrPin: string,
  passOrPin: string
): { success: boolean; staff?: StaffMember; error?: string } {
  const staffList = getStaffMembers();
  const trimmedUser = usernameOrPin.trim().toLowerCase();
  const trimmedPass = passOrPin.trim();

  const found = staffList.find(
    (s) =>
      (s.username.toLowerCase() === trimmedUser || `مساعد ${s.staffNumber}` === usernameOrPin.trim() || `موظف ${s.staffNumber}` === usernameOrPin.trim()) &&
      s.password === trimmedPass
  );

  if (!found) {
    return { success: false, error: 'اسم المستخدم أو الباسورد غير صحيح! لا يفتح الحساب إلا بالباسورد الأخير فقط.' };
  }

  if (!found.isActive) {
    return {
      success: false,
      error: 'عذراً، هذا الحساب مغلق حالياً بأمر من مدير الإدارة العامة. يرجى مراجعة الإدارة لتفعيلك.',
    };
  }

  if (!found.workOrderActive) {
    return {
      success: false,
      error: 'الحساب مفعل ولكن لم يصدر لك أمر تشغيل وتفعيل نشط من المدير العام اليوم.',
    };
  }

  // تحديث وقت آخر تسجيل دخول
  const updated = { ...found, lastLoginAt: Date.now() };
  updateStaffMember(updated);

  return { success: true, staff: updated };
}

/**
 * إدارة طابور النشر والموافقة الإدارية
 * لا يتم نشر أي إعلان أو تعديل إلا بموافقة الإدارة
 */
export function getPendingAdSubmissions(): PendingAdSubmission[] {
  try {
    const raw = localStorage.getItem(PENDING_CHANGES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading pending submissions', e);
  }
  return [];
}

export function savePendingAdSubmissions(subs: PendingAdSubmission[]): void {
  try {
    localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(subs));
  } catch (e) {
    console.error('Error saving pending submissions', e);
  }
}

/**
 * إرسال إعلان جديد أو تعديل للمراجعة واعتماد الإدارة قبل النشر
 */
export function submitForAdminApproval(sub: Omit<PendingAdSubmission, 'id' | 'status' | 'submittedAt'>): PendingAdSubmission {
  const all = getPendingAdSubmissions();
  const newSub: PendingAdSubmission = {
    ...sub,
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    status: 'pending',
    submittedAt: Date.now(),
  };
  all.unshift(newSub);
  savePendingAdSubmissions(all);
  return newSub;
}

/**
 * موافقة المدير العام على الإعلان ونشره فوراً
 */
export function approveAdSubmission(subId: string): { success: boolean; submission?: PendingAdSubmission } {
  const all = getPendingAdSubmissions();
  const target = all.find((s) => s.id === subId);
  if (!target) return { success: false };

  target.status = 'approved';
  target.reviewedAt = Date.now();
  savePendingAdSubmissions(all);

  // تحديث عداد موافقات الموظف
  const staffList = getStaffMembers();
  const staff = staffList.find((s) => s.id === target.submittedByStaffId);
  if (staff) {
    staff.approvedAdsCount = (staff.approvedAdsCount || 0) + 1;
    updateStaffMember(staff);
  }

  return { success: true, submission: target };
}

/**
 * رفض الإعلان أو التعديل من المدير العام مع ذكر السبب
 */
export function rejectAdSubmission(subId: string, reason: string): { success: boolean } {
  const all = getPendingAdSubmissions();
  const target = all.find((s) => s.id === subId);
  if (!target) return { success: false };

  target.status = 'rejected';
  target.rejectionReason = reason;
  target.reviewedAt = Date.now();
  savePendingAdSubmissions(all);
  return { success: true };
}
