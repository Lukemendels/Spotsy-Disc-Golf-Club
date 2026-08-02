import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Calendar,
  Users,
  GraduationCap,
  Sparkles,
  MapPin,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Disc,
  LogOut,
  LogIn
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { userProfile, signInWithGoogle, signInDemoUser, signOut, toggleDemoAdminRole } = useAuth();
  const isAdmin = userProfile?.role === "club_admin";

  const navItems = [
    { id: "home", label: "Dashboard", icon: Home },
    { id: "events", label: "Events", icon: Calendar },
    { id: "rounds", label: "Casual Rounds", icon: Users },
    { id: "beginner", label: "New Players", icon: GraduationCap },
    { id: "join", label: "Join the Club", icon: Sparkles },
    { id: "courses", label: "Courses", icon: MapPin },
    { id: "leadership", label: "Leadership", icon: UserCheck },
  ];

  if (isAdmin) {
    navItems.push({ id: "admin", label: "Admin Panel", icon: ShieldAlert });
  }

  return (
    <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col shrink-0 border-r border-slate-800 h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div
        onClick={() => setActiveTab("home")}
        className="p-5 flex items-center gap-3 cursor-pointer group hover:bg-slate-800/50 transition-colors"
      >
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md shadow-green-950/50 group-hover:scale-105 transition-transform">
          S
        </div>
        <div>
          <h1 className="text-white font-bold leading-none text-lg tracking-tight">Spotsy DG</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5 font-medium">Digital Platform</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 py-2 overflow-y-auto scroll-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-slate-800 text-white border-l-4 border-green-500 shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 shrink-0 ${isActive ? "text-green-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
              {item.id === "admin" && (
                <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-slate-950 rounded uppercase">
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Quick Admin Control at Bottom */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 mt-auto space-y-3">
        {userProfile ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-xs">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white max-w-[110px] truncate">{userProfile.displayName}</p>
                  <p className="text-slate-400 text-[10px] capitalize">
                    {userProfile.role === "club_admin" ? "Club Admin" : "Member"}
                  </p>
                </div>
              </div>
              <button
                onClick={signOut}
                title="Sign Out"
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setActiveTab(isAdmin ? "admin" : "join")}
              className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold transition-colors uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAdmin ? "Admin Panel" : "Club Portal"}</span>
            </button>

            <button
              onClick={toggleDemoAdminRole}
              className="w-full mt-2 py-1 text-[10px] text-amber-300 hover:text-amber-200 text-center font-medium block underline decoration-amber-500/40"
            >
              Toggle Role ({isAdmin ? "Admin" : "Member"})
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => signInDemoUser("user")}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700"
              >
                Demo Login
              </button>
              <button
                onClick={() => signInDemoUser("club_admin")}
                className="flex-1 py-1.5 bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 rounded text-xs font-bold border border-amber-500/40"
              >
                Admin Mode
              </button>
            </div>
            <button
              onClick={signInWithGoogle}
              className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold transition-colors uppercase tracking-wider"
            >
              Google Sign In
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
