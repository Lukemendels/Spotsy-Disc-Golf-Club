import React, { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import {
  Sparkles,
  ShieldCheck,
  Tag,
  CreditCard,
  Mail,
  CheckCircle2,
  Lock,
  Gift,
  Send,
} from "lucide-react";

export const JoinClubPage: React.FC = () => {
  const [subEmail, setSubEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "announcementSubscriptions"), {
        email: subEmail.trim(),
        createdAt: new Date().toISOString(),
      });
      setSubmitting(false);
      setSubscribed(true);
      setSubEmail("");
    } catch (err) {
      console.error("Error subscribing:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>2026 Membership Drive</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Join Spotsy Disc Golf Club
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Support course maintenance, compete in weekly tag battles, and unlock member-only access to Wilderness Ridge & Hazel Run.
          </p>
        </div>

        {/* Pricing Badge */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 shrink-0 text-center">
          <span className="text-2xl font-extrabold text-green-400">$25</span>
          <span className="text-xs text-slate-300 font-bold block">/ Annual Membership</span>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Private Access */}
        <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl space-y-2">
          <div className="p-2 bg-green-50 text-green-700 rounded-lg w-fit border border-green-100">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Private Course Access</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your member badge grants full playing privileges at <strong className="text-green-700">Wilderness Ridge DGC</strong> and <strong className="text-teal-700">Hazel Run DGC</strong>—two premier championship layouts reserved exclusively for Spotsy Club members.
          </p>
        </div>

        {/* Physical Bag Tag */}
        <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl space-y-2">
          <div className="p-2 bg-green-50 text-green-700 rounded-lg w-fit border border-green-100">
            <Tag className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Official 2026 Bag Tag</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every member receives a laser-etched physical metal/acrylic bag tag. Battle for lower tag numbers during weekly Sunday matches at Loriella Park!
          </p>
        </div>

        {/* Discounts & Perks */}
        <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl space-y-2">
          <div className="p-2 bg-green-50 text-green-700 rounded-lg w-fit border border-green-100">
            <Gift className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Tournament Discounts</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Save $5-$10 on entry fees for all club-hosted PDGA tournaments and seasonal specials, plus access to member-only CTP prizes and ace pots.
          </p>
        </div>

        {/* Voice in Community */}
        <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl space-y-2">
          <div className="p-2 bg-green-50 text-green-700 rounded-lg w-fit border border-green-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Voting Rights & Representation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Participate in annual officer elections, vote on new course tee pad installations, and influence Parks & Rec liaisons.
          </p>
        </div>
      </div>

      {/* Payment & Tag Delivery Steps */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 card-shadow">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2 bg-green-100 text-green-800 rounded-lg">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">How to Get Your 2026 Tag</h2>
            <p className="text-xs text-slate-500">Simple 3-step membership payment & physical tag pick-up</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold inline-flex items-center justify-center text-xs">
              1
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Send $25 Dues</h4>
            <p className="text-slate-600 leading-relaxed">
              Pay via Venmo (<strong className="text-green-700">@SpotsyDiscGolf</strong>) or PayPal (<strong className="text-green-700">treasurer@spotsydiscgolf.org</strong>). Include your name and email.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold inline-flex items-center justify-center text-xs">
              2
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Tag Pick-up Steps</h4>
            <p className="text-slate-600 leading-relaxed">
              Pick up your physical tag at any Sunday Morning Tag Match at Loriella Park (9:00 AM at Hole 1 shelter) or contact Treasurer.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold inline-flex items-center justify-center text-xs">
              3
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Unlock App Badge</h4>
            <p className="text-slate-600 leading-relaxed">
              Once dues are logged, your app profile role will automatically display the official Club Member badge for casual round verification!
            </p>
          </div>
        </div>
      </section>

      {/* Non-Facebook Email Subscription Form */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 card-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 text-green-800 rounded-lg">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Don't Use Facebook? Get Email Updates!</h3>
            <p className="text-xs text-slate-500">
              Subscribe for direct club announcements, course closure alerts, and tournament registration openings.
            </p>
          </div>
        </div>

        {subscribed ? (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-2 text-xs text-green-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>Subscribed! You will receive official Spotsy Disc Golf emails.</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="email"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              placeholder="Enter your email address..."
              required
              className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Subscribing..." : "Subscribe"}</span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

