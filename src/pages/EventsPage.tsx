import React, { useState } from "react";
import { Course, Event } from "../types";
import { useAuth } from "../context/AuthContext";
import { CreateEventModal } from "../components/CreateEventModal";
import { Calendar as CalendarIcon, Filter, Plus, AlertTriangle, MapPin, Clock, ShieldCheck, Layers, FlaskConical } from "lucide-react";

interface EventsPageProps {
  events: Event[];
  courses: Course[];
  onRefresh?: () => void;
  onCreateEvent?: (event: Event) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ events, courses, onRefresh, onCreateEvent }) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "club_admin";
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [onlyClosuresAlerts, setOnlyClosuresAlerts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = ["All", "League", "Tournament", "Beginner", "Meeting", "Workday", "Closure"];
  const filteredEvents = events.filter((event) => {
    if (onlyClosuresAlerts && event.category !== "Closure") return false;
    if (selectedCategory !== "All" && event.category !== selectedCategory) return false;
    return true;
  });
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  const canOpenCreator = Boolean(onCreateEvent) || isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider mb-1"><CalendarIcon className="w-4 h-4" /><span>Club Calendar Concept</span></div>
          <h1 className="text-2xl font-extrabold tracking-tight">Spotsylvania Event Directory</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">League nights, tournaments, beginner events, workdays and course alerts.</p>
        </div>
        {canOpenCreator && <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition shrink-0"><Plus className="w-4 h-4" /><span>Create Club Event</span></button>}
      </div>

      <div className="bg-white border border-slate-200 card-shadow p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 font-semibold mr-1 flex items-center gap-1"><Filter className="w-3.5 h-3.5 text-green-600" /> Category:</span>
          {categories.map((cat) => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${selectedCategory === cat ? "bg-green-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{cat}</button>)}
        </div>
        <button onClick={() => setOnlyClosuresAlerts(!onlyClosuresAlerts)} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${onlyClosuresAlerts ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"}`}><AlertTriangle className={`w-3.5 h-3.5 ${onlyClosuresAlerts ? "text-rose-600" : "text-amber-500"}`} /><span>Course Closures & Alerts</span></button>
      </div>

      <div className="space-y-3">
        {sortedEvents.length === 0 ? (
          <div className="bg-white border border-slate-200 p-10 rounded-xl text-center space-y-2 card-shadow"><CalendarIcon className="w-10 h-10 text-slate-400 mx-auto" /><h3 className="text-sm font-bold text-slate-800">No Events Found</h3><p className="text-xs text-slate-500 max-w-md mx-auto">No events matched your filters.</p></div>
        ) : sortedEvents.map((event) => {
          const course = courses.find((item) => item.id === event.courseId);
          const eventDate = new Date(event.startDateTime);
          const isClosure = event.category === "Closure";
          let badgeStyle = "bg-green-50 text-green-700";
          let catBadge = "bg-green-100 text-green-800";
          if (event.category === "Tournament") { badgeStyle = "bg-amber-50 text-amber-700"; catBadge = "bg-amber-100 text-amber-900"; }
          else if (event.category === "Workday") { badgeStyle = "bg-orange-50 text-orange-700"; catBadge = "bg-orange-100 text-orange-800"; }
          else if (event.category === "Closure") { badgeStyle = "bg-rose-50 text-rose-700"; catBadge = "bg-rose-100 text-rose-800"; }
          else if (event.category === "League") { badgeStyle = "bg-blue-50 text-blue-700"; catBadge = "bg-blue-100 text-blue-800"; }

          return (
            <div key={event.id} className={`bg-white p-4 rounded-xl border border-slate-200 card-shadow flex flex-col sm:flex-row items-start gap-4 transition hover:border-slate-300 ${isClosure ? "border-l-4 border-l-rose-500" : ""}`}>
              <div className={`w-14 h-14 ${badgeStyle} rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-200/50`}><span className="text-[10px] font-bold uppercase leading-none">{eventDate.toLocaleDateString([], { month: "short" })}</span><span className="text-xl font-extrabold leading-none mt-0.5">{eventDate.getDate()}</span></div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 ${catBadge} rounded text-[10px] font-bold uppercase`}>{event.category}</span>
                    {event.isOfficial && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Official</span>}
                    {event.isDemo && <span className="text-[10px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded flex items-center gap-1"><FlaskConical className="w-3 h-3" /> Demo</span>}
                  </div>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{eventDate.toLocaleDateString([], { weekday: "short" })} @ {eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{event.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-slate-500 font-medium">
                  {course && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-green-600" />{course.name}</span>}
                  {event.layout && <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-green-600" />{event.layout}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CreateEventModal courses={courses} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={onRefresh} onCreateEvent={onCreateEvent} />
    </div>
  );
};
