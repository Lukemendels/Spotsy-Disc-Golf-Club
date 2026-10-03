import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DEMO_DIVISIONS, loadLeagueCheckIns } from '../lib/leagueDemo';
import { approveClaim, checkIn, checkInFormValues, DEMO_EVENT_ID, loadMembers, MEMBER_EVENT, memberForIdentity, saveMembers, saveProfile } from '../lib/memberDemo';

export function MemberLeagueDemo({ staff = false }: { staff?: boolean }) {
  const { userProfile, signInDemoUser, signOut } = useAuth();
  const [state, setState] = useState(loadMembers);
  const [name, setName] = useState(''); const [username, setUsername] = useState(''); const [pdga, setPdga] = useState('');
  const [division, setDivision] = useState('MA4'); const [tag, setTag] = useState(''); const [stafford, setStafford] = useState(''); const [ace, setAce] = useState(false);
  const [selection, setSelection] = useState(''); const [notice, setNotice] = useState('');
  const member = userProfile ? memberForIdentity(state, userProfile.uid) : undefined;
  useEffect(() => { const refresh = () => setState(loadMembers()); window.addEventListener(MEMBER_EVENT, refresh); window.addEventListener('storage', refresh); return () => { window.removeEventListener(MEMBER_EVENT, refresh); window.removeEventListener('storage', refresh); }; }, []);
  useEffect(() => { setName(member?.name || ''); setPdga(member?.pdga || ''); setUsername(state.mappings.filter(m => m.memberId === member?.id && m.active !== false).at(-1)?.username || ''); }, [member?.id]);
  const selectedId = staff ? selection : member?.id;
  const selectedAttendance = state.attendance.find(a => a.memberId === selectedId && a.eventId === DEMO_EVENT_ID);
  useEffect(() => {
    const values = checkInFormValues(state, selectedId);
    setDivision(values.division); setTag(values.tag); setStafford(values.stafford); setAce(values.ace);
  }, [selectedId, selectedAttendance?.division, selectedAttendance?.spotsyTag, selectedAttendance?.staffordTag, selectedAttendance?.aceRequested]);
  function selectMember(id: string) {
    const values = checkInFormValues(loadMembers(), id);
    setSelection(id); setDivision(values.division); setTag(values.tag); setStafford(values.stafford); setAce(values.ace); setNotice('');
  }
  function act(fn: () => void) { try { fn(); } catch (error) { setNotice((error as Error).message); } }
  function submit(memberId: string) {
    const parseTag = (s: string) => { if (!s) return undefined; if (!/^\d+$/.test(s) || Number(s) < 1) throw new Error('Tags must be positive whole numbers'); return Number(s); };
    saveMembers(checkIn(loadMembers(), memberId, { division, spotsyTag: parseTag(tag), staffordTag: parseTag(stafford), aceRequested: ace }));
    loadLeagueCheckIns(); setNotice('Checked in on this browser. Ace-pot request awaits staff confirmation.');
  }
  if (staff && userProfile?.role !== "club_admin") return null;
  const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900';
  const buttonClass = 'rounded-lg bg-green-700 px-4 py-3 text-sm font-bold text-white';
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-800">
    <div><p className="text-xs font-bold uppercase text-green-700">{staff ? 'Organizer • table assistance' : 'Member • sample event'}</p><h2 className="text-xl font-extrabold">{staff ? 'Walk-ups and account review' : 'Your profile, then quick check-in'}</h2><p className="mt-2 text-sm text-slate-600">Synthetic demo • this browser only. No real accounts, payments or UDisc connection.</p></div>
    {!staff && <div className="flex flex-wrap gap-2"><button className={buttonClass} onClick={() => signInDemoUser('user')}>Return as Alex A</button><button className={buttonClass} onClick={() => signInDemoUser('user', 'New Sample Member')}>New member setup</button><button className={buttonClass} onClick={() => signInDemoUser('club_admin')}>Organizer demo</button><button className="p-3 text-sm underline" onClick={() => signOut()}>Sign out</button></div>}
    {!staff && userProfile?.role !== 'club_admin' && userProfile && <>
      <p className="text-sm">Demo identity: {userProfile.displayName} • member ID: <code>{member?.id || 'profile not created'}</code></p>
      <details open={!member?.profileComplete} className="rounded-lg bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-bold text-green-800">{member?.profileComplete ? "Profile saved — edit details" : "Set up your member profile once"}</summary>
      <form className="mt-3 grid gap-3 sm:grid-cols-3" onSubmit={e => { e.preventDefault(); act(() => { saveMembers(saveProfile(loadMembers(), userProfile.uid, name, username, pdga)); setNotice('Profile saved. Future visits reuse this member ID.'); }); }}>
        <label className="text-sm">Display name<input required value={name} onChange={e => setName(e.target.value)} className={fieldClass} /></label>
        <label className="text-sm">UDisc username (optional)<input value={username} onChange={e => setUsername(e.target.value)} className={fieldClass} /></label>
        <label className="text-sm">PDGA number (optional)<input inputMode="numeric" value={pdga} onChange={e => setPdga(e.target.value)} className={fieldClass} /></label>
        <button className={buttonClass}>Save profile once</button>
      </form></details>
    </>}
    {staff && <div className="space-y-3"><label className="block text-sm">Existing member (IDs distinguish identical names)<select value={selection} onChange={e => selectMember(e.target.value)} className={fieldClass}><option value="">Select member or add a guest</option>{state.members.map(m => <option key={m.id} value={m.id}>{m.name} • {m.id} {m.guest ? '(guest)' : ''}</option>)}</select></label>
      <form className="grid gap-3 sm:grid-cols-3" onSubmit={e => { e.preventDefault(); act(() => { if (!name.trim()) throw new Error('Enter guest name'); if (pdga && !/^\d+$/.test(pdga)) throw new Error('PDGA number must contain digits'); if (username.trim() && loadMembers().mappings.some(m => m.username === username.trim())) throw new Error('Username already mapped; select that member or request review'); const id = crypto.randomUUID(); saveMembers({ ...loadMembers(), members: [...loadMembers().members, { id, name: name.trim(), pdga: pdga || undefined, guest: true, profileComplete: false }], mappings: [...loadMembers().mappings, ...(username.trim() ? [{ username: username.trim(), memberId: id, reviewedAt: 'staff-assisted demo entry' }] : [])] }); selectMember(id); setName(''); setUsername(''); setPdga(''); setNotice('Guest created. No app or account required; check them in below.'); }); }}>
      <label className="text-sm">Guest name<input required value={name} onChange={e => setName(e.target.value)} className={fieldClass} /></label><label className="text-sm">UDisc username (optional)<input value={username} onChange={e => setUsername(e.target.value)} className={fieldClass} /></label><label className="text-sm">PDGA (optional)<input value={pdga} onChange={e => setPdga(e.target.value)} className={fieldClass} /></label><button className={buttonClass}>Create guest record</button></form></div>}
    {(staff || member?.profileComplete) && <form className="grid gap-3 sm:grid-cols-3" onSubmit={e => { e.preventDefault(); act(() => submit(staff ? selection : member!.id)); }}>
      <label className="text-sm">Division<select aria-label="Division" value={division} onChange={e => setDivision(e.target.value)} className={fieldClass}>{DEMO_DIVISIONS.map(d => <option key={d}>{d}</option>)}</select></label>
      <label className="text-sm">Spotsy tag (optional)<input inputMode="numeric" value={tag} onChange={e => setTag(e.target.value)} className={fieldClass} /></label><label className="text-sm">Stafford tag (optional)<input inputMode="numeric" value={stafford} onChange={e => setStafford(e.target.value)} className={fieldClass} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ace} onChange={e => setAce(e.target.checked)} />Request ace-pot entry</label><button disabled={state.locked} className={buttonClass + ' disabled:opacity-40'}>{state.locked ? 'Check-in closed' : 'Check in for sample league'}</button>
    </form>}
    {!staff && userProfile?.role === 'user' && <div className="space-y-2 border-t pt-4"><p className="text-sm font-bold">Played as a guest? Request account claim</p><p className="text-xs text-slate-500">Names never merge records. Organizer checks the ID and supporting information before linking.</p><select value={selection} onChange={e => setSelection(e.target.value)} className={fieldClass}><option value="">Select guest record</option>{state.members.filter(m => m.guest).map(m => <option key={m.id} value={m.id}>{m.name} • {m.id}</option>)}</select><button className={buttonClass} onClick={() => act(() => { if (!selection) throw new Error('Select a guest'); const s = loadMembers(); if (s.claims.some(c => c.authId === userProfile.uid && c.status === 'pending')) throw new Error('You already have a pending review'); saveMembers({ ...s, claims: [...s.claims, { id: crypto.randomUUID(), authId: userProfile.uid, memberId: selection, status: 'pending' }] }); setNotice('Claim queued for organizer review. No records have been merged.'); })}>Request review</button></div>}
    {staff && <div className="space-y-2"><h3 className="font-bold">Pending account claims</h3>{state.claims.filter(c => c.status === 'pending').map(c => <div key={c.id} className="rounded-lg bg-amber-50 p-3 text-sm"><p>{state.members.find(m => m.id === c.memberId)?.name} • {c.memberId} ← {c.authId}</p><p className="text-xs">Confirm identity outside this demo; approving links the stable record, it does not merge by name.</p><button className="p-2 font-bold underline" onClick={() => act(() => { saveMembers(approveClaim(loadMembers(), c.id)); setNotice('Guest linked after organizer review.'); })}>Approve reviewed claim</button><button className="p-2 underline" onClick={() => { const s = loadMembers(); saveMembers({ ...s, claims: s.claims.map(v => v.id === c.id ? { ...v, status: 'rejected' } : v) }); }}>Reject</button></div>)}{!state.claims.some(c => c.status === 'pending') && <p className="text-sm text-slate-500">No pending claims.</p>}</div>}
    {notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
  </section>;
}
