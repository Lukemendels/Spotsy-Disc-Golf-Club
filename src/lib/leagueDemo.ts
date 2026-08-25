export interface LeagueCheckIn {
  id: string;
  name: string;
  division: string;
  spotsyTag?: number;
  staffordTag?: number;
  acePotPaid: boolean;
  checkedInAt: string;
}

export const LEAGUE_CHECKIN_STORAGE_KEY = "spotsy-league-checkins-demo-v2";
export const LEAGUE_CHECKIN_EVENT_KEY = "spotsy-league-checkins-updated";

// Weekly league uses the standard open amateur-to-pro ladders.
export const DEMO_DIVISIONS = [
  "MA4",
  "MA3",
  "MA2",
  "MA1",
  "MPO",
  "FA4",
  "FA3",
  "FA2",
  "FA1",
  "FPO",
];

export function normalizePlayerName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function loadLeagueCheckIns(): LeagueCheckIn[] {
  try {
    const raw = localStorage.getItem(LEAGUE_CHECKIN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLeagueCheckIns(checkIns: LeagueCheckIn[]): void {
  localStorage.setItem(LEAGUE_CHECKIN_STORAGE_KEY, JSON.stringify(checkIns));
  window.dispatchEvent(new CustomEvent(LEAGUE_CHECKIN_EVENT_KEY));
}

export function upsertLeagueCheckIn(checkIn: LeagueCheckIn): LeagueCheckIn[] {
  const current = loadLeagueCheckIns();
  const normalized = normalizePlayerName(checkIn.name);
  const existingIndex = current.findIndex((item) => normalizePlayerName(item.name) === normalized);
  const next = existingIndex >= 0
    ? current.map((item, index) => index === existingIndex ? { ...item, ...checkIn, id: item.id } : item)
    : [...current, checkIn];
  saveLeagueCheckIns(next);
  return next;
}

export function buildDemoCheckIns(count = 27): LeagueCheckIn[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `demo-checkin-${index + 1}`,
    name: `Player ${String(index + 1).padStart(2, "0")}`,
    division: DEMO_DIVISIONS[index % DEMO_DIVISIONS.length],
    spotsyTag: index + 1,
    staffordTag: index % 3 === 0 ? 101 + index : undefined,
    acePotPaid: index % 4 !== 0,
    checkedInAt: new Date(Date.now() - (count - index) * 60_000).toISOString(),
  }));
}
