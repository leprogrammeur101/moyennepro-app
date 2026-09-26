import { AppDataSource } from "../../data-source";
import { Note } from "../../entities/Note";
import { Eleve } from "../../entities/Eleve";
import { BAREME_MAX } from "../../entities/Devoir";
import { obtenirDevoir } from "./devoirs.service";

export interface SaisieNote {
  eleveId: string;
  valeur: number;
  absent?: boolean;
}

export interface LigneSaisie {
  eleveId: string;
  nom: string;
  prenom: string;
  valeur: number | null;
  absent: boolean;
}

export interface GrilleSaisie {
  devoir: { id: string; nom: string; type: string; baremeMax: number };
  lignes: LigneSaisie[];
}

/**
 * Retourne la grille de saisie : tous les élèves de la classe, avec leur
 * note existante pour ce devoir si elle a déjà été saisie.
 */
export async function obtenirGrilleSaisie(
  enseignantId: string,
  classeId: string,
  devoirId: string
): Promise<GrilleSaisie> {
  const devoir = await obtenirDevoir(enseignantId, classeId, devoirId);
  const eleveRepo = AppDataSource.getRepository(Eleve);
  const noteRepo = AppDataSource.getRepository(Note);

  const eleves = await eleveRepo.find({
    where: { classe: { id: classeId } },
    order: { nom: "ASC" },
  });
  const notesExistantes = await noteRepo.find({
    where: { devoir: { id: devoirId } },
    relations: { eleve: true },
  });
  const noteParEleve = new Map(notesExistantes.map((n) => [n.eleve.id, n]));

  const lignes: LigneSaisie[] = eleves.map((eleve) => {
    const note = noteParEleve.get(eleve.id);
    return {
      eleveId: eleve.id,
      nom: eleve.nom,
      prenom: eleve.prenom,
      valeur: note ? Number(note.valeur) : null,
      absent: note?.absent ?? false,
    };
  });

  return {
    devoir: { id: devoir.id, nom: devoir.nom, type: devoir.type, baremeMax: BAREME_MAX[devoir.type] },
    lignes,
  };
}

/**
 * Enregistre (crée ou met à jour) les notes de tous les élèves pour un
 * devoir donné, en une seule opération. Valide que chaque note reste
 * dans le barème du devoir (/10 pour une interrogation, /20 pour un devoir).
 */
export async function enregistrerNotes(
  enseignantId: string,
  classeId: string,
  devoirId: string,
  saisies: SaisieNote[]
): Promise<void> {
  const devoir = await obtenirDevoir(enseignantId, classeId, devoirId);
  const baremeMax = BAREME_MAX[devoir.type];
  const noteRepo = AppDataSource.getRepository(Note);

  // Notes déjà en base pour ce devoir
  const existantes = await noteRepo.find({
    where: { devoir: { id: devoirId } },
    relations: { eleve: true },
  });
  const parEleve = new Map(existantes.map((n) => [n.eleve.id, n]));

  const aSauvegarder: Note[] = [];

  for (const saisie of saisies) {
    const absent = saisie.absent ?? false;
    const valeur = absent ? 0 : Number(saisie.valeur);

    if (!absent && (Number.isNaN(valeur) || valeur < 0 || valeur > baremeMax)) {
      throw new Error(
        `Note invalide (${saisie.valeur}) pour un devoir noté sur ${baremeMax}.`
      );
    }

    let note = parEleve.get(saisie.eleveId);
    if (!note) {
      note = noteRepo.create({
        devoir: { id: devoirId } as any,
        eleve: { id: saisie.eleveId } as any,
      });
    }
    note.valeur = valeur;
    note.absent = absent;
    aSauvegarder.push(note);
  }

  // Un seul aller-retour DB
  if (aSauvegarder.length > 0) {
    await noteRepo.save(aSauvegarder);
  }
}