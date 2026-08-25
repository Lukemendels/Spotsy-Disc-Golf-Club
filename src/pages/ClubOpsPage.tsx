import React, { useState } from "react";
import { CalendarPlus, FileUp, Shuffle, Wrench } from "lucide-react";
import { Course, Event } from "../types";
import { CreateEventModal } from "../components/CreateEventModal";
import { LeagueOperationsDemo } from "../components/LeagueOperationsDemo";

interface ClubOpsPageProps {
  courses: Course[];
  events: Event[];
  onCreateEvent: (event: Event) => void;
}

export const ClubOpsPage: React.FC<ClubOpsPageProps> = ({ courses, events, onCreateEvent }) => {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const demoEvents = events.filter((event) => event.isDemo);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>Club Operations Concept</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">League Night & Club Ops</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Demo tools for the repetitive work around league night: create the event, build cards and starting holes, then import the completed UDisc round to sort bag tags.
          </p>
        </div>
        <button onClick={() => setIsEventModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition shrink-0 flex items-center gap-2">
          <CalendarPlus className="w-4 h-4" /> Create Club Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 card-shadow">
          <div className="flex items-center gap-2 text-green-700"><CalendarPlus className="w-4 h-4" /><span className="text-xs font-bold uppercase">1 · Event</span></div>
          <p className="mt-2 text-sm font-extrabold text-slate-900">Create Thursday Night League</p>
          <p className="mt-1 text-xs text-slate-600">Pick the course, actual layout, date/time and current league details. The demo keeps it in this browser session.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 card-shadow">
          <div className="flex items-center gap-2 text-green-700"><Shuffle className="w-4 h-4" /><span className="text-xs font-bold uppercase">2 · Cards</span></div>
          <p className="mt-2 text-sm font-extrabold text-slate-900">Build cards + starting holes</p>
          <p className="mt-1 text-xs text-slate-600">Close check-in, generate the field, make organizer overrides, then publish the assignments.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 card-shadow ring-2 ring-teal-100">
          <div className="flex items-center gap-2 text-teal-700"><FileUp className="w-4 h-4" /><span className="text-xs font-bold uppercase">3 · Bag Tags</span></div>
          <p className="mt-2 text-sm font-extrabold text-slate-900">UDisc CSV → tag sorting</p>
          <p className="mt-1 text-xs text-slate-600">Scores stay in UDisc. Import the CSV, enter the physical tags that were turned in, and calculate outgoing tags.</p>
        </div>
      </div>

      {demoEvents.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Demo events created this session</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {demoEvents.map((event) => (
              <span key={event.id} className="rounded-lg bg-white border border-blue-200 px-3 py-2 text-xs font-semibold text-slate-800">
                {event.title} · {new Date(event.startDateTime).toLocaleDateString()} {event.layout ? `· ${event.layout}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <LeagueOperationsDemo />

      <CreateEventModal
        courses={courses}
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onCreateEvent={onCreateEvent}
      />
    </div>
  );
};
