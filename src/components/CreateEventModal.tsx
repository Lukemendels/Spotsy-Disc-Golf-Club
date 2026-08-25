import React, { useEffect, useMemo, useState } from "react";
import { CategoryType, Course, Event } from "../types";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { X, Calendar, MapPin, Tag, AlignLeft, ShieldCheck, Layers, Wand2 } from "lucide-react";

interface CreateEventModalProps {
  courses: Course[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreateEvent?: (event: Event) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  courses,
  isOpen,
  onClose,
  onSuccess,
  onCreateEvent,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryType>("League");
  const [courseId, setCourseId] = useState(courses[0]?.id || "loriella-park");
  const selectedCourse = useMemo(() => courses.find((course) => course.id === courseId) || courses[0], [courses, courseId]);
  const [layout, setLayout] = useState(selectedCourse?.layouts[0] || "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("18:00");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (selectedCourse && !selectedCourse.layouts.includes(layout)) {
      setLayout(selectedCourse.layouts[0] || "");
    }
  }, [selectedCourse, layout]);

  if (!isOpen) return null;

  const applyThursdayLeaguePreset = () => {
    const loriella = courses.find((course) => course.id === "loriella-park");
    setTitle("Thursday Night League");
    setCategory("League");
    if (loriella) {
      setCourseId(loriella.id);
      setLayout(loriella.layouts[0] || "");
    }
    setDescription("Weekly Spotsy league night. Organizer can add check-in, fees, divisions, and other current details here.");
  };

  const resetForm = () => {
    setTitle("");
    setCategory("League");
    setCourseId(courses[0]?.id || "loriella-park");
    setLayout(courses[0]?.layouts[0] || "");
    setTime("18:00");
    setDescription("");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const startDateTimeIso = new Date(`${date}T${time}:00`).toISOString();
      const event: Event = {
        id: `demo-event-${Date.now()}`,
        title: title.trim(),
        category,
        courseId,
        layout: layout || undefined,
        startDateTime: startDateTimeIso,
        description: description.trim(),
        isOfficial: !onCreateEvent,
        isDemo: Boolean(onCreateEvent),
      };

      if (onCreateEvent) {
        onCreateEvent(event);
      } else {
        await addDoc(collection(db, "events"), {
          title: event.title,
          category: event.category,
          courseId: event.courseId,
          layout: event.layout || null,
          startDateTime: event.startDateTime,
          description: event.description,
          isOfficial: true,
          createdAt: new Date().toISOString(),
        });
      }

      setSubmitting(false);
      if (onSuccess) onSuccess();
      resetForm();
      onClose();
    } catch (err) {
      console.error("Error creating event:", err);
      setErrorMsg(onCreateEvent ? "Could not create the demo event." : "Failed to create event. Make sure you have admin rights.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        <div className="bg-gradient-to-r from-amber-900/60 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Club Event</h3>
              <p className="text-xs text-amber-300">{onCreateEvent ? "Concept demo — adds the event to this session" : "Admin publish to club event calendar"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && <div className="p-3 bg-rose-950 border border-rose-800 text-rose-200 text-xs rounded-xl">{errorMsg}</div>}

          <button type="button" onClick={applyThursdayLeaguePreset} className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-700 bg-amber-950/40 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-950/70">
            <Wand2 className="w-3.5 h-3.5" /> Start from Thursday Night League preset
          </button>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Thursday Night League" required className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-amber-400" /> Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as CategoryType)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="League">League</option><option value="Tournament">Tournament</option><option value="Beginner">Beginner Clinic</option><option value="Meeting">Meeting</option><option value="Workday">Course Workday</option><option value="Closure">Course Closure / Alert</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-400" /> Host Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-400" /> Layout</label>
            <select value={layout} onChange={(e) => setLayout(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              {(selectedCourse?.layouts || []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-400" /> Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5 text-amber-400" /> Event Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Check-in, fees, divisions, format, or other current details..." rows={3} required className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-900/40 transition disabled:opacity-50">{submitting ? "Saving..." : onCreateEvent ? "Add Demo Event" : "Publish Event"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
