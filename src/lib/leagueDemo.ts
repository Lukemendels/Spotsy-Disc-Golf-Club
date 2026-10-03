import type { Attendance } from './memberDemo.ts';
import { DEMO_EVENT_ID, loadMembers, MEMBER_EVENT, replaceAttendance, saveMembers } from './memberDemo.ts';
export interface LeagueCheckIn { id: string; name: string; division: string; spotsyTag?: number; staffordTag?: number; acePotPaid: boolean; checkedInAt: string }
export const LEAGUE_CHECKIN_STORAGE_KEY = 'spotsy-attendance-demo-v1';
export const LEAGUE_CHECKIN_EVENT_KEY = MEMBER_EVENT;
export const DEMO_DIVISIONS = ['MA4', 'MA3', 'MA2', 'MA1', 'MPO', 'FA4', 'FA3', 'FA2', 'FA1', 'FPO'];
export const DEMO_CHECKIN_COUNT = 11;
export const normalizePlayerName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
export function loadLeagueCheckIns(): LeagueCheckIn[] {
  const s = loadMembers();
  return s.attendance.filter(a => a.eventId === DEMO_EVENT_ID).map(a => ({ id: a.memberId, name: s.members.find(m => m.id === a.memberId)?.name || 'Unknown member', division: a.division, spotsyTag: a.spotsyTag, staffordTag: a.staffordTag, acePotPaid: !!s.payments.find(p => p.attendanceId === a.id)?.aceConfirmed, checkedInAt: a.checkedInAt }));
}
export function saveLeagueCheckIns(players: LeagueCheckIn[]) {
  const s = loadMembers();
  const attendance: Attendance[] = players.map(p => ({ id: s.attendance.find(a => a.memberId === p.id && a.eventId === DEMO_EVENT_ID)?.id || crypto.randomUUID(), memberId: p.id, eventId: DEMO_EVENT_ID, division: p.division, spotsyTag: p.spotsyTag, staffordTag: p.staffordTag, aceRequested: s.attendance.find(a => a.memberId === p.id)?.aceRequested ?? true, checkedInAt: p.checkedInAt }));
  saveMembers({ ...replaceAttendance(s, attendance), payments: attendance.map(a => ({ attendanceId: a.id, aceConfirmed: players.find(p => p.id === a.memberId)!.acePotPaid, confirmedBy: 'demo-organizer' })) });
}
export function buildDemoCheckIns(): LeagueCheckIn[] {
  const s = loadMembers();
  const extra = Array.from({ length: 8 }, (_, i) => ({ id: `sample-player-${i + 4}`, name: `Sample Player ${i + 4}`, guest: false, profileComplete: true }));
  const members = [...s.members.filter(m => !extra.some(e => e.id === m.id)), ...extra];
  const fixture = ['sample-alex-a', 'sample-alex-b', 'sample-morgan', ...extra.map(m => m.id)];
  // Explicit scenario reset; ordinary roster/payment edits never discard imported evidence.
  saveMembers({ ...s, members, mappings: [...s.mappings.filter(m => !extra.some(e => e.id === m.memberId)), ...extra.map(m => ({ memberId: m.id, username: `sample.player.${m.id.split('-').pop()}`, reviewedAt: 'synthetic fixture' }))], locked: false, results: [], imports: [], resultsReviewRequired: false });
  return fixture.map((id, i) => ({ id, name: members.find(m => m.id === id)!.name, division: DEMO_DIVISIONS[i % 4], spotsyTag: i + 1, staffordTag: i % 2 ? 100 + i : undefined, acePotPaid: i % 3 !== 0, checkedInAt: new Date().toISOString() }));
}
