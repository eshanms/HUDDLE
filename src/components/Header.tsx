/**
 * HUDDLE Header & Navigation Architecture
 * "Plan it. Perfect it. Save it."
 *
 * Provides structured 3-zone desktop navigation with an overflow menu
 * and a full-featured, accessible mobile navigation drawer.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  LifeBuoy,
  LayoutDashboard,
  CalendarPlus,
  Palette,
  Settings as SettingsIcon,
  ChevronDown,
  Layers,
  LogIn,
  LogOut,
  Cloud,
  Loader2,
  Zap,
  Menu,
  X,
  Compass,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { EventPlan } from '../types';
import { useAuth } from '../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'create'
  | 'audit'
  | 'rescue'
  | 'simulator'
  | 'creative'
  | 'workspace'
  | 'settings';

interface HeaderProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  events: EventPlan[];
  activeEvent: EventPlan | null;
  onSelectEvent: (event: EventPlan) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  events,
  activeEvent,
  onSelectEvent,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, loading: authLoading, signIn, signOut, authError, clearError } = useAuth();

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setUserDropdownOpen(false);
        setMoreMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMobileNavigate = (tab: NavTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  const isSecondaryActive =
    currentTab === 'rescue' || currentTab === 'simulator' || currentTab === 'creative';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* ZONE 1: BRAND IDENTITY (Left) */}
          <div
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => {
              onNavigate('dashboard');
              setMobileMenuOpen(false);
            }}
          >
            <div className="w-10 h-10 rounded-2xl bg-[#3B1828] text-white flex items-center justify-center font-serif font-black text-xl shadow-md group-hover:scale-105 transition-transform shrink-0">
              H
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-2xl tracking-tight text-[#3B1828]">
                  HUDDLE
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#E06D53]/15 text-[#E06D53] border border-[#E06D53]/25 hidden sm:inline-block">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-[#78716C] font-medium tracking-wide hidden xl:block">
                Plan it. Perfect it. Save it.
              </p>
            </div>
          </div>

          {/* ZONE 2: PRIMARY NAVIGATION (Center - Desktop Only) */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F3EFEA] p-1.5 rounded-2xl border border-[#E4DDD3] shrink-0">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-white text-[#3B1828] shadow-xs font-bold'
                  : 'text-[#57534E] hover:text-[#3B1828] hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('create')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'create'
                  ? 'bg-white text-[#3B1828] shadow-xs font-bold'
                  : 'text-[#57534E] hover:text-[#3B1828] hover:bg-white/50'
              }`}
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#E06D53]" />
              <span>Create Event</span>
            </button>

            {activeEvent && (
              <button
                onClick={() => onNavigate('workspace')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  currentTab === 'workspace'
                    ? 'bg-white text-[#3B1828] shadow-xs font-bold'
                    : 'text-[#57534E] hover:text-[#3B1828] hover:bg-white/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Workspace</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'audit'
                  ? 'bg-white text-[#3B1828] shadow-xs font-bold'
                  : 'text-[#57534E] hover:text-[#3B1828] hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Audit</span>
            </button>

            {/* Overflow "More" Dropdown Menu for Secondary Tools */}
            <div className="relative">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSecondaryActive || moreMenuOpen
                    ? 'bg-white text-[#3B1828] shadow-xs font-bold'
                    : 'text-[#57534E] hover:text-[#3B1828] hover:bg-white/50'
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
                <span>Tools</span>
                <ChevronDown className="w-3 h-3 text-[#78716C]" />
              </button>

              {moreMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E8E2D8] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#78716C] border-b border-[#F0EAE1]">
                    Specialized AI Modules
                  </div>

                  <button
                    onClick={() => {
                      onNavigate('rescue');
                      setMoreMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${
                      currentTab === 'rescue'
                        ? 'bg-rose-50 text-rose-800 font-bold'
                        : 'hover:bg-[#FAF7F2] text-[#292325]'
                    }`}
                  >
                    <LifeBuoy className="w-4 h-4 text-[#E06D53] shrink-0" />
                    <div>
                      <span className="block font-bold">Rescue My Event</span>
                      <span className="text-[10px] text-[#78716C] font-normal">Emergency crisis triage</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('simulator');
                      setMoreMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${
                      currentTab === 'simulator'
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'hover:bg-[#FAF7F2] text-[#292325]'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="block font-bold">Crisis Simulator</span>
                      <span className="text-[10px] text-[#78716C] font-normal">Stress-test resilience</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('creative');
                      setMoreMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${
                      currentTab === 'creative'
                        ? 'bg-purple-50 text-purple-900 font-bold'
                        : 'hover:bg-[#FAF7F2] text-[#292325]'
                    }`}
                  >
                    <Palette className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <span className="block font-bold">Creative Studio</span>
                      <span className="text-[10px] text-[#78716C] font-normal">Theme & mood generator</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* ZONE 3: EVENT SELECTOR & ACCOUNT CONTROLS (Right) */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Active Event Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setUserDropdownOpen(false);
                  setMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#E8E2D8] hover:border-[#3B1828]/30 transition-all text-xs font-medium shadow-2xs cursor-pointer max-w-[150px] sm:max-w-[200px]"
                title="Switch Active Event"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="truncate text-[#3B1828] font-bold">
                  {activeEvent ? activeEvent.title : 'Select Event'}
                </span>
                {activeEvent?.isSample && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0 hidden sm:inline">
                    SAMPLE
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E8E2D8] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#78716C] border-b border-[#F0EAE1]">
                    Switch Active Event
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                    {events.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => {
                          onSelectEvent(e);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          activeEvent?.id === e.id
                            ? 'bg-[#3B1828] text-white'
                            : 'hover:bg-[#FAF7F2] text-[#292325]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold truncate">{e.title}</p>
                          <p
                            className={`text-[10px] ${
                              activeEvent?.id === e.id ? 'text-white/70' : 'text-[#78716C]'
                            }`}
                          >
                            {e.eventType} • {e.date}
                          </p>
                        </div>
                        {e.isSample && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              activeEvent?.id === e.id
                                ? 'bg-white/20 text-white'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            SAMPLE
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-[#F0EAE1] pt-1 mt-1">
                    <button
                      onClick={() => {
                        onNavigate('create');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#E06D53] hover:bg-[#E06D53]/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      + Create New Event
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => onNavigate('settings')}
              title="Settings"
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-[#3B1828] text-white border-[#3B1828]'
                  : 'bg-white text-[#57534E] border-[#E8E2D8] hover:text-[#3B1828] hover:border-[#3B1828]/30'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* User Auth Profile Control */}
            {authLoading ? (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E8E2D8] text-xs text-[#78716C] shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
            ) : user ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setDropdownOpen(false);
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-[#E8E2D8] hover:border-[#3B1828]/30 transition-all text-xs shadow-2xs cursor-pointer"
                  title="Account Details"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-6 h-6 rounded-full object-cover border border-[#E8E2D8] shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#3B1828] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className="w-3 h-3 text-[#78716C] shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E8E2D8] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-3 pb-3 border-b border-[#F0EAE1]">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="w-9 h-9 rounded-full object-cover border border-[#E8E2D8] shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#3B1828] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-bold text-xs text-[#3B1828] truncate">
                          {user.displayName || 'Event Organizer'}
                        </p>
                        <p className="text-[10px] text-[#78716C] truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1.5 text-[11px] text-[#57534E]">
                      <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-[#FAF7F2]">
                        <span className="flex items-center gap-1.5 text-[#3B1828] font-medium">
                          <Cloud className="w-3 h-3 text-emerald-600" />
                          Cloud Storage
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Connected
                        </span>
                      </div>
                      <p className="text-[10px] text-[#78716C] px-1">
                        Events and audits are securely isolated under your account via Firestore rules.
                      </p>
                    </div>

                    <div className="border-t border-[#F0EAE1] pt-2">
                      <button
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await signOut();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signIn}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#3B1828] text-white hover:bg-[#2D121F] transition-all text-xs font-bold shadow-2xs shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button (lg:hidden) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-white border border-[#E8E2D8] text-[#3B1828] hover:bg-[#FAF7F2] transition-colors cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-800 flex items-center justify-between">
            <span>{authError}</span>
            <button
              onClick={clearError}
              className="text-rose-600 font-bold hover:underline ml-3 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* MOBILE NAVIGATION DRAWER / PANEL (lg:hidden) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8E2D8] bg-[#FAF7F2] shadow-2xl animate-in slide-in-from-top-2 duration-200 overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
            
            {/* Active Event Banner in Mobile Drawer */}
            {activeEvent && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2D8] flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block">Active Workspace Event</span>
                  <span className="text-xs font-bold text-[#3B1828] truncate block">{activeEvent.title}</span>
                </div>
                <button
                  onClick={() => handleMobileNavigate('workspace')}
                  className="px-3 py-1.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Open Workspace →
                </button>
              </div>
            )}

            {/* Primary Mobile Links */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] px-3 block mb-1">
                Main Navigation
              </span>

              <button
                onClick={() => handleMobileNavigate('dashboard')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'bg-[#3B1828] text-white shadow-xs'
                    : 'bg-white text-[#3B1828] border border-[#E8E2D8] hover:bg-[#F3EFEA]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 text-[#E06D53]" />
                  <span>Dashboard</span>
                </div>
                {currentTab === 'dashboard' && <span className="text-[10px] font-normal">Active</span>}
              </button>

              <button
                onClick={() => handleMobileNavigate('create')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'create'
                    ? 'bg-[#3B1828] text-white shadow-xs'
                    : 'bg-white text-[#3B1828] border border-[#E8E2D8] hover:bg-[#F3EFEA]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarPlus className="w-4 h-4 text-[#E06D53]" />
                  <span>Create New Event</span>
                </div>
                {currentTab === 'create' && <span className="text-[10px] font-normal">Active</span>}
              </button>

              {activeEvent && (
                <button
                  onClick={() => handleMobileNavigate('workspace')}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    currentTab === 'workspace'
                      ? 'bg-[#3B1828] text-white shadow-xs'
                      : 'bg-white text-[#3B1828] border border-[#E8E2D8] hover:bg-[#F3EFEA]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-[#E06D53]" />
                    <span>Event Workspace</span>
                  </div>
                  {currentTab === 'workspace' && <span className="text-[10px] font-normal">Active</span>}
                </button>
              )}

              <button
                onClick={() => handleMobileNavigate('audit')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'audit'
                    ? 'bg-[#3B1828] text-white shadow-xs'
                    : 'bg-white text-[#3B1828] border border-[#E8E2D8] hover:bg-[#F3EFEA]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Audit My Event</span>
                </div>
                {currentTab === 'audit' && <span className="text-[10px] font-normal">Active</span>}
              </button>
            </div>

            {/* Specialized AI Modules Section in Mobile Drawer */}
            <div className="space-y-1 pt-2 border-t border-[#E8E2D8]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] px-3 block mb-1">
                Specialized AI Tools
              </span>

              <button
                onClick={() => handleMobileNavigate('rescue')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'rescue'
                    ? 'bg-[#E06D53] text-white shadow-xs'
                    : 'bg-white text-rose-900 border border-rose-200 hover:bg-rose-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LifeBuoy className="w-4 h-4 text-[#E06D53]" />
                  <span>Rescue My Event</span>
                </div>
                {currentTab === 'rescue' && <span className="text-[10px] font-normal">Active</span>}
              </button>

              <button
                onClick={() => handleMobileNavigate('simulator')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'simulator'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Crisis Simulator</span>
                </div>
                {currentTab === 'simulator' && <span className="text-[10px] font-normal">Active</span>}
              </button>

              <button
                onClick={() => handleMobileNavigate('creative')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'creative'
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-white text-purple-950 border border-purple-200 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>Creative Studio</span>
                </div>
                {currentTab === 'creative' && <span className="text-[10px] font-normal">Active</span>}
              </button>
            </div>

            {/* Account & Settings in Mobile Drawer */}
            <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between gap-3 text-xs">
              <button
                onClick={() => handleMobileNavigate('settings')}
                className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-[#E8E2D8] text-[#3B1828] font-bold flex-1 cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-[#78716C]" />
                <span>Settings</span>
              </button>

              {user ? (
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut();
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signIn();
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#3B1828] text-white font-bold flex-1 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
