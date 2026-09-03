export interface LeagueCheckIn {
  id: string;
  name: string;
  division: string;
  spotsyTag?: number;
  staffordTag?: number;
  acePotPaid: boolean;
  checkedInAt: string;
}

export const LEAGUE_CHECKIN_STORAGE_KEY = "spotsy-league-checkins-demo-v3";
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

interface DemoRosterPlayer {
  name: string;
  division: string;
  spotsyTag: number;
  staffordTag?: number;
}

// Names and divisions are the real Aug. 27, 2026 Spotsy Summer League field so the
// demo roster resolves directly against the bundled UDisc export. Tag numbers and
// ace-pot choices are intentionally demo values because those fields are not in UDisc.
const DEMO_CHECKIN_ROSTER: DemoRosterPlayer[] = [
  { name: "Emmanuele Lizama", division: "MPO", spotsyTag: 5 },
  { name: "Mark Gibson", division: "MPO", spotsyTag: 4, staffordTag: 102 },
  { name: "Brandon Kilby", division: "MPO", spotsyTag: 2 },
  { name: "Gerald Mudd", division: "MPO", spotsyTag: 3 },
  { name: "Bob Cannon", division: "MPO", spotsyTag: 1, staffordTag: 101 },
  { name: "Ben Vaca", division: "MPO", spotsyTag: 6 },
  { name: "Kylie Stark", division: "MA1", spotsyTag: 7 },
  { name: "Chris Kowalski", division: "MA1", spotsyTag: 8, staffordTag: 103 },
  { name: "Justin Laughlin", division: "MA1", spotsyTag: 9 },
  { name: "John wallingford", division: "MA2", spotsyTag: 10 },
  { name: "Jeff Perkins", division: "MA2", spotsyTag: 11, staffordTag: 104 },
  { name: "Abby kowalski", division: "MA2", spotsyTag: 12 },
  { name: "Corey Wiseman", division: "MA2", spotsyTag: 13 },
  { name: "Allan Stephens", division: "MA2", spotsyTag: 14 },
  { name: "Tanner Rains", division: "MA2", spotsyTag: 15, staffordTag: 106 },
  { name: "Giovanni Lizama", division: "MA2", spotsyTag: 16 },
  { name: "Cody Beard", division: "MA3", spotsyTag: 17 },
  { name: "Luke Mendelsohn", division: "MA3", spotsyTag: 18, staffordTag: 105 },
  { name: "David Chatelain", division: "MA3", spotsyTag: 19 },
  { name: "Julian Shapiro", division: "MA3", spotsyTag: 20 },
  { name: "Munseok Kim", division: "MA3", spotsyTag: 21 },
  { name: "James Gibson", division: "MA3", spotsyTag: 22 },
  { name: "William Alex Gibson", division: "MA3", spotsyTag: 23 },
  { name: "Nathon Coe", division: "MA3", spotsyTag: 24 },
  { name: "Gerald Williams", division: "MA4", spotsyTag: 25, staffordTag: 107 },
  { name: "Cade Beard", division: "MA4", spotsyTag: 26, staffordTag: 108 },
  { name: "David Kerns", division: "MA4", spotsyTag: 27 },
  { name: "Zachary Knerr", division: "MA4", spotsyTag: 28, staffordTag: 109 },
  { name: "Corey Axelson", division: "MA4", spotsyTag: 29 },
  { name: "Melissa Gibson", division: "MA4", spotsyTag: 30, staffordTag: 110 },
  { name: "Bobby Zinn", division: "MA4", spotsyTag: 31 },
];

export const DEMO_CHECKIN_COUNT = DEMO_CHECKIN_ROSTER.length;

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

export function buildDemoCheckIns(): LeagueCheckIn[] {
  const firstCheckIn = Date.parse("2026-08-27T17:18:00-04:00");
  return DEMO_CHECKIN_ROSTER.map((player, index) => ({
    id: `demo-checkin-${index + 1}`,
    ...player,
    // Emmanuele's real round contains the ace, so keep him entered to demonstrate payout.
    acePotPaid: index === 0 || index % 5 !== 4,
    checkedInAt: new Date(firstCheckIn + index * 52_000).toISOString(),
  }));
}
