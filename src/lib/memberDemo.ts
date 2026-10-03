export const DEMO_EVENT_ID = 'sample-thursday';
export const MEMBER_STORAGE_KEY = 'spotsy-members-demo-v1';
export const MEMBER_EVENT = 'spotsy-members-demo-updated';
export interface Member { id: string; name: string; pdga?: string; profileComplete: boolean; guest: boolean }
export interface Identity { authId: string; memberId: string }
export interface UDiscMapping { username: string; memberId: string; reviewedAt: string; active?: boolean }
export interface Attendance { id: string; eventId: string; memberId: string; division: string; spotsyTag?: number; staffordTag?: number; aceRequested: boolean; checkedInAt: string }
export interface Payment { attendanceId: string; aceConfirmed: boolean; confirmedBy: string }
export interface Claim { id: string; authId: string; memberId: string; status: 'pending' | 'approved' | 'rejected' }
export interface ResultRow { username: string; name: string; pdga: string; score: number; scoreSource: string; aceHoles: string[]; error?: string }
export interface SavedResult extends ResultRow { eventId: string; memberId: string; importId: string }
export interface DemoState { members: Member[]; identities: Identity[]; mappings: UDiscMapping[]; attendance: Attendance[]; payments: Payment[]; claims: Claim[]; results: SavedResult[]; imports: Array<{ id: string; eventId: string; filename: string; importedAt: string }>; locked: boolean }
export function initialState(): DemoState {
  return { members: [
    { id: 'sample-alex-a', name: 'Alex River', pdga: '900001', guest: false, profileComplete: true },
    { id: 'sample-alex-b', name: 'Alex River', guest: false, profileComplete: true },
    { id: 'sample-morgan', name: 'Morgan Meadow', guest: false, profileComplete: true },
  ], identities: [{ authId: 'demo-user-uid-202', memberId: 'sample-alex-a' }],
  mappings: [{ username: 'sample.alex.a', memberId: 'sample-alex-a', reviewedAt: 'synthetic fixture' }, { username: 'sample.alex.b', memberId: 'sample-alex-b', reviewedAt: 'synthetic fixture' }, { username: 'sample.morgan', memberId: 'sample-morgan', reviewedAt: 'synthetic fixture' }],
  attendance: [], payments: [], claims: [], results: [], imports: [], locked: false };
}
export function loadMembers(): DemoState { try { return JSON.parse(localStorage.getItem(MEMBER_STORAGE_KEY) || 'null') || initialState(); } catch { return initialState(); } }
export function saveMembers(state: DemoState) { localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(state)); window.dispatchEvent(new CustomEvent(MEMBER_EVENT)); }
export function memberForIdentity(state: DemoState, authId: string) { return state.members.find(m => m.id === state.identities.find(i => i.authId === authId)?.memberId); }
export function checkIn(state: DemoState, memberId: string, fields: Omit<Attendance, 'id' | 'eventId' | 'memberId' | 'checkedInAt'>): DemoState {
  if (state.locked) throw new Error('Check-in is closed. Ask the organizer to reopen it.');
  if (!state.members.some(m => m.id === memberId)) throw new Error('Select a valid member');
  const existing = state.attendance.find(a => a.eventId === DEMO_EVENT_ID && a.memberId === memberId);
  const record = { ...fields, id: existing?.id || crypto.randomUUID(), eventId: DEMO_EVENT_ID, memberId, checkedInAt: existing?.checkedInAt || new Date().toISOString() };
  return { ...state, attendance: [...state.attendance.filter(a => a.id !== record.id), record], results: [], imports: [] };
}
export function saveProfile(state: DemoState, authId: string, name: string, username: string, pdga: string): DemoState {
  if (!name.trim()) throw new Error('Enter a display name');
  if (pdga && !/^\d+$/.test(pdga)) throw new Error('PDGA number must contain digits');
  const existing = memberForIdentity(state, authId);
  const id = existing?.id || crypto.randomUUID();
  const handle = username.trim();
  if (handle && state.mappings.some(m => m.username === handle && m.memberId !== id)) throw new Error('That UDisc username is already mapped. Request organizer review.');
  const member: Member = { id, name: name.trim(), pdga: pdga || undefined, guest: false, profileComplete: true };
  return { ...state, members: [...state.members.filter(m => m.id !== id), member], identities: [...state.identities.filter(i => i.authId !== authId), { authId, memberId: id }],
    mappings: [...state.mappings.filter(m => m.username !== handle || m.memberId !== id).map(m => m.memberId === id ? { ...m, active: false } : m), ...(handle ? [{ username: handle, memberId: id, reviewedAt: 'demo profile entry', active: true }] : [])] };
}
export function approveClaim(state: DemoState, claimId: string): DemoState {
  const claim = state.claims.find(c => c.id === claimId && c.status === 'pending');
  if (!claim) throw new Error('No pending claim');
  if (state.identities.some(i => i.memberId === claim.memberId && i.authId !== claim.authId)) throw new Error('Member already linked to another demo identity');
  const previous = memberForIdentity(state, claim.authId);
  if (previous && state.attendance.some(a => a.memberId === previous.id)) throw new Error('Existing account has attendance; review the conflict before linking.');
  return { ...state, identities: [...state.identities.filter(i => i.authId !== claim.authId), { authId: claim.authId, memberId: claim.memberId }],
    members: state.members.map(m => m.id === claim.memberId ? { ...m, guest: false } : m),
    claims: state.claims.map(c => c.id === claimId ? { ...c, status: 'approved' } : c) };
}
const header = (value: unknown) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function parseResultRows(rows: unknown[][]): ResultRow[] {
  if (rows.length < 2) throw new Error('Workbook needs headers and at least one result');
  const headers = rows[0].map(header);
  const index = (...names: string[]) => names.map(n => headers.indexOf(n)).find(i => i >= 0) ?? -1;
  const name = index('name', 'playername'); const username = index('username'); const pdga = index('pdga', 'pdganumber');
  const score = index('roundrelativescore', 'eventrelativescore', 'relativescoreround', 'relativescoretotal', 'relativescore', 'roundtotalscore', 'eventtotalscore', 'totalscoreround', 'totalscoretotal', 'totalscore', 'total');
  if (name < 0 || username < 0 || score < 0) throw new Error('Expected Name, Username and a relative or total score column. PDGA is optional.');
  const parsed = rows.slice(1).filter(r => r.some(v => v !== null && v !== '')).map(r => {
    const rawScore = r[score];
    return { name: String(r[name] ?? '').trim(), username: String(r[username] ?? '').trim(), pdga: pdga < 0 ? '' : String(r[pdga] ?? '').trim(),
      score: Number(rawScore), scoreSource: String(rows[0][score]), aceHoles: headers.flatMap((h, i) => /^hole\d+$/.test(h) && Number(r[i]) === 1 ? [h] : []),
      error: rawScore === null || rawScore === undefined || String(rawScore).trim() === '' || !Number.isFinite(Number(rawScore)) ? 'Missing or nonnumeric score' : undefined };
  });
  if (!parsed.length) throw new Error('No player rows found');
  return parsed;
}
export function reconcile(state: DemoState, rows: ResultRow[], choices: Record<number, string> = {}) {
  const duplicate = new Set(rows.filter((r, i) => choices[i] !== 'exclude' && r.username && rows.some((other, j) => choices[j] !== 'exclude' && j !== i && other.username === r.username)).map(r => r.username));
  const resolved = rows.map((row, i) => {
    const exact = row.username ? state.mappings.filter(m => m.username === row.username) : [];
    const memberId = choices[i] || (exact.length === 1 ? exact[0].memberId : '');
    const member = state.members.find(m => m.id === memberId);
    const attendance = state.attendance.find(a => a.memberId === memberId && a.eventId === DEMO_EVENT_ID);
    let issue = memberId === 'exclude' ? '' : row.error || (duplicate.has(row.username) ? 'Duplicate username in workbook' : '');
    if (!issue && memberId !== 'exclude') {
      if (!member) issue = row.username ? 'Unknown or changed handle — review' : 'Guest / missing username — review';
      else if (!attendance) issue = 'Not checked in for this event';
      else if (row.pdga && member.pdga && row.pdga !== member.pdga) issue = 'PDGA conflict — review profile';
    }
    return { row, memberId, issue };
  });
  const ids = resolved.filter(r => r.memberId && r.memberId !== 'exclude').map(r => r.memberId);
  resolved.forEach(r => { if (r.memberId !== 'exclude' && ids.filter(id => id === r.memberId).length > 1) r.issue = 'Two rows mapped to one member'; });
  const missing = state.attendance.filter(a => a.eventId === DEMO_EVENT_ID && !ids.includes(a.memberId));
  return { resolved, missing, ready: resolved.every(r => !r.issue) && !missing.length && ids.length > 0 };
}
export function commitResults(state: DemoState, rows: ResultRow[], choices: Record<number, string>, filename: string): DemoState {
  const preview = reconcile(state, rows, choices);
  if (!preview.ready) throw new Error('Resolve all exceptions and missing attendees before committing');
  const canonical = preview.resolved.filter(r => r.memberId !== 'exclude').map(r => [r.memberId, r.row]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const id = JSON.stringify(canonical); // full canonical fingerprint, no collision-prone row IDs
  if (state.results.length && state.results.every(result => result.eventId !== DEMO_EVENT_ID || result.importId === id)) return state;
  return { ...state, results: preview.resolved.filter(r => r.memberId !== 'exclude').map(r => ({ ...r.row, memberId: r.memberId, eventId: DEMO_EVENT_ID, importId: id })),
    imports: state.imports.some(batch => batch.id === id && batch.eventId === DEMO_EVENT_ID) ? state.imports : [...state.imports, { id, eventId: DEMO_EVENT_ID, filename, importedAt: new Date().toISOString() }] };
}
export const SAMPLE_ROWS = [
  ['Username', 'Name', 'PDGA', 'round_relative_score', 'hole_1', 'hole_2'],
  ['sample.alex.a', 'Alex River', '900001', -3, 3, 1],
  ['sample.alex.b', 'Alex River', '', 2, 3, 4],
  ['sample.morgan', 'Morgan Meadow', '', 0, 3, 3],
  ...Array.from({ length: 8 }, (_, i) => [`sample.player.${i + 4}`, `Sample Player ${i + 4}`, '', i + 1, 3, 3]),
];
