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

export async function ajouterNoteEnAttente(
  note: Omit<PendingNote, "id" | "createdAt">
): Promise<void> {
  const db = await openDB();
  const id = `${note.classeId}_${note.devoirId}_${note.eleveId}`;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({
      ...note,
      id,
      createdAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listerNotesEnAttente(): Promise<PendingNote[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function supprimerNoteEnAttente(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Synchronise la file.
 * `envoyer` doit :
 * - résoudre normalement si la note a été envoyée
 * - résoudre avec `false` pour ignorer (sans supprimer)
 * - throw en cas d'erreur réseau
 */
export async function synchroniserFile(
  envoyer: (note: PendingNote) => Promise<boolean | void>
): Promise<number> {
  const pending = await listerNotesEnAttente();
  let synced = 0;

  for (const note of pending) {
    try {
      const resultat = await envoyer(note);
      // false = ignorer cette note (ne pas supprimer)
      if (resultat === false) continue;

      await supprimerNoteEnAttente(note.id);
      synced++;
    } catch {
      // Erreur réseau : on arrête, on réessaiera plus tard
      break;
    }
  }

  return synced;
}