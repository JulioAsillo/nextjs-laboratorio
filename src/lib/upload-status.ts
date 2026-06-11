const LS_KEY = 'itsecops-upload-status-v1';
type Store = Record<string, Record<string, boolean>>;

function read(): Store {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); }
  catch { return {}; }
}
function write(s: Store) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

export function markUploaded(fuenteId: string, fileName: string) {
  const s = read();
  s[fuenteId] = { ...(s[fuenteId] ?? {}), [fileName]: true };
  write(s);
}
export function isSlotUploaded(fuenteId: string, fileName: string): boolean {
  return read()[fuenteId]?.[fileName] === true;
}
export function clearFuente(fuenteId: string) {
  const s = read();
  delete s[fuenteId];
  write(s);
}
export function clearAllUploads() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_KEY);
}