import React from 'react';
import { MoreVertical, Flame } from 'lucide-react';
import { SupportedCurrency, SupportedLang, SortOption } from '../types';
import { UI_TRANSLATIONS } from '../utils/uiI18n';
import { ProgramLogo } from './ProgramLogo';

interface TikTokHeaderProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  selectedSubCategory: string;
  onSelectSubCategory: (subCat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSelectSortBy: (sort: SortOption) => void;
  viewMode: 'reels' | 'grid';
  onToggleView: () => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  favoritesCount: number;
  showForSaleOnly: boolean;
  onToggleForSale: () => void;
  onDetectLocation: () => void;
  hasUserLocation: boolean;
  isLocating: boolean;
  onOpenDelivery?: () => void;
  deliveryCount?: number;
  onOpenUserProfile?: () => void;
  currentCurrency: SupportedCurrency;
  onOpenCurrencyModal: () => void;
  lang: SupportedLang;
  onSelectLang: (lang: SupportedLang) => void;
  userPoints?: number;
  onOpenSettings?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onOpenCaptainRegister?: () => void;
  onOpenMusicBank?: () => void;
  onOpenNearbyDispatch?: () => void;
  onOpenTransportTracking?: () => void;
  onOpenAppInstall?: () => void;
  onOpenSecurityNotice?: () => void;
  onOpenAdd?: () => void;
  onOpenOfficialDomain?: () => void;
  onOpenOrderNowDirectory?: () => void;
  onOpenAssistantPortal?: () => void;
}

export const TikTokHeader: React.FC<TikTokHeaderProps> = ({
  selectedCategory,
  onSelectCategory,
  lang,
  onOpenSettings,
}) => {
  const tUi = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.ar;

  return (
    <header className="absolute top-0 inset-x-0 z-40 bg-gradient-to-b from-black/85 via-black/45 to-transparent pt-2 pb-2.5 px-3 sm:px-6 select-none text-white pointer-events-none w-full">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-4 pointer-events-auto">
        
        {/* Right: Brand Logo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ProgramLogo
            variant="compact"
            onClick={() => onSelectCategory('الكل')}
            showSubtitle={false}
          />
        </div>

        {/* Center: Moving Ticker Strip (شريط متابعاتنا والإعلانات المتحرك - سريع وسلس بدون تحذيرات تبطئه) */}
        <div 
          onClick={() => onOpenSettings?.()}
          className="flex-1 max-w-3xl mx-auto bg-black/80 hover:bg-black/90 border border-white/15 rounded-full px-3 py-1 flex items-center gap-2 overflow-hidden cursor-pointer shadow-md transition"
          title="شريط متابعاتنا والإعلانات المتحرك السريع"
        >
          <span className="bg-gradient-to-r from-[#FF2D55] to-amber-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-yellow-300 text-yellow-300" />
            <span>متابعاتنا</span>
          </span>
          <div className="overflow-hidden flex-1">
            <div className="anim-marquee speed-slow text-[11px] sm:text-xs font-bold text-amber-300 whitespace-nowrap">
              {selectedCategory !== 'الكل' ? `🏷️ ${selectedCategory} • ` : ''}
              🌟 منصة إعلانك • اشترك الآن + مجاناً 3 شهور • حجز فوري (1-300) • توصيل وتاكسي GPS ⚡
            </div>
          </div>
        </div>

        {/* Left: Unified 3-Dots Settings Button (جمع كل الزراير في إعدادات 3 نقط ⋮) */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => onOpenSettings?.()}
            className="bg-black/70 hover:bg-[#FF2D55] text-white px-2.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1 transition border border-white/25 hover:border-[#FF2D55] shadow-xl cursor-pointer"
            title={tUi.settingsFolderBtn || 'إعدادات وجميع الأزرار (3 نقط ⋮)'}
          >
            <MoreVertical className="w-4 h-4 text-amber-300 stroke-[2.8]" />
            <span className="text-[11px] font-black">إعدادات</span>
          </button>
        </div>

      </div>
    </header>
  );
};
