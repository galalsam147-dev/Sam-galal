import React from 'react';

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'فنادق ومنتجعات': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080&auto=format&fit=crop&q=85',
  'فنادق': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1080&auto=format&fit=crop&q=85',
  'مطاعم': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&auto=format&fit=crop&q=85',
  'سندوتشات ووجبات سريعة': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1080&auto=format&fit=crop&q=85',
  'كافيهات': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1080&auto=format&fit=crop&q=85',
  'أطباء': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1080&auto=format&fit=crop&q=85',
  'أطباء وعيادات': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1080&auto=format&fit=crop&q=85',
  'صيدليات ومستشفيات': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1080&auto=format&fit=crop&q=85',
  'كوافير وتجميل': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1080&auto=format&fit=crop&q=85',
  'عقارات التجمع والكمبوندات': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&auto=format&fit=crop&q=85',
  'عقارات': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1080&auto=format&fit=crop&q=85',
  'تاكسي وأجرة': 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=1080&auto=format&fit=crop&q=85',
  'موتوسيكل ودليفري': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1080&auto=format&fit=crop&q=85',
  'سيارات ليموزين': 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1080&auto=format&fit=crop&q=85',
  'أتوبيسات رحلات وسياحة وعمرة': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1080&auto=format&fit=crop&q=85',
  'اتوبيس وسيارات مدرسة': 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1080&auto=format&fit=crop&q=85',
  'شحن ونقل ثقيل': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1080&auto=format&fit=crop&q=85',
  'عمال ونقل أثاث': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1080&auto=format&fit=crop&q=85',
  'قطع غيار': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1080&auto=format&fit=crop&q=85',
  'أصحاب حرف': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1080&auto=format&fit=crop&q=85',
  'حرفيين وصيانة منزلية': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1080&auto=format&fit=crop&q=85',
  'سباكة وأدوات صحية': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1080&auto=format&fit=crop&q=85',
  'مستلزمات منازل وصناعية': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1080&auto=format&fit=crop&q=85',
  'خدمات كمبوندات والتجمع': 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?w=1080&auto=format&fit=crop&q=85',
  'محاسبين قانونيين': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1080&auto=format&fit=crop&q=85',
  'محامين': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1080&auto=format&fit=crop&q=85',
  'خبراء': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1080&auto=format&fit=crop&q=85',
  'سياحة': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1080&auto=format&fit=crop&q=85',
};

export const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080&auto=format&fit=crop&q=85';

export function getFallbackImageForCategory(cat?: string): string {
  if (!cat) return DEFAULT_FALLBACK_IMAGE;
  return CATEGORY_FALLBACK_IMAGES[cat] || DEFAULT_FALLBACK_IMAGE;
}

export function getValidImageUrl(url?: string, cat?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return getFallbackImageForCategory(cat);
  }
  return url.trim();
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  cat?: string
) {
  const target = e.currentTarget;
  const fallback = getFallbackImageForCategory(cat);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
