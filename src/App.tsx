import React, { useState, useEffect } from "react";
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
import { ClubOpsPage } from "./pages/ClubOpsPage";
import { LeagueCheckInPage } from "./pages/LeagueCheckInPage";
import { LeadershipPage } from "./pages/LeadershipPage";
import { AdminPage } from "./pages/AdminPage";
import { CommunityFeedPage } from "./pages/CommunityFeedPage";
import { INITIAL_COURSES, INITIAL_OFFICERS, INITIAL_EVENTS, INITIAL_ROUNDS } from "./data/seedData";
import { collection, onSnapshot, initializeDemoCollection, addDoc } from "./lib/demoDatabase";
import { MemberLeagueDemo } from "./components/MemberLeagueDemo";
import { db } from "./lib/firebase";
import { Event, Round } from "./types";
import { Check, Calendar, Users, GraduationCap, Sparkles, MapPin, UserCheck, ShieldAlert, Home, Wrench, MessagesSquare } from "lucide-react";

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const courses = INITIAL_COURSES;
  const officers = INITIAL_OFFICERS;
  const [rounds, setRounds] = useState<Round[]>(INITIAL_ROUNDS);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);

  useEffect(() => {
    initializeDemoCollection("rounds", INITIAL_ROUNDS);
    initializeDemoCollection("events", INITIAL_EVENTS);
    const offRounds = onSnapshot(collection(db, "rounds"), snap => setRounds(snap.docs.map(d => ({ id: d.id, ...d.data() } as Round))));
    const offEvents = onSnapshot(collection(db, "events"), snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Event))));
    return () => { offRounds(); offEvents(); };
  }, []);
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "club_admin";

  const handleJoinRoundFromHome = () => setActiveTab("rounds");
  const handleCreateDemoEvent = async (event: Event) => { const { id, ...record } = event; await addDoc(collection(db, "events"), record); };

  const navItems = [
    { id: "member", label: "Profile & League Check-In", icon: UserCheck },
    { id: "home", label: "Dashboard", icon: Home },
    { id: "events", label: "Events", icon: Calendar },
    { id: "rounds", label: "Casual Rounds", icon: Users },
    { id: "community", label: "Community Feed", icon: MessagesSquare },
    { id: "clubOps", label: "Club Ops", icon: Wrench },
    { id: "beginner", label: "New Players", icon: GraduationCap },
    { id: "join", label: "Join Club", icon: Sparkles },
    { id: "courses", label: "Courses", icon: MapPin },
    { id: "leadership", label: "Leadership", icon: UserCheck },
  ];

  if (isAdmin) navItems.push({ id: "admin", label: "Admin Panel", icon: ShieldAlert });

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <PWAInstaller />
        <div className="bg-amber-100 px-4 py-2 text-xs text-amber-950">Local adoption demo • synthetic league/member records • no real sign-in, email, payment or Firebase writes. Source feed retains its provenance. Please use fictional inputs.</div>
        <Header events={events} activeTab={activeTab} setActiveTab={setActiveTab} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 text-slate-200 border-b border-slate-800 px-4 py-3 space-y-1 shrink-0 z-30">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${isActive ? "bg-green-600 text-white font-bold" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                  <div className="flex items-center gap-2.5"><Icon className="w-4 h-4" /><span>{item.label}</span></div>
                  {isActive && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20 lg:pb-8">
          {activeTab === "member" && <MemberLeagueDemo />}
          {activeTab === "home" && <HomePage events={events} rounds={rounds} courses={courses} onNavigate={setActiveTab} onJoinRound={handleJoinRoundFromHome} />}
          {activeTab === "events" && <EventsPage events={events} courses={courses} onCreateEvent={handleCreateDemoEvent} />}
          {activeTab === "rounds" && <RoundsPage rounds={rounds} courses={courses} />}
          {activeTab === "community" && <CommunityFeedPage />}
          {activeTab === "clubOps" && <ClubOpsPage courses={courses} events={events} onCreateEvent={handleCreateDemoEvent} />}
          {activeTab === "beginner" && <NewToDiscGolfPage courses={courses} />}
          {activeTab === "join" && <JoinClubPage />}
          {activeTab === "courses" && <CoursesPage courses={courses} events={events} onNavigateToEvents={() => setActiveTab("events")} />}
          {activeTab === "leadership" && <LeadershipPage officers={officers} />}
          {activeTab === "admin" && <AdminPage events={events} rounds={rounds} courses={courses} officers={officers} />}
        </div>

        <footer className="h-10 bg-white border-t border-slate-200 flex items-center px-4 sm:px-6 lg:px-8 shrink-0 justify-between text-[11px] text-slate-500 z-10">
          <span className="font-medium text-slate-600">Local demo • club facts need approval • source feed retained</span>
          <span className="text-[10px] text-slate-400 font-mono hidden md:block">Spotsy Disc Golf Digital Platform</span>
        </footer>
      </main>
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  const isLeagueCheckIn = new URLSearchParams(window.location.search).has("leagueCheckIn");
  return <AuthProvider>{isLeagueCheckIn ? <LeagueCheckInPage /> : <AppContent />}</AuthProvider>;
}
