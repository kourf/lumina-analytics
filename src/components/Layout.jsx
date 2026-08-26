import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Sparkles, Globe, Sun, Moon, Menu, Settings } from 'lucide-react';
import { YoutubeIcon, InstagramIcon, TikTokIcon, LinkedinIcon, DiscordIcon } from './SocialIcons';
import { MOCK_DATA } from '../data/mockData';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/youtube', icon: YoutubeIcon, label: 'YouTube' },
  { path: '/instagram', icon: InstagramIcon, label: 'Instagram' },
  { path: '/tiktok', icon: TikTokIcon, label: 'TikTok' },
  { path: '/linkedin', icon: LinkedinIcon, label: 'LinkedIn' },
  { path: '/discord', icon: DiscordIcon, label: 'Discord' },
  { path: '/website', icon: Globe, label: 'Site Web' },
  { path: '/insights', icon: Sparkles, label: 'Assistant IA' },
];

export const Layout = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      if ('theme' in localStorage) {
        return localStorage.theme === 'dark';
      }
      // Par défaut toujours dark pour ce projet
      return true;
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDark]);

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex bg-lumina-light dark:bg-lumina-dark text-gray-900 dark:text-lumina-light transition-colors duration-300">
      
      {/* Sidebar (Desktop & Tablet) */}
      <aside className="hidden md:flex flex-col w-20 hover:w-64 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) bg-white/50 dark:bg-lumina-darkSurface/50 backdrop-blur-xl border-r border-gray-200 dark:border-lumina-darkBorder fixed h-full z-40 group overflow-hidden">
        <div className="h-20 flex items-center justify-center group-hover:justify-start group-hover:px-6 transition-all">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lumina-primary to-lumina-secondary flex items-center justify-center flex-shrink-0 shadow-lg shadow-lumina-primary/30">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="ml-3 font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-lumina-primary to-lumina-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Karamokho
          </span>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3.5 py-3 rounded-xl transition-all duration-300 flex-shrink-0 ${
                    isActive 
                      ? 'bg-lumina-primary text-white shadow-lg shadow-lumina-primary/20' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-lumina-darkElevated'
                  }`
                }
              >
                <Icon size={22} className="flex-shrink-0" />
                <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-20 min-h-screen min-w-0 max-w-full">
        
        {/* Topbar (Floating & Sticky) */}
        <div className="p-4 md:p-6 sticky top-0 z-30">
          <header className="w-full h-16 bg-white/70 dark:bg-lumina-darkSurface/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-lumina-darkBorder shadow-sm flex justify-between items-center px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-tr from-lumina-primary to-lumina-secondary flex items-center justify-center flex-shrink-0 shadow-lg shadow-lumina-primary/30">
                <span className="text-white font-bold text-xs">K</span>
              </div>
              <div>
                <h1 className="text-sm md:text-base font-bold text-gray-900 dark:text-white hidden sm:block">Tableau de bord</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={() => setIsDark(!isDark)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-lumina-darkElevated transition-colors"
                title="Changer le thème"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-lumina-darkElevated transition-colors"
                title="Paramètres globaux"
              >
                <Settings size={20} />
              </button>
              <a href={MOCK_DATA.user.links.taap} target="_blank" rel="noreferrer" className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden border-2 border-transparent hover:border-lumina-primary transition-all shadow-sm">
                <img src={MOCK_DATA.user.profilePic || "https://ui-avatars.com/api/?name=Karamokho&background=2563EB&color=fff"} alt="Profile" className="w-full h-full object-cover" />
              </a>
            </div>
          </header>
        </div>

        {/* Content Area */}
        <main className="flex-1 px-4 md:px-8 pb-28 md:pb-8 w-full max-w-7xl mx-auto min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Floating Bottom Navigation (Mobile Only) */}
      <div className="md:hidden fixed bottom-6 w-full flex justify-center z-50 px-4 pointer-events-none">
        <nav className="pointer-events-auto w-full max-w-[100vw] overflow-x-auto hide-scrollbar bg-white/90 dark:bg-lumina-darkSurface/90 backdrop-blur-xl rounded-[2rem] p-2 flex justify-start gap-1 items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-lumina-darkBorder">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const shortLabel = item.label === 'Assistant IA' ? 'IA' : item.label === 'LinkedIn' ? 'In' : item.label;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `p-1.5 sm:p-2 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center min-w-[56px] min-h-[44px] flex-shrink-0 ${
                    isActive 
                      ? 'bg-lumina-primary text-white shadow-md transform -translate-y-1' 
                      : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-lumina-darkElevated'
                  }`
                }
                title={item.label}
              >
                <Icon size={20} className="mb-0.5" />
                <span className="text-[9px] font-semibold tracking-wide truncate w-full text-center">
                  {shortLabel}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>

    </div>
  );
};

