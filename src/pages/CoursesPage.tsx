import React from "react";
import { Course, Event } from "../types";
import {
  MapPin,
  ExternalLink,
  Sparkles,
  CheckCircle,
  Calendar,
  Layers,
  Compass,
} from "lucide-react";

interface CoursesPageProps {
  courses: Course[];
  events: Event[];
  onNavigateToEvents?: () => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
  courses,
  events,
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          <span>Spotsylvania & Fredericksburg Directory</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Local Disc Golf Courses
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Explore local public county park layouts and exclusive club-maintained facilities.
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          // Find upcoming events at this course
          const courseEvents = events.filter(
            (e) => e.courseId === course.id && new Date(e.startDateTime).getTime() > Date.now() - 86400000
          );

          const isClubOnly = course.accessFees.includes("Badge") || course.accessFees.includes("Tag");

          return (
            <div
              key={course.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden card-shadow flex flex-col justify-between hover:border-slate-300 transition group"
            >
              {/* Image & Header */}
              <div>
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={course.image || "https://images.unsplash.com/photo-1593111774601-dfbce7de160c?auto=format&fit=crop&w=800&q=80"}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase shadow-xs ${
                        isClubOnly
                          ? "bg-amber-500 text-slate-950"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      {isClubOnly ? "Club Access Only" : "Public Park"}
                    </span>

                    {course.beginnerFriendly && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/95 text-green-800 shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-green-600" /> Beginner Friendly
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-green-600 transition">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <span>{course.location}</span>
                    </p>
                  </div>

                  {/* Difficulty & Access */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block font-semibold">
                        Difficulty
                      </span>
                      <span className="font-bold text-slate-800">{course.difficulty}</span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] block font-semibold">
                        Access / Fees
                      </span>
                      <span className="font-bold text-green-700 truncate block">
                        {course.accessFees}
                      </span>
                    </div>
                  </div>

                  {/* Layouts List */}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-1">
                      <Layers className="w-3.5 h-3.5 text-green-600" /> Available Layouts:
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {course.layouts.map((layout) => (
                        <li key={layout} className="flex items-center gap-1.5 font-medium">
                          <CheckCircle className="w-3 h-3 text-green-600 shrink-0" />
                          <span>{layout}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Upcoming Events at this Location */}
                  {courseEvents.length > 0 && (
                    <div className="bg-green-50 border border-green-200 p-2.5 rounded-lg text-xs space-y-0.5">
                      <p className="text-[10px] font-bold text-green-800 uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Upcoming Event:
                      </p>
                      <p className="text-slate-800 font-semibold truncate">
                        {courseEvents[0].title}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Directions Link */}
              <div className="p-4 pt-0">
                <a
                  href={course.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition border border-slate-200"
                >
                  <MapPin className="w-3.5 h-3.5 text-green-600" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

