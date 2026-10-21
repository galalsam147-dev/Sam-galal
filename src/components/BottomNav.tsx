import React from 'react';
import { Home, MapPin, Heart, FolderCog } from 'lucide-react';
import { SupportedLang } from '../types';
import { UI_TRANSLATIONS } from '../utils/uiI18n';

export type BottomNavTab = 'home' | 'nearest' | 'favorites' | 'chats' | 'profile' | 'userProfile' | 'settings';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
  lang: SupportedLang;
  favoritesCount?: number;
  onOpenSettings?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  lang,
  favoritesCount = 0,
  onOpenSettings,
}) => {
  const tUi = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.ar;

  return (
    <nav className="h-[56px] bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-1 z-40 shrink-0 select-none text-white max-w-xl mx-auto w-full">
      {/* 1. الرئيسية / تيك توك */}
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
          activeTab === 'home' ? 'text-[#FF2D55] font-black scale-105' : 'text-white/60 hover:text-white'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5 font-bold">{tUi.home}</span>
      </button>

      {/* 2. المفضلة ❤️ */}
      <button
        onClick={() => onSelectTab('favorites')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer relative ${
          activeTab === 'favorites' ? 'text-rose-500 font-black scale-105' : 'text-white/60 hover:text-white'
        }`}
      >
        <div className="relative">
          <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-rose-500 stroke-rose-500' : ''}`} />
          {favoritesCount > 0 && (
            <span className="absolute -top-1 -end-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
              {favoritesCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 font-bold">{tUi.favorites}</span>
      </button>

      {/* 3. الأقرب لي بالـ GPS */}
      <button
        onClick={() => onSelectTab('nearest')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
          activeTab === 'nearest' ? 'text-emerald-400 font-black scale-105' : 'text-white/60 hover:text-white'
        }`}
      >
        <MapPin className={`w-5 h-5 ${activeTab === 'nearest' ? 'fill-emerald-400 text-black' : ''}`} />
        <span className="text-[10px] mt-0.5 font-bold">{tUi.nearest}</span>
      </button>

      {/* 4. الإعدادات والخيارات (فولدر شامل لكل الخيارات) */}
      <button
        onClick={() => {
          if (onOpenSettings) onOpenSettings();
          else onSelectTab('settings');
        }}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
          activeTab === 'settings' ? 'text-amber-400 font-black scale-105' : 'text-white/60 hover:text-white'
        }`}
      >
        <FolderCog className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5 font-bold">{tUi.settings}</span>
      </button>
    </nav>
  );
};

