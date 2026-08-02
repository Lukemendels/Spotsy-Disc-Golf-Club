import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { PWAInstaller } from "./components/PWAInstaller";
import { HomePage } from "./pages/HomePage";
import { EventsPage } from "./pages/EventsPage";
import { RoundsPage } from "./pages/RoundsPage";
import { NewToDiscGolfPage } from "./pages/NewToDiscGolfPage";
import { JoinClubPage } from "./pages/JoinClubPage";
import { CoursesPage } from "./pages/CoursesPage";
import { LeadershipPage } from "./pages/LeadershipPage";
import { AdminPage } from "./pages/AdminPage";

import {
  INITIAL_COURSES,
  INITIAL_OFFICERS,
  INITIAL_EVENTS,
  INITIAL_ROUNDS,
  seedFirestoreIfEmpty,
} from "./data/seedData";
import { db } from "./lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Course, Event, Officer, Round } from "./types";
import { Check, Calendar, Users, GraduationCap, Sparkles, MapPin, UserCheck, ShieldAlert, Home } from "lucide-react";

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [officers, setOfficers] = useState<Officer[]>(INITIAL_OFFICERS);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [rounds, setRounds] = useState<Round[]>(INITIAL_ROUNDS);

  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "club_admin";

  useEffect(() => {
    // Attempt auto-seeding on initial app launch if empty
    seedFirestoreIfEmpty();

    // Listen to Courses live
    const unsubCourses = onSnapshot(
      collection(db, "courses"),
      (snap) => {
        if (!snap.empty) {
          const list: Course[] = [];
          snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Course));
          setCourses(list);
        }
      },
      (err) => console.warn("Courses listener warning:", err)
    );

    // Listen to Officers live
    const unsubOfficers = onSnapshot(
      collection(db, "officers"),
      (snap) => {
        if (!snap.empty) {
          const list: Officer[] = [];
          snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Officer));
          setOfficers(list);
        }
      },
      (err) => console.warn("Officers listener warning:", err)
    );

    // Listen to Events live
    const unsubEvents = onSnapshot(
      collection(db, "events"),
      (snap) => {
        if (!snap.empty) {
          const list: Event[] = [];
          snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Event));
          setEvents(list);
        }
      },
      (err) => console.warn("Events listener warning:", err)
    );

    // Listen to Rounds live
    const unsubRounds = onSnapshot(
      collection(db, "rounds"),
      (snap) => {
        if (!snap.empty) {
          const list: Round[] = [];
          snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Round));
          setRounds(list);
        }
      },
      (err) => console.warn("Rounds listener warning:", err)
    );

    return () => {
      unsubCourses();
      unsubOfficers();
      unsubEvents();
      unsubRounds();
    };
  }, []);

  const handleJoinRoundFromHome = (roundId: string) => {
    setActiveTab("rounds");
  };

  const navItems = [
    { id: "home", label: "Dashboard", icon: Home },
    { id: "events", label: "Events", icon: Calendar },
    { id: "rounds", label: "Casual Rounds", icon: Users },
    { id: "beginner", label: "New Players", icon: GraduationCap },
    { id: "join", label: "Join Club", icon: Sparkles },
    { id: "courses", label: "Courses", icon: MapPin },
    { id: "leadership", label: "Leadership", icon: UserCheck },
  ];

  if (isAdmin) {
    navItems.push({ id: "admin", label: "Admin Panel", icon: ShieldAlert });
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Column */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top PWA Banner */}
        <PWAInstaller />

        {/* Top Header */}
        <Header
          events={events}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 text-slate-200 border-b border-slate-800 px-4 py-3 space-y-1 shrink-0 z-30">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-green-600 text-white font-bold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20 lg:pb-8">
          {activeTab === "home" && (
            <HomePage
              events={events}
              rounds={rounds}
              courses={courses}
              onNavigate={setActiveTab}
              onJoinRound={handleJoinRoundFromHome}
            />
          )}

          {activeTab === "events" && (
            <EventsPage
              events={events}
              courses={courses}
            />
          )}

          {activeTab === "rounds" && (
            <RoundsPage
              rounds={rounds}
              courses={courses}
            />
          )}

          {activeTab === "beginner" && (
            <NewToDiscGolfPage
              courses={courses}
            />
          )}

          {activeTab === "join" && (
            <JoinClubPage />
          )}

          {activeTab === "courses" && (
            <CoursesPage
              courses={courses}
              events={events}
              onNavigateToEvents={() => setActiveTab("events")}
            />
          )}

          {activeTab === "leadership" && (
            <LeadershipPage
              officers={officers}
            />
          )}

          {activeTab === "admin" && (
            <AdminPage
              events={events}
              rounds={rounds}
              courses={courses}
              officers={officers}
            />
          )}
        </div>

        {/* High Density Status Footer */}
        <footer className="h-10 bg-white border-t border-slate-200 flex items-center px-4 sm:px-6 lg:px-8 shrink-0 justify-between text-[11px] text-slate-500 z-10">
          <div className="flex gap-4 sm:gap-6 items-center truncate">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
              Course Status
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="font-medium text-slate-700">Hazel Run: Open</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              <span className="font-medium text-slate-700">Wilderness: Wet/Slow</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono hidden md:block">
            v1.0.4 Build Stable • © {new Date().getFullYear()} Spotsy Disc Golf
          </div>
        </footer>
      </main>

      {/* Fixed Mobile Bottom Bar */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

