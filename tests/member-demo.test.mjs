import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initialState, checkIn, saveProfile, memberForIdentity, approveClaim, parseResultRows, reconcile, commitResults, SAMPLE_ROWS } from '../src/lib/memberDemo.ts';
import { fastThreeCardSizes, cardSizes, shotgunHoleOrder } from '../src/lib/leagueCards.ts';
const fields = { division: 'MA3', aceRequested: true, spotsyTag: 4 };
function field() { let s = initialState(); for (const m of s.members) s = checkIn(s, m.id, fields); return s; }
const sample = () => parseResultRows(SAMPLE_ROWS.slice(0, 4));
test('same display names stay separate and returning check-in retains stable attendance ID', () => {
  let s = initialState(); s = checkIn(s, 'sample-alex-a', fields); s = checkIn(s, 'sample-alex-b', fields);
  const first = s.attendance[0]; s = checkIn(s, 'sample-alex-a', { ...fields, division: 'MA2' });
  assert.equal(s.attendance.length, 2); assert.equal(s.attendance.find(a => a.memberId === first.memberId).id, first.id);
  assert.equal(s.payments.length, 0, 'member self-report never confirms payment');
  assert.throws(() => checkIn({ ...s, locked: true }, 'sample-alex-a', fields), /closed/);
});
test('profile identity is separate; blank UDisc and PDGA are valid; username collision is blocked', () => {
  let s = saveProfile(initialState(), 'new-demo-account', 'Sample Guest', '', '');
  const m = memberForIdentity(s, 'new-demo-account'); assert.ok(m); assert.notEqual(m.id, 'new-demo-account');
  s = saveProfile(s, 'new-demo-account', 'Renamed Sample', 'sample.new', '123456');
  assert.equal(memberForIdentity(s, 'new-demo-account').id, m.id);
  s = saveProfile(s, 'new-demo-account', 'Renamed Sample', 'sample.changed', '123456');
  assert.equal(s.mappings.find(mapping => mapping.username === 'sample.new').active, false);
  assert.equal(s.mappings.find(mapping => mapping.username === 'sample.changed').active, true);
  assert.throws(() => saveProfile(s, 'another-account', 'Sample', 'sample.new', ''), /already mapped/);
  assert.throws(() => saveProfile(s, 'another-account', 'Sample', '', 'NaN'), /digits/);
});
test('guest claim requires explicit review; no name merge; conflict with attending account is blocked', () => {
  let s = initialState(); s.members.push({ id: 'guest-id', name: 'Alex River', guest: true, profileComplete: false });
  s = checkIn(s, 'guest-id', fields); s.claims.push({ id: 'claim', authId: 'new-account', memberId: 'guest-id', status: 'pending' });
  assert.equal(memberForIdentity(s, 'new-account'), undefined);
  const next = approveClaim(s, 'claim'); assert.equal(memberForIdentity(next, 'new-account').id, 'guest-id'); assert.equal(next.members.length, s.members.length); assert.equal(next.attendance[0].memberId, 'guest-id');
  s = checkIn(s, 'sample-alex-a', fields); s.claims.push({ id: 'conflict', authId: 'demo-user-uid-202', memberId: 'guest-id', status: 'pending' });
  assert.throws(() => approveClaim(s, 'conflict'), /attendance/);
});
test('exact username identifies two Alex Rivers and PDGA corroborates without matching by name', () => {
  const s = field(); const rows = sample(); const p = reconcile(s, rows); assert.equal(p.ready, true);
  assert.deepEqual(p.resolved.map(r => r.memberId), ['sample-alex-a', 'sample-alex-b', 'sample-morgan']);
  rows[0].username = 'sample.changed'; assert.equal(reconcile(s, rows).ready, false);
  assert.equal(reconcile(s, rows, { 0: 'sample-alex-a' }).ready, true);
  rows[0].pdga = '99999'; assert.match(reconcile(s, rows, { 0: 'sample-alex-a' }).resolved[0].issue, /PDGA conflict/);
});
test('duplicate usernames, guests, invalid scores and missing attendees block settlement', () => {
  const s = field(); let rows = sample(); rows.push({ ...rows[0] }); assert.equal(reconcile(s, rows).ready, false);
  assert.equal(reconcile(s, rows, { 3: 'exclude' }).ready, true, 'explicit duplicate exclusion resolves exception');
  rows = sample(); rows[1].username = ''; assert.equal(reconcile(s, rows).ready, false);
  assert.equal(reconcile(s, rows, { 1: 'sample-alex-b' }).ready, true);
  assert.equal(reconcile(s, rows.slice(0, 2)).missing.length, 2);
  const invalid = parseResultRows([SAMPLE_ROWS[0], ['sample.alex.a', 'Alex River', '', '', 3, 3]]); assert.match(invalid[0].error, /Missing/);
  assert.throws(() => parseResultRows([['Name', 'Total'], ['Alex', 54]]), /Username/);
});
test('reviewed import is idempotent independent of row order, corrected results replace, previous export can be restored', () => {
  const rows = sample(); let s = commitResults(field(), rows, {}, 'sample.xlsx'); const id = s.results[0].memberId;
  assert.equal(s.imports.length, 1); const repeated = commitResults(s, [...rows].reverse(), {}, 'renamed.xlsx'); assert.equal(repeated, s);
  const corrected = rows.map(r => ({ ...r, score: r.score + 1 })); s = commitResults(s, corrected, {}, 'corrected.xlsx'); assert.equal(s.results.length, 3); assert.equal(s.imports.length, 2); assert.equal(s.results[0].memberId, id);
  s = commitResults(s, rows, {}, 'sample.xlsx'); assert.equal(s.results[0].score, -3); assert.equal(s.imports.length, 2);
  assert.throws(() => commitResults(field(), rows.slice(0, 1), {}, 'partial.xlsx'), /Resolve/);
});
test('card policy conserves players, never creates five, spreads unique starting holes', () => {
  assert.deepEqual(fastThreeCardSizes(8), [4, 4]); assert.deepEqual(fastThreeCardSizes(11), [3, 4, 4]); assert.deepEqual(fastThreeCardSizes(5), [3, 2]);
  for (let count = 0; count <= 72; count++) for (const target of [3, 4]) { const sizes = cardSizes(count, target); assert.equal(sizes.reduce((a, b) => a + b, 0), count); assert.ok(sizes.every(n => n >= 1 && n <= 4)); }
  for (let start = 1; start <= 18; start++) { const holes = shotgunHoleOrder(start); assert.equal(new Set(holes).size, 18); assert.equal(holes[0], start); }
});
test('demo entry graph has no Firebase SDK imports or initializeApp', () => {
  const walk = path => fs.readdirSync(path, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path + '/' + e.name) : [path + '/' + e.name]);
  for (const path of walk('src').filter(p => /\.tsx?$/.test(p))) { const source = fs.readFileSync(path, 'utf8'); assert.doesNotMatch(source, /from\s+['"]firebase\//, path); assert.doesNotMatch(source, /initializeApp\(/, path); }
});
