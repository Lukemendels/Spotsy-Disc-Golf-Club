import { cardSizes, shotgunHoleOrder } from "../lib/leagueCards";
import React, { useEffect, useRef, useState } from "react";
import { MemberLeagueDemo } from "./MemberLeagueDemo";
import { ResultsImportDemo } from "./ResultsImportDemo";
import { loadMembers, saveMembers } from "../lib/memberDemo";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  ClipboardCopy,
  Clock3,
  FileUp,
  Info,
  Lock,
  QrCode,
  RotateCcw,
  Shuffle,
  Tags,
  Trophy,
  Zap,
} from "lucide-react";
import {
  buildDemoCheckIns,
  DEMO_CHECKIN_COUNT,
  DEMO_DIVISIONS,
  LEAGUE_CHECKIN_EVENT_KEY,
  LeagueCheckIn,
  loadLeagueCheckIns,
  normalizePlayerName,
  saveLeagueCheckIns,
} from "../lib/leagueDemo";

interface DemoCard {
  id: string;
  hole: number;
  division: string;
  players: LeagueCheckIn[];
}

const DIVISION_ORDER = new Map(DEMO_DIVISIONS.map((division, index) => [division, index]));
const HOLES = Array.from({ length: 18 }, (_, index) => index + 1);
const cardRosterSignature = (players: LeagueCheckIn[]) => JSON.stringify(players.map(({ id, name, division, spotsyTag, staffordTag }) => ({ id, name, division, spotsyTag, staffordTag })));

function divisionLabel(players: LeagueCheckIn[]): string {
  const divisions = [...new Set(players.map((player) => player.division))];
  return divisions.length === 1 ? divisions[0] : divisions.join(" / ");
}

function buildCards(players: LeagueCheckIn[], targetCardSize: number, firstHole: number): DemoCard[] {
  const sorted = [...players].sort((a, b) => {
    const divisionDelta = (DIVISION_ORDER.get(a.division) ?? 999) - (DIVISION_ORDER.get(b.division) ?? 999);
    return divisionDelta || (a.spotsyTag ?? 9999) - (b.spotsyTag ?? 9999) || a.name.localeCompare(b.name);
  });
  const sizes = cardSizes(sorted.length, targetCardSize);
  const holes = shotgunHoleOrder(firstHole);
  const cards: DemoCard[] = [];
  let offset = 0;
  sizes.forEach((size, index) => {
    const chunk = sorted.slice(offset, offset + size);
    offset += size;
    cards.push({
      id: `card-${index + 1}`,
      hole: holes[index % holes.length],
      division: divisionLabel(chunk),
      players: chunk,
    });
  });
  return cards;
}

export const LeagueOperationsDemo: React.FC = () => {
  const [players, setPlayers] = useState<LeagueCheckIn[]>(() => loadLeagueCheckIns());
  const [checkInClosed, setCheckInClosed] = useState(() => loadMembers().locked);
  const [targetCardSize, setTargetCardSize] = useState(3);
  const [firstHole, setFirstHole] = useState(1);
  const [cards, setCards] = useState<DemoCard[]>([]);
  const [published, setPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const rosterSignature = useRef(cardRosterSignature(players));

  useEffect(() => {
    const refresh = () => {
      const next = loadLeagueCheckIns();
      const signature = cardRosterSignature(next);
      if (signature !== rosterSignature.current) { setCards([]); setPublished(false); rosterSignature.current = signature; }
      else setCards(current => current.map(card => ({ ...card, players: card.players.map(player => next.find(p => p.id === player.id) || player) })));
      setPlayers(next); setCheckInClosed(loadMembers().locked);
    };
    window.addEventListener(LEAGUE_CHECKIN_EVENT_KEY, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(LEAGUE_CHECKIN_EVENT_KEY, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const checkInUrl = `${window.location.origin}${import.meta.env.BASE_URL}?leagueCheckIn=thursday-night-league`;
  const acePotCount = players.filter((player) => player.acePotPaid).length;
  const spotsyTagCount = players.filter((player) => Number.isFinite(player.spotsyTag)).length;
  const staffordTagCount = players.filter((player) => Number.isFinite(player.staffordTag)).length;
  const persistPlayers = (next: LeagueCheckIn[]) => { saveLeagueCheckIns(next); };
  const updatePlayer = (id: string, patch: Partial<LeagueCheckIn>) => persistPlayers(players.map((player) => player.id === id ? { ...player, ...patch } : player));
  const loadDemoRoster = () => { persistPlayers(buildDemoCheckIns()); setCards([]); setPublished(false); setCheckInClosed(false); };
  const clearRoster = () => { persistPlayers([]); setCheckInClosed(false); saveMembers({ ...loadMembers(), locked: false }); };
  const generateCards = () => {
    if (!players.length) return;
    setCheckInClosed(true);
    saveMembers({ ...loadMembers(), locked: true });
    setCards(buildCards(players, targetCardSize, firstHole));
    setPublished(false);
  };

  const movePlayer = (playerId: string, destinationCardId: string) => {
    setCards((current) => {
      let moving: LeagueCheckIn | undefined;
      const without = current.map((card) => {
        const match = card.players.find((player) => player.id === playerId);
        if (match) moving = match;
        return { ...card, players: card.players.filter((player) => player.id !== playerId) };
      });
      if (!moving) return current;
      return without.map((card) => card.id === destinationCardId ? { ...card, players: [...card.players, moving as LeagueCheckIn], division: divisionLabel([...card.players, moving as LeagueCheckIn]) } : { ...card, division: divisionLabel(card.players.filter((player) => player.id !== playerId)) });
    });
    setPublished(false);
  };

  const updateHole = (cardId: string, hole: number) => {
    setCards((current) => current.map((card) => card.id === cardId ? { ...card, hole } : card));
    setPublished(false);
  };

  const copyCallout = async () => {
    const calloutText = cards.map((card, index) => `${index + 1}. Hole ${card.hole} — ${card.division}: ${card.players.map((player) => player.name).join(", ")}`).join("\n");
    try { await navigator.clipboard.writeText(`6:00 PM SHOTGUN CALL-OUT\n${calloutText}`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); }
  };

  const hasOversizeException = targetCardSize === 3 && cards.some(card => card.players.length > 3);
  const usesSecondHoleWave = cards.length > 9;
  const validCards = cards.length > 0 && cards.length <= 18 && new Set(cards.map(c => c.hole)).size === cards.length && cards.every(c => c.players.length > 0 && c.players.length <= 4);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-bold">Concept demo with the intended league-night workflow.</p><p className="mt-1 leading-relaxed">QR opens the member-facing demo. Scanning on another device creates a separate local roster. This GitHub Pages demo stores the roster locally; production needs a secured shared store so player-phone scans synchronize to the organizer device.</p><p className="mt-1 leading-relaxed"><strong>Demo data:</strong> all participants, identities, results and payments are synthetic. Sample times are a discussion aid, not verified club policy.</p></div></div>
      </div>

      <MemberLeagueDemo staff />
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700"><QrCode className="h-4 w-4" />Before 5:45 PM · player QR check-in</div><h2 className="mt-1 text-lg font-extrabold text-slate-900">League Check-In</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">Returning members reuse their profile; staff can add walk-ups without an account. Payment confirmation is an organizer action. Building cards locks the roster for the 5:45 close.</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm"><QRCodeSVG value={checkInUrl} size={148} level="M" marginSize={2} /><a href={checkInUrl} target="_blank" rel="noreferrer" className="mt-2 block text-[10px] font-bold text-green-700 hover:underline">Open player check-in preview</a></div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric value={players.length} label="Checked in" />
          <Metric value={acePotCount} label="Staff confirmed ace pot" className="text-amber-700" />
          <Metric value={spotsyTagCount} label="Spotsy tags" className="text-green-700" />
          <Metric value={staffordTagCount} label="Stafford tags" className="text-blue-700" />
          <div className={`rounded-xl p-3 text-center ring-1 ${checkInClosed ? "bg-rose-50 ring-rose-200" : "bg-green-50 ring-green-200"}`}><p className="text-sm font-extrabold text-slate-900">{checkInClosed ? "LOCKED" : "OPEN"}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">5:45 check-in</p></div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={loadDemoRoster} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Load synthetic roster — resets sample results · {DEMO_CHECKIN_COUNT}</button>
          <button onClick={clearRoster} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"><RotateCcw className="mr-1 inline h-3.5 w-3.5" />Clear</button>
          <button onClick={() => { const locked = !loadMembers().locked; saveMembers({ ...loadMembers(), locked }); setCheckInClosed(locked); setCards([]); setPublished(false); }} className={`ml-auto rounded-lg px-3 py-2 text-xs font-bold ${checkInClosed ? "bg-green-100 text-green-800" : "bg-slate-900 text-white"}`}><Lock className="mr-1 inline h-3.5 w-3.5" />{checkInClosed ? "Reopen check-in" : "Close check-in · 5:45"}</button>
        </div>

        <p className="text-xs text-slate-500">Payment updates refresh ace eligibility and tag edits recalculate the tag preview; imported scores and history stay saved. Division/tag edits require rebuilding cards. Adding or removing attendees requires results reconciliation.</p>
        {players.length > 0 && <RosterTable players={players} checkInClosed={checkInClosed} updatePlayer={updatePlayer} removePlayer={id => persistPlayers(players.filter(p => p.id !== id))} />}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700"><Shuffle className="h-4 w-4" />5:45 lock → fast cards → staggered holes</div><h2 className="mt-1 text-lg font-extrabold text-slate-900">Card Builder</h2><p className="mt-1 max-w-2xl text-xs text-slate-600">Players stay ordered by PDGA division where possible. Three-player mode maximizes 3-person cards for pace of play; starting holes use every other hole first to spread the field out.</p></div>
          <button disabled={!players.length} onClick={generateCards} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"><Shuffle className="h-3.5 w-3.5" />Build Cards</button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric value={players.length} label="Roster" />
          <label className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><span className="block text-[10px] font-bold uppercase text-slate-500">Target card size</span><select value={targetCardSize} onChange={(event) => { setTargetCardSize(Number(event.target.value)); setCards([]); }} className="mt-1 w-full bg-transparent text-lg font-extrabold outline-none"><option value={3}>3 · fastest</option><option value={4}>4</option></select></label>
          <label className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><span className="block text-[10px] font-bold uppercase text-slate-500">First starting hole</span><select value={firstHole} onChange={(event) => { setFirstHole(Number(event.target.value)); setCards([]); }} className="mt-1 w-full bg-transparent text-lg font-extrabold outline-none">{HOLES.map((hole) => <option key={hole} value={hole}>Hole {hole}</option>)}</select></label>
          <Metric value={cards.length || "—"} label="Cards" />
        </div>

        {targetCardSize === 3 && <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-800">Three-player mode creates all 3s whenever possible. Remainder 1 creates one 4-person card; remainder 2 creates two 4-person cards instead of a 5.</p>}
        {cards.length > 0 && <CardGrid cards={cards} movePlayer={movePlayer} updateHole={updateHole} />}
        {hasOversizeException && <p className="text-[11px] font-semibold text-amber-700">This roster needs one or two 4-person exceptions; the remaining cards stay at three whenever possible.</p>}
        {usesSecondHoleWave && <p className="text-[11px] font-semibold text-amber-700">More than nine cards are in the field, so after the first every-other-hole wave the remaining unused holes are filled. All starting holes remain unique through 18 cards.</p>}

        {cards.length > 0 && !validCards && <p className="text-sm font-bold text-rose-700">Fix empty or oversized cards and duplicate starting holes before finalizing. Maximum 18 cards.</p>}
        {cards.length > 0 && <div className="flex justify-end"><button disabled={!validCards} onClick={() => setPublished(true)} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white"><CheckCircle2 className="h-3.5 w-3.5" />Finalize for 6:00</button></div>}
        {published && cards.length > 0 && <Callout cards={cards} copied={copied} copyCallout={copyCallout} />}
      </section>

      <ResultsImportDemo />
    </div>
  );
};

const Metric: React.FC<{ value: React.ReactNode; label: string; className?: string }> = ({ value, label, className = "" }) => <div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200"><p className={`text-2xl font-extrabold text-slate-900 ${className}`}>{value}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p></div>;

const RosterTable: React.FC<{ players: LeagueCheckIn[]; checkInClosed: boolean; updatePlayer: (id: string, patch: Partial<LeagueCheckIn>) => void; removePlayer: (id: string) => void }> = ({ players, checkInClosed, updatePlayer, removePlayer }) => <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-2">Player</th><th className="px-3 py-2">Division</th><th className="px-3 py-2">Spotsy tag</th><th className="px-3 py-2">Stafford tag</th><th className="px-3 py-2">Staff confirms ace pot</th><th className="px-3 py-2">Check-in</th></tr></thead><tbody>{players.map((player) => <tr key={player.id} className="border-t border-slate-100"><td className="px-3 py-2 font-bold text-slate-900">{player.name}<code className="block text-[10px] font-normal text-slate-500">{player.id}</code></td><td className="px-3 py-2"><select value={player.division} disabled={checkInClosed} onChange={(event) => updatePlayer(player.id, { division: event.target.value })} className="rounded border border-slate-300 bg-white px-2 py-1">{DEMO_DIVISIONS.map((division) => <option key={division}>{division}</option>)}</select></td><td className="px-3 py-2">{player.spotsyTag ?? "—"}</td><td className="px-3 py-2">{player.staffordTag ?? "—"}</td><td className="px-3 py-2"><label className="flex items-center gap-1.5"><input aria-label={"Confirm ace pot for " + player.id} type="checkbox" checked={player.acePotPaid} disabled={checkInClosed} onChange={(event) => updatePlayer(player.id, { acePotPaid: event.target.checked })} /><span>{player.acePotPaid ? "Confirmed" : "Unconfirmed"}</span></label></td><td className="px-3 py-2 text-slate-500">{new Date(player.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}<button disabled={checkInClosed} className="ml-2 text-rose-700 underline" onClick={() => removePlayer(player.id)}>Remove attendee</button></td></tr>)}</tbody></table></div>;

const CardGrid: React.FC<{ cards: DemoCard[]; movePlayer: (playerId: string, destinationCardId: string) => void; updateHole: (cardId: string, hole: number) => void }> = ({ cards, movePlayer, updateHole }) => <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{cards.map((card, cardIndex) => <div key={card.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-slate-500">Card {cardIndex + 1} · {card.division}</p><p className="text-sm font-extrabold">{card.players.length} players</p></div><label className="text-[10px] font-bold uppercase text-slate-500">Hole <select value={card.hole} onChange={(event) => updateHole(card.id, Number(event.target.value))} className="ml-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm font-extrabold text-slate-900">{HOLES.map((hole) => <option key={hole} value={hole}>{hole}</option>)}</select></label></div><div className="space-y-2">{card.players.map((player) => <div key={player.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><div><p className="text-xs font-bold">{player.name}</p><p className="text-[10px] text-slate-500">{player.division} · Spotsy {player.spotsyTag ?? "—"} · Stafford {player.staffordTag ?? "—"} · Ace {player.acePotPaid ? "✓" : "—"}</p></div><select value={card.id} onChange={(event) => movePlayer(player.id, event.target.value)} className="rounded border border-slate-300 bg-white px-1.5 py-1 text-[10px] font-bold">{cards.map((destination, destinationIndex) => <option key={destination.id} value={destination.id}>Card {destinationIndex + 1}</option>)}</select></div>)}</div></div>)}</div>;

const Callout: React.FC<{ cards: DemoCard[]; copied: boolean; copyCallout: () => void }> = ({ cards, copied, copyCallout }) => <div className="rounded-xl border border-green-300 bg-green-50 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase text-green-800"><Clock3 className="h-4 w-4" />6:00 PM shotgun call-out order</div><p className="mt-1 text-[11px] text-green-800">Call the every-other-hole assignments in this order, then send each card out.</p></div><button onClick={copyCallout} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-green-800 ring-1 ring-green-300"><ClipboardCopy className="mr-1 inline h-3.5 w-3.5" />{copied ? "Copied" : "Copy call-out"}</button></div><ol className="mt-3 space-y-2">{cards.map((card, index) => <li key={card.id} className="rounded-lg bg-white px-3 py-2 text-xs text-slate-800"><strong>{index + 1}. Hole {card.hole} — {card.division}:</strong> {card.players.map((player) => player.name).join(", ")}</li>)}</ol></div>;
