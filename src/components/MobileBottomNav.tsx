import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Calendar,
  Users,
  GraduationCap,
  Sparkles,
  MapPin,
  ShieldAlert
} from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "club_admin";

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "events", label: "Events", icon: Calendar },
    { id: "rounds", label: "Rounds", icon: Users },
    { id: "beginner", label: "Guide", icon: GraduationCap },
    { id: "join", label: "Club", icon: Sparkles },
    { id: "courses", label: "Courses", icon: MapPin },
  ];

  if (isAdmin) {
    tabs.push({ id: "admin", label: "Admin", icon: ShieldAlert });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 text-slate-400 py-1.5 px-2 shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all ${
                isActive
                  ? "text-emerald-400 font-bold scale-105"
                  : "hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : ""}`} />
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
