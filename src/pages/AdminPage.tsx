import React, { useState, useEffect } from "react";
import { Course, Event, Officer, Round } from "../types";
import { useAuth } from "../context/AuthContext";
import { CreateEventModal } from "../components/CreateEventModal";
import { LeagueOperationsDemo } from "../components/LeagueOperationsDemo";
import { seedFirestoreIfEmpty } from "../data/seedData";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import {
  ShieldAlert,
  Plus,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface AdminPageProps {
  events: Event[];
  rounds: Round[];
  courses: Course[];
  officers: Officer[];
  onRefresh?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  events,
  rounds,
  courses,
  onRefresh,
}) => {
  const { userProfile, toggleDemoAdminRole } = useAuth();
  const isAdmin = userProfile?.role === "club_admin";

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"leagueOps" | "events" | "rounds" | "beginnerSignups" | "subs" | "seed">("leagueOps");
  
  const [beginnerSignups, setBeginnerSignups] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSignups, setLoadingSignups] = useState(false);

  useEffect(() => {
    fetchSignupsAndSubs();
  }, [activeSubTab]);

  const fetchSignupsAndSubs = async () => {
    if (activeSubTab === "beginnerSignups") {
      setLoadingSignups(true);
      try {
        const snap = await getDocs(collection(db, "beginnerSignups"));
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setBeginnerSignups(list);
      } catch (e) {
        console.warn("Fetch beginner signups error:", e);
      } finally {
        setLoadingSignups(false);
      }
    } else if (activeSubTab === "subs") {
      setLoadingSignups(true);
      try {
        const snap = await getDocs(collection(db, "announcementSubscriptions"));
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setSubscriptions(list);
      } catch (e) {
        console.warn("Fetch subs error:", e);
      } finally {
        setLoadingSignups(false);
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteDoc(doc(db, "events", eventId));
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error("Error deleting event:", e);
    }
  };

  const handleDeleteRound = async (roundId: string) => {
    if (!confirm("Are you sure you want to remove this casual round post?")) return;
    try {
      await deleteDoc(doc(db, "rounds", roundId));
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error("Error deleting round:", e);
    }
  };

  const handleTriggerSeed = async () => {
    try {
      await seedFirestoreIfEmpty();
      alert("Initial seed data checked/populated into Firestore!");
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error("Seed error:", e);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-slate-200 card-shadow rounded-xl p-6 max-w-md mx-auto text-center space-y-3 my-8">
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Admin Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Admin Panel is reserved for <code className="text-amber-800 font-mono bg-amber-50 px-1 py-0.5 rounded">club_admin</code> roles. Click below to switch to Admin mode for demoing & testing.
        </p>
        <button
          onClick={toggleDemoAdminRole}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs shadow-xs"
        >
          Enable Admin Test Role
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Spotsy Administration</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Club Admin Management</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Prototype organizer tools for league-night operations, official events, casual rounds, beginner signups, and club communications.
          </p>
        </div>
        <button onClick={() => setIsEventModalOpen(true)} className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs flex items-center gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /><span>New Official Event</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 card-shadow text-xs font-bold">
        {[
          ["leagueOps", "League Night Ops · Demo"],
          ["events", `Manage Events (${events.length})`],
          ["rounds", `Moderation / Rounds (${rounds.length})`],
          ["beginnerSignups", "Beginner Signups"],
          ["subs", "Newsletter Emails"],
          ["seed", "Database Tools"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveSubTab(id as typeof activeSubTab)}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === id ? (id === "leagueOps" ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-white") : "text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeSubTab === "leagueOps" && <LeagueOperationsDemo />}

      {activeSubTab === "events" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Official Events Directory</h3>
            <button onClick={() => setIsEventModalOpen(true)} className="text-xs text-green-700 font-bold hover:underline">+ Create Event</button>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {events.map((evt) => (
              <div key={evt.id} className="bg-white border border-slate-200 p-4 rounded-xl card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded font-bold uppercase">{evt.category}</span>
                    <span className="text-xs text-slate-500">{new Date(evt.startDateTime).toLocaleString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{evt.description}</p>
                </div>
                <button onClick={() => handleDeleteEvent(evt.id)} className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg border border-rose-200 text-xs flex items-center gap-1 shrink-0 font-bold">
                  <Trash2 className="w-3.5 h-3.5" /><span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "rounds" && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900">Casual Round Posts Queue</h3>
          <div className="grid grid-cols-1 gap-2.5">
            {rounds.map((rnd) => (
              <div key={rnd.id} className="bg-white border border-slate-200 p-4 rounded-xl card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">{rnd.status}</span>
                    <span className="text-xs text-slate-500">Org: {rnd.organizerName}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Course ID: {rnd.courseId} ({rnd.layout})</h4>
                  <p className="text-xs text-slate-500">Tee: {new Date(rnd.teeTime).toLocaleString()} | Players: {rnd.participantIds?.length}/{rnd.maxCapacity}</p>
                </div>
                <button onClick={() => handleDeleteRound(rnd.id)} className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg border border-rose-200 text-xs flex items-center gap-1 shrink-0 font-bold">
                  <Trash2 className="w-3.5 h-3.5" /><span>Remove Post</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "beginnerSignups" && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900">Beginner Clinic & Loaner Submissions</h3>
          {loadingSignups ? <p className="text-slate-500 text-xs italic">Loading signups from Firestore...</p> : beginnerSignups.length === 0 ? <p className="text-slate-500 text-xs italic">No beginner signups submitted yet.</p> : (
            <div className="grid grid-cols-1 gap-2.5">
              {beginnerSignups.map((s) => (
                <div key={s.id} className="bg-white border border-slate-200 p-4 rounded-xl card-shadow space-y-1">
                  <div className="flex justify-between items-center text-xs"><span className="font-bold text-slate-900 text-sm">{s.name}</span><span className="text-slate-500">{s.email}</span></div>
                  <p className="text-xs text-green-700 font-semibold">Experience: {s.experience}</p><p className="text-xs text-slate-600">Interest: {s.interest}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === "subs" && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900">Newsletter Email List</h3>
          {loadingSignups ? <p className="text-slate-500 text-xs italic">Loading subscribers from Firestore...</p> : subscriptions.length === 0 ? <p className="text-slate-500 text-xs italic">No newsletter subscriptions yet.</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{subscriptions.map((s) => <div key={s.id} className="bg-white border border-slate-200 p-3 rounded-lg text-xs font-mono text-slate-800 card-shadow">{s.email}</div>)}</div>
          )}
        </div>
      )}

      {activeSubTab === "seed" && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 max-w-xl card-shadow">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-amber-600" /> Database Seeding Utility</h3>
          <p className="text-xs text-slate-600 leading-relaxed">Clicking the button below will verify Firestore collections (`courses`, `officers`, `events`, `rounds`) and populate default Spotsy Disc Golf records if missing.</p>
          <button onClick={handleTriggerSeed} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /><span>Seed Default Firestore Records</span></button>
        </div>
      )}

      <CreateEventModal courses={courses} isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} onSuccess={onRefresh} />
    </div>
  );
};
