import React, { useEffect, useState } from 'react';
import readXlsxFile, { readSheetNames } from 'read-excel-file';
import { commitResults, DEMO_EVENT_ID, loadMembers, MEMBER_EVENT, parseResultRows, reconcile, ResultRow, SAMPLE_ROWS, saveMembers } from '../lib/memberDemo';

export function ResultsImportDemo() {
  const [state, setState] = useState(loadMembers); const [rows, setRows] = useState<ResultRow[]>([]); const [choices, setChoices] = useState<Record<number, string>>({});
  const [filename, setFilename] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  const [workbook, setWorkbook] = useState<File>(); const [sheets, setSheets] = useState<string[]>([]);
  useEffect(() => { const refresh = () => setState(loadMembers()); window.addEventListener(MEMBER_EVENT, refresh); window.addEventListener('storage', refresh); return () => { window.removeEventListener(MEMBER_EVENT, refresh); window.removeEventListener('storage', refresh); }; }, []);
  const preview = reconcile(state, rows, choices);
  const attendance = state.attendance.filter(a => a.eventId === DEMO_EVENT_ID);
  function load(data: unknown[][], name: string) { try { setRows(parseResultRows(data)); setChoices({}); setFilename(name); setNotice('Preview only. Review exceptions before saving.'); } catch (error) { setRows([]); setNotice((error as Error).message); } }
  async function loadSheet(file: File, sheet: string) { setBusy(true); try { load(await readXlsxFile(file, { sheet }), file.name + ' / ' + sheet); } catch (error) { setRows([]); setNotice('Cannot read this XLSX: ' + (error as Error).message); } finally { setBusy(false); } }
  async function upload(file?: File) {
    setRows([]); setSheets([]); setWorkbook(undefined);
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name) || file.size > 5 * 1024 * 1024) { setNotice('Select an XLSX workbook no larger than 5 MB.'); return; }
    setBusy(true);
    try { const names = await readSheetNames(file); setSheets(names); setWorkbook(file); if (names.length) await loadSheet(file, names[0]); else setNotice('Workbook has no worksheets'); }
    catch (error) { setNotice('Cannot read workbook: ' + (error as Error).message); } finally { setBusy(false); }
  }
  function commit() { try { const current = loadMembers(); const next = commitResults(current, rows, choices, filename); const repeated = next === current; saveMembers(next); setNotice(repeated ? 'Already imported: no duplicate results or batch added.' : 'Reviewed results saved locally. Tag handoff below is a policy preview; no payment was made.'); } catch (error) { setNotice((error as Error).message); } }
  const results = state.results.filter(r => r.eventId === DEMO_EVENT_ID);
  function tagPool(field: 'spotsyTag' | 'staffordTag') {
    const entries = results.flatMap(r => { const a = attendance.find(a => a.memberId === r.memberId); return a?.[field] ? [{ ...r, tag: a[field]! }] : []; });
    const tags = entries.map(e => e.tag).sort((a, b) => a - b);
    if (new Set(tags).size !== tags.length) return <p className="text-rose-700">Duplicate incoming tags. Correct roster before handoff.</p>;
    const ordered = entries.sort((a, b) => a.score - b.score || a.tag - b.tag);
    return <ol className="space-y-2">{ordered.map((r, i) => <li className="rounded-lg bg-white p-3" key={r.memberId}><strong>#{tags[i]} → {state.members.find(m => m.id === r.memberId)?.name}</strong><span className="block text-xs text-slate-500">{r.memberId} • score {r.score} • incoming #{r.tag}</span></li>)}</ol>;
  }
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <div><p className="text-xs font-bold uppercase text-teal-700">After round • organizer review</p><h2 className="text-xl font-extrabold">UDisc XLSX reconciliation</h2><p className="mt-2 text-sm text-slate-600">UDisc remains the score source. Import an official export manually: Name, Username, optional PDGA and a relative or total score. Exact username mappings suggest matches; names and PDGA never silently merge people. No API, OAuth or scraping is simulated.</p></div>
    <div className="flex flex-wrap gap-3"><label className="rounded-lg border border-teal-300 bg-teal-50 p-3 text-sm font-bold">Preview XLSX<input aria-label="Upload UDisc XLSX" type="file" accept=".xlsx" disabled={busy} className="mt-2 block max-w-full text-xs" onChange={e => upload(e.target.files?.[0])} /></label><button className="rounded-lg bg-slate-900 p-3 text-sm font-bold text-white" onClick={() => { setSheets([]); setWorkbook(undefined); load(SAMPLE_ROWS, 'Synthetic sample worksheet'); }}>Load synthetic sample</button></div>
    {sheets.length > 1 && <label className="block text-sm">Worksheet<select className="ml-2 rounded border p-2" onChange={e => workbook && loadSheet(workbook, e.target.value)}>{sheets.map(s => <option key={s}>{s}</option>)}</select></label>}
    {busy && <p role="status">Reading workbook…</p>}
    {rows.length > 0 && <><p className="text-sm font-bold">Preview: {filename} • {rows.length} rows</p><div className="space-y-3">{preview.resolved.map((r, i) => <div key={i} className={'rounded-xl border p-3 ' + (r.issue ? 'border-amber-300 bg-amber-50' : 'border-green-200 bg-green-50')}><p className="text-sm font-bold">{r.row.name} • {r.row.username || 'no username'} • score {r.row.score} ({r.row.scoreSource})</p><p className="text-xs">PDGA {r.row.pdga || 'not supplied'} • {r.issue || (r.memberId === 'exclude' ? 'Explicitly excluded from this event' : 'Matched to ' + r.memberId)}</p><label className="mt-2 block text-xs">Organizer review<select aria-label={'Match row ' + (i + 1)} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm" value={r.memberId} onChange={e => setChoices({ ...choices, [i]: e.target.value })}><option value="">Pending match</option>{attendance.map(a => <option key={a.id} value={a.memberId}>{state.members.find(m => m.id === a.memberId)?.name} • {a.memberId}</option>)}<option value="exclude">Exclude — not an attendee / duplicate export</option></select></label>
      {choices[i] && choices[i] !== 'exclude' && !r.issue && r.row.username && !state.mappings.some(m => m.username === r.row.username) && <button className="mt-2 text-xs font-bold underline" onClick={() => { const s = loadMembers(); saveMembers({ ...s, mappings: [...s.mappings, { username: r.row.username, memberId: choices[i], reviewedAt: new Date().toISOString() }] }); setNotice('Reviewed handle saved as an alias for the stable member ID.'); }}>Save reviewed changed-handle mapping</button>}
    </div>)}</div>
    {!!preview.missing.length && <p className="rounded-lg bg-amber-50 p-3 text-sm">Missing attendees: {preview.missing.map(a => state.members.find(m => m.id === a.memberId)?.name + ' (' + a.memberId + ')').join(', ')}. Import their result or correct attendance; settlement stays blocked.</p>}
    <button disabled={!preview.ready || busy} onClick={commit} className="rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">Save reviewed import</button></>}
    {notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
    <p className="text-xs text-slate-500">{state.imports.length} local import batch(es) • {results.length} event results. Identical re-imports do nothing; corrected exports replace this event's results after review.</p>
    {!!results.length && <div className="space-y-4 rounded-xl bg-slate-50 p-4"><h3 className="font-extrabold">Bag-tag handoff preview</h3><p className="text-xs text-slate-600">Existing prototype policy: lower score gets lower incoming tag, independently for each pool; equal scores use incoming tag. Leadership must approve the policy before real use. Results use one selected score column consistently.</p><div className="grid gap-4 sm:grid-cols-2"><div><h4 className="mb-2 font-bold">Spotsy</h4>{tagPool('spotsyTag')}</div><div><h4 className="mb-2 font-bold">Stafford</h4>{tagPool('staffordTag')}</div></div><h3 className="font-bold">Ace review • no money moves</h3>{results.filter(r => r.aceHoles.length).map(r => { const a = attendance.find(a => a.memberId === r.memberId); const paid = state.payments.find(p => p.attendanceId === a?.id)?.aceConfirmed; return <p className="text-sm" key={r.memberId}>{r.name} ({r.memberId}): {r.aceHoles.join(', ')} • {paid ? 'staff confirmed demo entry' : 'payment not confirmed'}</p>; })}<p className="text-xs">If hole-by-hole scores are absent, ace detection is unavailable. No payout or carry-forward is asserted; treasurer confirms actual policy and payment.</p></div>}
  </section>;
}
