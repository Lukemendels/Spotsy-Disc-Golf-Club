import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
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

interface DemoTagResult {
  playerId: string;
  name: string;
  currentTag: number;
  score: number;
  newTag?: number;
}

const DEMO_PLAYERS: DemoPlayer[] = Array.from({ length: 28 }, (_, index) => ({
  id: `demo-player-${index + 1}`,
  name: `Player ${String(index + 1).padStart(2, "0")}`,
  pool: (["A", "B", "C", "D"] as DemoPool[])[index % 4],
  tag: index + 1,
  checkedIn: true,
}));

const DEMO_TAG_RESULTS: DemoTagResult[] = [
  { playerId: "tag-1", name: "Player 04", currentTag: 3, score: -5 },
  { playerId: "tag-2", name: "Player 11", currentTag: 7, score: -3 },
  { playerId: "tag-3", name: "Player 02", currentTag: 1, score: -1 },
  { playerId: "tag-4", name: "Player 19", currentTag: 12, score: 0 },
  { playerId: "tag-5", name: "Player 07", currentTag: 5, score: 1 },
  { playerId: "tag-6", name: "Player 23", currentTag: 16, score: 3 },
  { playerId: "tag-7", name: "Player 14", currentTag: 9, score: 4 },
  { playerId: "tag-8", name: "Player 27", currentTag: 20, score: 6 },
];

function buildCards(
  players: DemoPlayer[],
  targetCardSize: number,
  firstHole: number,
): DemoCard[] {
  const checkedIn = players
    .filter((player) => player.checkedIn)
    .sort((a, b) => a.pool.localeCompare(b.pool) || a.tag - b.tag);

  if (checkedIn.length === 0) return [];

  const cardCount = Math.max(1, Math.ceil(checkedIn.length / targetCardSize));
  const cards: DemoCard[] = Array.from({ length: cardCount }, (_, index) => ({
    id: `card-${index + 1}`,
    hole: firstHole + index,
    players: [],
  }));

  // Deterministic snake distribution keeps the demo pools spread across cards.
  checkedIn.forEach((player, index) => {
    const row = Math.floor(index / cardCount);
    const column = index % cardCount;
    const target = row % 2 === 0 ? column : cardCount - 1 - column;
    cards[target].players.push(player);
  });

  return cards.filter((card) => card.players.length > 0);
}

export const LeagueOperationsDemo: React.FC = () => {
  const [players, setPlayers] = useState<DemoPlayer[]>(DEMO_PLAYERS);
  const [targetCardSize, setTargetCardSize] = useState(4);
  const [firstHole, setFirstHole] = useState(1);
  const [cards, setCards] = useState<DemoCard[]>([]);
  const [published, setPublished] = useState(false);
  const [tagResults, setTagResults] = useState<DemoTagResult[]>(DEMO_TAG_RESULTS);

  const checkedInCount = useMemo(
    () => players.filter((player) => player.checkedIn).length,
    [players],
  );

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
    setPlayers((current) =>
      current.map((player) =>
        player.id === playerId
          ? { ...player, checkedIn: !player.checkedIn }
          : player,
      ),
    );
    setCards([]);
    setPublished(false);
  };

  const movePlayer = (playerId: string, destinationCardId: string) => {
    setCards((current) => {
      let movingPlayer: DemoPlayer | undefined;
      const withoutPlayer = current.map((card) => {
        const match = card.players.find((player) => player.id === playerId);
        if (match) movingPlayer = match;
        return {
          ...card,
          players: card.players.filter((player) => player.id !== playerId),
        };
      });

      if (!movingPlayer) return current;

      return withoutPlayer.map((card) =>
        card.id === destinationCardId
          ? { ...card, players: [...card.players, movingPlayer as DemoPlayer] }
          : card,
      );
    });
    setPublished(false);
  };

  const updateHole = (cardId: string, hole: number) => {
    setCards((current) =>
      current.map((card) => (card.id === cardId ? { ...card, hole } : card)),
    );
    setPublished(false);
  };

  const updateScore = (playerId: string, score: number) => {
    setTagResults((current) =>
      current.map((result) =>
        result.playerId === playerId
          ? { ...result, score, newTag: undefined }
          : result,
      ),
    );
  };

  const calculateTags = () => {
    const availableTags = tagResults
      .map((result) => result.currentTag)
      .sort((a, b) => a - b);

    const finishOrder = [...tagResults].sort(
      (a, b) => a.score - b.score || a.currentTag - b.currentTag,
    );

    const assigned = new Map<string, number>();
    finishOrder.forEach((result, index) => {
      assigned.set(result.playerId, availableTags[index]);
    });

    setTagResults((current) =>
      current.map((result) => ({
        ...result,
        newTag: assigned.get(result.playerId),
      })),
    );
  };

  const resetTags = () => setTagResults(DEMO_TAG_RESULTS);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">Concept demo — no live league data is changed.</p>
            <p className="mt-1 leading-relaxed">
              The workflows below demonstrate how repetitive league-night coordination could be handled by deterministic rules with an organizer review step. Card-building and bag-tag rules are placeholders to confirm with club leadership before implementation.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700">
              <Users className="h-4 w-4" />
              League check-in → cards → starting holes
            </div>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">Automatic Card Builder</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
              Demo rule: spread four sample player pools across balanced cards, assign consecutive starting holes, then let the organizer make exceptions before publishing.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resetCards}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              onClick={generateCards}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-500"
            >
              <Shuffle className="h-3.5 w-3.5" /> Build Cards
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200">
            <p className="text-2xl font-extrabold text-slate-900">{checkedInCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Checked in</p>
          </div>
          <label className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Target card size</span>
            <select
              value={targetCardSize}
              onChange={(event) => {
                setTargetCardSize(Number(event.target.value));
                setCards([]);
                setPublished(false);
              }}
              className="mt-1 w-full bg-transparent text-lg font-extrabold text-slate-900 outline-none"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </label>
          <label className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">First starting hole</span>
            <input
              type="number"
              min={1}
              max={18}
              value={firstHole}
              onChange={(event) => {
                setFirstHole(Math.max(1, Math.min(18, Number(event.target.value) || 1)));
                setCards([]);
                setPublished(false);
              }}
              className="mt-1 w-full bg-transparent text-lg font-extrabold text-slate-900 outline-none"
            />
          </label>
          <div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200">
            <p className="text-2xl font-extrabold text-slate-900">{cards.length || "—"}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cards generated</p>
          </div>
        </div>

        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-xs font-bold text-slate-800">
            Demo check-in roster ({checkedInCount}/{players.length})
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {players.map((player) => (
              <label
                key={player.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-[11px] ${
                  player.checkedIn
                    ? "border-green-200 bg-green-50 text-green-900"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={player.checkedIn}
                  onChange={() => toggleCheckIn(player.id)}
                />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{player.name}</span>
                  <span className="text-[9px]">Pool {player.pool} · Tag {player.tag}</span>
                </span>
              </label>
            ))}
          </div>
        </details>

        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <Play className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-slate-700">Close check-in, then build the card list.</p>
            <p className="mt-1 text-xs text-slate-500">With the default 28-player demo, the tool creates seven four-player cards immediately.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {cards.map((card, cardIndex) => (
                <div key={card.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Card {cardIndex + 1}</p>
                      <p className="text-sm font-extrabold text-slate-900">{card.players.length} players</p>
                    </div>
                    <label className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Starting hole
                      <input
                        type="number"
                        min={1}
                        max={18}
                        value={card.hole}
                        onChange={(event) => updateHole(card.id, Number(event.target.value) || 1)}
                        className="ml-2 w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm font-extrabold text-slate-900"
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    {card.players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900">{player.name}</p>
                          <p className="text-[10px] text-slate-500">Pool {player.pool} · Tag {player.tag}</p>
                        </div>
                        <select
                          value={card.id}
                          onChange={(event) => movePlayer(player.id, event.target.value)}
                          className="rounded border border-slate-300 bg-white px-1.5 py-1 text-[10px] font-bold text-slate-600"
                        >
                          {cards.map((destination, destinationIndex) => (
                            <option key={destination.id} value={destination.id}>
                              Card {destinationIndex + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-green-900">Organizer review</p>
                <p className="mt-0.5 text-[11px] text-green-800">Change a starting hole or move any player between cards before publishing the assignment.</p>
              </div>
              <button
                onClick={() => setPublished(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Publish Assignment
              </button>
            </div>

            {published && (
              <div className="rounded-xl border border-green-300 bg-white p-4">
                <p className="text-sm font-extrabold text-green-800">Ready to call the field</p>
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-700 sm:grid-cols-2">
                  {cards.map((card, index) => (
                    <p key={card.id}>
                      <strong>Hole {card.hole}:</strong> {card.players.map((player) => player.name).join(", ")}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 card-shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Tags className="h-4 w-4" />
              Scores → deterministic tag reassignment
            </div>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">Bag Tag Assignment</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
              Demo rule: participating tags are pooled; lowest score receives the lowest available tag. Ties are broken by the player who entered with the lower tag. The club's actual tag rules would replace this placeholder.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetTags}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              onClick={calculateTags}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-500"
            >
              <Trophy className="h-3.5 w-3.5" /> Assign Tags
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Current tag</th>
                <th className="px-3 py-2">Round score</th>
                <th className="px-3 py-2">New tag</th>
              </tr>
            </thead>
            <tbody>
              {tagResults.map((result) => (
                <tr key={result.playerId} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-bold text-slate-900">{result.name}</td>
                  <td className="px-3 py-2 text-slate-600">#{result.currentTag}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={result.score}
                      onChange={(event) => updateScore(result.playerId, Number(event.target.value) || 0)}
                      className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 font-bold text-slate-900"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {result.newTag ? (
                      <span className={`inline-flex rounded-full px-2 py-1 font-extrabold ${
                        result.newTag < result.currentTag
                          ? "bg-green-100 text-green-800"
                          : result.newTag > result.currentTag
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                      }`}>
                        #{result.newTag}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
