import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileUp,
  Info,
  Play,
  RotateCcw,
  Shuffle,
  Tags,
  Trophy,
  Users,
} from "lucide-react";

type DemoPool = "A" | "B" | "C" | "D";

interface DemoPlayer {
  id: string;
  name: string;
  pool: DemoPool;
  tag: number;
  checkedIn: boolean;
}

interface DemoCard {
  id: string;
  hole: number;
  players: DemoPlayer[];
}

interface ImportedTagResult {
  playerId: string;
  name: string;
  score: number;
  scoreSource: string;
  currentTag?: number;
  newTag?: number;
}

const DEMO_PLAYERS: DemoPlayer[] = Array.from({ length: 28 }, (_, index) => ({
  id: `demo-player-${index + 1}`,
  name: `Player ${String(index + 1).padStart(2, "0")}`,
  pool: (["A", "B", "C", "D"] as DemoPool[])[index % 4],
  tag: index + 1,
  checkedIn: true,
}));

const DEMO_UDISC_CSV = `PlayerName,CourseName,LayoutName,Date,Total,+/-,Hole1,Hole2,Hole3
Player 04,Loriella Park,Shorts,2026-08-27 1800,49,-5,2,3,2
Player 11,Loriella Park,Shorts,2026-08-27 1800,51,-3,3,3,2
Player 02,Loriella Park,Shorts,2026-08-27 1800,53,-1,3,3,3
Player 19,Loriella Park,Shorts,2026-08-27 1800,54,0,3,3,3
Player 07,Loriella Park,Shorts,2026-08-27 1800,55,1,3,4,3
Player 23,Loriella Park,Shorts,2026-08-27 1800,57,3,4,3
Player 14,Loriella Park,Shorts,2026-08-27 1800,58,4,4,4,3
Player 27,Loriella Park,Shorts,2026-08-27 1800,60,6,4,4,4`;

function buildCards(players: DemoPlayer[], targetCardSize: number, firstHole: number): DemoCard[] {
  const checkedIn = players
    .filter((player) => player.checkedIn)
    .sort((a, b) => a.pool.localeCompare(b.pool) || a.tag - b.tag);

  if (checkedIn.length === 0) return [];

  const cardCount = Math.max(1, Math.ceil(checkedIn.length / targetCardSize));
  const cards: DemoCard[] = Array.from({ length: cardCount }, (_, index) => ({
    id: `card-${index + 1}`,
    hole: ((firstHole - 1 + index) % 18) + 1,
    players: [],
  }));

  checkedIn.forEach((player, index) => {
    const row = Math.floor(index / cardCount);
    const column = index % cardCount;
    const target = row % 2 === 0 ? column : cardCount - 1 - column;
    cards[target].players.push(player);
  });

  return cards.filter((card) => card.players.length > 0);
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
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
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
  return candidates
    .map(normalizeHeader)
    .map((candidate) => normalized.indexOf(candidate))
    .find((index) => index >= 0) ?? -1;
}

function importUDiscCsv(text: string): {
  results: ImportedTagResult[];
  scoreSource?: string;
  error?: string;
} {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { results: [], error: "The CSV does not contain a header row and player results." };
  }

  const headers = rows[0];
  const nameIndex = findHeaderIndex(headers, ["PlayerName", "name", "player name", "player"]);
  const relativeIndex = findHeaderIndex(headers, [
    "+/-",
    "relative_score",
    "relative score",
    "relative score total",
    "relative score round",
  ]);
  const totalIndex = findHeaderIndex(headers, [
    "Total",
    "total_score",
    "total score",
    "total score total",
    "total score round",
  ]);

  if (nameIndex < 0) {
    return { results: [], error: "Could not find a player-name column in this UDisc CSV." };
  }

  const scoreIndex = relativeIndex >= 0 ? relativeIndex : totalIndex;
  if (scoreIndex < 0) {
    return {
      results: [],
      error: "Could not find a UDisc score column. Expected +/- / relative score or Total / total score.",
    };
  }

  const scoreSource = headers[scoreIndex];
  const imported = rows
    .slice(1)
    .map((values, rowIndex) => ({ values, rowIndex }))
    .filter(({ values }) => values[nameIndex]?.trim())
    .filter(({ values }) => normalizeHeader(values[nameIndex]) !== "par")
    .filter(({ values }) => values[scoreIndex]?.trim() !== "")
    .map(({ values, rowIndex }) => ({
      playerId: `udisc-${rowIndex + 1}`,
      name: values[nameIndex].trim(),
      score: Number(values[scoreIndex]),
      scoreSource,
    }))
    .filter((result) => Number.isFinite(result.score));

  if (imported.length === 0) {
    return { results: [], error: "No player rows with numeric scores were found in the CSV." };
  }

  const names = imported.map((result) => result.name.toLowerCase());
  const duplicateName = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicateName) {
    return {
      results: [],
      error: `The CSV contains more than one row for ${duplicateName}. Export or select one league round before assigning tags.`,
    };
  }

  return {
    results: imported.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name)),
    scoreSource,
  };
}

export const LeagueOperationsDemo: React.FC = () => {
  const [players, setPlayers] = useState<DemoPlayer[]>(DEMO_PLAYERS);
  const [targetCardSize, setTargetCardSize] = useState(4);
  const [firstHole, setFirstHole] = useState(1);
  const [cards, setCards] = useState<DemoCard[]>([]);
  const [published, setPublished] = useState(false);
  const [tagResults, setTagResults] = useState<ImportedTagResult[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvScoreSource, setCsvScoreSource] = useState("");
  const [csvError, setCsvError] = useState("");

  const checkedInCount = useMemo(() => players.filter((player) => player.checkedIn).length, [players]);

  const duplicateTags = useMemo(() => {
    const numericTags = tagResults
      .map((result) => result.currentTag)
      .filter((tag): tag is number => Number.isFinite(tag));
    return [...new Set(numericTags.filter((tag, index) => numericTags.indexOf(tag) !== index))];
  }, [tagResults]);

  const tagPoolCount = tagResults.filter((result) => Number.isFinite(result.currentTag)).length;

  const generateCards = () => {
    setCards(buildCards(players, targetCardSize, firstHole));
    setPublished(false);
  };

  const resetCards = () => {
    setPlayers(DEMO_PLAYERS);
    setCards([]);
    setPublished(false);
    setTargetCardSize(4);
    setFirstHole(1);
  };

  const toggleCheckIn = (playerId: string) => {
    setPlayers((current) => current.map((player) => player.id === playerId ? { ...player, checkedIn: !player.checkedIn } : player));
    setCards([]);
    setPublished(false);
  };

  const movePlayer = (playerId: string, destinationCardId: string) => {
    setCards((current) => {
      let movingPlayer: DemoPlayer | undefined;
      const withoutPlayer = current.map((card) => {
        const match = card.players.find((player) => player.id === playerId);
        if (match) movingPlayer = match;
        return { ...card, players: card.players.filter((player) => player.id !== playerId) };
      });
      if (!movingPlayer) return current;
      return withoutPlayer.map((card) => card.id === destinationCardId ? { ...card, players: [...card.players, movingPlayer as DemoPlayer] } : card);
    });
    setPublished(false);
  };

  const updateHole = (cardId: string, hole: number) => {
    setCards((current) => current.map((card) => card.id === cardId ? { ...card, hole: Math.max(1, Math.min(18, hole || 1)) } : card));
    setPublished(false);
  };

  const loadCsvText = (text: string, fileName: string) => {
    const imported = importUDiscCsv(text);
    setCsvError(imported.error ?? "");
    setCsvFileName(imported.error ? "" : fileName);
    setCsvScoreSource(imported.scoreSource ?? "");
    setTagResults(imported.results);
  };

  const handleCsvUpload = async (file?: File) => {
    if (!file) return;
    try {
      loadCsvText(await file.text(), file.name);
    } catch (error) {
      console.error("Could not read UDisc CSV:", error);
      setCsvError("The selected CSV could not be read.");
      setTagResults([]);
    }
  };

  const updateCurrentTag = (playerId: string, value: string) => {
    const parsed = value.trim() === "" ? undefined : Number(value);
    setTagResults((current) => current.map((result) => result.playerId === playerId ? {
      ...result,
      currentTag: Number.isFinite(parsed) ? parsed : undefined,
      newTag: undefined,
    } : result));
  };

  const calculateTags = () => {
    if (duplicateTags.length > 0) return;
    const taggedPlayers = tagResults.filter((result) => Number.isFinite(result.currentTag));
    const availableTags = taggedPlayers.map((result) => result.currentTag as number).sort((a, b) => a - b);
    const finishOrder = [...taggedPlayers].sort((a, b) => a.score - b.score || (a.currentTag as number) - (b.currentTag as number));
    const assigned = new Map<string, number>();
    finishOrder.forEach((result, index) => assigned.set(result.playerId, availableTags[index]));
    setTagResults((current) => current.map((result) => ({ ...result, newTag: assigned.get(result.playerId) })));
  };

  const resetTags = () => {
    setTagResults([]);
    setCsvFileName("");
    setCsvScoreSource("");
    setCsvError("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">Concept demo — no live league data is changed.</p>
            <p className="mt-1 leading-relaxed">These workflows show how repetitive league-night coordination could be handled by deterministic rules with an organizer review step. The club remains authoritative over card-building and bag-tag rules.</p>
          </div>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700"><Users className="h-4 w-4" />League check-in → cards → starting holes</div>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">Automatic Card Builder</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">Demo rule: spread four sample player pools across balanced cards, assign consecutive starting holes, then let the organizer make exceptions before publishing.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={resetCards} className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" />Reset</button>
            <button onClick={generateCards} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-500"><Shuffle className="h-3.5 w-3.5" />Build Cards</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200"><p className="text-2xl font-extrabold text-slate-900">{checkedInCount}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Checked in</p></div>
          <label className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Target card size</span><select value={targetCardSize} onChange={(event) => { setTargetCardSize(Number(event.target.value)); setCards([]); setPublished(false); }} className="mt-1 w-full bg-transparent text-lg font-extrabold text-slate-900 outline-none"><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option></select></label>
          <label className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">First starting hole</span><input type="number" min={1} max={18} value={firstHole} onChange={(event) => { setFirstHole(Math.max(1, Math.min(18, Number(event.target.value) || 1))); setCards([]); setPublished(false); }} className="mt-1 w-full bg-transparent text-lg font-extrabold text-slate-900 outline-none" /></label>
          <div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200"><p className="text-2xl font-extrabold text-slate-900">{cards.length || "—"}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cards generated</p></div>
        </div>

        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-xs font-bold text-slate-800">Demo check-in roster ({checkedInCount}/{players.length})</summary>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{players.map((player) => <label key={player.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-[11px] ${player.checkedIn ? "border-green-200 bg-green-50 text-green-900" : "border-slate-200 bg-white text-slate-400"}`}><input type="checkbox" checked={player.checkedIn} onChange={() => toggleCheckIn(player.id)} /><span className="min-w-0"><span className="block truncate font-bold">{player.name}</span><span className="text-[9px]">Pool {player.pool} · Tag {player.tag}</span></span></label>)}</div>
        </details>

        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><Play className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-2 text-sm font-bold text-slate-700">Close check-in, then build the card list.</p><p className="mt-1 text-xs text-slate-500">With the default 28-player demo, the tool creates seven four-player cards immediately.</p></div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{cards.map((card, cardIndex) => <div key={card.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Card {cardIndex + 1}</p><p className="text-sm font-extrabold text-slate-900">{card.players.length} players</p></div><label className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Starting hole<input type="number" min={1} max={18} value={card.hole} onChange={(event) => updateHole(card.id, Number(event.target.value) || 1)} className="ml-2 w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm font-extrabold text-slate-900" /></label></div><div className="space-y-2">{card.players.map((player) => <div key={player.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-900">{player.name}</p><p className="text-[10px] text-slate-500">Pool {player.pool} · Tag {player.tag}</p></div><select value={card.id} onChange={(event) => movePlayer(player.id, event.target.value)} className="rounded border border-slate-300 bg-white px-1.5 py-1 text-[10px] font-bold text-slate-600">{cards.map((destination, destinationIndex) => <option key={destination.id} value={destination.id}>Card {destinationIndex + 1}</option>)}</select></div>)}</div></div>)}</div>
            <div className="flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-green-900">Organizer review</p><p className="mt-0.5 text-[11px] text-green-800">Move players or change starting holes before publishing.</p></div><button onClick={() => setPublished(true)} className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"><CheckCircle2 className="h-3.5 w-3.5" />Publish Assignment</button></div>
            {published && <div className="rounded-xl border border-green-300 bg-white p-4"><p className="text-sm font-extrabold text-green-800">Ready to call the field</p><div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-700 sm:grid-cols-2">{cards.map((card) => <p key={card.id}><strong>Hole {card.hole}:</strong> {card.players.map((player) => player.name).join(", ")}</p>)}</div></div>}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700"><Tags className="h-4 w-4" />UDisc CSV → physical tag pool → outgoing tags</div>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">Bag Tag Assignment</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">UDisc remains the score system of record. Import the completed round, enter the tag numbers physically turned in, then let deterministic code assign the outgoing tags from the UDisc finish order.</p>
          </div>
          <button onClick={resetTags} className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" />Reset import</button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50 px-4 py-4 text-teal-900 hover:border-teal-300"><FileUp className="h-6 w-6 shrink-0" /><span className="min-w-0"><span className="block text-sm font-extrabold">Import UDisc CSV</span><span className="block text-[11px] text-teal-800">Reads player name plus +/- or total score. Scores are never re-entered in this app.</span></span><input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => handleCsvUpload(event.target.files?.[0])} /></label>
          <button onClick={() => loadCsvText(DEMO_UDISC_CSV, "udisc-demo-round.csv")} className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800">Load demo UDisc CSV</button>
        </div>

        {csvError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">{csvError}</div>}

        {tagResults.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-7 text-center text-xs text-slate-500">Import the completed UDisc CSV. For the leadership demo, use “Load demo UDisc CSV.”</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"><p className="truncate text-sm font-extrabold text-slate-900">{csvFileName}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Imported file</p></div><div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200"><p className="text-2xl font-extrabold text-slate-900">{tagResults.length}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">UDisc players</p></div><div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200"><p className="text-2xl font-extrabold text-slate-900">{tagPoolCount}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tags entered</p></div><div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200"><p className="truncate text-sm font-extrabold text-slate-900">{csvScoreSource}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Score field used</p></div></div>
            {duplicateTags.length > 0 && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">Duplicate tag number{duplicateTags.length > 1 ? "s" : ""}: {duplicateTags.map((tag) => `#${tag}`).join(", ")}. Fix the tag pool before assigning.</div>}
            <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-2">Finish</th><th className="px-3 py-2">UDisc player</th><th className="px-3 py-2">UDisc score</th><th className="px-3 py-2">Tag put in</th><th className="px-3 py-2">Tag out</th></tr></thead><tbody>{tagResults.map((result, index) => <tr key={result.playerId} className="border-t border-slate-100"><td className="px-3 py-2 font-extrabold text-slate-500">{index + 1}</td><td className="px-3 py-2 font-bold text-slate-900">{result.name}</td><td className="px-3 py-2 font-bold text-slate-700">{result.score}</td><td className="px-3 py-2"><input type="number" min={1} value={result.currentTag ?? ""} placeholder="Tag #" onChange={(event) => updateCurrentTag(result.playerId, event.target.value)} className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 font-bold text-slate-900" /></td><td className="px-3 py-2">{result.newTag ? <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 font-extrabold text-slate-800">#{result.newTag}</span> : <span className="text-slate-400">—</span>}</td></tr>)}</tbody></table></div>
            <div className="flex flex-col gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-teal-900">Demo bag-tag rule</p><p className="mt-0.5 text-[11px] text-teal-800">Only players with a tag entered participate in the pool. Lowest UDisc score receives the lowest tag in the pool; ties currently break toward the lower incoming tag. Confirm the club's actual tie rule before implementation.</p></div><button onClick={calculateTags} disabled={tagPoolCount === 0 || duplicateTags.length > 0} className="flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40"><Trophy className="h-3.5 w-3.5" />Assign {tagPoolCount || ""} Tags</button></div>
          </div>
        )}
      </section>
    </div>
  );
};
