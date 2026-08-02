import React, { useState } from "react";
import { CategoryType, Course, Event } from "../types";
import { useAuth } from "../context/AuthContext";
import { CreateEventModal } from "../components/CreateEventModal";
import {
  Calendar as CalendarIcon,
  Filter,
  Plus,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface EventsPageProps {
  events: Event[];
  courses: Course[];
  onRefresh?: () => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  courses,
  onRefresh,
}) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "club_admin";

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [onlyClosuresAlerts, setOnlyClosuresAlerts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = ["All", "League", "Tournament", "Beginner", "Meeting", "Workday", "Closure"];

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (onlyClosuresAlerts && e.category !== "Closure") return false;
    if (selectedCategory !== "All" && e.category !== selectedCategory) return false;
    return true;
  });

  // Sort events chronologically
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Official Club Calendar</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Spotsylvania Event Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Official league matches, sanctioned tournaments, course workdays, and closures.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Official Event</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 card-shadow p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-green-600" /> Category:
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  isActive
                    ? "bg-green-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Closures & Weather Alert Filter Toggle */}
        <button
          onClick={() => setOnlyClosuresAlerts(!onlyClosuresAlerts)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
            onlyClosuresAlerts
              ? "bg-rose-100 text-rose-800 border-rose-300"
              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
          }`}
        >
          <AlertTriangle
            className={`w-3.5 h-3.5 ${onlyClosuresAlerts ? "text-rose-600" : "text-amber-500"}`}
          />
          <span>Course Closures & Alerts</span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {sortedEvents.length === 0 ? (
          <div className="bg-white border border-slate-200 p-10 rounded-xl text-center space-y-2 card-shadow">
            <CalendarIcon className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Events Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No events matched your category or filter. Try selecting "All" or check back later!
            </p>
          </div>
        ) : (
          sortedEvents.map((evt) => {
            const course = courses.find((c) => c.id === evt.courseId);
            const isClosure = evt.category === "Closure";
            const eventDate = new Date(evt.startDateTime);
            const monthStr = eventDate.toLocaleDateString([], { month: "short" });
            const dayStr = eventDate.getDate();

            let badgeStyle = "bg-green-50 text-green-700";
            let catBadge = "bg-green-100 text-green-800";

            if (evt.category === "Tournament") {
              badgeStyle = "bg-amber-50 text-amber-700";
              catBadge = "bg-amber-100 text-amber-900";
            } else if (evt.category === "Workday") {
              badgeStyle = "bg-orange-50 text-orange-700";
              catBadge = "bg-orange-100 text-orange-800";
            } else if (evt.category === "Closure") {
              badgeStyle = "bg-rose-50 text-rose-700";
              catBadge = "bg-rose-100 text-rose-800";
            } else if (evt.category === "League") {
              badgeStyle = "bg-blue-50 text-blue-700";
              catBadge = "bg-blue-100 text-blue-800";
            }

            return (
              <div
                key={evt.id}
                className={`bg-white p-4 rounded-xl border border-slate-200 card-shadow flex flex-col sm:flex-row items-start gap-4 transition hover:border-slate-300 ${
                  isClosure ? "border-l-4 border-l-rose-500" : ""
                }`}
              >
                {/* Square Date Box */}
                <div className={`w-14 h-14 ${badgeStyle} rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-200/50`}>
                  <span className="text-[10px] font-bold uppercase leading-none">{monthStr}</span>
                  <span className="text-xl font-extrabold leading-none mt-0.5">{dayStr}</span>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 ${catBadge} rounded text-[10px] font-bold uppercase`}>
                        {evt.category}
                      </span>
                      {evt.isOfficial && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Official
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {eventDate.toLocaleDateString([], { weekday: "short" })} @{" "}
                      {eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{evt.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>

                  {course && (
                    <div className="text-xs text-slate-500 pt-1 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-green-600" />
                      <span>{course.name}</span> — <span>{course.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <CreateEventModal
        courses={courses}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};

