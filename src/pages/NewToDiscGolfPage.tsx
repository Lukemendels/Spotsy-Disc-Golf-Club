import React, { useState } from "react";
import { Course } from "../types";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Compass,
  CheckCircle2,
  Send,
  Award,
  Heart
} from "lucide-react";

interface NewToDiscGolfPageProps {
  courses: Course[];
}

export const NewToDiscGolfPage: React.FC<NewToDiscGolfPageProps> = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("Brand New / First Time");
  const [interest, setInterest] = useState("Looking for beginner clinic & disc loaner info");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "beginnerSignups"), {
        name: name.trim(),
        email: email.trim(),
        experience,
        interest,
        createdAt: new Date().toISOString(),
      });
      setSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting beginner signup:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider mb-1">
          <GraduationCap className="w-4 h-4" />
          <span>New Player Guide</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Welcome to Disc Golf in Spotsylvania!
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Disc golf is one of the fastest-growing, most affordable, and accessible outdoor sports in Virginia. Here's everything you need to know to throw with confidence.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Rules & Objective */}
        <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl space-y-2">
          <div className="p-2 bg-green-50 text-green-700 rounded-lg w-fit border border-green-100">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">1. Basic Objective & Rules</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The goal is simple: complete each hole in the fewest total throws. Play begins from the teeing area and subsequent throws are taken from directly behind where your previous throw came to rest (your lie).
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-800">Mandatories (Mando):</strong> Required routes around marked trees for course safety.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-800">Out-of-Bounds (OB):</strong> Water hazards, paved roads, or park fences result in a 1-stroke penalty.
              </span>
            </li>
          </ul>
        </div>

        {/* Etiquette & Courtesy */}
        <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl space-y-2">
          <div className="p-2 bg-green-50 text-green-700 rounded-lg w-fit border border-green-100">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">2. Course Etiquette</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Spotsy park courses are shared with walkers, families, and wildlife. Always yell "FORE!" immediately if a disc strays towards another person.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-800">Pack It In, Pack It Out:</strong> Keep Loriella and Pratt clean—never leave trash or bottle caps on the course.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-800">Throwing Order:</strong> Player furthest from the basket throws first. Honor lowest score on previous hole tees off first.
              </span>
            </li>
          </ul>
        </div>

        {/* Local Beginner Divisions (MA4) */}
        <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl space-y-2">
          <div className="p-2 bg-green-50 text-green-700 rounded-lg w-fit border border-green-100">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">3. Local Divisions: MA4 (Novice)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            In PDGA and Spotsy club tournaments, beginners compete in the <strong className="text-green-700">MA4 (Novice)</strong> or <strong className="text-teal-700">FA4 (Women's Novice)</strong> division.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            No pressure, no judgment! Designed specifically for players with less than 1-2 years of experience who throw under 250 feet.
          </p>
        </div>

        {/* Recommended Layouts */}
        <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl space-y-2">
          <div className="p-2 bg-green-50 text-green-700 rounded-lg w-fit border border-green-100">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">4. Best Local Beginner Layouts</h3>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">Pratt Park Open Layout</p>
              <p className="text-slate-500">Wide open fairways, minimal water hazards, forgiving rough.</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">Loriella Park Short Tees</p>
              <p className="text-slate-500">Shortened concrete tee pads designed specifically for high accuracy and shorter distances.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Beginner Interest Signup Form */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 card-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-100 text-green-800 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Sign Up for Beginner Clinics & Loaner Discs</h2>
            <p className="text-xs text-slate-500">
              Spotsy Disc Golf Club hosts free instructional walks and provides loaner discs to newcomers!
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">Welcome to the Club Community!</h4>
            <p className="text-xs text-slate-600">
              We saved your interest. Our board members will reach out before our next beginner clinic at Pratt Park!
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs text-green-700 underline font-bold pt-2 block mx-auto"
            >
              Submit another response
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jordan@example.com"
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Experience Level
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500"
                >
                  <option value="Brand New / First Time">Brand New / First Time</option>
                  <option value="Played a few times with friends">Played a few times with friends</option>
                  <option value="Regular casual player looking for advice">Regular casual player looking for advice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Interest
                </label>
                <select
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500"
                >
                  <option value="Looking for beginner clinic & disc loaner info">Looking for beginner clinic & disc loaner info</option>
                  <option value="Want a casual round buddy to show me Loriella">Want a casual round buddy to show me Loriella</option>
                  <option value="Interested in joining MA4 / Novice league">Interested in joining MA4 / Novice league</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Submitting..." : "Submit Beginner Interest Form"}</span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

