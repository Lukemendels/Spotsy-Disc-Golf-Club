import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import {
  buildDemoCheckIns,
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

interface ImportedTagResult {
  playerId: string;
  name: string;
  score: number;
  scoreSource: string;
  spotsyTag?: number;
  staffordTag?: number;
  spotsyOut?: number;
  staffordOut?: number;
}

const DIVISION_ORDER = new Map(DEMO_DIVISIONS.map((division, index) => [division, index]));

const DEMO_UDISC_CSV = `PlayerName,CourseName,LayoutName,Date,Total,+/-,Hole1,Hole2,Hole3
Player 04,Loriella Park,White to Red,2026-08-27 1800,49,-5,2,3,2
Player 11,Loriella Park,White to Red,2026-08-27 1800,51,-3,3,3,2
Player 02,Loriella Park,White to Red,2026-08-27 1800,53,-1,3,3,3
Player 19,Loriella Park,White to Red,2026-08-27 1800,54,0,3,3,3
Player 07,Loriella Park,White to Red,2026-08-27 1800,55,1,3,4,3
Player 23,Loriella Park,White to Red,2026-08-27 1800,57,3,4,3
Player 14,Loriella Park,White to Red,2026-08-27 1800,58,4,4,4,3
Player 27,Loriella Park,White to Red,2026-08-27 1800,60,6,4,4,4`;

function fastThreeCardSizes(total: number): number[] {
  if (total <= 0) return [];
  if (total < 3) return [total];
  const threes = Math.floor(total / 3);
  const remainder = total % 3;
  if (remainder === 0) return Array(threes).fill(3);
  if (remainder === 1) return [...Array(Math.max(0, threes - 1)).fill(3), 4];
  return threes === 0 ? [total] : [...Array(Math.max(0, threes - 1)).fill(3), 5];
}

function balancedCardSizes(total: number, target: number): number[] {
  if (total <= 0) return [];
  if (total <= 5) return [total];
  const minCards = Math.ceil(total / 5);
  const maxCards = Math.max(minCards, Math.floor(total / 3));
  const cardCount = Math.max(minCards, Math.min(maxCards, Math.round(total / target)));
  const base = Math.floor(total / cardCount);
  const remainder = total % cardCount;
  return Array.from({ length: cardCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

function cardSizes(total: number, target: number): number[] {
  return target === 3 ? fastThreeCardSizes(total) : balancedCardSizes(total, target);
}

function shotgunHoleOrder(firstHole: number): number[] {
  const start = Math.max(1, Math.min(18, firstHole || 1));
  const primary = Array.from({ length: 9 }, (_, index) => ((start - 1 + index * 2) % 18) + 1);
  const secondaryStart = (start % 18) + 1;
  const secondary = Array.from({ length: 9 }, (_, index) => ((secondaryStart - 1 + index * 2) % 18) + 1);
  return [...primary, ...secondary];
}

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

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"') {
      if (quoted && next === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim()); field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = []; field = "";
    } else field += char;
  }
  row.push(field.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9+/-]+/g, " ").trim();
}

function findHeaderIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  return candidates.map(normalizeHeader).map((candidate) => normalized.indexOf(candidate)).find((index) => index >= 0) ?? -1;
}

function importUDiscCsv(text: string, checkIns: LeagueCheckIn[]): { results: ImportedTagResult[]; scoreSource?: string; error?: string } {
  const rows = parseCsv(text);
  if (rows.length < 2) return { results: [], error: "The CSV does not contain a header row and player results." };
  const headers = rows[0];
  const nameIndex = findHeaderIndex(headers, ["PlayerName", "name", "player name", "player"]);
  const relativeIndex = findHeaderIndex(headers, ["+/-", "relative_score", "relative score", "relative score total", "relative score round"]);
  const totalIndex = findHeaderIndex(headers, ["Total", "total_score", "total score", "total score total", "total score round"]);
  if (nameIndex < 0) return { results: [], error: "Could not find a player-name column in this UDisc CSV." };
  const scoreIndex = relativeIndex >= 0 ? relativeIndex : totalIndex;
  if (scoreIndex < 0) return { results: [], error: "Could not find a UDisc score column. Expected +/- / relative score or Total / total score." };
  const roster = new Map(checkIns.map((item) => [normalizePlayerName(item.name), item]));
  const scoreSource = headers[scoreIndex];
  const imported = rows.slice(1)
    .filter((values) => values[nameIndex]?.trim() && normalizeHeader(values[nameIndex]) !== "par" && values[scoreIndex]?.trim() !== "")
    .map((values, rowIndex) => {
      const name = values[nameIndex].trim();
      const checkIn = roster.get(normalizePlayerName(name));
      return {
        playerId: `udisc-${rowIndex + 1}`,
        name,
        score: Number(values[scoreIndex]),
        scoreSource,
        spotsyTag: checkIn?.spotsyTag,
        staffordTag: checkIn?.staffordTag,
      };
    })
    .filter((result) => Number.isFinite(result.score));
  if (!imported.length) return { results: [], error: "No player rows with numeric scores were found in the CSV." };
  const names = imported.map((result) => normalizePlayerName(result.name));
  const duplicateName = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicateName) return { results: [], error: `The CSV contains more than one row for ${duplicateName}. Export one league round before assigning tags.` };
  return { results: imported.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name)), scoreSource };
}

function duplicateValues(values: Array<number | undefined>): number[] {
  const numeric = values.filter((value): value is number => Number.isFinite(value));
  return [...new Set(numeric.filter((value, index) => numeric.indexOf(value) !== index))];
}

function assignTagPool(results: ImportedTagResult[], input: "spotsyTag" | "staffordTag", output: "spotsyOut" | "staffordOut"): ImportedTagResult[] {
  const eligible = results.filter((result) => Number.isFinite(result[input]));
  const tags = eligible.map((result) => result[input] as number).sort((a, b) => a - b);
  const finish = [...eligible].sort((a, b) => a.score - b.score || (a[input] as number) - (b[input] as number));
  const assigned = new Map<string, number>();
  finish.forEach((result, index) => assigned.set(result.playerId, tags[index]));
  return results.map((result) => ({ ...result, [output]: assigned.get(result.playerId) }));
}

export const LeagueOperationsDemo: React.FC = () => {
  const [players, setPlayers] = useState<LeagueCheckIn[]>(() => loadLeagueCheckIns());
  const [checkInClosed, setCheckInClosed] = useState(false);
  const [targetCardSize, setTargetCardSize] = useState(3);
  const [firstHole, setFirstHole] = useState(1);
  const [cards, setCards] = useState<DemoCard[]>([]);
  const [published, setPublished] = useState(false);
  const [tagResults, setTagResults] = useState<ImportedTagResult[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvScoreSource, setCsvScoreSource] = useState("");
  const [csvError, setCsvError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const refresh = () => setPlayers(loadLeagueCheckIns());
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
  const spotsyDuplicates = useMemo(() => duplicateValues(tagResults.map((result) => result.spotsyTag)), [tagResults]);
  const staffordDuplicates = useMemo(() => duplicateValues(tagResults.map((result) => result.staffordTag)), [tagResults]);

  const persistPlayers = (next: LeagueCheckIn[]) => { setPlayers(next); saveLeagueCheckIns(next); setCards([]); setPublished(false); };
  const updatePlayer = (id: string, patch: Partial<LeagueCheckIn>) => persistPlayers(players.map((player) => player.id === id ? { ...player, ...patch } : player));
  const loadDemoRoster = () => { persistPlayers(buildDemoCheckIns()); setCheckInClosed(false); };
  const clearRoster = () => { persistPlayers([]); setCheckInClosed(false); setTagResults([]); };
  const generateCards = () => { setCards(buildCards(players, targetCardSize, firstHole)); setPublished(false); };

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
    setCards((current) => current.map((card) => card.id === cardId ? { ...card, hole: Math.max(1, Math.min(18, hole || 1)) } : card));
    setPublished(false);
  };

  const calloutText = cards.map((card, index) => `${index + 1}. Hole ${card.hole} — ${card.division}: ${card.players.map((player) => player.name).join(", ")}`).join("\n");
  const copyCallout = async () => {
    try { await navigator.clipboard.writeText(`6:00 PM SHOTGUN CALL-OUT\n${calloutText}`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); }
  };

  const loadCsvText = (text: string, fileName: string) => {
    const imported = importUDiscCsv(text, players);
    setCsvError(imported.error ?? "");
    setCsvFileName(imported.error ? "" : fileName);
    setCsvScoreSource(imported.scoreSource ?? "");
    setTagResults(imported.results);
  };
  const handleCsvUpload = async (file?: File) => {
    if (!file) return;
    try { loadCsvText(await file.text(), file.name); } catch { setCsvError("The selected CSV could not be read."); setTagResults([]); }
  };
  const calculateTags = () => {
    if (spotsyDuplicates.length || staffordDuplicates.length) return;
    setTagResults(assignTagPool(assignTagPool(tagResults, "spotsyTag", "spotsyOut"), "staffordTag", "staffordOut"));
  };

  const hasOversizeException = targetCardSize === 3 && cards.some((card) => card.players.length > 3);
  const usesSecondHoleWave = cards.length > 9;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-bold">Concept demo with the intended league-night workflow.</p><p className="mt-1 leading-relaxed">QR check-in is implemented as a player-facing screen. This GitHub Pages demo stores the roster locally; production needs a secured shared store so player-phone scans synchronize to the organizer device.</p></div></div>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700"><QrCode className="h-4 w-4" />Before 5:45 PM · player QR check-in</div><h2 className="mt-1 text-lg font-extrabold text-slate-900">League Check-In</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">Players scan at the table and submit name, PDGA division, ace-pot status, Spotsy tag and/or Stafford tag. The roster locks at 5:45 for card generation.</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm"><QRCodeSVG value={checkInUrl} size={148} level="M" marginSize={2} /><a href={checkInUrl} target="_blank" rel="noreferrer" className="mt-2 block text-[10px] font-bold text-green-700 hover:underline">Open player check-in preview</a></div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric value={players.length} label="Checked in" />
          <Metric value={acePotCount} label="Ace pot paid" className="text-amber-700" />
          <Metric value={spotsyTagCount} label="Spotsy tags" className="text-green-700" />
          <Metric value={staffordTagCount} label="Stafford tags" className="text-blue-700" />
          <div className={`rounded-xl p-3 text-center ring-1 ${checkInClosed ? "bg-rose-50 ring-rose-200" : "bg-green-50 ring-green-200"}`}><p className="text-sm font-extrabold text-slate-900">{checkInClosed ? "LOCKED" : "OPEN"}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">5:45 check-in</p></div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={loadDemoRoster} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Load 27 demo check-ins</button>
          <button onClick={clearRoster} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"><RotateCcw className="mr-1 inline h-3.5 w-3.5" />Clear</button>
          <button onClick={() => { setCheckInClosed((value) => !value); setCards([]); setPublished(false); }} className={`ml-auto rounded-lg px-3 py-2 text-xs font-bold ${checkInClosed ? "bg-green-100 text-green-800" : "bg-slate-900 text-white"}`}><Lock className="mr-1 inline h-3.5 w-3.5" />{checkInClosed ? "Reopen check-in" : "Close check-in · 5:45"}</button>
        </div>

        {players.length > 0 && <RosterTable players={players} checkInClosed={checkInClosed} updatePlayer={updatePlayer} />}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700"><Shuffle className="h-4 w-4" />5:45 lock → fast cards → staggered holes</div><h2 className="mt-1 text-lg font-extrabold text-slate-900">Card Builder</h2><p className="mt-1 max-w-2xl text-xs text-slate-600">Players stay ordered by PDGA division where possible. Three-player mode maximizes 3-person cards for pace of play; starting holes use every other hole first to spread the field out.</p></div>
          <button disabled={!checkInClosed || !players.length} onClick={generateCards} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"><Shuffle className="h-3.5 w-3.5" />Build Cards</button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric value={players.length} label="Roster" />
          <label className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><span className="block text-[10px] font-bold uppercase text-slate-500">Target card size</span><select value={targetCardSize} onChange={(event) => { setTargetCardSize(Number(event.target.value)); setCards([]); }} className="mt-1 w-full bg-transparent text-lg font-extrabold outline-none"><option value={3}>3 · fastest</option><option value={4}>4</option><option value={5}>5</option></select></label>
          <label className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><span className="block text-[10px] font-bold uppercase text-slate-500">First starting hole</span><input type="number" min={1} max={18} value={firstHole} onChange={(event) => { setFirstHole(Math.max(1, Math.min(18, Number(event.target.value) || 1))); setCards([]); }} className="mt-1 w-full bg-transparent text-lg font-extrabold outline-none" /></label>
          <Metric value={cards.length || "—"} label="Cards" />
        </div>

        {targetCardSize === 3 && <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-800">Three-player mode creates all 3s whenever the roster is divisible by 3. If not, it uses the minimum unavoidable exception: one 4-person card for remainder 1 or one 5-person card for remainder 2.</p>}
        {cards.length > 0 && <CardGrid cards={cards} movePlayer={movePlayer} updateHole={updateHole} />}
        {hasOversizeException && <p className="text-[11px] font-semibold text-amber-700">One larger card is mathematically required by this roster size; all other cards remain at three players.</p>}
        {usesSecondHoleWave && <p className="text-[11px] font-semibold text-amber-700">More than nine cards are in the field, so after the first every-other-hole wave the remaining unused holes are filled. All starting holes remain unique through 18 cards.</p>}

        {cards.length > 0 && <div className="flex justify-end"><button onClick={() => setPublished(true)} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white"><CheckCircle2 className="h-3.5 w-3.5" />Finalize for 6:00</button></div>}
        {published && cards.length > 0 && <Callout cards={cards} copied={copied} copyCallout={copyCallout} />}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
        <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700"><Tags className="h-4 w-4" />After round · UDisc → two tag pools</div><h2 className="mt-1 text-lg font-extrabold text-slate-900">Bag Tag Assignment</h2><p className="mt-1 max-w-2xl text-xs text-slate-600">UDisc remains the score system of record. Imported player names match the check-in roster, so Spotsy and Stafford tags are already known and are reassigned independently.</p></div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-center"><label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50 px-4 py-4 text-teal-900"><FileUp className="h-6 w-6" /><span><span className="block text-sm font-extrabold">Import UDisc CSV</span><span className="block text-[11px] text-teal-800">Name + +/- or Total. No score re-entry.</span></span><input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => handleCsvUpload(event.target.files?.[0])} /></label><button onClick={() => loadCsvText(DEMO_UDISC_CSV, "udisc-demo-round.csv")} className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Load demo UDisc CSV</button></div>
        {csvError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">{csvError}</div>}
        {(spotsyDuplicates.length > 0 || staffordDuplicates.length > 0) && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">Duplicate tag numbers detected: {spotsyDuplicates.length ? `Spotsy ${spotsyDuplicates.map((tag) => `#${tag}`).join(", ")}` : ""}{spotsyDuplicates.length && staffordDuplicates.length ? " · " : ""}{staffordDuplicates.length ? `Stafford ${staffordDuplicates.map((tag) => `#${tag}`).join(", ")}` : ""}.</div>}
        {tagResults.length > 0 ? <TagResults results={tagResults} fileName={csvFileName} scoreSource={csvScoreSource} calculateTags={calculateTags} disabled={spotsyDuplicates.length > 0 || staffordDuplicates.length > 0} /> : <div className="rounded-xl border border-dashed border-slate-300 p-7 text-center text-xs text-slate-500">Import the completed UDisc CSV after the round. The check-in roster supplies the tags that were put into play.</div>}
      </section>
    </div>
  );
};

const Metric: React.FC<{ value: React.ReactNode; label: string; className?: string }> = ({ value, label, className = "" }) => <div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200"><p className={`text-2xl font-extrabold text-slate-900 ${className}`}>{value}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p></div>;

const RosterTable: React.FC<{ players: LeagueCheckIn[]; checkInClosed: boolean; updatePlayer: (id: string, patch: Partial<LeagueCheckIn>) => void }> = ({ players, checkInClosed, updatePlayer }) => <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-2">Player</th><th className="px-3 py-2">Division</th><th className="px-3 py-2">Spotsy tag</th><th className="px-3 py-2">Stafford tag</th><th className="px-3 py-2">Ace pot</th><th className="px-3 py-2">Check-in</th></tr></thead><tbody>{players.map((player) => <tr key={player.id} className="border-t border-slate-100"><td className="px-3 py-2 font-bold text-slate-900">{player.name}</td><td className="px-3 py-2"><select value={player.division} disabled={checkInClosed} onChange={(event) => updatePlayer(player.id, { division: event.target.value })} className="rounded border border-slate-300 bg-white px-2 py-1">{DEMO_DIVISIONS.map((division) => <option key={division}>{division}</option>)}</select></td><td className="px-3 py-2">{player.spotsyTag ?? "—"}</td><td className="px-3 py-2">{player.staffordTag ?? "—"}</td><td className="px-3 py-2"><label className="flex items-center gap-1.5"><input type="checkbox" checked={player.acePotPaid} disabled={checkInClosed} onChange={(event) => updatePlayer(player.id, { acePotPaid: event.target.checked })} /><span>{player.acePotPaid ? "Paid" : "No"}</span></label></td><td className="px-3 py-2 text-slate-500">{new Date(player.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td></tr>)}</tbody></table></div>;

const CardGrid: React.FC<{ cards: DemoCard[]; movePlayer: (playerId: string, destinationCardId: string) => void; updateHole: (cardId: string, hole: number) => void }> = ({ cards, movePlayer, updateHole }) => <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{cards.map((card, cardIndex) => <div key={card.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-slate-500">Card {cardIndex + 1} · {card.division}</p><p className="text-sm font-extrabold">{card.players.length} players</p></div><label className="text-[10px] font-bold uppercase text-slate-500">Hole <input type="number" min={1} max={18} value={card.hole} onChange={(event) => updateHole(card.id, Number(event.target.value) || 1)} className="ml-1 w-14 rounded border border-slate-300 bg-white px-2 py-1 text-center text-sm font-extrabold text-slate-900" /></label></div><div className="space-y-2">{card.players.map((player) => <div key={player.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><div><p className="text-xs font-bold">{player.name}</p><p className="text-[10px] text-slate-500">{player.division} · Spotsy {player.spotsyTag ?? "—"} · Stafford {player.staffordTag ?? "—"} · Ace {player.acePotPaid ? "✓" : "—"}</p></div><select value={card.id} onChange={(event) => movePlayer(player.id, event.target.value)} className="rounded border border-slate-300 bg-white px-1.5 py-1 text-[10px] font-bold">{cards.map((destination, destinationIndex) => <option key={destination.id} value={destination.id}>Card {destinationIndex + 1}</option>)}</select></div>)}</div></div>)}</div>;

const Callout: React.FC<{ cards: DemoCard[]; copied: boolean; copyCallout: () => void }> = ({ cards, copied, copyCallout }) => <div className="rounded-xl border border-green-300 bg-green-50 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase text-green-800"><Clock3 className="h-4 w-4" />6:00 PM shotgun call-out order</div><p className="mt-1 text-[11px] text-green-800">Call the every-other-hole assignments in this order, then send each card out.</p></div><button onClick={copyCallout} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-green-800 ring-1 ring-green-300"><ClipboardCopy className="mr-1 inline h-3.5 w-3.5" />{copied ? "Copied" : "Copy call-out"}</button></div><ol className="mt-3 space-y-2">{cards.map((card, index) => <li key={card.id} className="rounded-lg bg-white px-3 py-2 text-xs text-slate-800"><strong>{index + 1}. Hole {card.hole} — {card.division}:</strong> {card.players.map((player) => player.name).join(", ")}</li>)}</ol></div>;

const TagResults: React.FC<{ results: ImportedTagResult[]; fileName: string; scoreSource: string; calculateTags: () => void; disabled: boolean }> = ({ results, fileName, scoreSource, calculateTags, disabled }) => <div className="space-y-3"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric value={fileName} label="File" /><Metric value={results.length} label="Players" /><Metric value={scoreSource} label="Score field" /><Metric value="2 pools" label="Spotsy + Stafford" /></div><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr><th className="px-3 py-2">Finish</th><th className="px-3 py-2">Player</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Spotsy in</th><th className="px-3 py-2">Spotsy out</th><th className="px-3 py-2">Stafford in</th><th className="px-3 py-2">Stafford out</th></tr></thead><tbody>{results.map((result, index) => <tr key={result.playerId} className="border-t border-slate-100"><td className="px-3 py-2 font-extrabold text-slate-500">{index + 1}</td><td className="px-3 py-2 font-bold">{result.name}</td><td className="px-3 py-2">{result.score}</td><td className="px-3 py-2">{result.spotsyTag ?? "—"}</td><td className="px-3 py-2 font-extrabold text-green-700">{result.spotsyOut ?? "—"}</td><td className="px-3 py-2">{result.staffordTag ?? "—"}</td><td className="px-3 py-2 font-extrabold text-blue-700">{result.staffordOut ?? "—"}</td></tr>)}</tbody></table></div><div className="flex flex-col gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-teal-900">Demo rule pending club confirmation</p><p className="text-[11px] text-teal-800">For each league separately, lowest score receives the lowest submitted tag; ties currently break by incoming tag.</p></div><button disabled={disabled} onClick={calculateTags} className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"><Trophy className="mr-1 inline h-3.5 w-3.5" />Assign both tag pools</button></div></div>;
