// frontend/src/lib/offlineQueue.ts

const DB_NAME = "moyennepro-offline";
const STORE_NAME = "pending-notes";
const DB_VERSION = 1;

export interface PendingNote {
  id: string;
  classeId: string;
  devoirId: string;
  eleveId: string;
  valeur: number;
  absent: boolean;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function makeNoteId(
  classeId: string,
  devoirId: string,
  eleveId: string
): string {
  return `${classeId}_${devoirId}_${eleveId}`;
}

export async function ajouterNoteEnAttente(
  note: Omit<PendingNote, "id" | "createdAt">
): Promise<void> {
  const db = await openDB();
  const id = makeNoteId(note.classeId, note.devoirId, note.eleveId);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ ...note, id, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listerNotesEnAttente(): Promise<PendingNote[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function listerNotesPourDevoir(
  classeId: string,
  devoirId: string
): Promise<PendingNote[]> {
  const all = await listerNotesEnAttente();
  return all.filter(
    (n) => n.classeId === classeId && n.devoirId === devoirId
  );
}

export async function supprimerNoteEnAttente(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Synchronise les notes d'un devoir.
 * - succès API → supprime de la file
 * - 4xx validation → supprime + signale erreur (ne bloque pas la suite)
 * - réseau → stop, on réessaiera
 */
export async function synchroniserNotesDevoir(
  classeId: string,
  devoirId: string,
  envoyer: (note: PendingNote) => Promise<void>
): Promise<{ synced: string[]; errors: string[] }> {
  const pending = await listerNotesPourDevoir(classeId, devoirId);
  const synced: string[] = [];
  const errors: string[] = [];

  for (const note of pending) {
    try {
      await envoyer(note);
      await supprimerNoteEnAttente(note.id);
      synced.push(note.eleveId);
    } catch (err: any) {
      const status = err?.response?.status;
      // Erreur métier : on retire de la file pour ne pas boucler
      if (status && status >= 400 && status < 500) {
        await supprimerNoteEnAttente(note.id);
        errors.push(note.eleveId);
        continue;
      }
      // Réseau / 5xx : on arrête
      break;
    }
  }

  return { synced, errors };
}