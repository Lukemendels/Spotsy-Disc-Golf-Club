import React, { useState } from "react";
import { CheckCircle2, Clock3, Coins, Tags, Trophy, Users } from "lucide-react";
import { DEMO_DIVISIONS, LeagueCheckIn, upsertLeagueCheckIn } from "../lib/leagueDemo";

export const LeagueCheckInPage: React.FC = () => {
  const [name, setName] = useState("");
  const [division, setDivision] = useState(DEMO_DIVISIONS[0]);
  const [spotsyTag, setSpotsyTag] = useState("");
  const [staffordTag, setStaffordTag] = useState("");
  const [acePotPaid, setAcePotPaid] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const parseOptionalTag = (value: string): number | undefined => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const checkIn: LeagueCheckIn = {
      id: `checkin-${Date.now()}`,
      name: name.trim(),
      division,
      spotsyTag: parseOptionalTag(spotsyTag),
      staffordTag: parseOptionalTag(staffordTag),
      acePotPaid,
      checkedInAt: new Date().toISOString(),
    };
    upsertLeagueCheckIn(checkIn);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-md rounded-3xl border border-green-700 bg-slate-900 p-7 text-center shadow-2xl">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
          <h1 className="mt-4 text-2xl font-extrabold">You’re checked in</h1>
          <p className="mt-2 text-sm text-slate-300">Be back at the check-in area before the 6:00 PM shotgun call-out.</p>
          <div className="mt-5 rounded-xl bg-slate-800 p-4 text-left text-sm">
            <p className="font-bold text-white">{name}</p>
            <p className="mt-1 text-slate-300">{division}</p>
            <p className="mt-1 text-slate-400">Spotsy tag: {spotsyTag || "—"} · Stafford tag: {staffordTag || "—"}</p>
            <p className="mt-1 text-slate-400">Ace pot: {acePotPaid ? "Paid" : "No"}</p>
          </div>
          <p className="mt-5 text-[11px] leading-relaxed text-amber-300">Concept demo: this build stores check-in on this browser/device. Production implementation will use a secured shared check-in store so scans from player phones appear instantly on the organizer screen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <form onSubmit={submit} className="mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="border-b border-slate-800 bg-gradient-to-br from-green-950 to-slate-900 p-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400"><Trophy className="h-4 w-4" /> Thursday Night League</div>
          <h1 className="mt-2 text-2xl font-extrabold">Player Check-In</h1>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-800 bg-amber-950/50 px-3 py-2 text-xs text-amber-200"><Clock3 className="h-4 w-4" /> Check-in closes at 5:45 PM · Shotgun start at 6:00 PM</div>
        </div>

        <div className="space-y-5 p-6">
          <label className="block"><span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-300"><Users className="h-4 w-4 text-green-400" /> Player name</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name as it will appear in UDisc" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-green-500" /></label>

          <label className="block"><span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-300"><Trophy className="h-4 w-4 text-green-400" /> Division</span><select value={division} onChange={(event) => setDivision(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-green-500">{DEMO_DIVISIONS.map((item) => <option key={item}>{item}</option>)}</select><span className="mt-1 block text-[10px] text-slate-500">Demo labels; production divisions come from the league event setup.</span></label>

          <div className="grid grid-cols-2 gap-3">
            <label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-300"><Tags className="h-4 w-4 text-green-400" /> Spotsy tag</span><input inputMode="numeric" value={spotsyTag} onChange={(event) => setSpotsyTag(event.target.value)} placeholder="Optional" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-green-500" /></label>
            <label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-300"><Tags className="h-4 w-4 text-blue-400" /> Stafford tag</span><input inputMode="numeric" value={staffordTag} onChange={(event) => setStaffordTag(event.target.value)} placeholder="Optional" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-green-500" /></label>
          </div>
          <p className="-mt-3 text-[10px] leading-relaxed text-slate-500">Enter whichever tags you physically brought. Players can put a Spotsy tag, a Stafford tag, both, or neither into play.</p>

          <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 ${acePotPaid ? "border-amber-500 bg-amber-950/40" : "border-slate-700 bg-slate-800"}`}><span className="flex items-center gap-3"><Coins className="h-5 w-5 text-amber-400" /><span><span className="block text-sm font-bold">Ace pot paid?</span><span className="block text-[10px] text-slate-400">Organizer can verify payment at the table.</span></span></span><input type="checkbox" checked={acePotPaid} onChange={(event) => setAcePotPaid(event.target.checked)} className="h-5 w-5" /></label>

          <button type="submit" className="w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-extrabold text-slate-950 hover:bg-green-400">Check In for League</button>
        </div>
      </form>
    </div>
  );
};
