// Local adapter for existing document operations. Never contacts Firebase.
type Ref = { path: string; sort?: string };
type Data = Record<string, any>;
const KEY = 'spotsy-demo-documents-v1';
export const DEMO_DATABASE_EVENT = 'spotsy-demo-documents-updated';
const read = (): Record<string, Data> => {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
};
const write = (data: Record<string, Data>) => {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(DEMO_DATABASE_EVENT));
};
export const collection = (_db: unknown, ...parts: string[]): Ref => ({ path: parts.join('/') });
export const doc = collection;
export const orderBy = (field: string, _direction?: string) => field;
export const query = (ref: Ref, sort: string): Ref => ({ ...ref, sort });
export const arrayUnion = (...values: unknown[]) => ({ operation: 'union', values });
export const arrayRemove = (...values: unknown[]) => ({ operation: 'remove', values });
function snapshot(ref: Ref) {
  const data = read();
  const entries = Object.entries(data).filter(([path]) => path.startsWith(ref.path + '/') && path.split('/').length === ref.path.split('/').length + 1);
  if (ref.sort) entries.sort((a, b) => String(a[1][ref.sort!]).localeCompare(String(b[1][ref.sort!])));
  const docs = entries.map(([path, value]) => ({ id: path.split('/').pop()!, data: () => structuredClone(value) }));
  return { docs, empty: !docs.length, forEach: (fn: (value: typeof docs[number]) => void) => docs.forEach(fn) };
}
export const getDocs = async (ref: Ref) => snapshot(ref);
export const onSnapshot = (ref: Ref, callback: (value: ReturnType<typeof snapshot>) => void, _error?: (error: unknown) => void) => {
  const refresh = () => callback(snapshot(ref));
  refresh();
  window.addEventListener(DEMO_DATABASE_EVENT, refresh);
  window.addEventListener('storage', refresh);
  return () => { window.removeEventListener(DEMO_DATABASE_EVENT, refresh); window.removeEventListener('storage', refresh); };
};
export async function setDoc(ref: Ref, value: Data, options?: { merge: boolean }) {
  const data = read(); data[ref.path] = options?.merge ? { ...data[ref.path], ...value } : value; write(data);
}
export async function addDoc(ref: Ref, value: Data) {
  const id = crypto.randomUUID(); await setDoc({ path: ref.path + '/' + id }, value); return { id };
}
export async function deleteDoc(ref: Ref) { const data = read(); delete data[ref.path]; write(data); }
export async function updateDoc(ref: Ref, patch: Data) {
  const data = read();
  if (!data[ref.path]) throw new Error('Demo record no longer exists');
  for (const [key, value] of Object.entries(patch)) {
    const parts = key.split('.'); let target = data[ref.path];
    for (const part of parts.slice(0, -1)) target = target[part] ||= {};
    const field = parts.at(-1)!;
    target[field] = value?.operation === 'union' ? [...new Set([...(target[field] || []), ...value.values])]
      : value?.operation === 'remove' ? (target[field] || []).filter((item: unknown) => !value.values.includes(item)) : value;
  }
  write(data);
}
export function initializeDemoCollection(name: string, records: Array<{ id: string }>) {
  const data = read();
  if (data['__initialized/' + name]) return;
  records.forEach(({ id, ...record }) => { data[name + '/' + id] = record; });
  data['__initialized/' + name] = { ready: true }; write(data);
}
