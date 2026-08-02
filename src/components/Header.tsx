import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Event } from "../types";
import { Bell, ShieldCheck, LogIn, Menu, X, Disc } from "lucide-react";

interface HeaderProps {
  events: Event[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  events,
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { userProfile, signInWithGoogle, signInDemoUser, toggleDemoAdminRole } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  // Find next upcoming event
  const upcoming = [...events]
    .filter((e) => new Date(e.startDateTime).getTime() > Date.now() - 86400000)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())[0];

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-20 shadow-xs">
      {/* Mobile Brand / Status Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="lg:hidden w-7 h-7 rounded-full bg-green-500 text-white font-bold flex items-center justify-center text-xs">
            S
          </div>
          <span className="text-slate-900 font-bold text-sm uppercase tracking-wider hidden sm:inline">
            Loriella Park
          </span>
          <span className="text-green-600 font-bold bg-green-50 border border-green-200 px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span>Open: Clear Weather</span>
          </span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4 sm:gap-6">
        {upcoming && (
          <div className="hidden md:block text-right cursor-pointer" onClick={() => setActiveTab("events")}>
            <p className="text-[10px] uppercase font-bold text-slate-400">Next Event</p>
            <p className="text-xs font-bold text-slate-800 hover:text-green-600 transition">
              {upcoming.title}
            </p>
          </div>
        )}

        {/* Bell Notification Trigger */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
            title="Notifications"
          >
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            <Bell className="w-4 h-4" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs text-slate-700 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                  2 New
                </span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="font-semibold text-slate-800">New Casual Round Posted</p>
                  <p className="text-[11px] text-slate-500">Loriella Short Tees @ 4:30 PM today</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="font-semibold text-slate-800">Bag Tag Match Announced</p>
                  <p className="text-[11px] text-slate-500">Weekly Loriella Singles Saturday 10 AM</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User profile button for small screens / header */}
        {userProfile ? (
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
              {userProfile.displayName}
            </span>
            <div className="w-7 h-7 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {userProfile.displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <button
            onClick={() => signInDemoUser("user")}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
