import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Disc,
  Calendar,
  Users,
  GraduationCap,
  Sparkles,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  LogOut,
  LogIn,
  Menu,
  X,
  Home,
  Check
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { userProfile, signInWithGoogle, signInDemoUser, signOut, toggleDemoAdminRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isAdmin = userProfile?.role === "club_admin";

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "events", label: "Events", icon: Calendar },
    { id: "rounds", label: "Find a Round", icon: Users },
    { id: "beginner", label: "New to Disc Golf", icon: GraduationCap },
    { id: "join", label: "Join the Club", icon: Sparkles },
    { id: "courses", label: "Courses", icon: MapPin },
    { id: "leadership", label: "Leadership", icon: UserCheck },
  ];

  if (isAdmin) {
    navItems.push({ id: "admin", label: "Admin Panel", icon: ShieldAlert });
  }

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block leading-none">
                Spotsy <span className="text-emerald-400">Disc Golf</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Club & Digital Platform
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/50"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.id === "admin" && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded uppercase">
                      Admin
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Admin Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Quick Admin Role Switcher for Demo */}
            <button
              onClick={toggleDemoAdminRole}
              title="Click to toggle between Admin and Member mode for testing"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                isAdmin
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
              }`}
            >
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Mode Active</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Test Admin Role</span>
                </>
              )}
            </button>

            {userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-full py-1 px-3 text-sm text-slate-200 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-emerald-100 flex items-center justify-center font-bold text-xs">
                    {userProfile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate font-medium">
                    {userProfile.displayName}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-slate-200">
                    <div className="px-4 py-2 border-b border-slate-700">
                      <p className="font-semibold text-sm text-white">{userProfile.displayName}</p>
                      <p className="text-xs text-slate-400 capitalize">
                        Role: <span className="text-emerald-400 font-semibold">{userProfile.role}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Exp: {userProfile.experienceLevel}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        toggleDemoAdminRole();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-amber-300 hover:bg-slate-700 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Switch Role ({isAdmin ? "Make Member" : "Make Admin"})
                    </button>

                    <button
                      onClick={() => {
                        signOut();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-slate-700 flex items-center gap-2 border-t border-slate-700/50 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => signInDemoUser("user")}
                  className="inline-flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Demo Login</span>
                </button>
                <button
                  onClick={signInWithGoogle}
                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                >
                  <span>Google Sign In</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleDemoAdminRole}
              className="p-1.5 bg-slate-800 rounded-lg text-amber-400 text-xs border border-slate-700"
              title="Toggle Admin Role"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {isActive && <Check className="w-4 h-4" />}
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800 mt-2 flex flex-col gap-2">
            {userProfile ? (
              <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
                <div>
                  <p className="font-semibold text-white text-sm">{userProfile.displayName}</p>
                  <p className="text-xs text-emerald-400 capitalize">Role: {userProfile.role}</p>
                </div>
                <button
                  onClick={signOut}
                  className="text-xs bg-rose-900/50 hover:bg-rose-900 text-rose-300 px-3 py-1.5 rounded-lg border border-rose-800"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    signInDemoUser("user");
                    setMobileMenuOpen(false);
                  }}
                  className="bg-slate-800 text-slate-200 py-2 rounded-lg text-xs font-semibold border border-slate-700"
                >
                  Member Login
                </button>
                <button
                  onClick={() => {
                    signInDemoUser("club_admin");
                    setMobileMenuOpen(false);
                  }}
                  className="bg-amber-600 text-slate-950 py-2 rounded-lg text-xs font-bold"
                >
                  Admin Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
