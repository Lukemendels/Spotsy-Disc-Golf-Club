import React from "react";
import { Event, Round, Course } from "../types";
import {
  Sparkles,
  Calendar,
  Users,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Disc,
  Clock,
  Plus
} from "lucide-react";

interface HomePageProps {
  events: Event[];
  rounds: Round[];
  courses: Course[];
  onNavigate: (tab: string) => void;
  onJoinRound: (roundId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  events,
  rounds,
  courses,
  onNavigate,
  onJoinRound,
}) => {
  // Get upcoming events
  const nextEvents = [...events]
    .filter((e) => new Date(e.startDateTime).getTime() > Date.now() - 86400000)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
    .slice(0, 3);

  // Get open casual rounds
  const openRounds = [...rounds]
    .filter((r) => r.status === "open")
    .sort((a, b) => new Date(a.teeTime).getTime() - new Date(b.teeTime).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* High Density Hero Banner */}
      <section className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spotsylvania Disc Golf Community</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Grow the Sport in Spotsylvania
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            Join the region's most active disc golf community. Members get exclusive access to Hazel Run & Wilderness Ridge private layouts, bag tag leagues, and casual round match-ups.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigate("join")}
              className="px-6 py-2.5 bg-green-500 hover:bg-green-400 text-white rounded-full font-bold text-xs sm:text-sm transition-all shadow-lg shadow-green-500/20"
            >
              Join the Club ($25/Yr)
            </button>
            <button
              onClick={() => onNavigate("beginner")}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs sm:text-sm backdrop-blur-sm transition"
            >
              New Player Guide
            </button>
          </div>
        </div>

        {/* Ambient green accent glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-green-500/15 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Two-Column Grid: Upcoming Events & Casual Rounds Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events Column */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <span>Upcoming Events</span>
            </h3>
            <button
              onClick={() => onNavigate("events")}
              className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {nextEvents.map((evt) => {
              const dt = new Date(evt.startDateTime);
              const monthStr = dt.toLocaleDateString([], { month: "short" });
              const dayStr = dt.getDate();

              let badgeStyle = "bg-blue-50 text-blue-600";
              let catBadge = "bg-blue-100 text-blue-700";

              if (evt.category === "Tournament") {
                badgeStyle = "bg-amber-50 text-amber-600";
                catBadge = "bg-amber-100 text-amber-800";
              } else if (evt.category === "Workday") {
                badgeStyle = "bg-orange-50 text-orange-600";
                catBadge = "bg-orange-100 text-orange-700";
              } else if (evt.category === "Beginner") {
                badgeStyle = "bg-green-50 text-green-600";
                catBadge = "bg-green-100 text-green-700";
              } else if (evt.category === "Closure") {
                badgeStyle = "bg-rose-50 text-rose-600";
                catBadge = "bg-rose-100 text-rose-700";
              }

              return (
                <div
                  key={evt.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 card-shadow flex gap-4 items-start hover:border-slate-300 transition"
                >
                  <div className={`w-12 h-12 ${badgeStyle} rounded-lg flex flex-col items-center justify-center shrink-0`}>
                    <span className="text-[10px] font-bold uppercase leading-none">{monthStr}</span>
                    <span className="text-lg font-extrabold leading-none mt-0.5">{dayStr}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{evt.title}</h4>
                      <span className={`px-2 py-0.5 ${catBadge} rounded text-[10px] font-bold uppercase shrink-0`}>
                        {evt.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{evt.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Casual Rounds Board Column */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span>Casual Rounds Board</span>
            </h3>
            <button
              onClick={() => onNavigate("rounds")}
              className="text-xs bg-slate-900 text-white px-3 py-1 rounded-md font-semibold hover:bg-slate-800 flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Round</span>
            </button>
          </div>

          <div className="space-y-3">
            {openRounds.map((rnd, idx) => {
              const course = courses.find((c) => c.id === rnd.courseId);
              const spotsLeft = rnd.maxCapacity - (rnd.participantIds?.length || 0);
              const isBeginner = rnd.isBeginnerFriendly;

              return (
                <div
                  key={rnd.id}
                  className={`bg-white p-4 rounded-xl border border-slate-200 card-shadow transition hover:border-slate-300 ${
                    isBeginner || idx === 0 ? "border-l-4 border-l-green-500" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {course?.name || "Spotsylvania Course"}
                      </h4>
                      <p className="text-xs text-slate-500">Layout: {rnd.layout}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isBeginner
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {spotsLeft > 0 ? `${spotsLeft} Spots Left` : "Card Full"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      🕒 {new Date(rnd.teeTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>⚡ {rnd.pace}</span>
                    {isBeginner && <span className="text-green-600 font-bold">• Beginner Friendly</span>}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-[9px] text-white font-bold flex items-center justify-center">
                        {rnd.organizerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-600 font-medium">Org: {rnd.organizerName}</span>
                    </div>

                    <button
                      onClick={() => onJoinRound(rnd.id)}
                      className="text-xs font-bold text-green-600 border border-green-200 px-4 py-1 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      Join Round
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Course Status Bar Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 card-shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <span>Spotsylvania Course Directory</span>
          </h3>
          <button
            onClick={() => onNavigate("courses")}
            className="text-xs text-green-600 font-semibold hover:underline"
          >
            Explore All Courses →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {courses.map((c) => (
            <div
              key={c.id}
              onClick={() => onNavigate("courses")}
              className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 hover:border-green-400 cursor-pointer transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs truncate">{c.name}</span>
                <span className="text-[10px] font-semibold text-slate-500">{c.holes} Holes</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{c.accessType}</p>
              <div className="mt-2 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded inline-block">
                {c.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

