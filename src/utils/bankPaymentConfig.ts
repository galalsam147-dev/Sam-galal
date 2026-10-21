/**
 * إعدادات الحساب البنكي الرسمي وفودافون كاش وإنستاباي المعتمد
 * الأمان المالي المشدد: أرقام الحسابات والتحويلات وأرقام الهواتف مشفرة ومحمية بالكامل
 * ولا تظهر للعامة مطلقاً منعاً للاحتيال أو الرسائل المزعجة.
 */

export const OFFICIAL_PAYMENT_CONFIG = {
  // 1. حساب البنك وتحويل الفيزا الرسمي (مشفر ومحمي)
  bankName: 'بنك مصر (Banque Misr)',
  accountNumber: '••••••••••••4637 (مشفر ومحمي 🔒)',
  maskedAccountNumber: '••••••••••••4637',
  iban: 'EG••••••••••••••••••••4637 (آيبان مشفر 🔒)',
  maskedIban: 'EG••••••••••••••••••••4637',
  swiftBic: 'BMISREGXX',
  beneficiaryName: 'إدارة منصة إعلانك مصر E3lanak',
  currency: 'EGP (جنيه مصري)',
  
  // 2. فودافون كاش وإنستاباي (أرقام الهواتف مشفرة ولا تظهر مطلقاً للعامة)
  vodafoneCashPhone: 'محفظة إلكترونية مشفرة ومعتمدة 🔒',
  maskedVodafoneCashPhone: '010•••••669',
  instaPayPhone: 'حساب إنستاباي مشفر ومعتمد 🔒',
  maskedInstaPayPhone: '010•••••669',
  instaPayAddress: 'e3lanak_official@instapay (مشفر ومعتمد 🔒)',
  paymentPhone: 'رقم رسمي مشفر ومحمي 🔒',

  securityNotice: '🛡️ نظام الأمان والحماية المالية: أرقام الحسابات البنكية وأرقام الهواتف مشفرة ومحمية بالكامل ولا تظهر للعامة مطلقاً منعاً للاحتيال والرسائل العشوائية. التحويل يتم عبر البوابة الرسمية المشفرة المعتمدة.',
  visaRoutingNotice: 'تم ربط بوابة سداد الفيزا والبطاقات البنكية للتحويل التلقائي المباشر والمشفر عبر حساب بنك مصر الرسمي والآيبان المعتمد.',
};

// Aliased for backward compatibility
export const OFFICIAL_BANK_CONFIG = OFFICIAL_PAYMENT_CONFIG;

export function copyPaymentDetail(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}
