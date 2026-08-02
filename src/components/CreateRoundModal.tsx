import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Course } from "../types";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { X, Calendar, Clock, MapPin, Users, Activity, Sparkles } from "lucide-react";

interface CreateRoundModalProps {
  courses: Course[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateRoundModal: React.FC<CreateRoundModalProps> = ({
  courses,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { userProfile, signInDemoUser } = useAuth();

  const [courseId, setCourseId] = useState(courses[0]?.id || "loriella-park");
  const [layout, setLayout] = useState(courses[0]?.layouts[0] || "18-Hole Main (Short Tees)");
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState("09:30");
  const [maxCapacity, setMaxCapacity] = useState<number>(4);
  const [pace, setPace] = useState<"Relaxed" | "Standard" | "Fast">("Standard");
  const [isBeginnerFriendly, setIsBeginnerFriendly] = useState<boolean>(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleCourseChange = (selectedCourseId: string) => {
    setCourseId(selectedCourseId);
    const selected = courses.find((c) => c.id === selectedCourseId);
    if (selected && selected.layouts.length > 0) {
      setLayout(selected.layouts[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    let currentProfile = userProfile;
    if (!currentProfile) {
      // Auto sign-in demo user if not logged in
      await signInDemoUser("user");
      currentProfile = {
        uid: "demo-user-uid-202",
        displayName: "Alex River (Club Member)",
        preferredCourse: "loriella-park",
        experienceLevel: "Intermediate",
        role: "user",
        createdAt: new Date().toISOString(),
      };
    }

    setSubmitting(true);
    try {
      const teeTimeIso = new Date(`${date}T${time}:00`).toISOString();

      const newRound = {
        courseId,
        layout,
        teeTime: teeTimeIso,
        organizerId: currentProfile.uid,
        organizerName: currentProfile.displayName,
        maxCapacity,
        participantIds: [currentProfile.uid],
        participantNames: {
          [currentProfile.uid]: currentProfile.displayName,
        },
        pace,
        isBeginnerFriendly,
        notes: notes.trim() || "Casual round open to players looking to throw!",
        status: "open",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "rounds"), newRound);
      setSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating casual round:", err);
      setErrorMsg("Failed to create round. Please try again.");
      setSubmitting(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Organize a Casual Round</h3>
              <p className="text-xs text-emerald-300">
                Post your tee time on the Spotsy board for local players
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Course Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Course Location
            </label>
            <select
              value={courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.accessFees.includes("Required") ? "Club Access" : "Public"})
                </option>
              ))}
            </select>
          </div>

          {/* Layout Selection */}
          {selectedCourse && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Course Layout
              </label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {selectedCourse.layouts.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Tee Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Capacity & Pace */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Max Players
              </label>
              <select
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={2}>2 Players (Duo)</option>
                <option value={3}>3 Players (Trio)</option>
                <option value={4}>4 Players (Standard Card)</option>
                <option value={5}>5 Players (Large Card)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Playing Pace
              </label>
              <select
                value={pace}
                onChange={(e) => setPace(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Relaxed">Relaxed (Easy pace)</option>
                <option value="Standard">Standard (Typical flow)</option>
                <option value="Fast">Fast (Quick tag run)</option>
              </select>
            </div>
          </div>

          {/* Beginner Friendly Flag */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-white">Beginner Friendly Round</p>
                <p className="text-[11px] text-slate-400">
                  Welcome novices and offer course guidance
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isBeginnerFriendly}
              onChange={(e) => setIsBeginnerFriendly(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Round Notes / Meeting Spot
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Meeting at Hole 1 practice basket 10 mins before tee time. Playing short to long."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition disabled:opacity-50"
            >
              {submitting ? "Posting Round..." : "Post Casual Round"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
